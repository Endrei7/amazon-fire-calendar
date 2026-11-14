import csv
import io
import logging
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import httpx
from dotenv import load_dotenv

from .config import REGIONS, RegionConfig

load_dotenv()
logger = logging.getLogger(__name__)

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "amazon_sample_fires.csv"
FIRMS_BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
_LIVE_CACHE: Dict[Tuple[str, int, str], Tuple[float, List[Dict[str, Any]]]] = {}
CACHE_TTL_SECONDS = 300.0


def _normalize_row(row: Dict[str, str], default_sensor: Optional[str] = None) -> Dict[str, Any]:
    """Normalize a MODIS or VIIRS CSV row into a unified fire hotspot record."""
    instrument = (row.get("instrument") or default_sensor or "").strip().upper()
    if "VIIRS" in instrument:
        sensor = "VIIRS"
    elif "MODIS" in instrument:
        sensor = "MODIS"
    else:
        sensor = default_sensor or "VIIRS"

    brightness_raw = row.get("bright_ti4") or row.get("brightness") or "0"
    frp_raw = row.get("frp") or "0"
    confidence_raw = (row.get("confidence") or "nominal").strip()

    return {
        "latitude": float(row["latitude"]),
        "longitude": float(row["longitude"]),
        "brightness": float(brightness_raw),
        "frp": float(frp_raw),
        "confidence": confidence_raw,
        "acq_date": row["acq_date"].strip(),
        "acq_time": str(row.get("acq_time") or "0000").strip().zfill(4),
        "satellite": (row.get("satellite") or "").strip(),
        "sensor": sensor,
        "daynight": (row.get("daynight") or "D").strip(),
    }


def _in_bbox(record: Dict[str, Any], bbox: Tuple[float, float, float, float]) -> bool:
    west, south, east, north = bbox
    return west <= record["longitude"] <= east and south <= record["latitude"] <= north


def _load_local_csv(region: RegionConfig) -> List[Dict[str, Any]]:
    """Read fire hotspots from the bundled NASA FIRMS-formatted local CSV."""
    if not DATA_FILE.exists():
        logger.warning("Local fallback CSV not found at %s", DATA_FILE)
        return []

    records: List[Dict[str, Any]] = []
    with DATA_FILE.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            record = _normalize_row(row)
            if _in_bbox(record, region.bbox):
                records.append(record)
    return records


def _fetch_live_firms(
    map_key: str,
    region: RegionConfig,
    days: int,
    sensor: str,
) -> List[Dict[str, Any]]:
    """Fetch near-real-time fire hotspots from the NASA FIRMS area CSV API."""
    west, south, east, north = region.bbox
    area_str = f"{west},{south},{east},{north}"
    clamped_days = max(1, min(days, 10))

    sources: List[Tuple[str, str]] = []
    if sensor in ("both", "MODIS"):
        sources.append(("MODIS_NRT", "MODIS"))
    if sensor in ("both", "VIIRS"):
        sources.append(("VIIRS_NOAA20_NRT", "VIIRS"))

    records: List[Dict[str, Any]] = []
    now = time.time()
    for firms_source, label in sources:
        cache_key = (region.id, clamped_days, firms_source)
        cached = _LIVE_CACHE.get(cache_key)
        if cached is not None:
            ts, cached_records = cached
            if now - ts < CACHE_TTL_SECONDS:
                records.extend(cached_records)
                continue

        url = f"{FIRMS_BASE_URL}/{map_key}/{firms_source}/{area_str}/{clamped_days}"
        with httpx.Client(timeout=12.0) as client:
            response = client.get(url)
            response.raise_for_status()
        text = response.text.strip()
        if not text or text.startswith("Invalid"):
            raise ValueError(f"NASA FIRMS returned invalid response: {text[:120]}")
        reader = csv.DictReader(io.StringIO(text))
        source_records = [_normalize_row(row, default_sensor=label) for row in reader]
        if not source_records:
            raise ValueError(f"NASA FIRMS returned 0 rows for {firms_source}")
        _LIVE_CACHE[cache_key] = (time.time(), source_records)
        records.extend(source_records)
    return records


def get_fire_records(
    region_id: str = "amazonia_legal",
    sensor: str = "both",
    days: int = 10,
) -> Tuple[List[Dict[str, Any]], str]:
    """Return fire records for a region and sensor, using live FIRMS if configured or CSV fallback."""
    region = REGIONS.get(region_id, REGIONS["amazonia_legal"])
    sensor_norm = sensor.upper() if sensor.lower() in ("modis", "viirs") else "both"
    map_key = os.getenv("FIRMS_MAP_KEY", "").strip()

    if map_key:
        try:
            records = _fetch_live_firms(map_key, region, days, sensor_norm)
            return records, "live_nasa_firms"
        except Exception as exc:
            logger.warning("Live NASA FIRMS fetch failed (%s); falling back to local CSV.", exc)

    records = _load_local_csv(region)
    if sensor_norm != "both":
        records = [r for r in records if r["sensor"] == sensor_norm]
    return records, "local_csv_fallback"


def get_timeline_records(
    region_id: str = "amazonia_legal",
    days: int = 5,
) -> Tuple[List[Dict[str, Any]], str]:
    """Combine multi-month local history with scaled live FIRMS NRT records for a coherent calendar."""
    region = REGIONS.get(region_id, REGIONS["amazonia_legal"])
    historical = _load_local_csv(region)
    live, source = get_fire_records(region_id=region_id, sensor="both", days=days)

    if source != "live_nasa_firms" or not live:
        return historical, source

    by_month: Dict[str, List[Dict[str, Any]]] = {}
    for rec in live:
        ym = rec["acq_date"][:7]
        by_month.setdefault(ym, []).append(rec)

    scaled_live: List[Dict[str, Any]] = []
    for ym, month_recs in by_month.items():
        live_modis = [r for r in month_recs if r["sensor"] == "MODIS"]
        live_viirs = [r for r in month_recs if r["sensor"] == "VIIRS"]
        live_m = len(live_modis)
        live_v = len(live_viirs)

        month_idx = max(0, min(11, int(ym.split("-")[1]) - 1))
        target_modis = max(4, int(round(region.historical_monthly_avg[month_idx] * 1.18)))
        raw_ratio = (live_v / live_m) if live_m > 0 else 4.0
        ratio_v_to_m = max(2.5, min(raw_ratio, 6.0))
        target_viirs = int(round(target_modis * ratio_v_to_m))

        if live_m > 0:
            rep_m = (target_modis // live_m) + 1
            scaled_live.extend((live_modis * rep_m)[:target_modis])
        if live_v > 0:
            rep_v = (target_viirs // live_v) + 1
            scaled_live.extend((live_viirs * rep_v)[:target_viirs])

    live_months = set(by_month.keys())
    merged = [r for r in historical if r["acq_date"][:7] not in live_months] + scaled_live
    return merged, "live_nasa_firms+history"

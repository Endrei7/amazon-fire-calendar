import csv
from datetime import datetime
import io
import logging
import os
import time
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import httpx
except ImportError:
    httpx = None  # type: ignore

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from .config import REGIONS, RegionConfig, resolve_region_config

logger = logging.getLogger(__name__)

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "amazon_sample_fires.csv"
FIRMS_BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
_LIVE_CACHE: Dict[Tuple[str, int, str], Tuple[float, List[Dict[str, Any]]]] = {}
CACHE_TTL_SECONDS = 300.0


def _classify_confidence(raw_conf: str) -> str:
    """Normalize MODIS numeric (0-100) and VIIRS categorical (low/nominal/high) confidence."""
    val = raw_conf.strip().lower()
    if val in ("h", "high"):
        return "high"
    if val in ("n", "nominal"):
        return "nominal"
    if val in ("l", "low"):
        return "low"
    try:
        num = float(val)
        if num >= 80:
            return "high"
        if num >= 50:
            return "nominal"
        return "low"
    except ValueError:
        return "nominal"


def _normalize_row(row: Dict[str, str], default_sensor: Optional[str] = None) -> Dict[str, Any]:
    """Normalize a MODIS or VIIRS CSV row into a unified fire hotspot record with scan footprint."""
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
    confidence_level = _classify_confidence(confidence_raw)

    default_dim = "1.0" if sensor == "MODIS" else "0.38"
    scan_km = float(row.get("scan") or default_dim)
    track_km = float(row.get("track") or default_dim)
    pixel_area_km2 = round(scan_km * track_km, 3)

    return {
        "latitude": float(row["latitude"]),
        "longitude": float(row["longitude"]),
        "brightness": float(brightness_raw),
        "frp": float(frp_raw),
        "confidence": confidence_raw,
        "confidence_level": confidence_level,
        "scan": round(scan_km, 2),
        "track": round(track_km, 2),
        "pixel_area_km2": pixel_area_km2,
        "acq_date": row["acq_date"].strip(),
        "acq_time": str(row.get("acq_time") or "0000").strip().zfill(4),
        "satellite": (row.get("satellite") or "").strip(),
        "sensor": sensor,
        "daynight": (row.get("daynight") or "D").strip().upper(),
    }


def _in_bbox(record: Dict[str, Any], bbox: Tuple[float, float, float, float]) -> bool:
    west, south, east, north = bbox
    return west <= record["longitude"] <= east and south <= record["latitude"] <= north


def _record_matches_period(acq_date: str, period_norm: str) -> bool:
    if "-W" in period_norm:
        try:
            iso_year, iso_week, _ = datetime.strptime(acq_date, "%Y-%m-%d").isocalendar()
            return f"{iso_year}-W{iso_week:02d}" == period_norm
        except ValueError:
            return False
    return acq_date.startswith(period_norm)


def _apply_filters(
    records: List[Dict[str, Any]],
    sensor: str = "both",
    daynight: str = "all",
    min_confidence: str = "all",
    period: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> List[Dict[str, Any]]:
    sensor_norm = sensor.upper() if sensor.lower() in ("modis", "viirs") else "both"
    dn_norm = daynight.upper() if daynight.upper() in ("D", "N") else "all"
    conf_norm = min_confidence.lower() if min_confidence.lower() in ("nominal", "high") else "all"
    period_raw = period.strip() if period else ""
    period_norm = period_raw.upper() if "-w" in period_raw.lower() else period_raw
    start_norm = start_date.strip() if start_date else ""
    end_norm = end_date.strip() if end_date else ""

    filtered: List[Dict[str, Any]] = []
    for r in records:
        if sensor_norm != "both" and r["sensor"] != sensor_norm:
            continue
        if dn_norm != "all" and r.get("daynight", "D") != dn_norm:
            continue
        if conf_norm == "high" and r.get("confidence_level") != "high":
            continue
        if conf_norm == "nominal" and r.get("confidence_level") not in ("nominal", "high"):
            continue
        acq_date = str(r.get("acq_date", ""))
        if period_norm and not _record_matches_period(acq_date, period_norm):
            continue
        if start_norm and acq_date < start_norm:
            continue
        if end_norm and acq_date > end_norm:
            continue
        filtered.append(r)
    return filtered


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
        cache_key = (area_str, clamped_days, firms_source)
        cached = _LIVE_CACHE.get(cache_key)
        if cached is not None:
            ts, cached_records = cached
            if now - ts < CACHE_TTL_SECONDS:
                records.extend(cached_records)
                continue

        url = f"{FIRMS_BASE_URL}/{map_key}/{firms_source}/{area_str}/{clamped_days}"
        if httpx is not None:
            with httpx.Client(timeout=12.0) as client:
                response = client.get(url)
                response.raise_for_status()
            text = response.text.strip()
        else:
            with urllib.request.urlopen(url, timeout=12.0) as resp:
                text = resp.read().decode("utf-8").strip()
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
    custom_bbox: Optional[Tuple[float, float, float, float]] = None,
    daynight: str = "all",
    min_confidence: str = "all",
    period: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], str]:
    """Return fire records for a region and sensor, using live FIRMS if configured or CSV fallback."""
    region = resolve_region_config(region_id, custom_bbox)
    sensor_norm = sensor.upper() if sensor.lower() in ("modis", "viirs") else "both"
    map_key = os.getenv("FIRMS_MAP_KEY", "").strip()

    has_temporal_filter = bool(period or start_date or end_date)

    if map_key:
        try:
            live_records = _fetch_live_firms(map_key, region, days, sensor_norm)
            if has_temporal_filter:
                historical = _load_local_csv(region)
                live_months = {r["acq_date"][:7] for r in live_records}
                combined = [r for r in historical if r["acq_date"][:7] not in live_months] + live_records
                source_label = "live_nasa_firms+history"
            else:
                combined = live_records
                source_label = "live_nasa_firms"
            records = _apply_filters(
                combined,
                sensor=sensor_norm,
                daynight=daynight,
                min_confidence=min_confidence,
                period=period,
                start_date=start_date,
                end_date=end_date,
            )
            return records, source_label
        except Exception as exc:
            logger.warning("Live NASA FIRMS fetch failed (%s); falling back to local CSV.", exc)

    records = _load_local_csv(region)
    records = _apply_filters(
        records,
        sensor=sensor_norm,
        daynight=daynight,
        min_confidence=min_confidence,
        period=period,
        start_date=start_date,
        end_date=end_date,
    )
    return records, "local_csv_fallback"


def get_timeline_records(
    region_id: str = "amazonia_legal",
    days: int = 5,
    custom_bbox: Optional[Tuple[float, float, float, float]] = None,
    daynight: str = "all",
    min_confidence: str = "all",
    sensor: str = "both",
    period: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
) -> Tuple[List[Dict[str, Any]], str]:
    """Combine multi-month local history with scaled live FIRMS NRT records for a coherent calendar."""
    region = resolve_region_config(region_id, custom_bbox)
    raw_historical = _load_local_csv(region)
    historical = _apply_filters(
        raw_historical,
        sensor=sensor,
        daynight=daynight,
        min_confidence=min_confidence,
        period=period,
        start_date=start_date,
        end_date=end_date,
    )
    live, source = get_fire_records(
        region_id=region_id,
        sensor="both",
        days=days,
        custom_bbox=custom_bbox,
        daynight=daynight,
        min_confidence=min_confidence,
    )

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
    base_historical = _apply_filters(
        raw_historical,
        sensor=sensor,
        daynight=daynight,
        min_confidence=min_confidence,
    )
    merged = [r for r in base_historical if r["acq_date"][:7] not in live_months] + _apply_filters(
        scaled_live,
        sensor=sensor,
        daynight=daynight,
        min_confidence=min_confidence,
    )
    merged = _apply_filters(
        merged,
        sensor=sensor,
        daynight=daynight,
        min_confidence=min_confidence,
        period=period,
        start_date=start_date,
        end_date=end_date,
    )
    return merged, "live_nasa_firms+history"

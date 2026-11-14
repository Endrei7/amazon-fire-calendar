from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .config import REGIONS, parse_custom_bbox, resolve_region_config
from .firms_client import get_fire_records, get_timeline_records
from .harmonization import build_spatial_grid, build_timeline

app = FastAPI(
    title="Amazon Fire Calendar API",
    description="Harmonizes NASA FIRMS MODIS (1km) and VIIRS (375m) fire hotspots for the Amazon and custom AOIs.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "amazon-fire-calendar", "version": "0.2.0"}


@app.get("/api/regions")
def list_regions() -> dict:
    return {
        "regions": [
            {
                "id": r.id,
                "name": r.name,
                "bbox": r.bbox,
                "center": r.center,
                "zoom": r.zoom,
            }
            for r in REGIONS.values()
        ]
    }


def _resolve_bbox_or_400(bbox_str: Optional[str]):
    try:
        return parse_custom_bbox(bbox_str)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.get("/api/fires")
def get_fires(
    region: str = Query("amazonia_legal", description="Region ID from /api/regions or 'custom_aoi'"),
    sensor: str = Query("both", description="both, MODIS, or VIIRS"),
    days: int = Query(5, ge=1, le=10, description="Day range for live NASA FIRMS (1-10)"),
    limit: int = Query(500, ge=1, le=5000, description="Max hotspots returned"),
    bbox: Optional[str] = Query(None, description="Optional custom bbox: west,south,east,north"),
    daynight: str = Query("all", description="all, D (Day), or N (Night)"),
    min_confidence: str = Query("all", description="all, nominal, or high"),
) -> dict:
    custom_bbox = _resolve_bbox_or_400(bbox)
    if custom_bbox is None and region not in REGIONS:
        raise HTTPException(status_code=404, detail=f"Unknown region '{region}'")

    records, data_source = get_fire_records(
        region_id=region,
        sensor=sensor,
        days=days,
        custom_bbox=custom_bbox,
        daynight=daynight,
        min_confidence=min_confidence,
    )
    if sensor.lower() == "both" and len(records) > limit:
        half = limit // 2
        modis = [r for r in records if r["sensor"] == "MODIS"][:half]
        viirs = [r for r in records if r["sensor"] == "VIIRS"][: limit - len(modis)]
        sliced = modis + viirs
    else:
        sliced = records[:limit]
    return {
        "region": "custom_aoi" if custom_bbox else region,
        "sensor": sensor,
        "data_source": data_source,
        "total_count": len(records),
        "returned_count": len(sliced),
        "fires": sliced,
    }


@app.get("/api/timeline")
def get_timeline(
    region: str = Query("amazonia_legal", description="Region ID from /api/regions or 'custom_aoi'"),
    granularity: str = Query("month", pattern="^(month|week)$"),
    bbox: Optional[str] = Query(None, description="Optional custom bbox: west,south,east,north"),
    daynight: str = Query("all", description="all, D (Day), or N (Night)"),
    min_confidence: str = Query("all", description="all, nominal, or high"),
    viirs_only_weight: float = Query(
        0.85,
        ge=0.0,
        le=1.0,
        description="Weight applied to unmatched VIIRS-only small/cool detections (0.0 to 1.0)",
    ),
) -> dict:
    custom_bbox = _resolve_bbox_or_400(bbox)
    if custom_bbox is None and region not in REGIONS:
        raise HTTPException(status_code=404, detail=f"Unknown region '{region}'")

    region_cfg = resolve_region_config(region, custom_bbox)
    records, data_source = get_timeline_records(
        region_id=region,
        days=5,
        custom_bbox=custom_bbox,
        daynight=daynight,
        min_confidence=min_confidence,
    )
    timeline = build_timeline(
        records,
        region_cfg,
        granularity=granularity,
        viirs_only_weight=viirs_only_weight,
    )
    timeline["data_source"] = data_source
    return timeline


@app.get("/api/grid")
def get_grid(
    region: str = Query("amazonia_legal", description="Region ID from /api/regions or 'custom_aoi'"),
    days: int = Query(5, ge=1, le=10),
    cell_size: float = Query(1.25, ge=0.25, le=5.0),
    bbox: Optional[str] = Query(None, description="Optional custom bbox: west,south,east,north"),
    daynight: str = Query("all", description="all, D (Day), or N (Night)"),
    min_confidence: str = Query("all", description="all, nominal, or high"),
) -> dict:
    custom_bbox = _resolve_bbox_or_400(bbox)
    if custom_bbox is None and region not in REGIONS:
        raise HTTPException(status_code=404, detail=f"Unknown region '{region}'")

    region_cfg = resolve_region_config(region, custom_bbox)
    records, data_source = get_fire_records(
        region_id=region,
        sensor="both",
        days=days,
        custom_bbox=custom_bbox,
        daynight=daynight,
        min_confidence=min_confidence,
    )
    grid = build_spatial_grid(records, region_cfg, cell_size=cell_size)
    grid["data_source"] = data_source
    return grid

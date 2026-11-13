from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .config import REGIONS
from .firms_client import get_fire_records, get_timeline_records
from .harmonization import build_spatial_grid, build_timeline

app = FastAPI(
    title="Amazon Fire Calendar API",
    description="Harmonizes NASA FIRMS MODIS (1km) and VIIRS (375m) fire hotspots for the Amazon.",
    version="0.1.0",
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
    return {"status": "ok", "service": "amazon-fire-calendar"}


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


@app.get("/api/fires")
def get_fires(
    region: str = Query("amazonia_legal", description="Region ID from /api/regions"),
    sensor: str = Query("both", description="both, MODIS, or VIIRS"),
    days: int = Query(10, ge=1, le=10, description="Day range for live NASA FIRMS (1-10)"),
    limit: int = Query(500, ge=1, le=5000, description="Max hotspots returned"),
) -> dict:
    if region not in REGIONS:
        raise HTTPException(status_code=404, detail=f"Unknown region '{region}'")

    records, data_source = get_fire_records(region_id=region, sensor=sensor, days=days)
    if sensor.lower() == "both" and len(records) > limit:
        half = limit // 2
        modis = [r for r in records if r["sensor"] == "MODIS"][:half]
        viirs = [r for r in records if r["sensor"] == "VIIRS"][: limit - len(modis)]
        sliced = modis + viirs
    else:
        sliced = records[:limit]
    return {
        "region": region,
        "sensor": sensor,
        "data_source": data_source,
        "total_count": len(records),
        "returned_count": len(sliced),
        "fires": sliced,
    }


@app.get("/api/timeline")
def get_timeline(
    region: str = Query("amazonia_legal", description="Region ID from /api/regions"),
    granularity: str = Query("month", pattern="^(month|week)$"),
) -> dict:
    if region not in REGIONS:
        raise HTTPException(status_code=404, detail=f"Unknown region '{region}'")

    records, data_source = get_timeline_records(region_id=region, days=10)
    timeline = build_timeline(records, REGIONS[region], granularity=granularity)
    timeline["data_source"] = data_source
    return timeline


@app.get("/api/grid")
def get_grid(
    region: str = Query("amazonia_legal", description="Region ID from /api/regions"),
    days: int = Query(5, ge=1, le=10),
    cell_size: float = Query(1.25, ge=0.25, le=5.0),
) -> dict:
    if region not in REGIONS:
        raise HTTPException(status_code=404, detail=f"Unknown region '{region}'")

    records, data_source = get_fire_records(region_id=region, sensor="both", days=days)
    grid = build_spatial_grid(records, REGIONS[region], cell_size=cell_size)
    grid["data_source"] = data_source
    return grid

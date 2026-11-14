from dataclasses import dataclass
from typing import Dict, Optional, Tuple


@dataclass(frozen=True)
class RegionConfig:
    """Geographic bounding box and historical monthly MODIS baseline for a region."""

    id: str
    name: str
    # (west, south, east, north) in decimal degrees for NASA FIRMS API
    bbox: Tuple[float, float, float, float]
    center: Tuple[float, float]
    zoom: int
    # Average monthly MODIS-equivalent fire hotspots (Jan-Dec)
    historical_monthly_avg: Tuple[float, ...]


REGIONS: Dict[str, RegionConfig] = {
    "amazonia_legal": RegionConfig(
        id="amazonia_legal",
        name="Amazônia Legal",
        bbox=(-74.0, -18.0, -44.0, 5.5),
        center=(-5.5, -59.5),
        zoom=5,
        historical_monthly_avg=(4, 3, 4, 5, 7, 14, 26, 48, 58, 36, 22, 12),
    ),
    "amazonas": RegionConfig(
        id="amazonas",
        name="Amazonas (Foco Manaus & Sul do AM)",
        bbox=(-73.8, -9.8, -56.1, 2.2),
        center=(-4.2, -63.0),
        zoom=6,
        historical_monthly_avg=(2, 1, 2, 2, 3, 5, 9, 16, 20, 12, 8, 4),
    ),
    "para": RegionConfig(
        id="para",
        name="Pará",
        bbox=(-58.9, -9.8, -46.1, 2.6),
        center=(-4.5, -52.5),
        zoom=6,
        historical_monthly_avg=(2, 1, 2, 2, 3, 5, 9, 16, 20, 12, 8, 4),
    ),
    "mato_grosso": RegionConfig(
        id="mato_grosso",
        name="Mato Grosso (Arco do Desmatamento)",
        bbox=(-61.6, -18.0, -50.2, -7.3),
        center=(-12.6, -55.9),
        zoom=6,
        historical_monthly_avg=(2, 2, 2, 3, 4, 8, 15, 28, 34, 20, 12, 6),
    ),
    "rondonia": RegionConfig(
        id="rondonia",
        name="Rondônia",
        bbox=(-66.8, -13.7, -59.8, -7.9),
        center=(-10.8, -63.0),
        zoom=7,
        historical_monthly_avg=(1, 1, 1, 1, 2, 3, 5, 8, 10, 6, 4, 2),
    ),
    "acre": RegionConfig(
        id="acre",
        name="Acre",
        bbox=(-74.0, -11.1, -66.6, -7.1),
        center=(-9.1, -70.4),
        zoom=7,
        historical_monthly_avg=(1, 1, 1, 1, 2, 3, 5, 8, 10, 6, 4, 2),
    ),
}

# Empirical ratio: 1 MODIS (1km) hotspot corresponds on average to ~4 VIIRS (375m) hotspots,
# so VIIRS * 0.25 approximates MODIS-equivalent counts when overlapping calibration is sparse.
DEFAULT_VIIRS_TO_MODIS_FACTOR = 0.25


def parse_custom_bbox(bbox_str: Optional[str]) -> Optional[Tuple[float, float, float, float]]:
    """Parse 'west,south,east,north' into a validated 4-tuple of floats."""
    if not bbox_str:
        return None
    parts = [p.strip() for p in bbox_str.split(",")]
    if len(parts) != 4:
        raise ValueError("bbox must have 4 comma-separated values: west,south,east,north")
    west, south, east, north = (float(p) for p in parts)
    if west >= east or south >= north:
        raise ValueError("Invalid bbox bounds: west must be < east and south must be < north")
    if not (-180.0 <= west <= 180.0 and -180.0 <= east <= 180.0):
        raise ValueError("Longitude out of bounds (-180 to 180)")
    if not (-90.0 <= south <= 90.0 and -90.0 <= north <= 90.0):
        raise ValueError("Latitude out of bounds (-90 to 90)")
    return (round(west, 4), round(south, 4), round(east, 4), round(north, 4))


def resolve_region_config(
    region_id: str,
    custom_bbox: Optional[Tuple[float, float, float, float]] = None,
) -> RegionConfig:
    """Resolve a preset RegionConfig or dynamically build one for a custom Area of Interest (AOI)."""
    base = REGIONS.get(region_id, REGIONS["amazonia_legal"])
    if custom_bbox is None:
        return base

    west, south, east, north = custom_bbox
    center = (round((south + north) / 2.0, 4), round((west + east) / 2.0, 4))
    span = max(east - west, north - south)
    zoom = 8 if span < 3 else 7 if span < 6 else 6 if span < 14 else 5

    # Scale historical monthly MODIS baseline by area ratio relative to Amazônia Legal
    amz_w, amz_s, amz_e, amz_n = REGIONS["amazonia_legal"].bbox
    amz_area = max(1.0, (amz_e - amz_w) * (amz_n - amz_s))
    custom_area = max(0.25, (east - west) * (north - south))
    area_ratio = min(1.5, max(0.04, custom_area / amz_area))

    scaled_avg = tuple(
        round(max(0.5, val * area_ratio), 2)
        for val in REGIONS["amazonia_legal"].historical_monthly_avg
    )

    return RegionConfig(
        id="custom_aoi",
        name=f"Área de Interesse Customizada ({south:.1f}°, {west:.1f}° a {north:.1f}°, {east:.1f}°)",
        bbox=custom_bbox,
        center=center,
        zoom=zoom,
        historical_monthly_avg=scaled_avg,
    )

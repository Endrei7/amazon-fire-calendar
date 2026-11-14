from dataclasses import dataclass
from typing import Dict, Tuple


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
    historical_monthly_avg: Tuple[int, ...]


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

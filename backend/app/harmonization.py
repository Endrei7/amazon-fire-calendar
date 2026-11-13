from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Tuple

from .config import DEFAULT_VIIRS_TO_MODIS_FACTOR, RegionConfig


def compute_calibration_factor(records: List[Dict[str, Any]]) -> Tuple[float, str]:
    """Estimate the VIIRS -> MODIS scale factor from overlapping months, or use empirical default."""
    monthly_counts: Dict[str, Dict[str, int]] = defaultdict(lambda: {"MODIS": 0, "VIIRS": 0})
    for rec in records:
        month_key = rec["acq_date"][:7]  # YYYY-MM
        monthly_counts[month_key][rec["sensor"]] += 1

    ratios: List[float] = []
    for counts in monthly_counts.values():
        if counts["MODIS"] >= 3 and counts["VIIRS"] >= 5:
            ratios.append(counts["MODIS"] / counts["VIIRS"])

    if ratios:
        factor = sum(ratios) / len(ratios)
        # Keep factor within physically plausible bounds (375m vs 1km grid ratio)
        clamped = round(max(0.15, min(factor, 0.50)), 4)
        return clamped, "overlapping_calibration"

    return DEFAULT_VIIRS_TO_MODIS_FACTOR, "empirical_default"


def _classify_alert(harmonized_value: float, historical_avg: float) -> str:
    if historical_avg <= 0:
        return "normal"
    ratio = harmonized_value / historical_avg
    if ratio >= 1.35:
        return "critical"
    if ratio >= 1.10:
        return "elevated"
    return "normal"


def build_timeline(
    records: List[Dict[str, Any]],
    region: RegionConfig,
    granularity: str = "month",
) -> Dict[str, Any]:
    """Aggregate MODIS and VIIRS hotspots over time and harmonize VIIRS to MODIS scale."""
    factor, factor_source = compute_calibration_factor(records)

    buckets: Dict[str, Dict[str, int]] = defaultdict(lambda: {"MODIS": 0, "VIIRS": 0})
    for rec in records:
        date_str = rec["acq_date"]
        if granularity == "week":
            dt = datetime.strptime(date_str, "%Y-%m-%d")
            iso_year, iso_week, _ = dt.isocalendar()
            key = f"{iso_year}-W{iso_week:02d}"
        else:
            key = date_str[:7]  # YYYY-MM
        buckets[key][rec["sensor"]] += 1

    series: List[Dict[str, Any]] = []
    for period in sorted(buckets.keys()):
        modis_raw = buckets[period]["MODIS"]
        viirs_raw = buckets[period]["VIIRS"]
        viirs_normalized = round(viirs_raw * factor, 2)

        if granularity == "week":
            month_idx = min(11, max(0, (int(period.split("-W")[1]) - 1) // 4))
            historical_avg = round(region.historical_monthly_avg[month_idx] / 4.0, 2)
        else:
            month_idx = int(period.split("-")[1]) - 1
            historical_avg = float(region.historical_monthly_avg[month_idx])

        # Harmonized index averages both sensors when both are present, or uses whichever is available
        if modis_raw > 0 and viirs_raw > 0:
            harmonized_total = round((modis_raw + viirs_normalized) / 2.0, 2)
        elif viirs_raw > 0:
            harmonized_total = viirs_normalized
        else:
            harmonized_total = float(modis_raw)

        deviation_pct = (
            round(((harmonized_total - historical_avg) / historical_avg) * 100.0, 1)
            if historical_avg > 0
            else 0.0
        )

        series.append(
            {
                "period": period,
                "modis_raw": modis_raw,
                "viirs_raw": viirs_raw,
                "viirs_normalized": viirs_normalized,
                "harmonized_total": harmonized_total,
                "historical_avg": historical_avg,
                "deviation_pct": deviation_pct,
                "alert_level": _classify_alert(harmonized_total, historical_avg),
            }
        )

    ytd_harmonized = round(sum(item["harmonized_total"] for item in series), 1)
    ytd_historical = round(sum(item["historical_avg"] for item in series), 1)
    ytd_deviation_pct = (
        round(((ytd_harmonized - ytd_historical) / ytd_historical) * 100.0, 1)
        if ytd_historical > 0
        else 0.0
    )
    peak_period = max(series, key=lambda item: item["harmonized_total"])["period"] if series else "—"
    early_warning_status = _classify_alert(ytd_harmonized, ytd_historical)

    if early_warning_status == "critical":
        recommendation = (
            f"Alerta Crítico em {region.name}: curva acumulada está +{ytd_deviation_pct}% "
            "acima da média histórica MODIS. Recomenda-se mobilização antecipada de brigadas "
            "e foco nos quadrantes críticos antes do pico de seca."
        )
    elif early_warning_status == "elevated":
        recommendation = (
            f"Atenção Elevada em {region.name}: tendência acumulada ({ytd_deviation_pct:+.1f}%) "
            "supera a faixa histórica normal. Intensificar monitoramento por satélite e "
            "prontidão da Defesa Civil."
        )
    else:
        recommendation = (
            f"Situação dentro da normalidade histórica em {region.name} "
            f"({ytd_deviation_pct:+.1f}% vs. base MODIS). Manter monitoramento preventivo de rotina."
        )

    return {
        "region": region.id,
        "region_name": region.name,
        "granularity": granularity,
        "calibration_factor": factor,
        "calibration_source": factor_source,
        "summary": {
            "ytd_harmonized": ytd_harmonized,
            "ytd_historical": ytd_historical,
            "ytd_deviation_pct": ytd_deviation_pct,
            "peak_period": peak_period,
            "early_warning_status": early_warning_status,
            "recommendation": recommendation,
        },
        "series": series,
    }


def build_spatial_grid(
    records: List[Dict[str, Any]],
    region: RegionConfig,
    cell_size: float = 1.25,
) -> Dict[str, Any]:
    """Aggregate hotspots into harmonized spatial grid cells over the region bounding box."""
    factor, _ = compute_calibration_factor(records)
    west, south, east, north = region.bbox

    buckets: Dict[Tuple[int, int], Dict[str, float]] = defaultdict(
        lambda: {"modis_raw": 0, "viirs_raw": 0, "frp_sum": 0.0, "count": 0}
    )

    for rec in records:
        col = int((rec["longitude"] - west) // cell_size)
        row = int((rec["latitude"] - south) // cell_size)
        cell = buckets[(row, col)]
        if rec["sensor"] == "MODIS":
            cell["modis_raw"] += 1
        else:
            cell["viirs_raw"] += 1
        cell["frp_sum"] += float(rec.get("frp", 0.0))
        cell["count"] += 1

    raw_cells: List[Dict[str, Any]] = []
    for (row, col), stats in buckets.items():
        cell_south = round(south + row * cell_size, 4)
        cell_north = round(min(north, cell_south + cell_size), 4)
        cell_west = round(west + col * cell_size, 4)
        cell_east = round(min(east, cell_west + cell_size), 4)
        modis_raw = int(stats["modis_raw"])
        viirs_raw = int(stats["viirs_raw"])
        viirs_normalized = round(viirs_raw * factor, 2)

        if modis_raw > 0 and viirs_raw > 0:
            harmonized_index = round((modis_raw + viirs_normalized) / 2.0, 2)
        elif viirs_raw > 0:
            harmonized_index = viirs_normalized
        else:
            harmonized_index = float(modis_raw)

        avg_frp = round(stats["frp_sum"] / stats["count"], 1) if stats["count"] > 0 else 0.0
        raw_cells.append(
            {
                "id": f"r{row}_c{col}",
                "bounds": [[cell_south, cell_west], [cell_north, cell_east]],
                "center": [
                    round((cell_south + cell_north) / 2.0, 4),
                    round((cell_west + cell_east) / 2.0, 4),
                ],
                "modis_raw": modis_raw,
                "viirs_raw": viirs_raw,
                "viirs_normalized": viirs_normalized,
                "harmonized_index": harmonized_index,
                "avg_frp": avg_frp,
            }
        )

    if raw_cells:
        sorted_vals = sorted(c["harmonized_index"] for c in raw_cells)
        n_vals = len(sorted_vals)
        p75 = sorted_vals[min(n_vals - 1, int(0.75 * (n_vals - 1)))]
        p40 = sorted_vals[min(n_vals - 1, int(0.40 * (n_vals - 1)))]
        crit_thresh = max(3.0, p75)
        elev_thresh = max(1.5, p40)
        for c in raw_cells:
            val = c["harmonized_index"]
            if val >= crit_thresh:
                c["severity"] = "critical"
            elif val >= elev_thresh:
                c["severity"] = "elevated"
            else:
                c["severity"] = "normal"

    raw_cells.sort(key=lambda c: c["harmonized_index"], reverse=True)
    return {
        "region": region.id,
        "region_name": region.name,
        "cell_size": cell_size,
        "calibration_factor": factor,
        "total_cells": len(raw_cells),
        "cells": raw_cells,
    }

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_regions():
    res = client.get("/api/regions")
    assert res.status_code == 200
    ids = {r["id"] for r in res.json()["regions"]}
    assert {"amazonia_legal", "amazonas", "para", "mato_grosso", "rondonia", "acre"}.issubset(ids)


def test_fires_filter_by_sensor_and_footprint():
    res_modis = client.get("/api/fires?region=amazonas&sensor=MODIS&limit=50")
    assert res_modis.status_code == 200
    data = res_modis.json()
    assert data["data_source"] in ("live_nasa_firms", "local_csv_fallback")
    assert data["returned_count"] > 0
    assert all(f["sensor"] == "MODIS" for f in data["fires"])
    assert "pixel_area_km2" in data["fires"][0]
    assert "scan" in data["fires"][0]

    res_viirs = client.get("/api/fires?region=amazonas&sensor=VIIRS&limit=50")
    assert res_viirs.status_code == 200
    viirs_data = res_viirs.json()
    assert viirs_data["returned_count"] > 0
    assert all(f["sensor"] == "VIIRS" for f in viirs_data["fires"])


def test_custom_aoi_bbox_and_filters():
    res = client.get("/api/fires?bbox=-65.0,-10.0,-58.0,-2.0&min_confidence=nominal")
    assert res.status_code == 200
    body = res.json()
    assert body["region"] == "custom_aoi"
    assert body["returned_count"] > 0
    for f in body["fires"]:
        assert -65.0 <= f["longitude"] <= -58.0
        assert -10.0 <= f["latitude"] <= -2.0
        assert f["confidence_level"] in ("nominal", "high")


def test_timeline_harmonization_and_diagnostics():
    res = client.get("/api/timeline?region=amazonia_legal&granularity=month&viirs_only_weight=0.85")
    assert res.status_code == 200
    body = res.json()
    assert 0.15 <= body["calibration_factor"] <= 0.50
    assert "summary" in body
    assert "diagnostics" in body
    diag = body["diagnostics"]
    for key in (
        "total_modis",
        "total_viirs",
        "coincident_viirs",
        "viirs_only_small_fires",
        "avg_modis_footprint_km2",
        "avg_viirs_footprint_km2",
        "effective_area_ratio",
        "total_frp_mw",
    ):
        assert key in diag
    for key in (
        "ytd_harmonized",
        "ytd_historical",
        "ytd_deviation_pct",
        "peak_period",
        "early_warning_status",
        "recommendation",
    ):
        assert key in body["summary"]
    assert len(body["series"]) >= 6
    first = body["series"][0]
    for key in (
        "period",
        "modis_raw",
        "viirs_raw",
        "viirs_normalized",
        "harmonized_total",
        "historical_avg",
        "alert_level",
        "coincident_viirs",
        "viirs_only_small",
        "modis_frp",
        "viirs_frp",
        "harmonized_frp",
        "anomaly_zscore",
    ):
        assert key in first


def test_grid_endpoint():
    res = client.get("/api/grid?region=amazonas")
    assert res.status_code == 200
    body = res.json()
    assert body["region"] == "amazonas"
    assert body["total_cells"] > 0
    cell = body["cells"][0]
    for key in (
        "id",
        "bounds",
        "center",
        "modis_raw",
        "viirs_raw",
        "viirs_normalized",
        "harmonized_index",
        "avg_frp",
        "avg_footprint_km2",
        "sensor_overlap",
        "severity",
    ):
        assert key in cell

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
    assert {"amazonia_legal", "amazonas", "para", "rondonia", "acre"}.issubset(ids)


def test_fires_filter_by_sensor():
    res_modis = client.get("/api/fires?region=amazonas&sensor=MODIS&limit=50")
    assert res_modis.status_code == 200
    data = res_modis.json()
    assert data["data_source"] == "local_csv_fallback"
    assert data["returned_count"] > 0
    assert all(f["sensor"] == "MODIS" for f in data["fires"])

    res_viirs = client.get("/api/fires?region=amazonas&sensor=VIIRS&limit=50")
    assert res_viirs.status_code == 200
    assert all(f["sensor"] == "VIIRS" for f in res_viirs.json()["fires"])


def test_timeline_harmonization():
    res = client.get("/api/timeline?region=amazonia_legal&granularity=month")
    assert res.status_code == 200
    body = res.json()
    assert 0.15 <= body["calibration_factor"] <= 0.50
    assert "summary" in body
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
        "severity",
    ):
        assert key in cell

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


def test_period_filter():
    all_res = client.get("/api/fires?region=amazonas")
    assert all_res.status_code == 200
    all_total = all_res.json()["total_count"]

    tl_month = client.get("/api/timeline?region=amazonas&granularity=month").json()
    month_period = tl_month["series"][0]["period"]
    filtered_month = client.get(f"/api/fires?region=amazonas&period={month_period}")
    assert filtered_month.status_code == 200
    body = filtered_month.json()
    assert body["period"] == month_period
    assert body["total_count"] <= all_total
    assert all(f["acq_date"].startswith(month_period) for f in body["fires"])

    grid_month = client.get(f"/api/grid?region=amazonas&period={month_period}")
    assert grid_month.status_code == 200
    assert grid_month.json()["period"] == month_period

    tl_week = client.get("/api/timeline?region=amazonas&granularity=week").json()
    week_period = tl_week["series"][0]["period"]
    filtered_week = client.get(f"/api/fires?region=amazonas&period={week_period}")
    assert filtered_week.status_code == 200
    assert filtered_week.json()["period"] == week_period


def test_date_range_and_sensor_integration():
    fires_aug = client.get("/api/fires?region=amazonia_legal&start_date=2026-08-01&end_date=2026-08-31&sensor=VIIRS")
    assert fires_aug.status_code == 200
    f_body = fires_aug.json()
    assert f_body["start_date"] == "2026-08-01"
    assert f_body["end_date"] == "2026-08-31"
    assert f_body["total_count"] > 0
    assert all("2026-08-01" <= f["acq_date"] <= "2026-08-31" and f["sensor"] == "VIIRS" for f in f_body["fires"])

    grid_viirs = client.get(
        "/api/grid?region=amazonia_legal&start_date=2026-08-01&end_date=2026-08-31&sensor=VIIRS&viirs_only_weight=0.5"
    )
    assert grid_viirs.status_code == 200
    g_body = grid_viirs.json()
    assert g_body["sensor"] == "VIIRS"
    assert g_body["start_date"] == "2026-08-01"
    assert all(cell["modis_raw"] == 0 for cell in g_body["cells"])

    tl_viirs = client.get("/api/timeline?region=amazonia_legal&start_date=2026-08-01&end_date=2026-09-30&sensor=VIIRS")
    assert tl_viirs.status_code == 200
    t_body = tl_viirs.json()
    assert t_body["sensor"] == "VIIRS"
    assert [pt["period"] for pt in t_body["series"]] == ["2026-08", "2026-09"]
    assert all(pt["modis_raw"] == 0 for pt in t_body["series"])


def test_november_2026_and_prior_year_queries():
    nov_res = client.get("/api/fires?region=amazonia_legal&start_date=2026-11-01&end_date=2026-11-14")
    assert nov_res.status_code == 200
    nov_body = nov_res.json()
    assert nov_body["total_count"] > 0
    assert all("2026-11-01" <= f["acq_date"] <= "2026-11-14" for f in nov_body["fires"])

    hist_res = client.get("/api/fires?region=amazonia_legal&period=2025-08")
    assert hist_res.status_code == 200
    hist_body = hist_res.json()
    assert hist_body["total_count"] > 0
    assert all(f["acq_date"].startswith("2025-08") for f in hist_body["fires"])

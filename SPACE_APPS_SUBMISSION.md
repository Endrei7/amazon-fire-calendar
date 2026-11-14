# NASA Space Apps 2026 — Submission Pack (PT-BR & EN)

Use os textos abaixo para atualizar a página oficial de submissão do desafio **"Harmonization of MODIS and VIIRS Hot Spots"** no portal do **NASA Space Apps Challenge**.

---

## English (Recommended for Global Judging)

### Project Name
**Amazon Fire Calendar — Spatiotemporal MODIS & VIIRS Harmonized Burning Activity Monitor**

### High-Level Summary
An interactive web application and **Harmonized Burning Activity Calendar** for the Amazon Basin (and custom user-defined Areas of Interest) that unifies 20+ years of legacy **NASA FIRMS MODIS (1 km)** records with high-resolution **VIIRS (375 m)** thermal anomalies — accounting for off-nadir scan-angle pixel distortion (`scan × track`), spatiotemporal clustering of coincident vs. small VIIRS-only fires, nighttime sensitivity, and Fire Radiative Power (FRP).

### How We Addressed the Challenge
Comparing raw **VIIRS (375 m)** hotspot counts against a 20-year **MODIS (1 km)** historical baseline creates artificial statistical spikes due to three physical factors highlighted by NASA:
1. **Swath-Edge Pixel Distortion (`scan × track`):** MODIS pixels expand from `1.0 km²` at nadir up to `>2.5 km²` at scan edges, while VIIRS maintains compact `~0.14–0.18 km²` footprints.
2. **Dual-Sensor Duplication vs. Small/Cool Omission Errors:** A single large fire generates 4–6 coincident VIIRS detections per MODIS pixel, whereas small agricultural or cooler nighttime burns are detected *exclusively* by VIIRS (`VIIRS-only`).
3. **Day/Night Detection Asymmetry:** VIIRS's 375 m I4 band captures ~30% of detections at night (`N`), where MODIS sensitivity drops.

**Our Solution:**
- **Spatiotemporal Clustering & Footprint Calibration:** We partition VIIRS detections into **Coincident Clusters** (matched to MODIS fire events) and **Unmatched Small Fires (`VIIRS-only`)**, applying a configurable weighting factor (`VIIRS_effective = Coincident + w × VIIRS_only`) blended with scan-angle area normalization (`scan × track`).
- **Interactive Custom Area of Interest (AOI):** Users can select preset Amazon states (including Amazonas/Manaus and Mato Grosso's Arc of Deforestation) or **draw a custom bounding box directly on the map / enter Lat-Lon coordinates**.
- **Multi-Metric Burning Activity Calendar & Accessible Color Ramps:** View seasonal trends by **Harmonized Fire Index**, **Fire Radiative Power (FRP in MW)**, or **Standardized Anomaly (`Z-Score`)**, complete with a colorblind-safe **Viridis** palette, Day/Night & Confidence filters, and 16-column CSV export for Civil Defense teams.

---

## Português (Apresentação Regional / Brasil)

### Nome do Projeto
**Amazon Fire Calendar — Calendário Harmonizado de Atividade de Queima (MODIS ↔ VIIRS)**

### Resumo do Projeto
Aplicação web interativa que harmoniza os sensores **MODIS (1 km)** e **VIIRS (375 m)** da **NASA FIRMS** em um **Calendário Unificado de Atividade de Queima**, corrigindo distorções de varredura orbital (`scan × track`), separando incêndios coincidentes de pequenos focos exclusivos do VIIRS (`VIIRS-Only`), suportando seleção de **Área de Interesse Customizada (AOI)** no mapa e oferecendo análise de Potência Radiativa (`FRP`), anomalia padronizada (`Z-Score`) e paleta acessível **Viridis**.

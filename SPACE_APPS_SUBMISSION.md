# NASA Space Apps 2026 — Submission Pack (PT-BR & EN)

Use os textos abaixo para atualizar a página oficial de submissão do desafio **"Harmonization of MODIS and VIIRS Hot Spots"** no portal do **NASA Space Apps Challenge**.

- **Live Demo:** https://amazon-fire-web.onrender.com
- **API & Swagger Docs:** https://amazon-fire-api.onrender.com/docs

---

## English (Recommended for Global Judging)

### Project Name
**Amazon Fire Calendar — Spatiotemporal MODIS & VIIRS Harmonized Burning Activity Monitor**

### High-Level Summary
An interactive bilingual (`EN` / `PT`) web application and **Harmonized Burning Activity Calendar** for the Amazon Basin (and custom user-defined Areas of Interest) that unifies 20+ years of legacy **NASA FIRMS MODIS (1 km)** records with high-resolution **VIIRS (375 m)** thermal anomalies — accounting for off-nadir scan-angle pixel distortion (`scan × track`), spatiotemporal clustering of coincident vs. small `VIIRS-only` fires, confidence filtering, Fire Radiative Power (`FRP`), and standardized seasonal anomalies (`Z-Score`).

### How We Addressed the Challenge
Comparing raw **VIIRS (375 m)** hotspot counts against a 20-year **MODIS (1 km)** historical baseline creates artificial statistical spikes due to two core physical & sensor factors highlighted by NASA:
1. **Swath-Edge Pixel Distortion (`scan × track`):** MODIS pixels expand from `1.0 km²` at nadir up to `>2.5 km²` at high scan angles, while VIIRS maintains compact `~0.14–0.18 km²` footprints.
2. **Dual-Sensor Duplication vs. Small/Cool Fire Sensitivity:** A single large fire generates 4–6 coincident VIIRS detections per MODIS pixel, whereas smaller agricultural or understory fires are detected *exclusively* by VIIRS (`VIIRS-only`), especially at night.

**Our Solution (3 Progressive-Disclosure Workspaces):**
- **`1. Mapa & Série` (Live Map & Cross-Filtered Time Series):** Switch across individual hotspots, true **`Scan × Track` pixel footprints (km²)**, and a **Harmonized Spatial Risk Grid**; pick dynamic date windows (live 5-day NRT, 7-day, 30-day, dry-season peak, year-to-date, or custom calendar range) and click any chart bar to cross-filter the map while keeping the full seasonal curve visible.
- **`2. Calendário & Matriz` (Seasonal Spectrum & Early Warning):** Explore a continuous **Burning Intensity Heatmap**, physical harmonization diagnostics, 60-day early-warning outlook, and a multi-metric **Burning Activity Calendar Matrix** (**Harmonized Index**, **FRP in MW**, and **Z-Score** with colorblind-safe **Viridis** palettes).
- **`3. Laboratório MODIS×VIIRS` (Interactive Swath Simulator & Methodology):** Contrast raw false-alarm inflation (~4×) against the calibrated MODIS baseline, tune `VIIRS-Only` weighting (`0.50×–1.00×`), and simulate pixel stretching from nadir (`0°`) to swath edge (`55°`).
- **Interactive Custom `AOI`, Data Export & 7-Step Pitch Mode:** Draw a custom bounding box directly on the map or enter `West/South/East/North` coordinates, export 14-column harmonized **CSV** or **GeoJSON** layers for Civil Defense teams, or launch a built-in **7-step Pitch Tour** with bilingual speaker scripts.

---

## Português (Apresentação Regional / Brasil)

### Nome do Projeto
**Amazon Fire Calendar — Calendário Harmonizado de Atividade de Queima (MODIS ↔ VIIRS)**

### Resumo do Projeto
Aplicação web interativa e responsiva (`PT` / `EN`) que harmoniza os sensores **MODIS (`1 km`)** e **VIIRS (`375 m`)** da **NASA FIRMS** em um **Calendário Unificado de Atividade de Queima** para toda a Amazônia Legal.

Estruturada em **3 abas progressivas** (**1. Mapa & Série**, **2. Calendário & Matriz** e **3. Laboratório MODIS×VIIRS**), a plataforma corrige distorções de varredura orbital (`scan × track` com simulador de `0°` a `55°`), separa incêndios coincidentes de pequenos focos exclusivos do VIIRS (`VIIRS-Only`), integra filtros temporais e de confiança com cross-filtering bidirecional no gráfico, suporta seleção interativa de **Área de Interesse Customizada (`AOI`)** no mapa, calcula Potência Radiativa (`FRP`) e anomalia padronizada (`Z-Score`) com paleta acessível **Viridis**, exporta em **CSV / GeoJSON** e inclui um **Modo Pitch guiado em 7 passos** pronto para apresentação.

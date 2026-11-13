# NASA Space Apps — Submission Pack (PT-BR & EN)

Use os textos abaixo para preencher rapidamente a página oficial de submissão do projeto no portal do **NASA Space Apps Challenge**.

---

## English (Recommended for Global Judging)

### Project Name
**Amazon Fire Calendar — MODIS & VIIRS Harmonized Early-Warning Monitor**

### High-Level Summary
A spatial-temporal fire monitoring dashboard for the Amazon Basin (focused on Manaus & Amazonas) that harmonizes legacy **NASA FIRMS MODIS (1 km)** and modern **VIIRS (375 m)** thermal anomalies onto a single historical baseline, eliminating resolution-induced false alarms and empowering emergency teams to act ahead of the dry-season peak.

### How We Addressed the Challenge
Because VIIRS (375 m × 375 m = 0.14 km²) has ~7× higher spatial resolution than MODIS (1 km × 1 km = 1.00 km²), a single wildfire often registers 4–6 VIIRS hotspots vs. 1 MODIS hotspot. Comparing raw VIIRS counts against 20+ years of MODIS historical averages creates misleading spikes.

Instead of attempting 1-to-1 point matching, **Amazon Fire Calendar** aggregates detections across **spatial grid cells** and **weekly/monthly time windows**, computes an overlapping regional calibration factor (`VIIRS_normalized = VIIRS_raw × factor`), and produces a unified **Harmonized Fire Index** compared directly against MODIS historical baselines — complete with automated early-warning diagnostics, a 60-day risk projection, raw-vs-harmonized toggle, interactive Pitch Mode, and CSV export for Civil Defense teams.

### Space Agency Data Used
- **NASA FIRMS (Fire Information for Resource Management System)**
  - **MODIS Collection 6.1 NRT** (Terra & Aqua, 1 km resolution)
  - **VIIRS 375 m NRT** (Suomi NPP & NOAA-20)

### Tech Stack
- **Backend:** Python 3, FastAPI, httpx, Docker (Google Cloud Run ready), resilient local NASA FIRMS CSV fallback.
- **Frontend:** React, TypeScript, Vite, Leaflet (`react-leaflet` spatial grid & hotspots), Recharts, Firebase Hosting ready.

---

## Português (Para Apresentação Regional / Manaus)

### Nome do Projeto
**Amazon Fire Calendar — Monitor Harmonizado de Queimadas (MODIS + VIIRS)**

### Resumo do Projeto
Painel de alerta precoce para monitoramento de queimadas na Amazônia Legal (com foco em Manaus e Amazonas) que unifica os sensores **MODIS (1 km)** e **VIIRS (375 m)** da **NASA FIRMS** na mesma escala histórica, evitando falsos alarmes causados pela diferença de resolução e permitindo ação antecipada antes do pico de agosto–setembro.

### Como Resolvemos o Desafio
O VIIRS enxerga blocos de 375 m (~7× menores em área que o 1 km do MODIS), dividindo o mesmo incêndio em vários focos. Nossa aplicação agrupa os focos por **quadrantes geográficos (Grid Espacial)** e **janelas de tempo**, aplica um fator de calibração calculado nos períodos de sobreposição entre os dois satélites e entrega um **Índice Harmonizado** comparável à média histórica do MODIS, com matriz anual de alertas, projeção de 60 dias e exportação CSV.

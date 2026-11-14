# NASA Space Apps 2026 — Submission Pack (PT-BR & EN)

Use os textos abaixo para atualizar a página oficial de submissão do desafio **"Harmonization of MODIS and VIIRS Hot Spots"** no portal do **NASA Space Apps Challenge** (`Printf("Nasarentos");`), respondendo ponto a ponto cada proposta pedida pela NASA com o que foi implementado no projeto.

- **Live Demo:** https://amazon-fire-web.onrender.com
- **API & Swagger Docs:** https://amazon-fire-api.onrender.com/docs
- **GitHub (Endrei7):** https://github.com/Endrei7/amazon-fire-calendar
- **GitHub (guimark1412):** https://github.com/guimark1412/amazon-fire-calendar

---

## English (Recommended for Global Judging)

### Project Name
**Amazon Fire Calendar — Spatiotemporal MODIS & VIIRS Harmonized Burning Activity Monitor**

### High-Level Summary
An interactive bilingual (`EN` / `PT`) web application and **Harmonized Burning Activity Calendar** for the Brazilian Legal Amazon and custom Areas of Interest (`AOI`). It unifies **NASA FIRMS MODIS (1 km)** and **VIIRS (375 m)** active fire detections by correcting off-nadir swath distortion (`scan × track`), separating coincident dual-sensor clusters from small `VIIRS-Only` fires, computing standardized seasonal anomalies (`Z-Score`) and Fire Radiative Power (`FRP`), and providing a cross-filtered map, seasonal calendar matrix, swath simulator, `CSV`/`GeoJSON` export, and a 7-step guided Pitch Mode.

### Point-by-Point Alignment with NASA's Challenge Requirements

| What NASA's Challenge Asked For | What We Built in Amazon Fire Calendar |
| --- | --- |
| **1. Bridge split sensor records (`MODIS 1 km` vs `VIIRS 375 m`) that cannot be compared directly** | **Spatiotemporal Harmonization Engine (`backend/app/harmonization.py` & `firms_client.py`):** Ingests **NASA FIRMS** NRT (5-day live) and 2024–2026 historical baseline records; models **`scan × track` pixel footprint (km²)** distortion from nadir (`0°`) to swath edge (`55°`); separates coincident MODIS+VIIRS hotspots from small/cool `VIIRS-Only` detections with tunable weighting (`0.50×–1.00×`) in **`3. Laboratório MODIS×VIIRS`**. |
| **2. Build a web application with a Burning Activity Calendar based on active fire hotspots** | **Full-Stack Web App (`React + TypeScript + FastAPI`):** **`2. Calendário & Matriz`** renders a continuous **Burning Intensity Heatmap** and a multi-year **Burning Activity Calendar Matrix** (monthly & ISO weekly `YYYY-Www` views) switching across **Harmonized Index**, **FRP (MW)**, and **Z-Score** using colorblind-safe **Viridis** palettes. **`1. Mapa & Série`** adds an interactive **Date Range Picker Popover** (`Last 7 days`, `Last 30 days`, `Aug–Sep Peak`, `Year-to-Date`, month chips, and custom calendar range) with bidirectional chart-to-map cross-filtering. |
| **3. Enable early warning & emergency responders to anticipate critical periods** | **60-Day Early-Warning Outlook & Civil Defense Exports:** Highlights anomalous dry-season spikes via **`Z-Score`**, stratified monthly sampling (up to 2,000 map hotspots across the full year), true **`Scan × Track`** footprint & **Harmonized Spatial Grid** map modes, 14-column **`CSV`** and **`GeoJSON`** exports, and a built-in **7-step Pitch Mode** for rapid briefings. |
| **4. Enable scientists & land managers to examine historical fire patterns & unusual conditions** | **Global Sensor, Confidence & Orbital Filters:** Filter seamlessly across **Both | MODIS | VIIRS**, **Monthly | Weekly** aggregation, confidence thresholds, and inspect raw `~4×` VIIRS inflation vs. the calibrated MODIS baseline in the interactive **Swath Simulator**. |
| **5. Operate within a selected Area of Interest (`AOI`)** | **Legal Amazon + Custom Interactive `AOI`:** Switch between the full **Legal Amazon** basin and a **Custom Area of Interest (`AOI`)** by drawing a bounding box directly on the Leaflet map or entering `West / South / East / North` coordinates, dynamically updating `/api/fires`, `/api/timeline`, and `/api/grid`. |

### NASA Data & Tech Stack
- **NASA Data:** NASA FIRMS active fire hotspots (`MODIS C6.1` 1 km and `VIIRS S-NPP / NOAA-20 / NOAA-21` 375 m), including `FRP`, confidence, `scan`, `track`, and `daynight` metadata.
- **Tech Stack:** Python (`FastAPI`, `Uvicorn`), React + TypeScript + Vite, Tailwind CSS, Leaflet, Recharts.

---

## Português (Apresentação Regional / Brasil)

### Nome do Projeto
**Amazon Fire Calendar — Calendário Harmonizado de Atividade de Queima (MODIS ↔ VIIRS)**

### Resumo do Projeto
Aplicação web interativa e bilíngue (`PT` / `EN`) que harmoniza os sensores **MODIS (`1 km`)** e **VIIRS (`375 m`)** da **NASA FIRMS** em um **Calendário Unificado de Atividade de Queima** para a Amazônia Legal e Áreas de Interesse Customizadas (`AOI`), permitindo antecipar períodos críticos, identificar anomalias (`Z-Score`) e apoiar alertas precoces e respostas a emergências.

### Resposta Ponto a Ponto às Propostas do Desafio da NASA

| O que o Desafio da NASA Pediu | O que Nós Criamos no Projeto |
| --- | --- |
| **1. Unificar registros de sensores diferentes (`MODIS 1 km` e `VIIRS 375 m`) que não são comparáveis diretamente** | **Motor de Harmonização Espaço-Temporal (`harmonization.py` e `firms_client.py`):** Integra dados da **NASA FIRMS** (tempo quase real de 7 dias + série histórica 2024–2026); calcula a distorção real da pegada orbital (**`Scan × Track` em km²**) do nadir (`0°`) até a borda (`55°`); separa focos coincidentes de pequenos focos exclusivos do VIIRS (`VIIRS-Only`) com peso ajustável (`0.50×–1.00×`) na aba **`3. Laboratório MODIS×VIIRS`**. |
| **2. Criar uma aplicação web com um Calendário de Atividade de Queimadas baseado em focos ativos** | **Aplicação Web Completa (`React + TypeScript + FastAPI`):** Na aba **`2. Calendário & Matriz`**, entrega um **Espectro Contínuo de Intensidade** e uma **Matriz de Calendário** (mensal e semanal `YYYY-Www`) alternando entre **Índice Harmonizado**, **FRP (MW)** e **Z-Score** com paleta acessível **Viridis**. Na aba **`1. Mapa & Série`**, traz **Calendário Popover interativo** (`Últimos 7 dias`, `Últimos 30 dias`, `Pico Ago–Set`, `Ano até Hoje`, chips de meses e intervalo customizado) com cross-filtering entre gráfico e mapa. |
| **3. Apoiar alertas precoces e resposta a emergências para antecipar períodos críticos** | **Prognóstico de 60 Dias & Exportação Operacional:** Destaca anomalias sazonais via **`Z-Score`**, amostragem estratificada por mês (até 2.000 focos no mapa no ano completo), camadas de **Pontos**, **Pegada (`Scan × Track`)** e **Grid Harmonizado**, exportação em **`CSV` (14 colunas)** e **`GeoJSON`**, além de um **Modo Pitch guiado em 7 passos**. |
| **4. Permitir que cientistas e gestores analisem padrões históricos e condições incomuns** | **Filtros Globais & Simulador Orbital:** Alternância instantânea entre **Ambos \| MODIS \| VIIRS**, escala **Mensal \| Semanal**, filtros orbitais/confiança e contraste visual entre a inflação bruta (`~4×`) e a linha de base calibrada no **Simulador de Varredura**. |
| **5. Analisar dentro de uma Área de Interesse (`AOI`) selecionada** | **Amazônia Legal + `AOI` Customizada no Mapa:** Permite alternar entre toda a **Amazônia Legal** e uma **Área Customizada (`AOI`)** desenhando um retângulo diretamente no mapa Leaflet ou informando coordenadas `Oeste / Sul / Leste / Norte`, recalculando `/api/fires`, `/api/timeline` e `/api/grid` em tempo real. |

### Dados da NASA & Stack Tecnológica
- **Dados da NASA:** NASA FIRMS (`MODIS C6.1` 1 km e `VIIRS S-NPP / NOAA-20 / NOAA-21` 375 m — `FRP`, confiança, `scan`, `track`, dia/noite).
- **Tecnologias:** Python (`FastAPI`, `Uvicorn`), React + TypeScript + Vite, Tailwind CSS, Leaflet, Recharts.

# Amazon Fire Calendar — NASA Space Apps 2026 (Harmonização MODIS ↔ VIIRS)

Painel web interativo, bilíngue (`PT` / `EN`) e responsivo para monitoramento de queimadas na Amazônia que **harmoniza os sensores MODIS (`1 km`) e VIIRS (`375 m`)** da **NASA FIRMS** em uma série histórica contínua de 20+ anos.

- **Aplicação Web Ao Vivo:** https://amazon-fire-web.onrender.com
- **API & Documentação Swagger:** https://amazon-fire-api.onrender.com/docs

---

## Principais Funcionalidades

### 1. Arquitetura em 3 Abas de Revelação Progressiva
1. **`1. Mapa & Série`**
   - **Mapa interativo (`Pontos`, `Pegada Scan×Track` e `Grid Harmonizado`):** exibe detecções ao vivo (`NASA FIRMS`), área real do pixel no solo (`scan × track` km²) e quadrantes de severidade (`Normal`, `Elevado`, `Crítico`) com paletas **Semáforo** e **Viridis** (acessível para daltonismo).
   - **Seletor de Período & Cross-Filtering Bidirecional:** atalhos relativos dinâmicos (**Tempo real · últimos 5 dias**, **Últimos 7 dias**, **Últimos 30 dias**, **Pico da Seca Ago–Set**, **Ano completo Jan–hoje**), seleção rápida por mês e clique direto nas barras do gráfico ou blocos da matriz.
   - **Série Temporal Multi-Métrica (`Recharts`):** alterna entre **Harmonizado**, **Brutos**, **Coincidência vs. Pequenos (`VIIRS-Only`)** e **Potência Radiativa (`FRP` em MW)** mantendo o contexto sazonal completo do ano.
2. **`2. Calendário & Matriz`**
   - **Espectro Sazonal (`BurningHeatmap`)** contínuo ao longo do ano + **Diagnóstico de Alerta Precoce** (acumulado vs. média MODIS histórica, pico e projeção de 60 dias).
   - **Diagnóstico Físico de Harmonização:** razão real de pegada `Scan × Track`, clusterização espaço-temporal (`Coincidentes` vs. `VIIRS-Only`) e potência térmica `FRP` acumulada/média.
   - **Matriz do Calendário de Queima:** métricas **Índice Harmonizado**, **Energia FRP (MW)** e **Anomalia (`Z-Score`)**, com trimestres em acordeão na visão semanal.
3. **`3. Laboratório MODIS×VIIRS`**
   - **Comparativo Antes vs. Depois** demonstrando o falso alarme bruto (~4×) vs. curva calibrada na régua MODIS, controle do **Peso `VIIRS-Only`** (`0,50×`, `0,85×`, `1,00×`) e **Simulador Orbital `Scan × Track`** interativo (`0°` a `55°`).
   - **Metodologia Científica NASA** inline com os 4 pilares implementados e equações do pipeline.

### 2. Filtros Globais, AOI Customizada, Exportação & Modo Pitch
- **6 Regiões Predefinidas + `AOI` Customizada:** Amazônia Legal, Amazonas, Pará, Mato Grosso, Rondônia e Acre, além de seleção de **Área de Interesse Customizada (`AOI`)** desenhando 2 pontos no mapa ou informando coordenadas `West, South, East, North`.
- **Filtros Orbitais:** sensor (`Ambos`, `MODIS`, `VIIRS`), confiança (`Todas`, `Nominal + Alta`, `Apenas Alta`) e ponderação de pequenos focos `VIIRS-Only`.
- **Exportação:** **CSV** do calendário harmonizado (14 colunas: índice, contagens brutas/coincidentes/`VIIRS-Only`, `Z-Score`, `FRP` e alerta) e **GeoJSON** (`FeatureCollection` com focos e polígonos do grid espacial).
- **Modo Pitch (Tour em 7 Passos) & PWA Mobile:** apresentação guiada automatizada com troca automática de abas, ações interativas ao vivo, **Roteiro de Fala (`PT` / `EN`)** e barra inferior dedicada para dispositivos móveis.

---

## Metodologia de Harmonização no Backend

1. **Correção de Geometria Orbital (`scan × track`):** combina a razão empírica nos meses de sobreposição com a razão efetiva de área do pixel (`avg_viirs_area / avg_modis_area`), compensando o estiramento off-nadir nas bordas de varredura do MODIS.
2. **Clusterização Espaço-Temporal:** separa detecções VIIRS coincidentes com eventos MODIS (`coincident_viirs`) de pequenos focos exclusivos (`viirs_only_small`), ponderados por `viirs_only_weight` (`0.0–1.0`, padrão `0.85`).
3. **Potência Radiativa (`FRP` em MW) & Anomalia (`Z-Score`):** harmoniza a energia térmica emitida e calcula desvios percentuais e padronizados (`Z-Score`) por mês e por semana ISO (`%G-W%V-%u`).
4. **Integração Ao Vivo + Histórico:** combina dados `NRT` da **NASA FIRMS** (`MODIS_NRT` e `VIIRS_NOAA20_NRT`) em cache de 5 minutos com a base histórica de referência (`backend/data/amazon_sample_fires.csv`), com amostragem uniforme em toda a Amazônia Legal.

---

## Stack & Estrutura do Projeto

- **Backend (`backend/`):** Python 3.11+, FastAPI, `httpx`, `uvicorn`, `pytest`
  - Endpoints: `/api/health`, `/api/regions`, `/api/fires`, `/api/timeline`, `/api/grid`
- **Frontend (`frontend/`):** React 19, TypeScript, Vite 8, Leaflet (`react-leaflet`), Recharts, Lucide Icons
- **Deploy (`render.yaml`):** Render blueprint com web service (`amazon-fire-api`) e static site (`amazon-fire-web`)

---

## Como Rodar Localmente

### 1. Backend (FastAPI + NASA FIRMS)
```powershell
cd backend
.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```
- Swagger local: `http://localhost:8000/docs`
- Copie `backend/.env.example` para `backend/.env` e configure `FIRMS_MAP_KEY` (opcional — sem chave, o sistema utiliza automaticamente `backend/data/amazon_sample_fires.csv` como fallback).
- Testes automatizados (8 testes de API e integração):
```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests
```

### 2. Frontend (React + TypeScript + Vite)
```powershell
cd frontend
npm install
npm run dev
```
- Acesse `http://localhost:5173` (o proxy/variável `VITE_API_URL` conecta ao backend).
- Build de produção: `npm run build` (`tsc && vite build`).

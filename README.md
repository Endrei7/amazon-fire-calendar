# Amazon Fire Calendar — NASA Space Apps 2026 (Harmonização MODIS ↔ VIIRS)

Painel web interativo, bilíngue (`PT` / `EN`) e responsivo desenvolvido pela equipe **`Printf("Nasarentos");`** para o desafio **"Harmonization of MODIS and VIIRS Hot Spots"** do **NASA Space Apps Challenge**. A plataforma **harmoniza os sensores MODIS (`1 km`) e VIIRS (`375 m`)** da **NASA FIRMS** em um **Calendário Unificado de Atividade de Queima** para a Amazônia Legal e Áreas de Interesse Customizadas (`AOI`).

- **Aplicação Web Ao Vivo:** https://amazon-fire-web.onrender.com
- **API & Documentação Swagger:** https://amazon-fire-api.onrender.com/docs
- **Repositórios GitHub:** [guimark1412/amazon-fire-calendar](https://github.com/guimark1412/amazon-fire-calendar) · [Endrei7/amazon-fire-calendar](https://github.com/Endrei7/amazon-fire-calendar)

---

## Alinhamento Ponto a Ponto com o Desafio da NASA

| O que o Desafio da NASA Pediu | O que Implementamos no Amazon Fire Calendar |
| --- | --- |
| **1. Unificar registros de sensores diferentes (`MODIS 1 km` e `VIIRS 375 m`) que não são comparáveis diretamente** | **Motor de Harmonização Espaço-Temporal (`harmonization.py` e `firms_client.py`):** Integra dados da **NASA FIRMS** em tempo quase real (`MODIS_NRT` + `VIIRS_NOAA20_NRT`) com série histórica; compensa a distorção real da pegada orbital (**`Scan × Track` em km²**) do nadir (`0°`) até a borda (`55°`); e separa focos coincidentes de pequenos focos exclusivos do VIIRS (`VIIRS-Only`) com peso ajustável (`0,50×`–`1,00×`) na aba **`3. Laboratório MODIS×VIIRS`**. |
| **2. Criar uma aplicação web com um Calendário de Atividade de Queimadas baseado em focos ativos** | **Aplicação Web em 3 Abas Progressivas:** Na aba **`2. Calendário & Matriz`**, entrega um **Espectro Contínuo de Intensidade** (`BurningHeatmap`) e uma **Matriz de Calendário** (mensal e semanal `YYYY-Www`) alternando entre **Índice Harmonizado**, **FRP (MW)** e **Anomalia (`Z-Score`)** com paleta acessível **Viridis**. Na aba **`1. Mapa & Série`**, oferece **Calendário Popover interativo** (`Últimos 7 dias`, `Últimos 30 dias`, `Pico Ago–Set`, `Ano até Hoje`, chips mensais e intervalo livre) com *cross-filtering* entre gráfico e mapa. |
| **3. Apoiar alertas precoces e resposta a emergências para antecipar períodos críticos** | **Prognóstico de 60 Dias & Exportação Operacional:** Destaca desvios sazonais e anomalias (`Z-Score`), usa amostragem estratificada por mês (até **2.000 focos** no mapa no ano completo para preservar picos históricos), exibe camadas de **Pontos**, **Pegada (`Scan × Track`)** e **Grid Harmonizado**, exporta em **`CSV` (14 colunas)** e **`GeoJSON`**, e inclui **Modo Pitch guiado em 7 passos**. |
| **4. Permitir que cientistas e gestores analisem padrões históricos e condições incomuns** | **Filtros Globais & Simulador Orbital:** Alternância instantânea entre **Ambos \| MODIS \| VIIRS**, escala **Mensal \| Semanal**, filtros de confiança e contraste visual entre a inflação bruta (`~4×`) e a série calibrada na régua MODIS no **Simulador de Varredura (`0°–55°`)**. |
| **5. Analisar dentro de uma Área de Interesse (`AOI`) selecionada** | **Amazônia Legal + 5 Estados + `AOI` Customizada:** Permite alternar entre Amazônia Legal, Amazonas, Pará, Mato Grosso, Rondônia e Acre, ou desenhar um retângulo diretamente no mapa Leaflet / informar coordenadas `West / South / East / North`, recalculando `/api/fires`, `/api/timeline` e `/api/grid` em tempo real. |

---

## Principais Funcionalidades

### 1. Arquitetura em 3 Abas de Revelação Progressiva
1. **`1. Mapa & Série`**
   - **Mapa interativo (`Pontos`, `Pegada Scan×Track` e `Grid Harmonizado`):** exibe detecções ao vivo (`NASA FIRMS`), área real do pixel no solo (`scan × track` km²) e quadrantes de severidade (`Normal`, `Elevado`, `Crítico`) com paletas **Semáforo** e **Viridis** (acessível para daltonismo).
   - **Seletor de Período & Cross-Filtering Bidirecional:** atalhos relativos dinâmicos (**Tempo real · últimos 5 dias**, **Últimos 7 dias**, **Últimos 30 dias**, **Pico da Seca Ago–Set**, **Ano completo Jan–hoje**), seleção rápida por mês e clique direto nas barras do gráfico ou blocos da matriz.
   - **Série Temporal Multi-Métrica (`Recharts`):** alterna entre **Harmonizado**, **Brutos**, **Coincidência vs. Pequenos (`VIIRS-Only`)** e **Potência Radiativa (`FRP` em MW)** preservando o contexto sazonal completo do ano.
2. **`2. Calendário & Matriz`**
   - **Espectro Sazonal (`BurningHeatmap`)** contínuo ao longo do ano + **Diagnóstico de Alerta Precoce** (acumulado vs. média MODIS histórica, pico e projeção de 60 dias).
   - **Diagnóstico Físico de Harmonização:** razão real de pegada `Scan × Track`, clusterização espaço-temporal (`Coincidentes` vs. `VIIRS-Only`) e potência térmica `FRP` acumulada/média.
   - **Matriz do Calendário de Queima:** métricas **Índice Harmonizado**, **Energia FRP (MW)** e **Anomalia (`Z-Score`)**, com trimestres em acordeão na visão semanal.
3. **`3. Laboratório MODIS×VIIRS`**
   - **Comparativo Antes vs. Depois** demonstrando o falso alarme bruto (`~4×`) vs. curva calibrada na régua MODIS, controle do **Peso `VIIRS-Only`** (`0,50×`, `0,85×`, `1,00×`) e **Simulador Orbital `Scan × Track`** interativo (`0°` a `55°`).
   - **Metodologia Científica NASA** inline com os 4 pilares implementados e equações do pipeline.

### 2. Exportação, Modo Pitch & Mobile PWA
- **Exportação:** **CSV** do calendário harmonizado (14 colunas: índice, contagens brutas/coincidentes/`VIIRS-Only`, `Z-Score`, `FRP` e alerta) e **GeoJSON** (`FeatureCollection` com focos e polígonos do grid espacial).
- **Modo Pitch (Tour em 7 Passos):** apresentação guiada automatizada com troca automática de abas, ações interativas ao vivo e **Roteiro de Fala (`PT` / `EN`)**.
- **Interface Responsiva Mobile:** barra de navegação inferior dedicada para alternar entre Painel, Mapa, Matriz, Lab NASA e Pitch.

---

## Metodologia de Harmonização no Backend

1. **Correção de Geometria Orbital (`scan × track`):** combina a razão empírica nos meses de sobreposição com a razão efetiva de área do pixel (`avg_viirs_area / avg_modis_area`), compensando o estiramento off-nadir nas bordas de varredura do MODIS.
2. **Clusterização Espaço-Temporal:** separa detecções VIIRS coincidentes com eventos MODIS (`coincident_viirs`) de pequenos focos exclusivos (`viirs_only_small`), ponderados por `viirs_only_weight` (`0.0–1.0`, padrão `0.85`).
3. **Potência Radiativa (`FRP` em MW) & Anomalia (`Z-Score`):** harmoniza a energia térmica emitida e calcula desvios percentuais e padronizados (`Z-Score`) por mês e por semana ISO (`%G-W%V-%u`).
4. **Integração Ao Vivo + Histórico:** combina dados `NRT` da **NASA FIRMS** (`MODIS_NRT` e `VIIRS_NOAA20_NRT`) em cache de 5 minutos com a base histórica de referência (`backend/data/amazon_sample_fires.csv`), com amostragem estratificada por mês em toda a Amazônia Legal.

---

## Dados da NASA, Stack & Estrutura do Projeto

- **Dados da NASA:** NASA FIRMS active fire hotspots (`MODIS C6.1` 1 km e `VIIRS NOAA-20 / NRT` 375 m — `FRP`, confiança, `scan`, `track`).
- **Backend (`backend/`):** Python 3.11+, FastAPI, `httpx`, `uvicorn`, `pytest`
  - Endpoints: `/api/health`, `/api/regions`, `/api/fires`, `/api/timeline`, `/api/grid`
- **Frontend (`frontend/`):** React 19, TypeScript, Vite 8, Leaflet (`react-leaflet`), Recharts, Lucide Icons, CSS modular (`index.css`)
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
- Acesse `http://localhost:5173` (a variável `VITE_API_URL` conecta ao backend).
- Build de produção: `npm run build` (`tsc && vite build`).

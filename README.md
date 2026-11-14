# Amazon Fire Calendar — NASA Space Apps 2026 (MODIS & VIIRS Harmonization)

Painel interativo e calendário de atividade de queima para monitoramento de queimadas na Amazônia que **harmoniza os sensores MODIS (1 km) e VIIRS (375 m)** da **NASA FIRMS** na mesma escala histórica de 20+ anos.

## O que foi aprimorado com base nos critérios do NASA Space Apps 2026

1. **Correção de Geometria Orbital (`scan × track` km²):**
   - Compensa a distorção dos pixels MODIS nas bordas de varredura orbital (onde pixels de `1,0 × 1,0 km` se alargam para até `~2,6 × 1,4 km`) em comparação com o pixel de `375 m` do VIIRS, incluindo o modo de mapa **Pegada Orbital (`Scan × Track`)**.
2. **Clusterização Espaço-Temporal (Coincidentes vs. Pequenos Focos `VIIRS-Only`):**
   - Separa focos VIIRS que correspondem ao mesmo incêndio detectado pelo MODIS (`Coincident_VIIRS`) daqueles pequenos focos agrícolas/noturnos detectados exclusivamente pelo VIIRS (`VIIRS_only_small`), permitindo ajustar o peso de ponderação (`0,50×` a `1,00×`, padrão `0,85×`) para não inflar artificialmente a série histórica de 20 anos do MODIS.
3. **Sensibilidade Diurna/Noturna, Confiança & Potência Radiativa (`FRP` em MW):**
   - Filtros dedicados para passagens **Diurnas (`D`) / Noturnas (`N`)** e níveis de **Confiança (`Nominal / Alta`)**, além de série temporal harmonizada de **Potência Radiativa do Fogo (FRP em Megawatts)**.
4. **Área de Interesse Customizada (`AOI`) Interativa no Mapa & Coordenadas Lat/Lon:**
   - Permite selecionar qualquer quadrante clicando 2 pontos diretamente no mapa ou inserindo coordenadas `West, South, East, North`, recalculando dinamicamente a linha de base histórica e o calendário harmonizado.
5. **Calendário de Atividade de Queima Multi-Métrica & Rampa de Cores Acessível (`Viridis`):**
   - Alternância entre **Índice Harmonizado**, **Energia FRP (MW)** e **Anomalia Padronizada (`Z-Score` em desvios-padrão $\sigma$)**, com suporte à paleta científica acessível **Viridis** (segura para daltonismo).

## Como rodar localmente

### 1. Backend (FastAPI + NASA FIRMS)
```powershell
cd backend
.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```
- Documentação Swagger: `http://localhost:8000/docs`
- Copie `.env.example` para `.env` e configure `FIRMS_MAP_KEY` (opcional — sem chave, o sistema usa `data/amazon_sample_fires.csv` com dados realistas de `scan`, `track`, `FRP` e passagens `D/N`).

### 2. Frontend (React + TypeScript + Vite)
```powershell
cd frontend
npm run dev
```
- Acesse `http://localhost:5173`.

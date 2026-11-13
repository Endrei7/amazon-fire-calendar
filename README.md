# Amazon Fire Calendar — NASA Space Apps MVP

Painel de alerta precoce para monitoramento de queimadas na Amazônia que **harmoniza os sensores MODIS (1 km) e VIIRS (375 m)** da **NASA FIRMS** na mesma escala histórica.

## Como rodar localmente

### 1. Backend (FastAPI + NASA FIRMS)
```powershell
cd backend
.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
```
- Documentação Swagger: `http://localhost:8000/docs`
- Copie `.env.example` para `.env` e configure `FIRMS_MAP_KEY` (opcional — sem chave, o sistema usa `data/amazon_sample_fires.csv` como fallback).

### 2. Frontend (React + TypeScript + Vite)
```powershell
cd frontend
npm run dev
```
- Acesse `http://localhost:5173`.

## Como funciona a harmonização MODIS ↔ VIIRS

1. **O problema:** O sensor **MODIS** (série desde ~2000) possui pixels de `1 km × 1 km (1,00 km²)`, enquanto o **VIIRS** possui pixels de `375 m × 375 m (0,14 km²)`. Um mesmo incêndio pode gerar ~4× mais focos no VIIRS do que no MODIS.
2. **A solução:** Em vez de comparar ponto a ponto, agregamos os focos por **região/grid espacial** e **tempo** (mês/semana), calculamos o fator de calibração nos períodos de sobreposição (`VIIRS_normalizado = VIIRS_bruto × fator`) e geramos o **Índice Harmonizado**, comparando-o contra a média histórica MODIS para classificar alertas (`Normal`, `Elevado`, `Crítico`).

## Deploy (Cloud Run + Firebase Hosting)

### Backend no Google Cloud Run
```bash
cd backend
gcloud run deploy amazon-fire-api --source . --region us-central1 --allow-unauthenticated --set-env-vars FIRMS_MAP_KEY=SUA_CHAVE
```

### Frontend no Firebase Hosting
```bash
cd frontend
# Crie um .env.production com VITE_API_URL=https://sua-url-cloud-run.run.app
npm run build
firebase deploy --only hosting
```

## Roteiro de Pitch (3 minutos)

1. **0:00–0:40 — O Problema (Manaus / Amazônia):** A NASA está transitando do MODIS (1 km) para o VIIRS (375 m). Se brigadistas compararem os números brutos do VIIRS hoje com a média histórica do MODIS, parece que o fogo explodiu artificialmente — ou perdem a referência de 20 anos.
2. **0:40–1:40 — A Demonstração Ao Vivo:**
   - Mostre o mapa em tempo real da **Amazônia Legal / Amazonas** puxando focos reais via **NASA FIRMS**.
   - Troque para **Grid Harmonizado** para mostrar os quadrantes críticos por densidade calibrada.
   - No gráfico do Calendário, clique em **"Ver Dados Brutos"** (mostrando o salto enganoso do VIIRS) e volte para **"Ver Harmonizado"** (mostrando a linha real contra a média histórica).
3. **1:40–2:30 — Matriz de Alerta Precoce & Ciência:** Mostre a matriz Jan–Nov com o diagnóstico automático de desvio e abra o modal **"Metodologia NASA"** + botão **"Exportar CSV"** para equipes de Defesa Civil.
4. **2:30–3:00 — Impacto:** Decisão antecipada antes do pico de agosto–setembro com dados abertos da NASA, pronto para escalar em qualquer bioma do planeta.

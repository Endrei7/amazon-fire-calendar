# Amazon Fire Calendar — Backend (FastAPI)

Backend do MVP para o **NASA Space Apps Hackathon**, responsável por ingerir dados do **NASA FIRMS** (MODIS 1km e VIIRS 375m), harmonizar os dois sensores na mesma escala histórica e servir o mapa e o calendário de queimadas da Amazônia.

## Como rodar localmente (Windows / PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Acesse a documentação interativa em: `http://localhost:8000/docs`

## Conectando a API ao vivo da NASA FIRMS (opcional para o MVP)

1. Gere uma `MAP_KEY` gratuita em: https://firms.modaps.eosdis.nasa.gov/api/area/
2. Copie `.env.example` para `.env` e cole a chave em `FIRMS_MAP_KEY=...`.
3. Se `FIRMS_MAP_KEY` estiver vazio (ou se a API da NASA falhar/der timeout), o backend usa automaticamente o arquivo local `data/amazon_sample_fires.csv` no formato oficial do FIRMS.

## Rodar testes

```powershell
pytest
```

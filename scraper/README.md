# ConstruApp — Scraper Microservice

Microservicio Python + FastAPI + Playwright para consultar precios
de materiales de construcción en tiendas online de Costa Rica.

## Tiendas soportadas

| Tienda             | URL              | Estado    |
|--------------------|------------------|-----------|
| EPA Costa Rica     | epa.cr           | ✅ Activo  |
| El Colono          | elcolono.com     | ✅ Activo  |
| El Lagar           | ellagar.cr       | 🔜 Próximo |
| Ferretería Buen Precio | buenprecio.cr | 🔜 Próximo |

## Instalación

```bash
cd scraper/
python -m venv venv
source venv/bin/activate   # macOS/Linux
# venv\Scripts\activate   # Windows

pip install -r requirements.txt
playwright install chromium
```

## Ejecución

```bash
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

El servicio queda en `http://localhost:8001`

## Endpoints

### `GET /precio?q={material}`
Busca el precio de un material específico.

```bash
curl "http://localhost:8001/precio?q=cemento+gris+50kg"
```

Respuesta:
```json
{
  "material": "Cemento Gris 50kg Holcim",
  "precio": 8450.0,
  "unidad": "saco",
  "proveedor": "EPA Costa Rica",
  "url": "https://www.epa.cr/...",
  "disponible": true,
  "fuente": "scraper"
}
```

### `POST /precios-bulk`
Precios para múltiples materiales en paralelo (máx. 10).

```bash
curl -X POST "http://localhost:8001/precios-bulk" \
  -H "Content-Type: application/json" \
  -d '{"materiales": ["cemento gris", "varilla #3", "azulejo piso"]}'
```

### `GET /health`
Chequeo de salud del servicio.

## Configuración en el backend .NET

En `appsettings.json`:
```json
{
  "Scraper": {
    "BaseUrl": "http://localhost:8001"
  }
}
```

Si `Scraper:BaseUrl` está vacío, el backend usa el catálogo local (precios fijos).

## Arquitectura

```
ConstruApp.API (ASP.NET Core)
    │
    ├─ IGeminiService → GeminiService
    │       └─ Google Gemini 2.5 Flash (análisis semántico)
    │
    └─ IPreciosCatalogoService → PreciosCatalogoService
            ├─ Catálogo local (fallback inmediato)
            └─ HTTP → Scraper Microservice (este proyecto)
                    ├─ EPA Costa Rica
                    └─ El Colono
```

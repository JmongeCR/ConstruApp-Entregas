"""
ConstruApp Scraper Microservice
================================
Microservicio FastAPI + Playwright que busca precios de materiales de
construcción en tiendas online de Costa Rica.

Tiendas soportadas:
  - EPA Costa Rica  (epa.cr)
  - El Lagar        (ellagar.cr)
  - Ferretería El Colono  (elcolono.com)

Ejecutar:
  pip install -r requirements.txt
  playwright install chromium
  uvicorn main:app --host 0.0.0.0 --port 8001 --reload
"""

import asyncio
import re
from typing import Optional
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from playwright.async_api import async_playwright, Browser, BrowserContext
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ConstruApp Scraper",
    description="Microservicio de precios de materiales de construcción CR",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


# ── Modelos de respuesta ──────────────────────────────────────────────────────

class PrecioResponse(BaseModel):
    material: str
    precio: float
    unidad: str
    proveedor: str
    url: Optional[str] = None
    disponible: bool = True
    fuente: str = "scraper"


class BulkPrecioRequest(BaseModel):
    materiales: list[str]


class BulkPrecioResponse(BaseModel):
    resultados: list[PrecioResponse]
    no_encontrados: list[str]


# ── Catálogo de fallback (si el scraping falla) ───────────────────────────────

FALLBACK_CATALOG: dict[str, dict] = {
    "cemento gris": {"precio": 8500, "unidad": "saco 50kg", "proveedor": "catalogo_local"},
    "cemento": {"precio": 8500, "unidad": "saco 50kg", "proveedor": "catalogo_local"},
    "arena": {"precio": 22000, "unidad": "m³", "proveedor": "catalogo_local"},
    "lastre": {"precio": 18000, "unidad": "m³", "proveedor": "catalogo_local"},
    "block 15": {"precio": 780, "unidad": "unidad", "proveedor": "catalogo_local"},
    "block 20": {"precio": 950, "unidad": "unidad", "proveedor": "catalogo_local"},
    "varilla #3": {"precio": 6200, "unidad": "varilla 6m", "proveedor": "catalogo_local"},
    "varilla #4": {"precio": 9800, "unidad": "varilla 6m", "proveedor": "catalogo_local"},
    "azulejo piso": {"precio": 12500, "unidad": "m²", "proveedor": "catalogo_local"},
    "pintura interior": {"precio": 18000, "unidad": "galón", "proveedor": "catalogo_local"},
    "pintura exterior": {"precio": 21500, "unidad": "galón", "proveedor": "catalogo_local"},
    "cable thw #12": {"precio": 28000, "unidad": "rollo 100m", "proveedor": "catalogo_local"},
    "tubo pvc 1/2": {"precio": 3200, "unidad": "tubo 6m", "proveedor": "catalogo_local"},
    "puerta hdf": {"precio": 85000, "unidad": "unidad", "proveedor": "catalogo_local"},
    "zinc cal 26": {"precio": 4800, "unidad": "metro", "proveedor": "catalogo_local"},
}


# ── Lógica de scraping ────────────────────────────────────────────────────────

async def scrape_epa(browser: Browser, query: str) -> Optional[dict]:
    """Busca un precio en EPA Costa Rica (epa.cr)."""
    context: BrowserContext = await browser.new_context(
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    )
    page = await context.new_page()
    try:
        url = f"https://www.epa.cr/catalogsearch/result/?q={query.replace(' ', '+')}"
        await page.goto(url, timeout=15000, wait_until="domcontentloaded")

        # Esperar resultados
        await page.wait_for_selector(".product-item-info", timeout=8000)

        # Extraer primer resultado
        first = await page.query_selector(".product-item-info")
        if not first:
            return None

        name_el  = await first.query_selector(".product-item-name")
        price_el = await first.query_selector(".price")
        link_el  = await first.query_selector("a.product-item-link")

        name  = await name_el.inner_text() if name_el else query
        price = await price_el.inner_text() if price_el else "0"
        link  = await link_el.get_attribute("href") if link_el else None

        # Limpiar precio: "₡8.500,00" → 8500.0
        price_clean = re.sub(r"[^\d,.]", "", price)
        price_clean = price_clean.replace(".", "").replace(",", ".")
        precio_num  = float(price_clean) if price_clean else 0.0

        if precio_num <= 0:
            return None

        return {
            "precio": precio_num,
            "nombre": name.strip(),
            "url":    link,
            "proveedor": "EPA Costa Rica",
        }
    except Exception as e:
        logger.warning(f"EPA scraping falló para '{query}': {e}")
        return None
    finally:
        await context.close()


async def scrape_colono(browser: Browser, query: str) -> Optional[dict]:
    """Busca un precio en El Colono (elcolono.com)."""
    context = await browser.new_context(
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    )
    page = await context.new_page()
    try:
        url = f"https://www.elcolono.com/search?q={query.replace(' ', '+')}"
        await page.goto(url, timeout=15000, wait_until="domcontentloaded")
        await page.wait_for_selector(".product-card", timeout=8000)

        first = await page.query_selector(".product-card")
        if not first:
            return None

        price_el = await first.query_selector("[data-price], .price, .product-price")
        name_el  = await first.query_selector(".product-title, .product-name, h3")

        price = await price_el.inner_text() if price_el else "0"
        name  = await name_el.inner_text() if name_el else query

        price_clean = re.sub(r"[^\d]", "", price)
        precio_num  = float(price_clean) if price_clean else 0.0

        if precio_num <= 0:
            return None

        return {
            "precio":    precio_num,
            "nombre":    name.strip(),
            "url":       url,
            "proveedor": "El Colono",
        }
    except Exception as e:
        logger.warning(f"El Colono scraping falló para '{query}': {e}")
        return None
    finally:
        await context.close()


def buscar_en_fallback(query: str) -> Optional[dict]:
    """Busca en el catálogo local si el scraping no devuelve resultados."""
    q = query.lower().strip()
    for key, val in FALLBACK_CATALOG.items():
        if key in q or q in key:
            return val
    return None


# ── Endpoints ────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "servicio": "ConstruApp Scraper"}


@app.get("/precio", response_model=PrecioResponse)
async def obtener_precio(q: str = Query(..., description="Nombre del material a buscar")):
    """
    Busca el precio de un material en tiendas online de Costa Rica.
    Intenta EPA → El Colono → catálogo local.
    """
    logger.info(f"Buscando precio para: {q}")

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        try:
            # Intentar EPA primero
            result = await scrape_epa(browser, q)
            if not result:
                result = await scrape_colono(browser, q)
        finally:
            await browser.close()

    # Fallback al catálogo local
    if not result:
        fallback = buscar_en_fallback(q)
        if fallback:
            return PrecioResponse(
                material   = q,
                precio     = fallback["precio"],
                unidad     = fallback.get("unidad", "unidad"),
                proveedor  = fallback["proveedor"],
                disponible = True,
                fuente     = "catalogo_local",
            )
        raise HTTPException(status_code=404, detail=f"No se encontró precio para '{q}'")

    return PrecioResponse(
        material   = result.get("nombre", q),
        precio     = result["precio"],
        unidad     = "unidad",   # TODO: extraer unidad de la página
        proveedor  = result["proveedor"],
        url        = result.get("url"),
        disponible = True,
        fuente     = "scraper",
    )


@app.post("/precios-bulk", response_model=BulkPrecioResponse)
async def obtener_precios_bulk(request: BulkPrecioRequest):
    """Busca precios para múltiples materiales en paralelo (máx 10)."""
    materiales = request.materiales[:10]  # limitar para no sobrecargar

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        try:
            tasks = [_buscar_uno(browser, mat) for mat in materiales]
            results = await asyncio.gather(*tasks, return_exceptions=True)
        finally:
            await browser.close()

    encontrados   = []
    no_encontrados = []

    for mat, res in zip(materiales, results):
        if isinstance(res, PrecioResponse):
            encontrados.append(res)
        else:
            no_encontrados.append(mat)

    return BulkPrecioResponse(resultados=encontrados, no_encontrados=no_encontrados)


async def _buscar_uno(browser: Browser, material: str) -> Optional[PrecioResponse]:
    """Helper para buscar un material con fallback integrado."""
    result = await scrape_epa(browser, material)
    if not result:
        result = await scrape_colono(browser, material)

    if result:
        return PrecioResponse(
            material  = result.get("nombre", material),
            precio    = result["precio"],
            unidad    = "unidad",
            proveedor = result["proveedor"],
            url       = result.get("url"),
            fuente    = "scraper",
        )

    fallback = buscar_en_fallback(material)
    if fallback:
        return PrecioResponse(
            material  = material,
            precio    = fallback["precio"],
            unidad    = fallback.get("unidad", "unidad"),
            proveedor = fallback["proveedor"],
            fuente    = "catalogo_local",
        )
    return None


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)

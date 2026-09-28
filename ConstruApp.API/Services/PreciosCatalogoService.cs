using ConstruApp.Core.Interfaces;

namespace ConstruApp.API.Services;

/// <summary>
/// Implementación inicial con catálogo local de precios (Costa Rica, 2025).
/// Cuando el microservicio de scraping esté disponible, esta clase puede
/// delegar a él vía HTTP para precios en tiempo real.
/// </summary>
public class PreciosCatalogoService : IPreciosCatalogoService
{
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _factory;
    private readonly ILogger<PreciosCatalogoService> _logger;

    // ── Catálogo base de precios CRC 2025 ─────────────────────────────────────
    // Fuente: Ferretería El Colono, EPA, CEMEX Costa Rica (precios aprox. mayo 2025)
    private static readonly Dictionary<string, decimal> _catalogo = new(StringComparer.OrdinalIgnoreCase)
    {
        // Estructura
        ["cemento"]          = 8_500m,
        ["arena"]            = 22_000m,   // m³
        ["lastre"]           = 18_000m,   // m³
        ["block 15"]         = 780m,
        ["block 20"]         = 950m,
        ["varilla #3"]       = 6_200m,    // 6m
        ["varilla #4"]       = 9_800m,    // 6m
        ["varilla #5"]       = 15_200m,   // 6m
        ["caña brava"]       = 1_200m,
        ["zinc cal 26"]      = 4_800m,    // metro lineal
        ["zinc cal 28"]      = 3_900m,
        ["viga w6"]          = 42_000m,   // 6m
        ["columna metalica"] = 38_000m,   // 3m
        // Acabados
        ["azulejo piso"]     = 12_500m,   // m²
        ["azulejo pared"]    = 11_000m,   // m²
        ["porcelanato"]      = 22_000m,   // m²
        ["ceramica"]         = 8_500m,    // m²
        ["enchape"]          = 15_000m,   // m²
        // Pintura
        ["pintura interior"] = 18_000m,   // galón
        ["pintura exterior"] = 21_500m,   // galón
        ["pintura epoxica"]  = 35_000m,   // galón
        ["sellador"]         = 12_000m,   // galón
        // Madera
        ["puerta hdf"]       = 85_000m,
        ["puerta pino"]      = 65_000m,
        ["mocheta"]          = 12_000m,   // ml
        ["rodapié"]          = 4_500m,    // ml
        // Plomería
        ["tubo pvc 1/2"]     = 3_200m,    // 6m
        ["tubo pvc 3/4"]     = 4_800m,    // 6m
        ["tubo pvc 1"]       = 7_200m,    // 6m
        ["codo pvc"]         = 350m,
        ["inodoro"]          = 95_000m,
        ["lavatorio"]        = 55_000m,
        ["ducha"]            = 28_000m,
        // Eléctrico
        ["cable thw #12"]    = 28_000m,   // rollo 100m
        ["cable thw #10"]    = 42_000m,   // rollo 100m
        ["cable thw #8"]     = 68_000m,   // rollo 100m
        ["breaker 15a"]      = 8_500m,
        ["breaker 20a"]      = 9_200m,
        ["panel 12"]         = 85_000m,   // 12 circuitos
        ["tomacorriente"]    = 3_800m,
        ["apagador"]         = 2_500m,
        // Mano de obra
        ["maestro de obras"] = 55_000m,   // por día
        ["albanil"]          = 35_000m,   // por día
        ["peon"]             = 22_000m,   // por día
        ["electricista"]     = 45_000m,   // por día
        ["plomero"]          = 42_000m,   // por día
    };

    public PreciosCatalogoService(IConfiguration config, IHttpClientFactory factory, ILogger<PreciosCatalogoService> logger)
    {
        _config  = config;
        _factory = factory;
        _logger  = logger;
    }

    public async Task<ResultadoPrecio?> ObtenerPrecioAsync(string nombreMaterial, string categoria)
    {
        // 1. Intentar scraper externo si está configurado
        var scraperUrl = _config["Scraper:BaseUrl"];
        if (!string.IsNullOrEmpty(scraperUrl))
        {
            try
            {
                var precio = await ConsultarScraperAsync(scraperUrl, nombreMaterial);
                if (precio is not null) return precio;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Scraper no disponible para '{Material}' — usando catálogo local", nombreMaterial);
            }
        }

        // 2. Catálogo local por búsqueda parcial de clave
        var key = _catalogo.Keys.FirstOrDefault(k =>
            nombreMaterial.Contains(k, StringComparison.OrdinalIgnoreCase) ||
            k.Contains(nombreMaterial[..Math.Min(6, nombreMaterial.Length)], StringComparison.OrdinalIgnoreCase));

        if (key is not null)
        {
            return new ResultadoPrecio(
                NombreMaterial: nombreMaterial,
                PrecioUnitario: _catalogo[key],
                Unidad:         InferirUnidad(categoria),
                Fuente:         "catalogo_local");
        }

        // 3. Estimación por categoría si no se encuentra
        var estimado = EstimarPorCategoria(categoria);
        return estimado is not null
            ? new ResultadoPrecio(nombreMaterial, estimado.Value, InferirUnidad(categoria), "estimado")
            : null;
    }

    public async Task<Dictionary<string, ResultadoPrecio>> ObtenerPreciosBulkAsync(
        IEnumerable<(string Nombre, string Categoria)> materiales)
    {
        var tasks = materiales.Select(async m =>
        {
            var precio = await ObtenerPrecioAsync(m.Nombre, m.Categoria);
            return (m.Nombre, Precio: precio);
        });

        var results = await Task.WhenAll(tasks);
        return results
            .Where(r => r.Precio is not null)
            .ToDictionary(r => r.Nombre, r => r.Precio!);
    }

    // ── Consulta al microservicio de scraping (Python/Playwright) ─────────────
    private async Task<ResultadoPrecio?> ConsultarScraperAsync(string baseUrl, string nombreMaterial)
    {
        var client = _factory.CreateClient("scraper");
        var url    = $"{baseUrl}/precio?q={Uri.EscapeDataString(nombreMaterial)}";

        var resp = await client.GetAsync(url);
        if (!resp.IsSuccessStatusCode) return null;

        var json = await resp.Content.ReadAsStringAsync();
        var doc  = System.Text.Json.JsonDocument.Parse(json);
        var root = doc.RootElement;

        if (!root.TryGetProperty("precio", out var precioEl)) return null;

        return new ResultadoPrecio(
            NombreMaterial: nombreMaterial,
            PrecioUnitario: precioEl.GetDecimal(),
            Unidad:         root.TryGetProperty("unidad", out var u) ? u.GetString() ?? "" : "",
            Fuente:         "scraper",
            ProveedorRef:   root.TryGetProperty("proveedor", out var p) ? p.GetString() : null
        );
    }

    private static string InferirUnidad(string categoria) => categoria.ToLower() switch
    {
        "plomeria"   => "tubo",
        "electrico"  => "rollo",
        "pintura"    => "galón",
        "madera"     => "unidad",
        "manoDeObra" => "día",
        _            => "unidad"
    };

    private static decimal? EstimarPorCategoria(string categoria) => categoria.ToLower() switch
    {
        "estructura"  => 8_000m,
        "acabados"    => 12_000m,
        "electrico"   => 15_000m,
        "plomeria"    => 7_500m,
        "pintura"     => 18_000m,
        "madera"      => 25_000m,
        "manoDeObra"  => 35_000m,
        _             => null
    };
}

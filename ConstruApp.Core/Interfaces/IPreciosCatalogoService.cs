namespace ConstruApp.Core.Interfaces;

/// <summary>
/// Contrato para el servicio que resuelve precios reales de materiales.
/// Puede usar catálogo local, base de datos de proveedores o el microservicio
/// de scraping de Python/Playwright según disponibilidad.
/// </summary>
public interface IPreciosCatalogoService
{
    /// <summary>
    /// Dado un nombre de material, devuelve su precio unitario estimado en CRC.
    /// Devuelve null si no se puede determinar.
    /// </summary>
    Task<ResultadoPrecio?> ObtenerPrecioAsync(string nombreMaterial, string categoria);

    /// <summary>
    /// Resuelve precios para una lista de materiales en paralelo.
    /// </summary>
    Task<Dictionary<string, ResultadoPrecio>> ObtenerPreciosBulkAsync(
        IEnumerable<(string Nombre, string Categoria)> materiales);
}

/// <summary>
/// Resultado del lookup de precio de un material (DTO — no confundir con la
/// entidad ConstruApp.Core.Entities.PrecioMaterial de la BD).
/// </summary>
public record ResultadoPrecio(
    string  NombreMaterial,
    decimal PrecioUnitario,
    string  Unidad,
    string? Fuente      = null,   // "catalogo_local", "scraper", "estimado"
    string? ProveedorRef = null);

using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;

namespace ConstruApp.API.Services;

public sealed class CotizacionRequisitosOptions
{
    public const string SectionName = "CotizacionRequisitos";

    // Sin entradas no se exige ningún documento. Solo se configuran reglas acordadas.
    public Dictionary<string, string[]> DocumentosPorTipo { get; set; } = new();

    private static readonly Dictionary<string, string> Categorias = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Contrato"] = "Contrato", ["Plano"] = "Plano", ["Diseño"] = "Diseño",
        ["Permiso"] = "Permiso", ["Factura"] = "Factura", ["Fotografia"] = "Fotografia",
        ["foto"] = "Fotografia", ["Video"] = "Video", ["Otro"] = "Otro",
        ["doc"] = "Documento", ["Documento"] = "Documento",
    };

    public bool EsValida() => DocumentosPorTipo is not null && DocumentosPorTipo.All(regla =>
        Enum.GetNames<TipoProyecto>().Contains(regla.Key) && regla.Value is not null &&
        regla.Value.All(categoria => Canonica(categoria) is not null));

    public string[] Requeridos(TipoProyecto? tipo) => tipo.HasValue &&
        DocumentosPorTipo.TryGetValue(tipo.Value.ToString(), out var categorias)
        ? categorias.Select(c => Canonica(c)!).Distinct(StringComparer.OrdinalIgnoreCase).ToArray()
        : [];

    public static string? CategoriaDe(ArchivoProyecto archivo) =>
        Canonica(archivo.Categoria) ?? Canonica(archivo.TipoArchivo);

    private static string? Canonica(string? categoria) => categoria is not null &&
        Categorias.TryGetValue(categoria.Trim(), out var canonica) ? canonica : null;
}

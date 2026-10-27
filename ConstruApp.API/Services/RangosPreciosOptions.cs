using ConstruApp.Core.Enums;

namespace ConstruApp.API.Services;

public sealed class RangosPreciosOptions
{
    public const string SectionName = "EstimacionPrecios";
    public Dictionary<string, RangoPrecioPorM2> PorTipo { get; set; } = new(StringComparer.OrdinalIgnoreCase);

    public bool EsValida() => PorTipo is not null && PorTipo.All(r =>
        Enum.GetNames<TipoProyecto>().Contains(r.Key, StringComparer.OrdinalIgnoreCase) &&
        r.Value is not null && r.Value.Minimo > 0 && r.Value.Maximo >= r.Value.Minimo &&
        r.Value.Maximo <= 9999999999999999.99m && (r.Value.Fuente?.Length ?? 0) <= 300);
}

public sealed class RangoPrecioPorM2
{
    public decimal Minimo { get; set; }
    public decimal Maximo { get; set; }
    public string? Fuente { get; set; }
}

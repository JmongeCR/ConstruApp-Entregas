using ConstruApp.Core.Enums;

namespace ConstruApp.Core.Entities;

public class LineaCotizacionIA
{
    public int    Id              { get; set; }
    public int    CotizacionIAId  { get; set; }
    public string Descripcion     { get; set; } = string.Empty;
    public CategoriaMaterial Categoria { get; set; } = CategoriaMaterial.Otro;
    public decimal Cantidad        { get; set; }
    public string  Unidad          { get; set; } = string.Empty;
    public decimal PrecioUnitario  { get; set; }
    public decimal PrecioTotal     { get; set; }
    public bool    EsManoDeObra    { get; set; } = false;

    // Navegación
    public CotizacionIA CotizacionIA { get; set; } = null!;
}

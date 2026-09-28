using ConstruApp.Core.Enums;

namespace ConstruApp.Core.Entities;

public class Material
{
    public int    Id           { get; set; }
    public string Nombre       { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string  UnidadMedida { get; set; } = string.Empty;
    public CategoriaMaterial Categoria { get; set; } = CategoriaMaterial.Otro;
    public string? CodigoProducto { get; set; }
    public bool    Activo         { get; set; } = true;

    // Navegación
    public ICollection<PrecioMaterial> Precios { get; set; } = [];
}

namespace ConstruApp.Core.Entities;

public class PerfilProveedor
{
    public int    Id             { get; set; }
    public int    UsuarioId      { get; set; }
    public string NombreComercial { get; set; } = string.Empty;
    public string? Descripcion   { get; set; }
    public string? Direccion     { get; set; }
    public string? Canton        { get; set; }
    public string? Provincia     { get; set; }
    public string? TelefonoNegocio { get; set; }
    public string? SitioWeb      { get; set; }
    public string? HorarioAtencion { get; set; }
    public bool   Verificado     { get; set; } = false;

    // Navegación
    public Usuario                   Usuario { get; set; } = null!;
    public ICollection<PrecioMaterial> Precios { get; set; } = [];
}

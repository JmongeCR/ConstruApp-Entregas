namespace ConstruApp.Core.Entities;

public class FavoritoProveedor
{
    public int      Id                { get; set; }
    public int      UsuarioId         { get; set; }
    public int      PerfilProveedorId { get; set; }
    public DateTime FechaAgregado     { get; set; } = DateTime.UtcNow;

    public Usuario        Usuario        { get; set; } = null!;
    public PerfilProveedor PerfilProveedor { get; set; } = null!;
}

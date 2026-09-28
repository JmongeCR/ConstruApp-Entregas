using ConstruApp.Core.Enums;

namespace ConstruApp.API.DTOs.Usuario;

public class UsuarioResponse
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public Rol Rol { get; set; }
    public DateTime CreatedAt { get; set; }
}

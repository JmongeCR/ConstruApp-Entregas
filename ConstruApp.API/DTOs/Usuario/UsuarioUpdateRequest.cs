using System.ComponentModel.DataAnnotations;

namespace ConstruApp.API.DTOs.Usuario;

public class UsuarioUpdateRequest
{
    [MaxLength(150)]
    public string? Nombre { get; set; }

    [MaxLength(20)]
    public string? Telefono { get; set; }
}

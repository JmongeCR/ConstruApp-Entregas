namespace ConstruApp.Core.Entities;

/// <summary>Override de permiso a nivel de usuario individual.</summary>
public class UsuarioPermiso
{
    public int    Id             { get; set; }
    public int    UsuarioId      { get; set; }
    public string PermisoCodigo  { get; set; } = string.Empty;
    /// <summary>true = conceder permiso extra; false = revocar permiso del rol.</summary>
    public bool   Concedido      { get; set; } = true;
    public int?   ModificadoPorId { get; set; }
    public string? Motivo        { get; set; }
    public DateTime Fecha        { get; set; } = DateTime.UtcNow;

    public Usuario  Usuario        { get; set; } = null!;
    public Usuario? ModificadoPor  { get; set; }
}

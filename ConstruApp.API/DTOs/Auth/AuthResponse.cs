namespace ConstruApp.API.DTOs.Auth;

public class AuthResponse
{
    public int      Id         { get; set; }
    public string   Nombre     { get; set; } = string.Empty;
    public string   Email      { get; set; } = string.Empty;
    public string   Rol        { get; set; } = string.Empty;
    public string   Token      { get; set; } = string.Empty;
    public DateTime Expiration { get; set; }
    /// <summary>Lista de permisos activos del usuario (rol + overrides personales).</summary>
    public string[] Permisos   { get; set; } = [];
}

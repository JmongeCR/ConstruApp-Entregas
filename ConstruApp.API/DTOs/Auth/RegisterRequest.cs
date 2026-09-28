using System.ComponentModel.DataAnnotations;

namespace ConstruApp.API.DTOs.Auth;

public class RegisterRequest
{
    [Required, MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Telefono { get; set; }

    // Conservado para compatibilidad; ignorado en el nuevo flujo (admin asigna el rol)
    [MaxLength(20)]
    public string? TipoCuenta { get; set; }

    [MaxLength(1000)]
    public string? MotivoRegistro { get; set; }
}

public class ChangePasswordRequest
{
    [Required]
    public string ContrasenaActual { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string ContrasenaNueva { get; set; } = string.Empty;
}

public class ForgotPasswordRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordViaEmailRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Token { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string NuevaContrasena { get; set; } = string.Empty;
}

public class UpdateProfileRequest
{
    [Required, MaxLength(150)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Telefono { get; set; }
}

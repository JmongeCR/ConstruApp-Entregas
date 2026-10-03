using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Web;
using ConstruApp.API.Services;
using ConstruApp.API.DTOs.Auth;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<Usuario>  _userManager;
    private readonly SignInManager<Usuario> _signInManager;
    private readonly IConfiguration        _configuration;
    private readonly IPermisosService      _permisosService;
    private readonly IAuditoriaService     _auditoria;
    private readonly IUnitOfWork           _uow;
    private readonly IEmailService         _email;

    public AuthController(
        UserManager<Usuario>  userManager,
        SignInManager<Usuario> signInManager,
        IConfiguration        configuration,
        IPermisosService      permisosService,
        IAuditoriaService     auditoria,
        IUnitOfWork           uow,
        IEmailService         email)
    {
        _userManager     = userManager;
        _signInManager   = signInManager;
        _configuration   = configuration;
        _permisosService = permisosService;
        _auditoria       = auditoria;
        _uow             = uow;
        _email           = email;
    }

    // POST api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (await _userManager.FindByEmailAsync(request.Email) is not null)
            return Conflict(new { message = "El email ya está registrado." });

        var user = new Usuario
        {
            UserName        = request.Email,
            Email           = request.Email,
            Nombre          = request.Nombre,
            Telefono        = request.Telefono,
            Rol             = Core.Enums.Rol.Cliente, // el admin asignará el rol real
            CreatedAt       = DateTime.UtcNow,
            Activo          = false,
            EmailConfirmed  = false,
            EstadoCuenta    = "Pendiente",
            MotivoRegistro  = request.MotivoRegistro,
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded) return BadRequest(result.Errors);

        await _auditoria.RegistrarAsync(user.Id, user.Nombre, "Registro", "Auth",
            user.Id.ToString(), $"Solicitud de acceso: {user.Email}",
            HttpContext.Connection.RemoteIpAddress?.ToString());

        var verToken  = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var frontend  = _configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
        var verifyUrl = $"{frontend}/verify-email?userId={user.Id}&token={HttpUtility.UrlEncode(verToken)}";
        await _email.EnviarAsync(new EmailMessage(
            Para:     user.Email!,
            Asunto:   "Verificá tu correo — ConstruApp",
            HtmlBody: EmailTemplates.VerificacionEmail(user.Nombre, verifyUrl),
            Evento:   "verificacion-email",
            UsuarioId: user.Id
        ));

        return Ok(new { message = "Revisá tu correo para verificar tu cuenta. Luego un administrador la aprobará." });
    }

    // POST api/auth/change-password
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        var user  = await _userManager.FindByEmailAsync(email!);
        if (user is null) return NotFound();

        var result = await _userManager.ChangePasswordAsync(user, request.ContrasenaActual, request.ContrasenaNueva);
        if (!result.Succeeded)
            return BadRequest(new { message = result.Errors.FirstOrDefault()?.Description ?? "Error al cambiar contraseña." });

        await _auditoria.RegistrarAsync(user.Id, user.Nombre, "CambioContrasena", "Auth",
            user.Id.ToString(), "Contraseña cambiada por el usuario",
            HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(new { message = "Contraseña actualizada correctamente." });
    }

    // POST api/auth/login
    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
            return Unauthorized(new { message = "Credenciales inválidas." });

        // Validar la contraseña antes de informar el estado de la cuenta evita
        // que terceros puedan descubrir cuentas registradas usando solo el email.
        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, false);
        if (!result.Succeeded)
            return Unauthorized(new { message = "Credenciales inválidas." });

        if (user.EstadoCuenta == "Pendiente" || !user.EmailConfirmed)
            return StatusCode(403, new { message = "Tu cuenta aún no está habilitada. Recibirás un correo cuando un administrador la revise." });

        if (user.EstadoCuenta == "Rechazado")
            return StatusCode(403, new { message = "Tu solicitud de acceso fue rechazada. Contactá al administrador para más información." });

        if (!user.Activo)
            return StatusCode(403, new { message = "Tu cuenta está suspendida. Contactá al administrador." });

        // Actualizar último acceso
        user.UltimoAcceso = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        await _auditoria.RegistrarAsync(user.Id, user.Nombre, "Login", "Auth",
            null, null, HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(await BuildAuthResponseAsync(user));
    }

    // GET api/auth/profile
    [HttpGet("profile")]
    [Authorize]
    public async Task<ActionResult<AuthResponse>> Profile()
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        var user  = await _userManager.FindByEmailAsync(email!);
        if (user is null) return NotFound();
        return Ok(await BuildAuthResponseAsync(user));
    }

    // PUT api/auth/profile
    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        var user  = await _userManager.FindByEmailAsync(email!);
        if (user is null) return NotFound();

        user.Nombre   = request.Nombre;
        user.Telefono = request.Telefono;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(new { message = result.Errors.FirstOrDefault()?.Description ?? "Error al actualizar perfil." });

        await _auditoria.RegistrarAsync(user.Id, user.Nombre, "ActualizarPerfil", "Auth",
            user.Id.ToString(), "Perfil personal actualizado",
            HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(await BuildAuthResponseAsync(user));
    }

    // GET api/auth/confirm-email?userId=...&token=...
    [HttpGet("confirm-email")]
    public async Task<IActionResult> ConfirmEmail([FromQuery] int userId, [FromQuery] string token)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null)
            return BadRequest(new { message = "Enlace inválido." });

        var result = await _userManager.ConfirmEmailAsync(user, token);
        if (!result.Succeeded)
            return BadRequest(new { message = "El enlace expiró o ya fue usado. Registrate nuevamente." });

        await _auditoria.RegistrarAsync(user.Id, user.Nombre, "VerificacionEmail", "Auth",
            user.Id.ToString(), "Email verificado correctamente",
            HttpContext.Connection.RemoteIpAddress?.ToString());

        var frontend = _configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
        return Redirect($"{frontend}/login?verified=1");
    }

    // POST api/auth/forgot-password
    [HttpPost("forgot-password")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        // Respuesta genérica para no revelar si el email existe
        if (user is null)
            return Ok(new { message = "Si el correo está registrado, recibirás un enlace en breve." });

        var token    = await _userManager.GeneratePasswordResetTokenAsync(user);
        var encoded  = HttpUtility.UrlEncode(token);
        var frontend = _configuration["Frontend:BaseUrl"] ?? "http://localhost:5173";
        var resetUrl = $"{frontend}/reset-password?email={HttpUtility.UrlEncode(user.Email)}&token={encoded}";

        await _email.EnviarAsync(new EmailMessage(
            Para:     user.Email!,
            Asunto:   "Recuperá tu contraseña — ConstruApp",
            HtmlBody: EmailTemplates.RecuperacionContrasena(user.Nombre, resetUrl),
            Evento:   "recuperacion-contrasena"
        ));

        return Ok(new { message = "Si el correo está registrado, recibirás un enlace en breve." });
    }

    // POST api/auth/reset-password
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordViaEmailRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
            return BadRequest(new { message = "Enlace inválido o expirado." });

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NuevaContrasena);
        if (!result.Succeeded)
            return BadRequest(new { message = "El enlace expiró o ya fue usado. Solicitá uno nuevo." });

        await _auditoria.RegistrarAsync(user.Id, user.Nombre, "ResetContrasena", "Auth",
            user.Id.ToString(), "Contraseña restablecida vía correo",
            HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(new { message = "Contraseña restablecida correctamente. Podés iniciar sesión." });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private async Task<AuthResponse> BuildAuthResponseAsync(Usuario user)
    {
        var permisos = await _permisosService.GetPermisosAsync(user.Id, user.Rol);
        var (token, expiration) = GenerateJwtToken(user, permisos);
        return new AuthResponse
        {
            Id         = user.Id,
            Nombre     = user.Nombre,
            Email      = user.Email!,
            Rol        = user.Rol.ToString(),
            Token      = token,
            Expiration = expiration,
            Permisos   = permisos,
        };
    }

    private (string token, DateTime expiration) GenerateJwtToken(Usuario user, string[] permisos)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var key         = Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!);
        var expiration  = DateTime.UtcNow.AddMinutes(
            double.Parse(jwtSettings["ExpirationMinutes"] ?? "1440"));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub,   user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email!),
            new(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier,     user.Id.ToString()),
            new(ClaimTypes.Email,              user.Email!),
            new(ClaimTypes.Role,               user.Rol.ToString()),
            new("nombre",                      user.Nombre),
            new("perms",                       string.Join(",", permisos)),  // ← RBAC
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject            = new ClaimsIdentity(claims),
            Expires            = expiration,
            Issuer             = jwtSettings["Issuer"],
            Audience           = jwtSettings["Audience"],
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var handler = new JwtSecurityTokenHandler();
        var token   = handler.CreateToken(tokenDescriptor);
        return (handler.WriteToken(token), expiration);
    }
}

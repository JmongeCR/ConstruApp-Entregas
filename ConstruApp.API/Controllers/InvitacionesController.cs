using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using ConstruApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/invitaciones")]
public class InvitacionesController : ControllerBase
{
    private readonly AppDbContext         _db;
    private readonly UserManager<Usuario> _userManager;
    private readonly IEmailService        _email;
    private readonly IConfiguration       _config;

    public InvitacionesController(AppDbContext db, UserManager<Usuario> userManager,
        IEmailService email, IConfiguration config)
    {
        _db          = db;
        _userManager = userManager;
        _email       = email;
        _config      = config;
    }

    private int UserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ── POST /api/invitaciones ─────────────────────────────────────────────────
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Crear([FromBody] CrearInvitacionRequest req)
    {
        var userId = UserId();
        var perfil = await _db.PerfilesConstructor
            .FirstOrDefaultAsync(p => p.UsuarioId == userId);
        if (perfil is null)
            return Forbid();

        var emailNorm = req.Email.ToLower().Trim();

        var existe = await _db.Invitaciones.AnyAsync(i =>
            i.EmpresaId == perfil.Id &&
            i.Email     == emailNorm &&
            i.Estado    == "Pendiente");
        if (existe)
            return BadRequest(new { error = "Ya existe una invitación pendiente para ese correo." });

        var token = Guid.NewGuid().ToString("N");
        var inv   = new Invitacion
        {
            Email           = emailNorm,
            RolWorkspace    = req.RolWorkspace,
            Token           = token,
            EmpresaId       = perfil.Id,
            InvitadoPorId   = userId,
            FechaCreacion   = DateTime.UtcNow,
            FechaExpiracion = DateTime.UtcNow.AddDays(7),
            Estado          = "Pendiente",
        };
        _db.Invitaciones.Add(inv);
        await _db.SaveChangesAsync();

        var invitadoPor = await _userManager.FindByIdAsync(userId.ToString());
        var baseUrl     = _config["AppBaseUrl"] ?? "https://construapp.runasp.net";
        var urlAceptar  = $"{baseUrl}/invitacion/{token}";

        var msg = new EmailMessage(
            Para:     emailNorm,
            Asunto:   $"Te invitaron a {perfil.NombreEmpresa} en ConstruApp",
            HtmlBody: EmailTemplates.InvitacionWorkspace(
                          perfil.NombreEmpresa,
                          req.RolWorkspace,
                          invitadoPor?.Nombre ?? "un miembro del equipo",
                          urlAceptar,
                          inv.FechaExpiracion),
            Evento:   "invitacion_workspace"
        );
        await _email.EnviarAsync(msg);

        return Ok(new { inv.Id, inv.Email, inv.RolWorkspace, inv.Estado, inv.FechaExpiracion });
    }

    // ── GET /api/invitaciones ──────────────────────────────────────────────────
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetMias()
    {
        var userId = UserId();
        var perfil = await _db.PerfilesConstructor
            .FirstOrDefaultAsync(p => p.UsuarioId == userId);
        if (perfil is null)
            return Ok(new List<object>());

        var ahora = DateTime.UtcNow;

        // Auto-expirar pendientes vencidas
        var aExpirar = await _db.Invitaciones
            .Where(i => i.EmpresaId == perfil.Id &&
                        i.Estado    == "Pendiente" &&
                        i.FechaExpiracion < ahora)
            .ToListAsync();
        foreach (var x in aExpirar) x.Estado = "Expirada";
        if (aExpirar.Count > 0) await _db.SaveChangesAsync();

        var result = await _db.Invitaciones
            .Where(i => i.EmpresaId == perfil.Id)
            .OrderByDescending(i => i.FechaCreacion)
            .Select(i => new {
                i.Id, i.Email, i.RolWorkspace, i.Estado, i.Tipo,
                i.FechaCreacion, i.FechaExpiracion, i.FechaAceptacion,
                AceptadoPorNombre    = i.AceptadoPor    == null ? null : i.AceptadoPor.Nombre,
                AceptadoPorEmail     = i.AceptadoPor    == null ? null : i.AceptadoPor.Email,
                UsuarioCreadorNombre = i.UsuarioCreador == null ? null : i.UsuarioCreador.Nombre,
            })
            .ToListAsync();

        return Ok(result);
    }

    // ── DELETE /api/invitaciones/{id} ─────────────────────────────────────────
    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Cancelar(int id)
    {
        var userId = UserId();
        var perfil = await _db.PerfilesConstructor
            .FirstOrDefaultAsync(p => p.UsuarioId == userId);
        if (perfil is null) return Forbid();

        var inv = await _db.Invitaciones.FindAsync(id);
        if (inv is null || inv.EmpresaId != perfil.Id) return NotFound();
        if (inv.Estado != "Pendiente")
            return BadRequest(new { error = "Solo se pueden cancelar invitaciones pendientes." });

        inv.Estado = "Cancelada";
        await _db.SaveChangesAsync();
        return Ok(new { inv.Id, inv.Estado });
    }

    // ── GET /api/invitaciones/{token}/info (público) ──────────────────────────
    [HttpGet("{token}/info")]
    [AllowAnonymous]
    public async Task<IActionResult> GetInfo(string token)
    {
        var inv = await _db.Invitaciones
            .Include(i => i.Empresa)
            .Include(i => i.InvitadoPor)
            .FirstOrDefaultAsync(i => i.Token == token);

        if (inv is null)
            return NotFound(new { error = "Invitación no encontrada." });

        if (inv.Estado == "Pendiente" && inv.FechaExpiracion < DateTime.UtcNow)
        {
            inv.Estado = "Expirada";
            await _db.SaveChangesAsync();
        }

        return Ok(new {
            inv.Email,
            inv.RolWorkspace,
            inv.Estado,
            inv.FechaExpiracion,
            NombreEmpresa      = inv.Empresa.NombreEmpresa,
            InvitadoPorNombre  = inv.InvitadoPor.Nombre,
        });
    }

    // ── POST /api/invitaciones/{token}/aceptar ────────────────────────────────
    [HttpPost("{token}/aceptar")]
    [Authorize]
    public async Task<IActionResult> Aceptar(string token)
    {
        var userId = UserId();

        var inv = await _db.Invitaciones
            .Include(i => i.Empresa)
            .FirstOrDefaultAsync(i => i.Token == token);

        if (inv is null)
            return NotFound(new { error = "Invitación no encontrada." });
        if (inv.Estado == "Aceptada")
            return BadRequest(new { error = "Esta invitación ya fue aceptada." });
        if (inv.Estado == "Cancelada")
            return BadRequest(new { error = "Esta invitación fue cancelada." });
        if (inv.Estado == "Expirada" || inv.FechaExpiracion < DateTime.UtcNow)
            return BadRequest(new { error = "Esta invitación ha expirado." });

        inv.Estado          = "Aceptada";
        inv.FechaAceptacion = DateTime.UtcNow;
        inv.AceptadoPorId   = userId;
        await _db.SaveChangesAsync();

        return Ok(new {
            message       = $"¡Bienvenido a {inv.Empresa.NombreEmpresa}!",
            nombreEmpresa = inv.Empresa.NombreEmpresa,
            rol           = inv.RolWorkspace,
        });
    }

    // ── POST /api/invitaciones/agregar-miembro ────────────────────────────────
    [HttpPost("agregar-miembro")]
    [Authorize]
    public async Task<IActionResult> AgregarMiembro([FromBody] AgregarMiembroRequest req)
    {
        var userId = UserId();
        var perfil = await _db.PerfilesConstructor
            .FirstOrDefaultAsync(p => p.UsuarioId == userId);
        if (perfil is null) return Forbid();

        var emailNorm = req.Email.ToLower().Trim();

        var usuarioExistente = await _userManager.FindByEmailAsync(emailNorm);
        if (usuarioExistente is not null)
            return BadRequest(new { error = "Ya existe un usuario con ese correo electrónico." });

        var existe = await _db.Invitaciones.AnyAsync(i =>
            i.EmpresaId == perfil.Id && i.Email == emailNorm &&
            i.Estado    == "Pendiente" && i.Tipo == "Directo");
        if (existe)
            return BadRequest(new { error = "Ya existe una cuenta pendiente de activación para ese correo." });

        // Crear usuario con contraseña temporal
        var tempPass = Guid.NewGuid().ToString("N")[..10] + "Aa1!";
        var nuevo = new Usuario
        {
            UserName  = emailNorm,
            Email     = emailNorm,
            Nombre    = req.NombreCompleto.Trim(),
            Telefono  = req.Telefono?.Trim(),
            Rol       = ConstruApp.Core.Enums.Rol.Constructor,
            Activo    = true,
            CreatedAt = DateTime.UtcNow,
        };
        var cr = await _userManager.CreateAsync(nuevo, tempPass);
        if (!cr.Succeeded)
            return BadRequest(new { error = string.Join(", ", cr.Errors.Select(e => e.Description)) });

        var token = Guid.NewGuid().ToString("N");
        var inv = new Invitacion
        {
            Email            = emailNorm,
            RolWorkspace     = req.RolWorkspace,
            Token            = token,
            EmpresaId        = perfil.Id,
            InvitadoPorId    = userId,
            UsuarioCreadorId = nuevo.Id,
            FechaCreacion    = DateTime.UtcNow,
            FechaExpiracion  = DateTime.UtcNow.AddHours(48),
            Estado           = "Pendiente",
            Tipo             = "Directo",
        };
        _db.Invitaciones.Add(inv);
        await _db.SaveChangesAsync();

        var invitadoPor = await _userManager.FindByIdAsync(userId.ToString());
        var baseUrl     = _config["AppBaseUrl"] ?? "https://construapp.runasp.net";
        var urlActivar  = $"{baseUrl}/activar/{token}";

        var msg = new EmailMessage(
            Para:     emailNorm,
            Asunto:   $"Fuiste agregado al equipo de {perfil.NombreEmpresa} en ConstruApp",
            HtmlBody: EmailTemplates.AgregarMiembroWorkspace(
                          perfil.NombreEmpresa, req.RolWorkspace,
                          req.NombreCompleto, invitadoPor?.Nombre ?? "el administrador",
                          emailNorm, urlActivar, inv.FechaExpiracion),
            Evento: "agregar_miembro_workspace"
        );
        await _email.EnviarAsync(msg);

        return Ok(new { inv.Id, inv.Email, inv.RolWorkspace, inv.Estado, inv.Tipo, inv.FechaExpiracion });
    }

    // ── GET /api/invitaciones/{token}/activar (público) ───────────────────────
    [HttpGet("{token}/activar")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActivarInfo(string token)
    {
        var inv = await _db.Invitaciones
            .Include(i => i.Empresa)
            .Include(i => i.InvitadoPor)
            .FirstOrDefaultAsync(i => i.Token == token && i.Tipo == "Directo");

        if (inv is null)
            return NotFound(new { error = "Enlace de activación no válido." });

        if (inv.Estado == "Pendiente" && inv.FechaExpiracion < DateTime.UtcNow)
        {
            inv.Estado = "Expirada";
            await _db.SaveChangesAsync();
        }

        return Ok(new {
            inv.Email, inv.RolWorkspace, inv.Estado,
            inv.FechaExpiracion,
            NombreEmpresa     = inv.Empresa.NombreEmpresa,
            InvitadoPorNombre = inv.InvitadoPor.Nombre,
            UsuarioCreadorNombre = inv.UsuarioCreador == null
                ? null
                : (await _db.Users.Where(u => u.Id == inv.UsuarioCreadorId).Select(u => u.Nombre).FirstOrDefaultAsync()),
        });
    }

    // ── POST /api/invitaciones/{token}/activar (público) ─────────────────────
    [HttpPost("{token}/activar")]
    [AllowAnonymous]
    public async Task<IActionResult> Activar(string token, [FromBody] ActivarCuentaRequest req)
    {
        if (req.Password != req.ConfirmarPassword)
            return BadRequest(new { error = "Las contraseñas no coinciden." });

        var inv = await _db.Invitaciones
            .Include(i => i.Empresa)
            .FirstOrDefaultAsync(i => i.Token == token && i.Tipo == "Directo");

        if (inv is null)
            return NotFound(new { error = "Enlace de activación no válido." });
        if (inv.Estado == "Aceptada")
            return BadRequest(new { error = "Esta cuenta ya fue activada. Podés iniciar sesión." });
        if (inv.Estado == "Expirada" || inv.FechaExpiracion < DateTime.UtcNow)
        {
            inv.Estado = "Expirada";
            await _db.SaveChangesAsync();
            return BadRequest(new { error = "El enlace expiró. Contactá al administrador para recibir uno nuevo." });
        }

        var usuario = await _userManager.FindByEmailAsync(inv.Email);
        if (usuario is null)
            return BadRequest(new { error = "Usuario no encontrado." });

        var resetToken = await _userManager.GeneratePasswordResetTokenAsync(usuario);
        var result     = await _userManager.ResetPasswordAsync(usuario, resetToken, req.Password);
        if (!result.Succeeded)
            return BadRequest(new { error = string.Join(", ", result.Errors.Select(e => e.Description)) });

        inv.Estado          = "Aceptada";
        inv.FechaAceptacion = DateTime.UtcNow;
        inv.AceptadoPorId   = usuario.Id;
        await _db.SaveChangesAsync();

        return Ok(new {
            message = $"¡Cuenta activada! Ya podés iniciar sesión en {inv.Empresa.NombreEmpresa}.",
            email   = inv.Email,
        });
    }
}

public record CrearInvitacionRequest(string Email, string RolWorkspace);
public record AgregarMiembroRequest(string NombreCompleto, string Email, string? Telefono, string RolWorkspace);
public record ActivarCuentaRequest(string Password, string ConfirmarPassword);

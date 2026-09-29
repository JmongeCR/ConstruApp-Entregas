using System.Security.Claims;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly UserManager<Usuario> _userManager;
    private readonly IAuditoriaService   _auditoria;

    public AdminController(UserManager<Usuario> userManager, IAuditoriaService auditoria)
    {
        _userManager = userManager;
        _auditoria   = auditoria;
    }

    // GET api/admin/stats
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var users     = await _userManager.Users.ToListAsync();
        var ahora     = DateTime.UtcNow;
        var hace30    = ahora.AddDays(-30);

        return Ok(new
        {
            usuarios = new
            {
                total          = users.Count,
                activos        = users.Count(u => u.Activo && u.EstadoCuenta != "Pendiente" && u.EstadoCuenta != "Rechazado"),
                bloqueados     = users.Count(u => !u.Activo && u.EstadoCuenta != "Pendiente"),
                pendientes     = users.Count(u => u.EstadoCuenta == "Pendiente"),
                nuevosEste30d  = users.Count(u => u.CreatedAt >= hace30),
            }
        });
    }

    // GET api/admin/solicitudes  — usuarios con EstadoCuenta = "Pendiente"
    [HttpGet("solicitudes")]
    public async Task<IActionResult> GetSolicitudes()
    {
        var pending = await _userManager.Users
            .Where(u => u.EstadoCuenta == "Pendiente")
            .OrderBy(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.Nombre,
                u.Email,
                rol            = u.Rol.ToString(),
                u.MotivoRegistro,
                u.Telefono,
                u.CreatedAt,
                u.EmailConfirmed,
            })
            .ToListAsync();

        return Ok(pending);
    }

    // POST api/admin/solicitudes/{id}/aprobar
    [HttpPost("solicitudes/{id:int}/aprobar")]
    public async Task<IActionResult> AprobarSolicitud(int id, [FromBody] AprobarRequest req)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound(new { message = "Usuario no encontrado." });
        if (user.EstadoCuenta != "Pendiente")
            return BadRequest(new { message = "Esta solicitud ya fue procesada." });

        if (Enum.TryParse<Rol>(req.Rol, true, out var rol))
            user.Rol = rol;

        user.Activo        = true;
        user.EstadoCuenta  = "Activo";
        await _userManager.UpdateAsync(user);

        var adminId   = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var adminName = User.FindFirstValue("nombre") ?? "Admin";
        await _auditoria.RegistrarAsync(adminId, adminName, "AprobarSolicitud", "Admin",
            user.Id.ToString(), $"Cuenta aprobada con rol {user.Rol}",
            HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(new { message = "Cuenta aprobada correctamente." });
    }

    // POST api/admin/solicitudes/{id}/rechazar
    [HttpPost("solicitudes/{id:int}/rechazar")]
    public async Task<IActionResult> RechazarSolicitud(int id, [FromBody] RechazarRequest req)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound(new { message = "Usuario no encontrado." });
        if (user.EstadoCuenta != "Pendiente")
            return BadRequest(new { message = "Esta solicitud ya fue procesada." });

        user.EstadoCuenta = "Rechazado";
        user.Activo       = false;
        await _userManager.UpdateAsync(user);

        var adminId   = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var adminName = User.FindFirstValue("nombre") ?? "Admin";
        await _auditoria.RegistrarAsync(adminId, adminName, "RechazarSolicitud", "Admin",
            user.Id.ToString(), $"Motivo: {req.Motivo}",
            HttpContext.Connection.RemoteIpAddress?.ToString());

        return Ok(new { message = "Solicitud rechazada." });
    }

    // GET api/admin/usuarios
    [HttpGet("usuarios")]
    public async Task<IActionResult> GetUsuarios([FromQuery] string? estado, [FromQuery] string? q)
    {
        var query = _userManager.Users.AsQueryable();

        if (!string.IsNullOrEmpty(estado))
            query = estado.ToLower() switch
            {
                "pendiente" => query.Where(u => u.EstadoCuenta == "Pendiente"),
                "activo"    => query.Where(u => u.Activo && u.EstadoCuenta != "Pendiente" && u.EstadoCuenta != "Rechazado"),
                "bloqueado" => query.Where(u => !u.Activo && u.EstadoCuenta != "Pendiente"),
                "rechazado" => query.Where(u => u.EstadoCuenta == "Rechazado"),
                _           => query,
            };

        if (!string.IsNullOrEmpty(q))
            query = query.Where(u => u.Nombre.Contains(q) || u.Email!.Contains(q));

        var result = await query
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new
            {
                u.Id,
                u.Nombre,
                u.Email,
                rol           = u.Rol.ToString(),
                u.EstadoCuenta,
                u.Activo,
                u.EmailConfirmed,
                u.CreatedAt,
                u.UltimoAcceso,
                u.Telefono,
                u.MotivoRegistro,
            })
            .ToListAsync();

        return Ok(result);
    }

    // PUT api/admin/usuarios/{id}/activar
    [HttpPut("usuarios/{id:int}/activar")]
    public async Task<IActionResult> ActivarUsuario(int id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();
        user.Activo       = true;
        user.EstadoCuenta = "Activo";
        await _userManager.UpdateAsync(user);
        return Ok(new { message = "Usuario activado." });
    }

    // PUT api/admin/usuarios/{id}/bloquear
    [HttpPut("usuarios/{id:int}/bloquear")]
    public async Task<IActionResult> BloquearUsuario(int id, [FromBody] BloquearRequest req)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();
        user.Activo = false;
        await _userManager.UpdateAsync(user);
        return Ok(new { message = "Usuario bloqueado." });
    }

    // PUT api/admin/usuarios/{id}/rol
    [HttpPut("usuarios/{id:int}/rol")]
    public async Task<IActionResult> CambiarRol(int id, [FromBody] CambiarRolRequest req)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();
        if (!Enum.TryParse<Rol>(req.Rol, true, out var rol))
            return BadRequest(new { message = "Rol inválido." });
        user.Rol = rol;
        await _userManager.UpdateAsync(user);
        return Ok(new { message = "Rol actualizado." });
    }
}

public record AprobarRequest(string Rol);
public record RechazarRequest(string Motivo);
public record BloquearRequest(string? Motivo);
public record CambiarRolRequest(string Rol);

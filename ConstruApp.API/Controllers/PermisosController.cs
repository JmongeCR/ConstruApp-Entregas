using ConstruApp.API.Filters;
using ConstruApp.API.Services;
using ConstruApp.Core.Constants;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PermisosController : ControllerBase
{
    private readonly AppDbContext      _db;
    private readonly IAuditoriaService _auditoria;
    private readonly UserManager<Usuario> _userManager;

    public PermisosController(AppDbContext db, IAuditoriaService auditoria, UserManager<Usuario> um)
    {
        _db        = db;
        _auditoria = auditoria;
        _userManager = um;
    }

    // ── Catálogo completo de permisos ─────────────────────────────────────────
    [HttpGet("catalogo")]
    public IActionResult GetCatalogo()
    {
        var grupos = Permisos.Todos
            .GroupBy(p => p.Split('.')[0])
            .Select(g => new {
                modulo = g.Key,
                permisos = g.Select(p => new {
                    codigo = p,
                    nombre = FormatearNombre(p),
                }).ToList()
            });
        return Ok(grupos);
    }

    // ── Matriz de permisos por rol ────────────────────────────────────────────
    [HttpGet("matriz")]
    [RequierePermiso(Permisos.Admin.Roles)]
    public async Task<IActionResult> GetMatriz()
    {
        var roles = new[] { "Cliente", "Constructor", "Proveedor", "Supervisor", "MaestroObra", "Arquitecto", "Ingeniero" };
        var matrix = new Dictionary<string, string[]>();

        foreach (var rol in roles)
        {
            var perms = await _db.RolPermisos
                .Where(rp => rp.Rol == rol)
                .Select(rp => rp.PermisoCodigo)
                .ToListAsync();
            matrix[rol] = [.. perms];
        }

        return Ok(new { permisos = Permisos.Todos, matriz = matrix });
    }

    // ── Actualizar permisos de un rol ─────────────────────────────────────────
    [HttpPut("rol/{rol}")]
    [RequierePermiso(Permisos.Admin.Roles)]
    public async Task<IActionResult> ActualizarRol(string rol, [FromBody] ActualizarRolRequest req)
    {
        // No se puede editar Admin
        if (rol == "Admin") return BadRequest(new { message = "Los permisos de Admin no se pueden modificar." });

        // Validar que el rol es válido
        var rolesValidos = new[] { "Cliente","Constructor","Proveedor","Supervisor","MaestroObra","Arquitecto","Ingeniero" };
        if (!rolesValidos.Contains(rol)) return BadRequest(new { message = "Rol inválido." });

        // Eliminar los actuales y reinsertar
        var actuales = _db.RolPermisos.Where(rp => rp.Rol == rol);
        _db.RolPermisos.RemoveRange(actuales);

        var nuevos = req.Permisos
            .Where(p => Permisos.Todos.Contains(p))
            .Select(p => new RolPermiso { Rol = rol, PermisoCodigo = p });
        _db.RolPermisos.AddRange(nuevos);
        await _db.SaveChangesAsync();

        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var admin   = await _userManager.FindByIdAsync(adminId.ToString());
        await _auditoria.RegistrarAsync(adminId, admin?.Nombre ?? "Admin",
            "ActualizarPermisosRol", "Roles", rol,
            $"Nuevos permisos: {string.Join(",", req.Permisos)}");

        return Ok(new { rol, permisos = req.Permisos });
    }

    // ── Restaurar rol a defaults ──────────────────────────────────────────────
    [HttpPost("rol/{rol}/restaurar")]
    [RequierePermiso(Permisos.Admin.Roles)]
    public async Task<IActionResult> RestaurarRol(string rol)
    {
        if (!Permisos.MatrizPorDefecto.TryGetValue(rol, out var defaults))
            return BadRequest(new { message = "Rol inválido." });

        var actuales = _db.RolPermisos.Where(rp => rp.Rol == rol);
        _db.RolPermisos.RemoveRange(actuales);
        _db.RolPermisos.AddRange(defaults.Select(p => new RolPermiso { Rol = rol, PermisoCodigo = p }));
        await _db.SaveChangesAsync();

        return Ok(new { rol, permisos = defaults, message = "Permisos restaurados a valores por defecto." });
    }

    // ── Permisos de un usuario individual ─────────────────────────────────────
    [HttpGet("usuario/{id}")]
    [RequierePermiso(Permisos.Admin.Usuarios)]
    public async Task<IActionResult> GetUsuarioPermisos(int id)
    {
        var usuario = await _userManager.FindByIdAsync(id.ToString());
        if (usuario is null) return NotFound();

        // Base del rol
        var rolPerms = await _db.RolPermisos
            .Where(rp => rp.Rol == usuario.Rol.ToString())
            .Select(rp => rp.PermisoCodigo)
            .ToListAsync();

        // Overrides personales
        var overrides = await _db.UsuarioPermisos
            .Where(up => up.UsuarioId == id)
            .ToListAsync();

        return Ok(new
        {
            usuarioId   = id,
            nombre      = usuario.Nombre,
            rol         = usuario.Rol.ToString(),
            permisosRol = rolPerms,
            overrides   = overrides.Select(o => new { o.PermisoCodigo, o.Concedido, o.Motivo, o.Fecha }),
        });
    }

    // ── Agregar/modificar override de usuario ─────────────────────────────────
    [HttpPost("usuario/{id}/override")]
    [RequierePermiso(Permisos.Admin.Usuarios)]
    public async Task<IActionResult> SetOverride(int id, [FromBody] OverrideRequest req)
    {
        var existing = await _db.UsuarioPermisos
            .FirstOrDefaultAsync(u => u.UsuarioId == id && u.PermisoCodigo == req.PermisoCodigo);

        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

        if (existing is not null)
        {
            existing.Concedido       = req.Concedido;
            existing.Motivo          = req.Motivo;
            existing.ModificadoPorId = adminId;
            existing.Fecha           = DateTime.UtcNow;
        }
        else
        {
            _db.UsuarioPermisos.Add(new UsuarioPermiso
            {
                UsuarioId      = id,
                PermisoCodigo  = req.PermisoCodigo,
                Concedido      = req.Concedido,
                Motivo         = req.Motivo,
                ModificadoPorId = adminId,
                Fecha          = DateTime.UtcNow,
            });
        }

        await _db.SaveChangesAsync();

        var admin = await _userManager.FindByIdAsync(adminId.ToString());
        await _auditoria.RegistrarAsync(adminId, admin?.Nombre ?? "Admin",
            req.Concedido ? "ConcederPermiso" : "RevocarPermiso",
            "Permisos", id.ToString(),
            $"Permiso: {req.PermisoCodigo} → {(req.Concedido ? "CONCEDIDO" : "REVOCADO")}. Motivo: {req.Motivo}");

        return Ok(new { usuarioId = id, req.PermisoCodigo, req.Concedido });
    }

    // ── Eliminar override de usuario ─────────────────────────────────────────
    [HttpDelete("usuario/{id}/override/{codigo}")]
    [RequierePermiso(Permisos.Admin.Usuarios)]
    public async Task<IActionResult> RemoveOverride(int id, string codigo)
    {
        var existing = await _db.UsuarioPermisos
            .FirstOrDefaultAsync(u => u.UsuarioId == id && u.PermisoCodigo == codigo);
        if (existing is null) return NotFound();

        _db.UsuarioPermisos.Remove(existing);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private static string FormatearNombre(string codigo)
    {
        var parts = codigo.Split('.');
        var modulo = char.ToUpper(parts[0][0]) + parts[0][1..];
        var accion = parts.Length > 1 ? char.ToUpper(parts[1][0]) + parts[1][1..] : "";
        return $"{modulo}: {accion}";
    }
}

public record ActualizarRolRequest(string[] Permisos);
public record OverrideRequest(string PermisoCodigo, bool Concedido, string? Motivo);

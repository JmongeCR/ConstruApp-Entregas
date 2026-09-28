using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using ConstruApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificacionesController(AppDbContext db) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ── GET /api/notificaciones  ──────────────────────────────────────────────
    /// <summary>Devuelve las últimas N notificaciones del usuario autenticado.</summary>
    [HttpGet]
    public async Task<IActionResult> GetMias([FromQuery] int pagina = 1, [FromQuery] int tamano = 30)
    {
        var uid  = UserId;
        var skip = (pagina - 1) * tamano;

        var items = await db.Notificaciones
            .Where(n => n.UsuarioId == uid)
            .OrderByDescending(n => n.FechaCreacion)
            .Skip(skip)
            .Take(tamano)
            .Select(n => new {
                n.Id, n.Tipo, n.Titulo, n.Mensaje,
                n.UrlDestino, n.Leida, n.FechaCreacion, n.ProyectoId,
            })
            .ToListAsync();

        return Ok(items);
    }

    // ── GET /api/notificaciones/contador  ─────────────────────────────────────
    /// <summary>Contador de no leídas para la campana del topbar.</summary>
    [HttpGet("contador")]
    public async Task<IActionResult> Contador()
    {
        var uid   = UserId;
        var count = await db.Notificaciones
            .CountAsync(n => n.UsuarioId == uid && !n.Leida);
        return Ok(new { noLeidas = count });
    }

    // ── PUT /api/notificaciones/{id}/leer  ───────────────────────────────────
    [HttpPut("{id}/leer")]
    public async Task<IActionResult> MarcarLeida(int id)
    {
        var notif = await db.Notificaciones
            .FirstOrDefaultAsync(n => n.Id == id && n.UsuarioId == UserId);

        if (notif is null) return NotFound();
        notif.Leida = true;
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── PUT /api/notificaciones/leer-todas  ──────────────────────────────────
    [HttpPut("leer-todas")]
    public async Task<IActionResult> MarcarTodasLeidas()
    {
        var uid      = UserId;
        var noLeidas = await db.Notificaciones
            .Where(n => n.UsuarioId == uid && !n.Leida)
            .ToListAsync();

        foreach (var n in noLeidas) n.Leida = true;
        await db.SaveChangesAsync();
        return Ok(new { marcadas = noLeidas.Count });
    }

    // ── DELETE /api/notificaciones/{id}  ──────────────────────────────────────
    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var notif = await db.Notificaciones
            .FirstOrDefaultAsync(n => n.Id == id && n.UsuarioId == UserId);

        if (notif is null) return NotFound();
        db.Notificaciones.Remove(notif);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ── DELETE /api/notificaciones/limpiar-leidas  ───────────────────────────
    [HttpDelete("limpiar-leidas")]
    public async Task<IActionResult> LimpiarLeidas()
    {
        var uid    = UserId;
        var leidas = await db.Notificaciones
            .Where(n => n.UsuarioId == uid && n.Leida)
            .ToListAsync();

        db.Notificaciones.RemoveRange(leidas);
        await db.SaveChangesAsync();
        return Ok(new { eliminadas = leidas.Count });
    }
}

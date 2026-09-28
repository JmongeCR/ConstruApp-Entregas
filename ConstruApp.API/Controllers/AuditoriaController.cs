using ConstruApp.Core.Constants;
using ConstruApp.API.Filters;
using ConstruApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AuditoriaController : ControllerBase
{
    private readonly AppDbContext _db;

    public AuditoriaController(AppDbContext db) => _db = db;

    // GET api/auditoria/logs
    [HttpGet("logs")]
    public async Task<IActionResult> GetLogs(
        [FromQuery] int?      usuarioId,
        [FromQuery] string?   modulo,
        [FromQuery] string?   accion,
        [FromQuery] DateTime? desde,
        [FromQuery] DateTime? hasta,
        [FromQuery] string?   buscar,
        [FromQuery] int       page  = 1,
        [FromQuery] int       limit = 50)
    {
        var query = _db.AuditoriaLogs.AsQueryable();

        if (usuarioId.HasValue)
            query = query.Where(l => l.UsuarioId == usuarioId.Value);

        if (!string.IsNullOrWhiteSpace(modulo))
            query = query.Where(l => l.Modulo == modulo);

        if (!string.IsNullOrWhiteSpace(accion))
            query = query.Where(l => l.Accion.Contains(accion));

        if (desde.HasValue)
            query = query.Where(l => l.Fecha >= desde.Value.ToUniversalTime());

        if (hasta.HasValue)
            query = query.Where(l => l.Fecha <= hasta.Value.ToUniversalTime());

        if (!string.IsNullOrWhiteSpace(buscar))
            query = query.Where(l =>
                (l.UsuarioNombre != null && l.UsuarioNombre.Contains(buscar)) ||
                (l.Detalle       != null && l.Detalle.Contains(buscar))       ||
                (l.EntidadId     != null && l.EntidadId.Contains(buscar)));

        var total = await query.CountAsync();
        var data  = await query
            .OrderByDescending(l => l.Fecha)
            .Skip((page - 1) * limit).Take(limit)
            .Select(l => new {
                l.Id, l.UsuarioId, l.UsuarioNombre,
                l.Accion, l.Modulo, l.EntidadId,
                l.Detalle, l.IpAddress, l.Fecha,
            })
            .ToListAsync();

        return Ok(new { total, page, limit, data });
    }

    // GET api/auditoria/modulos  — lista de módulos distintos para filtros
    [HttpGet("modulos")]
    public async Task<IActionResult> GetModulos()
    {
        var modulos = await _db.AuditoriaLogs
            .Select(l => l.Modulo)
            .Distinct()
            .OrderBy(m => m)
            .ToListAsync();
        return Ok(modulos);
    }

    // GET api/auditoria/usuario/{id}  — historial de un usuario específico
    [HttpGet("usuario/{id}")]
    public async Task<IActionResult> GetPorUsuario(int id,
        [FromQuery] int page  = 1,
        [FromQuery] int limit = 30)
    {
        var total = await _db.AuditoriaLogs.CountAsync(l => l.UsuarioId == id);
        var data  = await _db.AuditoriaLogs
            .Where(l => l.UsuarioId == id)
            .OrderByDescending(l => l.Fecha)
            .Skip((page - 1) * limit).Take(limit)
            .Select(l => new { l.Id, l.Accion, l.Modulo, l.EntidadId, l.Detalle, l.IpAddress, l.Fecha })
            .ToListAsync();

        return Ok(new { total, page, limit, data });
    }

    // GET api/auditoria/resumen  — conteo de acciones últimos 7 días
    [HttpGet("resumen")]
    public async Task<IActionResult> GetResumen()
    {
        var hace7 = DateTime.UtcNow.AddDays(-7);

        var porModulo = await _db.AuditoriaLogs
            .Where(l => l.Fecha >= hace7)
            .GroupBy(l => l.Modulo)
            .Select(g => new { modulo = g.Key, total = g.Count() })
            .OrderByDescending(g => g.total)
            .ToListAsync();

        var porDia = await _db.AuditoriaLogs
            .Where(l => l.Fecha >= hace7)
            .GroupBy(l => l.Fecha.Date)
            .Select(g => new { fecha = g.Key, total = g.Count() })
            .OrderBy(g => g.fecha)
            .ToListAsync();

        return Ok(new { porModulo, porDia });
    }
}

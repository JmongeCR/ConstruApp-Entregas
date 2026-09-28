using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PresupuestoController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    public PresupuestoController(IUnitOfWork uow) => _uow = uow;
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ─────────────────────────────────────────────────────────────────────────
    // RESUMEN
    // GET api/presupuesto/proyecto/{id}/resumen
    // ─────────────────────────────────────────────────────────────────────────
    [HttpGet("proyecto/{proyectoId}/resumen")]
    public async Task<IActionResult> Resumen(int proyectoId)
    {
        var partidas = await _uow.PresupuestoPartidas.FindAsync(p => p.ProyectoId == proyectoId);
        var gastos   = await _uow.GastosObra.FindAsync(g => g.ProyectoId == proyectoId);
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);

        var presupuestoOriginal = partidas.Sum(p => p.PresupuestoEstimado);
        var gastoEjecutado      = gastos.Sum(g => g.Monto);
        var disponible          = presupuestoOriginal - gastoEjecutado;
        var variacion           = gastoEjecutado - presupuestoOriginal;  // + = sobrecosto

        // Alertas de sobrecosto por partida
        var gastosXPartida = gastos.Where(g => g.PartidaId.HasValue).GroupBy(g => g.PartidaId!.Value).ToDictionary(gr => gr.Key, gr => gr.Sum(g => g.Monto));

        var alertas = partidas
            .Where(p => gastosXPartida.GetValueOrDefault(p.Id, 0) > p.PresupuestoEstimado)
            .Select(p => new
            {
                PartidaId   = p.Id,
                Nombre      = p.Nombre,
                Estimado    = p.PresupuestoEstimado,
                Ejecutado   = gastosXPartida.GetValueOrDefault(p.Id, 0),
                Diferencia  = gastosXPartida.GetValueOrDefault(p.Id, 0) - p.PresupuestoEstimado,
            }).ToList();

        // Gastos por categoría
        var porCategoria = gastos
            .GroupBy(g => g.Categoria)
            .Select(gr => new { Categoria = gr.Key, Total = gr.Sum(g => g.Monto), Count = gr.Count() })
            .OrderByDescending(x => x.Total)
            .ToList();

        return Ok(new
        {
            ProyectoId           = proyectoId,
            ProyectoTitulo       = proyecto?.Titulo,
            PresupuestoOriginal  = presupuestoOriginal,
            PresupuestoCliente   = proyecto?.PresupuestoMax,
            GastoEjecutado       = gastoEjecutado,
            Disponible           = disponible,
            Variacion            = variacion,
            PorcentajeEjecucion  = presupuestoOriginal > 0 ? Math.Round((gastoEjecutado / presupuestoOriginal) * 100, 1) : 0,
            TotalPartidas        = partidas.Count(),
            TotalGastos          = gastos.Count(),
            Alertas              = alertas,
            PorCategoria         = porCategoria,
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PARTIDAS
    // ─────────────────────────────────────────────────────────────────────────

    // GET api/presupuesto/proyecto/{id}/partidas
    [HttpGet("proyecto/{proyectoId}/partidas")]
    public async Task<IActionResult> GetPartidas(int proyectoId)
    {
        var partidas = await _uow.PresupuestoPartidas.FindAsync(p => p.ProyectoId == proyectoId);
        var gastos   = await _uow.GastosObra.FindAsync(g => g.ProyectoId == proyectoId);
        var gastosXP = gastos.Where(g => g.PartidaId.HasValue).GroupBy(g => g.PartidaId!.Value).ToDictionary(gr => gr.Key, gr => gr.Sum(g => g.Monto));

        return Ok(partidas.OrderBy(p => p.Categoria).ThenBy(p => p.Nombre).Select(p => new
        {
            p.Id, p.ProyectoId, p.Nombre, p.Categoria, p.Descripcion,
            p.PresupuestoEstimado,
            GastoReal   = gastosXP.GetValueOrDefault(p.Id, 0),
            Disponible  = p.PresupuestoEstimado - gastosXP.GetValueOrDefault(p.Id, 0),
            Sobrecosto  = gastosXP.GetValueOrDefault(p.Id, 0) > p.PresupuestoEstimado,
        }));
    }

    // POST api/presupuesto/partidas
    [HttpPost("partidas")]
    public async Task<IActionResult> CreatePartida([FromBody] PartidaRequest req)
    {
        var p = new PresupuestoPartida
        {
            ProyectoId           = req.ProyectoId,
            Nombre               = req.Nombre,
            Categoria            = req.Categoria ?? "Otros",
            PresupuestoEstimado  = req.PresupuestoEstimado,
            Descripcion          = req.Descripcion,
        };
        await _uow.PresupuestoPartidas.AddAsync(p);
        await _uow.SaveChangesAsync();
        return Ok(new { p.Id, p.ProyectoId, p.Nombre, p.Categoria, p.PresupuestoEstimado, p.Descripcion, GastoReal = 0m });
    }

    // PUT api/presupuesto/partidas/{id}
    [HttpPut("partidas/{id}")]
    public async Task<IActionResult> UpdatePartida(int id, [FromBody] PartidaRequest req)
    {
        var p = await _uow.PresupuestoPartidas.GetByIdAsync(id);
        if (p is null) return NotFound();

        p.Nombre              = req.Nombre;
        p.Categoria           = req.Categoria ?? p.Categoria;
        p.PresupuestoEstimado = req.PresupuestoEstimado;
        p.Descripcion         = req.Descripcion;

        _uow.PresupuestoPartidas.UpdateAsync(p);
        await _uow.SaveChangesAsync();
        return Ok(new { p.Id, p.ProyectoId, p.Nombre, p.Categoria, p.PresupuestoEstimado, p.Descripcion });
    }

    // DELETE api/presupuesto/partidas/{id}
    [HttpDelete("partidas/{id}")]
    public async Task<IActionResult> DeletePartida(int id)
    {
        var p = await _uow.PresupuestoPartidas.GetByIdAsync(id);
        if (p is null) return NotFound();
        await _uow.PresupuestoPartidas.DeleteAsync(p);
        await _uow.SaveChangesAsync();
        return NoContent();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GASTOS
    // ─────────────────────────────────────────────────────────────────────────

    // GET api/presupuesto/proyecto/{id}/gastos
    [HttpGet("proyecto/{proyectoId}/gastos")]
    public async Task<IActionResult> GetGastos(int proyectoId, [FromQuery] string? categoria = null)
    {
        var gastos = await _uow.GastosObra.FindAsync(g => g.ProyectoId == proyectoId);
        if (!string.IsNullOrEmpty(categoria))
            gastos = gastos.Where(g => g.Categoria == categoria);
        return Ok(gastos.OrderByDescending(g => g.Fecha).Select(MapGasto));
    }

    // POST api/presupuesto/gastos
    [HttpPost("gastos")]
    public async Task<IActionResult> CreateGasto([FromBody] GastoRequest req)
    {
        var g = new GastoObra
        {
            ProyectoId       = req.ProyectoId,
            PartidaId        = req.PartidaId,
            RegistradoPorId  = UserId,
            Descripcion      = req.Descripcion,
            Categoria        = req.Categoria ?? "Otros",
            Monto            = req.Monto,
            Fecha            = req.Fecha?.ToUniversalTime() ?? DateTime.UtcNow,
            Referencia       = req.Referencia,
        };
        await _uow.GastosObra.AddAsync(g);
        await _uow.SaveChangesAsync();
        return Ok(MapGasto(g));
    }

    // DELETE api/presupuesto/gastos/{id}
    [HttpDelete("gastos/{id}")]
    public async Task<IActionResult> DeleteGasto(int id)
    {
        var g = await _uow.GastosObra.GetByIdAsync(id);
        if (g is null) return NotFound();
        await _uow.GastosObra.DeleteAsync(g);
        await _uow.SaveChangesAsync();
        return NoContent();
    }

    private static object MapGasto(GastoObra g) => new
    {
        g.Id, g.ProyectoId, g.PartidaId, g.RegistradoPorId,
        g.Descripcion, g.Categoria, g.Monto, g.Fecha, g.Referencia,
    };
}

public record PartidaRequest(
    int     ProyectoId,
    string  Nombre,
    decimal PresupuestoEstimado,
    string? Categoria   = null,
    string? Descripcion = null);

public record GastoRequest(
    int       ProyectoId,
    string    Descripcion,
    decimal   Monto,
    string?   Categoria  = null,
    int?      PartidaId  = null,
    DateTime? Fecha      = null,
    string?   Referencia = null);

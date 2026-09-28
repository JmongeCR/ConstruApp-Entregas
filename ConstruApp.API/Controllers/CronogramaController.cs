using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CronogramaController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly UserManager<Usuario> _users;

    public CronogramaController(IUnitOfWork uow, UserManager<Usuario> users)
    {
        _uow   = uow;
        _users = users;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ── GET /api/cronograma/proyecto/{proyectoId}  ─────────────────────────────
    // Devuelve todas las fases + sus tareas para un proyecto.
    [HttpGet("proyecto/{proyectoId}")]
    public async Task<IActionResult> GetByProyecto(int proyectoId)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();
        if (!await TieneAcceso(proyectoId)) return Forbid();

        var fases  = (await _uow.FasesProyecto.FindAsync(f => f.ProyectoId == proyectoId))
                       .OrderBy(f => f.Orden).ThenBy(f => f.FechaInicio).ToList();
        var faseIds = fases.Select(f => f.Id).ToHashSet();
        var tareas  = await _uow.TareasFase.FindAsync(t => faseIds.Contains(t.FaseId));

        var tareasPorFase = tareas.GroupBy(t => t.FaseId)
                                  .ToDictionary(g => g.Key, g => g.OrderBy(t => t.Orden).ThenBy(t => t.Id).Select(MapTarea));

        return Ok(fases.Select(f => MapFase(f, tareasPorFase)));
    }

    // ── POST /api/cronograma/fases  ───────────────────────────────────────────
    [HttpPost("fases")]
    public async Task<IActionResult> CreateFase([FromBody] FaseRequest req)
    {
        if (!await TieneAccesoConstructor(req.ProyectoId)) return Forbid();

        // Calcular orden: último + 1
        var existentes = await _uow.FasesProyecto.FindAsync(f => f.ProyectoId == req.ProyectoId);
        var maxOrden   = existentes.Any() ? existentes.Max(f => f.Orden) : 0;

        var fase = new FaseProyecto
        {
            ProyectoId           = req.ProyectoId,
            Nombre               = req.Nombre,
            Descripcion          = req.Descripcion,
            FechaInicio          = req.FechaInicio,
            FechaFin             = req.FechaFin,
            Estado               = EstadoFase.Pendiente,
            PorcentajeCompletado = 0,
            ResponsableId        = req.ResponsableId,
            Orden                = maxOrden + 1,
            Color                = req.Color ?? "#1976d2",
            FechaCreacion        = DateTime.UtcNow,
            FechaActualizacion   = DateTime.UtcNow,
        };

        await _uow.FasesProyecto.AddAsync(fase);
        await _uow.SaveChangesAsync();

        return Ok(MapFase(fase, new Dictionary<int, IEnumerable<object>>()));
    }

    // ── PUT /api/cronograma/fases/{id}  ──────────────────────────────────────
    [HttpPut("fases/{id}")]
    public async Task<IActionResult> UpdateFase(int id, [FromBody] FaseUpdateRequest req)
    {
        var fase = await _uow.FasesProyecto.GetByIdAsync(id);
        if (fase is null) return NotFound();
        if (!await TieneAccesoConstructor(fase.ProyectoId)) return Forbid();

        fase.Nombre               = req.Nombre              ?? fase.Nombre;
        fase.Descripcion          = req.Descripcion         ?? fase.Descripcion;
        fase.FechaInicio          = req.FechaInicio         ?? fase.FechaInicio;
        fase.FechaFin             = req.FechaFin            ?? fase.FechaFin;
        fase.Estado               = req.Estado              ?? fase.Estado;
        fase.PorcentajeCompletado = req.PorcentajeCompletado.HasValue
                                        ? Math.Clamp(req.PorcentajeCompletado.Value, 0, 100)
                                        : fase.PorcentajeCompletado;
        fase.ResponsableId        = req.ResponsableId       ?? fase.ResponsableId;
        fase.Color                = req.Color               ?? fase.Color;
        fase.FechaActualizacion   = DateTime.UtcNow;

        // Auto-completar si llega al 100%
        if (fase.PorcentajeCompletado == 100 && fase.Estado != EstadoFase.Cancelada)
            fase.Estado = EstadoFase.Completada;
        else if (fase.PorcentajeCompletado > 0 && fase.Estado == EstadoFase.Pendiente)
            fase.Estado = EstadoFase.EnProgreso;

        await _uow.FasesProyecto.UpdateAsync(fase);
        await _uow.SaveChangesAsync();

        return Ok(new { message = "Fase actualizada." });
    }

    // ── DELETE /api/cronograma/fases/{id}  ───────────────────────────────────
    [HttpDelete("fases/{id}")]
    public async Task<IActionResult> DeleteFase(int id)
    {
        var fase = await _uow.FasesProyecto.GetByIdAsync(id);
        if (fase is null) return NotFound();
        if (!await TieneAccesoConstructor(fase.ProyectoId)) return Forbid();

        await _uow.FasesProyecto.DeleteAsync(fase);
        await _uow.SaveChangesAsync();

        return NoContent();
    }

    // ── POST /api/cronograma/fases/{faseId}/tareas  ──────────────────────────
    [HttpPost("fases/{faseId}/tareas")]
    public async Task<IActionResult> CreateTarea(int faseId, [FromBody] TareaRequest req)
    {
        var fase = await _uow.FasesProyecto.GetByIdAsync(faseId);
        if (fase is null) return NotFound();
        if (!await TieneAccesoConstructor(fase.ProyectoId)) return Forbid();

        var existentes = await _uow.TareasFase.FindAsync(t => t.FaseId == faseId);
        var maxOrden   = existentes.Any() ? existentes.Max(t => t.Orden) : 0;

        var tarea = new TareaFase
        {
            FaseId        = faseId,
            Nombre        = req.Nombre,
            Descripcion   = req.Descripcion,
            FechaInicio   = req.FechaInicio,
            FechaFin      = req.FechaFin,
            Estado        = EstadoFase.Pendiente,
            ResponsableId = req.ResponsableId,
            Orden         = maxOrden + 1,
            Completada    = false,
        };

        await _uow.TareasFase.AddAsync(tarea);

        // Recalcular porcentaje de la fase
        await RecalcularPorcentajeFase(fase, existentes.ToList(), tarea, false);
        await _uow.SaveChangesAsync();

        return Ok(MapTarea(tarea));
    }

    // ── PUT /api/cronograma/tareas/{id}  ─────────────────────────────────────
    [HttpPut("tareas/{id}")]
    public async Task<IActionResult> UpdateTarea(int id, [FromBody] TareaUpdateRequest req)
    {
        var tarea = await _uow.TareasFase.GetByIdAsync(id);
        if (tarea is null) return NotFound();

        var fase = await _uow.FasesProyecto.GetByIdAsync(tarea.FaseId);
        if (fase is null) return NotFound();
        if (!await TieneAccesoConstructor(fase.ProyectoId)) return Forbid();

        tarea.Nombre        = req.Nombre        ?? tarea.Nombre;
        tarea.Descripcion   = req.Descripcion   ?? tarea.Descripcion;
        tarea.FechaInicio   = req.FechaInicio   ?? tarea.FechaInicio;
        tarea.FechaFin      = req.FechaFin      ?? tarea.FechaFin;
        tarea.Estado        = req.Estado        ?? tarea.Estado;
        tarea.ResponsableId = req.ResponsableId ?? tarea.ResponsableId;
        tarea.Completada    = req.Completada    ?? tarea.Completada;
        if (tarea.Completada) tarea.Estado = EstadoFase.Completada;

        await _uow.TareasFase.UpdateAsync(tarea);

        // Recalcular porcentaje de la fase
        var todasTareas = (await _uow.TareasFase.FindAsync(t => t.FaseId == tarea.FaseId)).ToList();
        var completadas = todasTareas.Count(t => t.Id == id ? tarea.Completada : t.Completada);
        fase.PorcentajeCompletado = todasTareas.Count == 0 ? 0
            : (int)Math.Round((double)completadas / todasTareas.Count * 100);

        if (fase.PorcentajeCompletado == 100) fase.Estado = EstadoFase.Completada;
        else if (fase.PorcentajeCompletado > 0 && fase.Estado == EstadoFase.Pendiente)
            fase.Estado = EstadoFase.EnProgreso;

        fase.FechaActualizacion = DateTime.UtcNow;
        await _uow.FasesProyecto.UpdateAsync(fase);
        await _uow.SaveChangesAsync();

        return Ok(MapTarea(tarea));
    }

    // ── DELETE /api/cronograma/tareas/{id}  ──────────────────────────────────
    [HttpDelete("tareas/{id}")]
    public async Task<IActionResult> DeleteTarea(int id)
    {
        var tarea = await _uow.TareasFase.GetByIdAsync(id);
        if (tarea is null) return NotFound();

        var fase = await _uow.FasesProyecto.GetByIdAsync(tarea.FaseId);
        if (fase is null) return NotFound();
        if (!await TieneAccesoConstructor(fase.ProyectoId)) return Forbid();

        await _uow.TareasFase.DeleteAsync(tarea);

        // Recalcular porcentaje
        var restantes = (await _uow.TareasFase.FindAsync(t => t.FaseId == tarea.FaseId)).ToList();
        fase.PorcentajeCompletado = restantes.Count == 0 ? 0
            : (int)Math.Round((double)restantes.Count(t => t.Completada) / restantes.Count * 100);
        fase.FechaActualizacion = DateTime.UtcNow;
        await _uow.FasesProyecto.UpdateAsync(fase);
        await _uow.SaveChangesAsync();

        return NoContent();
    }

    // ── PUT /api/cronograma/fases/{id}/orden  ────────────────────────────────
    // Reordenar fases (drag & drop en Gantt)
    [HttpPut("fases/{id}/orden")]
    public async Task<IActionResult> ReordenarFase(int id, [FromBody] ReordenarRequest req)
    {
        var fase = await _uow.FasesProyecto.GetByIdAsync(id);
        if (fase is null) return NotFound();
        if (!await TieneAccesoConstructor(fase.ProyectoId)) return Forbid();

        fase.Orden = req.NuevoOrden;
        fase.FechaActualizacion = DateTime.UtcNow;
        await _uow.FasesProyecto.UpdateAsync(fase);
        await _uow.SaveChangesAsync();

        return Ok(new { message = "Orden actualizado." });
    }

    // ── PUT /api/cronograma/avances/{avanceId}/fase  ──────────────────────────
    // Vincular un AvanceObra a una FaseProyecto
    [HttpPut("avances/{avanceId}/fase")]
    public async Task<IActionResult> VincularAvance(int avanceId, [FromBody] VincularAvanceRequest req)
    {
        var avance = await _uow.AvancesObra.GetByIdAsync(avanceId);
        if (avance is null) return NotFound();

        if (req.FaseId.HasValue)
        {
            var fase = await _uow.FasesProyecto.GetByIdAsync(req.FaseId.Value);
            if (fase is null || fase.ProyectoId != avance.ProyectoId) return BadRequest(new { message = "Fase inválida." });
        }

        avance.FaseId = req.FaseId;
        await _uow.AvancesObra.UpdateAsync(avance);
        await _uow.SaveChangesAsync();

        return Ok(new { message = "Avance vinculado.", avance.FaseId });
    }

    // ── GET /api/cronograma/dashboard  ────────────────────────────────────────
    // Resumen de fases para widgets del dashboard (próximas, atrasadas, completadas)
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var user = await _users.FindByIdAsync(UserId.ToString());
        if (user is null) return Unauthorized();

        IEnumerable<int> proyectoIds;

        if (user.Rol == Rol.Constructor)
        {
            var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
            var perfil   = perfiles.FirstOrDefault();
            if (perfil is null) return Ok(new { proximas = Array.Empty<object>(), atrasadas = Array.Empty<object>() });

            var propuestas = await _uow.Propuestas.FindAsync(p =>
                p.ConstructorId == perfil.Id &&
                (p.Estado == EstadoPropuesta.Aceptada || p.Estado == EstadoPropuesta.Finalizada));
            proyectoIds = propuestas.Select(p => p.ProyectoId).Distinct();
        }
        else
        {
            var proyectos = await _uow.Proyectos.FindAsync(p => p.ClienteId == UserId);
            proyectoIds = proyectos.Select(p => p.Id);
        }

        var pidSet = proyectoIds.ToHashSet();
        if (!pidSet.Any()) return Ok(new { proximas = Array.Empty<object>(), atrasadas = Array.Empty<object>() });

        var todasFases = await _uow.FasesProyecto.FindAsync(f => pidSet.Contains(f.ProyectoId));
        var ahora      = DateTime.UtcNow;

        var proximas   = todasFases
            .Where(f => f.Estado != EstadoFase.Completada && f.Estado != EstadoFase.Cancelada
                     && f.FechaFin >= ahora && f.FechaFin <= ahora.AddDays(7))
            .OrderBy(f => f.FechaFin)
            .Take(5)
            .Select(f => new { f.Id, f.Nombre, f.ProyectoId, f.FechaFin, f.Estado, f.PorcentajeCompletado, f.Color });

        var atrasadas  = todasFases
            .Where(f => f.Estado != EstadoFase.Completada && f.Estado != EstadoFase.Cancelada
                     && f.FechaFin < ahora)
            .OrderBy(f => f.FechaFin)
            .Take(5)
            .Select(f => new { f.Id, f.Nombre, f.ProyectoId, f.FechaFin, f.Estado, f.PorcentajeCompletado, f.Color });

        var completadas = todasFases
            .Where(f => f.Estado == EstadoFase.Completada)
            .OrderByDescending(f => f.FechaActualizacion)
            .Take(5)
            .Select(f => new { f.Id, f.Nombre, f.ProyectoId, f.FechaFin, f.Estado, f.PorcentajeCompletado, f.Color });

        return Ok(new { proximas, atrasadas, completadas });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<bool> TieneAcceso(int proyectoId)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return false;
        if (proyecto.ClienteId == UserId) return true;

        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        var perfil   = perfiles.FirstOrDefault();
        if (perfil is null) return false;

        var propuestas = await _uow.Propuestas.FindAsync(p =>
            p.ProyectoId == proyectoId && p.ConstructorId == perfil.Id);
        return propuestas.Any();
    }

    private async Task<bool> TieneAccesoConstructor(int proyectoId)
    {
        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        var perfil   = perfiles.FirstOrDefault();
        if (perfil is null) return false;

        var propuestas = await _uow.Propuestas.FindAsync(p =>
            p.ProyectoId == proyectoId && p.ConstructorId == perfil.Id);
        return propuestas.Any();
    }

    private static Task RecalcularPorcentajeFase(FaseProyecto fase, List<TareaFase> existentes, TareaFase nueva, bool nuevaCompletada)
    {
        var total       = existentes.Count + 1;
        var completadas = existentes.Count(t => t.Completada) + (nuevaCompletada ? 1 : 0);
        fase.PorcentajeCompletado = (int)Math.Round((double)completadas / total * 100);
        return Task.CompletedTask;
    }

    private static object MapFase(FaseProyecto f, Dictionary<int, IEnumerable<object>> tareasPorFase)
    {
        tareasPorFase.TryGetValue(f.Id, out var tareas);
        return new
        {
            f.Id,
            f.ProyectoId,
            f.Nombre,
            f.Descripcion,
            f.FechaInicio,
            f.FechaFin,
            f.Estado,
            f.PorcentajeCompletado,
            f.ResponsableId,
            f.Orden,
            f.Color,
            f.FechaCreacion,
            f.FechaActualizacion,
            Tareas = tareas ?? Enumerable.Empty<object>(),
        };
    }

    private static object MapTarea(TareaFase t) => new
    {
        t.Id,
        t.FaseId,
        t.Nombre,
        t.Descripcion,
        t.FechaInicio,
        t.FechaFin,
        t.Estado,
        t.ResponsableId,
        t.Orden,
        t.Completada,
    };
}

// ── Records ───────────────────────────────────────────────────────────────────

public record FaseRequest(
    int       ProyectoId,
    string    Nombre,
    string?   Descripcion,
    DateTime  FechaInicio,
    DateTime  FechaFin,
    int?      ResponsableId,
    string?   Color
);

public record FaseUpdateRequest(
    string?     Nombre,
    string?     Descripcion,
    DateTime?   FechaInicio,
    DateTime?   FechaFin,
    EstadoFase? Estado,
    int?        PorcentajeCompletado,
    int?        ResponsableId,
    string?     Color
);

public record TareaRequest(
    string    Nombre,
    string?   Descripcion,
    DateTime? FechaInicio,
    DateTime? FechaFin,
    int?      ResponsableId
);

public record TareaUpdateRequest(
    string?     Nombre,
    string?     Descripcion,
    DateTime?   FechaInicio,
    DateTime?   FechaFin,
    EstadoFase? Estado,
    int?        ResponsableId,
    bool?       Completada
);

public record ReordenarRequest(int NuevoOrden);

public record VincularAvanceRequest(int? FaseId);

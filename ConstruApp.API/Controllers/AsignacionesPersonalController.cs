using System.Data;
using System.Security.Claims;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using ConstruApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.API.Controllers;

[ApiController]
[Authorize]
[Route("api/empleados")]
public sealed class AsignacionesPersonalController(AppDbContext db, IUnitOfWork uow,
    AccesoProyectoService acceso) : ControllerBase
{
    [HttpGet("proyecto/{proyectoId:int}")]
    public async Task<IActionResult> Listar(int proyectoId)
    {
        var proyecto = await uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();
        if (!User.IsInRole("Admin") && proyecto.ClienteId != UsuarioId &&
            !await acceso.ConstructorAsignadoAsync(proyecto, User)) return Forbid();
        var asignaciones = await db.AsignacionesEmpleado.AsNoTracking().Include(a => a.Empleado)
            .Where(a => a.ProyectoId == proyectoId).OrderBy(a => a.Empleado.Nombre).ToListAsync();
        return Ok(asignaciones.Select(Mapear));
    }

    [HttpPost("asignar")]
    [Authorize(Roles = "Constructor,Admin")]
    public async Task<IActionResult> Asignar(AsignarPersonalRequest req, CancellationToken ct)
    {
        if (req.Notas?.Length > 500) return BadRequest(new { message = "Las notas admiten hasta 500 caracteres." });
        await using var transaccion = db.Database.IsRelational()
            ? await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct) : null;
        var proyecto = await db.Proyectos.FindAsync([req.ProyectoId], ct);
        if (proyecto is null) return NotFound();
        if (!User.IsInRole("Admin") && !await acceso.ConstructorAsignadoAsync(proyecto, User)) return Forbid();
        if (proyecto.Estado != EstadoProyecto.EnCurso)
            return Conflict(new { message = "Solo podés asignar personal a una obra en curso." });
        var empleado = await db.Empleados.Include(e => e.Constructor).SingleOrDefaultAsync(e => e.Id == req.EmpleadoId, ct);
        if (empleado is null) return NotFound();
        var constructorAsignado = await db.Propuestas.AnyAsync(p => p.ProyectoId == proyecto.Id &&
            p.ConstructorId == empleado.ConstructorId && p.Estado == EstadoPropuesta.Aceptada, ct);
        if (!constructorAsignado || (!User.IsInRole("Admin") && empleado.Constructor.UsuarioId != UsuarioId)) return Forbid();
        var asignada = await db.AsignacionesEmpleado.Include(a => a.Empleado)
            .SingleOrDefaultAsync(a => a.ProyectoId == proyecto.Id && a.EmpleadoId == empleado.Id, ct);
        if (asignada is not null) return Ok(Mapear(asignada));
        if (!empleado.Activo || await db.AsignacionesEmpleado.AnyAsync(a => a.EmpleadoId == empleado.Id &&
            a.ProyectoId != proyecto.Id && a.Proyecto.Estado == EstadoProyecto.EnCurso, ct))
            return Conflict(new { message = "El trabajador no está disponible. Revisá sus asignaciones y su estado." });
        var nueva = new AsignacionEmpleado { EmpleadoId = empleado.Id, Empleado = empleado,
            ProyectoId = proyecto.Id, Notas = req.Notas?.Trim() };
        db.AsignacionesEmpleado.Add(nueva);
        await db.SaveChangesAsync(ct);
        if (transaccion is not null) await transaccion.CommitAsync(ct);
        return Ok(Mapear(nueva));
    }

    [HttpDelete("asignar/{id:int}")]
    [Authorize(Roles = "Constructor,Admin")]
    public async Task<IActionResult> Quitar(int id)
    {
        var asignacion = await db.AsignacionesEmpleado.Include(a => a.Proyecto)
            .Include(a => a.Empleado).ThenInclude(e => e.Constructor).SingleOrDefaultAsync(a => a.Id == id);
        if (asignacion is null) return NotFound();
        if (!User.IsInRole("Admin") && (asignacion.Empleado.Constructor.UsuarioId != UsuarioId ||
            !await acceso.ConstructorAsignadoAsync(asignacion.Proyecto, User))) return Forbid();
        db.AsignacionesEmpleado.Remove(asignacion);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private int UsuarioId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private static object Mapear(AsignacionEmpleado a) => new
    {
        a.Id, a.ProyectoId, a.EmpleadoId, a.FechaAsignacion, a.Notas,
        a.Empleado.Nombre, a.Empleado.Rol, a.Empleado.Puesto, a.Empleado.Activo
    };
}

public sealed record AsignarPersonalRequest(int ProyectoId, int EmpleadoId, string? Notas);

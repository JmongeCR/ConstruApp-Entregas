using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/carta-aceptacion")]
[Authorize]
public class CartaAceptacionController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    public CartaAceptacionController(IUnitOfWork uow) => _uow = uow;
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET api/carta-aceptacion/proyecto/{proyectoId}
    [HttpGet("proyecto/{proyectoId}")]
    public async Task<IActionResult> GetByProyecto(int proyectoId)
    {
        var cartas = await _uow.CartasAceptacion.FindAsync(c => c.ProyectoId == proyectoId);
        var carta = cartas.FirstOrDefault();
        if (carta is null) return NotFound(new { message = "Carta no generada aún." });

        // Enriquecer con datos del proyecto y propuesta
        var proyecto = await _uow.Proyectos.GetByIdAsync(carta.ProyectoId);
        var propuesta = await _uow.Propuestas.GetByIdAsync(carta.PropuestaId);

        // Avances del proyecto
        var avances = await _uow.AvancesObra.FindAsync(a => a.ProyectoId == proyectoId);

        // Equipo asignado
        var asignaciones = await _uow.AsignacionesEmpleado.FindAsync(a => a.ProyectoId == proyectoId);
        var empIds = asignaciones.Select(a => a.EmpleadoId).ToList();
        var empleados = empIds.Any()
            ? await _uow.Empleados.FindAsync(e => empIds.Contains(e.Id))
            : [];

        return Ok(MapFull(carta, proyecto, propuesta, avances, empleados));
    }

    // POST api/carta-aceptacion/generar/{proyectoId}  (constructor genera la carta)
    [HttpPost("generar/{proyectoId}")]
    public async Task<IActionResult> Generar(int proyectoId)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound(new { message = "Proyecto no encontrado." });

        // Solo cuando el proyecto esté Completado
        if (proyecto.Estado != EstadoProyecto.Completado)
            return BadRequest(new { message = "El proyecto debe estar completado para generar la carta." });

        // Verificar que el constructor tiene propuesta finalizada en este proyecto
        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        var perfil = perfiles.FirstOrDefault();
        if (perfil is null) return Forbid();

        var propuestas = await _uow.Propuestas.FindAsync(p =>
            p.ProyectoId == proyectoId && p.ConstructorId == perfil.Id &&
            p.Estado == EstadoPropuesta.Finalizada);

        var propuesta = propuestas.FirstOrDefault();
        if (propuesta is null)
            return Forbid();

        // Verificar que no existe ya
        var existe = await _uow.CartasAceptacion.FindAsync(c => c.ProyectoId == proyectoId);
        if (existe.Any())
            return Conflict(new { message = "La carta ya fue generada." });

        var carta = new CartaAceptacion
        {
            ProyectoId  = proyectoId,
            PropuestaId = propuesta.Id,
        };

        await _uow.CartasAceptacion.AddAsync(carta);
        await _uow.SaveChangesAsync();

        // Enriquecer respuesta
        var avances = await _uow.AvancesObra.FindAsync(a => a.ProyectoId == proyectoId);
        var asignaciones = await _uow.AsignacionesEmpleado.FindAsync(a => a.ProyectoId == proyectoId);
        var empIds = asignaciones.Select(a => a.EmpleadoId).ToList();
        var empleados = empIds.Any()
            ? await _uow.Empleados.FindAsync(e => empIds.Contains(e.Id))
            : [];

        return Ok(MapFull(carta, proyecto, propuesta, avances, empleados));
    }

    // PUT api/carta-aceptacion/{id}/aceptar  (cliente acepta la carta)
    [HttpPut("{id}/aceptar")]
    public async Task<IActionResult> Aceptar(int id, [FromBody] AceptarCartaRequest req)
    {
        var carta = await _uow.CartasAceptacion.GetByIdAsync(id);
        if (carta is null) return NotFound();

        var proyecto = await _uow.Proyectos.GetByIdAsync(carta.ProyectoId);
        if (proyecto?.ClienteId != UserId) return Forbid();

        carta.Aceptado              = true;
        carta.ObservacionesCliente  = req.Observaciones;
        carta.FechaAceptacion       = DateTime.UtcNow;
        await _uow.CartasAceptacion.UpdateAsync(carta);
        await _uow.SaveChangesAsync();

        return Ok(new { message = "Carta aceptada. Obra oficialmente cerrada.", carta.Id, carta.Aceptado, carta.FechaAceptacion });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private static object MapFull(
        CartaAceptacion carta,
        Proyecto? proyecto,
        Propuesta? propuesta,
        IEnumerable<AvanceObra> avances,
        IEnumerable<Empleado> empleados) => new
    {
        carta.Id,
        carta.ProyectoId,
        carta.PropuestaId,
        carta.ObservacionesCliente,
        carta.Aceptado,
        carta.FechaEmision,
        carta.FechaAceptacion,
        Proyecto = proyecto is null ? null : new
        {
            proyecto.Id, proyecto.Titulo, proyecto.Descripcion,
            proyecto.Canton, proyecto.Provincia,
            TipoProyecto = proyecto.TipoProyecto.ToString(),
            proyecto.FechaInicio, proyecto.FechaFin,
        },
        Propuesta = propuesta is null ? null : new
        {
            propuesta.Id, propuesta.MontoTotal, propuesta.Descripcion,
            propuesta.Incluye, propuesta.PlazoEstimadoDias,
        },
        Avances = avances.OrderBy(a => a.Fecha).Select(a => new
        {
            a.Id, a.Descripcion, a.PorcentajeAvance, a.Fecha,
        }),
        Equipo = empleados.Select(e => new { e.Id, e.Nombre, e.Rol }),
    };
}

public record AceptarCartaRequest(string? Observaciones);

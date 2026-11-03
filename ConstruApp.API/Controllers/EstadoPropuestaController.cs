using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/propuestas/{id:int}")]
public sealed class EstadoPropuestaController(IUnitOfWork uow) : ControllerBase
{
    [HttpPut("estado")]
    [Authorize(Roles = "Cliente")]
    public async Task<IActionResult> CambiarEstado(int id, CambiarEstadoPropuestaRequest request)
    {
        if (!string.Equals(request.Estado, nameof(EstadoPropuesta.Rechazada), StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Esta acción solo permite rechazar una propuesta." });
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var usuarioId)) return Forbid();

        var propuesta = await uow.Propuestas.GetByIdAsync(id);
        if (propuesta is null) return NotFound();
        var proyecto = await uow.Proyectos.GetByIdAsync(propuesta.ProyectoId);
        if (proyecto is null) return NotFound();
        if (proyecto.ClienteId != usuarioId) return Forbid();
        if (propuesta.Estado == EstadoPropuesta.Rechazada) return NoContent();
        if (proyecto.Estado is not (EstadoProyecto.Publicado or EstadoProyecto.EnPropuestas) ||
            propuesta.Estado is not (EstadoPropuesta.Enviada or EstadoPropuesta.Vista))
            return Conflict(new { message = "Solo podés rechazar propuestas pendientes de un proyecto abierto a cotizaciones." });

        propuesta.Estado = EstadoPropuesta.Rechazada;
        propuesta.FechaRespuesta = DateTime.UtcNow;
        return await Guardar(usuarioId, propuesta, "RechazarPropuesta");
    }

    [HttpPut("finalizar")]
    [Authorize(Roles = "Constructor")]
    public async Task<IActionResult> Finalizar(int id)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var usuarioId)) return Forbid();
        var propuesta = await uow.Propuestas.GetByIdAsync(id);
        if (propuesta is null) return NotFound();
        var constructor = await uow.PerfilesConstructor.GetByIdAsync(propuesta.ConstructorId);
        if (constructor?.UsuarioId != usuarioId) return Forbid();
        var proyecto = await uow.Proyectos.GetByIdAsync(propuesta.ProyectoId);
        if (proyecto is null) return NotFound();
        if (propuesta.Estado == EstadoPropuesta.Finalizada && proyecto.Estado == EstadoProyecto.Completado)
            return NoContent();
        if (propuesta.Estado != EstadoPropuesta.Aceptada || proyecto.Estado != EstadoProyecto.EnCurso)
            return Conflict(new { message = "Solo podés finalizar una obra en curso con una propuesta aceptada." });

        propuesta.Estado = EstadoPropuesta.Finalizada;
        proyecto.Estado = EstadoProyecto.Completado;
        return await Guardar(usuarioId, propuesta, "FinalizarObra");
    }

    private async Task<IActionResult> Guardar(int usuarioId, Propuesta propuesta, string accion)
    {
        await uow.AuditoriaLogs.AddAsync(new AuditoriaLog
        {
            UsuarioId = usuarioId,
            UsuarioNombre = User.FindFirstValue("nombre") ?? "",
            Accion = accion,
            Modulo = "Propuestas",
            EntidadId = propuesta.Id.ToString(),
            Detalle = $"Proyecto {propuesta.ProyectoId}.",
        });
        try
        {
            await uow.SaveChangesAsync();
            return NoContent();
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new { message = "El estado cambió. Actualizá la página antes de volver a intentar." });
        }
    }
}

public sealed record CambiarEstadoPropuestaRequest(string? Estado);

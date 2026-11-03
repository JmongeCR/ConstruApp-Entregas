using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/proyectos/{proyectoId:int}/seleccionar-propuesta")]
[Authorize(Roles = "Cliente")]
public sealed class SeleccionPropuestaController(IUnitOfWork uow) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Seleccionar(int proyectoId, SeleccionPropuestaRequest request)
    {
        if (request.PropuestaId is null or <= 0)
            return BadRequest(new { message = "Elegí una propuesta antes de confirmar." });
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var usuarioId))
            return Forbid();

        var proyecto = await uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound(new { message = "No encontramos el proyecto." });
        if (proyecto.ClienteId != usuarioId) return Forbid();

        var propuesta = await uow.Propuestas.GetByIdAsync(request.PropuestaId.Value);
        if (propuesta is null || propuesta.ProyectoId != proyectoId)
            return NotFound(new { message = "La propuesta no pertenece a este proyecto." });

        if (propuesta.Estado == EstadoPropuesta.Aceptada && proyecto.Estado == EstadoProyecto.EnCurso)
            return Confirmacion(proyecto, propuesta);
        if (proyecto.Estado is not (EstadoProyecto.Publicado or EstadoProyecto.EnPropuestas) ||
            propuesta.Estado is not (EstadoPropuesta.Enviada or EstadoPropuesta.Vista) ||
            await uow.Propuestas.ExistsAsync(p => p.ProyectoId == proyectoId &&
                (p.Estado == EstadoPropuesta.Aceptada || p.Estado == EstadoPropuesta.Finalizada)))
            return Conflict(new { message = "La propuesta ya no está disponible para selección." });

        var constructor = await uow.PerfilesConstructor.GetByIdAsync(propuesta.ConstructorId);
        if (constructor is null)
            return Conflict(new { message = "El constructor de la propuesta no está disponible." });

        var ahora = DateTime.UtcNow;
        proyecto.Estado = EstadoProyecto.EnCurso;
        propuesta.Estado = EstadoPropuesta.Aceptada;
        propuesta.FechaRespuesta = ahora;
        foreach (var destinatario in new[] { usuarioId, constructor.UsuarioId }.Distinct())
        {
            await uow.Notificaciones.AddAsync(new Notificacion
            {
                UsuarioId = destinatario,
                ProyectoId = proyectoId,
                Tipo = "propuesta_aceptada",
                Titulo = "Propuesta confirmada",
                Mensaje = $"Se confirmó la propuesta #{propuesta.Id} para «{proyecto.Titulo}». La obra está en curso.",
                UrlDestino = $"/obra/{proyectoId}",
                FechaCreacion = ahora,
            });
        }
        await uow.AuditoriaLogs.AddAsync(new AuditoriaLog
        {
            UsuarioId = usuarioId,
            UsuarioNombre = User.FindFirstValue("nombre") ?? "",
            Accion = "SeleccionarPropuesta",
            Modulo = "Propuestas",
            EntidadId = propuesta.Id.ToString(),
            Detalle = $"Propuesta seleccionada para el proyecto {proyectoId}.",
            Fecha = ahora,
        });
        try
        {
            await uow.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new { message = "El proyecto o la propuesta cambió. Actualizá la página y revisá su estado." });
        }

        return Confirmacion(proyecto, propuesta);
    }

    private OkObjectResult Confirmacion(Proyecto proyecto, Propuesta propuesta) => Ok(new
    {
        proyectoId = proyecto.Id,
        propuestaId = propuesta.Id,
        estadoProyecto = proyecto.Estado.ToString(),
        estadoPropuesta = propuesta.Estado.ToString(),
        message = "Propuesta confirmada. La obra está en curso.",
    });
}

public sealed record SeleccionPropuestaRequest(int? PropuestaId);

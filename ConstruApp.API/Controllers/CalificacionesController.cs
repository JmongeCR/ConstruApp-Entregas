using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CalificacionesController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    public CalificacionesController(IUnitOfWork uow) => _uow = uow;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
        => Ok((await _uow.Calificaciones.GetAllAsync()).Select(Map));

    [HttpGet("usuario/{usuarioId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetByEvaluado(int usuarioId)
        => Ok((await _uow.Calificaciones.FindAsync(c => c.EvaluadoId == usuarioId)).Select(Map));

    [HttpGet("proyecto/{proyectoId}")]
    public async Task<IActionResult> GetByProyecto(int proyectoId)
        => Ok((await _uow.Calificaciones.FindAsync(c => c.ProyectoId == proyectoId)).Select(Map));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CalificacionRequest req)
    {
        // Solo cuando el proyecto esté completado
        var proyecto = await _uow.Proyectos.GetByIdAsync(req.ProyectoId);
        if (proyecto is null) return NotFound(new { message = "Proyecto no encontrado." });
        if (proyecto.Estado != ConstruApp.Core.Enums.EstadoProyecto.Completado)
            return BadRequest(new { message = "Solo podés calificar cuando el proyecto está completado." });
        if (proyecto.ClienteId != UserId)
            return Forbid();

        // Evitar duplicados
        var existe = await _uow.Calificaciones.FindAsync(c =>
            c.ProyectoId == req.ProyectoId && c.EvaluadorId == UserId && c.EvaluadoId == req.EvaluadoId);
        if (existe.Any())
            return Conflict(new { message = "Ya calificaste a este constructor." });

        var c = new Calificacion
        {
            ProyectoId  = req.ProyectoId,
            PropuestaId = req.PropuestaId,
            EvaluadorId = UserId,
            EvaluadoId  = req.EvaluadoId,
            Puntuacion  = Math.Clamp(req.Puntuacion, 1, 5),
            Comentario  = req.Comentario,
        };
        await _uow.Calificaciones.AddAsync(c);
        await _uow.SaveChangesAsync();
        return Ok(Map(c));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await _uow.Calificaciones.GetByIdAsync(id);
        if (c is null) return NotFound();
        await _uow.Calificaciones.DeleteAsync(c);
        await _uow.SaveChangesAsync();
        return NoContent();
    }

    private static object Map(Calificacion c) => new {
        c.Id, c.ProyectoId, c.PropuestaId,
        c.EvaluadorId, c.EvaluadoId,
        c.Puntuacion, c.Comentario, c.RespuestaComentario, c.Fecha,
    };
}

public record CalificacionRequest(int ProyectoId, int? PropuestaId, int EvaluadoId, int Puntuacion, string? Comentario);

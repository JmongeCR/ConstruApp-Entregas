using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Authorize]
[Route("api/propuestas")]
public sealed class PropuestasConsultaController(IUnitOfWork uow) : ControllerBase
{
    [HttpGet("proyecto/{proyectoId:int}")]
    [Authorize(Roles = "Cliente,Admin")]
    public async Task<IActionResult> PorProyecto(int proyectoId)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var usuarioId)) return Forbid();
        var proyecto = await uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();
        if (!User.IsInRole("Admin") && proyecto.ClienteId != usuarioId) return Forbid();
        var propuestas = (await uow.Propuestas.FindAsync(p => p.ProyectoId == proyectoId)).ToList();
        var ids = propuestas.Select(p => p.ConstructorId).Distinct().ToArray();
        var perfiles = (await uow.PerfilesConstructor.FindAsync(p => ids.Contains(p.Id))).ToDictionary(p => p.Id);
        return Ok(propuestas.OrderByDescending(p => p.FechaEnvio).ThenByDescending(p => p.Id)
            .Select(p => Mapear(p, perfiles.GetValueOrDefault(p.ConstructorId))));
    }

    [HttpGet("mis-propuestas")]
    [Authorize(Roles = "Constructor")]
    public async Task<IActionResult> MisPropuestas()
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var usuarioId)) return Forbid();
        var perfil = (await uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == usuarioId)).FirstOrDefault();
        if (perfil is null) return Ok(Array.Empty<object>());
        var propuestas = await uow.Propuestas.FindAsync(p => p.ConstructorId == perfil.Id);
        return Ok(propuestas.OrderByDescending(p => p.FechaEnvio).ThenByDescending(p => p.Id)
            .Select(p => Mapear(p, perfil)));
    }

    private static object Mapear(Propuesta p, PerfilConstructor? perfil) => new
    {
        p.Id, p.ProyectoId, p.ConstructorId, p.MontoTotal, p.Descripcion, p.Incluye,
        p.PlazoEstimadoDias, p.ArchivoUrl, p.FechaEnvio, p.FechaRespuesta,
        estado = p.Estado.ToString(),
        constructorUsuarioId = perfil?.UsuarioId,
        constructorNombre = perfil?.NombreEmpresa,
        constructorCalificacion = perfil?.CalificacionPromedio,
    };
}

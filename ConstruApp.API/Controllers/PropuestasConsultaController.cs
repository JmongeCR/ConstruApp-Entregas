using System.Security.Claims;
using System.Data;
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
[Route("api/propuestas")]
public sealed class PropuestasConsultaController(IUnitOfWork uow) : ControllerBase
{
    [HttpGet("solicitudes")]
    [Authorize(Roles = "Constructor")]
    public async Task<IActionResult> Solicitudes()
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var usuarioId)) return Forbid();
        var perfil = (await uow.PerfilesConstructor.FindAsync(c => c.UsuarioId == usuarioId)).FirstOrDefault();
        if (perfil is null) return Ok(Array.Empty<object>());
        var enviadas = (await uow.Propuestas.FindAsync(p => p.ConstructorId == perfil.Id))
            .Select(p => p.ProyectoId).ToHashSet();
        var solicitudes = await uow.Proyectos.FindAsync(p =>
            p.Estado == EstadoProyecto.Publicado || p.Estado == EstadoProyecto.EnPropuestas);
        return Ok(solicitudes.Where(p => !enviadas.Contains(p.Id))
            .OrderByDescending(p => p.FechaEnvioCotizacion ?? p.FechaPublicacion).ThenByDescending(p => p.Id)
            .Select(p => new { p.Id, p.Titulo, p.Descripcion, p.AreaM2, p.PresupuestoMax,
                p.Provincia, p.Canton, p.FechaEnvioCotizacion, tipoProyecto = p.TipoProyecto.ToString() }));
    }

    [HttpPost]
    [Authorize(Roles = "Constructor")]
    public async Task<IActionResult> Crear(CrearPropuestaRequest solicitud, [FromServices] AppDbContext db,
        CancellationToken ct)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var usuarioId)) return Forbid();
        var descripcion = solicitud.Descripcion?.Trim();
        var incluye = solicitud.Incluye?.Trim();
        if (solicitud.ProyectoId <= 0 || solicitud.MontoTotal is <= 0 or > 9999999999999999.99m ||
            solicitud.MontoTotal != decimal.Round(solicitud.MontoTotal, 2) || solicitud.PlazoEstimadoDias <= 0 ||
            string.IsNullOrEmpty(descripcion) || descripcion.Length > 3000 || incluye?.Length > 2000)
            return BadRequest(new { message = "Ingresá un proyecto válido, un monto positivo con hasta dos decimales, un plazo positivo y una descripción de hasta 3000 caracteres. El detalle de lo incluido admite hasta 2000 caracteres." });

        var perfil = (await uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == usuarioId)).FirstOrDefault();
        if (perfil is null) return Forbid();

        await using var transaccion = db.Database.IsRelational()
            ? await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, ct)
            : null;
        var proyecto = await uow.Proyectos.GetByIdAsync(solicitud.ProyectoId);
        if (proyecto is null) return NotFound(new { message = "No encontramos el proyecto." });
        if (proyecto.Estado is not (EstadoProyecto.Publicado or EstadoProyecto.EnPropuestas))
            return Conflict(new { message = "El proyecto ya no recibe cotizaciones." });

        var propuesta = new Propuesta
        {
            ProyectoId = proyecto.Id,
            ConstructorId = perfil.Id,
            MontoTotal = solicitud.MontoTotal,
            PlazoEstimadoDias = solicitud.PlazoEstimadoDias,
            Descripcion = descripcion,
            Incluye = string.IsNullOrEmpty(incluye) ? null : incluye,
            Estado = EstadoPropuesta.Enviada,
        };
        await uow.Propuestas.AddAsync(propuesta);
        await uow.SaveChangesAsync();
        if (transaccion is not null) await transaccion.CommitAsync(ct);

        return CreatedAtAction(nameof(MisPropuestas), Mapear(propuesta, perfil));
    }

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

public sealed record CrearPropuestaRequest(int ProyectoId, decimal MontoTotal, string? Descripcion,
    string? Incluye, int PlazoEstimadoDias);

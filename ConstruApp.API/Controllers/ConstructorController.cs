using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/constructor")]
[Authorize(Roles = "Constructor")]
public class ConstructorController : ControllerBase
{
    private readonly IUnitOfWork            _uow;
    private readonly UserManager<Usuario>   _userManager;

    public ConstructorController(IUnitOfWork uow, UserManager<Usuario> userManager)
    {
        _uow         = uow;
        _userManager = userManager;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>
    /// Panel del constructor: estadísticas + lista de clientes/proyectos enriquecida.
    /// GET /api/constructor/dashboard
    /// </summary>
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        // Perfil del constructor autenticado
        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        var perfil   = perfiles.FirstOrDefault();
        if (perfil is null)
            return BadRequest(new { message = "No tenés perfil de constructor activo." });

        // Todas mis propuestas
        var propuestas = (await _uow.Propuestas.FindAsync(p => p.ConstructorId == perfil.Id)).ToList();

        // Proyectos relacionados
        var proyectoIds = propuestas.Select(p => p.ProyectoId).Distinct().ToList();
        var proyectos   = proyectoIds.Any()
            ? (await _uow.Proyectos.FindAsync(p => proyectoIds.Contains(p.Id))).ToDictionary(p => p.Id)
            : new Dictionary<int, Proyecto>();

        // Datos de los clientes
        var clienteIds = proyectos.Values.Select(p => p.ClienteId).Distinct().ToList();
        var clientes   = clienteIds.Any()
            ? await _userManager.Users.Where(u => clienteIds.Contains(u.Id)).ToListAsync()
            : new List<Usuario>();
        var clientesDict = clientes.ToDictionary(u => u.Id);

        // Calificaciones recibidas por este constructor
        var califs = await _uow.Calificaciones.FindAsync(c => c.EvaluadoId == UserId);

        // ── Estadísticas ──────────────────────────────────────────────────────
        var activas      = propuestas.Where(p => p.Estado == EstadoPropuesta.Aceptada).ToList();
        var finalizadas  = propuestas.Where(p => p.Estado == EstadoPropuesta.Finalizada).ToList();
        var completadas  = finalizadas.Where(p =>
            proyectos.TryGetValue(p.ProyectoId, out var pr) &&
            pr.Estado == EstadoProyecto.Completado).ToList();

        var stats = new
        {
            TotalPropuestas    = propuestas.Count,
            Enviadas           = propuestas.Count(p => p.Estado == EstadoPropuesta.Enviada),
            Aceptadas          = activas.Count,
            Completadas        = completadas.Count,
            FacturacionActiva  = activas.Sum(p => p.MontoTotal),
            FacturacionTotal   = activas.Concat(finalizadas).Sum(p => p.MontoTotal),
            CalificacionPromedio = califs.Any() ? Math.Round(califs.Average(c => (double)c.Puntuacion), 1) : (double?)null,
            TotalCalificaciones  = califs.Count(),
        };

        // ── Lista de clientes / proyectos enriquecida ─────────────────────────
        var lista = propuestas
            .Where(p => p.Estado != EstadoPropuesta.Retirada)
            .OrderByDescending(p => p.FechaEnvio)
            .Select(p =>
            {
                var proyecto = proyectos.GetValueOrDefault(p.ProyectoId);
                var cliente  = proyecto is not null ? clientesDict.GetValueOrDefault(proyecto.ClienteId) : null;

                int? diasTranscurridos = proyecto?.FechaInicio is not null
                    ? (int)(DateTime.UtcNow - proyecto.FechaInicio.Value).TotalDays
                    : null;
                int? diasRestantes = proyecto?.FechaInicio is not null
                    ? p.PlazoEstimadoDias - diasTranscurridos
                    : null;

                return new
                {
                    // Propuesta
                    PropuestaId        = p.Id,
                    EstadoPropuesta    = p.Estado.ToString(),
                    MontoTotal         = p.MontoTotal,
                    PlazoEstimadoDias  = p.PlazoEstimadoDias,
                    FechaEnvio         = p.FechaEnvio,
                    // Proyecto
                    ProyectoId         = p.ProyectoId,
                    ProyectoTitulo     = proyecto?.Titulo,
                    TipoProyecto       = proyecto?.TipoProyecto.ToString(),
                    Canton             = proyecto?.Canton,
                    Provincia          = proyecto?.Provincia,
                    AreaM2             = proyecto?.AreaM2,
                    EstadoProyecto     = proyecto?.Estado.ToString(),
                    FechaInicio        = proyecto?.FechaInicio,
                    FechaFin           = proyecto?.FechaFin,
                    DiasTranscurridos  = diasTranscurridos,
                    DiasRestantes      = diasRestantes,
                    // Cliente
                    ClienteId          = proyecto?.ClienteId,
                    ClienteNombre      = cliente?.Nombre,
                    ClienteEmail       = cliente?.Email,
                    ClienteTelefono    = cliente?.Telefono,
                };
            }).ToList();

        return Ok(new { stats, clientes = lista });
    }
}

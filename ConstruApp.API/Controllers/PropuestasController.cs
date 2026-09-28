using System.Security.Claims;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PropuestasController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly UserManager<Usuario> _userManager;
    private readonly IEmailService _email;
    private readonly INotificacionService _notif;

    public PropuestasController(IUnitOfWork uow, UserManager<Usuario> userManager, IEmailService email, INotificacionService notif)
    {
        _uow         = uow;
        _userManager = userManager;
        _email       = email;
        _notif       = notif;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET api/propuestas/proyecto/{proyectoId}
    [HttpGet("proyecto/{proyectoId}")]
    public async Task<IActionResult> GetByProyecto(int proyectoId)
    {
        var propuestas = await _uow.Propuestas.FindAsync(p => p.ProyectoId == proyectoId);
        var perfilesMap = await BuildPerfilesMap(propuestas.Select(p => p.ConstructorId));
        return Ok(propuestas.Select(p => Map(p, perfilesMap)));
    }

    // GET api/propuestas/mis-propuestas  (constructor ve las suyas)
    [HttpGet("mis-propuestas")]
    public async Task<IActionResult> GetMias()
    {
        // Buscar el perfil constructor del usuario actual
        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        var perfil = perfiles.FirstOrDefault();
        if (perfil is null)
            return BadRequest(new { message = "No tenés perfil de constructor activo." });

        var propuestas = await _uow.Propuestas.FindAsync(p => p.ConstructorId == perfil.Id);
        var perfilesMap = await BuildPerfilesMap(propuestas.Select(p => p.ConstructorId));
        return Ok(propuestas.Select(p => Map(p, perfilesMap)));
    }

    // GET api/propuestas/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _uow.Propuestas.GetByIdAsync(id);
        if (p is null) return NotFound();
        var perfilesMap = await BuildPerfilesMap([p.ConstructorId]);
        return Ok(Map(p, perfilesMap));
    }

    // POST api/propuestas
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PropuestaRequest req)
    {
        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        var perfil = perfiles.FirstOrDefault();
        if (perfil is null)
            return BadRequest(new { message = "Necesitás un perfil de constructor para enviar propuestas." });

        // Verificar que no haya enviado ya una propuesta al mismo proyecto
        var existente = await _uow.Propuestas.FindAsync(
            p => p.ProyectoId == req.ProyectoId && p.ConstructorId == perfil.Id);
        if (existente.Any())
            return Conflict(new { message = "Ya enviaste una propuesta a este proyecto." });

        var propuesta = new Propuesta
        {
            ProyectoId        = req.ProyectoId,
            ConstructorId     = perfil.Id,
            MontoTotal        = req.MontoTotal,
            Descripcion       = req.Descripcion,
            Incluye           = req.Incluye,
            PlazoEstimadoDias = req.PlazoEstimadoDias,
            Estado            = EstadoPropuesta.Enviada,
        };

        await _uow.Propuestas.AddAsync(propuesta);
        await _uow.SaveChangesAsync();

        // Construir mapa ANTES del fire-and-forget para evitar DbContext concurrente
        var perfilesMap = await BuildPerfilesMap([propuesta.ConstructorId]);

        // Notificar al dueño del proyecto en tiempo real
        var proyecto = await _uow.Proyectos.GetByIdAsync(req.ProyectoId);
        if (proyecto is not null)
        {
            await _notif.CrearAsync(
                usuarioId:  proyecto.ClienteId,
                tipo:       "nueva_propuesta",
                titulo:     "Nueva propuesta recibida",
                mensaje:    $"{perfil.NombreEmpresa} envió una propuesta para tu proyecto.",
                urlDestino: $"/propuestas",
                proyectoId: req.ProyectoId);

            await _notif.EnviarAProyectoAsync(req.ProyectoId, "PropuestaCreada", Map(propuesta, perfilesMap));
        }

        // ── Email ─────────────────────────────────────────────────────────────
        _ = EnviarEmailNuevaPropuesta(propuesta, perfil);

        return CreatedAtAction(nameof(GetById), new { id = propuesta.Id }, Map(propuesta, perfilesMap));
    }

    // PUT api/propuestas/{id}/estado
    [HttpPut("{id}/estado")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoPropuestaRequest req)
    {
        var propuesta = await _uow.Propuestas.GetByIdAsync(id);
        if (propuesta is null) return NotFound();

        // El cliente acepta/rechaza; el constructor retira
        var proyecto = await _uow.Proyectos.GetByIdAsync(propuesta.ProyectoId);
        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        var perfil   = perfiles.FirstOrDefault();

        bool esCliente     = proyecto?.ClienteId == UserId;
        bool esConstructor = perfil?.Id == propuesta.ConstructorId;

        if (!esCliente && !esConstructor)
            return Forbid();

        propuesta.Estado          = req.Estado;
        propuesta.FechaRespuesta  = DateTime.UtcNow;
        await _uow.Propuestas.UpdateAsync(propuesta);

        // Si se acepta, poner proyecto en EnCurso
        if (req.Estado == EstadoPropuesta.Aceptada && proyecto != null)
        {
            proyecto.Estado     = EstadoProyecto.EnCurso;
            proyecto.FechaInicio = DateTime.UtcNow;
            await _uow.Proyectos.UpdateAsync(proyecto);
        }

        await _uow.SaveChangesAsync();

        // Construir mapa ANTES del fire-and-forget para evitar DbContext concurrente
        var pm = await BuildPerfilesMap([propuesta.ConstructorId]);

        // Notificar al constructor del resultado en tiempo real
        var perfilesNot = await _uow.PerfilesConstructor.FindAsync(p => p.Id == propuesta.ConstructorId);
        var perfilNot   = perfilesNot.FirstOrDefault();
        if (perfilNot is not null && req.Estado is EstadoPropuesta.Aceptada or EstadoPropuesta.Rechazada)
        {
            var (titulo, mensaje) = req.Estado == EstadoPropuesta.Aceptada
                ? ("¡Propuesta aceptada!", $"Tu propuesta para \"{proyecto?.Titulo}\" fue aceptada.")
                : ("Propuesta no seleccionada", $"Tu propuesta para \"{proyecto?.Titulo}\" no fue seleccionada.");

            await _notif.CrearAsync(
                usuarioId:  perfilNot.UsuarioId,
                tipo:       $"propuesta_{req.Estado.ToString().ToLower()}",
                titulo:     titulo,
                mensaje:    mensaje,
                urlDestino: "/mis-propuestas",
                proyectoId: propuesta.ProyectoId);
        }

        await _notif.EnviarAProyectoAsync(propuesta.ProyectoId, "PropuestaEstadoCambiado", Map(propuesta, pm));

        // ── Email: notificar al constructor del resultado ──────────────────────
        _ = EnviarEmailCambioEstado(propuesta, proyecto, req.Estado);

        return Ok(Map(propuesta, pm));
    }

    // PUT api/propuestas/{id}/finalizar  (constructor marca obra terminada)
    [HttpPut("{id}/finalizar")]
    public async Task<IActionResult> Finalizar(int id)
    {
        var propuesta = await _uow.Propuestas.GetByIdAsync(id);
        if (propuesta is null) return NotFound();
        if (propuesta.Estado != EstadoPropuesta.Aceptada)
            return BadRequest(new { message = "Solo se puede finalizar una propuesta aceptada." });

        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        if (!perfiles.Any(p => p.Id == propuesta.ConstructorId))
            return Forbid();

        // Marcar propuesta y proyecto
        propuesta.Estado         = EstadoPropuesta.Finalizada;
        propuesta.FechaRespuesta = DateTime.UtcNow;
        await _uow.Propuestas.UpdateAsync(propuesta);

        var proyecto = await _uow.Proyectos.GetByIdAsync(propuesta.ProyectoId);
        if (proyecto is not null)
        {
            proyecto.Estado  = EstadoProyecto.Completado;
            proyecto.FechaFin = DateTime.UtcNow;
            await _uow.Proyectos.UpdateAsync(proyecto);
        }

        await _uow.SaveChangesAsync();

        // Construir mapa ANTES del fire-and-forget para evitar DbContext concurrente
        var pm2 = await BuildPerfilesMap([propuesta.ConstructorId]);

        // Notificar al cliente que la obra finalizó en tiempo real
        if (proyecto is not null)
        {
            await _notif.CrearAsync(
                usuarioId:  proyecto.ClienteId,
                tipo:       "obra_finalizada",
                titulo:     "Obra finalizada",
                mensaje:    $"El constructor marcó como finalizada la obra \"{proyecto.Titulo}\". Ya podés calificarlo.",
                urlDestino: $"/obra/{proyecto.Id}",
                proyectoId: proyecto.Id);

            await _notif.EnviarAProyectoAsync(proyecto.Id, "ObraFinalizada", new { proyectoId = proyecto.Id });
        }

        // ── Email: notificar al cliente que la obra finalizó ───────────────────
        _ = EnviarEmailProyectoFinalizado(propuesta, proyecto);

        return Ok(new { message = "Obra finalizada. El cliente ya puede calificarte.", propuesta = Map(propuesta, pm2) });
    }

    // DELETE api/propuestas/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var propuesta = await _uow.Propuestas.GetByIdAsync(id);
        if (propuesta is null) return NotFound();

        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        if (!perfiles.Any(p => p.Id == propuesta.ConstructorId))
            return Forbid();

        await _uow.Propuestas.DeleteAsync(propuesta);
        await _uow.SaveChangesAsync();
        return NoContent();
    }

    // ── Helpers de email ──────────────────────────────────────────────────────

    private async Task EnviarEmailNuevaPropuesta(Propuesta propuesta, PerfilConstructor perfil)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(propuesta.ProyectoId);
        if (proyecto is null) return;
        var cliente = await _userManager.FindByIdAsync(proyecto.ClienteId.ToString());
        if (cliente?.Email is null) return;

        await _email.EnviarAsync(new EmailMessage(
            Para:        cliente.Email,
            Asunto:      $"Nueva propuesta recibida — {proyecto.Titulo}",
            HtmlBody:    EmailTemplates.NuevaPropuestaRecibida(
                             clienteNombre:      cliente.Nombre,
                             proyectoTitulo:     proyecto.Titulo,
                             constructorNombre:  perfil.NombreEmpresa,
                             monto:              propuesta.MontoTotal,
                             urlAccion:          $"/propuestas"),
            Evento:      "nueva_propuesta_recibida",
            ReferenciaId: propuesta.Id,
            UsuarioId:   proyecto.ClienteId
        ));
    }

    private async Task EnviarEmailCambioEstado(Propuesta propuesta, Proyecto? proyecto, EstadoPropuesta estado)
    {
        if (proyecto is null) return;
        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.Id == propuesta.ConstructorId);
        var perfil   = perfiles.FirstOrDefault();
        if (perfil is null) return;
        var constructor = await _userManager.FindByIdAsync(perfil.UsuarioId.ToString());
        if (constructor?.Email is null) return;

        var cliente = await _userManager.FindByIdAsync(proyecto.ClienteId.ToString());

        EmailMessage msg = estado switch
        {
            EstadoPropuesta.Aceptada => new EmailMessage(
                Para:        constructor.Email,
                Asunto:      $"¡Tu propuesta fue aceptada! — {proyecto.Titulo}",
                HtmlBody:    EmailTemplates.PropuestaAceptada(
                                 constructorNombre: perfil.NombreEmpresa,
                                 proyectoTitulo:    proyecto.Titulo,
                                 clienteNombre:     cliente?.Nombre ?? "el cliente",
                                 monto:             propuesta.MontoTotal,
                                 urlAccion:         $"/proyectos"),
                Evento:      "propuesta_aceptada",
                ReferenciaId: propuesta.Id,
                UsuarioId:   perfil.UsuarioId),

            EstadoPropuesta.Rechazada => new EmailMessage(
                Para:        constructor.Email,
                Asunto:      $"Propuesta no seleccionada — {proyecto.Titulo}",
                HtmlBody:    EmailTemplates.PropuestaRechazada(
                                 constructorNombre: perfil.NombreEmpresa,
                                 proyectoTitulo:    proyecto.Titulo,
                                 motivoRechazo:     "El cliente seleccionó otra propuesta.",
                                 urlAccion:         $"/propuestas"),
                Evento:      "propuesta_rechazada",
                ReferenciaId: propuesta.Id,
                UsuarioId:   perfil.UsuarioId),

            _ => null!
        };

        if (msg is not null)
            await _email.EnviarAsync(msg);
    }

    private async Task EnviarEmailProyectoFinalizado(Propuesta propuesta, Proyecto? proyecto)
    {
        if (proyecto is null) return;
        var cliente = await _userManager.FindByIdAsync(proyecto.ClienteId.ToString());
        if (cliente?.Email is null) return;

        await _email.EnviarAsync(new EmailMessage(
            Para:        cliente.Email,
            Asunto:      $"¡Tu proyecto ha finalizado! — {proyecto.Titulo}",
            HtmlBody:    EmailTemplates.ProyectoFinalizado(
                             clienteNombre:  cliente.Nombre,
                             proyectoTitulo: proyecto.Titulo,
                             urlAccion:      $"/proyectos/{proyecto.Id}"),
            Evento:      "proyecto_finalizado",
            ReferenciaId: proyecto.Id,
            UsuarioId:   proyecto.ClienteId
        ));
    }

    // Construye un diccionario constructorId → UsuarioId para un conjunto de constructorIds
    private async Task<Dictionary<int, int>> BuildPerfilesMap(IEnumerable<int> constructorIds)
    {
        var ids = constructorIds.Distinct().ToList();
        if (ids.Count == 0) return [];
        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => ids.Contains(p.Id));
        return perfiles.ToDictionary(p => p.Id, p => p.UsuarioId);
    }

    private static object Map(Propuesta p, Dictionary<int, int> perfilesMap) => new
    {
        p.Id, p.ProyectoId, p.ConstructorId,
        ConstructorUsuarioId = perfilesMap.GetValueOrDefault(p.ConstructorId, 0),
        p.MontoTotal, p.Descripcion, p.Incluye,
        p.PlazoEstimadoDias,
        Estado = p.Estado.ToString(),
        p.ArchivoUrl, p.FechaEnvio, p.FechaRespuesta,
    };
}

public record PropuestaRequest(
    int     ProyectoId,
    decimal MontoTotal,
    string  Descripcion,
    string? Incluye,
    int     PlazoEstimadoDias);

public record CambiarEstadoPropuestaRequest(EstadoPropuesta Estado);

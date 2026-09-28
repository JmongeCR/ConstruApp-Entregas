using System.Security.Claims;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/ordenes")]
[Authorize]
public class OrdenesController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly UserManager<Usuario> _users;
    private readonly IEmailService _email;

    public OrdenesController(IUnitOfWork uow, UserManager<Usuario> users, IEmailService email)
    {
        _uow   = uow;
        _users = users;
        _email = email;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET api/ordenes/proyecto/{pid}
    [HttpGet("proyecto/{proyectoId}")]
    public async Task<IActionResult> GetByProyecto(int proyectoId)
    {
        var ordenes = await _uow.OrdenesCambio.FindAsync(o => o.ProyectoId == proyectoId);
        return Ok(ordenes.OrderByDescending(o => o.FechaSolicitud).Select(Map));
    }

    // GET api/ordenes/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var o = await _uow.OrdenesCambio.GetByIdAsync(id);
        if (o is null) return NotFound();
        return Ok(Map(o));
    }

    // POST api/ordenes
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] OrdenCambioRequest req)
    {
        var o = new OrdenCambio
        {
            ProyectoId            = req.ProyectoId,
            SolicitadoPorId       = UserId,
            Titulo                = req.Titulo,
            Descripcion           = req.Descripcion,
            ImpactoEconomico      = req.ImpactoEconomico,
            ImpactoCronogramaDias = req.ImpactoCronogramaDias,
            Notas                 = req.Notas,
            Estado                = "Pendiente",
        };
        await _uow.OrdenesCambio.AddAsync(o);
        await _uow.SaveChangesAsync();
        return Ok(Map(o));
    }

    // PUT api/ordenes/{id}/estado
    [HttpPut("{id}/estado")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] OrdenEstadoRequest req)
    {
        var o = await _uow.OrdenesCambio.GetByIdAsync(id);
        if (o is null) return NotFound();

        if (req.Estado is not ("Aprobada" or "Rechazada" or "Pendiente"))
            return BadRequest(new { message = "Estado inválido. Use: Pendiente, Aprobada o Rechazada." });

        o.Estado          = req.Estado;
        o.AprobadoPorId   = req.Estado == "Pendiente" ? null : UserId;
        o.FechaResolucion = req.Estado == "Pendiente" ? null : DateTime.UtcNow;
        o.Notas           = req.Notas ?? o.Notas;

        _uow.OrdenesCambio.UpdateAsync(o);
        await _uow.SaveChangesAsync();

        // ── Email: notificar al solicitante de la resolución ───────────────────
        if (req.Estado is "Aprobada" or "Rechazada")
            _ = EnviarEmailOrdenResuelta(o);

        return Ok(Map(o));
    }

    // PUT api/ordenes/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] OrdenCambioRequest req)
    {
        var o = await _uow.OrdenesCambio.GetByIdAsync(id);
        if (o is null) return NotFound();
        if (o.Estado != "Pendiente")
            return BadRequest(new { message = "Solo se pueden editar órdenes en estado Pendiente." });

        o.Titulo                = req.Titulo;
        o.Descripcion           = req.Descripcion;
        o.ImpactoEconomico      = req.ImpactoEconomico;
        o.ImpactoCronogramaDias = req.ImpactoCronogramaDias;
        o.Notas                 = req.Notas;

        _uow.OrdenesCambio.UpdateAsync(o);
        await _uow.SaveChangesAsync();
        return Ok(Map(o));
    }

    // DELETE api/ordenes/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var o = await _uow.OrdenesCambio.GetByIdAsync(id);
        if (o is null) return NotFound();
        await _uow.OrdenesCambio.DeleteAsync(o);
        await _uow.SaveChangesAsync();
        return NoContent();
    }

    // ── Helpers de email ──────────────────────────────────────────────────────

    private async Task EnviarEmailOrdenResuelta(OrdenCambio o)
    {
        // Notificamos al solicitante de la orden
        var solicitante = await _users.FindByIdAsync(o.SolicitadoPorId.ToString());
        if (solicitante?.Email is null) return;

        var proyecto = await _uow.Proyectos.GetByIdAsync(o.ProyectoId);
        var proyTitulo = proyecto?.Titulo ?? "Proyecto";

        EmailMessage msg = o.Estado == "Aprobada"
            ? new EmailMessage(
                Para:        solicitante.Email,
                Asunto:      $"Orden de cambio aprobada — {proyTitulo}",
                HtmlBody:    EmailTemplates.OrdenCambioAprobada(
                                 constructorNombre: solicitante.Nombre,
                                 proyectoTitulo:    proyTitulo,
                                 descripcion:       o.Descripcion,
                                 montoExtra:        o.ImpactoEconomico,
                                 urlAccion:         $"/proyectos/{o.ProyectoId}"),
                Evento:      "orden_cambio_aprobada",
                ReferenciaId: o.Id,
                UsuarioId:   o.SolicitadoPorId)
            : new EmailMessage(
                Para:        solicitante.Email,
                Asunto:      $"Orden de cambio rechazada — {proyTitulo}",
                HtmlBody:    EmailTemplates.OrdenCambioRechazada(
                                 constructorNombre: solicitante.Nombre,
                                 proyectoTitulo:    proyTitulo,
                                 descripcion:       o.Descripcion,
                                 urlAccion:         $"/proyectos/{o.ProyectoId}"),
                Evento:      "orden_cambio_rechazada",
                ReferenciaId: o.Id,
                UsuarioId:   o.SolicitadoPorId);

        await _email.EnviarAsync(msg);
    }

    private static object Map(OrdenCambio o) => new
    {
        o.Id, o.ProyectoId, o.SolicitadoPorId, o.AprobadoPorId,
        o.Titulo, o.Descripcion, o.Estado,
        o.ImpactoEconomico, o.ImpactoCronogramaDias,
        o.Notas, o.FechaSolicitud, o.FechaResolucion,
        o.ArchivoEvidenciaUrl,
    };
}

public record OrdenCambioRequest(
    int     ProyectoId,
    string  Titulo,
    string  Descripcion,
    decimal ImpactoEconomico,
    int     ImpactoCronogramaDias,
    string? Notas = null);

public record OrdenEstadoRequest(string Estado, string? Notas = null);

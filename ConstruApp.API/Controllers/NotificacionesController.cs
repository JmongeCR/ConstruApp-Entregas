using System.Security.Claims;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Authorize]
[Route("api/notificaciones")]
public sealed class NotificacionesController(IUnitOfWork uow) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Listar(int pagina = 1, int tamano = 30)
    {
        if (!UsuarioActual(out var usuarioId)) return Forbid();
        if (pagina < 1 || tamano is < 1 or > 100 || (long)(pagina - 1) * tamano > int.MaxValue)
            return BadRequest();
        var notificaciones = await uow.Notificaciones.FindAsync(n => n.UsuarioId == usuarioId);
        return Ok(notificaciones.OrderByDescending(n => n.FechaCreacion).ThenByDescending(n => n.Id)
            .Skip((pagina - 1) * tamano).Take(tamano)
            .Select(n => new { n.Id, n.Tipo, n.Titulo, n.Mensaje, n.UrlDestino, n.Leida, n.FechaCreacion, n.ProyectoId }));
    }

    [HttpPut("{id:int}/leer")]
    public async Task<IActionResult> MarcarLeida(int id)
    {
        if (!UsuarioActual(out var usuarioId)) return Forbid();
        var notificacion = await uow.Notificaciones.GetByIdAsync(id);
        if (notificacion?.UsuarioId != usuarioId) return NotFound();
        notificacion.Leida = true;
        await uow.SaveChangesAsync();
        return NoContent();
    }

    [HttpPut("leer-todas")]
    public async Task<IActionResult> MarcarTodas()
    {
        if (!UsuarioActual(out var usuarioId)) return Forbid();
        foreach (var notificacion in await uow.Notificaciones.FindAsync(n => n.UsuarioId == usuarioId && !n.Leida))
        {
            notificacion.Leida = true;
            await uow.Notificaciones.UpdateAsync(notificacion);
        }
        await uow.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        if (!UsuarioActual(out var usuarioId)) return Forbid();
        var notificacion = await uow.Notificaciones.GetByIdAsync(id);
        if (notificacion?.UsuarioId != usuarioId) return NotFound();
        await uow.Notificaciones.DeleteAsync(notificacion);
        await uow.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("limpiar-leidas")]
    public async Task<IActionResult> LimpiarLeidas()
    {
        if (!UsuarioActual(out var usuarioId)) return Forbid();
        foreach (var notificacion in await uow.Notificaciones.FindAsync(n => n.UsuarioId == usuarioId && n.Leida))
            await uow.Notificaciones.DeleteAsync(notificacion);
        await uow.SaveChangesAsync();
        return NoContent();
    }

    private bool UsuarioActual(out int usuarioId) =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out usuarioId);
}

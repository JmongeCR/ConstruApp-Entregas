using ConstruApp.API.Hubs;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace ConstruApp.API.Services;

public class NotificacionService(IUnitOfWork uow, IHubContext<NotificacionHub> hub) : INotificacionService
{
    public async Task CrearAsync(
        int     usuarioId,
        string  tipo,
        string  titulo,
        string  mensaje,
        string? urlDestino = null,
        int?    proyectoId = null)
    {
        var notif = new Notificacion
        {
            UsuarioId     = usuarioId,
            Tipo          = tipo,
            Titulo        = titulo,
            Mensaje       = mensaje,
            UrlDestino    = urlDestino,
            ProyectoId    = proyectoId,
            FechaCreacion = DateTime.UtcNow,
        };
        await uow.Notificaciones.AddAsync(notif);
        await uow.SaveChangesAsync();

        // Empujar en tiempo real al grupo personal del usuario
        await hub.Clients
            .Group(NotificacionHub.GrupoUsuario(usuarioId))
            .SendAsync("NuevaNotificacion", new
            {
                id          = notif.Id,
                tipo        = notif.Tipo,
                titulo      = notif.Titulo,
                mensaje     = notif.Mensaje,
                urlDestino  = notif.UrlDestino,
                proyectoId  = notif.ProyectoId,
                leida       = false,
                fechaCreacion = notif.FechaCreacion,
            });
    }

    public async Task CrearParaVariosAsync(
        IEnumerable<int> usuarioIds,
        string  tipo,
        string  titulo,
        string  mensaje,
        string? urlDestino = null,
        int?    proyectoId = null)
    {
        var ahora = DateTime.UtcNow;
        var ids   = usuarioIds.Distinct().ToList();

        foreach (var uid in ids)
        {
            var notif = new Notificacion
            {
                UsuarioId     = uid,
                Tipo          = tipo,
                Titulo        = titulo,
                Mensaje       = mensaje,
                UrlDestino    = urlDestino,
                ProyectoId    = proyectoId,
                FechaCreacion = ahora,
            };
            await uow.Notificaciones.AddAsync(notif);
        }
        await uow.SaveChangesAsync();

        // Empujar en tiempo real a cada usuario
        var payload = new { tipo, titulo, mensaje, urlDestino, proyectoId, leida = false, fechaCreacion = ahora };
        var tareas  = ids.Select(uid =>
            hub.Clients
               .Group(NotificacionHub.GrupoUsuario(uid))
               .SendAsync("NuevaNotificacion", payload));
        await Task.WhenAll(tareas);
    }

    public Task EnviarAProyectoAsync(int proyectoId, string evento, object payload) =>
        hub.Clients
           .Group(NotificacionHub.GrupoProyecto(proyectoId))
           .SendAsync(evento, payload);

    public Task EnviarAUsuarioAsync(int usuarioId, string evento, object payload) =>
        hub.Clients
           .Group(NotificacionHub.GrupoUsuario(usuarioId))
           .SendAsync(evento, payload);
}

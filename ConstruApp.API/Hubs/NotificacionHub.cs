using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ConstruApp.API.Hubs;

[Authorize]
public class NotificacionHub : Hub
{
    // Nombre del grupo personal de cada usuario
    public static string GrupoUsuario(int userId) => $"user-{userId}";

    // Nombre del grupo de un proyecto (todos los participantes)
    public static string GrupoProyecto(int proyectoId) => $"proyecto-{proyectoId}";

    public override async Task OnConnectedAsync()
    {
        var userId = int.Parse(Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!);
        // Unir al grupo personal del usuario
        await Groups.AddToGroupAsync(Context.ConnectionId, GrupoUsuario(userId));
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = int.Parse(Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GrupoUsuario(userId));
        await base.OnDisconnectedAsync(exception);
    }

    // El cliente llama a este método para suscribirse a las actualizaciones de un proyecto
    public async Task UnirseAProyecto(int proyectoId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, GrupoProyecto(proyectoId));
    }

    // El cliente llama a este método para desuscribirse de un proyecto
    public async Task SalirDeProyecto(int proyectoId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GrupoProyecto(proyectoId));
    }
}

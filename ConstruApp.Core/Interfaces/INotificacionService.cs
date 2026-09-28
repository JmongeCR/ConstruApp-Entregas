namespace ConstruApp.Core.Interfaces;

public interface INotificacionService
{
    /// <summary>Persiste la notificación en BD y la empuja por SignalR al usuario.</summary>
    Task CrearAsync(
        int     usuarioId,
        string  tipo,
        string  titulo,
        string  mensaje,
        string? urlDestino = null,
        int?    proyectoId = null);

    /// <summary>Persiste y empuja la misma notificación a múltiples usuarios.</summary>
    Task CrearParaVariosAsync(
        IEnumerable<int> usuarioIds,
        string  tipo,
        string  titulo,
        string  mensaje,
        string? urlDestino = null,
        int?    proyectoId = null);

    /// <summary>Empuja un evento en tiempo real al grupo del proyecto sin persistir.</summary>
    Task EnviarAProyectoAsync(int proyectoId, string evento, object payload);

    /// <summary>Empuja un evento en tiempo real a un usuario sin persistir.</summary>
    Task EnviarAUsuarioAsync(int usuarioId, string evento, object payload);
}

using ConstruApp.Core.Entities;
using ConstruApp.Infrastructure.Data;

namespace ConstruApp.API.Services;

public interface IAuditoriaService
{
    Task RegistrarAsync(int? usuarioId, string usuarioNombre, string accion, string modulo,
        string? entidadId = null, string? detalle = null, string? ip = null);
}

public class AuditoriaService(AppDbContext db) : IAuditoriaService
{
    public async Task RegistrarAsync(int? usuarioId, string usuarioNombre, string accion,
        string modulo, string? entidadId = null, string? detalle = null, string? ip = null)
    {
        db.AuditoriaLogs.Add(new AuditoriaLog
        {
            UsuarioId     = usuarioId,
            UsuarioNombre = usuarioNombre,
            Accion        = accion,
            Modulo        = modulo,
            EntidadId     = entidadId,
            Detalle       = detalle,
            IpAddress     = ip,
            Fecha         = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
    }
}

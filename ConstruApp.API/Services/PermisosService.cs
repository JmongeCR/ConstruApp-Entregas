using ConstruApp.Core.Constants;
using ConstruApp.Core.Enums;
using ConstruApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.API.Services;

public interface IPermisosService
{
    Task<string[]> GetPermisosAsync(int usuarioId, Rol rol);
}

public class PermisosService(AppDbContext db) : IPermisosService
{
    public async Task<string[]> GetPermisosAsync(int usuarioId, Rol rol)
    {
        // Admin siempre tiene todos los permisos
        if (rol == Rol.Admin) return Permisos.Todos;

        // 1. Permisos base del rol (de la BD, editable por admin)
        var rolStr   = rol.ToString();
        var basePerms = await db.RolPermisos
            .Where(rp => rp.Rol == rolStr)
            .Select(rp => rp.PermisoCodigo)
            .ToListAsync();

        // 2. Overrides por usuario
        var overrides = await db.UsuarioPermisos
            .Where(up => up.UsuarioId == usuarioId)
            .ToListAsync();

        var perms = new HashSet<string>(basePerms);
        foreach (var o in overrides)
        {
            if (o.Concedido)  perms.Add(o.PermisoCodigo);
            else              perms.Remove(o.PermisoCodigo);
        }

        return [.. perms];
    }
}

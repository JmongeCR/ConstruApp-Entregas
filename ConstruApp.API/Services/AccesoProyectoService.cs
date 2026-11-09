using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;

namespace ConstruApp.API.Services;

public sealed class AccesoProyectoService(IUnitOfWork uow)
{
    public async Task<bool> ConstructorAsignadoAsync(Proyecto proyecto, ClaimsPrincipal usuario)
    {
        if (!usuario.IsInRole("Constructor") ||
            !int.TryParse(usuario.FindFirstValue(ClaimTypes.NameIdentifier), out var id)) return false;
        var perfil = (await uow.PerfilesConstructor.FindAsync(c => c.UsuarioId == id)).FirstOrDefault();
        return perfil is not null && await uow.Propuestas.ExistsAsync(p => p.ProyectoId == proyecto.Id &&
            p.ConstructorId == perfil.Id && (p.Estado == EstadoPropuesta.Aceptada || p.Estado == EstadoPropuesta.Finalizada));
    }

    public async Task<bool> PuedeVerAsync(Proyecto proyecto, ClaimsPrincipal usuario)
    {
        if (!int.TryParse(usuario.FindFirstValue(ClaimTypes.NameIdentifier), out var id)) return false;
        if (usuario.IsInRole("Admin") || proyecto.ClienteId == id) return true;
        if (!usuario.IsInRole("Constructor")) return false;
        return proyecto.Estado is EstadoProyecto.Publicado or EstadoProyecto.EnPropuestas
            ? await uow.PerfilesConstructor.ExistsAsync(c => c.UsuarioId == id)
            : await ConstructorAsignadoAsync(proyecto, usuario);
    }

    public async Task<bool> PuedeEditarDocumentosAsync(Proyecto proyecto, ClaimsPrincipal usuario) =>
        usuario.IsInRole("Admin") ||
        (int.TryParse(usuario.FindFirstValue(ClaimTypes.NameIdentifier), out var id) && proyecto.ClienteId == id) ||
        (proyecto.Estado == EstadoProyecto.EnCurso && await ConstructorAsignadoAsync(proyecto, usuario));
}

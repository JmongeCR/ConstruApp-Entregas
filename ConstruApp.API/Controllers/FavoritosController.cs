using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/favoritos")]
[Authorize]
public class FavoritosController : ControllerBase
{
    private readonly IUnitOfWork _uow;

    public FavoritosController(IUnitOfWork uow) => _uow = uow;

    // GET api/favoritos/proveedores
    [HttpGet("proveedores")]
    public async Task<IActionResult> GetFavoritos()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var favs   = await _uow.FavoritosProveedor.FindAsync(f => f.UsuarioId == userId);

        var perfilIds = favs.Select(f => f.PerfilProveedorId).ToHashSet();
        var perfiles  = await _uow.PerfilesProveedor.FindAsync(p => perfilIds.Contains(p.Id));
        var perfilesMap = perfiles.ToDictionary(p => p.Id);

        return Ok(favs.Select(f => new
        {
            f.Id,
            f.PerfilProveedorId,
            f.FechaAgregado,
            Proveedor = perfilesMap.TryGetValue(f.PerfilProveedorId, out var p) ? new
            {
                p.Id,
                p.NombreComercial,
                p.Descripcion,
                p.Provincia,
                p.Canton,
                p.Verificado,
            } : null,
        }));
    }

    // POST api/favoritos/proveedores/{perfilId}
    [HttpPost("proveedores/{perfilId:int}")]
    public async Task<IActionResult> Agregar(int perfilId)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var perfil = await _uow.PerfilesProveedor.GetByIdAsync(perfilId);
        if (perfil is null) return NotFound(new { message = "Proveedor no encontrado." });

        var existe = await _uow.FavoritosProveedor.ExistsAsync(
            f => f.UsuarioId == userId && f.PerfilProveedorId == perfilId);
        if (existe) return Conflict(new { message = "Ya está en tus favoritos." });

        var fav = new FavoritoProveedor
        {
            UsuarioId         = userId,
            PerfilProveedorId = perfilId,
            FechaAgregado     = DateTime.UtcNow,
        };

        await _uow.FavoritosProveedor.AddAsync(fav);
        await _uow.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFavoritos), new { id = fav.Id }, new { fav.Id, fav.PerfilProveedorId, fav.FechaAgregado });
    }

    // DELETE api/favoritos/proveedores/{perfilId}
    [HttpDelete("proveedores/{perfilId:int}")]
    public async Task<IActionResult> Quitar(int perfilId)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var fav    = (await _uow.FavoritosProveedor.FindAsync(
            f => f.UsuarioId == userId && f.PerfilProveedorId == perfilId)).FirstOrDefault();

        if (fav is null) return NotFound();

        await _uow.FavoritosProveedor.DeleteAsync(fav);
        await _uow.SaveChangesAsync();
        return NoContent();
    }
}

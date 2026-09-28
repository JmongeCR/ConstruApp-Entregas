using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MaterialesController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    public MaterialesController(IUnitOfWork uow) => _uow = uow;

    // GET api/materiales
    [AllowAnonymous]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? categoria, [FromQuery] string? buscar)
    {
        var materiales = await _uow.Materiales.FindAsync(m => m.Activo);

        if (!string.IsNullOrEmpty(buscar))
            materiales = materiales.Where(m =>
                m.Nombre.Contains(buscar, StringComparison.OrdinalIgnoreCase));

        if (!string.IsNullOrEmpty(categoria) && Enum.TryParse<CategoriaMaterial>(categoria, out var cat))
            materiales = materiales.Where(m => m.Categoria == cat);

        return Ok(materiales.Select(Map));
    }

    // GET api/materiales/{id}/precios
    [AllowAnonymous]
    [HttpGet("{id}/precios")]
    public async Task<IActionResult> GetPrecios(int id)
    {
        var precios = await _uow.PreciosMaterial.FindAsync(p => p.MaterialId == id && p.Disponible);
        return Ok(precios.OrderBy(p => p.Precio).Select(MapPrecio));
    }

    // POST api/materiales  (solo Admin)
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] MaterialRequest req)
    {
        var m = new Material
        {
            Nombre        = req.Nombre,
            Descripcion   = req.Descripcion,
            UnidadMedida  = req.UnidadMedida,
            Categoria     = req.Categoria,
            CodigoProducto = req.CodigoProducto,
        };
        await _uow.Materiales.AddAsync(m);
        await _uow.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = m.Id }, Map(m));
    }

    // POST api/materiales/{id}/precios  (proveedor agrega precio)
    [Authorize(Roles = "Proveedor,Admin")]
    [HttpPost("{id}/precios")]
    public async Task<IActionResult> AgregarPrecio(int id, [FromBody] PrecioMaterialRequest req)
    {
        var uid     = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var perfiles = await _uow.PerfilesProveedor.FindAsync(p => p.UsuarioId == uid);
        var perfil  = perfiles.FirstOrDefault();
        if (perfil is null)
            return BadRequest(new { message = "Necesitás un perfil de proveedor." });

        var precio = new PrecioMaterial
        {
            MaterialId  = id,
            ProveedorId = perfil.Id,
            Precio      = req.Precio,
            UrlProducto = req.UrlProducto,
            Disponible  = true,
        };
        await _uow.PreciosMaterial.AddAsync(precio);
        await _uow.SaveChangesAsync();
        return Ok(MapPrecio(precio));
    }

    private static object Map(Material m) => new
    {
        m.Id, m.Nombre, m.Descripcion, m.UnidadMedida,
        Categoria = m.Categoria.ToString(), m.CodigoProducto,
    };

    private static object MapPrecio(PrecioMaterial p) => new
    {
        p.Id, p.MaterialId, p.ProveedorId,
        p.Precio, p.Moneda, p.UrlProducto,
        p.FechaActualizacion, p.Disponible,
    };
}

public record MaterialRequest(
    string           Nombre,
    string?          Descripcion,
    string           UnidadMedida,
    CategoriaMaterial Categoria,
    string?          CodigoProducto);

public record PrecioMaterialRequest(decimal Precio, string? UrlProducto);

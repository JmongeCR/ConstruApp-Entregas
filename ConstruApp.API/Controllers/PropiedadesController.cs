using System.Security.Claims;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/propiedades")]
[Authorize(Roles = "Cliente,Admin")]
public class PropiedadesController : ControllerBase
{
    private const long MaxFotoBytes = 5 * 1024 * 1024;
    private static readonly Dictionary<string, string> ExtensionesPermitidas = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp",
    };

    private readonly IUnitOfWork _uow;
    private readonly IWebHostEnvironment _environment;
    private readonly IAuditoriaService _auditoria;

    public PropiedadesController(
        IUnitOfWork uow,
        IWebHostEnvironment environment,
        IAuditoriaService auditoria)
    {
        _uow = uow;
        _environment = environment;
        _auditoria = auditoria;
    }

    [HttpGet]
    public async Task<IActionResult> GetMias()
    {
        var userId = GetUserId();
        var propiedades = (await _uow.Propiedades.FindAsync(p => p.ClienteId == userId))
            .OrderByDescending(p => p.FechaActualizacion)
            .ToList();
        var propiedadIds = propiedades.Select(p => p.Id).ToArray();
        var fotos = (await _uow.FotosPropiedad.FindAsync(f => propiedadIds.Contains(f.PropiedadId)))
            .ToList();

        return Ok(propiedades.Select(p => MapDto(p, fotos.Where(f => f.PropiedadId == p.Id))));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var propiedad = await _uow.Propiedades.GetByIdAsync(id);
        if (propiedad is null) return NotFound();
        if (propiedad.ClienteId != GetUserId()) return Forbid();

        var fotos = await _uow.FotosPropiedad.FindAsync(f => f.PropiedadId == id);
        return Ok(MapDto(propiedad, fotos));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PropiedadRequest req)
    {
        var error = Validar(req);
        if (error is not null) return BadRequest(new { message = error });

        var propiedad = new Propiedad
        {
            ClienteId = GetUserId(),
            Nombre = req.Nombre.Trim(),
            Direccion = req.Direccion.Trim(),
            Provincia = req.Provincia.Trim(),
            Canton = req.Canton.Trim(),
            Distrito = req.Distrito.Trim(),
            Caracteristicas = LimpiarOpcional(req.Caracteristicas),
        };

        await _uow.Propiedades.AddAsync(propiedad);
        await _uow.SaveChangesAsync();
        await RegistrarAuditoria("CrearPropiedad", propiedad);

        return CreatedAtAction(nameof(GetById), new { id = propiedad.Id }, MapDto(propiedad, []));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] PropiedadRequest req)
    {
        var error = Validar(req);
        if (error is not null) return BadRequest(new { message = error });

        var propiedad = await _uow.Propiedades.GetByIdAsync(id);
        if (propiedad is null) return NotFound();
        if (propiedad.ClienteId != GetUserId()) return Forbid();

        propiedad.Nombre = req.Nombre.Trim();
        propiedad.Direccion = req.Direccion.Trim();
        propiedad.Provincia = req.Provincia.Trim();
        propiedad.Canton = req.Canton.Trim();
        propiedad.Distrito = req.Distrito.Trim();
        propiedad.Caracteristicas = LimpiarOpcional(req.Caracteristicas);
        propiedad.FechaActualizacion = DateTime.UtcNow;

        await _uow.Propiedades.UpdateAsync(propiedad);
        await _uow.SaveChangesAsync();
        await RegistrarAuditoria("ActualizarPropiedad", propiedad);

        var fotos = await _uow.FotosPropiedad.FindAsync(f => f.PropiedadId == id);
        return Ok(MapDto(propiedad, fotos));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var propiedad = await _uow.Propiedades.GetByIdAsync(id);
        if (propiedad is null) return NotFound();
        if (propiedad.ClienteId != GetUserId()) return Forbid();

        if (await _uow.Proyectos.ExistsAsync(p => p.PropiedadId == id))
            return Conflict(new { message = "No se puede eliminar una propiedad asociada a un proyecto." });

        var fotos = (await _uow.FotosPropiedad.FindAsync(f => f.PropiedadId == id)).ToList();
        await _uow.Propiedades.DeleteAsync(propiedad);
        await _uow.SaveChangesAsync();

        foreach (var foto in fotos)
            EliminarArchivo(foto.Url);

        await RegistrarAuditoria("EliminarPropiedad", propiedad);
        return NoContent();
    }

    [HttpPost("{id:int}/fotos")]
    [RequestSizeLimit(MaxFotoBytes)]
    public async Task<IActionResult> SubirFoto(int id, [FromForm] IFormFile archivo)
    {
        var propiedad = await _uow.Propiedades.GetByIdAsync(id);
        if (propiedad is null) return NotFound();
        if (propiedad.ClienteId != GetUserId()) return Forbid();
        if (archivo is null || archivo.Length == 0)
            return BadRequest(new { message = "Seleccioná una fotografía." });
        if (archivo.Length > MaxFotoBytes)
            return BadRequest(new { message = "La fotografía no puede superar 5 MB." });
        if (!ExtensionesPermitidas.TryGetValue(archivo.ContentType, out var extension))
            return BadRequest(new { message = "Formato no permitido. Usá JPG, PNG o WebP." });

        var nombreSeguro = $"{Guid.NewGuid():N}{extension}";
        var carpetaRelativa = Path.Combine("uploads", "propiedades", id.ToString());
        var carpetaFisica = Path.Combine(_environment.WebRootPath, carpetaRelativa);
        Directory.CreateDirectory(carpetaFisica);
        var rutaFisica = Path.Combine(carpetaFisica, nombreSeguro);

        await using (var stream = System.IO.File.Create(rutaFisica))
            await archivo.CopyToAsync(stream);

        var foto = new FotoPropiedad
        {
            PropiedadId = id,
            Url = "/" + Path.Combine(carpetaRelativa, nombreSeguro).Replace('\\', '/'),
            NombreArchivo = Path.GetFileName(archivo.FileName),
        };

        try
        {
            await _uow.FotosPropiedad.AddAsync(foto);
            propiedad.FechaActualizacion = DateTime.UtcNow;
            await _uow.Propiedades.UpdateAsync(propiedad);
            await _uow.SaveChangesAsync();
        }
        catch
        {
            if (System.IO.File.Exists(rutaFisica)) System.IO.File.Delete(rutaFisica);
            throw;
        }

        return Created(foto.Url, MapFoto(foto));
    }

    [HttpDelete("{id:int}/fotos/{fotoId:int}")]
    public async Task<IActionResult> EliminarFoto(int id, int fotoId)
    {
        var propiedad = await _uow.Propiedades.GetByIdAsync(id);
        if (propiedad is null) return NotFound();
        if (propiedad.ClienteId != GetUserId()) return Forbid();

        var foto = await _uow.FotosPropiedad.GetByIdAsync(fotoId);
        if (foto is null || foto.PropiedadId != id) return NotFound();

        await _uow.FotosPropiedad.DeleteAsync(foto);
        propiedad.FechaActualizacion = DateTime.UtcNow;
        await _uow.Propiedades.UpdateAsync(propiedad);
        await _uow.SaveChangesAsync();
        EliminarArchivo(foto.Url);
        return NoContent();
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static string? Validar(PropiedadRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Nombre)) return "El nombre de la propiedad es requerido.";
        if (string.IsNullOrWhiteSpace(req.Direccion)) return "La dirección es requerida.";
        if (string.IsNullOrWhiteSpace(req.Provincia) || string.IsNullOrWhiteSpace(req.Canton) || string.IsNullOrWhiteSpace(req.Distrito))
            return "La provincia, el cantón y el distrito son requeridos.";
        return null;
    }

    private static string? LimpiarOpcional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private async Task RegistrarAuditoria(string accion, Propiedad propiedad) =>
        await _auditoria.RegistrarAsync(
            GetUserId(),
            User.FindFirstValue("nombre") ?? "Cliente",
            accion,
            "Propiedades",
            propiedad.Id.ToString(),
            propiedad.Nombre,
            HttpContext.Connection.RemoteIpAddress?.ToString());

    private void EliminarArchivo(string url)
    {
        var rutaRelativa = url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
        var rutaFisica = Path.GetFullPath(Path.Combine(_environment.WebRootPath, rutaRelativa));
        var raizUploads = Path.GetFullPath(Path.Combine(_environment.WebRootPath, "uploads", "propiedades"));
        if (rutaFisica.StartsWith(raizUploads, StringComparison.OrdinalIgnoreCase) && System.IO.File.Exists(rutaFisica))
            System.IO.File.Delete(rutaFisica);
    }

    private static object MapDto(Propiedad propiedad, IEnumerable<FotoPropiedad> fotos) => new
    {
        propiedad.Id,
        propiedad.Nombre,
        propiedad.Direccion,
        propiedad.Provincia,
        propiedad.Canton,
        propiedad.Distrito,
        propiedad.Caracteristicas,
        propiedad.FechaCreacion,
        propiedad.FechaActualizacion,
        Fotos = fotos.OrderByDescending(f => f.FechaCreacion).Select(MapFoto),
    };

    private static object MapFoto(FotoPropiedad foto) => new
    {
        foto.Id,
        foto.Url,
        foto.NombreArchivo,
        foto.FechaCreacion,
    };
}

public record PropiedadRequest(
    string Nombre,
    string Direccion,
    string Provincia,
    string Canton,
    string Distrito,
    string? Caracteristicas);

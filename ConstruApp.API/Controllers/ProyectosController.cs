using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProyectosController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly IWebHostEnvironment _env;
    public ProyectosController(IUnitOfWork uow, IWebHostEnvironment env) { _uow = uow; _env = env; }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET api/proyectos  (admin ve todo; cliente ve los suyos)
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var rol = User.FindFirstValue(ClaimTypes.Role);
        IEnumerable<Proyecto> lista;

        if (rol == "Admin")
            lista = await _uow.Proyectos.GetAllAsync();
        else
            lista = await _uow.Proyectos.FindAsync(p => p.ClienteId == UserId);

        return Ok(lista.Select(Map));
    }

    // GET api/proyectos/publicados  (marketplace — sin auth)
    [AllowAnonymous]
    [HttpGet("publicados")]
    public async Task<IActionResult> GetPublicados(
        [FromQuery] string? tipo,
        [FromQuery] string? provincia,
        [FromQuery] string? buscar,
        [FromQuery] string? canton)
    {
        var lista = await _uow.Proyectos.FindAsync(p =>
            p.Estado == EstadoProyecto.Publicado || p.Estado == EstadoProyecto.EnPropuestas);

        if (!string.IsNullOrEmpty(tipo) && Enum.TryParse<TipoProyecto>(tipo, out var t))
            lista = lista.Where(p => p.TipoProyecto == t);

        if (!string.IsNullOrEmpty(provincia))
            lista = lista.Where(p => p.Provincia == provincia);

        if (!string.IsNullOrEmpty(buscar))
            lista = lista.Where(p =>
                p.Titulo.Contains(buscar, StringComparison.OrdinalIgnoreCase) ||
                (p.Descripcion != null && p.Descripcion.Contains(buscar, StringComparison.OrdinalIgnoreCase)));

        if (!string.IsNullOrEmpty(canton))
            lista = lista.Where(p =>
                p.Canton != null && p.Canton.Contains(canton, StringComparison.OrdinalIgnoreCase));

        return Ok(lista.OrderByDescending(p => p.FechaPublicacion).Select(Map));
    }

    // GET api/proyectos/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _uow.Proyectos.GetByIdAsync(id);
        if (p is null) return NotFound();
        return Ok(Map(p));
    }

    // POST api/proyectos
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProyectoRequest req)
    {
        var proyecto = new Proyecto
        {
            ClienteId      = UserId,
            Titulo         = req.Titulo,
            Descripcion    = req.Descripcion,
            TipoProyecto   = req.TipoProyecto,
            Canton         = req.Canton,
            Provincia      = req.Provincia,
            PresupuestoMax = req.PresupuestoMax,
            AreaM2         = req.AreaM2,
            Estado         = EstadoProyecto.Borrador,
        };

        await _uow.Proyectos.AddAsync(proyecto);
        await _uow.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = proyecto.Id }, Map(proyecto));
    }

    // PUT api/proyectos/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ProyectoRequest req)
    {
        var p = await _uow.Proyectos.GetByIdAsync(id);
        if (p is null) return NotFound();
        if (p.ClienteId != UserId && User.FindFirstValue(ClaimTypes.Role) != "Admin")
            return Forbid();

        p.Titulo         = req.Titulo;
        p.Descripcion    = req.Descripcion;
        p.TipoProyecto   = req.TipoProyecto;
        p.Canton         = req.Canton;
        p.Provincia      = req.Provincia;
        p.PresupuestoMax = req.PresupuestoMax;
        p.AreaM2         = req.AreaM2;

        _uow.Proyectos.UpdateAsync(p);
        await _uow.SaveChangesAsync();
        return Ok(Map(p));
    }

    // PUT api/proyectos/{id}/publicar
    [HttpPut("{id}/publicar")]
    public async Task<IActionResult> Publicar(int id)
    {
        var p = await _uow.Proyectos.GetByIdAsync(id);
        if (p is null) return NotFound();
        if (p.ClienteId != UserId) return Forbid();

        p.Estado           = EstadoProyecto.Publicado;
        p.FechaPublicacion = DateTime.UtcNow;
        _uow.Proyectos.UpdateAsync(p);
        await _uow.SaveChangesAsync();
        return Ok(Map(p));
    }

    // PUT api/proyectos/{id}/estado
    [HttpPut("{id}/estado")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] CambiarEstadoRequest req)
    {
        var p = await _uow.Proyectos.GetByIdAsync(id);
        if (p is null) return NotFound();
        if (p.ClienteId != UserId && User.FindFirstValue(ClaimTypes.Role) != "Admin")
            return Forbid();

        p.Estado = req.Estado;
        _uow.Proyectos.UpdateAsync(p);
        await _uow.SaveChangesAsync();
        return Ok(Map(p));
    }

    // GET api/proyectos/{id}/fotos
    [HttpGet("{id}/fotos")]
    public async Task<IActionResult> GetFotos(int id)
    {
        var archivos = await _uow.Archivos.FindAsync(a => a.ProyectoId == id);
        return Ok(archivos.OrderByDescending(a => a.FechaSubida).Select(a => new
        {
            a.Id, a.NombreArchivo, a.Url, a.TipoArchivo,
            FechaSubida = a.FechaSubida.ToString("yyyy-MM-dd HH:mm")
        }));
    }

    // POST api/proyectos/{id}/fotos  (base64 → disco)
    [HttpPost("{id}/fotos")]
    public async Task<IActionResult> SubirFoto(int id, [FromBody] SubirFotoRequest req)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(id);
        if (proyecto is null) return NotFound();

        // Puede subir: el cliente dueño o un constructor con propuesta aceptada
        var esCliente = proyecto.ClienteId == UserId;
        if (!esCliente)
        {
            var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
            var perfil   = perfiles.FirstOrDefault();
            if (perfil is not null)
            {
                var propuestas = await _uow.Propuestas.FindAsync(p =>
                    p.ProyectoId == id && p.ConstructorId == perfil.Id &&
                    (p.Estado == EstadoPropuesta.Aceptada || p.Estado == EstadoPropuesta.Finalizada));
                if (!propuestas.Any()) return Forbid();
            }
            else return Forbid();
        }

        // Decodificar base64 y guardar en disco
        var bytes = Convert.FromBase64String(req.Base64);
        var ext   = req.MimeType?.Contains("png") == true ? ".png" : ".jpg";
        var nombre = $"{Guid.NewGuid():N}{ext}";
        var carpeta = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", "proyectos", id.ToString());
        Directory.CreateDirectory(carpeta);
        await System.IO.File.WriteAllBytesAsync(Path.Combine(carpeta, nombre), bytes);

        var urlRelativa = $"/uploads/proyectos/{id}/{nombre}";
        var archivo = new ArchivoProyecto
        {
            ProyectoId    = id,
            Url           = urlRelativa,
            NombreArchivo = req.NombreOriginal ?? nombre,
            TipoArchivo   = "foto",
        };
        await _uow.Archivos.AddAsync(archivo);
        await _uow.SaveChangesAsync();

        return Ok(new { archivo.Id, archivo.Url, archivo.NombreArchivo, archivo.FechaSubida });
    }

    // DELETE api/proyectos/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var p = await _uow.Proyectos.GetByIdAsync(id);
        if (p is null) return NotFound();
        if (p.ClienteId != UserId && User.FindFirstValue(ClaimTypes.Role) != "Admin")
            return Forbid();

        await _uow.Proyectos.DeleteAsync(p);
        await _uow.SaveChangesAsync();
        return NoContent();
    }

    private static object Map(Proyecto p) => new
    {
        p.Id, p.ClienteId, p.Titulo, p.Descripcion,
        TipoProyecto = p.TipoProyecto.ToString(),
        Estado       = p.Estado.ToString(),
        p.Canton, p.Provincia, p.PresupuestoMax, p.AreaM2,
        p.FechaPublicacion, p.FechaInicio, p.FechaFin,
    };
}

public record ProyectoRequest(
    string       Titulo,
    string       Descripcion,
    TipoProyecto TipoProyecto,
    string?      Canton,
    string?      Provincia,
    decimal?     PresupuestoMax,
    decimal?     AreaM2);

public record CambiarEstadoRequest(EstadoProyecto Estado);
public record SubirFotoRequest(string Base64, string? MimeType, string? NombreOriginal);

using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using ConstruApp.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/avances")]
[Authorize]
public sealed class AvancesController : ControllerBase
{
    private const int MaxFotoBytes = 5 * 1024 * 1024;
    private const int MaxAdjuntos = 4;
    private static readonly HashSet<string> TiposPermitidos = new(StringComparer.OrdinalIgnoreCase)
    {
        "image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"
    };

    private readonly IUnitOfWork _uow;
    private readonly IWebHostEnvironment _environment;
    private readonly IAuditoriaService _auditoria;
    private readonly ILogger<AvancesController> _logger;

    public AvancesController(IUnitOfWork uow, IWebHostEnvironment environment,
        IAuditoriaService auditoria, ILogger<AvancesController> logger)
    {
        _uow = uow;
        _environment = environment;
        _auditoria = auditoria;
        _logger = logger;
    }

    [HttpGet("proyectos")]
    public async Task<IActionResult> GetProyectos()
    {
        var userId = GetUserId();
        var admin = User.IsInRole("Admin");
        var cliente = User.IsInRole("Cliente");
        var constructor = User.IsInRole("Constructor");
        if (!admin && !cliente && !constructor) return Forbid();
        var perfil = constructor
            ? (await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == userId)).FirstOrDefault() : null;
        var perfilId = perfil?.Id ?? -1;
        var propuestas = await _uow.Propuestas.FindAsync(p => (admin || (constructor && p.ConstructorId == perfilId)) &&
            (p.Estado == EstadoPropuesta.Aceptada || p.Estado == EstadoPropuesta.Finalizada));
        var visibles = propuestas.Select(p => p.ProyectoId).ToArray();
        var activos = propuestas.Where(p => p.Estado == EstadoPropuesta.Aceptada).Select(p => p.ProyectoId).ToHashSet();
        var proyectos = await _uow.Proyectos.FindAsync(p => (p.Estado == EstadoProyecto.EnCurso || p.Estado == EstadoProyecto.Completado) &&
            (admin || (cliente && p.ClienteId == userId) || (constructor && visibles.Contains(p.Id))));
        return Ok(proyectos.OrderBy(p => p.Titulo).ThenBy(p => p.Id).Select(p => new
        {
            p.Id, p.Titulo, p.Provincia, p.Canton, p.AreaM2, estado = p.Estado.ToString(),
            puedeRegistrar = p.Estado == EstadoProyecto.EnCurso && (admin || constructor) && activos.Contains(p.Id),
        }));
    }

    [HttpGet("proyecto/{proyectoId:int}")]
    public async Task<IActionResult> GetByProyecto(int proyectoId)
    {
        var proyecto = await _uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound(new { message = "No encontramos el proyecto." });
        if (!await PuedeVerProyecto(proyecto)) return Forbid();

        var avances = (await _uow.AvancesObra.FindAsync(a => a.ProyectoId == proyectoId))
            .OrderByDescending(a => a.Fecha).ThenByDescending(a => a.Id).ToList();
        var ids = avances.Select(a => a.Id).ToArray();
        var fotos = (await _uow.FotosAvance.FindAsync(f => ids.Contains(f.AvanceObraId))).ToLookup(f => f.AvanceObraId);
        return Ok(avances.Select(avance => Map(avance, fotos[avance.Id])));
    }

    [HttpPost]
    [Authorize(Roles = "Constructor,Admin")]
    [RequestSizeLimit(30 * 1024 * 1024)]
    public async Task<IActionResult> Create([FromBody] CrearAvanceRequest req)
    {
        if (req.ProyectoId <= 0)
            return BadRequest(new { message = "Selecciona un proyecto válido." });
        if (string.IsNullOrWhiteSpace(req.Titulo))
            return BadRequest(new { message = "El título del avance es obligatorio." });
        if (req.Titulo.Trim().Length > 300)
            return BadRequest(new { message = "El título no puede superar 300 caracteres." });
        if (req.Descripcion?.Trim().Length > 3000)
            return BadRequest(new { message = "La descripción no puede superar 3.000 caracteres." });
        if (req.Responsable?.Trim().Length > 200)
            return BadRequest(new { message = "El responsable no puede superar 200 caracteres." });
        if (req.PorcentajeAvance is null or < 0 or > 100)
            return BadRequest(new { message = "El porcentaje debe estar entre 0 y 100." });

        var proyecto = await _uow.Proyectos.GetByIdAsync(req.ProyectoId);
        if (proyecto is null) return NotFound(new { message = "No encontramos el proyecto." });
        if (proyecto.Estado != EstadoProyecto.EnCurso)
            return BadRequest(new { message = "Solo se pueden registrar avances en proyectos en curso." });

        var userId = GetUserId();
        PerfilConstructor? perfil;
        if (User.IsInRole("Admin"))
        {
            var asignacion = (await _uow.Propuestas.FindAsync(p => p.ProyectoId == proyecto.Id && p.Estado == EstadoPropuesta.Aceptada)).FirstOrDefault();
            perfil = asignacion is null ? null : await _uow.PerfilesConstructor.GetByIdAsync(asignacion.ConstructorId);
            if (perfil is null) return BadRequest(new { message = "El proyecto no tiene un constructor asignado mediante una propuesta aceptada." });
        }
        else
        {
            perfil = (await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == userId)).FirstOrDefault();
            if (perfil is null || !await _uow.Propuestas.ExistsAsync(p => p.ProyectoId == proyecto.Id && p.ConstructorId == perfil.Id && p.Estado == EstadoPropuesta.Aceptada))
                return Forbid();
        }

        var fotos = req.Fotos ?? [];
        var validacionFotos = ValidarFotos(fotos);
        if (validacionFotos is not null) return BadRequest(new { message = validacionFotos });

        var avance = new AvanceObra
        {
            ProyectoId = proyecto.Id,
            ConstructorId = perfil.Id,
            Titulo = req.Titulo.Trim(),
            Descripcion = req.Descripcion?.Trim() ?? string.Empty,
            Responsable = string.IsNullOrWhiteSpace(req.Responsable) ? null : req.Responsable.Trim(),
            PorcentajeAvance = req.PorcentajeAvance.Value,
            Fecha = DateTime.UtcNow
        };
        var raizWeb = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var carpeta = Path.Combine(raizWeb, "uploads", "avances");
        var archivosCreados = new List<string>();
        try
        {
            if (fotos.Count > 0) Directory.CreateDirectory(carpeta);
            foreach (var foto in fotos)
            {
                var (bytes, mime) = Decodificar(foto.Base64);
                var extension = mime switch { "image/jpeg" => ".jpg", "image/png" => ".png", "image/webp" => ".webp", "video/mp4" => ".mp4", _ => ".webm" };
                var nombre = $"{Guid.NewGuid():N}{extension}";
                var ruta = Path.Combine(carpeta, nombre);
                archivosCreados.Add(ruta);
                await System.IO.File.WriteAllBytesAsync(ruta, bytes);
                avance.Fotos.Add(new FotoAvance
                {
                    Url = $"/uploads/avances/{nombre}",
                    NombreArchivo = Path.GetFileName(foto.Nombre ?? nombre),
                    Tipo = mime.StartsWith("video/", StringComparison.OrdinalIgnoreCase) ? "video" : "foto",
                    TamanioBytes = bytes.Length,
                    FechaSubida = DateTime.UtcNow
                });
            }
            await _uow.AvancesObra.AddAsync(avance);
            await _uow.SaveChangesAsync();
        }
        catch
        {
            LimpiarArchivos(archivosCreados);
            throw;
        }
        await _auditoria.RegistrarAsync(userId, User.FindFirstValue("nombre") ?? "", "RegistrarAvance", "Avances",
            avance.Id.ToString(), $"Proyecto {proyecto.Id}: {avance.Titulo}, {avance.PorcentajeAvance}%");
        return Created($"/api/avances/proyecto/{proyecto.Id}", Map(avance, avance.Fotos));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Constructor,Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var avance = await _uow.AvancesObra.GetByIdAsync(id);
        if (avance is null) return NotFound();
        if (!User.IsInRole("Admin"))
        {
            var userId = GetUserId();
            var perfil = (await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == userId)).FirstOrDefault();
            if (perfil is null || avance.ConstructorId != perfil.Id) return Forbid();
            var proyecto = await _uow.Proyectos.GetByIdAsync(avance.ProyectoId);
            if (proyecto is null || proyecto.Estado != EstadoProyecto.EnCurso ||
                !await _uow.Propuestas.ExistsAsync(p => p.ProyectoId == proyecto.Id && p.ConstructorId == perfil.Id && p.Estado == EstadoPropuesta.Aceptada))
                return Forbid();
        }

        var fotos = await _uow.FotosAvance.FindAsync(f => f.AvanceObraId == id);
        var rutas = new List<string>();
        foreach (var foto in fotos)
        {
            var raizWeb = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
            var nombre = Path.GetFileName(foto.Url);
            if (foto.Url == $"/uploads/avances/{nombre}" && Guid.TryParseExact(Path.GetFileNameWithoutExtension(nombre), "N", out _))
                rutas.Add(Path.Combine(raizWeb, "uploads", "avances", nombre));
            var fotoActual = await _uow.FotosAvance.GetByIdAsync(foto.Id);
            if (fotoActual is not null) await _uow.FotosAvance.DeleteAsync(fotoActual);
        }
        await _uow.AvancesObra.DeleteAsync(avance);
        await _uow.SaveChangesAsync();
        LimpiarArchivos(rutas);
        await _auditoria.RegistrarAsync(GetUserId(), User.FindFirstValue("nombre") ?? "", "EliminarAvance", "Avances", id.ToString());
        return NoContent();
    }

    private async Task<bool> PuedeVerProyecto(Proyecto proyecto)
    {
        if (User.IsInRole("Admin")) return true;
        var userId = GetUserId();
        if (User.IsInRole("Cliente")) return proyecto.ClienteId == userId;
        if (User.IsInRole("Constructor"))
        {
            var perfil = (await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == userId)).FirstOrDefault();
            return perfil is not null && await _uow.Propuestas.ExistsAsync(p => p.ProyectoId == proyecto.Id && p.ConstructorId == perfil.Id &&
                (p.Estado == EstadoPropuesta.Aceptada || p.Estado == EstadoPropuesta.Finalizada));
        }
        return false;
    }

    private static string? ValidarFotos(List<FotoAvanceRequest> fotos)
    {
        if (fotos.Count > MaxAdjuntos) return "Podés adjuntar hasta 4 fotos o videos por avance.";
        foreach (var foto in fotos)
        {
            if (foto is null) return "Uno de los archivos seleccionados no es válido.";
            if (foto.Nombre?.Length > 200) return "El nombre de cada archivo admite hasta 200 caracteres.";
            if (foto.Base64 is null || foto.Base64.Length > ((MaxFotoBytes + 2) / 3) * 4 + 64)
                return "Cada foto o video debe pesar 5 MB o menos.";
            try
            {
                var (bytes, mime) = Decodificar(foto.Base64);
                if (bytes.Length == 0) return "No se permiten archivos vacíos.";
                if (!TiposPermitidos.Contains(mime) || !CoincideContenido(bytes, mime))
                    return "Solo se permiten imágenes JPG, PNG o WebP y videos MP4 o WebM válidos.";
                if (bytes.Length > MaxFotoBytes) return "Cada foto o video debe pesar 5 MB o menos.";
            }
            catch (FormatException) { return "Uno de los archivos seleccionados no es válido."; }
        }
        return null;
    }

    private static bool CoincideContenido(byte[] bytes, string mime) => mime.ToLowerInvariant() switch
    {
        "image/jpeg" => bytes.Length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF,
        "image/png" => bytes.Length >= 8 && bytes.AsSpan(0, 8).SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
        "image/webp" => bytes.Length >= 12 && System.Text.Encoding.ASCII.GetString(bytes, 0, 4) == "RIFF" && System.Text.Encoding.ASCII.GetString(bytes, 8, 4) == "WEBP",
        "video/mp4" => bytes.Length >= 8 && System.Text.Encoding.ASCII.GetString(bytes, 4, 4) == "ftyp",
        "video/webm" => bytes.Length >= 4 && bytes.AsSpan(0, 4).SequenceEqual(new byte[] { 0x1A, 0x45, 0xDF, 0xA3 }),
        _ => false
    };

    private static (byte[] Bytes, string Mime) Decodificar(string base64)
    {
        if (string.IsNullOrWhiteSpace(base64)) throw new FormatException();
        var mime = "";
        var data = base64;
        if (base64.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            var comma = base64.IndexOf(',');
            if (comma < 0) throw new FormatException();
            var metadata = base64[..comma];
            if (!metadata.EndsWith(";base64", StringComparison.OrdinalIgnoreCase)) throw new FormatException();
            var separator = metadata.IndexOf(';');
            mime = separator > 5 ? metadata[5..separator].ToLowerInvariant() : "";
            data = base64[(comma + 1)..];
        }
        var bytes = Convert.FromBase64String(data);
        if (string.IsNullOrWhiteSpace(mime)) throw new FormatException();
        return (bytes, mime);
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private void LimpiarArchivos(IEnumerable<string> rutas)
    {
        foreach (var ruta in rutas)
        {
            try { if (System.IO.File.Exists(ruta)) System.IO.File.Delete(ruta); }
            catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
            { _logger.LogWarning(ex, "No fue posible limpiar un adjunto de avances: {Ruta}", ruta); }
        }
    }

    private static object Map(AvanceObra a, IEnumerable<FotoAvance> fotos) => new
    {
        a.Id, a.ProyectoId, a.ConstructorId, a.Titulo, a.Descripcion, a.Responsable,
        a.PorcentajeAvance, a.Fecha, a.FaseId,
        fotos = fotos.Select(f => new { f.Id, f.Url, f.NombreArchivo, f.Tipo, f.TamanioBytes, f.FechaSubida })
    };
}

public sealed class CrearAvanceRequest
{
    public int ProyectoId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Responsable { get; set; }
    public int? PorcentajeAvance { get; set; }
    public List<FotoAvanceRequest>? Fotos { get; set; }
}

public sealed class FotoAvanceRequest
{
    public string Base64 { get; set; } = string.Empty;
    public string? Nombre { get; set; }
    public string? Tipo { get; set; }
    public long? TamanioBytes { get; set; }
}

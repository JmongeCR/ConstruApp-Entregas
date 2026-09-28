using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AvancesController : ControllerBase
{
    private readonly IUnitOfWork _uow;
    private readonly IWebHostEnvironment _env;
    private readonly INotificacionService _notif;

    public AvancesController(IUnitOfWork uow, IWebHostEnvironment env, INotificacionService notif)
    {
        _uow   = uow;
        _env   = env;
        _notif = notif;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET api/avances/proyecto/{proyectoId}
    [HttpGet("proyecto/{proyectoId}")]
    public async Task<IActionResult> GetByProyecto(int proyectoId)
    {
        var avances = await _uow.AvancesObra.FindAsync(a => a.ProyectoId == proyectoId);
        var ids     = avances.Select(a => a.Id).ToList();
        var fotos   = ids.Any()
            ? await _uow.FotosAvance.FindAsync(f => ids.Contains(f.AvanceObraId))
            : Enumerable.Empty<FotoAvance>();
        var fotosMap = fotos.GroupBy(f => f.AvanceObraId).ToDictionary(g => g.Key, g => g.ToList());

        return Ok(avances.OrderByDescending(a => a.Fecha).Select(a => Map(a, fotosMap.GetValueOrDefault(a.Id))));
    }

    // POST api/avances
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AvanceRequest req)
    {
        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        var perfil   = perfiles.FirstOrDefault();
        if (perfil is null)
            return BadRequest(new { message = "No tenés perfil de constructor." });

        var propuestas = await _uow.Propuestas.FindAsync(p =>
            p.ProyectoId == req.ProyectoId && p.ConstructorId == perfil.Id &&
            (p.Estado == EstadoPropuesta.Aceptada || p.Estado == EstadoPropuesta.Finalizada));

        if (!propuestas.Any())
            return Forbid();

        var avance = new AvanceObra
        {
            ProyectoId       = req.ProyectoId,
            ConstructorId    = perfil.Id,
            Titulo           = req.Titulo ?? "Avance registrado",
            Descripcion      = req.Descripcion,
            Responsable      = req.Responsable,
            PorcentajeAvance = Math.Clamp(req.PorcentajeAvance, 0, 100),
        };

        await _uow.AvancesObra.AddAsync(avance);
        await _uow.SaveChangesAsync();

        // Guardar fotos adjuntas
        if (req.Fotos?.Any() == true)
        {
            foreach (var foto in req.Fotos)
            {
                var url = await SaveBase64Async(foto.Base64, foto.Nombre, foto.Tipo);
                if (url is not null)
                    await _uow.FotosAvance.AddAsync(new FotoAvance
                    {
                        AvanceObraId  = avance.Id,
                        Url           = url,
                        NombreArchivo = foto.Nombre,
                        Tipo          = foto.Tipo ?? "foto",
                        TamanioBytes  = foto.TamanioBytes,
                    });
            }
            await _uow.SaveChangesAsync();
        }

        // Notificar al cliente del proyecto en tiempo real
        var proyecto = await _uow.Proyectos.GetByIdAsync(req.ProyectoId);
        if (proyecto is not null)
        {
            await _notif.CrearAsync(
                usuarioId:  proyecto.ClienteId,
                tipo:       "nuevo_avance",
                titulo:     "Nuevo avance registrado",
                mensaje:    $"Se registró un avance ({avance.PorcentajeAvance}%) en tu proyecto.",
                urlDestino: $"/obra/{req.ProyectoId}",
                proyectoId: req.ProyectoId);

            await _notif.EnviarAProyectoAsync(req.ProyectoId, "NuevoAvance", Map(avance, null));
        }

        return Ok(Map(avance, null));
    }

    // POST api/avances/{id}/fotos
    [HttpPost("{id}/fotos")]
    public async Task<IActionResult> AddFotos(int id, [FromBody] List<FotoRequest> fotos)
    {
        var avance = await _uow.AvancesObra.GetByIdAsync(id);
        if (avance is null) return NotFound();

        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        if (!perfiles.Any(p => p.Id == avance.ConstructorId))
            return Forbid();

        var result = new List<object>();
        foreach (var foto in fotos)
        {
            var url = await SaveBase64Async(foto.Base64, foto.Nombre, foto.Tipo);
            if (url is not null)
            {
                var entity = await _uow.FotosAvance.AddAsync(new FotoAvance
                {
                    AvanceObraId  = id,
                    Url           = url,
                    NombreArchivo = foto.Nombre,
                    Tipo          = foto.Tipo ?? "foto",
                    TamanioBytes  = foto.TamanioBytes,
                });
                result.Add(MapFoto(entity));
            }
        }
        await _uow.SaveChangesAsync();
        return Ok(result);
    }

    // DELETE api/avances/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var avance = await _uow.AvancesObra.GetByIdAsync(id);
        if (avance is null) return NotFound();

        var perfiles = await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == UserId);
        if (!perfiles.Any(p => p.Id == avance.ConstructorId))
            return Forbid();

        // Eliminar fotos físicas
        var fotos = await _uow.FotosAvance.FindAsync(f => f.AvanceObraId == id);
        foreach (var foto in fotos)
            DeleteFile(foto.Url);

        await _uow.AvancesObra.DeleteAsync(avance);
        await _uow.SaveChangesAsync();
        return NoContent();
    }

    // DELETE api/avances/{id}/fotos/{fotoId}
    [HttpDelete("{id}/fotos/{fotoId}")]
    public async Task<IActionResult> DeleteFoto(int id, int fotoId)
    {
        var foto = await _uow.FotosAvance.GetByIdAsync(fotoId);
        if (foto is null || foto.AvanceObraId != id) return NotFound();

        DeleteFile(foto.Url);
        await _uow.FotosAvance.DeleteAsync(foto);
        await _uow.SaveChangesAsync();
        return NoContent();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<string?> SaveBase64Async(string? base64, string nombre, string? tipo)
    {
        if (string.IsNullOrWhiteSpace(base64)) return null;
        try
        {
            // Soporta data:image/jpeg;base64,... y raw base64
            var data = base64.Contains(',') ? base64[(base64.IndexOf(',') + 1)..] : base64;
            var bytes = Convert.FromBase64String(data);

            var folder = Path.Combine(_env.WebRootPath, "uploads", "avances");
            Directory.CreateDirectory(folder);

            var ext  = Path.GetExtension(nombre);
            if (string.IsNullOrEmpty(ext)) ext = tipo == "video" ? ".mp4" : ".jpg";
            var fileName = $"{Guid.NewGuid()}{ext}";
            var path     = Path.Combine(folder, fileName);

            await System.IO.File.WriteAllBytesAsync(path, bytes);
            return $"/uploads/avances/{fileName}";
        }
        catch { return null; }
    }

    private void DeleteFile(string? url)
    {
        if (string.IsNullOrEmpty(url)) return;
        try
        {
            var path = Path.Combine(_env.WebRootPath, url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
        }
        catch { }
    }

    private static object Map(AvanceObra a, List<FotoAvance>? fotos) => new
    {
        a.Id, a.ProyectoId, a.ConstructorId,
        a.Titulo, a.Descripcion, a.Responsable,
        a.PorcentajeAvance, a.Fecha,
        Fotos = fotos?.Select(MapFoto) ?? Enumerable.Empty<object>(),
    };

    private static object MapFoto(FotoAvance f) => new
    {
        f.Id, f.AvanceObraId, f.Url, f.NombreArchivo, f.Tipo, f.TamanioBytes, f.FechaSubida,
    };
}

public record AvanceRequest(
    int ProyectoId,
    string Descripcion,
    int PorcentajeAvance,
    string? Titulo = null,
    string? Responsable = null,
    List<FotoRequest>? Fotos = null);

public record FotoRequest(
    string? Base64,
    string Nombre,
    string? Tipo = "foto",
    long? TamanioBytes = null);

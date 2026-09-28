using System.Security.Claims;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentosController : ControllerBase
{
    private readonly IUnitOfWork        _uow;
    private readonly IWebHostEnvironment _env;

    public DocumentosController(IUnitOfWork uow, IWebHostEnvironment env)
    {
        _uow = uow;
        _env = env;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET api/documentos/proyecto/{proyectoId}
    [HttpGet("proyecto/{proyectoId}")]
    public async Task<IActionResult> GetByProyecto(int proyectoId, [FromQuery] string? categoria = null)
    {
        var archivos = await _uow.Archivos.FindAsync(a => a.ProyectoId == proyectoId);
        if (!string.IsNullOrEmpty(categoria))
            archivos = archivos.Where(a => a.Categoria == categoria);
        return Ok(archivos.OrderByDescending(a => a.FechaSubida).Select(Map));
    }

    // GET api/documentos/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var archivo = await _uow.Archivos.GetByIdAsync(id);
        if (archivo is null) return NotFound();
        return Ok(Map(archivo));
    }

    // POST api/documentos — sube un nuevo documento
    [HttpPost]
    public async Task<IActionResult> Upload([FromBody] DocumentoUploadRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Base64) && string.IsNullOrWhiteSpace(req.Url))
            return BadRequest(new { message = "Se requiere Base64 o Url." });

        string url;
        long?  tamanio = null;

        if (!string.IsNullOrWhiteSpace(req.Base64))
        {
            var result = await SaveBase64Async(req.Base64, req.NombreArchivo, req.Categoria);
            if (result is null)
                return BadRequest(new { message = "Error al procesar el archivo." });
            url     = result.Value.url;
            tamanio = result.Value.bytes;
        }
        else
        {
            url = req.Url!;
        }

        var archivo = new ArchivoProyecto
        {
            ProyectoId    = req.ProyectoId,
            Url           = url,
            NombreArchivo = req.NombreArchivo,
            TipoArchivo   = req.TipoArchivo ?? "doc",
            Categoria     = req.Categoria,
            Descripcion   = req.Descripcion,
            SubidoPorId   = UserId,
            Version       = req.Version ?? 1,
            TamanioBytes  = tamanio,
        };

        await _uow.Archivos.AddAsync(archivo);
        await _uow.SaveChangesAsync();
        return Ok(Map(archivo));
    }

    // PUT api/documentos/{id} — actualiza metadata o sube nueva versión
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] DocumentoUpdateRequest req)
    {
        var archivo = await _uow.Archivos.GetByIdAsync(id);
        if (archivo is null) return NotFound();

        // Si hay nuevo base64, sube nueva versión
        if (!string.IsNullOrWhiteSpace(req.Base64))
        {
            DeleteFile(archivo.Url);
            var result = await SaveBase64Async(req.Base64, req.NombreArchivo ?? archivo.NombreArchivo, archivo.Categoria);
            if (result is not null)
            {
                archivo.Url          = result.Value.url;
                archivo.TamanioBytes = result.Value.bytes;
                archivo.Version      = archivo.Version + 1;
            }
        }

        if (!string.IsNullOrWhiteSpace(req.NombreArchivo)) archivo.NombreArchivo = req.NombreArchivo;
        if (!string.IsNullOrWhiteSpace(req.Descripcion))   archivo.Descripcion   = req.Descripcion;
        if (!string.IsNullOrWhiteSpace(req.Categoria))     archivo.Categoria     = req.Categoria;
        archivo.SubidoPorId  = UserId;
        archivo.FechaSubida  = DateTime.UtcNow;

        _uow.Archivos.UpdateAsync(archivo);
        await _uow.SaveChangesAsync();
        return Ok(Map(archivo));
    }

    // DELETE api/documentos/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var archivo = await _uow.Archivos.GetByIdAsync(id);
        if (archivo is null) return NotFound();

        DeleteFile(archivo.Url);
        await _uow.Archivos.DeleteAsync(archivo);
        await _uow.SaveChangesAsync();
        return NoContent();
    }

    // GET api/documentos/proyecto/{proyectoId}/categorias — cuenta por categoría
    [HttpGet("proyecto/{proyectoId}/categorias")]
    public async Task<IActionResult> GetCategorias(int proyectoId)
    {
        var archivos = await _uow.Archivos.FindAsync(a => a.ProyectoId == proyectoId);
        var cats = archivos
            .GroupBy(a => a.Categoria ?? "Otro")
            .Select(g => new { Categoria = g.Key, Count = g.Count(), TamanioTotal = g.Sum(a => a.TamanioBytes ?? 0) });
        return Ok(cats);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private async Task<(string url, long bytes)?> SaveBase64Async(string base64, string nombre, string? categoria)
    {
        try
        {
            var data  = base64.Contains(',') ? base64[(base64.IndexOf(',') + 1)..] : base64;
            var bytes = Convert.FromBase64String(data);

            var cat    = (categoria ?? "documentos").ToLower().Replace(" ", "-");
            var folder = Path.Combine(_env.WebRootPath, "uploads", "documentos", cat);
            Directory.CreateDirectory(folder);

            var ext      = Path.GetExtension(nombre);
            if (string.IsNullOrEmpty(ext)) ext = ".bin";
            var fileName = $"{Guid.NewGuid()}{ext}";
            var path     = Path.Combine(folder, fileName);

            await System.IO.File.WriteAllBytesAsync(path, bytes);
            return ($"/uploads/documentos/{cat}/{fileName}", bytes.Length);
        }
        catch { return null; }
    }

    private void DeleteFile(string? url)
    {
        if (string.IsNullOrEmpty(url) || url.StartsWith("http")) return;
        try
        {
            var path = Path.Combine(_env.WebRootPath, url.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
            if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
        }
        catch { }
    }

    private static object Map(ArchivoProyecto a) => new
    {
        a.Id, a.ProyectoId, a.Url, a.NombreArchivo,
        a.TipoArchivo, a.Categoria, a.Descripcion,
        a.SubidoPorId, a.Version, a.TamanioBytes, a.FechaSubida,
    };
}

public record DocumentoUploadRequest(
    int     ProyectoId,
    string  NombreArchivo,
    string? Base64        = null,
    string? Url           = null,
    string? TipoArchivo   = null,
    string? Categoria     = null,
    string? Descripcion   = null,
    int?    Version       = null);

public record DocumentoUpdateRequest(
    string? NombreArchivo = null,
    string? Base64        = null,
    string? Descripcion   = null,
    string? Categoria     = null);

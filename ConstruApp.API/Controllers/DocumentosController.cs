using System.IO.Compression;
using System.Security.Claims;
using System.Text;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.API.Controllers;

[ApiController]
[Authorize]
[Route("api/documentos")]
public sealed class DocumentosController(IUnitOfWork uow, AccesoProyectoService acceso,
    IWebHostEnvironment entorno, ILogger<DocumentosController> logger) : ControllerBase
{
    private const int MaxBytes = 10 * 1024 * 1024;
    private static readonly string[] Categorias =
        ["Contratos", "Planos", "Diseños", "Permisos", "Facturas", "Fotografías", "Videos", "Otro"];

    [HttpGet("proyectos")]
    public async Task<IActionResult> Proyectos()
    {
        var resultado = new List<object>();
        foreach (var p in (await uow.Proyectos.GetAllAsync()).OrderByDescending(p => p.FechaPublicacion))
            if (await acceso.PuedeVerAsync(p, User))
                resultado.Add(new { p.Id, p.Titulo, puedeEditar = await acceso.PuedeEditarDocumentosAsync(p, User) });
        return Ok(resultado);
    }

    [HttpGet("proyecto/{proyectoId:int}")]
    public async Task<IActionResult> Listar(int proyectoId)
    {
        var proyecto = await uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();
        if (!await acceso.PuedeVerAsync(proyecto, User)) return Forbid();
        var archivos = await uow.Archivos.FindAsync(a => a.ProyectoId == proyectoId);
        return Ok(archivos.OrderByDescending(a => a.FechaSubida).ThenByDescending(a => a.Id).Select(Mapear));
    }

    [HttpGet("proyecto/{proyectoId:int}/categorias")]
    public async Task<IActionResult> ListarCategorias(int proyectoId)
    {
        var proyecto = await uow.Proyectos.GetByIdAsync(proyectoId);
        if (proyecto is null) return NotFound();
        return await acceso.PuedeVerAsync(proyecto, User) ? Ok(Categorias) : Forbid();
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Obtener(int id)
    {
        var archivo = await uow.Archivos.GetByIdAsync(id);
        if (archivo is null) return NotFound();
        var proyecto = await uow.Proyectos.GetByIdAsync(archivo.ProyectoId);
        if (proyecto is null || !await acceso.PuedeVerAsync(proyecto, User)) return Forbid();
        return Ok(Mapear(archivo));
    }

    [HttpGet("{id:int}/contenido")]
    public async Task<IActionResult> Contenido(int id)
    {
        var archivo = await uow.Archivos.GetByIdAsync(id);
        if (archivo is null) return NotFound();
        var proyecto = await uow.Proyectos.GetByIdAsync(archivo.ProyectoId);
        if (proyecto is null || !await acceso.PuedeVerAsync(proyecto, User)) return Forbid();
        var ruta = Ruta(archivo.Url);
        if (ruta is null || !System.IO.File.Exists(ruta)) return NotFound(new { message = "El archivo no está disponible." });
        return PhysicalFile(ruta, "application/octet-stream", archivo.NombreArchivo);
    }

    [HttpPost]
    [RequestSizeLimit(15 * 1024 * 1024)]
    public async Task<IActionResult> Crear(DocumentoRequest req) => await Guardar(null, req);

    [HttpPut("{id:int}")]
    [RequestSizeLimit(15 * 1024 * 1024)]
    public async Task<IActionResult> Actualizar(int id, DocumentoRequest req) => await Guardar(id, req);

    private async Task<IActionResult> Guardar(int? id, DocumentoRequest req)
    {
        var archivo = id.HasValue ? await uow.Archivos.GetByIdAsync(id.Value) : null;
        if (id.HasValue && archivo is null) return NotFound();
        var proyecto = await uow.Proyectos.GetByIdAsync(archivo?.ProyectoId ?? req.ProyectoId);
        if (proyecto is null) return NotFound();
        if (!await acceso.PuedeEditarDocumentosAsync(proyecto, User)) return Forbid();
        if (id.HasValue && (req.Version is null or <= 0))
            return BadRequest(new { message = "Indicá la versión del documento que abriste antes de editarlo." });
        if (archivo is not null && req.Version != archivo.Version)
            return Conflict(new { message = "Otra persona modificó el documento. Compará tus cambios con la versión actual antes de guardar." });
        var nombre = req.NombreArchivo?.Trim();
        if (string.IsNullOrEmpty(nombre) || nombre.Length > 180 || nombre.IndexOfAny(['/', '\\']) >= 0 ||
            req.Descripcion?.Trim().Length > 300 || !Categorias.Contains(req.Categoria ?? ""))
            return BadRequest(new { message = "Indicá un nombre válido, una categoría y una descripción de hasta 300 caracteres." });
        if (archivo is null && string.IsNullOrWhiteSpace(req.Base64))
            return BadRequest(new { message = "Seleccioná el archivo que querés adjuntar." });

        byte[]? bytes = null;
        string? extension = null;
        if (!string.IsNullOrWhiteSpace(req.Base64))
        {
            var cadena = req.Base64;
            var coma = cadena.IndexOf(',');
            var codificado = coma >= 0 ? cadena[(coma + 1)..] : cadena;
            if (codificado.Length > ((MaxBytes + 2) / 3) * 4)
                return BadRequest(new { message = "El archivo supera el máximo de 10 MB." });
            try { bytes = Convert.FromBase64String(codificado); }
            catch (FormatException) { return BadRequest(new { message = "El archivo está dañado o no tiene una codificación válida." }); }
            if (bytes.Length is 0 or > MaxBytes)
                return BadRequest(new { message = "El archivo debe contener datos y no superar 10 MB." });
            extension = ExtensionValida(bytes);
            if (extension is null)
                return BadRequest(new { message = "Formato inválido o dañado. Usá PDF, JPEG, PNG, GIF, WebP, DOCX o XLSX." });
        }

        var anterior = archivo?.Url;
        archivo ??= new ArchivoProyecto { ProyectoId = proyecto.Id, SubidoPorId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!) };
        string? nuevaRuta = null;
        try
        {
            if (bytes is not null)
            {
                archivo.Url = $"private/documentos/{Guid.NewGuid():N}{extension}";
                nuevaRuta = Ruta(archivo.Url)!;
                Directory.CreateDirectory(Path.GetDirectoryName(nuevaRuta)!);
                await System.IO.File.WriteAllBytesAsync(nuevaRuta, bytes);
                archivo.TamanioBytes = bytes.LongLength;
                archivo.TipoArchivo = extension == ".pdf" ? "pdf" : extension is ".docx" or ".xlsx" ? "doc" : "image";
            }
            archivo.NombreArchivo = nombre;
            archivo.Categoria = req.Categoria;
            archivo.Descripcion = req.Descripcion?.Trim();
            if (id.HasValue) archivo.Version++;
            if (!id.HasValue) await uow.Archivos.AddAsync(archivo);
            await uow.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            Limpiar(nuevaRuta);
            return Conflict(new { message = "El documento cambió. Actualizá la lista antes de editarlo." });
        }
        catch
        {
            Limpiar(nuevaRuta);
            throw;
        }
        if (bytes is not null && anterior is not null) Limpiar(RutaPrivada(anterior));
        return id.HasValue ? Ok(Mapear(archivo)) : CreatedAtAction(nameof(Obtener), new { id = archivo.Id }, Mapear(archivo));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var archivo = await uow.Archivos.GetByIdAsync(id);
        if (archivo is null) return NotFound();
        var proyecto = await uow.Proyectos.GetByIdAsync(archivo.ProyectoId);
        if (proyecto is null || !await acceso.PuedeEditarDocumentosAsync(proyecto, User)) return Forbid();
        var ruta = RutaPrivada(archivo.Url);
        await uow.Archivos.DeleteAsync(archivo);
        await uow.SaveChangesAsync();
        Limpiar(ruta);
        return NoContent();
    }

    private string? RutaPrivada(string url) => url.StartsWith("private/documentos/", StringComparison.Ordinal)
        ? DentroDe(Path.Combine(entorno.ContentRootPath, "App_Data", "documentos"), url["private/documentos/".Length..]) : null;

    private string? Ruta(string url) => RutaPrivada(url) ??
        (url.StartsWith("/uploads/", StringComparison.Ordinal) ? DentroDe(
            Path.Combine(entorno.WebRootPath ?? Path.Combine(entorno.ContentRootPath, "wwwroot"), "uploads"), url["/uploads/".Length..]) : null);

    private static string? DentroDe(string raiz, string relativo)
    {
        var absoluta = Path.GetFullPath(Path.Combine(raiz, relativo));
        return absoluta.StartsWith(Path.GetFullPath(raiz) + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)
            ? absoluta : null;
    }

    private void Limpiar(string? ruta)
    {
        try { if (ruta is not null) System.IO.File.Delete(ruta); }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException)
        { logger.LogWarning(ex, "No se pudo limpiar un archivo de documentos."); }
    }

    private static object Mapear(ArchivoProyecto a) => new
    {
        a.Id, a.ProyectoId, a.NombreArchivo, a.TipoArchivo, a.Categoria, a.Descripcion,
        a.Version, a.TamanioBytes, a.FechaSubida, url = $"/api/documentos/{a.Id}/contenido"
    };

    private static string? ExtensionValida(byte[] bytes)
    {
        ReadOnlySpan<byte> datos = bytes;
        if (datos.StartsWith("%PDF-"u8) && Encoding.ASCII.GetString(bytes.AsSpan(Math.Max(0, bytes.Length - 2048))).Contains("%%EOF")) return ".pdf";
        if (datos.StartsWith(new byte[] { 255, 216, 255 }) && bytes.Length > 4 && bytes[^2] == 255 && bytes[^1] == 217) return ".jpg";
        if (datos.StartsWith(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }) &&
            bytes.Length > 32 && datos[^8..^4].SequenceEqual("IEND"u8)) return ".png";
        if ((datos.StartsWith("GIF87a"u8) || datos.StartsWith("GIF89a"u8)) && bytes.Length > 13 && bytes[^1] == 59) return ".gif";
        if (bytes.Length > 20 && datos.StartsWith("RIFF"u8) && datos[8..12].SequenceEqual("WEBP"u8)) return ".webp";
        if (!datos.StartsWith("PK\x03\x04"u8)) return null;
        try
        {
            using var zip = new ZipArchive(new MemoryStream(bytes), ZipArchiveMode.Read);
            if (zip.GetEntry("[Content_Types].xml") is null) return null;
            if (zip.GetEntry("word/document.xml") is not null) return ".docx";
            if (zip.GetEntry("xl/workbook.xml") is not null) return ".xlsx";
        }
        catch (InvalidDataException) { }
        return null;
    }
}

public sealed record DocumentoRequest(int ProyectoId, string? NombreArchivo, string? Base64,
    string? TipoArchivo, string? Categoria, string? Descripcion, int? Version = null);

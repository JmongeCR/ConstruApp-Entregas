using System.Security.Claims;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/perfiles/constructor")]
[Authorize]
public class PerfilesConstructorController : ControllerBase
{
    private readonly IUnitOfWork       _uow;
    private readonly IAuditoriaService _auditoria;
    private readonly IWebHostEnvironment _environment;

    private const long MaxImageBytes = 5 * 1024 * 1024;
    private static readonly Dictionary<string, string[]> AllowedImageTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = ["image/jpeg"],
        [".jpeg"] = ["image/jpeg"],
        [".png"] = ["image/png"],
        [".webp"] = ["image/webp"],
    };

    public PerfilesConstructorController(
        IUnitOfWork uow,
        IAuditoriaService auditoria,
        IWebHostEnvironment environment)
    {
        _uow       = uow;
        _auditoria = auditoria;
        _environment = environment;
    }

    // GET api/perfiles/constructor
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] string? nombre, [FromQuery] string? zona)
    {
        var perfiles = await _uow.PerfilesConstructor.FindAsync(p =>
            (string.IsNullOrEmpty(nombre) || p.NombreEmpresa.Contains(nombre)) &&
            (string.IsNullOrEmpty(zona)   || (p.ZonasCobertura ?? "").Contains(zona)));

        return Ok(await MapDtosAsync(perfiles.OrderByDescending(p => p.CalificacionPromedio)));
    }

    // GET api/perfiles/constructor/mio
    [HttpGet("mio")]
    public async Task<IActionResult> GetMio()
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var perfil = (await _uow.PerfilesConstructor.FindAsync(p => p.UsuarioId == userId)).FirstOrDefault();
        if (perfil is null) return NotFound(new { message = "No tenés perfil de empresa." });
        return Ok(await MapDtoAsync(perfil));
    }

    // GET api/perfiles/constructor/{id}
    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var perfil = await _uow.PerfilesConstructor.GetByIdAsync(id);
        if (perfil is null) return NotFound();
        return Ok(await MapDtoAsync(perfil));
    }

    // POST api/perfiles/constructor
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PerfilConstructorRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.NombreEmpresa))
            return BadRequest(new { message = "El nombre de la empresa es requerido." });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var existe = await _uow.PerfilesConstructor.ExistsAsync(p => p.UsuarioId == userId);
        if (existe)
            return Conflict(new { message = "Ya tenés un perfil de empresa registrado. Usá PUT para actualizarlo." });

        // Validar cédula jurídica única si se provee
        if (!string.IsNullOrWhiteSpace(req.CedulaJuridica))
        {
            var cedDup = await _uow.PerfilesConstructor.ExistsAsync(p => p.CedulaJuridica == req.CedulaJuridica);
            if (cedDup)
                return Conflict(new { message = "La cédula jurídica ya está registrada por otra empresa." });
        }

        var perfil = new PerfilConstructor
        {
            UsuarioId        = userId,
            NombreEmpresa    = req.NombreEmpresa.Trim(),
            Bio              = req.Bio,
            Especialidades   = req.Especialidades,
            ZonasCobertura   = req.ZonasCobertura,
            AniosExperiencia = req.AniosExperiencia,
            CedulaJuridica   = req.CedulaJuridica?.Trim(),
            Telefono         = req.Telefono,
            EmailContacto    = req.EmailContacto,
            SitioWeb         = req.SitioWeb,
            Instagram        = req.Instagram,
            Verificado       = false,
        };

        await _uow.PerfilesConstructor.AddAsync(perfil);
        await _uow.SaveChangesAsync();

        var nombre = User.FindFirstValue("nombre") ?? "Usuario";
        await _auditoria.RegistrarAsync(userId, nombre, "RegistrarEmpresa", "PerfilesConstructor",
            perfil.Id.ToString(), $"Empresa: {perfil.NombreEmpresa}",
            HttpContext.Connection.RemoteIpAddress?.ToString());

        return CreatedAtAction(nameof(GetMio), await MapDtoAsync(perfil));
    }

    // PUT api/perfiles/constructor/{id}
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] PerfilConstructorRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.NombreEmpresa))
            return BadRequest(new { message = "El nombre de la empresa es requerido." });

        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var perfil = await _uow.PerfilesConstructor.GetByIdAsync(id);
        if (perfil is null) return NotFound();
        if (perfil.UsuarioId != userId) return Forbid();

        // Validar cédula jurídica única (excluyendo la propia)
        if (!string.IsNullOrWhiteSpace(req.CedulaJuridica) && req.CedulaJuridica != perfil.CedulaJuridica)
        {
            var cedDup = await _uow.PerfilesConstructor.ExistsAsync(
                p => p.CedulaJuridica == req.CedulaJuridica && p.Id != id);
            if (cedDup)
                return Conflict(new { message = "La cédula jurídica ya está registrada por otra empresa." });
        }

        perfil.NombreEmpresa    = req.NombreEmpresa.Trim();
        perfil.Bio              = req.Bio;
        perfil.Especialidades   = req.Especialidades;
        perfil.ZonasCobertura   = req.ZonasCobertura;
        perfil.AniosExperiencia = req.AniosExperiencia;
        perfil.CedulaJuridica   = req.CedulaJuridica?.Trim();
        perfil.Telefono         = req.Telefono;
        perfil.EmailContacto    = req.EmailContacto;
        perfil.SitioWeb         = req.SitioWeb;
        perfil.Instagram        = req.Instagram;

        await _uow.PerfilesConstructor.UpdateAsync(perfil);
        await _uow.SaveChangesAsync();

        return Ok(await MapDtoAsync(perfil));
    }

    // POST api/perfiles/constructor/{id}/portafolio
    [HttpPost("{id:int}/portafolio")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(42 * 1024 * 1024)]
    public async Task<IActionResult> AddPortafolio(int id, [FromForm] CrearPortafolioRequest req)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var perfil = await _uow.PerfilesConstructor.GetByIdAsync(id);
        if (perfil is null) return NotFound(new { message = "No se encontró el perfil de empresa." });
        if (perfil.UsuarioId != userId) return Forbid();

        var titulo = req.Titulo?.Trim() ?? string.Empty;
        var descripcion = req.Descripcion?.Trim();
        if (string.IsNullOrWhiteSpace(titulo))
            return BadRequest(new { message = "El título del proyecto es requerido." });
        if (titulo.Length > 200)
            return BadRequest(new { message = "El título no puede superar 200 caracteres." });
        if (descripcion?.Length > 1000)
            return BadRequest(new { message = "La descripción no puede superar 1000 caracteres." });
        if (req.Imagenes.Count is < 1 or > 8)
            return BadRequest(new { message = "Debés adjuntar entre 1 y 8 fotografías." });

        foreach (var image in req.Imagenes)
        {
            var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
            if (image.Length == 0 || image.Length > MaxImageBytes)
                return BadRequest(new { message = $"La imagen '{image.FileName}' debe pesar entre 1 byte y 5 MB." });
            if (!AllowedImageTypes.TryGetValue(extension, out var contentTypes) ||
                !contentTypes.Contains(image.ContentType, StringComparer.OrdinalIgnoreCase))
                return BadRequest(new { message = $"El archivo '{image.FileName}' no es una imagen JPG, PNG o WebP permitida." });
            if (!await HasValidImageSignatureAsync(image, extension))
                return BadRequest(new { message = $"El contenido de '{image.FileName}' no corresponde a una imagen válida." });
        }

        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var relativeDirectory = Path.Combine("uploads", "portafolio", id.ToString());
        var absoluteDirectory = Path.Combine(webRoot, relativeDirectory);
        Directory.CreateDirectory(absoluteDirectory);

        var savedPaths = new List<string>();
        var imageUrls = new List<string>();
        PortafolioItem item;
        try
        {
            foreach (var image in req.Imagenes)
            {
                var fileName = $"{Guid.NewGuid():N}{Path.GetExtension(image.FileName).ToLowerInvariant()}";
                var absolutePath = Path.Combine(absoluteDirectory, fileName);
                await using var stream = System.IO.File.Create(absolutePath);
                await image.CopyToAsync(stream);
                savedPaths.Add(absolutePath);
                imageUrls.Add($"/{relativeDirectory.Replace('\\', '/')}/{fileName}");
            }

            item = new PortafolioItem
            {
                ConstructorId = perfil.Id,
                Titulo = titulo,
                Descripcion = string.IsNullOrWhiteSpace(descripcion) ? null : descripcion,
                ImagenUrl = imageUrls[0],
                Fecha = DateTime.UtcNow,
            };
            await _uow.PortafolioItems.AddAsync(item);

            for (var index = 0; index < imageUrls.Count; index++)
            {
                await _uow.PortafolioImagenes.AddAsync(new PortafolioImagen
                {
                    PortafolioItem = item,
                    Url = imageUrls[index],
                    Orden = index,
                });
            }

            await _uow.SaveChangesAsync();
        }
        catch
        {
            foreach (var path in savedPaths.Where(System.IO.File.Exists))
                System.IO.File.Delete(path);
            throw;
        }

        await _auditoria.RegistrarAsync(userId, User.FindFirstValue("nombre") ?? "Usuario",
            "PublicarPortafolio", "PerfilesConstructor", item.Id.ToString(),
            $"Proyecto: {item.Titulo}; fotografías: {imageUrls.Count}",
            HttpContext.Connection.RemoteIpAddress?.ToString());

        return StatusCode(StatusCodes.Status201Created, MapPortafolioItem(item,
            item.Imagenes.OrderBy(i => i.Orden)));
    }

    // ── Helpers ──────────────────────────────────────────────────────────────────
    private async Task<object> MapDtoAsync(PerfilConstructor perfil)
        => (await MapDtosAsync([perfil])).Single();

    private async Task<IEnumerable<object>> MapDtosAsync(IEnumerable<PerfilConstructor> perfiles)
    {
        var profileList = perfiles.ToList();
        var profileIds = profileList.Select(p => p.Id).ToArray();
        var items = (await _uow.PortafolioItems.FindAsync(p => profileIds.Contains(p.ConstructorId)))
            .OrderByDescending(p => p.Fecha)
            .ToList();
        var itemIds = items.Select(i => i.Id).ToArray();
        var images = (await _uow.PortafolioImagenes.FindAsync(i => itemIds.Contains(i.PortafolioItemId)))
            .OrderBy(i => i.Orden)
            .ToList();

        return profileList.Select(p => MapDto(
            p,
            items.Where(i => i.ConstructorId == p.Id),
            images));
    }

    private static object MapDto(
        PerfilConstructor p,
        IEnumerable<PortafolioItem> items,
        IEnumerable<PortafolioImagen> images) => new
    {
        p.Id,
        p.UsuarioId,
        p.NombreEmpresa,
        p.Bio,
        p.Especialidades,
        p.ZonasCobertura,
        p.AniosExperiencia,
        p.CedulaJuridica,
        p.Telefono,
        p.EmailContacto,
        p.SitioWeb,
        p.Instagram,
        p.Verificado,
        p.CalificacionPromedio,
        p.TotalProyectos,
        PortafolioItems = items.Select(item => MapPortafolioItem(
            item,
            images.Where(image => image.PortafolioItemId == item.Id)))
    };

    private static object MapPortafolioItem(
        PortafolioItem item,
        IEnumerable<PortafolioImagen> images)
    {
        var imageUrls = images.OrderBy(i => i.Orden).Select(i => i.Url).ToList();
        if (imageUrls.Count == 0 && !string.IsNullOrWhiteSpace(item.ImagenUrl))
            imageUrls.Add(item.ImagenUrl);

        return new
        {
            item.Id,
            item.Titulo,
            item.Descripcion,
            item.ImagenUrl,
            ImagenUrls = imageUrls,
            item.Fecha,
        };
    }

    private static async Task<bool> HasValidImageSignatureAsync(IFormFile file, string extension)
    {
        var header = new byte[12];
        await using var stream = file.OpenReadStream();
        var bytesRead = await stream.ReadAsync(header.AsMemory(0, header.Length));

        return extension switch
        {
            ".jpg" or ".jpeg" => bytesRead >= 3 &&
                header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
            ".png" => bytesRead >= 8 &&
                header.AsSpan(0, 8).SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }),
            ".webp" => bytesRead >= 12 &&
                header.AsSpan(0, 4).SequenceEqual("RIFF"u8) &&
                header.AsSpan(8, 4).SequenceEqual("WEBP"u8),
            _ => false,
        };
    }
}

public record PerfilConstructorRequest(
    string  NombreEmpresa,
    string? Bio,
    string? Especialidades,
    string? ZonasCobertura,
    int     AniosExperiencia,
    string? CedulaJuridica,
    string? Telefono,
    string? EmailContacto,
    string? SitioWeb,
    string? Instagram
);

public class CrearPortafolioRequest
{
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public List<IFormFile> Imagenes { get; set; } = [];
}

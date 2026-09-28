using ConstruApp.API.Filters;
using ConstruApp.API.Services;
using ConstruApp.Core.Constants;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using ConstruApp.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly UserManager<Usuario> _userManager;
    private readonly AppDbContext         _db;
    private readonly IAuditoriaService    _auditoria;
    private readonly IEmailService        _email;
    private readonly IConfiguration       _config;

    public AdminController(UserManager<Usuario> userManager, AppDbContext db, IAuditoriaService auditoria, IEmailService email, IConfiguration config)
    {
        _userManager = userManager;
        _db          = db;
        _auditoria   = auditoria;
        _email       = email;
        _config      = config;
    }

    // ── DASHBOARD STATS ───────────────────────────────────────────────────────
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var hace30 = DateTime.UtcNow.AddDays(-30);

        var uploadsPath  = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        var uploadsBytes = Directory.Exists(uploadsPath)
            ? new DirectoryInfo(uploadsPath).GetFiles("*", SearchOption.AllDirectories).Sum(f => f.Length)
            : 0L;

        return Ok(new
        {
            usuarios = new
            {
                total         = await _userManager.Users.CountAsync(),
                activos       = await _userManager.Users.CountAsync(u => u.Activo),
                bloqueados    = await _userManager.Users.CountAsync(u => !u.Activo),
                nuevosEste30d = await _userManager.Users.CountAsync(u => u.CreatedAt >= hace30),
            },
            sistema = new
            {
                auditLogs30d  = await _db.AuditoriaLogs.CountAsync(a => a.Fecha >= hace30),
                version       = "1.0.0",
                ambiente      = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
                uploadsSizeMb = Math.Round(uploadsBytes / 1_048_576.0, 2),
                dbConectada   = true,
            }
        });
    }

    // ── USUARIOS ──────────────────────────────────────────────────────────────
    [HttpGet("usuarios")]
    public async Task<IActionResult> GetUsuarios(
        [FromQuery] string? rol,
        [FromQuery] string? buscar,
        [FromQuery] bool?   activo,
        [FromQuery] int?    empresaId,
        [FromQuery] int     page  = 1,
        [FromQuery] int     limit = 50)
    {
        var query = _userManager.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(rol) && Enum.TryParse<Rol>(rol, true, out var rolEnum))
            query = query.Where(u => u.Rol == rolEnum);

        if (activo.HasValue)
            query = query.Where(u => u.Activo == activo.Value);

        if (!string.IsNullOrWhiteSpace(buscar))
            query = query.Where(u =>
                (u.Nombre != null && u.Nombre.Contains(buscar)) ||
                (u.Email  != null && u.Email.Contains(buscar)));

        // Filtrar por empresa: dueños o miembros aceptados/pendientes-directo
        if (empresaId.HasValue)
        {
            var miembrosIds = await _db.Invitaciones
                .Where(i => i.EmpresaId == empresaId.Value &&
                    (i.Estado == "Aceptada" || (i.Tipo == "Directo" && i.Estado == "Pendiente")))
                .Select(i => i.AceptadoPorId ?? i.UsuarioCreadorId)
                .Where(id => id != null)
                .ToListAsync();
            var duenoId = await _db.PerfilesConstructor
                .Where(p => p.Id == empresaId.Value)
                .Select(p => (int?)p.UsuarioId)
                .FirstOrDefaultAsync();
            var ids = miembrosIds.OfType<int>().ToHashSet();
            if (duenoId.HasValue) ids.Add(duenoId.Value);
            query = query.Where(u => ids.Contains(u.Id));
        }

        var total = await query.CountAsync();
        var users = await query
            .OrderBy(u => u.Rol).ThenBy(u => u.Nombre)
            .Skip((page - 1) * limit).Take(limit)
            .ToListAsync();

        // Enriquecer con nombre de empresa
        var userIds  = users.Select(u => u.Id).ToList();
        var perfiles = await _db.PerfilesConstructor
            .Where(p => userIds.Contains(p.UsuarioId))
            .Select(p => new { p.UsuarioId, p.Id, p.NombreEmpresa })
            .ToListAsync();
        var membresias = await _db.Invitaciones
            .Include(i => i.Empresa)
            .Where(i => (i.AceptadoPorId != null && userIds.Contains(i.AceptadoPorId.Value)) ||
                        (i.UsuarioCreadorId != null && userIds.Contains(i.UsuarioCreadorId.Value)))
            .Where(i => i.Estado == "Aceptada" || (i.Tipo == "Directo" && i.Estado == "Pendiente"))
            .Select(i => new { UserId = i.AceptadoPorId ?? i.UsuarioCreadorId, i.EmpresaId, NombreEmpresa = i.Empresa.NombreEmpresa })
            .ToListAsync();

        var data = users.Select(u => {
            var perfil = perfiles.FirstOrDefault(p => p.UsuarioId == u.Id);
            var memb   = membresias.FirstOrDefault(m => m.UserId == u.Id);
            return new {
                u.Id, u.Nombre, u.Email, u.Telefono,
                Rol           = u.Rol.ToString(),
                u.Activo,
                EstadoCuenta  = u.EstadoCuenta,
                u.CreatedAt,
                u.UltimoAcceso,
                EmpresaId     = perfil?.Id ?? memb?.EmpresaId,
                NombreEmpresa = perfil?.NombreEmpresa ?? memb?.NombreEmpresa,
                EsDueno       = perfil != null,
            };
        });

        return Ok(new { total, page, limit, data });
    }

    [HttpPost("usuarios/crear")]
    public async Task<IActionResult> CrearUsuario([FromBody] CrearUsuarioRequest req)
    {
        if (await _userManager.FindByEmailAsync(req.Email) is not null)
            return Conflict(new { message = "El email ya está registrado." });

        if (!Enum.TryParse<Rol>(req.Rol, true, out var rol))
            return BadRequest(new { message = "Rol inválido." });

        // Contraseña temporal
        var tempPass = Guid.NewGuid().ToString("N")[..8] + "Aa1!";

        var user = new Usuario
        {
            UserName       = req.Email,
            Email          = req.Email,
            Nombre         = req.Nombre.Trim(),
            Telefono       = req.Telefono?.Trim(),
            Rol            = rol,
            Activo         = true,
            EmailConfirmed = true,
            CreatedAt      = DateTime.UtcNow,
        };
        var result = await _userManager.CreateAsync(user, tempPass);
        if (!result.Succeeded) return BadRequest(result.Errors);

        // Si tiene empresa → crear invitación Directo para registrar membresía
        if (req.EmpresaId.HasValue)
        {
            var empresa = await _db.PerfilesConstructor.FindAsync(req.EmpresaId.Value);
            if (empresa is null) return BadRequest(new { message = "Empresa no encontrada." });

            var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            _db.Invitaciones.Add(new Invitacion
            {
                Email            = req.Email,
                RolWorkspace     = req.Rol,
                Token            = Guid.NewGuid().ToString("N"),
                EmpresaId        = req.EmpresaId.Value,
                InvitadoPorId    = adminId,
                UsuarioCreadorId = user.Id,
                FechaCreacion    = DateTime.UtcNow,
                FechaExpiracion  = DateTime.UtcNow.AddYears(10),
                Estado           = "Aceptada",
                Tipo             = "Directo",
                AceptadoPorId    = user.Id,
                FechaAceptacion  = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync();
        }
        else if (rol == Rol.Constructor)
        {
            _db.PerfilesConstructor.Add(new PerfilConstructor { UsuarioId = user.Id, NombreEmpresa = req.Nombre });
            await _db.SaveChangesAsync();
        }

        var baseUrl = _config["AppBaseUrl"] ?? "https://construapp.runasp.net";
        await _email.EnviarAsync(new Core.Interfaces.EmailMessage(
            Para:     req.Email,
            Asunto:   "Tu cuenta en ConstruApp fue creada",
            HtmlBody: EmailTemplates.UsuarioCreado(req.Nombre, req.Email, tempPass, $"{baseUrl}/login"),
            Evento:   "usuario_creado",
            UsuarioId: user.Id
        ));

        var adminIdLog = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        await _auditoria.RegistrarAsync(adminIdLog, "Admin", "CrearUsuario", "Usuarios",
            user.Id.ToString(), $"Email: {req.Email}, Rol: {rol}");

        return Ok(new { user.Id, user.Nombre, user.Email, Rol = user.Rol.ToString(), user.Activo });
    }

    [HttpGet("usuarios/{id}")]
    public async Task<IActionResult> GetUsuario(int id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        var overrides = await _db.UsuarioPermisos
            .Where(up => up.UsuarioId == id)
            .Select(up => new { up.PermisoCodigo, up.Concedido, up.Motivo, up.Fecha })
            .ToListAsync();

        var proyectos = await _db.Proyectos
            .Where(p => p.ClienteId == id)
            .Select(p => new { p.Id, p.Titulo, Estado = p.Estado.ToString(), p.FechaPublicacion })
            .ToListAsync();

        return Ok(new
        {
            user.Id, user.Nombre, user.Email, user.Telefono,
            Rol           = user.Rol.ToString(),
            user.Activo,
            user.CreatedAt,
            user.UltimoAcceso,
            permisosExtra = overrides,
            proyectos,
        });
    }

    [HttpPut("usuarios/{id}/rol")]
    public async Task<IActionResult> CambiarRol(int id, [FromBody] CambiarRolRequest req)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();
        var rolAnterior = user.Rol.ToString();
        user.Rol = req.Rol;
        await _userManager.UpdateAsync(user);

        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        await _auditoria.RegistrarAsync(adminId, "Admin",
            "CambiarRol", "Usuarios", id.ToString(),
            $"Rol: {rolAnterior} → {req.Rol}");

        return Ok(new { user.Id, user.Nombre, Rol = user.Rol.ToString() });
    }

    [HttpPut("usuarios/{id}/bloquear")]
    public async Task<IActionResult> BloquearUsuario(int id, [FromBody] BloquearRequest? req = null)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();
        user.Activo = false;
        await _userManager.UpdateAsync(user);

        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        await _auditoria.RegistrarAsync(adminId, "Admin",
            "BloquearUsuario", "Usuarios", id.ToString(),
            $"Motivo: {req?.Motivo ?? "Sin motivo"}");

        return Ok(new { message = $"Usuario {user.Nombre} bloqueado." });
    }

    [HttpPut("usuarios/{id}/activar")]
    public async Task<IActionResult> ActivarUsuario(int id)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();
        user.Activo = true;
        await _userManager.UpdateAsync(user);

        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        await _auditoria.RegistrarAsync(adminId, "Admin",
            "ActivarUsuario", "Usuarios", id.ToString(), null);

        return Ok(new { message = $"Usuario {user.Nombre} activado." });
    }

    [HttpDelete("usuarios/{id}")]
    public async Task<IActionResult> EliminarUsuario(int id)
    {
        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        if (id == adminId)
            return BadRequest(new { message = "No podés eliminar tu propia cuenta." });

        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        // Desvincular membresías activas
        var invitaciones = await _db.Invitaciones
            .Where(i => i.AceptadoPorId == id || i.UsuarioCreadorId == id)
            .ToListAsync();
        foreach (var inv in invitaciones) inv.Estado = "Removida";

        // Soft delete: marcar como eliminado
        user.Activo       = false;
        user.EstadoCuenta = "Eliminado";
        // Anonimizar email para liberar el slot (evita colisiones si se quiere reusar)
        user.Email        = $"deleted_{id}_{user.Email}";
        user.UserName     = user.Email;
        user.NormalizedEmail    = user.Email.ToUpperInvariant();
        user.NormalizedUserName = user.Email.ToUpperInvariant();

        await _userManager.UpdateAsync(user);
        await _db.SaveChangesAsync();

        await _auditoria.RegistrarAsync(adminId, "Admin", "EliminarUsuario", "Usuarios",
            id.ToString(), $"Email original: {user.Nombre}");

        return Ok(new { message = $"Usuario eliminado." });
    }

    [HttpPost("usuarios/{id}/reset-password")]
    public async Task<IActionResult> ResetPassword(int id, [FromBody] ResetPasswordRequest req)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        var token  = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, token, req.NuevaContrasena);
        if (!result.Succeeded) return BadRequest(result.Errors);

        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        await _auditoria.RegistrarAsync(adminId, "Admin",
            "ResetPassword", "Usuarios", id.ToString(), null);

        return Ok(new { message = "Contraseña restablecida." });
    }

    [HttpPut("usuarios/{id}")]
    public async Task<IActionResult> EditarUsuario(int id, [FromBody] EditarUsuarioRequest req)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();

        if (!string.IsNullOrWhiteSpace(req.Nombre))   user.Nombre   = req.Nombre;
        if (!string.IsNullOrWhiteSpace(req.Telefono)) user.Telefono = req.Telefono;
        if (req.Activo.HasValue)                      user.Activo   = req.Activo.Value;
        if (!string.IsNullOrWhiteSpace(req.Rol) && Enum.TryParse<Rol>(req.Rol, true, out var nuevoRol))
            user.Rol = nuevoRol;

        await _userManager.UpdateAsync(user);

        // Cambiar empresa: mover membresía a nueva empresa
        if (req.EmpresaId.HasValue)
        {
            // Marcar membresías anteriores como removidas
            var viejas = await _db.Invitaciones
                .Where(i => (i.AceptadoPorId == user.Id || i.UsuarioCreadorId == user.Id) &&
                             i.Estado == "Aceptada" && i.Tipo == "Directo")
                .ToListAsync();
            foreach (var v in viejas) v.Estado = "Removida";

            // Crear nueva membresía
            var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            _db.Invitaciones.Add(new Invitacion
            {
                Email            = user.Email!,
                RolWorkspace     = user.Rol.ToString(),
                Token            = Guid.NewGuid().ToString("N"),
                EmpresaId        = req.EmpresaId.Value,
                InvitadoPorId    = adminId,
                UsuarioCreadorId = user.Id,
                AceptadoPorId    = user.Id,
                FechaAceptacion  = DateTime.UtcNow,
                FechaCreacion    = DateTime.UtcNow,
                FechaExpiracion  = DateTime.UtcNow.AddYears(10),
                Estado           = "Aceptada",
                Tipo             = "Directo",
            });
            await _db.SaveChangesAsync();
        }
        else
        {
            await _db.SaveChangesAsync();
        }

        return Ok(new { user.Id, user.Nombre, user.Email, user.Telefono, Rol = user.Rol.ToString(), user.Activo });
    }

    // ── PROYECTOS ─────────────────────────────────────────────────────────────
    [HttpGet("proyectos")]
    public async Task<IActionResult> GetProyectos(
        [FromQuery] string? estado,
        [FromQuery] string? buscar,
        [FromQuery] int     page  = 1,
        [FromQuery] int     limit = 50)
    {
        var query = _db.Proyectos.Include(p => p.Cliente).AsQueryable();

        if (!string.IsNullOrWhiteSpace(estado) && Enum.TryParse<EstadoProyecto>(estado, true, out var estadoEnum))
            query = query.Where(p => p.Estado == estadoEnum);

        if (!string.IsNullOrWhiteSpace(buscar))
            query = query.Where(p =>
                (p.Titulo != null && p.Titulo.Contains(buscar)) ||
                (p.Canton != null && p.Canton.Contains(buscar)));

        var total = await query.CountAsync();
        var data  = await query
            .OrderByDescending(p => p.FechaPublicacion)
            .Skip((page - 1) * limit).Take(limit)
            .Select(p => new {
                p.Id, p.Titulo,
                Estado        = p.Estado.ToString(),
                TipoProyecto  = p.TipoProyecto.ToString(),
                p.Canton, p.Provincia,
                p.PresupuestoMax,
                p.FechaPublicacion, p.FechaInicio, p.FechaFin,
                Cliente = p.Cliente == null ? null : new { p.Cliente.Id, p.Cliente.Nombre, p.Cliente.Email },
            })
            .ToListAsync();

        return Ok(new { total, page, limit, data });
    }

    [HttpPut("proyectos/{id}/estado")]
    public async Task<IActionResult> CambiarEstadoProyecto(int id, [FromBody] CambiarEstadoProyectoRequest req)
    {
        var proyecto = await _db.Proyectos.FindAsync(id);
        if (proyecto is null) return NotFound();

        var estadoAnterior = proyecto.Estado.ToString();
        proyecto.Estado = req.Estado;
        await _db.SaveChangesAsync();

        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        await _auditoria.RegistrarAsync(adminId, "Admin",
            "CambiarEstadoProyecto", "Proyectos", id.ToString(),
            $"Estado: {estadoAnterior} → {req.Estado}. Motivo: {req.Motivo}");

        return Ok(new { id, Estado = req.Estado.ToString() });
    }

    // ── GESTIÓN DE EMPRESAS (admin crea/administra constructoras) ─────────────
    [HttpGet("empresas")]
    public async Task<IActionResult> GetEmpresas([FromQuery] string? buscar)
    {
        var query = _db.PerfilesConstructor.Include(p => p.Usuario).AsQueryable();

        if (!string.IsNullOrWhiteSpace(buscar))
            query = query.Where(p =>
                p.NombreEmpresa.Contains(buscar) ||
                (p.CedulaJuridica != null && p.CedulaJuridica.Contains(buscar)));

        var empresas = await query
            .OrderBy(p => p.NombreEmpresa)
            .Select(p => new {
                p.Id, p.NombreEmpresa, p.CedulaJuridica, p.Verificado,
                p.Bio, p.Especialidades,
                Dueno = new { p.Usuario.Id, p.Usuario.Nombre, p.Usuario.Email, p.Usuario.Activo },
            })
            .ToListAsync();

        // Agregar conteo de miembros
        var empresaIds = empresas.Select(e => e.Id).ToList();
        var miembrosCounts = await _db.Invitaciones
            .Where(i => empresaIds.Contains(i.EmpresaId) &&
                (i.Estado == "Aceptada" || (i.Tipo == "Directo" && i.Estado == "Pendiente")))
            .GroupBy(i => i.EmpresaId)
            .Select(g => new { EmpresaId = g.Key, Count = g.Count() })
            .ToListAsync();

        var data = empresas.Select(e => new {
            e.Id, e.NombreEmpresa, e.CedulaJuridica, e.Verificado, e.Bio, e.Especialidades,
            e.Dueno,
            CantidadMiembros = miembrosCounts.FirstOrDefault(m => m.EmpresaId == e.Id)?.Count ?? 0,
        });

        return Ok(data);
    }

    [HttpGet("empresas/{id}/miembros")]
    public async Task<IActionResult> GetEmpresaMiembros(int id)
    {
        var empresa = await _db.PerfilesConstructor.Include(p => p.Usuario).FirstOrDefaultAsync(p => p.Id == id);
        if (empresa is null) return NotFound();

        var miembros = await _db.Invitaciones
            .Where(i => i.EmpresaId == id &&
                (i.Estado == "Aceptada" || (i.Tipo == "Directo" && i.Estado == "Pendiente")))
            .Include(i => i.AceptadoPor)
            .Include(i => i.UsuarioCreador)
            .OrderBy(i => i.FechaCreacion)
            .ToListAsync();

        var data = miembros.Select(i => {
            var u = i.AceptadoPor ?? i.UsuarioCreador;
            return new {
                InvitacionId = i.Id,
                UsuarioId    = u?.Id,
                Nombre       = u?.Nombre ?? i.Email,
                Email        = u?.Email ?? i.Email,
                Telefono     = u?.Telefono,
                Rol          = i.RolWorkspace,
                RolPlataforma = u?.Rol.ToString(),
                Activo       = u?.Activo ?? false,
                Estado       = i.Estado,
                FechaUnion   = i.FechaAceptacion ?? i.FechaCreacion,
            };
        });

        return Ok(new {
            Empresa = new { empresa.Id, empresa.NombreEmpresa, empresa.CedulaJuridica, empresa.Verificado,
                Dueno = new { empresa.Usuario.Id, empresa.Usuario.Nombre, empresa.Usuario.Email } },
            Miembros = data,
        });
    }

    [HttpPost("empresas")]
    public async Task<IActionResult> CrearEmpresa([FromBody] CrearEmpresaRequest req)
    {
        var dueno = await _userManager.FindByIdAsync(req.UsuarioDuenoId.ToString());
        if (dueno is null) return BadRequest(new { message = "Usuario dueño no encontrado." });

        var yaExiste = await _db.PerfilesConstructor.AnyAsync(p => p.UsuarioId == req.UsuarioDuenoId);
        if (yaExiste) return Conflict(new { message = "Este usuario ya es dueño de otra empresa." });

        // Asegurar que el usuario tenga rol Constructor
        dueno.Rol = Rol.Constructor;
        await _userManager.UpdateAsync(dueno);

        var empresa = new PerfilConstructor
        {
            UsuarioId      = req.UsuarioDuenoId,
            NombreEmpresa  = req.NombreEmpresa.Trim(),
            CedulaJuridica = req.CedulaJuridica?.Trim(),
            Bio            = req.Descripcion?.Trim(),
        };
        _db.PerfilesConstructor.Add(empresa);
        await _db.SaveChangesAsync();

        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        await _auditoria.RegistrarAsync(adminId, "Admin", "CrearEmpresa", "Empresas",
            empresa.Id.ToString(), $"Empresa: {empresa.NombreEmpresa}, Dueño: {dueno.Email}");

        return Ok(new { empresa.Id, empresa.NombreEmpresa, empresa.CedulaJuridica, empresa.Verificado });
    }

    [HttpPost("empresas/{id}/miembros")]
    public async Task<IActionResult> AgregarMiembroEmpresa(int id, [FromBody] AgregarMiembroAdminRequest req)
    {
        var empresa = await _db.PerfilesConstructor.FindAsync(id);
        if (empresa is null) return NotFound();

        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);

        // Si es usuario existente
        if (req.UsuarioId.HasValue)
        {
            var user = await _userManager.FindByIdAsync(req.UsuarioId.Value.ToString());
            if (user is null) return NotFound(new { message = "Usuario no encontrado." });

            var yaEsMiembro = await _db.Invitaciones.AnyAsync(i =>
                i.EmpresaId == id &&
                (i.AceptadoPorId == req.UsuarioId.Value || i.UsuarioCreadorId == req.UsuarioId.Value) &&
                i.Estado == "Aceptada");
            if (yaEsMiembro)
                return Conflict(new { message = "El usuario ya es miembro de esta empresa." });

            _db.Invitaciones.Add(new Invitacion
            {
                Email            = user.Email!,
                RolWorkspace     = req.RolWorkspace,
                Token            = Guid.NewGuid().ToString("N"),
                EmpresaId        = id,
                InvitadoPorId    = adminId,
                UsuarioCreadorId = user.Id,
                AceptadoPorId    = user.Id,
                FechaAceptacion  = DateTime.UtcNow,
                FechaCreacion    = DateTime.UtcNow,
                FechaExpiracion  = DateTime.UtcNow.AddYears(10),
                Estado           = "Aceptada",
                Tipo             = "Directo",
            });
            await _db.SaveChangesAsync();
            return Ok(new { message = $"{user.Nombre} agregado a {empresa.NombreEmpresa}." });
        }

        // Si es usuario nuevo
        if (string.IsNullOrWhiteSpace(req.Email))
            return BadRequest(new { message = "Se requiere email para crear un nuevo usuario." });

        if (await _userManager.FindByEmailAsync(req.Email) is not null)
            return Conflict(new { message = "El email ya está registrado." });

        if (!Enum.TryParse<Rol>(req.RolWorkspace, true, out var rolPlataforma))
            rolPlataforma = Rol.Supervisor;

        var tempPass = Guid.NewGuid().ToString("N")[..8] + "Aa1!";
        var nuevo = new Usuario
        {
            UserName = req.Email, Email = req.Email,
            Nombre   = req.Nombre!.Trim(), Telefono = req.Telefono?.Trim(),
            Rol = rolPlataforma, Activo = true, EmailConfirmed = true, CreatedAt = DateTime.UtcNow,
        };
        var cr = await _userManager.CreateAsync(nuevo, tempPass);
        if (!cr.Succeeded) return BadRequest(cr.Errors);

        var inv = new Invitacion
        {
            Email            = req.Email,
            RolWorkspace     = req.RolWorkspace,
            Token            = Guid.NewGuid().ToString("N"),
            EmpresaId        = id,
            InvitadoPorId    = adminId,
            UsuarioCreadorId = nuevo.Id,
            AceptadoPorId    = nuevo.Id,
            FechaAceptacion  = DateTime.UtcNow,
            FechaCreacion    = DateTime.UtcNow,
            FechaExpiracion  = DateTime.UtcNow.AddYears(10),
            Estado           = "Aceptada",
            Tipo             = "Directo",
        };
        _db.Invitaciones.Add(inv);
        await _db.SaveChangesAsync();

        var baseUrl = _config["AppBaseUrl"] ?? "https://construapp.runasp.net";
        await _email.EnviarAsync(new Core.Interfaces.EmailMessage(
            Para:     req.Email,
            Asunto:   $"Fuiste agregado al equipo de {empresa.NombreEmpresa} en ConstruApp",
            HtmlBody: EmailTemplates.UsuarioCreado(nuevo.Nombre, req.Email, tempPass, $"{baseUrl}/login"),
            Evento:   "usuario_creado",
            UsuarioId: nuevo.Id
        ));

        return Ok(new { nuevo.Id, nuevo.Nombre, nuevo.Email, RolWorkspace = req.RolWorkspace });
    }

    [HttpDelete("empresas/{id}/miembros/{userId}")]
    public async Task<IActionResult> QuitarMiembroEmpresa(int id, int userId)
    {
        var empresa = await _db.PerfilesConstructor.FindAsync(id);
        if (empresa is null) return NotFound();

        // Verificar que no es el dueño
        if (empresa.UsuarioId == userId)
            return BadRequest(new { message = "No se puede quitar al dueño de la empresa." });

        var invitaciones = await _db.Invitaciones
            .Where(i => i.EmpresaId == id &&
                (i.AceptadoPorId == userId || i.UsuarioCreadorId == userId) &&
                (i.Estado == "Aceptada" || (i.Tipo == "Directo" && i.Estado == "Pendiente")))
            .ToListAsync();

        foreach (var inv in invitaciones) inv.Estado = "Removida";
        await _db.SaveChangesAsync();

        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        await _auditoria.RegistrarAsync(adminId, "Admin", "QuitarMiembro", "Empresas",
            id.ToString(), $"Usuario {userId} removido de {empresa.NombreEmpresa}");

        return Ok(new { message = "Miembro removido." });
    }

    // ── EMPRESAS CONSTRUCTORAS (verificación) ─────────────────────────────────
    [HttpGet("empresas/constructores")]
    public async Task<IActionResult> GetConstructores([FromQuery] bool? verificado)
    {
        var query = _db.PerfilesConstructor.Include(p => p.Usuario).AsQueryable();
        if (verificado.HasValue)
            query = query.Where(p => p.Verificado == verificado.Value);

        var data = await query
            .OrderBy(p => p.Verificado).ThenBy(p => p.NombreEmpresa)
            .Select(p => new {
                p.Id, p.NombreEmpresa, p.Verificado,
                p.CalificacionPromedio, p.TotalProyectos,
                p.AniosExperiencia, p.Especialidades,
                p.CedulaJuridica, p.SitioWeb,
                Usuario = p.Usuario == null ? null : new { p.Usuario.Id, p.Usuario.Nombre, p.Usuario.Email, p.Usuario.Activo },
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpPut("empresas/constructores/{id}/verificar")]
    public async Task<IActionResult> VerificarConstructor(int id)
    {
        var p = await _db.PerfilesConstructor.FindAsync(id);
        if (p is null) return NotFound();
        p.Verificado = !p.Verificado;
        await _db.SaveChangesAsync();

        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        await _auditoria.RegistrarAsync(adminId, "Admin",
            p.Verificado ? "VerificarConstructor" : "RevocarVerificacionConstructor",
            "Empresas", id.ToString(), p.NombreEmpresa);

        return Ok(new { p.Id, p.Verificado });
    }

    [HttpPut("empresas/constructores/{id}/suspender")]
    public async Task<IActionResult> SuspenderConstructor(int id, [FromBody] BloquearRequest? req = null)
    {
        var perfil = await _db.PerfilesConstructor.Include(p => p.Usuario).FirstOrDefaultAsync(p => p.Id == id);
        if (perfil is null) return NotFound();
        if (perfil.Usuario is not null)
        {
            perfil.Usuario.Activo = false;
            await _userManager.UpdateAsync(perfil.Usuario);
        }
        perfil.Verificado = false;
        await _db.SaveChangesAsync();

        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        await _auditoria.RegistrarAsync(adminId, "Admin",
            "SuspenderConstructor", "Empresas", id.ToString(),
            $"Empresa: {perfil.NombreEmpresa}. Motivo: {req?.Motivo ?? "Sin motivo"}");

        return Ok(new { message = $"Constructor {perfil.NombreEmpresa} suspendido." });
    }

    // ── PROVEEDORES ───────────────────────────────────────────────────────────
    [HttpGet("empresas/proveedores")]
    public async Task<IActionResult> GetProveedores([FromQuery] bool? verificado)
    {
        var query = _db.PerfilesProveedor.Include(p => p.Usuario).AsQueryable();
        if (verificado.HasValue)
            query = query.Where(p => p.Verificado == verificado.Value);

        var data = await query
            .OrderBy(p => p.Verificado).ThenBy(p => p.NombreComercial)
            .Select(p => new {
                p.Id, p.NombreComercial, p.Verificado,
                p.Canton, p.Provincia, p.TelefonoNegocio, p.SitioWeb,
                Usuario = p.Usuario == null ? null : new { p.Usuario.Id, p.Usuario.Nombre, p.Usuario.Email, p.Usuario.Activo },
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpPut("empresas/proveedores/{id}/verificar")]
    public async Task<IActionResult> VerificarProveedor(int id)
    {
        var p = await _db.PerfilesProveedor.FindAsync(id);
        if (p is null) return NotFound();
        p.Verificado = !p.Verificado;
        await _db.SaveChangesAsync();

        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        await _auditoria.RegistrarAsync(adminId, "Admin",
            p.Verificado ? "VerificarProveedor" : "RevocarVerificacionProveedor",
            "Empresas", id.ToString(), p.NombreComercial);

        return Ok(new { p.Id, p.Verificado });
    }

    [HttpPut("empresas/proveedores/{id}/suspender")]
    public async Task<IActionResult> SuspenderProveedor(int id, [FromBody] BloquearRequest? req = null)
    {
        var perfil = await _db.PerfilesProveedor.Include(p => p.Usuario).FirstOrDefaultAsync(p => p.Id == id);
        if (perfil is null) return NotFound();
        if (perfil.Usuario is not null)
        {
            perfil.Usuario.Activo = false;
            await _userManager.UpdateAsync(perfil.Usuario);
        }
        perfil.Verificado = false;
        await _db.SaveChangesAsync();

        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        await _auditoria.RegistrarAsync(adminId, "Admin",
            "SuspenderProveedor", "Empresas", id.ToString(),
            $"Empresa: {perfil.NombreComercial}. Motivo: {req?.Motivo ?? "Sin motivo"}");

        return Ok(new { message = $"Proveedor {perfil.NombreComercial} suspendido." });
    }

    // ── SOLICITUDES DE ACCESO ─────────────────────────────────────────────────
    [HttpGet("solicitudes")]
    public async Task<IActionResult> GetSolicitudes()
    {
        var solicitudes = await _userManager.Users
            .Where(u => u.EstadoCuenta == "Pendiente")
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new {
                u.Id, u.Nombre, u.Email, u.Telefono,
                u.MotivoRegistro, u.CreatedAt,
            })
            .ToListAsync();

        return Ok(solicitudes);
    }

    [HttpPost("solicitudes/{id}/aprobar")]
    public async Task<IActionResult> AprobarSolicitud(int id, [FromBody] AprobarSolicitudRequest req)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();
        if (user.EstadoCuenta != "Pendiente")
            return BadRequest(new { message = "La solicitud ya fue procesada." });

        if (!Enum.TryParse<Rol>(req.Rol, true, out var rol))
            return BadRequest(new { message = "Rol inválido." });

        user.Rol          = rol;
        user.EstadoCuenta = null; // null = Activo normal
        user.Activo       = true;
        user.EmailConfirmed = true;
        await _userManager.UpdateAsync(user);

        if (rol == Rol.Constructor)
        {
            var existe = await _db.PerfilesConstructor.AnyAsync(p => p.UsuarioId == user.Id);
            if (!existe)
            {
                _db.PerfilesConstructor.Add(new PerfilConstructor { UsuarioId = user.Id, NombreEmpresa = user.Nombre });
                await _db.SaveChangesAsync();
            }
        }
        else if (rol == Rol.Proveedor)
        {
            var existe = await _db.PerfilesProveedor.AnyAsync(p => p.UsuarioId == user.Id);
            if (!existe)
            {
                _db.PerfilesProveedor.Add(new PerfilProveedor { UsuarioId = user.Id, NombreComercial = user.Nombre });
                await _db.SaveChangesAsync();
            }
        }

        var baseUrl = _config["AppSettings:BaseUrl"] ?? "https://construapp.siteasp.net";
        await _email.EnviarAsync(new Core.Interfaces.EmailMessage(
            Para:     user.Email!,
            Asunto:   "Tu cuenta en ConstruApp fue aprobada",
            HtmlBody: EmailTemplates.CuentaAprobada(user.Nombre, rol.ToString(), $"{baseUrl}/login"),
            Evento:   "cuenta_aprobada",
            UsuarioId: user.Id
        ));

        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        await _auditoria.RegistrarAsync(adminId, "Admin", "AprobarSolicitud", "Usuarios",
            id.ToString(), $"Rol asignado: {rol}");

        return Ok(new { message = $"Cuenta de {user.Nombre} aprobada como {rol}." });
    }

    [HttpPost("solicitudes/{id}/rechazar")]
    public async Task<IActionResult> RechazarSolicitud(int id, [FromBody] RechazarSolicitudRequest req)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null) return NotFound();
        if (user.EstadoCuenta != "Pendiente")
            return BadRequest(new { message = "La solicitud ya fue procesada." });

        user.EstadoCuenta = "Rechazado";
        await _userManager.UpdateAsync(user);

        await _email.EnviarAsync(new Core.Interfaces.EmailMessage(
            Para:     user.Email!,
            Asunto:   "Actualización sobre tu solicitud en ConstruApp",
            HtmlBody: EmailTemplates.CuentaRechazada(user.Nombre, req.Motivo),
            Evento:   "cuenta_rechazada",
            UsuarioId: user.Id
        ));

        var adminId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        await _auditoria.RegistrarAsync(adminId, "Admin", "RechazarSolicitud", "Usuarios",
            id.ToString(), $"Motivo: {req.Motivo ?? "Sin motivo"}");

        return Ok(new { message = $"Solicitud de {user.Nombre} rechazada." });
    }
}

// ── DTOs ────────────────────────────────────────────────────────────────────
public class CambiarRolRequest                   { public Rol Rol { get; set; } }
public record BloquearRequest(string? Motivo);
public record ResetPasswordRequest(string NuevaContrasena);
public record EditarUsuarioRequest(string? Nombre, string? Telefono, string? Rol, bool? Activo, int? EmpresaId);
public record CambiarEstadoProyectoRequest(EstadoProyecto Estado, string? Motivo);
public record AprobarSolicitudRequest(string Rol);
public record RechazarSolicitudRequest(string? Motivo);
public record CrearUsuarioRequest(
    string Nombre, string Email, string? Telefono, string Rol,
    int? EmpresaId,
    string? NombreEmpresa, string? CedulaJuridica, string? Descripcion);
public record CrearEmpresaRequest(
    string NombreEmpresa, string? CedulaJuridica, string? Descripcion, int UsuarioDuenoId);
public record AgregarMiembroAdminRequest(
    int? UsuarioId, string? Nombre, string? Email, string? Telefono, string RolWorkspace);

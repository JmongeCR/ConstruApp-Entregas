using ConstruApp.Core.Constants;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ConstruApp.Infrastructure.Data;

public static class DatabaseSeeder
{
    // ── helpers ───────────────────────────────────────────────────────────────
    private static string Lineas(params (string desc, int cant, decimal pu)[] items)
    {
        var rows = items.Select(i => $"{{\"descripcion\":\"{i.desc}\",\"cantidad\":{i.cant},\"precioUnit\":{i.pu:F2},\"subtotal\":{i.cant * i.pu:F2}}}");
        return "[" + string.Join(",", rows) + "]";
    }

    public static async Task SeedAsync(IServiceProvider services)
    {
        var userManager = services.GetRequiredService<UserManager<Usuario>>();
        var db          = services.GetRequiredService<AppDbContext>();
        var logger      = services.GetRequiredService<ILogger<AppDbContext>>();
        var now         = DateTime.UtcNow;

        // ── 1. Usuarios ──────────────────────────────────────────────────────
        var seedUsuarios = new[]
        {
            // Usuarios de demo originales
            new { Nombre = "Administrador Sistema",    Email = "admin@construapp.com",       Password = "Admin123!",       Rol = Rol.Admin,       Tel = (string?)null },
            new { Nombre = "María González Porras",    Email = "cliente@construapp.com",     Password = "Cliente123!",     Rol = Rol.Cliente,     Tel = "8845-2211" },
            new { Nombre = "Carlos Mora Elizondo",     Email = "carlos@construapp.com",      Password = "Cliente123!",     Rol = Rol.Cliente,     Tel = "7034-8822" },
            new { Nombre = "Ana Rodríguez Jiménez",    Email = "ana@construapp.com",         Password = "Cliente123!",     Rol = Rol.Cliente,     Tel = "8923-0044" },
            new { Nombre = "Constructora Vargas S.A.", Email = "constructor@construapp.com", Password = "Constructor123!", Rol = Rol.Constructor, Tel = "2234-1100" },
            new { Nombre = "TechBuild CR",             Email = "techbuild@construapp.com",   Password = "Constructor123!", Rol = Rol.Constructor, Tel = "2278-4455" },
            new { Nombre = "Maestro Obras CR",         Email = "maestro@construapp.com",     Password = "Constructor123!", Rol = Rol.Constructor, Tel = "8867-3300" },
            new { Nombre = "Distribuidora El Clavo",   Email = "proveedor@construapp.com",   Password = "Proveedor123!",   Rol = Rol.Proveedor,   Tel = "2234-5678" },
            new { Nombre = "EPA Materiales San José",  Email = "epa@construapp.com",         Password = "Proveedor123!",   Rol = Rol.Proveedor,   Tel = "2800-3724" },
            new { Nombre = "Laura Solano Brenes",      Email = "laura@construapp.com",       Password = "Cliente123!",     Rol = Rol.Cliente,     Tel = "8812-4411" },
            new { Nombre = "David Jiménez Quirós",     Email = "david@construapp.com",       Password = "Cliente123!",     Rol = Rol.Cliente,     Tel = "7023-9902" },
            // Usuarios de prueba con contraseña unificada Test1234!
            new { Nombre = "Admin Test",               Email = "admin@test.com",             Password = "Test1234!",       Rol = Rol.Admin,       Tel = (string?)null },
            new { Nombre = "Diego Vargas Solano",      Email = "cliente@test.com",           Password = "Test1234!",       Rol = Rol.Cliente,     Tel = "8001-2345" },
            new { Nombre = "Obras Centroamérica S.A.", Email = "constructor@test.com",       Password = "Test1234!",       Rol = Rol.Constructor, Tel = "2290-1100" },
            new { Nombre = "María Fernández Mora",     Email = "maria@test.com",             Password = "Test1234!",       Rol = Rol.Cliente,     Tel = "8712-3456" },
            new { Nombre = "Carlos Jiménez Rojas",     Email = "carlos@test.com",            Password = "Test1234!",       Rol = Rol.Constructor, Tel = "8834-5678" },
        };

        foreach (var u in seedUsuarios)
        {
            if (await userManager.FindByEmailAsync(u.Email) is not null) continue;
            var usuario = new Usuario
            {
                UserName = u.Email, Email = u.Email, Nombre = u.Nombre,
                Rol = u.Rol, Telefono = u.Tel, EmailConfirmed = true, Activo = true,
                CreatedAt = now.AddDays(-120),
            };
            var result = await userManager.CreateAsync(usuario, u.Password);
            if (result.Succeeded) logger.LogInformation("✅ Usuario: {Email} [{Rol}]", u.Email, u.Rol);
            else logger.LogWarning("⚠️ {Email}: {E}", u.Email, string.Join(", ", result.Errors.Select(e => e.Description)));
        }

        // Cargar usuarios
        var uMaria    = await userManager.FindByEmailAsync("cliente@construapp.com");
        var uCarlos   = await userManager.FindByEmailAsync("carlos@construapp.com");
        var uAna      = await userManager.FindByEmailAsync("ana@construapp.com");
        var uVargas   = await userManager.FindByEmailAsync("constructor@construapp.com");
        var uTech     = await userManager.FindByEmailAsync("techbuild@construapp.com");
        var uMaestro  = await userManager.FindByEmailAsync("maestro@construapp.com");
        var uClavo    = await userManager.FindByEmailAsync("proveedor@construapp.com");
        var uEpa      = await userManager.FindByEmailAsync("epa@construapp.com");
        var uLaura    = await userManager.FindByEmailAsync("laura@construapp.com");
        var uDavid    = await userManager.FindByEmailAsync("david@construapp.com");
        // Usuarios de prueba
        var uTestClient = await userManager.FindByEmailAsync("cliente@test.com");
        var uTestCons   = await userManager.FindByEmailAsync("constructor@test.com");
        var uTestMaria  = await userManager.FindByEmailAsync("maria@test.com");
        var uTestCarlos = await userManager.FindByEmailAsync("carlos@test.com");

        if (uMaria is null || uCarlos is null || uAna is null || uVargas is null ||
            uTech is null || uMaestro is null || uClavo is null || uEpa is null ||
            uLaura is null || uDavid is null) return;

        // ── 2. Perfiles Constructor ──────────────────────────────────────────
        if (!await db.PerfilesConstructor.AnyAsync())
        {
            db.PerfilesConstructor.AddRange(
                new PerfilConstructor
                {
                    UsuarioId           = uVargas.Id,
                    NombreEmpresa       = "Constructora Vargas S.A.",
                    Bio                 = "Empresa con más de 12 años de experiencia en remodelaciones residenciales y obra gris en el Gran Área Metropolitana. Contamos con equipo propio de maestros de obras, ingenieros y arquitectos. Más de 26 proyectos completados con satisfacción total del cliente.",
                    Especialidades      = "Remodelación,Obra gris,Pisos,Pintura,Impermeabilización",
                    ZonasCobertura      = "San José,Alajuela,Cartago,Heredia",
                    AniosExperiencia    = 12,
                    CedulaJuridica      = "3-101-456789",
                    SitioWeb            = "https://vargas-construye.cr",
                    Instagram           = "@constructoravargas",
                    Verificado          = true,
                    CalificacionPromedio= 4.8m,
                    TotalProyectos      = 26,
                    // ── Configuración financiera ──────────────────────────────
                    EmailFacturacion    = "facturacion@vargas-construye.cr",
                    DireccionFiscal     = "Curridabat, San José. 100m Sur del CEFA, Edificio Jade, Local 3",
                    TelefonoFiscal      = "2234-1100",
                    PrefijoFactura      = "FAC",
                    DiasVencimiento     = 15,
                    TasaIVA             = 13,
                    AplicaIVADefault    = false,
                    TerminosCondiciones = "Pago mediante SINPE Móvil o transferencia bancaria. Los pagos deben realizarse dentro del plazo indicado en la factura. Cualquier atraso genera intereses del 1.5% mensual sobre el saldo pendiente. Garantía de mano de obra: 12 meses para acabados, 24 meses para estructura y obra gris.",
                    FormasPago          = "[\"Transferencia\",\"SINPE\",\"Efectivo\"]",
                    CuentasBancarias    = "[{\"banco\":\"Banco Nacional de Costa Rica\",\"cuenta\":\"001-0123456-7\",\"iban\":\"CR12015100010123456789\",\"tipo\":\"Corriente\",\"titular\":\"Constructora Vargas S.A.\"}]",
                },
                new PerfilConstructor
                {
                    UsuarioId           = uTech!.Id,
                    NombreEmpresa       = "TechBuild CR",
                    Bio                 = "Especialistas en instalaciones eléctricas y plomería certificadas para residencias y locales comerciales. Materiales Condumex y Square D con garantía de 2 años. Certificación CFIA incluida en todos nuestros proyectos eléctricos.",
                    Especialidades      = "Eléctrico,Plomería,Paneles solares,Automatización residencial",
                    ZonasCobertura      = "San José,Heredia,Alajuela",
                    AniosExperiencia    = 8,
                    CedulaJuridica      = "3-101-778899",
                    SitioWeb            = "https://techbuildcr.com",
                    Instagram           = "@techbuildcr",
                    Verificado          = true,
                    CalificacionPromedio= 4.6m,
                    TotalProyectos      = 15,
                    EmailFacturacion    = "admin@techbuildcr.com",
                    PrefijoFactura      = "TBC",
                    DiasVencimiento     = 30,
                    TasaIVA             = 13,
                    AplicaIVADefault    = true,
                    FormasPago          = "[\"Transferencia\",\"SINPE\"]",
                    CuentasBancarias    = "[{\"banco\":\"BAC Credomatic\",\"cuenta\":\"10200009012345\",\"iban\":\"CR98015201020000901234\",\"tipo\":\"Ahorro\",\"titular\":\"TechBuild CR S.R.L.\"}]",
                },
                new PerfilConstructor
                {
                    UsuarioId           = uMaestro!.Id,
                    NombreEmpresa       = "Maestro Obras CR",
                    Bio                 = "15 años construyendo y reparando techos e instalando pisos en Costa Rica. Especialistas en estructura metálica, teja española, lámina galvanizada y porcelanato. Atendemos emergencias en 24 horas. Presupuesto sin compromiso.",
                    Especialidades      = "Techos,Pisos,Obra gris,Ampliaciones,Impermeabilización",
                    ZonasCobertura      = "Cartago,San José,Heredia",
                    AniosExperiencia    = 15,
                    CedulaJuridica      = "3-101-334455",
                    Instagram           = "@maestroobrascr",
                    Verificado          = true,
                    CalificacionPromedio= 4.9m,
                    TotalProyectos      = 32,
                    PrefijoFactura      = "MOC",
                    DiasVencimiento     = 20,
                    TasaIVA             = 13,
                    FormasPago          = "[\"SINPE\",\"Efectivo\",\"Transferencia\"]",
                    CuentasBancarias    = "[{\"banco\":\"Banco de Costa Rica\",\"cuenta\":\"15202-7\",\"iban\":\"CR0401520200015202700\",\"tipo\":\"Corriente\",\"titular\":\"Maestro Obras CR\"}]",
                }
            );
            await db.SaveChangesAsync();
            logger.LogInformation("✅ Perfiles constructor creados.");
        }

        // ── Perfil constructor para usuario de prueba ────────────────────────
        if (uTestCons is not null && !await db.PerfilesConstructor.AnyAsync(p => p.UsuarioId == uTestCons.Id))
        {
            db.PerfilesConstructor.Add(new PerfilConstructor
            {
                UsuarioId        = uTestCons.Id,
                NombreEmpresa    = "Obras Centroamérica S.A.",
                Bio              = "Empresa constructora con 8 años de experiencia en proyectos residenciales y comerciales en Costa Rica. Especialistas en obra gris, remodelaciones y acabados de alta calidad.",
                Especialidades   = "Obra gris,Remodelación,Techos,Impermeabilización",
                ZonasCobertura   = "San José,Heredia,Alajuela",
                AniosExperiencia = 8,
                Verificado       = false,
                TasaIVA          = 13,
                DiasVencimiento  = 30,
                FormasPago       = "[\"SINPE\",\"Transferencia\"]",
            });
            await db.SaveChangesAsync();
            logger.LogInformation("✅ Perfil constructor de prueba creado.");
        }

        // ── Perfil constructor para carlos@test.com (TechBuild CR demo) ─────
        if (uTestCarlos is not null && !await db.PerfilesConstructor.AnyAsync(p => p.UsuarioId == uTestCarlos.Id))
        {
            db.PerfilesConstructor.Add(new PerfilConstructor
            {
                UsuarioId        = uTestCarlos.Id,
                NombreEmpresa    = "TechBuild CR",
                Bio              = "Empresa especializada en instalaciones eléctricas y plomería residencial. Materiales de primera calidad y garantía de 2 años.",
                Especialidades   = "Eléctrico,Plomería,Automatización",
                ZonasCobertura   = "San José,Heredia,Alajuela",
                AniosExperiencia = 6,
                Verificado       = false,
                TasaIVA          = 13,
                DiasVencimiento  = 30,
                PrefijoFactura   = "TBC",
                FormasPago       = "[\"SINPE\",\"Transferencia\"]",
            });
            await db.SaveChangesAsync();
            logger.LogInformation("✅ Perfil constructor carlos@test.com creado.");
        }

        // ── 3. Perfiles Proveedor ────────────────────────────────────────────
        if (!await db.PerfilesProveedor.AnyAsync())
        {
            db.PerfilesProveedor.AddRange(
                new PerfilProveedor
                {
                    UsuarioId       = uClavo.Id,
                    NombreComercial = "Distribuidora El Clavo",
                    Descripcion     = "Ferretería especializada en materiales de construcción: cemento, bloques, varilla, madera y herramientas eléctricas. Entrega a domicilio en el GAM. Crédito disponible para constructores registrados.",
                    Direccion       = "200m Norte del Banco Nacional, Barrio La California",
                    Canton          = "San José", Provincia = "San José",
                    TelefonoNegocio = "2234-5678",
                    HorarioAtencion = "Lun-Vie 7am-6pm, Sáb 7am-4pm",
                    Verificado      = true,
                },
                new PerfilProveedor
                {
                    UsuarioId       = uEpa!.Id,
                    NombreComercial = "EPA Materiales San José",
                    Descripcion     = "Cadena líder en materiales de construcción, pintura, herramientas eléctricas y plomería. Precios de mayoreo para constructores registrados.",
                    Direccion       = "Autopista General Cañas, Complejo Forum 1",
                    Canton          = "Santa Ana", Provincia = "San José",
                    TelefonoNegocio = "2800-3724", SitioWeb = "https://www.epa.cr",
                    HorarioAtencion = "Lun-Sáb 7am-8pm, Dom 8am-6pm",
                    Verificado      = true,
                }
            );
            await db.SaveChangesAsync();
            logger.LogInformation("✅ Perfiles proveedor creados.");
        }

        // ── 4. Proyectos ─────────────────────────────────────────────────────
        if (!await db.Proyectos.AnyAsync())
        {
            db.Proyectos.AddRange(
                // 1 — EnPropuestas (María) — cocina (tiene propuestas enviadas de Vargas y Maestro)
                new Proyecto
                {
                    ClienteId = uMaria.Id, Titulo = "Remodelación de cocina en Desamparados",
                    Descripcion = "Necesito remodelar completamente la cocina de mi casa: cambio de pisos cerámicos 60x60, instalación de muebles modulares nuevos, backsplash en azulejo, recableado de tomas y cambio de iluminación LED. La cocina mide aprox. 18m².",
                    TipoProyecto = TipoProyecto.Remodelacion, Estado = EstadoProyecto.EnPropuestas,
                    Canton = "Desamparados", Provincia = "San José",
                    PresupuestoMax = 3_500_000m, AreaM2 = 18m, FechaPublicacion = now.AddDays(-5),
                },
                // 2 — EnCurso (María) — eléctrico TechBuild
                new Proyecto
                {
                    ClienteId = uMaria.Id, Titulo = "Instalación eléctrica casa nueva en Santa Ana",
                    Descripcion = "Casa de dos plantas recién construida necesita instalación eléctrica completa: tablero principal 200A, 20 circuitos independientes, cableado AWG 12, tomas NEMA 5-20 y 5-15, iluminación interior y exterior. Requiere certificación del CFIA.",
                    TipoProyecto = TipoProyecto.ElectricoPlomeria, Estado = EstadoProyecto.EnCurso,
                    Canton = "Santa Ana", Provincia = "San José",
                    PresupuestoMax = 1_200_000m, FechaPublicacion = now.AddDays(-18),
                    FechaInicio = now.AddDays(-5),
                },
                // 3 — Publicado (Carlos) — piscina
                new Proyecto
                {
                    ClienteId = uCarlos!.Id, Titulo = "Construcción de piscina y área de jardín",
                    Descripcion = "Piscina rectangular 8x4m con cuarto de máquinas, deck en madera plástica alrededor, jardín con sistema de riego automatizado y iluminación LED sumergida y perimetral.",
                    TipoProyecto = TipoProyecto.PiscinaJardin, Estado = EstadoProyecto.Publicado,
                    Canton = "San Pablo", Provincia = "Heredia",
                    PresupuestoMax = 8_000_000m, AreaM2 = 40m, FechaPublicacion = now.AddDays(-3),
                },
                // 4 — EnCurso (Carlos) — pintura Vargas
                new Proyecto
                {
                    ClienteId = uCarlos.Id, Titulo = "Pintura exterior residencia completa",
                    Descripcion = "Casa de dos plantas, paredes exteriores ~220m². Preparación de superficie (raspado, masillado, sellado), pintura elastomérica Lanco en paredes y esmalte en marcos y rejas. Se requiere andamios.",
                    TipoProyecto = TipoProyecto.Pintura, Estado = EstadoProyecto.EnCurso,
                    Canton = "La Unión", Provincia = "Cartago",
                    PresupuestoMax = 850_000m, AreaM2 = 220m, FechaPublicacion = now.AddDays(-22),
                    FechaInicio = now.AddDays(-9),
                },
                // 5 — Completado (Ana) — pisos Maestro
                new Proyecto
                {
                    ClienteId = uAna!.Id, Titulo = "Piso porcelanato sala-comedor y pasillo en Escazú",
                    Descripcion = "Instalación de porcelanato 60x60cm importado en sala (30m²), comedor (20m²) y pasillo (15m²). Demolición piso existente (vinil), nivelación con autonivelante, zócalos a juego.",
                    TipoProyecto = TipoProyecto.Pisos, Estado = EstadoProyecto.Completado,
                    Canton = "Escazú", Provincia = "San José",
                    PresupuestoMax = 1_600_000m, AreaM2 = 65m, FechaPublicacion = now.AddDays(-40),
                    FechaInicio = now.AddDays(-32), FechaFin = now.AddDays(-16),
                },
                // 6 — Publicado (Ana) — techo
                new Proyecto
                {
                    ClienteId = uAna.Id, Titulo = "Reparación urgente de techo de lámina en Alajuela",
                    Descripcion = "Techo de 150m² con múltiples goteras activas. Necesito inspección, identificación de puntos de filtración, sustitución de láminas dañadas, revisión y reparación de canaletas. Situación urgente.",
                    TipoProyecto = TipoProyecto.Techos, Estado = EstadoProyecto.Publicado,
                    Canton = "San Ramón", Provincia = "Alajuela",
                    PresupuestoMax = 600_000m, AreaM2 = 150m, FechaPublicacion = now.AddDays(-1),
                },
                // 7 — Completado (Laura) — baño Vargas
                new Proyecto
                {
                    ClienteId = uLaura.Id, Titulo = "Remodelación completa de baño principal en Escazú",
                    Descripcion = "Demolición total y reconstrucción del baño principal 8m². Porcelanato 30x60 crema en piso y paredes, mueble vanitory con mesón cuarzo, ducha con vidrio templado, inodoro Kohler, espejo LED. Cambio completo de tuberías.",
                    TipoProyecto = TipoProyecto.Remodelacion, Estado = EstadoProyecto.Completado,
                    Canton = "Escazú", Provincia = "San José",
                    PresupuestoMax = 2_800_000m, AreaM2 = 8m, FechaPublicacion = now.AddDays(-80),
                    FechaInicio = now.AddDays(-65), FechaFin = now.AddDays(-40),
                },
                // 8 — EnPropuestas (David) — muro
                new Proyecto
                {
                    ClienteId = uDavid.Id, Titulo = "Muro perimetral y portón eléctrico en Alajuela",
                    Descripcion = "Construcción de muro perimetral en bloque vibrado repellado y pintado de 35 metros lineales x 1.80m alto, columnas 20x20cm cada 3m. Portón eléctrico corredera 4m con motor y control remoto. Malla Rachel negra 50cm en coronamiento.",
                    TipoProyecto = TipoProyecto.ObraGris, Estado = EstadoProyecto.EnPropuestas,
                    Canton = "San Carlos", Provincia = "Alajuela",
                    PresupuestoMax = 3_200_000m, AreaM2 = 63m, FechaPublicacion = now.AddDays(-10),
                }
            );
            await db.SaveChangesAsync();
            logger.LogInformation("✅ 8 proyectos creados.");
        }

        // ── 5. Propuestas ────────────────────────────────────────────────────
        if (!await db.Propuestas.AnyAsync())
        {
            var perfiles     = await db.PerfilesConstructor.ToListAsync();
            var perfilVargas = perfiles.First(p => p.UsuarioId == uVargas.Id);
            var perfilTech   = perfiles.First(p => p.UsuarioId == uTech.Id);
            var perfilMaestro= perfiles.First(p => p.UsuarioId == uMaestro.Id);

            var proyectos = await db.Proyectos.ToListAsync();
            var pElectrico = proyectos.First(p => p.TipoProyecto == TipoProyecto.ElectricoPlomeria);
            var pPintura   = proyectos.First(p => p.TipoProyecto == TipoProyecto.Pintura);
            var pPisos     = proyectos.First(p => p.TipoProyecto == TipoProyecto.Pisos);
            var pBanio     = proyectos.First(p => p.AreaM2 == 8m && p.TipoProyecto == TipoProyecto.Remodelacion);
            var pCocina    = proyectos.First(p => p.AreaM2 == 18m && p.TipoProyecto == TipoProyecto.Remodelacion);

            db.Propuestas.AddRange(
                // Eléctrico María → TechBuild (Aceptada)
                new Propuesta
                {
                    ProyectoId = pElectrico.Id, ConstructorId = perfilTech.Id,
                    MontoTotal = 1_080_000m,
                    Descripcion = "Sistema eléctrico completo con materiales Condumex certificados. Tablero Square D 200A con protecciones diferenciales, 20 circuitos independientes, cableado AWG 12 en toda la propiedad, tomas NEMA certificadas, iluminación LED interior y exterior. Certificación CFIA gestionada sin costo adicional.",
                    Incluye = "Materiales Condumex certificados, tablero Square D 200A, cableado AWG 12, tomas NEMA, iluminación LED, planos as-built, certificación CFIA, garantía 2 años",
                    PlazoEstimadoDias = 6, Estado = EstadoPropuesta.Aceptada,
                    FechaEnvio = now.AddDays(-14), FechaRespuesta = now.AddDays(-12),
                },
                // Eléctrico María → Vargas (Vista, para comparación)
                new Propuesta
                {
                    ProyectoId = pElectrico.Id, ConstructorId = perfilVargas.Id,
                    MontoTotal = 1_150_000m,
                    Descripcion = "Instalación eléctrica residencial completa. Tablero principal Square D 200A, 20 circuitos, cableado en conduit, tomas certificadas, iluminación exterior. Certificación CFIA al finalizar.",
                    Incluye = "Materiales, mano de obra, planos eléctricos, certificación CFIA, 2 años garantía",
                    PlazoEstimadoDias = 8, Estado = EstadoPropuesta.Vista,
                    FechaEnvio = now.AddDays(-15), FechaRespuesta = now.AddDays(-13),
                },
                // Pintura Carlos → Vargas (Aceptada)
                new Propuesta
                {
                    ProyectoId = pPintura.Id, ConstructorId = perfilVargas.Id,
                    MontoTotal = 820_000m,
                    Descripcion = "Pintura exterior completa de residencia de dos plantas. Preparación de superficie: lavado, raspado, sellado de grietas con masilla flexible, aplicación de fondo sellador y dos manos de Lanco Elastomérico Premium. Incluye marcos, rejas y portón. Andamios propios.",
                    Incluye = "Materiales Lanco Premium, andamios, limpieza al finalizar, garantía 5 años contra descascarado",
                    PlazoEstimadoDias = 12, Estado = EstadoPropuesta.Aceptada,
                    FechaEnvio = now.AddDays(-20), FechaRespuesta = now.AddDays(-18),
                },
                // Pisos Ana → Maestro (Finalizada)
                new Propuesta
                {
                    ProyectoId = pPisos.Id, ConstructorId = perfilMaestro.Id,
                    MontoTotal = 1_450_000m,
                    Descripcion = "Instalación de porcelanato 60x60 importado en sala, comedor y pasillo. Demolición y retiro del piso existente, aplicación de autonivelante en toda el área, pegado con Bondex especial, fragüe Mapei doble componente. Zócalos del mismo material. Entrega en 10 días hábiles.",
                    Incluye = "Demolición, retiro escombros, autonivelante, pega Bondex, fragüe Mapei, zócalos, protección de piso durante obra, limpieza final",
                    PlazoEstimadoDias = 10, Estado = EstadoPropuesta.Finalizada,
                    FechaEnvio = now.AddDays(-37), FechaRespuesta = now.AddDays(-35),
                },
                // Baño Laura → Vargas (Finalizada)
                new Propuesta
                {
                    ProyectoId = pBanio.Id, ConstructorId = perfilVargas.Id,
                    MontoTotal = 2_450_000m,
                    Descripcion = "Remodelación completa del baño principal con materiales de primera línea. Porcelanato italiano 30x60 en piso y paredes hasta el techo, mueble vanitory con mesón cuarzo, ducha con vidrio templado 8mm, inodoro Kohler Cimarron, espejo con retroiluminación LED. Cambio total de tuberías PVC y punto eléctrico 220V para calentador.",
                    Incluye = "Demolición, retiro de escombros, porcelanato, artefactos sanitarios Kohler, vidrio templado 8mm, mueble vanitory 80cm, espejo LED, tuberías PVC, materiales y mano de obra completa, limpieza final",
                    PlazoEstimadoDias = 22, Estado = EstadoPropuesta.Finalizada,
                    FechaEnvio = now.AddDays(-77), FechaRespuesta = now.AddDays(-75),
                },
                // Cocina María → Vargas (Enviada)
                new Propuesta
                {
                    ProyectoId = pCocina.Id, ConstructorId = perfilVargas.Id,
                    MontoTotal = 2_980_000m,
                    Descripcion = "Remodelación completa de cocina 18m². Demolición de pisos y muebles existentes, instalación de porcelanato 60x60 antideslizante, muebles modulares con frente MDF lacado blanco, backsplash en mosaico veneciano 30x30, recableado completo con tomas NEMA 5-20 en isla y mesón, iluminación LED empotrada y bajo-mueble.",
                    Incluye = "Demolición, muebles módulares con mesón granito, porcelanato, backsplash, recableado completo, iluminación LED, limpieza final, garantía 1 año",
                    PlazoEstimadoDias = 25, Estado = EstadoPropuesta.Enviada,
                    FechaEnvio = now.AddDays(-7),
                },
                // Cocina María → Maestro (Enviada, para comparación)
                new Propuesta
                {
                    ProyectoId = pCocina.Id, ConstructorId = perfilMaestro.Id,
                    MontoTotal = 2_820_000m,
                    Descripcion = "Remodelación de cocina integral. Pisos cerámicos 60x60, muebles en melanina blanca con herrajes Häfele, backsplash en azulejo artesanal, puntos eléctricos e iluminación LED. Experiencia en más de 30 cocinas residenciales en la GAM.",
                    Incluye = "Demolición, cerámica, muebles melanina, backsplash, electricidad, iluminación, limpieza final",
                    PlazoEstimadoDias = 22, Estado = EstadoPropuesta.Enviada,
                    FechaEnvio = now.AddDays(-6),
                }
            );
            await db.SaveChangesAsync();
            logger.LogInformation("✅ Propuestas creadas.");
        }

        // ── 6. Permisos por rol ──────────────────────────────────────────────
        if (!await db.RolPermisos.AnyAsync())
        {
            var rolPermisos = new List<RolPermiso>();
            foreach (var (rol, permisos) in Permisos.MatrizPorDefecto)
                rolPermisos.AddRange(permisos.Select(p => new RolPermiso { Rol = rol, PermisoCodigo = p }));
            db.RolPermisos.AddRange(rolPermisos);
            await db.SaveChangesAsync();
            logger.LogInformation("✅ Permisos por rol: {N} entradas.", rolPermisos.Count);
        }

        // ── 7. Configuraciones globales ───────────────────────────────────────
        if (!await db.Configuraciones.AnyAsync())
        {
            db.Configuraciones.AddRange(
                new ConfiguracionGlobal { Clave = "app.nombre",                Valor = "ConstruApp",                           Descripcion = "Nombre de la aplicación",                    Categoria = "General"        },
                new ConfiguracionGlobal { Clave = "app.version",               Valor = "1.0.0",                                Descripcion = "Versión actual",                              Categoria = "General", Editable = false },
                new ConfiguracionGlobal { Clave = "app.moneda",                Valor = "CRC",                                  Descripcion = "Código de moneda (ISO 4217)",                  Categoria = "General"        },
                new ConfiguracionGlobal { Clave = "app.pais",                  Valor = "Costa Rica",                           Descripcion = "País de operación",                           Categoria = "General"        },
                new ConfiguracionGlobal { Clave = "app.timezone",              Valor = "America/Costa_Rica",                   Descripcion = "Zona horaria por defecto",                    Categoria = "General"        },
                new ConfiguracionGlobal { Clave = "auth.registro_abierto",     Valor = "true",                                 Descripcion = "Permite registro público de nuevos usuarios", Categoria = "Auth"           },
                new ConfiguracionGlobal { Clave = "auth.jwt_expiracion",       Valor = "1440",                                 Descripcion = "Minutos de vida del JWT",                     Categoria = "Auth"           },
                new ConfiguracionGlobal { Clave = "auth.max_login_fallos",     Valor = "5",                                    Descripcion = "Intentos fallidos antes de bloqueo",          Categoria = "Auth"           },
                new ConfiguracionGlobal { Clave = "proyectos.max_propuestas",  Valor = "10",                                   Descripcion = "Máximo de propuestas por proyecto",           Categoria = "Proyectos"      },
                new ConfiguracionGlobal { Clave = "empresas.verificacion_manual", Valor = "true",                             Descripcion = "Requiere aprobación manual para verificar",   Categoria = "Empresas"       },
                new ConfiguracionGlobal { Clave = "ia.habilitada",             Valor = "true",                                 Descripcion = "Activa el módulo de IA",                      Categoria = "IA"             },
                new ConfiguracionGlobal { Clave = "ia.proveedor",              Valor = "groq",                                 Descripcion = "Proveedor IA activo (groq|gemini)",            Categoria = "IA"             },
                new ConfiguracionGlobal { Clave = "ia.modelo",                 Valor = "llama-3.3-70b-versatile",              Descripcion = "Modelo de IA a usar",                         Categoria = "IA"             },
                new ConfiguracionGlobal { Clave = "notif.email_habilitado",    Valor = "false",                                Descripcion = "Envía notificaciones por email",              Categoria = "Notificaciones" },
                new ConfiguracionGlobal { Clave = "notif.push_habilitado",     Valor = "false",                                Descripcion = "Envía notificaciones push",                   Categoria = "Notificaciones" }
            );
            await db.SaveChangesAsync();
            logger.LogInformation("✅ Configuraciones globales creadas.");
        }

        // ── 8. Datos completos: solo corre si no hay empleados ─────────────
        int vargasId  = uVargas.Id;
        int techId    = uTech.Id;
        int maestroId = uMaestro.Id;
        var pvMain = await db.PerfilesConstructor.FirstOrDefaultAsync(p => p.UsuarioId == vargasId);
        var ptMain = await db.PerfilesConstructor.FirstOrDefaultAsync(p => p.UsuarioId == techId);
        var pmMain = await db.PerfilesConstructor.FirstOrDefaultAsync(p => p.UsuarioId == maestroId);

        if (pvMain is null || ptMain is null || pmMain is null) return;

        if (!await db.Empleados.AnyAsync())
        {
            // ── 8a. Empleados Vargas ─────────────────────────────────────────
            var empleados = new List<Empleado>
            {
                new() { ConstructorId = pvMain.Id, Nombre = "Rodrigo Vargas Ulate",    Rol = "Maestro de obras",         Telefono = "8834-7712", Activo = true },
                new() { ConstructorId = pvMain.Id, Nombre = "Fabián Rojas Herrera",    Rol = "Ayudante de construcción", Telefono = "8711-3345", Activo = true },
                new() { ConstructorId = pvMain.Id, Nombre = "Kevin Jiménez Mora",      Rol = "Pintor especializado",     Telefono = "8945-6623", Activo = true },
                new() { ConstructorId = pvMain.Id, Nombre = "Andrés Castro Alpízar",   Rol = "Oficial de construcción",  Telefono = "8623-7890", Activo = true },
                new() { ConstructorId = ptMain.Id, Nombre = "Luis Hernández Varela",   Rol = "Técnico electricista",     Telefono = "8712-5599", Activo = true },
                new() { ConstructorId = ptMain.Id, Nombre = "Sebastián Mora Campos",   Rol = "Ayudante técnico",         Telefono = "8530-1177", Activo = true },
            };
            db.Empleados.AddRange(empleados);
            await db.SaveChangesAsync();

            var empRodrigo  = empleados[0];
            var empFabian   = empleados[1];
            var empKevin    = empleados[2];
            var empAndres   = empleados[3];
            var empLuis     = empleados[4];
            var empSebastion= empleados[5];

            // Recargar proyectos
            var todosP    = await db.Proyectos.ToListAsync();
            var pBanioR   = todosP.First(p => p.AreaM2 == 8m && p.TipoProyecto == TipoProyecto.Remodelacion);
            var pPinturaR = todosP.First(p => p.TipoProyecto == TipoProyecto.Pintura);
            var pPisosR   = todosP.First(p => p.TipoProyecto == TipoProyecto.Pisos);
            var pElecR    = todosP.First(p => p.TipoProyecto == TipoProyecto.ElectricoPlomeria);

            // Recargar propuestas
            var todasProp    = await db.Propuestas.ToListAsync();
            var propBanio    = todasProp.First(p => p.ProyectoId == pBanioR.Id   && p.ConstructorId == pvMain.Id);
            var propPintura  = todasProp.First(p => p.ProyectoId == pPinturaR.Id && p.ConstructorId == pvMain.Id);
            var propPisos    = todasProp.First(p => p.ProyectoId == pPisosR.Id   && p.ConstructorId == pmMain.Id);
            var propElectrico= todasProp.First(p => p.ProyectoId == pElecR.Id    && p.ConstructorId == ptMain.Id);

            // ────────────────────────────────────────────────────────────────
            // ── 8b. Proyecto BAÑO LAURA (Completado) ─────────────────────────
            // ────────────────────────────────────────────────────────────────

            // Carta de aceptación
            db.CartasAceptacion.Add(new CartaAceptacion
            {
                ProyectoId = pBanioR.Id, PropuestaId = propBanio.Id, Aceptado = true,
                FechaEmision = now.AddDays(-75), FechaAceptacion = now.AddDays(-75),
                ObservacionesCliente = "Acepto los términos propuestos. Forma de pago: 40% al inicio, 40% a los 11 días de trabajo, 20% al finalizar y dar conformidad.",
            });
            await db.SaveChangesAsync();

            // Presupuesto partidas
            var partidasBanio = new List<PresupuestoPartida>
            {
                new() { ProyectoId = pBanioR.Id, Nombre = "Demolición y preparación",    Categoria = "Demolición",   PresupuestoEstimado = 350_000m, Descripcion = "Demolición de cerámica, retiro artefactos viejos y preparación de superficies" },
                new() { ProyectoId = pBanioR.Id, Nombre = "Porcelanato e instalación",   Categoria = "Acabados",     PresupuestoEstimado = 800_000m, Descripcion = "Porcelanato italiano 30x60 piso y paredes, fragüe y zócalos" },
                new() { ProyectoId = pBanioR.Id, Nombre = "Artefactos sanitarios",       Categoria = "Sanitarios",   PresupuestoEstimado = 700_000m, Descripcion = "Inodoro Kohler Cimarron, lavabo sobre encimera, ducha y accesorios" },
                new() { ProyectoId = pBanioR.Id, Nombre = "Mueble vanitory y espejo LED",Categoria = "Carpintería",  PresupuestoEstimado = 450_000m, Descripcion = "Mueble vanitory 80cm con mesón cuarzo, espejo retroiluminado LED" },
                new() { ProyectoId = pBanioR.Id, Nombre = "Mano de obra y acabados",     Categoria = "Mano de obra", PresupuestoEstimado = 150_000m, Descripcion = "Albañilería, plomería, punto eléctrico, pintura de techo, limpieza" },
            };
            db.PresupuestoPartidas.AddRange(partidasBanio);
            await db.SaveChangesAsync();

            // Gastos
            db.GastosObra.AddRange(
                new GastoObra { ProyectoId = pBanioR.Id, PartidaId = partidasBanio[0].Id, RegistradoPorId = vargasId, Descripcion = "Retiro escombros camión volcador", Categoria = "Demolición", Monto = 85_000m, Fecha = now.AddDays(-64) },
                new GastoObra { ProyectoId = pBanioR.Id, PartidaId = partidasBanio[1].Id, RegistradoPorId = vargasId, Descripcion = "Porcelanato italiano 30x60 Caja×20 — EPA Materials", Categoria = "Materiales", Monto = 480_000m, Fecha = now.AddDays(-62), Referencia = "EPA #204887" },
                new GastoObra { ProyectoId = pBanioR.Id, PartidaId = partidasBanio[1].Id, RegistradoPorId = vargasId, Descripcion = "Pega cerámica Bondex 20kg×10 + fragüe Mapei doble comp.", Categoria = "Materiales", Monto = 78_000m, Fecha = now.AddDays(-62) },
                new GastoObra { ProyectoId = pBanioR.Id, PartidaId = partidasBanio[2].Id, RegistradoPorId = vargasId, Descripcion = "Inodoro Kohler Cimarron + lavabo Kohler + ducha vidrio templado", Categoria = "Sanitarios", Monto = 580_000m, Fecha = now.AddDays(-58), Referencia = "Ferretería Constructor Lote #77" },
                new GastoObra { ProyectoId = pBanioR.Id, PartidaId = partidasBanio[3].Id, RegistradoPorId = vargasId, Descripcion = "Mueble vanitory fabricación a medida 80cm", Categoria = "Carpintería", Monto = 290_000m, Fecha = now.AddDays(-54), Referencia = "Carpintería Solano OT-#023" },
                new GastoObra { ProyectoId = pBanioR.Id, PartidaId = partidasBanio[4].Id, RegistradoPorId = vargasId, Descripcion = "Mano de obra albañilería + plomería + electricidad", Categoria = "Mano de obra", Monto = 135_000m, Fecha = now.AddDays(-41) }
            );
            await db.SaveChangesAsync();

            // Avances
            db.AvancesObra.AddRange(
                new AvanceObra { ProyectoId = pBanioR.Id, ConstructorId = pvMain.Id, Titulo = "Demolición completada", PorcentajeAvance = 25, Descripcion = "Retiro completo de cerámica vieja, artefactos sanitarios y tuberías en mal estado. Superficie preparada para nueva instalación. Sin imprevistos.", Fecha = now.AddDays(-61) },
                new AvanceObra { ProyectoId = pBanioR.Id, ConstructorId = pvMain.Id, Titulo = "Porcelanato instalado al 100%", PorcentajeAvance = 65, Descripcion = "Porcelanato instalado en piso y paredes. Tuberías nuevas colocadas. Artefactos sanitarios Kohler instalados. Pendiente: vanitory, espejo y detalles finales de pintura.", Fecha = now.AddDays(-50) },
                new AvanceObra { ProyectoId = pBanioR.Id, ConstructorId = pvMain.Id, Titulo = "Entrega final — Proyecto completado", PorcentajeAvance = 100, Descripcion = "Mueble vanitory con mesón cuarzo instalado, espejo LED funcionando, pintura de techo lista, limpieza general completada. Entregado a satisfacción total de la cliente.", Fecha = now.AddDays(-40) }
            );
            await db.SaveChangesAsync();

            // Asignación empleados
            db.AsignacionesEmpleado.AddRange(
                new AsignacionEmpleado { EmpleadoId = empRodrigo.Id, ProyectoId = pBanioR.Id, Notas = "Maestro de obras — proyecto completado", FechaAsignacion = now.AddDays(-65) },
                new AsignacionEmpleado { EmpleadoId = empFabian.Id,  ProyectoId = pBanioR.Id, Notas = "Ayudante", FechaAsignacion = now.AddDays(-65) }
            );
            await db.SaveChangesAsync();

            // Facturas baño (2: anticipo 40% + saldo 60%) — Vargas FAC-2026-0001 y 0002
            var fact1Banio = new Factura
            {
                ProyectoId = pBanioR.Id, PropuestaId = propBanio.Id, ConstructorId = pvMain.Id,
                Numero = "FAC-2026-0001", Concepto = "Anticipo 40% — Remodelación baño principal",
                LineasJson = Lineas(("Anticipo 40% del contrato — Remodelación baño principal Laura Solano", 1, 980_000m)),
                MontoTotal = 980_000m, MontoPagado = 980_000m, Estado = EstadoFactura.Pagada,
                AplicaIVA = false, MontoIVA = 0, MontoDescuento = 0,
                FechaEmision = now.AddDays(-75), FechaVencimiento = now.AddDays(-72),
                Notas = "Primer pago según carta de aceptación firmada el mismo día. Anticipo 40% para inicio inmediato de obra.",
                FechaEnvioChat = now.AddDays(-75),
            };
            var fact2Banio = new Factura
            {
                ProyectoId = pBanioR.Id, PropuestaId = propBanio.Id, ConstructorId = pvMain.Id,
                Numero = "FAC-2026-0002", Concepto = "Saldo final 60% — Remodelación baño principal",
                LineasJson = Lineas(
                    ("Demolición total y retiro de escombros (8m²)", 1, 280_000m),
                    ("Porcelanato italiano 30x60 instalado (piso 8m² + paredes 32m²)", 1, 480_000m),
                    ("Artefactos sanitarios Kohler (inodoro + lavabo + ducha vidrio)", 1, 360_000m),
                    ("Mueble vanitory 80cm con mesón cuarzo + espejo LED", 1, 280_000m),
                    ("Mano de obra, tuberías PVC, punto eléctrico y limpieza final", 1, 70_000m)
                ),
                MontoTotal = 1_470_000m, MontoPagado = 1_470_000m, Estado = EstadoFactura.Pagada,
                AplicaIVA = false, MontoIVA = 0, MontoDescuento = 0,
                FechaEmision = now.AddDays(-40), FechaVencimiento = now.AddDays(-37),
                Notas = "Pago final contra entrega satisfactoria. Saldo 60% al completar el proyecto según acuerdo.",
                FechaEnvioChat = now.AddDays(-40),
            };
            db.Facturas.AddRange(fact1Banio, fact2Banio);
            await db.SaveChangesAsync();

            db.PagosFactura.AddRange(
                new PagoFactura { FacturaId = fact1Banio.Id, Monto = 980_000m,   Fecha = now.AddDays(-75), MetodoPago = MetodoPago.SINPE,         Referencia = "SINPE ref: BANIO-ANT-001",   Notas = "Anticipo inicial. Confirmado por cliente." },
                new PagoFactura { FacturaId = fact2Banio.Id, Monto = 1_470_000m, Fecha = now.AddDays(-39), MetodoPago = MetodoPago.Transferencia, Referencia = "BCR ref: BANIO-SAL-001",     Notas = "Saldo final. Proyecto entregado a satisfacción." }
            );
            await db.SaveChangesAsync();

            // Calificación Laura → Vargas
            db.Calificaciones.Add(new Calificacion
            {
                ProyectoId = pBanioR.Id, PropuestaId = propBanio.Id,
                EvaluadorId = uLaura.Id, EvaluadoId = vargasId, Puntuacion = 5,
                Comentario = "Quedé absolutamente encantada con el trabajo de Constructora Vargas. El baño quedó exactamente como lo imaginé, incluso mejor. Rodrigo y su equipo fueron muy profesionales, llegaron puntual todos los días y terminaron en el plazo prometido. El porcelanato quedó impecable y el mueble vanitory es precioso. Los recomiendo al 100%.",
                Fecha = now.AddDays(-37),
            });
            await db.SaveChangesAsync();

            // Mensajes baño Laura
            db.Mensajes.AddRange(
                new Mensaje { ProyectoId = pBanioR.Id, PropuestaId = propBanio.Id, Canal = "Cliente", RemitenteId = uLaura.Id, DestinatarioId = vargasId, Contenido = "Hola! Me alegra que hayan aceptado el proyecto. ¿Cuándo podemos coordinar la visita inicial al baño para ver el estado actual y hacer mediciones?", Leido = true, FechaEnvio = now.AddDays(-76) },
                new Mensaje { ProyectoId = pBanioR.Id, PropuestaId = propBanio.Id, Canal = "Cliente", RemitenteId = vargasId, DestinatarioId = uLaura.Id, Contenido = "Buenos días Laura! Con mucho gusto. Mañana a las 9am podemos estar ahí para la medición exacta y revisar los puntos de agua y electricidad. ¿Le queda bien?", Leido = true, FechaEnvio = now.AddDays(-76) },
                new Mensaje { ProyectoId = pBanioR.Id, PropuestaId = propBanio.Id, Canal = "Cliente", RemitenteId = uLaura.Id, DestinatarioId = vargasId, Contenido = "Perfecto! Una pregunta: ¿el porcelanato que mencionaron en la propuesta se puede ver antes de comprarlo? Me gustaría elegir el color exacto y ver muestras.", Leido = true, FechaEnvio = now.AddDays(-76) },
                new Mensaje { ProyectoId = pBanioR.Id, PropuestaId = propBanio.Id, Canal = "Cliente", RemitenteId = vargasId, DestinatarioId = uLaura.Id, Contenido = "Claro que sí! Tenemos muestras de 3 opciones de porcelanato italiano. Las llevamos mañana para que escoja en sitio. También podemos ir juntos a EPA si prefiere ver más opciones.", Leido = true, FechaEnvio = now.AddDays(-75) },
                new Mensaje { ProyectoId = pBanioR.Id, PropuestaId = propBanio.Id, Canal = "General", RemitenteId = vargasId, DestinatarioId = uLaura.Id, Contenido = "Laura, le comparto que la demolición quedó lista hoy. Todo perfecto, sin problemas con las tuberías principales. Mañana comenzamos a colocar el porcelanato.", Leido = true, FechaEnvio = now.AddDays(-61) },
                new Mensaje { ProyectoId = pBanioR.Id, PropuestaId = propBanio.Id, Canal = "General", RemitenteId = uLaura.Id, DestinatarioId = vargasId, Contenido = "El baño quedó increíble! Muchas gracias a todo el equipo. El espejo LED le da un toque muy moderno y elegante. Ya les dejé una reseña 5 estrellas en el perfil.", Leido = true, FechaEnvio = now.AddDays(-38) }
            );
            await db.SaveChangesAsync();

            // ────────────────────────────────────────────────────────────────
            // ── 8c. Proyecto PINTURA CARLOS (EnCurso, Vargas) ────────────────
            // ────────────────────────────────────────────────────────────────

            db.CartasAceptacion.Add(new CartaAceptacion
            {
                ProyectoId = pPinturaR.Id, PropuestaId = propPintura.Id, Aceptado = true,
                FechaEmision = now.AddDays(-18), FechaAceptacion = now.AddDays(-18),
                ObservacionesCliente = "Acepto la propuesta. Forma de pago: 30% al inicio, 70% contra entrega satisfactoria.",
            });
            await db.SaveChangesAsync();

            var partidasPintura = new List<PresupuestoPartida>
            {
                new() { ProyectoId = pPinturaR.Id, Nombre = "Preparación de superficie", Categoria = "Preparación", PresupuestoEstimado = 180_000m, Descripcion = "Lavado, raspado, masillado y sellador en toda la fachada" },
                new() { ProyectoId = pPinturaR.Id, Nombre = "Pintura elastomérica 2 manos", Categoria = "Pintura", PresupuestoEstimado = 420_000m, Descripcion = "2 manos Lanco Elastomérico en paredes, 1 mano en marcos y rejas" },
                new() { ProyectoId = pPinturaR.Id, Nombre = "Mano de obra y andamios", Categoria = "Mano de obra", PresupuestoEstimado = 220_000m, Descripcion = "Montaje y desmontaje de andamios + mano de obra" },
            };
            db.PresupuestoPartidas.AddRange(partidasPintura);
            await db.SaveChangesAsync();

            db.GastosObra.AddRange(
                new GastoObra { ProyectoId = pPinturaR.Id, PartidaId = partidasPintura[0].Id, RegistradoPorId = vargasId, Descripcion = "Sellador acrílico Sika 20kg×4 + masilla flexible Sika", Categoria = "Materiales", Monto = 72_000m, Fecha = now.AddDays(-8) },
                new GastoObra { ProyectoId = pPinturaR.Id, PartidaId = partidasPintura[1].Id, RegistradoPorId = vargasId, Descripcion = "Pintura Lanco Elastomérico Hueso Cálido HC-202 (5gal×8)", Categoria = "Materiales", Monto = 136_000m, Fecha = now.AddDays(-8), Referencia = "EPA #308-PNT" },
                new GastoObra { ProyectoId = pPinturaR.Id, PartidaId = partidasPintura[1].Id, RegistradoPorId = vargasId, Descripcion = "Pintura esmalte Beige Clásico BC-015 marcos/rejas (1gal×4)", Categoria = "Materiales", Monto = 52_000m, Fecha = now.AddDays(-7) },
                new GastoObra { ProyectoId = pPinturaR.Id, PartidaId = partidasPintura[2].Id, RegistradoPorId = vargasId, Descripcion = "Mano de obra semana 1 — Kevin + Andrés (4 días)", Categoria = "Mano de obra", Monto = 124_000m, Fecha = now.AddDays(-4) }
            );
            await db.SaveChangesAsync();

            db.AvancesObra.AddRange(
                new AvanceObra { ProyectoId = pPinturaR.Id, ConstructorId = pvMain.Id, Titulo = "Preparación de superficie completada", PorcentajeAvance = 30, Descripcion = "Lavado a presión, raspado de pintura vieja, masillado de grietas y aplicación de sellador en planta baja y fachada principal. Andamios montados hasta techo. Superficie lista para primera mano de pintura.", Fecha = now.AddDays(-6) },
                new AvanceObra { ProyectoId = pPinturaR.Id, ConstructorId = pvMain.Id, Titulo = "Primera mano aplicada en 3 fachadas", PorcentajeAvance = 55, Descripcion = "Primera mano de Lanco Elastomérico aplicada en fachada frontal, lateral derecha e izquierda. Marcos y rejas con primera mano esmalte beige. Color exactamente según muestra aprobada. Pendiente: segunda mano y fachada trasera.", Fecha = now.AddDays(-2) }
            );
            await db.SaveChangesAsync();

            db.AsignacionesEmpleado.AddRange(
                new AsignacionEmpleado { EmpleadoId = empKevin.Id,  ProyectoId = pPinturaR.Id, Notas = "Pintor principal", FechaAsignacion = now.AddDays(-9) },
                new AsignacionEmpleado { EmpleadoId = empAndres.Id, ProyectoId = pPinturaR.Id, Notas = "Pintor ayudante",  FechaAsignacion = now.AddDays(-9) }
            );
            await db.SaveChangesAsync();

            // Facturas pintura: anticipo pagado + saldo enviado (pendiente)
            var factPintAnt = new Factura
            {
                ProyectoId = pPinturaR.Id, PropuestaId = propPintura.Id, ConstructorId = pvMain.Id,
                Numero = "FAC-2026-0003", Concepto = "Anticipo 30% — Pintura exterior residencia La Unión",
                LineasJson = Lineas(("Anticipo 30% del contrato — Pintura exterior residencia 2 plantas", 1, 246_000m)),
                MontoTotal = 246_000m, MontoPagado = 246_000m, Estado = EstadoFactura.Pagada,
                AplicaIVA = false, MontoIVA = 0, MontoDescuento = 0,
                FechaEmision = now.AddDays(-18), FechaVencimiento = now.AddDays(-15),
                Notas = "Anticipo para compra de materiales. 30% del total del contrato según carta de aceptación.",
                FechaEnvioChat = now.AddDays(-18),
            };
            // Saldo final — con IVA desglosado para demo del feature
            decimal subTotalPint = 494_000m;
            decimal ivaPint      = 80_000m;   // ~16% rounding
            decimal totalPint    = 574_000m;
            var factPintSal = new Factura
            {
                ProyectoId = pPinturaR.Id, PropuestaId = propPintura.Id, ConstructorId = pvMain.Id,
                Numero = "FAC-2026-0004", Concepto = "Saldo 70% — Pintura exterior residencia La Unión",
                LineasJson = Lineas(
                    ("Preparación de superficie — lavado, raspado, masillado y sellador (220m²)", 1, 105_000m),
                    ("Pintura Lanco Elastomérico Premium 2 manos — 220m²", 220, 950m),
                    ("Pintura esmalte satiné marcos, rejas y portón", 1, 52_000m),
                    ("Montaje / desmontaje andamios propios (12 días)", 12, 7_500m),
                    ("Mano de obra 2 pintores especializados (12 días)", 24, 5_500m)
                ),
                MontoTotal = totalPint, MontoPagado = 0, Estado = EstadoFactura.Enviada,
                AplicaIVA = true, MontoIVA = ivaPint, MontoDescuento = 0,
                FechaEmision = now.AddDays(-1), FechaVencimiento = now.AddDays(14),
                Notas = "Saldo final 70% por completar pintura exterior. IVA incluido. Favor cancelar dentro del plazo indicado.",
                FechaEnvioChat = now.AddDays(-1),
            };
            db.Facturas.AddRange(factPintAnt, factPintSal);
            await db.SaveChangesAsync();

            db.PagosFactura.Add(
                new PagoFactura { FacturaId = factPintAnt.Id, Monto = 246_000m, Fecha = now.AddDays(-17), MetodoPago = MetodoPago.SINPE, Referencia = "SINPE ref: PINTURA-ANT-001", Notas = "Anticipo confirmado." }
            );
            await db.SaveChangesAsync();

            // Mensajes pintura
            db.Mensajes.AddRange(
                new Mensaje { ProyectoId = pPinturaR.Id, PropuestaId = propPintura.Id, Canal = "Cliente", RemitenteId = uCarlos!.Id, DestinatarioId = vargasId, Contenido = "Buenos días. Quiero confirmar que el color acordado para las paredes es el 'Hueso Cálido' HC-202 de Lanco. ¿Correcto?", Leido = true, FechaEnvio = now.AddDays(-19) },
                new Mensaje { ProyectoId = pPinturaR.Id, PropuestaId = propPintura.Id, Canal = "Cliente", RemitenteId = vargasId, DestinatarioId = uCarlos!.Id, Contenido = "Correcto Carlos, Hueso Cálido HC-202 en paredes y Beige Clásico BC-015 en marcos y rejas, tal como acordamos. Mañana compramos los materiales en EPA.", Leido = true, FechaEnvio = now.AddDays(-19) },
                new Mensaje { ProyectoId = pPinturaR.Id, PropuestaId = propPintura.Id, Canal = "General", RemitenteId = vargasId, DestinatarioId = uCarlos!.Id, Contenido = "Le comparto avance del día. Primera mano terminada en 3 de 4 fachadas. Mañana completamos la fachada trasera. Todo va según cronograma, estimamos terminar el jueves.", Leido = true, FechaEnvio = now.AddDays(-2) },
                new Mensaje { ProyectoId = pPinturaR.Id, PropuestaId = propPintura.Id, Canal = "General", RemitenteId = uCarlos!.Id, DestinatarioId = vargasId, Contenido = "Excelente! Vi las fotos del avance, quedó muy bien el color. Para la segunda mano, ¿van a aplicar también una capa impermeabilizante adicional?", Leido = true, FechaEnvio = now.AddDays(-1) },
                new Mensaje { ProyectoId = pPinturaR.Id, PropuestaId = propPintura.Id, Canal = "General", RemitenteId = vargasId, DestinatarioId = uCarlos!.Id, Contenido = "El Lanco Elastomérico ya tiene componente impermeabilizante integrado en su fórmula. Con la segunda mano queda completamente protegido contra la lluvia por 5 años. Le envié la factura del saldo por el chat.", Leido = false, FechaEnvio = now.AddDays(-1) }
            );
            await db.SaveChangesAsync();

            // ────────────────────────────────────────────────────────────────
            // ── 8d. Proyecto ELÉCTRICO MARÍA (EnCurso, TechBuild) ────────────
            // ────────────────────────────────────────────────────────────────

            db.CartasAceptacion.Add(new CartaAceptacion
            {
                ProyectoId = pElecR.Id, PropuestaId = propElectrico.Id, Aceptado = true,
                FechaEmision = now.AddDays(-12), FechaAceptacion = now.AddDays(-12),
                ObservacionesCliente = "Acepto. 50% de anticipo al inicio, 50% contra entrega con certificación CFIA.",
            });
            await db.SaveChangesAsync();

            var partidasElec = new List<PresupuestoPartida>
            {
                new() { ProyectoId = pElecR.Id, Nombre = "Tablero y protecciones", Categoria = "Materiales eléctricos", PresupuestoEstimado = 280_000m, Descripcion = "Tablero Square D 200A con breakers diferenciales para todos los circuitos" },
                new() { ProyectoId = pElecR.Id, Nombre = "Cableado y circuitos", Categoria = "Materiales eléctricos", PresupuestoEstimado = 350_000m, Descripcion = "Cableado AWG 12 THHN, conduit galvanizado, 20 circuitos independientes" },
                new() { ProyectoId = pElecR.Id, Nombre = "Tomas e iluminación", Categoria = "Materiales eléctricos", PresupuestoEstimado = 210_000m, Descripcion = "Tomas NEMA certificadas, iluminación LED interior y exterior" },
                new() { ProyectoId = pElecR.Id, Nombre = "Mano de obra y certificación", Categoria = "Mano de obra", PresupuestoEstimado = 240_000m, Descripcion = "Instalación, pruebas, certificación CFIA y planos as-built" },
            };
            db.PresupuestoPartidas.AddRange(partidasElec);
            await db.SaveChangesAsync();

            db.GastosObra.AddRange(
                new GastoObra { ProyectoId = pElecR.Id, PartidaId = partidasElec[0].Id, RegistradoPorId = techId, Descripcion = "Tablero Square D QO130L200PG 200A + breakers diferenciales ×20", Categoria = "Materiales", Monto = 245_000m, Fecha = now.AddDays(-4), Referencia = "Distribuidora El Clavo OC-4412" },
                new GastoObra { ProyectoId = pElecR.Id, PartidaId = partidasElec[1].Id, RegistradoPorId = techId, Descripcion = "Cable THHN AWG 12 Condumex (rollo 100m × 4 colores × 3)", Categoria = "Materiales", Monto = 168_000m, Fecha = now.AddDays(-4) },
                new GastoObra { ProyectoId = pElecR.Id, PartidaId = partidasElec[1].Id, RegistradoPorId = techId, Descripcion = "Conduit galvanizado 3/4\" × 50 tubos + curvas + conectores", Categoria = "Materiales", Monto = 78_000m, Fecha = now.AddDays(-4) },
                new GastoObra { ProyectoId = pElecR.Id, PartidaId = partidasElec[2].Id, RegistradoPorId = techId, Descripcion = "Tomas NEMA 5-20 y 5-15 Leviton ×30 + apagadores", Categoria = "Materiales", Monto = 82_000m, Fecha = now.AddDays(-3) }
            );
            await db.SaveChangesAsync();

            db.AvancesObra.AddRange(
                new AvanceObra { ProyectoId = pElecR.Id, ConstructorId = ptMain.Id, Titulo = "Tablero y canalización lista", PorcentajeAvance = 40, Descripcion = "Tablero principal Square D instalado y fijado. Canalización en conduit galvanizado tendida en todos los circuitos de planta baja. Tendido del cableado AWG 12 avanzando en un 60% planta baja.", Fecha = now.AddDays(-3) }
            );
            await db.SaveChangesAsync();

            db.AsignacionesEmpleado.AddRange(
                new AsignacionEmpleado { EmpleadoId = empLuis.Id,     ProyectoId = pElecR.Id, Notas = "Técnico electricista principal", FechaAsignacion = now.AddDays(-5) },
                new AsignacionEmpleado { EmpleadoId = empSebastion.Id,ProyectoId = pElecR.Id, Notas = "Ayudante técnico",              FechaAsignacion = now.AddDays(-5) }
            );
            await db.SaveChangesAsync();

            // Factura anticipo eléctrico (TBC-2026-0001) — Pagada
            decimal subElecAnt = 477_876m;
            decimal ivaElecAnt = 62_124m;
            var factElecAnt = new Factura
            {
                ProyectoId = pElecR.Id, PropuestaId = propElectrico.Id, ConstructorId = ptMain.Id,
                Numero = "TBC-2026-0001", Concepto = "Anticipo 50% — Instalación eléctrica casa nueva Santa Ana",
                LineasJson = Lineas(
                    ("Tablero Square D 200A + breakers diferenciales (20 circuitos)", 1, 185_000m),
                    ("Cableado THHN AWG 12 (rollo 100m × 3 colores)", 3, 38_000m),
                    ("Tomas NEMA 5-20 y 5-15 certificadas Leviton", 25, 2_800m),
                    ("Conduit galvanizado 3/4\" + accesorios (kit)", 1, 48_876m),
                    ("Mano de obra instalación día 1-3 (2 técnicos)", 6, 10_000m)
                ),
                MontoTotal = 540_000m, MontoPagado = 540_000m, Estado = EstadoFactura.Pagada,
                AplicaIVA = true, MontoIVA = ivaElecAnt, MontoDescuento = 0,
                FechaEmision = now.AddDays(-12), FechaVencimiento = now.AddDays(-9),
                Notas = "Anticipo 50% para inicio de obra. IVA incluido. Materiales Condumex y Square D certificados.",
                FechaEnvioEmail = now.AddDays(-12), FechaEnvioChat = now.AddDays(-12),
            };
            db.Facturas.Add(factElecAnt);
            await db.SaveChangesAsync();

            db.PagosFactura.Add(
                new PagoFactura { FacturaId = factElecAnt.Id, Monto = 540_000m, Fecha = now.AddDays(-11), MetodoPago = MetodoPago.Transferencia, Referencia = "BAC ref: ELEC-ANT-TBC-001", Notas = "Anticipo confirmado por cliente." }
            );
            await db.SaveChangesAsync();

            // Mensajes eléctrico
            db.Mensajes.AddRange(
                new Mensaje { ProyectoId = pElecR.Id, PropuestaId = propElectrico.Id, Canal = "Cliente", RemitenteId = uMaria.Id, DestinatarioId = techId, Contenido = "Hola, me alegra que empecemos pronto. Una duda: ¿el tablero 200A es suficiente para también conectar un calentador solar híbrido de 220V más adelante?", Leido = true, FechaEnvio = now.AddDays(-11) },
                new Mensaje { ProyectoId = pElecR.Id, PropuestaId = propElectrico.Id, Canal = "Cliente", RemitenteId = techId, DestinatarioId = uMaria.Id, Contenido = "Perfecto María. El tablero Square D 200A soporta perfectamente el calentador solar y aún queda capacidad para ampliaciones futuras. De hecho ya dejamos un circuito 220V exclusivo reservado para ese equipo.", Leido = true, FechaEnvio = now.AddDays(-11) },
                new Mensaje { ProyectoId = pElecR.Id, PropuestaId = propElectrico.Id, Canal = "General", RemitenteId = techId, DestinatarioId = uMaria.Id, Contenido = "Avance día 3: tablero instalado y fijado, canalización planta baja al 100%, tendido de cable planta baja avanzando. Estimamos terminar el tendido completo mañana.", Leido = true, FechaEnvio = now.AddDays(-2) },
                new Mensaje { ProyectoId = pElecR.Id, PropuestaId = propElectrico.Id, Canal = "General", RemitenteId = uMaria.Id, DestinatarioId = techId, Contenido = "Muchas gracias por el avance. ¿Podría visitarlos mañana para ver el progreso? Quiero coordinar con el ingeniero el punto exacto de la ducha eléctrica.", Leido = false, FechaEnvio = now.AddDays(-1) }
            );
            await db.SaveChangesAsync();

            // ────────────────────────────────────────────────────────────────
            // ── 8e. Proyecto PISOS ANA (Completado, Maestro) ─────────────────
            // ────────────────────────────────────────────────────────────────

            db.CartasAceptacion.Add(new CartaAceptacion
            {
                ProyectoId = pPisosR.Id, PropuestaId = propPisos.Id, Aceptado = true,
                FechaEmision = now.AddDays(-35), FechaAceptacion = now.AddDays(-35),
                ObservacionesCliente = "Acepto propuesta. Pago total contra entrega.",
            });
            await db.SaveChangesAsync();

            var partidasPisos = new List<PresupuestoPartida>
            {
                new() { ProyectoId = pPisosR.Id, Nombre = "Demolición piso existente", Categoria = "Demolición", PresupuestoEstimado = 250_000m },
                new() { ProyectoId = pPisosR.Id, Nombre = "Porcelanato 60x60 + instalación", Categoria = "Acabados", PresupuestoEstimado = 920_000m },
                new() { ProyectoId = pPisosR.Id, Nombre = "Autonivelante y adhesivos", Categoria = "Materiales", PresupuestoEstimado = 180_000m },
                new() { ProyectoId = pPisosR.Id, Nombre = "Zócalos y limpieza", Categoria = "Acabados", PresupuestoEstimado = 150_000m },
            };
            db.PresupuestoPartidas.AddRange(partidasPisos);
            await db.SaveChangesAsync();

            db.AvancesObra.AddRange(
                new AvanceObra { ProyectoId = pPisosR.Id, ConstructorId = pmMain.Id, Titulo = "Demolición y autonivelante listo", PorcentajeAvance = 35, Descripcion = "Demolición del vinil existente completada. Autonivelante aplicado en todas las áreas. Superficie perfectamente plana. Iniciamos colocación de porcelanato sala mañana.", Fecha = now.AddDays(-28) },
                new AvanceObra { ProyectoId = pPisosR.Id, ConstructorId = pmMain.Id, Titulo = "Sala y comedor al 100%", PorcentajeAvance = 77, Descripcion = "Porcelanato colocado en sala (30m²) y comedor (20m²). Zócalos instalados en ambos cuartos. Pendiente: pasillo 15m² y limpieza final.", Fecha = now.AddDays(-23) },
                new AvanceObra { ProyectoId = pPisosR.Id, ConstructorId = pmMain.Id, Titulo = "Proyecto completado — Entrega a satisfacción", PorcentajeAvance = 100, Descripcion = "Instalación de porcelanato completada en las 65m². Pasillo terminado, zócalos en todo el perímetro, limpieza general. Entregado dentro del plazo acordado.", Fecha = now.AddDays(-16) }
            );
            await db.SaveChangesAsync();

            // Factura pisos (MOC-2026-0001) — con descuento por cliente recurrente
            var factPisos = new Factura
            {
                ProyectoId = pPisosR.Id, PropuestaId = propPisos.Id, ConstructorId = pmMain.Id,
                Numero = "MOC-2026-0001", Concepto = "Instalación porcelanato 60x60 — Sala, comedor y pasillo Escazú",
                LineasJson = Lineas(
                    ("Demolición piso vinil existente y retiro de escombros (65m²)", 65, 3_538m),
                    ("Porcelanato 60x60 importado (72 cajas — 65m² + 10% desperdicio)", 72, 12_500m),
                    ("Autonivelante 25kg × 5 sacos + pega Bondex especial", 5, 32_500m),
                    ("Mano de obra especializada (10 días hábiles)", 10, 52_000m),
                    ("Zócalos a juego + instalación perimetral", 1, 115_000m)
                ),
                MontoTotal    = 1_450_000m, MontoPagado = 1_450_000m, Estado = EstadoFactura.Pagada,
                AplicaIVA     = false, MontoIVA = 0, MontoDescuento = 50_000m,
                FechaEmision  = now.AddDays(-16), FechaVencimiento = now.AddDays(-13),
                Notas         = "Descuento especial ₡50.000 aplicado por ser cliente recurrente de Maestro Obras CR. Gracias por su confianza.",
                FechaEnvioChat = now.AddDays(-16),
            };
            db.Facturas.Add(factPisos);
            await db.SaveChangesAsync();

            db.PagosFactura.Add(
                new PagoFactura { FacturaId = factPisos.Id, Monto = 1_450_000m, Fecha = now.AddDays(-15), MetodoPago = MetodoPago.SINPE, Referencia = "SINPE ref: PISOS-ANA-MOC001", Notas = "Pago total contra entrega satisfactoria." }
            );
            await db.SaveChangesAsync();

            // Calificación Ana → Maestro
            db.Calificaciones.Add(new Calificacion
            {
                ProyectoId = pPisosR.Id, PropuestaId = propPisos.Id,
                EvaluadorId = uAna.Id, EvaluadoId = maestroId, Puntuacion = 5,
                Comentario = "Excelente trabajo de Maestro Obras. El equipo llegó puntual todos los días, mantuvieron el espacio limpio y el resultado final superó mis expectativas. El porcelanato quedó perfectamente nivelado y los acabados son impecables. El descuento que me dieron fue muy amable de su parte. 100% recomendados.",
                Fecha = now.AddDays(-13),
            });

            // Actualizar CalificacionPromedio y TotalProyectos
            pmMain.TotalProyectos += 1;
            db.PerfilesConstructor.Update(pmMain);
            pvMain.TotalProyectos += 1; // baño Laura
            db.PerfilesConstructor.Update(pvMain);
            await db.SaveChangesAsync();

            // Mensajes pisos
            db.Mensajes.AddRange(
                new Mensaje { ProyectoId = pPisosR.Id, PropuestaId = propPisos.Id, Canal = "Cliente", RemitenteId = uAna.Id, DestinatarioId = maestroId, Contenido = "Hola, ¿a qué hora empiezan mañana? Necesito estar en casa para abrirles la puerta.", Leido = true, FechaEnvio = now.AddDays(-32) },
                new Mensaje { ProyectoId = pPisosR.Id, PropuestaId = propPisos.Id, Canal = "Cliente", RemitenteId = maestroId, DestinatarioId = uAna.Id, Contenido = "Buenos días Ana! Llegamos a las 7:30am con el equipo completo. Necesitamos acceso al área de trabajo y a una toma de corriente. ¿Hay problema?", Leido = true, FechaEnvio = now.AddDays(-32) },
                new Mensaje { ProyectoId = pPisosR.Id, PropuestaId = propPisos.Id, Canal = "General", RemitenteId = maestroId, DestinatarioId = uAna.Id, Contenido = "Le compartimos que el porcelanato de sala y comedor quedó instalado al 100% hoy. El fragüe seca mañana. Pasado empezamos el pasillo, estimamos terminar el jueves.", Leido = true, FechaEnvio = now.AddDays(-23) },
                new Mensaje { ProyectoId = pPisosR.Id, PropuestaId = propPisos.Id, Canal = "General", RemitenteId = uAna.Id, DestinatarioId = maestroId, Contenido = "Quedó hermoso! Muchas gracias. Ya les pasé el pago por SINPE. Los recomendé con mis vecinos, espero trabajar con ustedes de nuevo.", Leido = true, FechaEnvio = now.AddDays(-15) }
            );
            await db.SaveChangesAsync();

            // ── 8f. Mensajes para la cocina de María (propuesta Vargas Enviada) ──
            var pCocinaR   = todosP.First(p => p.AreaM2 == 18m && p.TipoProyecto == TipoProyecto.Remodelacion);
            var propCocinaV = await db.Propuestas.FirstOrDefaultAsync(p => p.ProyectoId == pCocinaR.Id && p.ConstructorId == pvMain.Id);
            if (propCocinaV is not null)
            {
                db.Mensajes.AddRange(
                    new Mensaje { ProyectoId = pCocinaR.Id, PropuestaId = propCocinaV.Id, Canal = "Cliente", RemitenteId = uMaria.Id, DestinatarioId = vargasId, Contenido = "Hola, vi su perfil y tienen muy buenas referencias. Una consulta: ¿el precio incluye materiales o es solo mano de obra para la remodelación de la cocina?", Leido = true, FechaEnvio = now.AddDays(-6) },
                    new Mensaje { ProyectoId = pCocinaR.Id, PropuestaId = propCocinaV.Id, Canal = "Cliente", RemitenteId = vargasId, DestinatarioId = uMaria.Id, Contenido = "Hola María, buenos días. Incluimos mano de obra y dirección técnica; los materiales se cotizan aparte según lo que elija. ¿Le parece si coordinamos una visita para tomar medidas y hacerle una propuesta detallada?", Leido = false, FechaEnvio = now.AddDays(-5) }
                );
                await db.SaveChangesAsync();
            }

            logger.LogInformation("✅ Datos completos (empleados, cartas, avances, facturas, mensajes, calificaciones) creados correctamente.");
        }

        // ── 9. Cronograma — fases y tareas (independiente del bloque Empleados) ──
        if (!await db.FasesProyecto.AnyAsync())
        {
            var todosProyectos = await db.Proyectos.ToListAsync();
            var pBanioSeed    = todosProyectos.FirstOrDefault(p => p.AreaM2 == 8m && p.TipoProyecto == TipoProyecto.Remodelacion);
            var pPinturaSeed  = todosProyectos.FirstOrDefault(p => p.TipoProyecto == TipoProyecto.Pintura);
            var pElecSeed     = todosProyectos.FirstOrDefault(p => p.TipoProyecto == TipoProyecto.ElectricoPlomeria);

            if (pBanioSeed is not null)
            {
                var fBanio = new[]
                {
                    new FaseProyecto { ProyectoId = pBanioSeed.Id, Nombre = "Demolición y preparación",   Descripcion = "Retiro de cerámica vieja, artefactos sanitarios y tuberías obsoletas.", FechaInicio = now.AddDays(-65), FechaFin = now.AddDays(-61), Estado = EstadoFase.Completada, PorcentajeCompletado = 100, Orden = 1, Color = "#EF4444", FechaCreacion = now.AddDays(-70), FechaActualizacion = now.AddDays(-61) },
                    new FaseProyecto { ProyectoId = pBanioSeed.Id, Nombre = "Porcelanato e instalaciones", Descripcion = "Porcelanato italiano 30×60, tuberías nuevas y artefactos Kohler.",   FechaInicio = now.AddDays(-60), FechaFin = now.AddDays(-48), Estado = EstadoFase.Completada, PorcentajeCompletado = 100, Orden = 2, Color = "#10B981", FechaCreacion = now.AddDays(-70), FechaActualizacion = now.AddDays(-48) },
                    new FaseProyecto { ProyectoId = pBanioSeed.Id, Nombre = "Carpintería y acabados",     Descripcion = "Mueble vanitory 80cm con mesón cuarzo, espejo LED y pintura de techo.", FechaInicio = now.AddDays(-47), FechaFin = now.AddDays(-40), Estado = EstadoFase.Completada, PorcentajeCompletado = 100, Orden = 3, Color = "#8B5CF6", FechaCreacion = now.AddDays(-70), FechaActualizacion = now.AddDays(-40) },
                };
                db.FasesProyecto.AddRange(fBanio);
                await db.SaveChangesAsync();

                db.TareasFase.AddRange(
                    new TareaFase { FaseId = fBanio[0].Id, Nombre = "Desmontar artefactos sanitarios",   Completada = true, Estado = EstadoFase.Completada, Orden = 1 },
                    new TareaFase { FaseId = fBanio[0].Id, Nombre = "Picar cerámica de piso y paredes",  Completada = true, Estado = EstadoFase.Completada, Orden = 2 },
                    new TareaFase { FaseId = fBanio[0].Id, Nombre = "Retiro de escombros",               Completada = true, Estado = EstadoFase.Completada, Orden = 3 },
                    new TareaFase { FaseId = fBanio[1].Id, Nombre = "Instalar tuberías nuevas",          Completada = true, Estado = EstadoFase.Completada, Orden = 1 },
                    new TareaFase { FaseId = fBanio[1].Id, Nombre = "Colocar porcelanato piso",          Completada = true, Estado = EstadoFase.Completada, Orden = 2 },
                    new TareaFase { FaseId = fBanio[1].Id, Nombre = "Colocar porcelanato paredes",       Completada = true, Estado = EstadoFase.Completada, Orden = 3 },
                    new TareaFase { FaseId = fBanio[1].Id, Nombre = "Instalar artefactos Kohler",        Completada = true, Estado = EstadoFase.Completada, Orden = 4 },
                    new TareaFase { FaseId = fBanio[2].Id, Nombre = "Fabricar e instalar vanitory",      Completada = true, Estado = EstadoFase.Completada, Orden = 1 },
                    new TareaFase { FaseId = fBanio[2].Id, Nombre = "Colocar espejo LED",                Completada = true, Estado = EstadoFase.Completada, Orden = 2 },
                    new TareaFase { FaseId = fBanio[2].Id, Nombre = "Pintura de techo y limpieza final", Completada = true, Estado = EstadoFase.Completada, Orden = 3 }
                );
                await db.SaveChangesAsync();
            }

            if (pPinturaSeed is not null)
            {
                var fPintura = new[]
                {
                    new FaseProyecto { ProyectoId = pPinturaSeed.Id, Nombre = "Preparación de superficies", Descripcion = "Lijado, empaste de grietas y sellado de paredes externas.", FechaInicio = now.AddDays(-14), FechaFin = now.AddDays(-7), Estado = EstadoFase.Completada, PorcentajeCompletado = 100, Orden = 1, Color = "#F59E0B", FechaCreacion = now.AddDays(-16), FechaActualizacion = now.AddDays(-7) },
                    new FaseProyecto { ProyectoId = pPinturaSeed.Id, Nombre = "Aplicación capa base",       Descripcion = "Primera capa de sellador y fondo blanco en todo el perímetro.", FechaInicio = now.AddDays(-6),  FechaFin = now.AddDays(0),  Estado = EstadoFase.EnProgreso, PorcentajeCompletado = 65,  Orden = 2, Color = "#2563EB", FechaCreacion = now.AddDays(-16), FechaActualizacion = now.AddDays(-1) },
                    new FaseProyecto { ProyectoId = pPinturaSeed.Id, Nombre = "Pintura final y detalles",   Descripcion = "Dos manos de pintura exterior y acabados en marcos y cornisas.",  FechaInicio = now.AddDays(1),   FechaFin = now.AddDays(8),  Estado = EstadoFase.Pendiente,  PorcentajeCompletado = 0,   Orden = 3, Color = "#10B981", FechaCreacion = now.AddDays(-16), FechaActualizacion = now.AddDays(-16) },
                };
                db.FasesProyecto.AddRange(fPintura);
                await db.SaveChangesAsync();

                db.TareasFase.AddRange(
                    new TareaFase { FaseId = fPintura[0].Id, Nombre = "Lijar paredes frontales",        Completada = true,  Estado = EstadoFase.Completada, Orden = 1 },
                    new TareaFase { FaseId = fPintura[0].Id, Nombre = "Empastar grietas y fisuras",     Completada = true,  Estado = EstadoFase.Completada, Orden = 2 },
                    new TareaFase { FaseId = fPintura[0].Id, Nombre = "Lijar paredes laterales",        Completada = true,  Estado = EstadoFase.Completada, Orden = 3 },
                    new TareaFase { FaseId = fPintura[1].Id, Nombre = "Aplicar sellador frentes",       Completada = true,  Estado = EstadoFase.Completada, Orden = 1 },
                    new TareaFase { FaseId = fPintura[1].Id, Nombre = "Primera mano base laterales",    Completada = true,  Estado = EstadoFase.Completada, Orden = 2 },
                    new TareaFase { FaseId = fPintura[1].Id, Nombre = "Segunda mano base laterales",    Completada = false, Estado = EstadoFase.Pendiente,  Orden = 3 }
                );
                await db.SaveChangesAsync();
            }

            if (pElecSeed is not null)
            {
                var fElectrico = new[]
                {
                    new FaseProyecto { ProyectoId = pElecSeed.Id, Nombre = "Diseño y canalización",       Descripcion = "Plano eléctrico AS-BUILT y canaleta empotrada en paredes.", FechaInicio = now.AddDays(-21), FechaFin = now.AddDays(-14), Estado = EstadoFase.Completada, PorcentajeCompletado = 100, Orden = 1, Color = "#06B6D4", FechaCreacion = now.AddDays(-25), FechaActualizacion = now.AddDays(-14) },
                    new FaseProyecto { ProyectoId = pElecSeed.Id, Nombre = "Cableado y tablero",           Descripcion = "Tendido de cable AWG, instalación de tablero y breakers.",    FechaInicio = now.AddDays(-13), FechaFin = now.AddDays(3),   Estado = EstadoFase.EnProgreso, PorcentajeCompletado = 45,  Orden = 2, Color = "#F59E0B", FechaCreacion = now.AddDays(-25), FechaActualizacion = now.AddDays(-2) },
                    new FaseProyecto { ProyectoId = pElecSeed.Id, Nombre = "Pruebas y certificación CFIA", Descripcion = "Inspección técnica, pruebas de aislamiento y sellado CFIA.",   FechaInicio = now.AddDays(4),   FechaFin = now.AddDays(14),  Estado = EstadoFase.Pendiente,  PorcentajeCompletado = 0,   Orden = 3, Color = "#10B981", FechaCreacion = now.AddDays(-25), FechaActualizacion = now.AddDays(-25) },
                };
                db.FasesProyecto.AddRange(fElectrico);
                await db.SaveChangesAsync();

                db.TareasFase.AddRange(
                    new TareaFase { FaseId = fElectrico[0].Id, Nombre = "Elaborar plano AS-BUILT",      Completada = true,  Estado = EstadoFase.Completada, Orden = 1 },
                    new TareaFase { FaseId = fElectrico[0].Id, Nombre = "Picar y canalizar paredes",    Completada = true,  Estado = EstadoFase.Completada, Orden = 2 },
                    new TareaFase { FaseId = fElectrico[1].Id, Nombre = "Tender cable AWG dormitorios", Completada = true,  Estado = EstadoFase.Completada, Orden = 1 },
                    new TareaFase { FaseId = fElectrico[1].Id, Nombre = "Tender cable cocina y sala",   Completada = false, Estado = EstadoFase.Pendiente,  Orden = 2 },
                    new TareaFase { FaseId = fElectrico[1].Id, Nombre = "Instalar tablero y breakers",  Completada = false, Estado = EstadoFase.Pendiente,  Orden = 3 }
                );
                await db.SaveChangesAsync();
            }

            logger.LogInformation("✅ FasesProyecto y TareasFase sembradas correctamente.");
        }

        // ── 10. Notificaciones de demo ─────────────────────────────────────────
        if (!await db.Notificaciones.AnyAsync())
        {
            var nMaria  = await db.Users.FirstOrDefaultAsync(u => u.Email == "cliente@construapp.com");
            var nConst  = await db.Users.FirstOrDefaultAsync(u => u.Email == "constructor@construapp.com");
            var nCocina = await db.Proyectos.FirstOrDefaultAsync(p => p.Titulo!.Contains("cocina"));
            var nElect  = await db.Proyectos.FirstOrDefaultAsync(p => p.Titulo!.Contains("eléctrica"));

            var notifs = new List<Notificacion>();
            var t = DateTime.UtcNow;

            if (nMaria != null)
            {
                notifs.AddRange(new[]
                {
                    new Notificacion { UsuarioId = nMaria.Id, Tipo = "nueva_propuesta",    Titulo = "Nueva propuesta recibida",       Mensaje = "Constructor #1 envió una propuesta para tu proyecto de cocina por ₡2,980,000.",          UrlDestino = nCocina != null ? $"/propuestas/{nCocina.Id}" : "/mis-proyectos", ProyectoId = nCocina?.Id, FechaCreacion = t.AddHours(-1),  Leida = false },
                    new Notificacion { UsuarioId = nMaria.Id, Tipo = "nueva_propuesta",    Titulo = "Nueva propuesta recibida",       Mensaje = "Constructor #3 envió una propuesta para tu proyecto de cocina por ₡2,820,000.",          UrlDestino = nCocina != null ? $"/propuestas/{nCocina.Id}" : "/mis-proyectos", ProyectoId = nCocina?.Id, FechaCreacion = t.AddHours(-2),  Leida = false },
                    new Notificacion { UsuarioId = nMaria.Id, Tipo = "fase_completada",    Titulo = "Fase completada",                Mensaje = "La fase 'Diseño y canalización' del proyecto eléctrico fue marcada como completada.",     UrlDestino = "/cronograma",                                                      ProyectoId = nElect?.Id,  FechaCreacion = t.AddHours(-5),  Leida = false },
                    new Notificacion { UsuarioId = nMaria.Id, Tipo = "pago_recibido",      Titulo = "Pago registrado",                Mensaje = "Se registró un pago de ₡540,000 para la factura TBC-2026-0001.",                         UrlDestino = "/facturacion",                                                     ProyectoId = nElect?.Id,  FechaCreacion = t.AddDays(-1),   Leida = false },
                    new Notificacion { UsuarioId = nMaria.Id, Tipo = "avance_registrado",  Titulo = "Nuevo avance de obra",           Mensaje = "El constructor registró un avance del 35% en la instalación eléctrica.",                 UrlDestino = nElect != null ? $"/obra/{nElect.Id}" : "/",                        ProyectoId = nElect?.Id,  FechaCreacion = t.AddDays(-2),   Leida = true  },
                    new Notificacion { UsuarioId = nMaria.Id, Tipo = "factura_enviada",    Titulo = "Factura enviada",                Mensaje = "La factura TBC-2026-0001 por ₡540,000 fue enviada para revisión.",                       UrlDestino = "/facturacion",                                                     ProyectoId = nElect?.Id,  FechaCreacion = t.AddDays(-3),   Leida = true  },
                    new Notificacion { UsuarioId = nMaria.Id, Tipo = "proyecto_asignado",  Titulo = "Constructor asignado",           Mensaje = "Constructora Vargas S.A. fue asignada a tu proyecto de instalación eléctrica.",           UrlDestino = nElect != null ? $"/obra/{nElect.Id}" : "/",                        ProyectoId = nElect?.Id,  FechaCreacion = t.AddDays(-14),  Leida = true  },
                });
            }

            if (nConst != null)
            {
                notifs.AddRange(new[]
                {
                    new Notificacion { UsuarioId = nConst.Id, Tipo = "proyecto_creado",    Titulo = "Nuevo proyecto disponible",      Mensaje = "María González publicó un proyecto de remodelación de cocina. ¡Enviá tu propuesta!",    UrlDestino = "/marketplace",                                                     ProyectoId = nCocina?.Id, FechaCreacion = t.AddHours(-3),  Leida = false },
                    new Notificacion { UsuarioId = nConst.Id, Tipo = "propuesta_aceptada", Titulo = "¡Tu propuesta fue aceptada!",    Mensaje = "María González aceptó tu propuesta para la instalación eléctrica. ¡Podés iniciar obras!", UrlDestino = nElect != null ? $"/obra/{nElect.Id}" : "/mis-clientes",          ProyectoId = nElect?.Id,  FechaCreacion = t.AddDays(-14),  Leida = true  },
                    new Notificacion { UsuarioId = nConst.Id, Tipo = "nuevo_mensaje",      Titulo = "Nuevo mensaje",                  Mensaje = "María González te envió un mensaje sobre el proyecto eléctrico.",                        UrlDestino = "/",                                                                ProyectoId = nElect?.Id,  FechaCreacion = t.AddDays(-1),   Leida = false },
                    new Notificacion { UsuarioId = nConst.Id, Tipo = "fase_atrasada",      Titulo = "Fase con atraso detectado",      Mensaje = "La fase 'Pruebas y certificación CFIA' está próxima a vencer sin completarse.",          UrlDestino = "/cronograma",                                                      ProyectoId = nElect?.Id,  FechaCreacion = t.AddHours(-6),  Leida = false },
                    new Notificacion { UsuarioId = nConst.Id, Tipo = "factura_creada",     Titulo = "Factura creada",                 Mensaje = "La factura TBC-2026-0001 por ₡540,000 fue generada exitosamente.",                       UrlDestino = "/facturacion",                                                     ProyectoId = nElect?.Id,  FechaCreacion = t.AddDays(-3),   Leida = true  },
                });
            }

            if (notifs.Count > 0)
            {
                db.Notificaciones.AddRange(notifs);
                await db.SaveChangesAsync();
                logger.LogInformation("✅ {Count} Notificaciones sembradas.", notifs.Count);
            }
        }

        // ── 11. Datos Demo para usuarios de prueba ────────────────────────────
        if (uTestClient is not null && uTestCons is not null && uTestMaria is not null && uTestCarlos is not null &&
            !await db.Proyectos.AnyAsync(p => p.Titulo == "Remodelación de cocina y comedor — Escazú"))
        {
            var pConst  = await db.PerfilesConstructor.FirstOrDefaultAsync(p => p.UsuarioId == uTestCons.Id);
            var pCarlos = await db.PerfilesConstructor.FirstOrDefaultAsync(p => p.UsuarioId == uTestCarlos.Id);

            if (pConst is null || pCarlos is null)
            {
                logger.LogWarning("⚠️ Perfiles demo no encontrados. Salteando sección 11.");
                return;
            }

            // ── Proyectos ───────────────────────────────────────────────────
            var dProj1 = new Proyecto
            {
                Titulo         = "Remodelación de cocina y comedor — Escazú",
                Descripcion    = "Remodelación completa de cocina y comedor: derribo de paredes, pisos de porcelanato 60x60, muebles de cocina en MDF laqueado, mesón de cuarzo, instalaciones eléctricas y plomería nuevas.",
                TipoProyecto   = TipoProyecto.Remodelacion,
                Canton         = "Escazú", Provincia = "San José",
                Estado         = EstadoProyecto.EnCurso,
                PresupuestoMax = 8_000_000m,
                ClienteId      = uTestClient.Id,
                FechaInicio    = now.AddDays(-35),
            };
            var dProj2 = new Proyecto
            {
                Titulo         = "Construcción de tapia perimetral — Heredia",
                Descripcion    = "Construcción de 120 m² de tapia perimetral con bloque de 15 cm, refuerzo de varilla #3 y repello afinado en ambas caras. Incluye pintura anticarbonato.",
                TipoProyecto   = TipoProyecto.ObraGris,
                Canton         = "Heredia", Provincia = "Heredia",
                Estado         = EstadoProyecto.Completado,
                PresupuestoMax = 3_000_000m,
                ClienteId      = uTestClient.Id,
                FechaInicio    = now.AddDays(-80),
                FechaFin       = now.AddDays(-22),
            };
            var dProj3 = new Proyecto
            {
                Titulo         = "Instalación eléctrica residencial — Alajuela",
                Descripcion    = "Instalación eléctrica completa para casa nueva de 180 m²: tablero de 24 circuitos, cableado AWG-12, 32 tomas dobles, 18 puntos de iluminación LED y panel solar preparado.",
                TipoProyecto   = TipoProyecto.ElectricoPlomeria,
                Canton         = "Alajuela", Provincia = "Alajuela",
                Estado         = EstadoProyecto.Publicado,
                PresupuestoMax = 3_200_000m,
                ClienteId      = uTestMaria.Id,
            };
            var dProj4 = new Proyecto
            {
                Titulo         = "Remodelación de baños principales — Santa Ana",
                Descripcion    = "Remodelación de 2 baños: porcelanato en paredes y piso, ducha tipo italiana, muebles de baño suspendidos, plomería nueva y ventilación mecánica.",
                TipoProyecto   = TipoProyecto.Remodelacion,
                Canton         = "Santa Ana", Provincia = "San José",
                Estado         = EstadoProyecto.EnCurso,
                PresupuestoMax = 5_500_000m,
                ClienteId      = uTestMaria.Id,
                FechaInicio    = now.AddDays(-20),
            };
            var dProj5 = new Proyecto
            {
                Titulo         = "Pintura exterior de casa 2 pisos — Cartago",
                Descripcion    = "Pintura exterior completa de residencia de 2 pisos: preparación de superficie, lijado, repello de grietas, 2 manos de sellador y 2 manos de pintura elastomérica premium.",
                TipoProyecto   = TipoProyecto.Pintura,
                Canton         = "Cartago", Provincia = "Cartago",
                Estado         = EstadoProyecto.Publicado,
                PresupuestoMax = 1_200_000m,
                ClienteId      = uTestClient.Id,
            };

            db.Proyectos.AddRange(dProj1, dProj2, dProj3, dProj4, dProj5);
            await db.SaveChangesAsync();
            logger.LogInformation("✅ 5 proyectos demo creados.");

            // ── Propuestas ──────────────────────────────────────────────────
            var dProp1 = new Propuesta
            {
                ProyectoId = dProj1.Id, ConstructorId = pConst.Id,
                MontoTotal = 7_800_000m,
                Descripcion = "Propuesta integral para remodelación de cocina y comedor. Incluye mano de obra, materiales de primera calidad, supervisión técnica y garantía de 12 meses en acabados.",
                Estado = EstadoPropuesta.Aceptada,
                FechaEnvio = now.AddDays(-42), FechaRespuesta = now.AddDays(-38),
            };
            var dProp2 = new Propuesta
            {
                ProyectoId = dProj2.Id, ConstructorId = pConst.Id,
                MontoTotal = 3_000_000m,
                Descripcion = "Construcción de tapia perimetral con materiales de primera calidad. Bloque estándar 15 cm con refuerzo estructural según normativa CFIA.",
                Estado = EstadoPropuesta.Finalizada,
                FechaEnvio = now.AddDays(-88), FechaRespuesta = now.AddDays(-80),
            };
            var dProp3 = new Propuesta
            {
                ProyectoId = dProj3.Id, ConstructorId = pCarlos.Id,
                MontoTotal = 2_600_000m,
                Descripcion = "Instalación eléctrica completa con materiales Condumex certificados. Incluye certificación CFIA y planos AS-BUILT.",
                Estado = EstadoPropuesta.Enviada,
                FechaEnvio = now.AddDays(-4),
            };
            var dProp4 = new Propuesta
            {
                ProyectoId = dProj3.Id, ConstructorId = pConst.Id,
                MontoTotal = 2_900_000m,
                Descripcion = "Instalación eléctrica residencial completa. Mano de obra garantizada, materiales Square D, certificación incluida.",
                Estado = EstadoPropuesta.Enviada,
                FechaEnvio = now.AddDays(-3),
            };
            var dProp5 = new Propuesta
            {
                ProyectoId = dProj4.Id, ConstructorId = pCarlos.Id,
                MontoTotal = 4_800_000m,
                Descripcion = "Remodelación de 2 baños con porcelanato importado, ducha italiana y plomería Grohe. Tiempo estimado: 3 semanas.",
                Estado = EstadoPropuesta.Aceptada,
                FechaEnvio = now.AddDays(-28), FechaRespuesta = now.AddDays(-25),
            };

            db.Propuestas.AddRange(dProp1, dProp2, dProp3, dProp4, dProp5);
            await db.SaveChangesAsync();
            logger.LogInformation("✅ 5 propuestas demo creadas.");

            // ── Avances de obra ─────────────────────────────────────────────
            db.AvancesObra.AddRange(
                // Proyecto 1 — Cocina Escazú (en curso)
                new AvanceObra { ProyectoId = dProj1.Id, ConstructorId = pConst.Id, Titulo = "Demolición y preparación", Descripcion = "Se completó la demolición de paredes no estructurales, retiro de muebles viejos y limpieza del área. Área lista para instalaciones.", Responsable = "Maestro de obras Juan Pérez", PorcentajeAvance = 15, Fecha = now.AddDays(-21) },
                new AvanceObra { ProyectoId = dProj1.Id, ConstructorId = pConst.Id, Titulo = "Instalaciones eléctricas y plomería", Descripcion = "Canalización eléctrica lista, tubería de agua fría/caliente instalada y probada. Se colocaron 8 tomas dobles y 4 puntos de iluminación bajo gabinete.", Responsable = "Maestro de obras Juan Pérez", PorcentajeAvance = 35, Fecha = now.AddDays(-14) },
                new AvanceObra { ProyectoId = dProj1.Id, ConstructorId = pConst.Id, Titulo = "Pisos de porcelanato", Descripcion = "Se colocó el 80% del porcelanato 60x60 gris cemento. Quedan pendientes las esquinas y el comedor. Nivelación perfecta con variación máx de 1mm.", Responsable = "Maestro de obras Juan Pérez", PorcentajeAvance = 60, Fecha = now.AddDays(-7) },
                // Proyecto 2 — Tapia Heredia (completado)
                new AvanceObra { ProyectoId = dProj2.Id, ConstructorId = pConst.Id, Titulo = "Excavación y cimentación", Descripcion = "Trazado y excavación de la línea de tapia completado. Cimientos de concreto ciclópeo al 100%. Total: 120 metros lineales.", Responsable = "Cuadrilla A", PorcentajeAvance = 25, Fecha = now.AddDays(-75) },
                new AvanceObra { ProyectoId = dProj2.Id, ConstructorId = pConst.Id, Titulo = "Levantado de bloques", Descripcion = "Mampostería de bloque 15cm completada al 80%. Refuerzo vertical con varilla #3 cada 60cm. Se requirieron 960 bloques estándar.", Responsable = "Cuadrilla A", PorcentajeAvance = 60, Fecha = now.AddDays(-55) },
                new AvanceObra { ProyectoId = dProj2.Id, ConstructorId = pConst.Id, Titulo = "Obra terminada", Descripcion = "Tapia completamente terminada. Repello afinado en ambas caras, pintura anticarbonato aplicada. Entrega formal al cliente realizada.", Responsable = "Cuadrilla A", PorcentajeAvance = 100, Fecha = now.AddDays(-22) }
            );
            await db.SaveChangesAsync();
            logger.LogInformation("✅ 6 avances demo creados.");

            // ── Cronograma Proyecto 1 ────────────────────────────────────────
            var dFase1 = new FaseProyecto { ProyectoId = dProj1.Id, Nombre = "Demolición y preparación",     Descripcion = "Derribo de paredes no estructurales, retiro de muebles viejos y escombros.",            FechaInicio = now.AddDays(-35), FechaFin = now.AddDays(-28), Estado = EstadoFase.Completada, PorcentajeCompletado = 100, Orden = 1, Color = "#6366F1", FechaCreacion = now.AddDays(-40), FechaActualizacion = now.AddDays(-28) };
            var dFase2 = new FaseProyecto { ProyectoId = dProj1.Id, Nombre = "Instalaciones (agua y eléctrica)", Descripcion = "Canalización eléctrica y tubería de plomería para la nueva distribución.",             FechaInicio = now.AddDays(-27), FechaFin = now.AddDays(-18), Estado = EstadoFase.Completada, PorcentajeCompletado = 100, Orden = 2, Color = "#06B6D4", FechaCreacion = now.AddDays(-40), FechaActualizacion = now.AddDays(-18) };
            var dFase3 = new FaseProyecto { ProyectoId = dProj1.Id, Nombre = "Pisos y cerámica",             Descripcion = "Colocación de porcelanato 60x60 en cocina y comedor con nivelación de precisión.",       FechaInicio = now.AddDays(-17), FechaFin = now.AddDays(-3),  Estado = EstadoFase.EnProgreso, PorcentajeCompletado = 70,  Orden = 3, Color = "#F59E0B", FechaCreacion = now.AddDays(-40), FechaActualizacion = now.AddDays(-4) };
            var dFase4 = new FaseProyecto { ProyectoId = dProj1.Id, Nombre = "Muebles de cocina",            Descripcion = "Instalación de muebles en MDF laqueado blanco, bisagras soft-close y mesón de cuarzo.", FechaInicio = now.AddDays(-2),  FechaFin = now.AddDays(8),   Estado = EstadoFase.Pendiente,  PorcentajeCompletado = 0,   Orden = 4, Color = "#10B981", FechaCreacion = now.AddDays(-40), FechaActualizacion = now.AddDays(-40) };
            var dFase5 = new FaseProyecto { ProyectoId = dProj1.Id, Nombre = "Acabados y limpieza final",    Descripcion = "Pintura de paredes, sellado de juntas, limpieza profunda y entrega formal del proyecto.", FechaInicio = now.AddDays(9),   FechaFin = now.AddDays(14),  Estado = EstadoFase.Pendiente,  PorcentajeCompletado = 0,   Orden = 5, Color = "#EC4899", FechaCreacion = now.AddDays(-40), FechaActualizacion = now.AddDays(-40) };

            db.FasesProyecto.AddRange(dFase1, dFase2, dFase3, dFase4, dFase5);
            await db.SaveChangesAsync();

            db.TareasFase.AddRange(
                new TareaFase { FaseId = dFase1.Id, Nombre = "Derribo de paredes",               Completada = true,  Estado = EstadoFase.Completada, Orden = 1 },
                new TareaFase { FaseId = dFase1.Id, Nombre = "Retiro de muebles y escombros",     Completada = true,  Estado = EstadoFase.Completada, Orden = 2 },
                new TareaFase { FaseId = dFase2.Id, Nombre = "Canalización eléctrica",            Completada = true,  Estado = EstadoFase.Completada, Orden = 1 },
                new TareaFase { FaseId = dFase2.Id, Nombre = "Tubería de agua fría y caliente",   Completada = true,  Estado = EstadoFase.Completada, Orden = 2 },
                new TareaFase { FaseId = dFase3.Id, Nombre = "Colocación de porcelanato cocina",  Completada = true,  Estado = EstadoFase.Completada, Orden = 1 },
                new TareaFase { FaseId = dFase3.Id, Nombre = "Colocación de porcelanato comedor", Completada = false, Estado = EstadoFase.Pendiente,  Orden = 2 },
                new TareaFase { FaseId = dFase4.Id, Nombre = "Instalación muebles inferiores",    Completada = false, Estado = EstadoFase.Pendiente,  Orden = 1 },
                new TareaFase { FaseId = dFase4.Id, Nombre = "Instalación muebles superiores",    Completada = false, Estado = EstadoFase.Pendiente,  Orden = 2 },
                new TareaFase { FaseId = dFase4.Id, Nombre = "Colocación de mesón de cuarzo",     Completada = false, Estado = EstadoFase.Pendiente,  Orden = 3 }
            );
            await db.SaveChangesAsync();
            logger.LogInformation("✅ Cronograma demo creado (5 fases, 9 tareas).");

            // ── Facturas ────────────────────────────────────────────────────
            var dFac1 = new Factura
            {
                ProyectoId = dProj1.Id, ConstructorId = pConst.Id, PropuestaId = dProp1.Id,
                Numero = "OCA-DEMO-0001", Concepto = "Anticipo 50% — Remodelación cocina y comedor",
                LineasJson = Lineas(("Anticipo 50% del contrato — Remodelación cocina y comedor Escazú", 1, 3_451_327m)),
                MontoTotal = 3_900_000m, MontoPagado = 3_900_000m, MontoIVA = 448_673m,
                Estado = EstadoFactura.Pagada,
                FechaEmision = now.AddDays(-38), FechaVencimiento = now.AddDays(-23),
                Notas = "Pago de anticipo correspondiente al 50% del contrato. Saldo pendiente se cancela al terminar la obra.",
            };
            var dFac2 = new Factura
            {
                ProyectoId = dProj1.Id, ConstructorId = pConst.Id, PropuestaId = dProp1.Id,
                Numero = "OCA-DEMO-0002", Concepto = "Saldo 50% contra entrega — Remodelación cocina y comedor",
                LineasJson = Lineas(("Saldo final 50% del contrato — Remodelación cocina y comedor Escazú", 1, 3_451_327m)),
                MontoTotal = 3_900_000m, MontoPagado = 0m, MontoIVA = 448_673m,
                Estado = EstadoFactura.Enviada,
                FechaEmision = now.AddDays(-3), FechaVencimiento = now.AddDays(12),
                Notas = "Factura de saldo final. Pagadero a contra entrega satisfactoria del proyecto.",
            };
            var dFac3 = new Factura
            {
                ProyectoId = dProj2.Id, ConstructorId = pConst.Id, PropuestaId = dProp2.Id,
                Numero = "OCA-DEMO-0003", Concepto = "Liquidación final — Tapia perimetral Heredia",
                LineasJson = Lineas(
                    ("Mampostería de bloque 15cm — 120 m²", 120, 14_159m),
                    ("Repello afinado ambas caras — 240 m²", 240, 3_540m),
                    ("Pintura anticarbonato — 2 manos", 240, 1_770m)
                ),
                MontoTotal = 3_000_000m, MontoPagado = 3_000_000m, MontoIVA = 345_133m,
                Estado = EstadoFactura.Pagada,
                FechaEmision = now.AddDays(-23), FechaVencimiento = now.AddDays(-8),
                Notas = "Proyecto completado satisfactoriamente. Garantía de 5 años en estructura.",
            };
            var dFac4 = new Factura
            {
                ProyectoId = dProj4.Id, ConstructorId = pCarlos.Id, PropuestaId = dProp5.Id,
                Numero = "TBC-DEMO-0001", Concepto = "Anticipo 50% — Remodelación baños principales Santa Ana",
                LineasJson = Lineas(("Anticipo 50% del contrato — Remodelación 2 baños Santa Ana", 1, 2_123_894m)),
                MontoTotal = 2_400_000m, MontoPagado = 2_400_000m, MontoIVA = 276_106m,
                Estado = EstadoFactura.Pagada,
                FechaEmision = now.AddDays(-24), FechaVencimiento = now.AddDays(-9),
                Notas = "Anticipo para inicio de trabajos. Incluye adquisición de materiales importados.",
            };

            db.Facturas.AddRange(dFac1, dFac2, dFac3, dFac4);
            await db.SaveChangesAsync();
            logger.LogInformation("✅ 4 facturas demo creadas.");

            // ── Pagos ───────────────────────────────────────────────────────
            db.PagosFactura.AddRange(
                new PagoFactura { FacturaId = dFac1.Id, Monto = 3_900_000m, MetodoPago = MetodoPago.SINPE,         Fecha = now.AddDays(-35), Referencia = "SINPE-88012345",    Notas = "Anticipo recibido por SINPE Móvil. Confirmado." },
                new PagoFactura { FacturaId = dFac3.Id, Monto = 3_000_000m, MetodoPago = MetodoPago.Transferencia, Fecha = now.AddDays(-20), Referencia = "BCR-TRF-20260716",  Notas = "Pago final proyecto tapia. Transferencia BCR." },
                new PagoFactura { FacturaId = dFac4.Id, Monto = 2_400_000m, MetodoPago = MetodoPago.SINPE,         Fecha = now.AddDays(-21), Referencia = "SINPE-88345678",    Notas = "Anticipo baños. SINPE confirmado." }
            );
            await db.SaveChangesAsync();
            logger.LogInformation("✅ 3 pagos demo creados.");

            // ── Mensajes (canal general proyecto 1) ─────────────────────────
            db.Mensajes.AddRange(
                new Mensaje { ProyectoId = dProj1.Id, PropuestaId = dProp1.Id, Canal = "General", RemitenteId = uTestClient.Id, DestinatarioId = uTestCons.Id, Contenido = "Buenas tardes. ¿Cuándo estiman empezar con los pisos del comedor?",                                              Leido = true,  FechaEnvio = now.AddDays(-8) },
                new Mensaje { ProyectoId = dProj1.Id, PropuestaId = dProp1.Id, Canal = "General", RemitenteId = uTestCons.Id,   DestinatarioId = uTestClient.Id, Contenido = "Buenas Diego! Empezamos mañana a las 8am, ya tenemos el porcelanato en bodega.",                             Leido = true,  FechaEnvio = now.AddDays(-8).AddHours(1) },
                new Mensaje { ProyectoId = dProj1.Id, PropuestaId = dProp1.Id, Canal = "General", RemitenteId = uTestClient.Id, DestinatarioId = uTestCons.Id, Contenido = "Perfecto, muchas gracias. ¿Calculan terminarlo esta semana?",                                                  Leido = true,  FechaEnvio = now.AddDays(-8).AddHours(2) },
                new Mensaje { ProyectoId = dProj1.Id, PropuestaId = dProp1.Id, Canal = "General", RemitenteId = uTestCons.Id,   DestinatarioId = uTestClient.Id, Contenido = "Sí, estimamos terminar el viernes. Les enviamos el reporte de avance esta tarde con fotos del progreso.", Leido = false, FechaEnvio = now.AddDays(-8).AddHours(3) }
            );
            await db.SaveChangesAsync();
            logger.LogInformation("✅ 4 mensajes demo creados.");

            // ── Calificación ────────────────────────────────────────────────
            db.Calificaciones.Add(new Calificacion
            {
                ProyectoId  = dProj2.Id, PropuestaId = dProp2.Id,
                EvaluadorId = uTestClient.Id,
                EvaluadoId  = uTestCons.Id,
                Puntuacion  = 5,
                Comentario  = "Excelente trabajo en la tapia. Muy profesionales, cumplieron los plazos y dejaron todo limpio. Los recomiendo ampliamente.",
                Fecha       = now.AddDays(-19),
            });
            await db.SaveChangesAsync();
            logger.LogInformation("✅ Calificación demo creada.");

            // ── Notificaciones para Diego (cliente@test.com) ─────────────────
            db.Notificaciones.AddRange(
                new Notificacion { UsuarioId = uTestClient.Id, Tipo = "propuesta_aceptada", Titulo = "Propuesta aceptada",     Mensaje = "Obras Centroamérica S.A. fue asignada a tu proyecto 'Remodelación de cocina y comedor — Escazú'.", UrlDestino = $"/obra/{dProj1.Id}",  ProyectoId = dProj1.Id, FechaCreacion = now.AddDays(-38), Leida = true  },
                new Notificacion { UsuarioId = uTestClient.Id, Tipo = "factura_enviada",    Titulo = "Nueva factura recibida", Mensaje = "Obras Centroamérica S.A. envió la factura OCA-DEMO-0002 por ₡3,900,000 pendiente de pago.",          UrlDestino = "/facturacion",         ProyectoId = dProj1.Id, FechaCreacion = now.AddDays(-3),  Leida = false },
                new Notificacion { UsuarioId = uTestClient.Id, Tipo = "nuevo_avance",       Titulo = "Avance del 60% en cocina", Mensaje = "Se registró un avance del 60% en tu proyecto de cocina. ¡Ya vas por más de la mitad!",              UrlDestino = $"/obra/{dProj1.Id}",  ProyectoId = dProj1.Id, FechaCreacion = now.AddDays(-7),  Leida = false }
            );
            await db.SaveChangesAsync();
            logger.LogInformation("✅ 3 notificaciones demo creadas.");

            logger.LogInformation("✅ Sección 11 — Datos demo para usuarios de prueba completada.");
        }
    }
}

using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ConstruApp.API.Controllers;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Infrastructure.Data;
using ConstruApp.Infrastructure.Repositories;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace ConstruApp.Tests.Unit;

public sealed class Sprint3IntegracionTests
{
    [Fact]
    public void HuellaConservaValidacionAlRecargarDecimalesYFechasDeSql()
    {
        var p = new Proyecto { AreaM2 = 15m, PresupuestoMax = 150000m,
            FechaInicio = new DateTime(2026, 11, 9, 0, 0, 0, DateTimeKind.Utc) };
        var huella = ValidacionProyectoEstado.Huella(p);
        p.AreaM2 = 15.00m;
        p.PresupuestoMax = 150000.00m;
        p.FechaInicio = DateTime.SpecifyKind(p.FechaInicio.Value, DateTimeKind.Unspecified);
        Assert.Equal(huella, ValidacionProyectoEstado.Huella(p));
        p.AreaM2 = 16m;
        Assert.NotEqual(huella, ValidacionProyectoEstado.Huella(p));
    }

    [Fact]
    public async Task DocumentosGuardanContenidoConPermisosYRechazanArchivosInvalidos()
    {
        using var f = new Fixture();
        var root = Path.Combine(Path.GetTempPath(), "construapp-docs-" + Guid.NewGuid().ToString("N"));
        var env = new Mock<IWebHostEnvironment>();
        env.SetupGet(e => e.ContentRootPath).Returns(root);
        var controller = new DocumentosController(f.Uow, f.Acceso, env.Object, NullLogger<DocumentosController>.Instance)
            { ControllerContext = Contexto(7) };
        var req = new DocumentoRequest(1, "Plano.pdf", Convert.ToBase64String("%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF"u8.ToArray()),
            "pdf", "Planos", "Plano ficticio");
        try
        {
            var creado = Assert.IsType<CreatedAtActionResult>(await controller.Crear(req));
            var id = JsonSerializer.SerializeToElement(creado.Value).GetProperty("Id").GetInt32();
            var contenido = Assert.IsType<PhysicalFileResult>(await controller.Contenido(id));
            Assert.True(File.Exists(contenido.FileName));
            Assert.Contains("/api/documentos/", JsonSerializer.Serialize(creado.Value));
            controller.ControllerContext = Contexto(99);
            Assert.IsType<ForbidResult>(await controller.Contenido(id));
            controller.ControllerContext = Contexto(21, "Constructor");
            Assert.IsType<PhysicalFileResult>(await controller.Contenido(id));
            Assert.IsType<ForbidResult>(await controller.Crear(req));
            controller.ControllerContext = Contexto(7);
            Assert.IsType<BadRequestObjectResult>(await controller.Crear(req with { Base64 = "no-es-base64" }));
            Assert.IsType<BadRequestObjectResult>(await controller.Crear(req with { Base64 = Convert.ToBase64String("archivo ejecutable"u8) }));
            Assert.IsType<NoContentResult>(await controller.Eliminar(id));
            Assert.False(File.Exists(contenido.FileName));
            Assert.Empty(await f.Db.Archivos.ToListAsync());
        }
        finally { if (Directory.Exists(root)) Directory.Delete(root, true); }
    }

    [Fact]
    public async Task AsignacionCompruebaEmpresaDisponibilidadYConfirmacionRepetida()
    {
        using var f = new Fixture();
        f.Proyecto.Estado = EstadoProyecto.EnCurso;
        f.Db.Propuestas.AddRange(
            new Propuesta { ProyectoId = 1, ConstructorId = 4, Estado = EstadoPropuesta.Aceptada },
            new Propuesta { ProyectoId = 2, ConstructorId = 4, Estado = EstadoPropuesta.Aceptada });
        (await f.Db.Proyectos.FindAsync(2))!.Estado = EstadoProyecto.EnCurso;
        f.Db.Empleados.AddRange(new Empleado { Id = 1, ConstructorId = 4, Nombre = "Propio" },
            new Empleado { Id = 2, ConstructorId = 5, Nombre = "Ajeno" },
            new Empleado { Id = 3, ConstructorId = 4, Nombre = "Inactivo", Activo = false });
        await f.Db.SaveChangesAsync();
        var controller = new AsignacionesPersonalController(f.Db, f.Uow, f.Acceso) { ControllerContext = Contexto(21, "Constructor") };
        Assert.IsType<ForbidResult>(await controller.Asignar(new(1, 2, null), default));
        Assert.IsType<ConflictObjectResult>(await controller.Asignar(new(1, 3, null), default));
        Assert.IsType<OkObjectResult>(await controller.Asignar(new(1, 1, null), default));
        Assert.IsType<OkObjectResult>(await controller.Asignar(new(1, 1, null), default));
        Assert.Single(await f.Db.AsignacionesEmpleado.ToListAsync());
        Assert.IsType<ConflictObjectResult>(await controller.Asignar(new(2, 1, null), default));
        controller.ControllerContext = Contexto(7);
        Assert.IsType<OkObjectResult>(await controller.Listar(1));
        controller.ControllerContext = Contexto(22, "Constructor");
        Assert.IsType<ForbidResult>(await controller.Listar(1));
        controller.ControllerContext = Contexto(21, "Constructor");
        Assert.IsType<NoContentResult>(await controller.Quitar((await f.Db.AsignacionesEmpleado.SingleAsync()).Id));
        Assert.Empty(await f.Db.AsignacionesEmpleado.ToListAsync());
    }

    [Fact]
    public async Task ConvertirCotizacionConservaUnaSolaPropuestaYRestringeElAutor()
    {
        using var f = new Fixture();
        f.Db.CotizacionesIA.Add(new CotizacionIA { Id = 1, ProyectoId = 1, GeneradoPorId = 21, Plan = "estandar" });
        await f.Db.SaveChangesAsync();
        var controller = new CotizacionIAController(f.Uow) { ControllerContext = Contexto(22, "Constructor") };
        var req = new ConvertirCotizacionRequest(125000, 5, "Cotización revisada por el constructor");
        Assert.IsType<NotFoundResult>(await controller.Convertir(1, req, f.Db, default));
        controller.ControllerContext = Contexto(21, "Constructor");
        Assert.IsType<BadRequestObjectResult>(await controller.Convertir(1, req with { MontoTotal = 0 }, f.Db, default));
        Assert.IsType<OkObjectResult>(await controller.Convertir(1, req, f.Db, default));
        f.Db.ChangeTracker.Clear();
        Assert.IsType<OkObjectResult>(await controller.Convertir(1, req, f.Db, default));
        var propuesta = await f.Db.Propuestas.SingleAsync();
        Assert.Equal(125000m, propuesta.MontoTotal);
        Assert.Equal(EstadoPropuesta.Enviada, propuesta.Estado);
        Assert.Equal(propuesta.Id, (await f.Db.CotizacionesIA.SingleAsync()).PropuestaId);
    }

    [Fact]
    public async Task GeneracionExigeValidacionVigenteYGuardaLosTresPlanesConTotalesCalculados()
    {
        using var f = new Fixture();
        var planes = new[] { "economico", "estandar", "premium" }.Select(plan => new
        {
            plan, nombrePlan = plan, resumen = "Estimación ficticia", duracionEstimada = "Por confirmar",
            perfilesManoDeObra = new[] { "Instalador" }, recomendaciones = new[] { "Validar cantidades." },
            lineas = new[] { new { descripcion = "Cerámica", categoria = "Acabados", cantidad = 15m,
                unidad = "m2", precioUnitario = 10000m, precioTotal = 1m, esManoDeObra = false } }
        });
        using var handler = new RespuestaIa(new { planes });
        using var http = new HttpClient(handler);
        var controller = new GenerarCotizacionIAController(f.Uow, Ia(http), f.Acceso, new AuditoriaService(f.Db))
            { ControllerContext = Contexto(21, "Constructor") };
        Assert.IsType<BadRequestObjectResult>(await controller.Generar(1, f.Db, default));
        Assert.Equal(0, handler.Llamadas);
        f.Proyecto.ValidacionIaHash = ValidacionProyectoEstado.Huella(f.Proyecto);
        await f.Db.SaveChangesAsync();
        Assert.IsType<OkObjectResult>(await controller.Generar(1, f.Db, default));
        Assert.Equal(new[] { 1, 2, 3 }, await f.Db.CotizacionesIA.OrderBy(c => c.Version).Select(c => c.Version).ToArrayAsync());
        Assert.All(await f.Db.LineasCotizacion.ToListAsync(), l => Assert.Equal(150000m, l.PrecioTotal));
        var primera = await f.Db.CotizacionesIA.Select(c => c.GeneracionId).Distinct().SingleAsync();
        Assert.NotNull(primera);
        Assert.IsType<OkObjectResult>(await controller.Generar(1, f.Db, default));
        Assert.Equal(2, await f.Db.CotizacionesIA.Select(c => c.GeneracionId).Distinct().CountAsync());
        Assert.Equal(6, await f.Db.CotizacionesIA.CountAsync());
        f.Proyecto.Titulo = "Título modificado";
        await f.Db.SaveChangesAsync();
        Assert.IsType<BadRequestObjectResult>(await controller.Generar(1, f.Db, default));
        Assert.Equal(2, handler.Llamadas);
    }

    [Fact]
    public async Task AdjuntosPdfUsanFileInputYNoImageInput()
    {
        using var handler = new RespuestaIa(new HallazgoIa("Plano de cocina", "Confirmar escala"));
        using var http = new HttpClient(handler);
        var resultado = await Ia(http).AnalizarAsync("plano.pdf", "application/pdf", "%PDF-1.4"u8.ToArray(), default);
        Assert.NotNull(resultado);
        var body = JsonDocument.Parse(handler.Cuerpo!);
        var adjunto = body.RootElement.GetProperty("input")[0].GetProperty("content")[0];
        Assert.Equal("input_file", adjunto.GetProperty("type").GetString());
        Assert.StartsWith("data:application/pdf;base64,", adjunto.GetProperty("file_data").GetString());
        Assert.False(body.RootElement.GetProperty("store").GetBoolean());
    }

    [Fact]
    public async Task ServicioIaCaidoNoGuardaPlanes()
    {
        using var f = new Fixture();
        f.Proyecto.ValidacionIaHash = ValidacionProyectoEstado.Huella(f.Proyecto);
        await f.Db.SaveChangesAsync();
        using var http = new HttpClient();
        var config = new ConfigurationBuilder().Build();
        var sinClave = new ValidacionProyectoIa(http, config, NullLogger<ValidacionProyectoIa>.Instance);
        var controller = new GenerarCotizacionIAController(f.Uow, sinClave, f.Acceso, new AuditoriaService(f.Db))
            { ControllerContext = Contexto(21, "Constructor") };
        var resultado = Assert.IsType<ObjectResult>(await controller.Generar(1, f.Db, default));
        Assert.Equal(503, resultado.StatusCode);
        Assert.Empty(await f.Db.CotizacionesIA.ToListAsync());
    }

    [Fact]
    public async Task SolicitudesSeActualizanYNoConfundenPropuestasEnviadas()
    {
        using var f = new Fixture();
        var controller = new PropuestasConsultaController(f.Uow) { ControllerContext = Contexto(21, "Constructor") };
        var inicial = Json(await controller.Solicitudes());
        Assert.Equal(2, inicial.GetArrayLength());
        f.Db.Propuestas.Add(new Propuesta { ProyectoId = 1, ConstructorId = 4, Estado = EstadoPropuesta.Enviada });
        await f.Db.SaveChangesAsync();
        var siguiente = Json(await controller.Solicitudes());
        Assert.Single(siguiente.EnumerateArray());
        Assert.Equal(2, siguiente[0].GetProperty("id").GetInt32());
        (await f.Db.Proyectos.FindAsync(2))!.Estado = EstadoProyecto.Cancelado;
        await f.Db.SaveChangesAsync();
        Assert.Equal(0, Json(await controller.Solicitudes()).GetArrayLength());
    }

    private static JsonElement Json(IActionResult r) =>
        JsonSerializer.SerializeToElement(Assert.IsType<OkObjectResult>(r).Value, JsonSerializerOptions.Web);
    private static ControllerContext Contexto(int id, string rol = "Cliente") =>
        new() { HttpContext = new DefaultHttpContext { User = ComparacionCotizacionesTests.User(id, rol) } };
    private static ValidacionProyectoIa Ia(HttpClient http) => new(http,
        new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?> { ["OPENAI_API_KEY"] = "prueba-sin-red" }).Build(),
        NullLogger<ValidacionProyectoIa>.Instance);

    private sealed class Fixture : IDisposable
    {
        public AppDbContext Db { get; } = new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        public UnitOfWork Uow { get; }
        public AccesoProyectoService Acceso { get; }
        public Proyecto Proyecto { get; } = new() { Id = 1, ClienteId = 7, Titulo = "Cocina",
            Descripcion = "Retirar cerámica e instalar porcelanato antideslizante en la cocina.", TipoProyecto = TipoProyecto.Pisos,
            AreaM2 = 15, Estado = EstadoProyecto.EnPropuestas };
        public Fixture()
        {
            Uow = new(Db); Acceso = new(Uow);
            Db.Proyectos.AddRange(Proyecto, new Proyecto { Id = 2, ClienteId = 7, Estado = EstadoProyecto.EnPropuestas });
            Db.PerfilesConstructor.AddRange(new PerfilConstructor { Id = 4, UsuarioId = 21 }, new PerfilConstructor { Id = 5, UsuarioId = 22 });
            Db.SaveChanges();
        }
        public void Dispose() => Db.Dispose();
    }

    private sealed class RespuestaIa(object contenido) : HttpMessageHandler
    {
        public int Llamadas { get; private set; }
        public string? Cuerpo { get; private set; }
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            Llamadas++;
            Cuerpo = await request.Content!.ReadAsStringAsync(ct);
            Assert.Equal("https://api.openai.com/v1/responses", request.RequestUri!.AbsoluteUri);
            using var peticion = JsonDocument.Parse(Cuerpo);
            var formato = peticion.RootElement.GetProperty("text").GetProperty("format");
            Assert.Equal("json_schema", formato.GetProperty("type").GetString());
            Assert.Equal("object", formato.GetProperty("schema").GetProperty("type").GetString());
            return new(HttpStatusCode.OK) { Content = JsonContent.Create(new
            {
                status = "completed", output = new[] { new { type = "message",
                    content = new[] { new { type = "output_text", text = JsonSerializer.Serialize(contenido, JsonSerializerOptions.Web) } } } }
            }) };
        }
    }
}

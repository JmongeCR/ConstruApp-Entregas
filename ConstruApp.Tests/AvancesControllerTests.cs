using System.Security.Claims;
using System.Text.Json;
using ConstruApp.API.Controllers;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Core.Interfaces;
using ConstruApp.Infrastructure.Data;
using ConstruApp.Infrastructure.Repositories;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;

namespace ConstruApp.Tests.Unit;

public class AvancesControllerTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(100)]
    public async Task Create_PersistsAdvanceAndAttachmentsTogether_AndClientCanRead(int percentage)
    {
        using var f = new Fixture();
        var req = Request(percentage);
        req.Fotos = [Photo()];
        var created = Assert.IsType<CreatedResult>(await f.Controller.Create(req));
        var body = Json(created);
        Assert.Equal("Instalaciones", body.GetProperty("titulo").GetString());
        Assert.Equal(percentage, body.GetProperty("porcentajeAvance").GetInt32());
        Assert.Single(body.GetProperty("fotos").EnumerateArray());
        f.Db.ChangeTracker.Clear();
        var stored = await f.Db.AvancesObra.SingleAsync();
        var photo = await f.Db.FotosAvance.SingleAsync();
        Assert.Equal(stored.Id, photo.AvanceObraId);
        Assert.Equal("Encargado", stored.Responsable);
        Assert.True(File.Exists(f.PhotoPath(photo.Url)));
        Assert.Single(await f.Db.AuditoriaLogs.ToListAsync());
        f.ActAs(7, "Cliente");
        var history = Json(Assert.IsType<OkObjectResult>(await f.Controller.GetByProyecto(1)));
        Assert.Single(history.EnumerateArray());
        Assert.Single(history[0].GetProperty("fotos").EnumerateArray());
        Assert.Equal(EstadoProyecto.EnCurso, (await f.Db.Proyectos.FindAsync(1))!.Estado);
    }

    [Theory]
    [InlineData("titulo")]
    [InlineData("tituloLargo")]
    [InlineData("descripcion")]
    [InlineData("responsable")]
    [InlineData("porcentajeFaltante")]
    [InlineData("porcentajeNegativo")]
    [InlineData("porcentajeGrande")]
    [InlineData("proyecto")]
    public async Task Create_RejectsInvalidDataWithoutSaving(string scenario)
    {
        using var f = new Fixture();
        var req = Request();
        switch (scenario)
        {
            case "titulo": req.Titulo = " "; break;
            case "tituloLargo": req.Titulo = new string('x', 301); break;
            case "descripcion": req.Descripcion = new string('x', 3001); break;
            case "responsable": req.Responsable = new string('x', 201); break;
            case "porcentajeFaltante": req.PorcentajeAvance = null; break;
            case "porcentajeNegativo": req.PorcentajeAvance = -1; break;
            case "porcentajeGrande": req.PorcentajeAvance = 101; break;
            case "proyecto": req.ProyectoId = 0; break;
        }
        Assert.IsType<BadRequestObjectResult>(await f.Controller.Create(req));
        Assert.Empty(await f.Db.AvancesObra.ToListAsync());
        Assert.Empty(await f.Db.AuditoriaLogs.ToListAsync());
    }

    [Theory]
    [InlineData(EstadoProyecto.Borrador)]
    [InlineData(EstadoProyecto.Publicado)]
    [InlineData(EstadoProyecto.EnPropuestas)]
    [InlineData(EstadoProyecto.Completado)]
    [InlineData(EstadoProyecto.Cancelado)]
    public async Task Create_OnlyAllowsProjectsInProgress(EstadoProyecto state)
    {
        using var f = new Fixture();
        (await f.Db.Proyectos.FindAsync(1))!.Estado = state;
        await f.Db.SaveChangesAsync();
        Assert.IsType<BadRequestObjectResult>(await f.Controller.Create(Request()));
        Assert.Empty(await f.Db.AvancesObra.ToListAsync());
    }

    [Fact]
    public async Task Permissions_ConstructorMustBeAssigned_AdminUsesAssignedCompany()
    {
        using var f = new Fixture();
        f.ActAs(22, "Constructor");
        Assert.IsType<ForbidResult>(await f.Controller.Create(Request()));
        Assert.IsType<ForbidResult>(await f.Controller.GetByProyecto(1));
        f.ActAs(99, "Admin");
        var result = Json(Assert.IsType<CreatedResult>(await f.Controller.Create(Request())));
        Assert.Equal(10, result.GetProperty("constructorId").GetInt32());
        Assert.Equal(99, (await f.Db.AuditoriaLogs.SingleAsync()).UsuarioId);
    }

    [Fact]
    public async Task History_RemainsVisibleToOwnerAndFinalizedConstructor_ButNotOtherClients()
    {
        using var f = new Fixture();
        Assert.IsType<OkObjectResult>(await f.Controller.GetByProyecto(3));
        f.ActAs(8, "Cliente");
        Assert.IsType<ForbidResult>(await f.Controller.GetByProyecto(3));
        f.ActAs(7, "Cliente");
        Assert.IsType<OkObjectResult>(await f.Controller.GetByProyecto(3));
        Assert.IsType<NotFoundObjectResult>(await f.Controller.GetByProyecto(999));
    }

    [Fact]
    public async Task FieldProjects_ReturnsAssignedWorkAndClosedHistory_WithWritePermission()
    {
        using var f = new Fixture();
        var list = Json(Assert.IsType<OkObjectResult>(await f.Controller.GetProyectos())).EnumerateArray().ToArray();
        Assert.Equal(new[] { 1, 3 }, list.Select(x => x.GetProperty("id").GetInt32()).Order().ToArray());
        Assert.True(list.Single(x => x.GetProperty("id").GetInt32() == 1).GetProperty("puedeRegistrar").GetBoolean());
        Assert.False(list.Single(x => x.GetProperty("id").GetInt32() == 3).GetProperty("puedeRegistrar").GetBoolean());
        f.ActAs(7, "Cliente");
        Assert.All(Json(Assert.IsType<OkObjectResult>(await f.Controller.GetProyectos())).EnumerateArray(), x => Assert.False(x.GetProperty("puedeRegistrar").GetBoolean()));
        f.ActAs(99, "Admin");
        Assert.Equal(3, Json(Assert.IsType<OkObjectResult>(await f.Controller.GetProyectos())).GetArrayLength());
        f.ActAs(55, "Proveedor");
        Assert.IsType<ForbidResult>(await f.Controller.GetProyectos());
    }

    [Fact]
    public async Task ProjectDetail_AllowsAssignedConstructorToOpenPrivateWorkspace()
    {
        using var f = new Fixture();
        var controller = new ProyectosController(new UnitOfWork(f.Db), new AuditoriaService(f.Db), Options.Create(new CotizacionRequisitosOptions()))
        { ControllerContext = f.Controller.ControllerContext };
        Assert.IsType<OkObjectResult>(await controller.GetById(1));
        Assert.IsType<OkObjectResult>(await controller.GetById(3));
        f.ActAs(22, "Constructor");
        Assert.IsType<ForbidResult>(await controller.GetById(1));
    }

    [Theory]
    [InlineData("base64")]
    [InlineData("mime")]
    [InlineData("firma")]
    [InlineData("vacio")]
    [InlineData("cantidad")]
    [InlineData("tamano")]
    [InlineData("nombre")]
    [InlineData("nulo")]
    public async Task Media_InvalidAttachmentsAreRejectedBeforeWriting(string scenario)
    {
        using var f = new Fixture();
        var req = Request();
        req.Fotos = [Photo()];
        switch (scenario)
        {
            case "base64": req.Fotos[0].Base64 = "data:image/png;base64,%%%"; break;
            case "mime": req.Fotos[0].Base64 = "data:text/html;base64,SGVsbG8="; break;
            case "firma": req.Fotos[0].Base64 = "data:image/png;base64,SGVsbG8="; break;
            case "vacio": req.Fotos[0].Base64 = "data:image/png;base64,"; break;
            case "cantidad": req.Fotos = Enumerable.Range(0, 5).Select(_ => Photo()).ToList(); break;
            case "tamano": req.Fotos[0].Base64 = "data:image/png;base64," + new string('A', 8 * 1024 * 1024); break;
            case "nombre": req.Fotos[0].Nombre = new string('x', 201); break;
            case "nulo": req.Fotos = [null!]; break;
        }
        Assert.IsType<BadRequestObjectResult>(await f.Controller.Create(req));
        Assert.Empty(await f.Db.AvancesObra.ToListAsync());
        Assert.Empty(Directory.EnumerateFiles(f.Root, "*", SearchOption.AllDirectories));
    }

    [Fact]
    public async Task PersistenceFailure_RemovesCreatedFiles_WithoutPersistingPartialAdvance()
    {
        using var f = new Fixture();
        var controller = f.WithFailingSave();
        var req = Request(); req.Fotos = [Photo()];
        var error = await Assert.ThrowsAsync<InvalidOperationException>(() => controller.Create(req));
        Assert.Equal("Fallo de prueba", error.Message);
        f.Db.ChangeTracker.Clear();
        Assert.Empty(await f.Db.AvancesObra.ToListAsync());
        Assert.Empty(await f.Db.FotosAvance.ToListAsync());
        Assert.Empty(Directory.EnumerateFiles(f.Root, "*", SearchOption.AllDirectories));
    }

    [Fact]
    public async Task DeleteFailure_DoesNotRemoveFilesBeforeDatabaseCommit()
    {
        using var f = new Fixture();
        var req = Request(); req.Fotos = [Photo()];
        await f.Controller.Create(req);
        var avance = await f.Db.AvancesObra.SingleAsync();
        var path = f.PhotoPath((await f.Db.FotosAvance.SingleAsync()).Url);
        var error = await Assert.ThrowsAsync<InvalidOperationException>(() => f.WithFailingSave().Delete(avance.Id));
        Assert.Equal("Fallo de prueba", error.Message);
        f.Db.ChangeTracker.Clear();
        Assert.Single(await f.Db.AvancesObra.ToListAsync());
        Assert.True(File.Exists(path));
    }

    [Fact]
    public async Task Delete_RequiresOwnerAndActiveAssignment_RemovesOwnFilesAndRecordsAudit()
    {
        using var f = new Fixture();
        var req = Request(); req.Fotos = [Photo()];
        await f.Controller.Create(req);
        var avance = await f.Db.AvancesObra.SingleAsync();
        var path = f.PhotoPath((await f.Db.FotosAvance.SingleAsync()).Url);
        f.ActAs(22, "Constructor");
        Assert.IsType<ForbidResult>(await f.Controller.Delete(avance.Id));
        f.ActAs(21, "Constructor");
        Assert.IsType<NoContentResult>(await f.Controller.Delete(avance.Id));
        Assert.False(File.Exists(path));
        Assert.Empty(await f.Db.AvancesObra.ToListAsync());
        Assert.Empty(await f.Db.FotosAvance.ToListAsync());
        Assert.Equal(2, await f.Db.AuditoriaLogs.CountAsync());
    }

    [Fact]
    public async Task Delete_DoesNotResolveStoredUrlsOutsideAttachmentDirectory()
    {
        using var f = new Fixture();
        await f.Controller.Create(Request());
        var avance = await f.Db.AvancesObra.SingleAsync();
        var sentinel = Path.Combine(f.Root, "sentinel.txt");
        await File.WriteAllTextAsync(sentinel, "keep");
        f.Db.FotosAvance.Add(new FotoAvance { AvanceObraId = avance.Id, Url = "/uploads/avances/../../sentinel.txt" });
        await f.Db.SaveChangesAsync();
        Assert.IsType<NoContentResult>(await f.Controller.Delete(avance.Id));
        Assert.True(File.Exists(sentinel));
    }

    private static CrearAvanceRequest Request(int percentage = 25) => new()
    { ProyectoId = 1, Titulo = " Instalaciones ", Descripcion = "Trabajo realizado", Responsable = " Encargado ", PorcentajeAvance = percentage };
    private static FotoAvanceRequest Photo() => new()
    { Nombre = "avance.png", Base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jh1sAAAAASUVORK5CYII=" };
    private static JsonElement Json(ObjectResult r) => JsonSerializer.SerializeToElement(r.Value, new JsonSerializerOptions(JsonSerializerDefaults.Web));

    private sealed class Fixture : IDisposable
    {
        private static readonly string TestBase = Path.GetFullPath(Path.Combine(Path.GetTempPath(), "ConstruApp-CAPP38-Tests"));
        public string Root { get; } = Path.Combine(TestBase, Guid.NewGuid().ToString("N"));
        public AppDbContext Db { get; } = new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        public AvancesController Controller { get; }
        public Fixture()
        {
            Directory.CreateDirectory(Root);
            Db.PerfilesConstructor.AddRange(new PerfilConstructor { Id = 10, UsuarioId = 21 }, new PerfilConstructor { Id = 11, UsuarioId = 22 });
            Db.Proyectos.AddRange(new Proyecto { Id = 1, ClienteId = 7, Titulo = "Obra", Estado = EstadoProyecto.EnCurso },
                new Proyecto { Id = 2, ClienteId = 8, Titulo = "Ajena", Estado = EstadoProyecto.EnCurso },
                new Proyecto { Id = 3, ClienteId = 7, Titulo = "Terminada", Estado = EstadoProyecto.Completado });
            Db.Propuestas.AddRange(new Propuesta { Id = 1, ProyectoId = 1, ConstructorId = 10, Estado = EstadoPropuesta.Aceptada },
                new Propuesta { Id = 2, ProyectoId = 2, ConstructorId = 11, Estado = EstadoPropuesta.Aceptada },
                new Propuesta { Id = 3, ProyectoId = 3, ConstructorId = 10, Estado = EstadoPropuesta.Finalizada });
            Db.SaveChanges();
            Controller = Build(new UnitOfWork(Db));
            ActAs(21, "Constructor");
        }
        public AvancesController WithFailingSave()
        {
            var real = new UnitOfWork(Db);
            var failing = new Mock<IUnitOfWork>();
            failing.SetupGet(x => x.Proyectos).Returns(real.Proyectos);
            failing.SetupGet(x => x.PerfilesConstructor).Returns(real.PerfilesConstructor);
            failing.SetupGet(x => x.Propuestas).Returns(real.Propuestas);
            failing.SetupGet(x => x.AvancesObra).Returns(real.AvancesObra);
            failing.SetupGet(x => x.FotosAvance).Returns(real.FotosAvance);
            failing.Setup(x => x.SaveChangesAsync()).ThrowsAsync(new InvalidOperationException("Fallo de prueba"));
            var result = Build(failing.Object); result.ControllerContext = Controller.ControllerContext; return result;
        }
        private AvancesController Build(IUnitOfWork uow)
        {
            var environment = new Mock<IWebHostEnvironment>(); environment.SetupGet(e => e.WebRootPath).Returns(Root);
            return new AvancesController(uow, environment.Object, new AuditoriaService(Db), NullLogger<AvancesController>.Instance)
            { ControllerContext = new() { HttpContext = new DefaultHttpContext() } };
        }
        public void ActAs(int id, string role) => Controller.ControllerContext.HttpContext.User = new(new ClaimsIdentity([
            new Claim(ClaimTypes.NameIdentifier, id.ToString()), new Claim(ClaimTypes.Role, role),
        ], "Test"));
        public string PhotoPath(string url) => Path.Combine(Root, "uploads", "avances", Path.GetFileName(url));
        public void Dispose()
        {
            Db.Dispose();
            var resolved = Path.GetFullPath(Root);
            if (resolved.StartsWith(TestBase + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase) &&
                Guid.TryParseExact(Path.GetFileName(resolved), "N", out _) && Directory.Exists(resolved)) Directory.Delete(resolved, true);
        }
    }
}

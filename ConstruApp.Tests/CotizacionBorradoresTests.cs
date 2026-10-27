using System.Security.Claims;
using System.Text.Json;
using ConstruApp.API.Controllers;
using ConstruApp.API.Services;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Infrastructure.Data;
using ConstruApp.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.Extensions.Options;

namespace ConstruApp.Tests.Unit;

public class CotizacionBorradoresTests
{
    [Fact]
    public async Task Draft_CanBeSavedIncompleteResumedAndSubmitted_WithPersistedDateAndAudit()
    {
        using var fixture = new Fixture();
        var result = Assert.IsType<CreatedAtActionResult>(await fixture.Controller.CrearBorrador(new()));
        var id = Json(result).GetProperty("Id").GetInt32();
        fixture.Db.ChangeTracker.Clear();
        var stored = await fixture.Db.Proyectos.FindAsync(id);
        Assert.NotNull(stored);
        Assert.Null(stored.TipoProyecto);
        Assert.Null(stored.PropiedadId);
        Assert.Null(stored.FechaEnvioCotizacion);
        Assert.Empty(Json(Assert.IsType<OkObjectResult>(await fixture.Controller.GetPublicados(null, null))).EnumerateArray());
        var missing = Assert.IsType<BadRequestObjectResult>(await fixture.Controller.EnviarACotizacion(id));
        Assert.True(Json(missing).GetProperty("errors").TryGetProperty("tipoProyecto", out _));

        var req = new ProyectoBorradorRequest("  Cocina  ", "Renovar muebles, iluminación y acabados de la cocina.",
            "Remodelacion", 4, 25, 8000000, new DateTime(2026, 11, 1), new DateTime(2026, 12, 1));
        Assert.IsType<OkObjectResult>(await fixture.Controller.GuardarBorrador(id, req));
        fixture.Db.ChangeTracker.Clear();
        var resumed = Json(Assert.IsType<OkObjectResult>(await fixture.Controller.GetById(id)));
        Assert.Equal("Cocina", resumed.GetProperty("Titulo").GetString());
        Assert.Equal("Borrador", resumed.GetProperty("Estado").GetString());
        Assert.Equal("Remodelacion", resumed.GetProperty("TipoProyecto").GetString());
        Assert.Equal("San José", resumed.GetProperty("Provincia").GetString());
        Assert.IsType<OkObjectResult>(await fixture.Controller.EnviarACotizacion(id));
        fixture.Db.ChangeTracker.Clear();
        stored = await fixture.Db.Proyectos.FindAsync(id);
        Assert.Equal(EstadoProyecto.EnPropuestas, stored!.Estado);
        Assert.NotNull(stored.FechaEnvioCotizacion);
        Assert.Equal(stored.FechaEnvioCotizacion, stored.FechaPublicacion);
        Assert.Single(Json(Assert.IsType<OkObjectResult>(await fixture.Controller.GetPublicados(null, null))).EnumerateArray());
        Assert.Equal(3, await fixture.Db.AuditoriaLogs.CountAsync());
        Assert.IsType<BadRequestObjectResult>(await fixture.Controller.EnviarACotizacion(id));
        Assert.Equal(3, await fixture.Db.AuditoriaLogs.CountAsync());
        Assert.IsType<BadRequestObjectResult>(await fixture.Controller.GuardarBorrador(id, req));
        Assert.Equal(EstadoProyecto.EnPropuestas, stored.Estado);
    }

    [Fact]
    public async Task RequiredDocuments_RejectsMissingOrOtherProjectsFiles_WithoutPublishing()
    {
        using var fixture = new Fixture(new() { DocumentosPorTipo = new() { ["Remodelacion"] = ["Plano", "Permiso"] } });
        var project = await fixture.CreateCompleteDraft();
        fixture.Db.Archivos.AddRange(
            new ArchivoProyecto { ProyectoId = project.Id + 100, Categoria = "Plano", Url = "/otro.pdf" },
            new ArchivoProyecto { ProyectoId = project.Id, Categoria = "Permiso", Url = " " });
        await fixture.Db.SaveChangesAsync();

        var result = Assert.IsType<BadRequestObjectResult>(await fixture.Controller.EnviarACotizacion(project.Id));
        var errors = Json(result).GetProperty("errors");
        Assert.True(errors.TryGetProperty("documentos.Plano", out _));
        Assert.True(errors.TryGetProperty("documentos.Permiso", out _));
        Assert.Equal(EstadoProyecto.Borrador, project.Estado);
        Assert.Null(project.FechaEnvioCotizacion);
        Assert.Empty(await fixture.Db.AuditoriaLogs.ToListAsync());
    }

    [Theory]
    [InlineData("Plano", "doc")]
    [InlineData(null, "plano")]
    public async Task RequiredDocuments_AcceptsExistingCategoryOrLegacyFileType(string? categoria, string tipo)
    {
        using var fixture = new Fixture(new() { DocumentosPorTipo = new() { ["Remodelacion"] = ["Plano"] } });
        var project = await fixture.CreateCompleteDraft();
        fixture.Db.Archivos.Add(new ArchivoProyecto { ProyectoId = project.Id, Categoria = categoria, TipoArchivo = tipo, Url = "/plano.pdf" });
        await fixture.Db.SaveChangesAsync();
        Assert.IsType<OkObjectResult>(await fixture.Controller.EnviarACotizacion(project.Id));
        Assert.Equal(EstadoProyecto.EnPropuestas, project.Estado);
    }

    [Fact]
    public async Task RequiredDocuments_OnlyAppliesToConfiguredProjectType()
    {
        using var fixture = new Fixture(new() { DocumentosPorTipo = new() { ["ObraGris"] = ["Plano"] } });
        var project = await fixture.CreateCompleteDraft();
        Assert.IsType<OkObjectResult>(await fixture.Controller.EnviarACotizacion(project.Id));
    }

    [Fact]
    public async Task Draft_AnotherClientsPropertyOrProject_IsRejectedWithoutChanges()
    {
        using var fixture = new Fixture();
        var project = await fixture.CreateCompleteDraft();
        Assert.IsType<BadRequestObjectResult>(await fixture.Controller.CrearBorrador(new(PropiedadId: 6)));
        Assert.IsType<BadRequestObjectResult>(await fixture.Controller.GuardarBorrador(project.Id, new(Titulo: "Cambio", PropiedadId: 6)));
        Assert.Equal("Cocina", project.Titulo);
        fixture.Controller.ControllerContext.HttpContext.User = Fixture.Identity(99);
        Assert.IsType<ForbidResult>(await fixture.Controller.GetById(project.Id));
        Assert.IsType<ForbidResult>(await fixture.Controller.GuardarBorrador(project.Id, new()));
        Assert.IsType<ForbidResult>(await fixture.Controller.EnviarACotizacion(project.Id));
        Assert.Equal(EstadoProyecto.Borrador, project.Estado);
        Assert.Empty(await fixture.Db.AuditoriaLogs.ToListAsync());
    }

    public static IEnumerable<object[]> InvalidDrafts()
    {
        yield return [new ProyectoBorradorRequest(AreaM2: -1)];
        yield return [new ProyectoBorradorRequest(AreaM2: 100000000)];
        yield return [new ProyectoBorradorRequest(PresupuestoMax: 0)];
        yield return [new ProyectoBorradorRequest(TipoProyecto: "999")];
        yield return [new ProyectoBorradorRequest(TipoProyecto: "Inexistente")];
        yield return [new ProyectoBorradorRequest(Titulo: new string('a', 201))];
        yield return [new ProyectoBorradorRequest(Descripcion: new string('a', 3001))];
        yield return [new ProyectoBorradorRequest(FechaInicio: new(2026, 12, 1), FechaFin: new(2026, 11, 1))];
    }

    [Theory]
    [MemberData(nameof(InvalidDrafts))]
    public async Task Draft_InvalidProvidedValues_AreRejectedOnCreateAndSave(ProyectoBorradorRequest req)
    {
        using var fixture = new Fixture();
        var project = await fixture.CreateCompleteDraft();
        Assert.IsType<BadRequestObjectResult>(await fixture.Controller.CrearBorrador(req));
        Assert.IsType<BadRequestObjectResult>(await fixture.Controller.GuardarBorrador(project.Id, req));
        Assert.Equal("Cocina", project.Titulo);
        Assert.Single(await fixture.Db.Proyectos.ToListAsync());
        Assert.Empty(await fixture.Db.AuditoriaLogs.ToListAsync());
    }

    [Fact]
    public async Task LegacyPublish_CannotBypassDocumentValidation()
    {
        using var fixture = new Fixture(new() { DocumentosPorTipo = new() { ["Remodelacion"] = ["Plano"] } });
        var project = await fixture.CreateCompleteDraft();
        Assert.IsType<BadRequestObjectResult>(await fixture.Controller.Publicar(project.Id));
        Assert.Equal(EstadoProyecto.Borrador, project.Estado);
    }

    [Fact]
    public void DocumentConfiguration_RejectsUnknownTypesAndCategories()
    {
        Assert.True(new CotizacionRequisitosOptions().EsValida());
        Assert.False(new CotizacionRequisitosOptions { DocumentosPorTipo = new() { ["Tipoinventado"] = ["Plano"] } }.EsValida());
        Assert.False(new CotizacionRequisitosOptions { DocumentosPorTipo = new() { ["Remodelacion"] = ["Desconocido"] } }.EsValida());
    }

    [Fact]
    public void SqlServerMigration_MatchesModelAndGeneratesUpgradeAndRollback_WithoutConnecting()
    {
        using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer("Server=unused;Database=unused;Integrated Security=true;TrustServerCertificate=true").Options);
        Assert.False(db.Database.HasPendingModelChanges());
        var migrator = db.GetService<IMigrator>();
        const string migration = "20261014120000_CAPP29EnvioACotizacion";
        var previous = db.Database.GetMigrations().TakeWhile(m => m != migration).Last();
        var sql = migrator.GenerateScript(previous, migration);
        Assert.Contains("[FechaEnvioCotizacion]", sql);
        Assert.Contains("[TipoProyecto] nvarchar(30) NULL", sql);
        var rollback = migrator.GenerateScript(migration, previous);
        Assert.Contains("DROP COLUMN [FechaEnvioCotizacion]", rollback);
        Assert.Contains("[TipoProyecto] = N'Otro'", rollback);
    }

    private static JsonElement Json(ObjectResult result) => JsonSerializer.SerializeToElement(result.Value);

    private sealed class Fixture : IDisposable
    {
        public AppDbContext Db { get; } = new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        public ProyectosController Controller { get; }

        public Fixture(CotizacionRequisitosOptions? config = null)
        {
            Db.Propiedades.AddRange(
                new Propiedad { Id = 4, ClienteId = 7, Nombre = "Casa", Provincia = "San José", Canton = "Montes de Oca", Distrito = "San Pedro" },
                new Propiedad { Id = 6, ClienteId = 99, Nombre = "Otra casa" });
            Db.SaveChanges();
            Controller = new ProyectosController(new UnitOfWork(Db), new AuditoriaService(Db), Options.Create(config ?? new()))
            {
                ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = Identity(7) } },
            };
        }

        public async Task<Proyecto> CreateCompleteDraft()
        {
            var proyecto = new Proyecto { ClienteId = 7, PropiedadId = 4, Titulo = "Cocina",
                Descripcion = "Renovación completa de los muebles de la cocina.", TipoProyecto = TipoProyecto.Remodelacion };
            Db.Proyectos.Add(proyecto);
            await Db.SaveChangesAsync();
            return proyecto;
        }

        public static ClaimsPrincipal Identity(int id) => new(new ClaimsIdentity([
            new Claim(ClaimTypes.NameIdentifier, id.ToString()), new Claim("nombre", "Cliente prueba"),
            new Claim(ClaimTypes.Role, "Cliente"),
        ], "Test"));
        public void Dispose() => Db.Dispose();
    }
}

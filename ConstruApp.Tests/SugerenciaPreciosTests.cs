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
using Microsoft.Extensions.Options;

namespace ConstruApp.Tests.Unit;

public class SugerenciaPreciosTests
{
    [Fact]
    public async Task Generate_UsesConfiguredRange_RoundsToCentsAndPersistsAuditAndBasis()
    {
        using var f = new Fixture();
        var response = Assert.IsType<OkObjectResult>(await f.Controller.Generar(1));
        var json = JsonSerializer.SerializeToElement(response.Value);
        Assert.Equal(2552.55m, json.GetProperty("rangoMinimo").GetDecimal());
        Assert.Equal(5112.75m, json.GetProperty("rangoMaximo").GetDecimal());
        Assert.Equal("CRC", json.GetProperty("moneda").GetString());
        Assert.True(json.GetProperty("esEstimacion").GetBoolean());
        Assert.Contains("no constituye una cotización", json.GetProperty("advertencia").GetString());
        Assert.Equal(100.10m, json.GetProperty("precioMinimoM2").GetDecimal());
        Assert.Equal("Datos ficticios de prueba", json.GetProperty("fuente").GetString());
        f.Db.ChangeTracker.Clear();
        var stored = await f.Db.CotizacionesIA.SingleAsync();
        Assert.Equal(2552.55m, stored.RangoMinimo);
        Assert.Equal(5112.75m, stored.RangoMaximo);
        Assert.Equal("referencial", stored.Plan);
        Assert.Equal(7, stored.GeneradoPorId);
        Assert.Contains("25.5 m²", stored.ResumenIA);
        Assert.Contains("100.10–200.50 CRC/m²", stored.ResumenIA);
        Assert.Single(await f.Db.AuditoriaLogs.ToListAsync());
        Assert.Equal(EstadoProyecto.Borrador, (await f.Db.Proyectos.FindAsync(1))!.Estado);
    }

    [Theory]
    [InlineData("titulo")]
    [InlineData("descripcion")]
    [InlineData("tipoProyecto")]
    [InlineData("tipoInvalido")]
    [InlineData("propiedadId")]
    [InlineData("propiedadAjena")]
    [InlineData("propiedadEliminada")]
    [InlineData("areaM2")]
    [InlineData("areaGrande")]
    [InlineData("presupuestoMax")]
    [InlineData("fechaFin")]
    public async Task Generate_IncompleteOrInconsistentData_ReturnsFieldErrorsWithoutSaving(string field)
    {
        using var f = new Fixture();
        var project = await f.Db.Proyectos.FindAsync(1);
        switch (field)
        {
            case "titulo": project!.Titulo = " "; break;
            case "descripcion": project!.Descripcion = "Corta"; break;
            case "tipoProyecto": project!.TipoProyecto = null; break;
            case "tipoInvalido": project!.TipoProyecto = (TipoProyecto)999; break;
            case "propiedadId": project!.PropiedadId = null; break;
            case "propiedadAjena": project!.PropiedadId = 6; break;
            case "propiedadEliminada": project!.PropiedadId = 99; break;
            case "areaM2": project!.AreaM2 = 0; break;
            case "areaGrande": project!.AreaM2 = 100000000; break;
            case "presupuestoMax": project!.PresupuestoMax = -1; break;
            case "fechaFin": project!.FechaInicio = new(2026, 12, 1); project.FechaFin = new(2026, 11, 1); break;
        }
        var result = Assert.IsType<BadRequestObjectResult>(await f.Controller.Generar(1));
        Assert.NotEmpty(JsonSerializer.SerializeToElement(result.Value).GetProperty("errors").EnumerateObject());
        Assert.Empty(await f.Db.CotizacionesIA.ToListAsync());
        Assert.Empty(await f.Db.AuditoriaLogs.ToListAsync());
    }

    [Fact]
    public async Task Generate_WithoutConfiguredTariff_ReportsUnavailableAndInventsNoPrices()
    {
        using var f = new Fixture(new());
        var result = Assert.IsType<ObjectResult>(await f.Controller.Generar(1));
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, result.StatusCode);
        Assert.Empty(await f.Db.CotizacionesIA.ToListAsync());
        Assert.Empty(await f.Db.AuditoriaLogs.ToListAsync());
    }

    [Fact]
    public async Task Generate_OtherTypeWithoutTariff_DoesNotReuseAnotherTypesRange()
    {
        using var f = new Fixture();
        (await f.Db.Proyectos.FindAsync(1))!.TipoProyecto = TipoProyecto.Otro;
        var result = Assert.IsType<ObjectResult>(await f.Controller.Generar(1));
        Assert.Equal(503, result.StatusCode);
        Assert.Empty(await f.Db.CotizacionesIA.ToListAsync());
    }

    [Fact]
    public async Task Generate_SpecialProject_ExplicitlyRequiresProfessionalReview()
    {
        using var f = new Fixture(new() { PorTipo = new() { ["Otro"] = TestRange() } });
        (await f.Db.Proyectos.FindAsync(1))!.TipoProyecto = TipoProyecto.Otro;
        var result = Assert.IsType<OkObjectResult>(await f.Controller.Generar(1));
        Assert.Contains("Proyecto especial", JsonSerializer.SerializeToElement(result.Value).GetProperty("advertencia").GetString());
        Assert.Contains("persona profesional", (await f.Db.CotizacionesIA.SingleAsync()).ResumenIA);
    }

    [Fact]
    public async Task Generate_DoesNotExposeAnotherClientsProject_AndMissingProjectIs404()
    {
        using var f = new Fixture();
        f.Controller.ControllerContext.HttpContext.User = Fixture.User(99, "Cliente");
        Assert.IsType<ForbidResult>(await f.Controller.Generar(1));
        Assert.IsType<NotFoundObjectResult>(await f.Controller.Generar(99));
        Assert.Empty(await f.Db.CotizacionesIA.ToListAsync());
    }

    [Fact]
    public async Task Generate_AdminCanEstimateClientsProject_WithoutChangingOwnership()
    {
        using var f = new Fixture();
        f.Controller.ControllerContext.HttpContext.User = Fixture.User(99, "Admin");
        Assert.IsType<OkObjectResult>(await f.Controller.Generar(1));
        Assert.Equal(99, (await f.Db.CotizacionesIA.SingleAsync()).GeneradoPorId);
        Assert.Equal(7, (await f.Db.Proyectos.FindAsync(1))!.ClienteId);
    }

    [Fact]
    public async Task Generate_UsesHighestExistingVersion_AfterGapsInHistory()
    {
        using var f = new Fixture();
        f.Db.CotizacionesIA.Add(new() { ProyectoId = 1, Version = 10 });
        await f.Db.SaveChangesAsync();
        Assert.IsType<OkObjectResult>(await f.Controller.Generar(1));
        Assert.Contains(await f.Db.CotizacionesIA.ToListAsync(), c => c.Version == 11);
    }

    [Fact]
    public async Task Generate_RejectsCalculatedAmountOutsideSqlDecimalCapacity()
    {
        using var f = new Fixture(new() { PorTipo = new() { ["Remodelacion"] = new() { Minimo = 9999999999999999m, Maximo = 9999999999999999m } } });
        Assert.IsType<BadRequestObjectResult>(await f.Controller.Generar(1));
        Assert.Empty(await f.Db.CotizacionesIA.ToListAsync());
    }

    [Theory]
    [InlineData("Remodelacion", 0, 20)]
    [InlineData("Remodelacion", -1, 20)]
    [InlineData("Remodelacion", 20, 10)]
    [InlineData("TipoInventado", 10, 20)]
    public void Configuration_RejectsUnknownTypesAndInvalidRanges(string type, decimal min, decimal max)
    {
        Assert.False(new RangosPreciosOptions { PorTipo = new() { [type] = new() { Minimo = min, Maximo = max } } }.EsValida());
        Assert.True(new RangosPreciosOptions().EsValida());
    }

    private static RangoPrecioPorM2 TestRange() => new() { Minimo = 100.10m, Maximo = 200.50m, Fuente = "Datos ficticios de prueba" };

    private sealed class Fixture : IDisposable
    {
        public AppDbContext Db { get; } = new(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        public SugerenciaPreciosController Controller { get; }
        public Fixture(RangosPreciosOptions? config = null)
        {
            Db.Propiedades.AddRange(new Propiedad { Id = 4, ClienteId = 7 }, new Propiedad { Id = 6, ClienteId = 99 });
            Db.Proyectos.Add(new Proyecto { Id = 1, ClienteId = 7, PropiedadId = 4, Titulo = "Cocina",
                Descripcion = "Renovación completa de los muebles de cocina.", TipoProyecto = TipoProyecto.Remodelacion, AreaM2 = 25.5m });
            Db.SaveChanges();
            Controller = new(new UnitOfWork(Db), Options.Create(config ?? new() { PorTipo = new() { ["Remodelacion"] = TestRange() } }), new AuditoriaService(Db))
            {
                ControllerContext = new() { HttpContext = new DefaultHttpContext { User = User(7, "Cliente") } },
            };
        }
        public static ClaimsPrincipal User(int id, string role) => new(new ClaimsIdentity([
            new Claim(ClaimTypes.NameIdentifier, id.ToString()), new Claim(ClaimTypes.Role, role),
        ], "Test"));
        public void Dispose() => Db.Dispose();
    }
}

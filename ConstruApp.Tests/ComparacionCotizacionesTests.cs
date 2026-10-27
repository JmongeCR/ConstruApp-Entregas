using System.Security.Claims;
using System.Text.Json;
using ConstruApp.API.Controllers;
using ConstruApp.Core.Entities;
using ConstruApp.Core.Enums;
using ConstruApp.Infrastructure.Data;
using ConstruApp.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.Tests.Unit;

public class ComparacionCotizacionesTests
{
    [Fact]
    public async Task Compare_ReturnsOnlyProjectsOffers_WithPriceTermAndScope()
    {
        using var f = new Fixture();
        var json = Json(Assert.IsType<OkObjectResult>(await f.Controller.Comparar(1)));
        Assert.Equal(3, json.GetProperty("totalProyecto").GetInt32());
        Assert.True(json.GetProperty("puedeComparar").GetBoolean());
        Assert.Equal(new[] { 2, 3, 1 }, Ids(json));
        var first = json.GetProperty("items")[0];
        Assert.Equal("Empresa A", first.GetProperty("constructor").GetString());
        Assert.Equal(1000, first.GetProperty("montoTotal").GetDecimal());
        Assert.Equal(40, first.GetProperty("plazoEstimadoDias").GetInt32());
        Assert.Equal("Alcance B", first.GetProperty("descripcion").GetString());
        Assert.Equal("Materiales", first.GetProperty("incluye").GetString());
        Assert.Equal("Enviada", first.GetProperty("estado").GetString());
    }

    [Theory]
    [InlineData("mayorPrecio", 1, 3, 2)]
    [InlineData("menorPlazo", 3, 1, 2)]
    [InlineData("reciente", 3, 2, 1)]
    public async Task Compare_AppliesEachOrdering(string order, int a, int b, int c)
    {
        using var f = new Fixture();
        Assert.Equal(new[] { a, b, c }, Ids(Json(Assert.IsType<OkObjectResult>(await f.Controller.Comparar(1, orden: order)))));
    }

    [Fact]
    public async Task Compare_CombinesFiltersBeforePaginationAndCounting()
    {
        using var f = new Fixture();
        var json = Json(Assert.IsType<OkObjectResult>(await f.Controller.Comparar(1,
            montoMinimo: 1500, montoMaximo: 3500, plazoMaximoDias: 35, estado: "Enviada", orden: "menorPlazo", page: 2, size: 1)));
        Assert.Equal(2, json.GetProperty("total").GetInt32());
        Assert.Equal(3, json.GetProperty("totalProyecto").GetInt32());
        Assert.Equal(new[] { 1 }, Ids(json));
    }

    [Fact]
    public async Task Compare_OnlyOneOffer_ReportsItInsteadOfPretendingToCompare()
    {
        using var f = new Fixture();
        f.Db.Propuestas.RemoveRange(f.Db.Propuestas.Where(p => p.ProyectoId == 1 && p.Id != 1));
        await f.Db.SaveChangesAsync();
        var json = Json(Assert.IsType<OkObjectResult>(await f.Controller.Comparar(1)));
        Assert.False(json.GetProperty("puedeComparar").GetBoolean());
        Assert.Contains("Solo hay una", json.GetProperty("mensaje").GetString());
        Assert.Single(Ids(json));
    }

    [Fact]
    public async Task Compare_OneFilteredOffer_DistinguishesItFromOnlyOneReceived()
    {
        using var f = new Fixture();
        var json = Json(Assert.IsType<OkObjectResult>(await f.Controller.Comparar(1, montoMaximo: 1500)));
        Assert.Equal(3, json.GetProperty("totalProyecto").GetInt32());
        Assert.False(json.GetProperty("puedeComparar").GetBoolean());
        Assert.Contains("filtros", json.GetProperty("mensaje").GetString());
    }

    [Fact]
    public async Task Compare_EmptyResults_AndNoOffersHaveDistinctMessages()
    {
        using var f = new Fixture();
        var filtered = Json(Assert.IsType<OkObjectResult>(await f.Controller.Comparar(1, montoMinimo: 4000)));
        Assert.Empty(Ids(filtered));
        Assert.Contains("filtros", filtered.GetProperty("mensaje").GetString());
        f.Db.Propuestas.RemoveRange(f.Db.Propuestas.Where(p => p.ProyectoId == 1));
        await f.Db.SaveChangesAsync();
        var empty = Json(Assert.IsType<OkObjectResult>(await f.Controller.Comparar(1)));
        Assert.Equal(0, empty.GetProperty("totalProyecto").GetInt32());
        Assert.Contains("Aún no hay", empty.GetProperty("mensaje").GetString());
    }

    [Fact]
    public async Task Compare_EnforcesOwnershipAndSupportsAdminWithoutMutatingOffers()
    {
        using var f = new Fixture();
        Assert.IsType<ForbidResult>(await f.Controller.Comparar(2));
        Assert.IsType<NotFoundObjectResult>(await f.Controller.Comparar(999));
        f.Controller.ControllerContext.HttpContext.User = User(7, "Admin");
        Assert.Equal(new[] { 4 }, Ids(Json(Assert.IsType<OkObjectResult>(await f.Controller.Comparar(2)))));
        f.Db.ChangeTracker.Clear();
        Assert.Equal(4, await f.Db.Propuestas.CountAsync());
        Assert.All(await f.Db.Propuestas.ToListAsync(), p => Assert.Equal(EstadoPropuesta.Enviada, p.Estado));
    }

    [Theory]
    [InlineData("negativo")]
    [InlineData("invertido")]
    [InlineData("plazo")]
    [InlineData("estado")]
    [InlineData("orden")]
    [InlineData("pagina")]
    [InlineData("tamano")]
    [InlineData("overflow")]
    public async Task Compare_RejectsInvalidFilters(string scenario)
    {
        using var f = new Fixture();
        var result = scenario switch
        {
            "negativo" => await f.Controller.Comparar(1, montoMinimo: -1),
            "invertido" => await f.Controller.Comparar(1, montoMinimo: 10, montoMaximo: 5),
            "plazo" => await f.Controller.Comparar(1, plazoMaximoDias: 0),
            "estado" => await f.Controller.Comparar(1, estado: "999"),
            "orden" => await f.Controller.Comparar(1, orden: "otro"),
            "pagina" => await f.Controller.Comparar(1, page: 0),
            "tamano" => await f.Controller.Comparar(1, size: 51),
            _ => await f.Controller.Comparar(1, page: int.MaxValue),
        };
        Assert.IsType<BadRequestObjectResult>(result);
    }

    private static JsonElement Json(ObjectResult r) => JsonSerializer.SerializeToElement(r.Value, new JsonSerializerOptions(JsonSerializerDefaults.Web));
    private static int[] Ids(JsonElement json) => json.GetProperty("items").EnumerateArray().Select(x => x.GetProperty("id").GetInt32()).ToArray();
    internal static ClaimsPrincipal User(int id, string role = "Cliente") => new(new ClaimsIdentity([
        new Claim(ClaimTypes.NameIdentifier, id.ToString()), new Claim(ClaimTypes.Role, role),
    ], "Test"));

    private sealed class Fixture : IDisposable
    {
        public AppDbContext Db { get; } = new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        public ComparacionCotizacionesController Controller { get; }
        public Fixture()
        {
            Db.Proyectos.AddRange(new Proyecto { Id = 1, ClienteId = 7, Titulo = "Casa" }, new Proyecto { Id = 2, ClienteId = 99, Titulo = "Ajeno" });
            Db.PerfilesConstructor.Add(new PerfilConstructor { Id = 10, UsuarioId = 100, NombreEmpresa = "Empresa A" });
            Db.Propuestas.AddRange(
                Offer(1, 1, 3000, 30, "Alcance A"), Offer(2, 1, 1000, 40, "Alcance B"),
                Offer(3, 1, 2000, 10, "Alcance C"), Offer(4, 2, 10, 1, "Ajeno"));
            Db.SaveChanges();
            Controller = new(new UnitOfWork(Db)) { ControllerContext = new() { HttpContext = new DefaultHttpContext { User = User(7) } } };
        }
        private static Propuesta Offer(int id, int proyectoId, decimal monto, int plazo, string alcance) => new()
        {
            Id = id, ProyectoId = proyectoId, ConstructorId = 10, MontoTotal = monto, PlazoEstimadoDias = plazo,
            Descripcion = alcance, Incluye = "Materiales", FechaEnvio = new DateTime(2026, 10, id),
        };
        public void Dispose() => Db.Dispose();
    }
}

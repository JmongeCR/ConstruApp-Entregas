using System.Text.Json;
using ConstruApp.API.Controllers;
using ConstruApp.Core.Entities;
using ConstruApp.Infrastructure.Data;
using ConstruApp.Infrastructure.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConstruApp.Tests.Unit;

public class CotizacionIAConsultaTests
{
    [Fact]
    public async Task Reads_AreClientIsolated_SearchBeforePagination_AndReturnSafeDetails()
    {
        using var f = new Fixture();
        var json = Json(Assert.IsType<OkObjectResult>(await f.Controller.GetAll(size: 1, busqueda: "Premium")));
        Assert.Equal(1, json.GetProperty("total").GetInt32());
        Assert.Equal(2, json.GetProperty("items")[0].GetProperty("id").GetInt32());
        Assert.IsType<NotFoundObjectResult>(await f.Controller.GetById(3));
        var detail = Json(Assert.IsType<OkObjectResult>(await f.Controller.GetById(2)));
        Assert.Empty(detail.GetProperty("analisisIA").GetProperty("recomendaciones").EnumerateArray());
        Assert.Single(detail.GetProperty("lineas").EnumerateArray());
        f.Controller.ControllerContext.HttpContext.User = ComparacionCotizacionesTests.User(7, "Admin");
        Assert.Equal(3, Json(Assert.IsType<OkObjectResult>(await f.Controller.GetAll())).GetProperty("total").GetInt32());
    }

    [Theory]
    [InlineData("menorPrecio", 1)]
    [InlineData("mayorPrecio", 2)]
    [InlineData("reciente", 2)]
    [InlineData("antiguo", 1)]
    public async Task List_AppliesStableOrdering(string order, int expected)
    {
        using var f = new Fixture();
        var json = Json(Assert.IsType<OkObjectResult>(await f.Controller.GetAll(orden: order)));
        Assert.Equal(expected, json.GetProperty("items")[0].GetProperty("id").GetInt32());
    }

    [Fact]
    public async Task List_CombinesPlanStateAndInclusiveDateFilters()
    {
        using var f = new Fixture();
        var json = Json(Assert.IsType<OkObjectResult>(await f.Controller.GetAll(plan: "premium", estado: "Activa",
            fechaDesde: new DateTime(2026, 10, 2), fechaHasta: new DateTime(2026, 10, 2))));
        Assert.Equal(1, json.GetProperty("total").GetInt32());
        Assert.Equal(2, json.GetProperty("items")[0].GetProperty("id").GetInt32());
        Assert.IsType<OkObjectResult>(await f.Controller.GetAll(fechaHasta: DateTime.MaxValue));
    }

    [Fact]
    public async Task List_RejectsInvalidPaginationDatesAndOrdering()
    {
        using var f = new Fixture();
        Assert.IsType<BadRequestObjectResult>(await f.Controller.GetAll(page: int.MaxValue));
        Assert.IsType<BadRequestObjectResult>(await f.Controller.GetAll(size: 101));
        Assert.IsType<BadRequestObjectResult>(await f.Controller.GetAll(orden: "desconocido"));
        Assert.IsType<BadRequestObjectResult>(await f.Controller.GetAll(fechaDesde: new(2026, 11, 1), fechaHasta: new(2026, 10, 1)));
    }

    private static JsonElement Json(ObjectResult r) => JsonSerializer.SerializeToElement(r.Value, new JsonSerializerOptions(JsonSerializerDefaults.Web));

    private sealed class Fixture : IDisposable
    {
        public AppDbContext Db { get; } = new(new DbContextOptionsBuilder<AppDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
        public CotizacionIAController Controller { get; }
        public Fixture()
        {
            Db.Users.AddRange(new Usuario { Id = 7, Nombre = "Cliente" }, new Usuario { Id = 99, Nombre = "Ajeno" });
            Db.Proyectos.AddRange(new Proyecto { Id = 1, ClienteId = 7, Titulo = "Cocina" }, new Proyecto { Id = 2, ClienteId = 99, Titulo = "Ajeno" });
            Db.CotizacionesIA.AddRange(
                new CotizacionIA { Id = 1, ProyectoId = 1, NombrePlan = "Estándar", Plan = "estandar", RangoMinimo = 100, RangoMaximo = 200, FechaGeneracion = new(2026, 10, 1) },
                new CotizacionIA { Id = 2, ProyectoId = 1, NombrePlan = "Premium", Plan = "premium", RangoMinimo = 200, RangoMaximo = 400,
                    FechaGeneracion = new(2026, 10, 2, 23, 59, 59), RecomendacionesJson = "{invalid", ManoDeObraJson = "[\"Electricista\"]" },
                new CotizacionIA { Id = 3, ProyectoId = 2, NombrePlan = "Premium", Plan = "premium" });
            Db.LineasCotizacion.Add(new LineaCotizacionIA { Id = 1, CotizacionIAId = 2, Descripcion = "Acabados" });
            Db.SaveChanges();
            Controller = new(new UnitOfWork(Db)) { ControllerContext = new() { HttpContext = new DefaultHttpContext { User = ComparacionCotizacionesTests.User(7) } } };
        }
        public void Dispose() => Db.Dispose();
    }
}

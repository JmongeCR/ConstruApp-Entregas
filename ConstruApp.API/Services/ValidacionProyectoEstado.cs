using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Globalization;
using ConstruApp.Core.Entities;

namespace ConstruApp.API.Services;

public static class ValidacionProyectoEstado
{
    public static string Huella(Proyecto p) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(
        JsonSerializer.Serialize(new { p.Titulo, p.Descripcion, p.TipoProyecto, AreaM2 = Numero(p.AreaM2),
            p.PropiedadId, p.Provincia, p.Canton, p.Distrito, PresupuestoMax = Numero(p.PresupuestoMax),
            FechaInicio = Fecha(p.FechaInicio), FechaFin = Fecha(p.FechaFin) }))));

    private static string? Numero(decimal? valor) => valor?.ToString("G29", CultureInfo.InvariantCulture);
    private static string? Fecha(DateTime? valor) => valor?.ToString("yyyyMMddHHmmssfffffff", CultureInfo.InvariantCulture);
}

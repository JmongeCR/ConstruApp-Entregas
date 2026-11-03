namespace ConstruApp.Core.Entities;

public sealed class EntrevistaIa
{
    public Guid Id { get; set; }
    public int ClienteId { get; set; }
    public Guid Version { get; set; }
    public DateTime ActualizadaUtc { get; set; }
    public string Datos { get; set; } = "{}";
    public int? ProyectoId { get; set; }
    public Proyecto? Proyecto { get; set; }
}

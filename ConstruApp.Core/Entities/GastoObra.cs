namespace ConstruApp.Core.Entities;

public class GastoObra
{
    public int      Id               { get; set; }
    public int      ProyectoId       { get; set; }
    public int?     PartidaId        { get; set; }
    public int      RegistradoPorId  { get; set; }
    public string   Descripcion      { get; set; } = string.Empty;
    // Materiales | ManoDeObra | Equipos | SubContratos | Administracion | Otros
    public string   Categoria        { get; set; } = "Otros";
    public decimal  Monto            { get; set; }
    public DateTime Fecha            { get; set; } = DateTime.UtcNow;
    public string?  Referencia       { get; set; }   // Nº factura, recibo, nota

    // Navegación
    public Proyecto             Proyecto      { get; set; } = null!;
    public PresupuestoPartida?  Partida       { get; set; }
    public Usuario              RegistradoPor { get; set; } = null!;
}

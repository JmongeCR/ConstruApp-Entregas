namespace ConstruApp.Core.Entities;

public class PresupuestoPartida
{
    public int      Id                   { get; set; }
    public int      ProyectoId           { get; set; }
    public string   Nombre               { get; set; } = string.Empty;
    // Materiales | ManoDeObra | Equipos | SubContratos | Administracion | Otros
    public string   Categoria            { get; set; } = "Otros";
    public decimal  PresupuestoEstimado  { get; set; }
    public string?  Descripcion          { get; set; }

    // Calculado desde Gastos (no mapeado en DB)
    public decimal GastoReal => Gastos.Sum(g => g.Monto);

    // Navegación
    public Proyecto               Proyecto { get; set; } = null!;
    public ICollection<GastoObra> Gastos   { get; set; } = [];
}

namespace ConstruApp.Core.Entities;

public class FavoritoConstructor
{
    public int      Id                  { get; set; }
    public int      ClienteId           { get; set; }
    public int      PerfilConstructorId { get; set; }
    public DateTime FechaAgregado       { get; set; } = DateTime.UtcNow;

    public Usuario          Cliente           { get; set; } = null!;
    public PerfilConstructor PerfilConstructor { get; set; } = null!;
}

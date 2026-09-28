namespace ConstruApp.Core.Entities;

public class ArchivoProyecto
{
    public int      Id            { get; set; }
    public int      ProyectoId    { get; set; }
    public string   Url           { get; set; } = string.Empty;
    public string   NombreArchivo { get; set; } = string.Empty;
    public string   TipoArchivo   { get; set; } = "foto";   // foto | plano | doc | contrato | permiso | factura | video | otro
    public string?  Categoria     { get; set; }              // Contrato | Plano | Diseño | Permiso | Factura | Fotografia | Video | Otro
    public string?  Descripcion   { get; set; }
    public int?     SubidoPorId   { get; set; }              // FK → Usuario
    public int      Version       { get; set; } = 1;
    public long?    TamanioBytes  { get; set; }
    public DateTime FechaSubida   { get; set; } = DateTime.UtcNow;

    // Navegación
    public Proyecto Proyecto  { get; set; } = null!;
    public Usuario? SubidoPor { get; set; }
}

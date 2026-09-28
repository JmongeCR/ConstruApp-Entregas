namespace ConstruApp.Core.Entities;

public class Invitacion
{
    public int       Id               { get; set; }
    public string    Email            { get; set; } = string.Empty;
    public string    RolWorkspace     { get; set; } = "Supervisor";
    public string    Token            { get; set; } = string.Empty;
    public int       EmpresaId        { get; set; }
    public int       InvitadoPorId    { get; set; }
    public DateTime  FechaCreacion    { get; set; } = DateTime.UtcNow;
    public DateTime  FechaExpiracion  { get; set; }
    public string    Estado           { get; set; } = "Pendiente";
    public DateTime? FechaAceptacion  { get; set; }
    public int?      AceptadoPorId    { get; set; }

    // "Invitacion" = link enviado por email | "Directo" = cuenta creada por el dueño
    public string  Tipo             { get; set; } = "Invitacion";
    public int?    UsuarioCreadorId { get; set; } // solo en tipo Directo

    public PerfilConstructor Empresa        { get; set; } = null!;
    public Usuario           InvitadoPor    { get; set; } = null!;
    public Usuario?          AceptadoPor    { get; set; }
    public Usuario?          UsuarioCreador { get; set; }
}

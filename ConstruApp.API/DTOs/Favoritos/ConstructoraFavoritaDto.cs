namespace ConstruApp.API.DTOs.Favoritos;

public sealed record ConstructoraFavoritaDto(
    int Id,
    int PerfilConstructorId,
    DateTime FechaAgregado,
    string NombreEmpresa,
    string? Bio,
    string? Especialidades,
    string? ZonasCobertura,
    bool Verificado,
    decimal CalificacionPromedio,
    int TotalProyectos
);

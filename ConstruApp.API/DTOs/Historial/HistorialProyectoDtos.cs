namespace ConstruApp.API.DTOs.Historial;

public sealed record HistorialProyectoResumenDto(
    int Id,
    string Titulo,
    string Descripcion,
    string TipoProyecto,
    string Estado,
    string? Canton,
    string? Provincia,
    decimal? PresupuestoMax,
    DateTime FechaPublicacion,
    DateTime? FechaInicio,
    DateTime? FechaFin,
    int CantidadPropuestas,
    int CantidadCotizacionesIA,
    IReadOnlyList<string> ProveedoresParticipantes,
    string? ProveedorSeleccionado,
    decimal? MontoContratado,
    string Resultado
);

public sealed record HistorialPropuestaDto(
    int Id,
    int ConstructorId,
    string Proveedor,
    decimal MontoTotal,
    string Descripcion,
    int PlazoEstimadoDias,
    string Estado,
    DateTime FechaEnvio,
    DateTime? FechaRespuesta
);

public sealed record HistorialCotizacionDto(
    int Id,
    decimal RangoMinimo,
    decimal RangoMaximo,
    string Resumen,
    string? Plan,
    string? NombrePlan,
    string Estado,
    int Version,
    DateTime FechaGeneracion
);

public sealed record HistorialAvanceDto(
    int Id,
    string Titulo,
    string Descripcion,
    string? Responsable,
    int PorcentajeAvance,
    DateTime Fecha
);

public sealed record HistorialArchivoDto(
    int Id,
    string NombreArchivo,
    string Url,
    string TipoArchivo,
    string? Categoria,
    string? Descripcion,
    DateTime FechaSubida
);

public sealed record HistorialFacturaDto(
    int Id,
    string Numero,
    string? Concepto,
    decimal MontoTotal,
    decimal MontoPagado,
    decimal Saldo,
    string Estado,
    DateTime FechaEmision,
    DateTime? FechaVencimiento
);

public sealed record HistorialProyectoDetalleDto(
    HistorialProyectoResumenDto Proyecto,
    IReadOnlyList<HistorialPropuestaDto> Propuestas,
    IReadOnlyList<HistorialCotizacionDto> Cotizaciones,
    IReadOnlyList<HistorialAvanceDto> Avances,
    IReadOnlyList<HistorialArchivoDto> Documentos,
    IReadOnlyList<HistorialFacturaDto> Facturas
);

/*
  ConstruApp - optimización posterior a las migraciones de Entity Framework.
  Ejecutar dentro de ConstruAppDB. El script es idempotente.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

ALTER DATABASE CURRENT SET READ_COMMITTED_SNAPSHOT ON;
ALTER DATABASE CURRENT SET AUTO_CREATE_STATISTICS ON;
ALTER DATABASE CURRENT SET AUTO_UPDATE_STATISTICS ON;
ALTER DATABASE CURRENT SET QUERY_STORE = ON;

IF OBJECT_ID(N'dbo.Proyectos', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Proyectos') AND name = N'IX_Proyectos_Estado_Provincia_Tipo_Fecha')
    CREATE INDEX IX_Proyectos_Estado_Provincia_Tipo_Fecha
        ON dbo.Proyectos (Estado, Provincia, TipoProyecto, FechaPublicacion DESC)
        INCLUDE (ClienteId, Titulo, PresupuestoMax, AreaM2);

IF OBJECT_ID(N'dbo.Proyectos', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Proyectos') AND name = N'IX_Proyectos_ClienteId_Estado')
    CREATE INDEX IX_Proyectos_ClienteId_Estado
        ON dbo.Proyectos (ClienteId, Estado)
        INCLUDE (Titulo, FechaPublicacion, FechaInicio, FechaFin);

IF OBJECT_ID(N'dbo.Propuestas', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Propuestas') AND name = N'IX_Propuestas_ProyectoId_Estado_Fecha')
    CREATE INDEX IX_Propuestas_ProyectoId_Estado_Fecha
        ON dbo.Propuestas (ProyectoId, Estado, FechaEnvio DESC)
        INCLUDE (ConstructorId, MontoTotal, PlazoEstimadoDias);

IF OBJECT_ID(N'dbo.Propuestas', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Propuestas') AND name = N'IX_Propuestas_ConstructorId_Estado')
    CREATE INDEX IX_Propuestas_ConstructorId_Estado
        ON dbo.Propuestas (ConstructorId, Estado)
        INCLUDE (ProyectoId, MontoTotal, FechaEnvio);

IF OBJECT_ID(N'dbo.Mensajes', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Mensajes') AND name = N'IX_Mensajes_Proyecto_Canal_Fecha')
    CREATE INDEX IX_Mensajes_Proyecto_Canal_Fecha
        ON dbo.Mensajes (ProyectoId, Canal, FechaEnvio)
        INCLUDE (RemitenteId, DestinatarioId, Leido, PropuestaId);

IF OBJECT_ID(N'dbo.Mensajes', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Mensajes') AND name = N'IX_Mensajes_Destinatario_Leido_Fecha')
    CREATE INDEX IX_Mensajes_Destinatario_Leido_Fecha
        ON dbo.Mensajes (DestinatarioId, Leido, FechaEnvio DESC)
        INCLUDE (ProyectoId, RemitenteId, Canal)
        WHERE DestinatarioId IS NOT NULL;

IF OBJECT_ID(N'dbo.Facturas', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Facturas') AND name = N'IX_Facturas_Proyecto_Estado_Fecha')
    CREATE INDEX IX_Facturas_Proyecto_Estado_Fecha
        ON dbo.Facturas (ProyectoId, Estado, FechaEmision DESC)
        INCLUDE (ConstructorId, Numero, MontoTotal, MontoPagado, FechaVencimiento);

IF OBJECT_ID(N'dbo.Facturas', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Facturas') AND name = N'UX_Facturas_Numero')
    CREATE UNIQUE INDEX UX_Facturas_Numero ON dbo.Facturas (Numero);

IF OBJECT_ID(N'dbo.PagosFactura', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.PagosFactura') AND name = N'IX_PagosFactura_FacturaId_Fecha')
    CREATE INDEX IX_PagosFactura_FacturaId_Fecha
        ON dbo.PagosFactura (FacturaId, Fecha)
        INCLUDE (Monto, MetodoPago, Referencia);

IF OBJECT_ID(N'dbo.FasesProyecto', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.FasesProyecto') AND name = N'IX_FasesProyecto_Proyecto_Orden')
    CREATE INDEX IX_FasesProyecto_Proyecto_Orden
        ON dbo.FasesProyecto (ProyectoId, Orden)
        INCLUDE (Estado, FechaInicio, FechaFin, ResponsableId, PorcentajeCompletado);

IF OBJECT_ID(N'dbo.AuditoriaLogs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.AuditoriaLogs') AND name = N'IX_AuditoriaLogs_Modulo_Fecha')
    CREATE INDEX IX_AuditoriaLogs_Modulo_Fecha
        ON dbo.AuditoriaLogs (Modulo, Fecha DESC)
        INCLUDE (UsuarioId, Accion, EntidadId);

IF OBJECT_ID(N'dbo.AuditoriaLogs', N'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.AuditoriaLogs') AND name = N'IX_AuditoriaLogs_UsuarioId_Fecha')
    CREATE INDEX IX_AuditoriaLogs_UsuarioId_Fecha
        ON dbo.AuditoriaLogs (UsuarioId, Fecha DESC)
        INCLUDE (Modulo, Accion, EntidadId);

SELECT
    OBJECT_SCHEMA_NAME(i.object_id) AS esquema,
    OBJECT_NAME(i.object_id) AS tabla,
    i.name AS indice
FROM sys.indexes AS i
WHERE i.name LIKE N'IX[_]%' OR i.name LIKE N'UX[_]%'
ORDER BY tabla, indice;

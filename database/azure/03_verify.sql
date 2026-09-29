/*
  ConstruApp - verificacion de despliegue en Azure SQL.
  Ejecutar despues de 00_schema.sql y 01_after_migrations.sql.
*/

SET NOCOUNT ON;

DECLARE @TablasEsperadas TABLE (Nombre sysname PRIMARY KEY);
INSERT INTO @TablasEsperadas (Nombre) VALUES
    (N'Materiales'), (N'Roles'), (N'RolPermisos'), (N'Usuarios'),
    (N'RoleClaims'), (N'AuditoriaLogs'), (N'Configuraciones'), (N'EmailLogs'),
    (N'PerfilesConstructor'), (N'PerfilesProveedor'), (N'Proyectos'),
    (N'UsuarioClaims'), (N'UsuarioLogins'), (N'UsuarioPermisos'),
    (N'UsuarioRoles'), (N'UsuarioTokens'), (N'Empleados'), (N'PortafolioItems'),
    (N'PreciosMaterial'), (N'Archivos'), (N'CotizacionesIA'), (N'FasesProyecto'),
    (N'MiembrosEquipo'), (N'Notificaciones'), (N'OrdenesCambio'),
    (N'PresupuestoPartidas'), (N'Propuestas'), (N'AsignacionesEmpleado'),
    (N'LineasCotizacion'), (N'AvancesObra'), (N'TareasFase'), (N'GastosObra'),
    (N'Calificaciones'), (N'CartasAceptacion'), (N'Facturas'), (N'Mensajes'),
    (N'FotosAvance'), (N'PagosFactura'), (N'Invitaciones');

SELECT
    DB_NAME() AS BaseDatos,
    compatibility_level AS NivelCompatibilidad,
    is_read_committed_snapshot_on AS ReadCommittedSnapshot,
    is_auto_create_stats_on AS AutoCreateStatistics,
    is_auto_update_stats_on AS AutoUpdateStatistics,
    is_query_store_on AS QueryStore
FROM sys.databases
WHERE database_id = DB_ID();

SELECT
    e.Nombre AS Tabla,
    CASE WHEN t.object_id IS NULL THEN N'FALTA' ELSE N'OK' END AS Estado
FROM @TablasEsperadas AS e
LEFT JOIN sys.tables AS t
    ON t.schema_id = SCHEMA_ID(N'dbo') AND t.name = e.Nombre
ORDER BY e.Nombre;

SELECT
    COUNT(*) AS TablasAplicacionEncontradas,
    (SELECT COUNT(*) FROM @TablasEsperadas) AS TablasAplicacionEsperadas,
    SUM(CASE WHEN t.object_id IS NULL THEN 1 ELSE 0 END) AS TablasFaltantes
FROM @TablasEsperadas AS e
LEFT JOIN sys.tables AS t
    ON t.schema_id = SCHEMA_ID(N'dbo') AND t.name = e.Nombre;

SELECT
    OBJECT_NAME(i.object_id) AS Tabla,
    i.name AS Indice,
    CASE WHEN i.is_unique = 1 THEN N'UNIQUE' ELSE N'NONCLUSTERED' END AS Tipo
FROM sys.indexes AS i
WHERE i.name IN (
    N'IX_Proyectos_Estado_Provincia_Tipo_Fecha',
    N'IX_Proyectos_ClienteId_Estado',
    N'IX_Propuestas_ProyectoId_Estado_Fecha',
    N'IX_Propuestas_ConstructorId_Estado',
    N'IX_Mensajes_Proyecto_Canal_Fecha',
    N'IX_Mensajes_Destinatario_Leido_Fecha',
    N'IX_Facturas_Proyecto_Estado_Fecha',
    N'UX_Facturas_Numero',
    N'IX_PagosFactura_FacturaId_Fecha',
    N'IX_FasesProyecto_Proyecto_Orden',
    N'IX_AuditoriaLogs_Modulo_Fecha',
    N'IX_AuditoriaLogs_UsuarioId_Fecha'
)
ORDER BY Tabla, Indice;

SELECT COUNT(*) AS LlavesForaneas
FROM sys.foreign_keys
WHERE is_ms_shipped = 0;

IF EXISTS (
    SELECT 1
    FROM @TablasEsperadas AS e
    LEFT JOIN sys.tables AS t
        ON t.schema_id = SCHEMA_ID(N'dbo') AND t.name = e.Nombre
    WHERE t.object_id IS NULL
)
    THROW 51000, 'Verificacion fallida: faltan tablas requeridas por la arquitectura de ConstruApp.', 1;

IF (SELECT is_read_committed_snapshot_on FROM sys.databases WHERE database_id = DB_ID()) <> 1
    OR (SELECT is_query_store_on FROM sys.databases WHERE database_id = DB_ID()) <> 1
    THROW 51001, 'Verificacion fallida: la configuracion de rendimiento no esta completa.', 1;

PRINT N'VERIFICACION CONSTRUAPP: OK';

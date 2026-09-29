/*
  Prueba segura de lectura y escritura desde SSMS.
  La escritura ocurre dentro de una transaccion y se revierte al final,
  por lo que no deja tablas ni registros de prueba en ConstruAppDB.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

SELECT
    SUSER_SNAME() AS UsuarioAutenticado,
    DB_NAME() AS BaseDatos,
    COUNT(*) AS TablasAplicacion
FROM sys.tables
WHERE schema_id = SCHEMA_ID(N'dbo')
  AND name <> N'__EFMigrationsHistory'
GROUP BY SUSER_SNAME(), DB_NAME();

BEGIN TRANSACTION;

CREATE TABLE dbo.PruebaAccesoSSMS
(
    Id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Mensaje nvarchar(100) NOT NULL,
    FechaUtc datetime2 NOT NULL DEFAULT SYSUTCDATETIME()
);

INSERT INTO dbo.PruebaAccesoSSMS (Mensaje)
VALUES (N'Lectura y escritura correctas desde SSMS');

SELECT
    Id,
    Mensaje,
    FechaUtc,
    SUSER_SNAME() AS EjecutadoPor
FROM dbo.PruebaAccesoSSMS;

ROLLBACK TRANSACTION;

SELECT
    CASE WHEN OBJECT_ID(N'dbo.PruebaAccesoSSMS', N'U') IS NULL
         THEN N'OK: prueba revertida sin dejar datos'
         ELSE N'ERROR: la tabla de prueba permanece'
    END AS Limpieza;

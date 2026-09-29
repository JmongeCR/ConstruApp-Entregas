# Evidencia de despliegue de ConstruAppDB

Fecha de validación: 2026-09-14  
Servidor: `ckmecr-admin-server.database.windows.net`  
Base de datos: `ConstruAppDB`  
Estado observado en Azure: `Online`

## Resultado

- Autenticación con Microsoft Entra completada.
- Conexión cifrada establecida con Azure SQL.
- `00_schema.sql` ejecutado correctamente.
- `01_after_migrations.sql` ejecutado correctamente.
- `03_verify.sql` ejecutado correctamente.
- 39 tablas de aplicación encontradas y verificadas.
- Aislamiento `READ_COMMITTED_SNAPSHOT`, estadísticas automáticas y Query Store incluidos en la validación.
- Índices de proyectos, propuestas, mensajes, facturas, pagos, fases y auditoría incluidos en el despliegue.
- Firewall actualizado para la conexión de desarrollo autorizada.
- Punto de restauración disponible en Azure.
- Invitaciones B2B enviadas a Josue Monge (`jmonge40278@ufide.ac.cr`) y Luis Fonseca (`lfonseca70447@ufide.ac.cr`).
- Grupo de seguridad `ConstruApp-Developers` creado con ambos integrantes.
- Usuario externo del grupo creado en `ConstruAppDB`.
- Roles comprobados: `db_datareader`, `db_datawriter` y `db_ddladmin`.
- Permisos comprobados: `EXECUTE` y `VIEW DEFINITION`.
- Auditoría administrativa: `db_owner = 0`, roles de administración de seguridad = 0 y permisos directos peligrosos = 0.

## Resultado reproducible

```text
Conexion activa: tcp:ckmecr-admin-server.database.windows.net,1433/ConstruAppDB
OK: 00_schema.sql
OK: 01_after_migrations.sql
OK: 03_verify.sql
Tablas de aplicacion verificadas: 39
```

Los integrantes reciben el acceso mediante el grupo de Microsoft Entra `ConstruApp-Developers`. Las invitaciones deben ser aceptadas antes de que cada usuario pueda autenticarse en Azure SQL.

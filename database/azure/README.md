# Base de datos de ConstruApp en Azure SQL

Este paquete materializa el modelo de datos definido en `G7_SC603_J_Arquitectura.pdf` y en el modelo de Entity Framework Core del proyecto. La implementación conserva SQL Server/Azure SQL, EF Core Code First, autenticación y autorización por roles, trazabilidad y los dominios funcionales mostrados en el diagrama entidad-relación.

## Diseño cubierto

- Identidad y acceso: usuarios, roles, permisos granulares, claims, inicios de sesión e invitaciones.
- Proyectos y contratación: proyectos, perfiles, propuestas, cartas de aceptación, fases, tareas, equipo y empleados.
- Cotización y materiales: cotizaciones IA, líneas, materiales, precios, presupuesto y gastos.
- Seguimiento y comunicación: avances, fotografías, archivos, mensajes y notificaciones.
- Cierre financiero y reputación: facturas, pagos y calificaciones.
- Operación y cumplimiento: configuración, correo y auditoría, incluida la trazabilidad indicada por la arquitectura.

El esquema contiene 39 tablas de aplicación y `__EFMigrationsHistory`. Las relaciones, restricciones, tipos y precisión decimal provienen de las migraciones de EF Core, que son la fuente ejecutable del modelo.

## Orden de ejecución

1. `00_schema.sql`: crea el esquema relacional completo de forma idempotente.
2. `01_after_migrations.sql`: activa estadísticas, aislamiento `READ_COMMITTED_SNAPSHOT`, Query Store e índices para consultas frecuentes.
3. `02_team_access_template.sql`: crea usuarios contenidos de Microsoft Entra con privilegios mínimos.
4. `03_verify.sql`: comprueba las 39 tablas, opciones de rendimiento, índices y llaves foráneas; falla si falta un componente obligatorio.
5. `04_ssms_read_write_test.sql`: valida lectura y escritura desde SSMS dentro de una transacción que se revierte sin dejar datos.
6. `05_team_developer_access.sql`: reproduce el acceso del grupo de seguridad `ConstruApp-Developers`.

## Acceso del equipo

Los compañeros pueden utilizar correos personales o institucionales externos. Se agregan como invitados B2B en Microsoft Entra y luego como miembros del grupo de seguridad `ConstruApp-Developers`. Azure SQL recibe permisos para el grupo, no para cuentas administrativas compartidas.

Permisos vigentes para desarrollo: `db_datareader`, `db_datawriter`, `db_ddladmin`, `EXECUTE` y `VIEW DEFINITION`. El grupo no pertenece a `db_owner`, `db_securityadmin` ni `db_accessadmin`, y no recibe `CONTROL DATABASE`. El acceso por IP debe limitarse a las direcciones públicas necesarias y retirarse cuando deje de utilizarse.

## Criterios de operación

- Conexiones cifradas con TLS y autenticación mediante Microsoft Entra.
- Secretos fuera del repositorio y suministrados por configuración segura.
- Copias automáticas y supervisión desde Azure, de acuerdo con la arquitectura.
- Query Store y estadísticas activas para diagnóstico y ajuste.
- Índices específicos en proyectos, propuestas, mensajes, facturas, pagos, fases y auditoría.
- Validación posterior a cada migración mediante `03_verify.sql`.

# ConstruApp

Plataforma web para la gestión de proyectos de construcción entre clientes y contratistas.

Permite publicar proyectos, recibir cotizaciones, dar seguimiento a avances y centralizar la comunicación entre las partes involucradas.

---

## Stack

- **Backend**: .NET 10 · ASP.NET Core Identity · EF Core · JWT Bearer
- **Frontend**: React 19 · Vite · MUI v9
- **BD**: Azure SQL Server

---

## Base de datos en Azure SQL

Los scripts idempotentes de despliegue, validación, prueba de lectura y
escritura y configuración de acceso están documentados en
[`database/azure/README.md`](database/azure/README.md).

## Flujo de trabajo del equipo

La convención de ramas, revisiones y pull requests se encuentra en
[`docs/ESTRATEGIA_GITFLOW.md`](docs/ESTRATEGIA_GITFLOW.md).

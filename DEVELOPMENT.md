# DEVELOPMENT.md

Guía de desarrollo y arquitectura del proyecto ConstruApp.

## Project Overview

ConstruApp is a construction project management platform for Costa Rica that connects clients, contractors, and suppliers. It consists of a .NET 10 Web API backend and a React 19 frontend.

## Commands

### Backend (run from `ConstruApp/` solution root)

```bash
# Build entire solution
dotnet build

# Run the API (starts on http://localhost:5115)
cd ConstruApp.API && dotnet run

# Run tests
cd ConstruApp.Tests && dotnet test --verbosity normal

# Run a single test class
dotnet test --filter "FullyQualifiedName~ClassName"

# EF Core migrations (always specify both projects)
dotnet ef migrations add <Name> --project ConstruApp.Infrastructure --startup-project ConstruApp.API --output-dir Data/Migrations
dotnet ef database update --project ConstruApp.Infrastructure --startup-project ConstruApp.API
dotnet ef migrations remove --project ConstruApp.Infrastructure --startup-project ConstruApp.API
```

### Frontend (run from `ConstruApp.Web/`)

```bash
npm run dev      # Vite dev server → http://localhost:5173
npm run build    # Production build
npm run lint     # ESLint
```

### Infrastructure

```bash
# SQL Server via Docker (container name: construapp-sqlserver)
docker ps  # verify it's running and healthy
```

## Architecture

### Backend — 4-project layered solution

```
ConstruApp.Core          ← No dependencies. Entities, enums, interfaces.
ConstruApp.Infrastructure← Depends on Core. AppDbContext, Repository<T>, UnitOfWork.
ConstruApp.API           ← Depends on Core + Infrastructure. Controllers, Services, DTOs, Filters.
ConstruApp.Tests         ← Depends on Core + Infrastructure. xUnit + Moq + EF InMemory.
```

**Data access pattern — always use IUnitOfWork, never inject AppDbContext into controllers:**
- `IUnitOfWork` exposes a typed `IRepository<T>` for every entity
- `IRepository<T>` has: `GetAllAsync`, `FindAsync`, `GetByIdAsync`, `AddAsync`, `UpdateAsync`, `DeleteAsync`, `ExistsAsync`, `CountAsync`
- Call `await _uow.SaveChangesAsync()` once per unit of work
- Exception: `AuditoriaService` and `DatabaseSeeder` inject `AppDbContext` directly (performance reasons)

**Identity & Auth:**
- `Usuario : IdentityUser<int>` — extends ASP.NET Core Identity with `Nombre`, `Rol` (enum), `Activo`, `AvatarUrl`
- JWT issued on login, validated via `JwtBearerDefaults`. Token carries claims: `ClaimTypes.NameIdentifier` (userId), `ClaimTypes.Email`, `ClaimTypes.Role`, and `"perms"` (comma-separated permission codes)
- `[Authorize]` for role-level gates; `[RequierePermiso("permiso.codigo")]` for granular RBAC (Admin always bypasses)
- Permission constants live in `ConstruApp.Core/Constants/Permisos.cs` in the pattern `Modulo.Accion`

**Services registered in Program.cs:**
- `ValidacionProyectoIa` → OpenAI Responses API for interviews, attachments and quotation plans.
- `INotificacionService` → `NotificacionService` (persists to `Notificaciones` table)
- `IAuditoriaService` → `AuditoriaService` (persists to `AuditoriaLogs` table)
- `IPermisosService` → `PermisosService`
- `IUnitOfWork` → `UnitOfWork`

**Secrets:** `appsettings.json` has empty strings for all secrets. Real values go in `appsettings.Development.json` (git-ignored) or environment variables. At startup, `Program.cs` overrides config with env vars `GROQ_API_KEY`, `GEMINI_API_KEY`, `CONNECTION_STRING`, `JWT_SECRET_KEY`, `EMAIL_PASSWORD`, `EMAIL_USER`.

**Entrevista en Cotizaciones IA.** El servidor lee `OPENAI_API_KEY` de su entorno. Si la clave
se guardó localmente en `.env.local`, cargá esa variable en el proceso antes de iniciar el
backend. `OpenAI__Model` permite cambiar el modelo compatible con texto, imágenes, PDF y salida
estructurada. El valor predeterminado es `gpt-5-mini`.

Antes de generar planes desde un proyecto manual, la pantalla requiere validar el proyecto.
La validación se asocia con sus datos actuales. Al modificarlos, hay que validarlo de nuevo.
Los constructores pueden generar planes para solicitudes abiertas y confirmar monto, plazo y
descripción antes de convertir un plan propio en una propuesta enviada.

La migración `Sprint3Integracion` agrega la huella de validación y el vínculo entre cotización
y propuesta. Los documentos nuevos se guardan en `App_Data/documentos` y se descargan mediante
una ruta autenticada. Ese directorio requiere almacenamiento persistente en el despliegue.
Las asignaciones de personal usan empleados activos de la empresa contratada. Un empleado
asignado a otra obra en curso se informa como no disponible.

`RevisionPr19Generaciones` agrega un identificador compartido por los tres planes de cada
generación nueva. El detalle por proyecto devuelve la generación más reciente; el parámetro
`cotizacionId` permite abrir una generación anterior y seleccionar el plan exacto del historial.
Los registros existentes sin identificador se conservan y se consultan individualmente.
Archivar/reactivar requiere autoría o rol Admin y modifica únicamente el estado de la cotización.
Los registros sin autor solo pueden ser administrados por Admin. Estado y PropuestaId tienen
control de concurrencia para impedir que archivar y convertir se sobrescriban.

Las ediciones de documentos requieren `version`, obtenida al abrir la ficha. Una versión
desactualizada devuelve 409 sin reemplazar el archivo o los metadatos; la pantalla conserva
el formulario y permite consultar/descargar la versión actual antes de confirmar una nueva base.

La migración `EntrevistasIa` guarda historial, ficha, hallazgos y alcance. Para estimar costos
se usan los rangos de `EstimacionPrecios:PorTipo`. Para estimar plazo y tamaño de cuadrilla se
configuran `MinM2Dia`, `MaxM2Dia` y `Personas` en `EstimacionAlcance:PorTipo:<TipoProyecto>`.
Con un área confirmada, el plazo divide esa área entre ambos rendimientos y redondea hacia arriba.
Los rendimientos corresponden a la cuadrilla configurada. Los valores ausentes quedan pendientes
de estimar. El alcance conserva las observaciones y los nombres de los adjuntos analizados.

**Database:** SQL Server 2022 in Docker (`construapp-sqlserver`). Auto-migrated on startup via `db.Database.Migrate()`. Seed data applied by `DatabaseSeeder.SeedAsync()` on every startup (idempotent — checks existence before inserting). Test users: `admin@test.com`, `cliente@test.com`, `constructor@test.com` — all with password `Test1234!`.

### Frontend — React 19 + Vite + MUI v9

**Key files:**
- `src/api/axios.js` — Axios instance with base URL `http://localhost:5115/api`, auto-attaches JWT from `localStorage`, redirects to `/login` on 401
- `src/api/endpoints.js` — All API calls organized by domain (e.g. `proyectosApi`, `propuestasApi`, `notificacionesApi`)
- `src/context/AuthContext.jsx` — Auth state; exposes `usuario`, `login()`, `register()`, `logout()`, `esRol(...roles)`. JWT and user object stored in `localStorage`
- `src/context/NotificacionesContext.jsx` — Notification state with 30s polling. **Explicitly designed for future SignalR migration** — replace `startPolling()` with `startSignalR()` without changing the public API
- `src/App.jsx` — Route definitions. `PrivateRoute` redirects unauthenticated users to `/login`; `PublicRoute` redirects authenticated users to `/`

**Routing pattern:** All authenticated pages live under the `<Layout />` wrapper at `/`. Ghost modules (Bitácora, Asistencias, Trabajadores, Cuadrillas) render `<Proximamente />` — they have routes but no backend.

**Roles in frontend:** `usuario.rol` is a string (`"Admin"`, `"Cliente"`, `"Constructor"`, `"Proveedor"`). Use `esRol("Constructor", "Admin")` from `useAuth()` for conditional rendering.

**Static files:** The API serves uploaded files from `wwwroot/uploads/` as static content (`app.UseStaticFiles()`).

## Adding a New Feature — Checklist

**Backend:**
1. Add entity to `ConstruApp.Core/Entities/` (inheriting from nothing; keep it a plain class)
2. Add `DbSet<T>` to `AppDbContext` and add the repository property to both `IUnitOfWork` and `UnitOfWork`
3. Create a migration
4. Add controller in `ConstruApp.API/Controllers/` — inject `IUnitOfWork` + `IAuditoriaService`; call `_auditoria.RegistrarAsync()` on write operations
5. If the action should trigger a notification, inject `INotificacionService` and call `CrearAsync()`

**Frontend:**
1. Add API calls to `src/api/endpoints.js`
2. Create page in `src/pages/<module>/`
3. Add route in `src/App.jsx` under the `<Layout />` route
4. Add sidebar entry in `src/components/layout/`

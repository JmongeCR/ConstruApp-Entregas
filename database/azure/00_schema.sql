IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [Materiales] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(200) NOT NULL,
        [Descripcion] nvarchar(500) NULL,
        [UnidadMedida] nvarchar(50) NOT NULL,
        [Categoria] nvarchar(30) NOT NULL,
        [CodigoProducto] nvarchar(100) NULL,
        [Activo] bit NOT NULL,
        CONSTRAINT [PK_Materiales] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [Roles] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(256) NULL,
        [NormalizedName] nvarchar(256) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        CONSTRAINT [PK_Roles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [RolPermisos] (
        [Id] int NOT NULL IDENTITY,
        [Rol] nvarchar(30) NOT NULL,
        [PermisoCodigo] nvarchar(80) NOT NULL,
        CONSTRAINT [PK_RolPermisos] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [Usuarios] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(150) NOT NULL,
        [Telefono] nvarchar(20) NULL,
        [AvatarUrl] nvarchar(500) NULL,
        [Rol] nvarchar(20) NOT NULL,
        [Activo] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedAt] datetime2 NOT NULL,
        [UltimoAcceso] datetime2 NULL,
        [UserName] nvarchar(256) NULL,
        [NormalizedUserName] nvarchar(256) NULL,
        [Email] nvarchar(256) NULL,
        [NormalizedEmail] nvarchar(256) NULL,
        [EmailConfirmed] bit NOT NULL,
        [PasswordHash] nvarchar(max) NULL,
        [SecurityStamp] nvarchar(max) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        [PhoneNumber] nvarchar(max) NULL,
        [PhoneNumberConfirmed] bit NOT NULL,
        [TwoFactorEnabled] bit NOT NULL,
        [LockoutEnd] datetimeoffset NULL,
        [LockoutEnabled] bit NOT NULL,
        [AccessFailedCount] int NOT NULL,
        CONSTRAINT [PK_Usuarios] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [RoleClaims] (
        [Id] int NOT NULL IDENTITY,
        [RoleId] int NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_RoleClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_RoleClaims_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [AuditoriaLogs] (
        [Id] int NOT NULL IDENTITY,
        [UsuarioId] int NULL,
        [UsuarioNombre] nvarchar(150) NOT NULL,
        [Accion] nvarchar(100) NOT NULL,
        [Modulo] nvarchar(50) NOT NULL,
        [EntidadId] nvarchar(50) NULL,
        [Detalle] nvarchar(2000) NULL,
        [IpAddress] nvarchar(45) NULL,
        [Fecha] datetime2 NOT NULL,
        CONSTRAINT [PK_AuditoriaLogs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AuditoriaLogs_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [Configuraciones] (
        [Id] int NOT NULL IDENTITY,
        [Clave] nvarchar(100) NOT NULL,
        [Valor] nvarchar(2000) NOT NULL,
        [Descripcion] nvarchar(500) NULL,
        [Categoria] nvarchar(50) NOT NULL,
        [Editable] bit NOT NULL,
        [ModificadoPorId] int NULL,
        [FechaModificacion] datetime2 NOT NULL,
        CONSTRAINT [PK_Configuraciones] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Configuraciones_Usuarios_ModificadoPorId] FOREIGN KEY ([ModificadoPorId]) REFERENCES [Usuarios] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [EmailLogs] (
        [Id] int NOT NULL IDENTITY,
        [Para] nvarchar(200) NOT NULL,
        [Asunto] nvarchar(500) NOT NULL,
        [Exitoso] bit NOT NULL,
        [Error] nvarchar(2000) NULL,
        [FechaEnvio] datetime2 NOT NULL,
        [Evento] nvarchar(100) NULL,
        [ReferenciaId] int NULL,
        [UsuarioId] int NULL,
        CONSTRAINT [PK_EmailLogs] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_EmailLogs_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [PerfilesConstructor] (
        [Id] int NOT NULL IDENTITY,
        [UsuarioId] int NOT NULL,
        [NombreEmpresa] nvarchar(200) NOT NULL,
        [Bio] nvarchar(2000) NULL,
        [Especialidades] nvarchar(500) NULL,
        [ZonasCobertura] nvarchar(500) NULL,
        [AniosExperiencia] int NOT NULL,
        [CedulaJuridica] nvarchar(50) NULL,
        [SitioWeb] nvarchar(300) NULL,
        [Instagram] nvarchar(150) NULL,
        [Verificado] bit NOT NULL,
        [CalificacionPromedio] decimal(3,2) NOT NULL,
        [TotalProyectos] int NOT NULL,
        [EmailFacturacion] nvarchar(max) NULL,
        [DireccionFiscal] nvarchar(max) NULL,
        [TelefonoFiscal] nvarchar(max) NULL,
        [PrefijoFactura] nvarchar(max) NOT NULL,
        [DiasVencimiento] int NOT NULL,
        [TasaIVA] decimal(18,2) NOT NULL,
        [AplicaIVADefault] bit NOT NULL,
        [TerminosCondiciones] nvarchar(max) NULL,
        [FormasPago] nvarchar(max) NULL,
        [CuentasBancarias] nvarchar(max) NULL,
        CONSTRAINT [PK_PerfilesConstructor] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PerfilesConstructor_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [PerfilesProveedor] (
        [Id] int NOT NULL IDENTITY,
        [UsuarioId] int NOT NULL,
        [NombreComercial] nvarchar(200) NOT NULL,
        [Descripcion] nvarchar(1000) NULL,
        [Direccion] nvarchar(300) NULL,
        [Canton] nvarchar(100) NULL,
        [Provincia] nvarchar(100) NULL,
        [TelefonoNegocio] nvarchar(20) NULL,
        [SitioWeb] nvarchar(300) NULL,
        [HorarioAtencion] nvarchar(200) NULL,
        [Verificado] bit NOT NULL,
        CONSTRAINT [PK_PerfilesProveedor] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PerfilesProveedor_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [Proyectos] (
        [Id] int NOT NULL IDENTITY,
        [ClienteId] int NOT NULL,
        [Titulo] nvarchar(200) NOT NULL,
        [Descripcion] nvarchar(3000) NOT NULL,
        [TipoProyecto] nvarchar(30) NOT NULL,
        [Estado] nvarchar(30) NOT NULL,
        [Canton] nvarchar(100) NULL,
        [Provincia] nvarchar(100) NULL,
        [PresupuestoMax] decimal(18,2) NULL,
        [AreaM2] decimal(10,2) NULL,
        [FechaPublicacion] datetime2 NOT NULL,
        [FechaInicio] datetime2 NULL,
        [FechaFin] datetime2 NULL,
        CONSTRAINT [PK_Proyectos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Proyectos_Usuarios_ClienteId] FOREIGN KEY ([ClienteId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [UsuarioClaims] (
        [Id] int NOT NULL IDENTITY,
        [UserId] int NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_UsuarioClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_UsuarioClaims_Usuarios_UserId] FOREIGN KEY ([UserId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [UsuarioLogins] (
        [LoginProvider] nvarchar(450) NOT NULL,
        [ProviderKey] nvarchar(450) NOT NULL,
        [ProviderDisplayName] nvarchar(max) NULL,
        [UserId] int NOT NULL,
        CONSTRAINT [PK_UsuarioLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
        CONSTRAINT [FK_UsuarioLogins_Usuarios_UserId] FOREIGN KEY ([UserId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [UsuarioPermisos] (
        [Id] int NOT NULL IDENTITY,
        [UsuarioId] int NOT NULL,
        [PermisoCodigo] nvarchar(80) NOT NULL,
        [Concedido] bit NOT NULL,
        [ModificadoPorId] int NULL,
        [Motivo] nvarchar(500) NULL,
        [Fecha] datetime2 NOT NULL,
        CONSTRAINT [PK_UsuarioPermisos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_UsuarioPermisos_Usuarios_ModificadoPorId] FOREIGN KEY ([ModificadoPorId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_UsuarioPermisos_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [UsuarioRoles] (
        [UserId] int NOT NULL,
        [RoleId] int NOT NULL,
        CONSTRAINT [PK_UsuarioRoles] PRIMARY KEY ([UserId], [RoleId]),
        CONSTRAINT [FK_UsuarioRoles_Roles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [Roles] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_UsuarioRoles_Usuarios_UserId] FOREIGN KEY ([UserId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [UsuarioTokens] (
        [UserId] int NOT NULL,
        [LoginProvider] nvarchar(450) NOT NULL,
        [Name] nvarchar(450) NOT NULL,
        [Value] nvarchar(max) NULL,
        CONSTRAINT [PK_UsuarioTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
        CONSTRAINT [FK_UsuarioTokens_Usuarios_UserId] FOREIGN KEY ([UserId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [Empleados] (
        [Id] int NOT NULL IDENTITY,
        [ConstructorId] int NOT NULL,
        [Nombre] nvarchar(150) NOT NULL,
        [Rol] nvarchar(100) NULL,
        [Telefono] nvarchar(20) NULL,
        [Activo] bit NOT NULL,
        CONSTRAINT [PK_Empleados] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Empleados_PerfilesConstructor_ConstructorId] FOREIGN KEY ([ConstructorId]) REFERENCES [PerfilesConstructor] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [PortafolioItems] (
        [Id] int NOT NULL IDENTITY,
        [ConstructorId] int NOT NULL,
        [ImagenUrl] nvarchar(500) NOT NULL,
        [Titulo] nvarchar(200) NOT NULL,
        [Descripcion] nvarchar(1000) NULL,
        [Fecha] datetime2 NOT NULL,
        CONSTRAINT [PK_PortafolioItems] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PortafolioItems_PerfilesConstructor_ConstructorId] FOREIGN KEY ([ConstructorId]) REFERENCES [PerfilesConstructor] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [PreciosMaterial] (
        [Id] int NOT NULL IDENTITY,
        [MaterialId] int NOT NULL,
        [ProveedorId] int NOT NULL,
        [Precio] decimal(18,2) NOT NULL,
        [Moneda] nvarchar(5) NOT NULL,
        [UrlProducto] nvarchar(500) NULL,
        [FechaActualizacion] datetime2 NOT NULL,
        [Disponible] bit NOT NULL,
        CONSTRAINT [PK_PreciosMaterial] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PreciosMaterial_Materiales_MaterialId] FOREIGN KEY ([MaterialId]) REFERENCES [Materiales] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_PreciosMaterial_PerfilesProveedor_ProveedorId] FOREIGN KEY ([ProveedorId]) REFERENCES [PerfilesProveedor] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [Archivos] (
        [Id] int NOT NULL IDENTITY,
        [ProyectoId] int NOT NULL,
        [Url] nvarchar(500) NOT NULL,
        [NombreArchivo] nvarchar(200) NOT NULL,
        [TipoArchivo] nvarchar(30) NOT NULL,
        [Categoria] nvarchar(50) NULL,
        [Descripcion] nvarchar(1000) NULL,
        [SubidoPorId] int NULL,
        [Version] int NOT NULL DEFAULT 1,
        [TamanioBytes] bigint NULL,
        [FechaSubida] datetime2 NOT NULL,
        CONSTRAINT [PK_Archivos] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Archivos_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Archivos_Usuarios_SubidoPorId] FOREIGN KEY ([SubidoPorId]) REFERENCES [Usuarios] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [CotizacionesIA] (
        [Id] int NOT NULL IDENTITY,
        [ProyectoId] int NOT NULL,
        [RangoMinimo] decimal(18,2) NOT NULL,
        [RangoMaximo] decimal(18,2) NOT NULL,
        [ResumenIA] nvarchar(max) NOT NULL,
        [FechaGeneracion] datetime2 NOT NULL,
        [TipoProyectoIA] nvarchar(max) NULL,
        [DuracionEstimada] nvarchar(max) NULL,
        [ManoDeObraJson] nvarchar(max) NULL,
        [RecomendacionesJson] nvarchar(max) NULL,
        [Plan] nvarchar(max) NULL,
        [NombrePlan] nvarchar(max) NULL,
        [GeneradoPorId] int NULL,
        [Version] int NOT NULL DEFAULT 1,
        [Estado] nvarchar(40) NOT NULL DEFAULT N'Activa',
        CONSTRAINT [PK_CotizacionesIA] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CotizacionesIA_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_CotizacionesIA_Usuarios_GeneradoPorId] FOREIGN KEY ([GeneradoPorId]) REFERENCES [Usuarios] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [FasesProyecto] (
        [Id] int NOT NULL IDENTITY,
        [ProyectoId] int NOT NULL,
        [Nombre] nvarchar(300) NOT NULL,
        [Descripcion] nvarchar(2000) NULL,
        [FechaInicio] datetime2 NOT NULL,
        [FechaFin] datetime2 NOT NULL,
        [Estado] nvarchar(20) NOT NULL,
        [PorcentajeCompletado] int NOT NULL,
        [ResponsableId] int NULL,
        [Orden] int NOT NULL,
        [Color] nvarchar(20) NOT NULL DEFAULT N'#1976d2',
        [FechaCreacion] datetime2 NOT NULL,
        [FechaActualizacion] datetime2 NOT NULL,
        CONSTRAINT [PK_FasesProyecto] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_FasesProyecto_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_FasesProyecto_Usuarios_ResponsableId] FOREIGN KEY ([ResponsableId]) REFERENCES [Usuarios] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [MiembrosEquipo] (
        [Id] int NOT NULL IDENTITY,
        [ProyectoId] int NOT NULL,
        [UsuarioId] int NULL,
        [Nombre] nvarchar(200) NOT NULL,
        [Rol] nvarchar(80) NOT NULL,
        [Empresa] nvarchar(200) NULL,
        [Email] nvarchar(200) NULL,
        [Telefono] nvarchar(30) NULL,
        [Responsabilidades] nvarchar(2000) NULL,
        [Permisos] nvarchar(500) NULL,
        [Activo] bit NOT NULL,
        [FechaAsignacion] datetime2 NOT NULL,
        CONSTRAINT [PK_MiembrosEquipo] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MiembrosEquipo_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_MiembrosEquipo_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [Notificaciones] (
        [Id] int NOT NULL IDENTITY,
        [UsuarioId] int NOT NULL,
        [Tipo] nvarchar(50) NOT NULL,
        [Titulo] nvarchar(200) NOT NULL,
        [Mensaje] nvarchar(1000) NOT NULL,
        [UrlDestino] nvarchar(500) NULL,
        [Leida] bit NOT NULL,
        [FechaCreacion] datetime2 NOT NULL,
        [ProyectoId] int NULL,
        CONSTRAINT [PK_Notificaciones] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Notificaciones_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]),
        CONSTRAINT [FK_Notificaciones_Usuarios_UsuarioId] FOREIGN KEY ([UsuarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [OrdenesCambio] (
        [Id] int NOT NULL IDENTITY,
        [ProyectoId] int NOT NULL,
        [SolicitadoPorId] int NOT NULL,
        [AprobadoPorId] int NULL,
        [Titulo] nvarchar(300) NOT NULL,
        [Descripcion] nvarchar(max) NOT NULL,
        [ImpactoEconomico] decimal(18,2) NOT NULL,
        [ImpactoCronogramaDias] int NOT NULL,
        [Estado] nvarchar(20) NOT NULL,
        [Notas] nvarchar(2000) NULL,
        [ArchivoEvidenciaUrl] nvarchar(500) NULL,
        [FechaSolicitud] datetime2 NOT NULL,
        [FechaResolucion] datetime2 NULL,
        CONSTRAINT [PK_OrdenesCambio] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_OrdenesCambio_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_OrdenesCambio_Usuarios_AprobadoPorId] FOREIGN KEY ([AprobadoPorId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_OrdenesCambio_Usuarios_SolicitadoPorId] FOREIGN KEY ([SolicitadoPorId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [PresupuestoPartidas] (
        [Id] int NOT NULL IDENTITY,
        [ProyectoId] int NOT NULL,
        [Nombre] nvarchar(300) NOT NULL,
        [Categoria] nvarchar(50) NOT NULL,
        [PresupuestoEstimado] decimal(18,2) NOT NULL,
        [Descripcion] nvarchar(1000) NULL,
        CONSTRAINT [PK_PresupuestoPartidas] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PresupuestoPartidas_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [Propuestas] (
        [Id] int NOT NULL IDENTITY,
        [ProyectoId] int NOT NULL,
        [ConstructorId] int NOT NULL,
        [MontoTotal] decimal(18,2) NOT NULL,
        [Descripcion] nvarchar(3000) NOT NULL,
        [Incluye] nvarchar(2000) NULL,
        [PlazoEstimadoDias] int NOT NULL,
        [Estado] nvarchar(20) NOT NULL,
        [ArchivoUrl] nvarchar(500) NULL,
        [FechaEnvio] datetime2 NOT NULL,
        [FechaRespuesta] datetime2 NULL,
        CONSTRAINT [PK_Propuestas] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Propuestas_PerfilesConstructor_ConstructorId] FOREIGN KEY ([ConstructorId]) REFERENCES [PerfilesConstructor] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Propuestas_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [AsignacionesEmpleado] (
        [Id] int NOT NULL IDENTITY,
        [EmpleadoId] int NOT NULL,
        [ProyectoId] int NOT NULL,
        [Notas] nvarchar(500) NULL,
        [FechaAsignacion] datetime2 NOT NULL,
        CONSTRAINT [PK_AsignacionesEmpleado] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AsignacionesEmpleado_Empleados_EmpleadoId] FOREIGN KEY ([EmpleadoId]) REFERENCES [Empleados] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AsignacionesEmpleado_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [LineasCotizacion] (
        [Id] int NOT NULL IDENTITY,
        [CotizacionIAId] int NOT NULL,
        [Descripcion] nvarchar(300) NOT NULL,
        [Categoria] nvarchar(30) NOT NULL,
        [Cantidad] decimal(18,3) NOT NULL,
        [Unidad] nvarchar(50) NOT NULL,
        [PrecioUnitario] decimal(18,2) NOT NULL,
        [PrecioTotal] decimal(18,2) NOT NULL,
        [EsManoDeObra] bit NOT NULL,
        CONSTRAINT [PK_LineasCotizacion] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_LineasCotizacion_CotizacionesIA_CotizacionIAId] FOREIGN KEY ([CotizacionIAId]) REFERENCES [CotizacionesIA] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [AvancesObra] (
        [Id] int NOT NULL IDENTITY,
        [ProyectoId] int NOT NULL,
        [ConstructorId] int NOT NULL,
        [Titulo] nvarchar(300) NOT NULL,
        [Descripcion] nvarchar(3000) NOT NULL,
        [Responsable] nvarchar(200) NULL,
        [PorcentajeAvance] int NOT NULL DEFAULT 0,
        [Fecha] datetime2 NOT NULL,
        [FaseId] int NULL,
        CONSTRAINT [PK_AvancesObra] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AvancesObra_FasesProyecto_FaseId] FOREIGN KEY ([FaseId]) REFERENCES [FasesProyecto] ([Id]),
        CONSTRAINT [FK_AvancesObra_PerfilesConstructor_ConstructorId] FOREIGN KEY ([ConstructorId]) REFERENCES [PerfilesConstructor] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_AvancesObra_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [TareasFase] (
        [Id] int NOT NULL IDENTITY,
        [FaseId] int NOT NULL,
        [Nombre] nvarchar(300) NOT NULL,
        [Descripcion] nvarchar(2000) NULL,
        [FechaInicio] datetime2 NULL,
        [FechaFin] datetime2 NULL,
        [Estado] nvarchar(20) NOT NULL,
        [ResponsableId] int NULL,
        [Orden] int NOT NULL,
        [Completada] bit NOT NULL,
        CONSTRAINT [PK_TareasFase] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_TareasFase_FasesProyecto_FaseId] FOREIGN KEY ([FaseId]) REFERENCES [FasesProyecto] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_TareasFase_Usuarios_ResponsableId] FOREIGN KEY ([ResponsableId]) REFERENCES [Usuarios] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [GastosObra] (
        [Id] int NOT NULL IDENTITY,
        [ProyectoId] int NOT NULL,
        [PartidaId] int NULL,
        [RegistradoPorId] int NOT NULL,
        [Descripcion] nvarchar(500) NOT NULL,
        [Categoria] nvarchar(50) NOT NULL,
        [Monto] decimal(18,2) NOT NULL,
        [Fecha] datetime2 NOT NULL,
        [Referencia] nvarchar(200) NULL,
        CONSTRAINT [PK_GastosObra] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_GastosObra_PresupuestoPartidas_PartidaId] FOREIGN KEY ([PartidaId]) REFERENCES [PresupuestoPartidas] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_GastosObra_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]),
        CONSTRAINT [FK_GastosObra_Usuarios_RegistradoPorId] FOREIGN KEY ([RegistradoPorId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [Calificaciones] (
        [Id] int NOT NULL IDENTITY,
        [ProyectoId] int NOT NULL,
        [PropuestaId] int NULL,
        [EvaluadorId] int NOT NULL,
        [EvaluadoId] int NOT NULL,
        [Puntuacion] int NOT NULL,
        [Comentario] nvarchar(1000) NULL,
        [RespuestaComentario] nvarchar(1000) NULL,
        [Fecha] datetime2 NOT NULL,
        CONSTRAINT [PK_Calificaciones] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Calificaciones_Propuestas_PropuestaId] FOREIGN KEY ([PropuestaId]) REFERENCES [Propuestas] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Calificaciones_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Calificaciones_Usuarios_EvaluadoId] FOREIGN KEY ([EvaluadoId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Calificaciones_Usuarios_EvaluadorId] FOREIGN KEY ([EvaluadorId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [CartasAceptacion] (
        [Id] int NOT NULL IDENTITY,
        [ProyectoId] int NOT NULL,
        [PropuestaId] int NOT NULL,
        [ObservacionesCliente] nvarchar(3000) NULL,
        [Aceptado] bit NOT NULL,
        [FechaEmision] datetime2 NOT NULL,
        [FechaAceptacion] datetime2 NULL,
        CONSTRAINT [PK_CartasAceptacion] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CartasAceptacion_Propuestas_PropuestaId] FOREIGN KEY ([PropuestaId]) REFERENCES [Propuestas] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_CartasAceptacion_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [Facturas] (
        [Id] int NOT NULL IDENTITY,
        [ProyectoId] int NOT NULL,
        [PropuestaId] int NULL,
        [ConstructorId] int NOT NULL,
        [Numero] nvarchar(30) NOT NULL,
        [Concepto] nvarchar(500) NULL,
        [Notas] nvarchar(2000) NULL,
        [FechaEmision] datetime2 NOT NULL,
        [FechaVencimiento] datetime2 NULL,
        [MontoTotal] decimal(18,2) NOT NULL,
        [MontoPagado] decimal(18,2) NOT NULL,
        [Estado] nvarchar(20) NOT NULL,
        [LineasJson] nvarchar(max) NULL,
        [AplicaIVA] bit NOT NULL,
        [MontoIVA] decimal(18,2) NOT NULL,
        [MontoDescuento] decimal(18,2) NOT NULL,
        [FechaEnvioEmail] datetime2 NULL,
        [FechaEnvioChat] datetime2 NULL,
        CONSTRAINT [PK_Facturas] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Facturas_PerfilesConstructor_ConstructorId] FOREIGN KEY ([ConstructorId]) REFERENCES [PerfilesConstructor] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Facturas_Propuestas_PropuestaId] FOREIGN KEY ([PropuestaId]) REFERENCES [Propuestas] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Facturas_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [Mensajes] (
        [Id] int NOT NULL IDENTITY,
        [ProyectoId] int NOT NULL,
        [PropuestaId] int NULL,
        [RemitenteId] int NOT NULL,
        [DestinatarioId] int NULL,
        [Contenido] nvarchar(4000) NOT NULL,
        [AdjuntoUrl] nvarchar(max) NULL,
        [AdjuntoNombre] nvarchar(200) NULL,
        [Canal] nvarchar(20) NOT NULL DEFAULT N'General',
        [Leido] bit NOT NULL,
        [FechaEnvio] datetime2 NOT NULL,
        CONSTRAINT [PK_Mensajes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Mensajes_Propuestas_PropuestaId] FOREIGN KEY ([PropuestaId]) REFERENCES [Propuestas] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Mensajes_Proyectos_ProyectoId] FOREIGN KEY ([ProyectoId]) REFERENCES [Proyectos] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Mensajes_Usuarios_DestinatarioId] FOREIGN KEY ([DestinatarioId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Mensajes_Usuarios_RemitenteId] FOREIGN KEY ([RemitenteId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [FotosAvance] (
        [Id] int NOT NULL IDENTITY,
        [AvanceObraId] int NOT NULL,
        [Url] nvarchar(500) NOT NULL,
        [NombreArchivo] nvarchar(200) NOT NULL,
        [Tipo] nvarchar(20) NOT NULL,
        [TamanioBytes] bigint NULL,
        [FechaSubida] datetime2 NOT NULL,
        CONSTRAINT [PK_FotosAvance] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_FotosAvance_AvancesObra_AvanceObraId] FOREIGN KEY ([AvanceObraId]) REFERENCES [AvancesObra] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE TABLE [PagosFactura] (
        [Id] int NOT NULL IDENTITY,
        [FacturaId] int NOT NULL,
        [Monto] decimal(18,2) NOT NULL,
        [Fecha] datetime2 NOT NULL,
        [MetodoPago] nvarchar(20) NOT NULL,
        [Referencia] nvarchar(200) NULL,
        [Notas] nvarchar(500) NULL,
        CONSTRAINT [PK_PagosFactura] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PagosFactura_Facturas_FacturaId] FOREIGN KEY ([FacturaId]) REFERENCES [Facturas] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Archivos_ProyectoId] ON [Archivos] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Archivos_SubidoPorId] ON [Archivos] ([SubidoPorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE UNIQUE INDEX [IX_AsignacionesEmpleado_EmpleadoId_ProyectoId] ON [AsignacionesEmpleado] ([EmpleadoId], [ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_AsignacionesEmpleado_ProyectoId] ON [AsignacionesEmpleado] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_AuditoriaLogs_UsuarioId] ON [AuditoriaLogs] ([UsuarioId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_AvancesObra_ConstructorId] ON [AvancesObra] ([ConstructorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_AvancesObra_FaseId] ON [AvancesObra] ([FaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_AvancesObra_ProyectoId] ON [AvancesObra] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Calificaciones_EvaluadoId] ON [Calificaciones] ([EvaluadoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Calificaciones_EvaluadorId] ON [Calificaciones] ([EvaluadorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Calificaciones_PropuestaId] ON [Calificaciones] ([PropuestaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Calificaciones_ProyectoId] ON [Calificaciones] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_CartasAceptacion_PropuestaId] ON [CartasAceptacion] ([PropuestaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CartasAceptacion_ProyectoId] ON [CartasAceptacion] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Configuraciones_Clave] ON [Configuraciones] ([Clave]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Configuraciones_ModificadoPorId] ON [Configuraciones] ([ModificadoPorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_CotizacionesIA_Estado] ON [CotizacionesIA] ([Estado]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_CotizacionesIA_FechaGeneracion] ON [CotizacionesIA] ([FechaGeneracion]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_CotizacionesIA_GeneradoPorId] ON [CotizacionesIA] ([GeneradoPorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_CotizacionesIA_ProyectoId] ON [CotizacionesIA] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_EmailLogs_Exitoso] ON [EmailLogs] ([Exitoso]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_EmailLogs_FechaEnvio] ON [EmailLogs] ([FechaEnvio]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_EmailLogs_UsuarioId] ON [EmailLogs] ([UsuarioId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Empleados_ConstructorId] ON [Empleados] ([ConstructorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Facturas_ConstructorId] ON [Facturas] ([ConstructorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Facturas_PropuestaId] ON [Facturas] ([PropuestaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Facturas_ProyectoId] ON [Facturas] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_FasesProyecto_ProyectoId] ON [FasesProyecto] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_FasesProyecto_ResponsableId] ON [FasesProyecto] ([ResponsableId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_FotosAvance_AvanceObraId] ON [FotosAvance] ([AvanceObraId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_GastosObra_PartidaId] ON [GastosObra] ([PartidaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_GastosObra_ProyectoId] ON [GastosObra] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_GastosObra_RegistradoPorId] ON [GastosObra] ([RegistradoPorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_LineasCotizacion_CotizacionIAId] ON [LineasCotizacion] ([CotizacionIAId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Mensajes_DestinatarioId] ON [Mensajes] ([DestinatarioId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Mensajes_PropuestaId] ON [Mensajes] ([PropuestaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Mensajes_ProyectoId] ON [Mensajes] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Mensajes_RemitenteId] ON [Mensajes] ([RemitenteId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_MiembrosEquipo_ProyectoId] ON [MiembrosEquipo] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_MiembrosEquipo_UsuarioId] ON [MiembrosEquipo] ([UsuarioId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Notificaciones_FechaCreacion] ON [Notificaciones] ([FechaCreacion]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Notificaciones_ProyectoId] ON [Notificaciones] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Notificaciones_UsuarioId_Leida] ON [Notificaciones] ([UsuarioId], [Leida]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_OrdenesCambio_AprobadoPorId] ON [OrdenesCambio] ([AprobadoPorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_OrdenesCambio_ProyectoId] ON [OrdenesCambio] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_OrdenesCambio_SolicitadoPorId] ON [OrdenesCambio] ([SolicitadoPorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_PagosFactura_FacturaId] ON [PagosFactura] ([FacturaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PerfilesConstructor_UsuarioId] ON [PerfilesConstructor] ([UsuarioId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE UNIQUE INDEX [IX_PerfilesProveedor_UsuarioId] ON [PerfilesProveedor] ([UsuarioId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_PortafolioItems_ConstructorId] ON [PortafolioItems] ([ConstructorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_PreciosMaterial_MaterialId] ON [PreciosMaterial] ([MaterialId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_PreciosMaterial_ProveedorId] ON [PreciosMaterial] ([ProveedorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_PresupuestoPartidas_ProyectoId] ON [PresupuestoPartidas] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Propuestas_ConstructorId] ON [Propuestas] ([ConstructorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Propuestas_ProyectoId] ON [Propuestas] ([ProyectoId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_Proyectos_ClienteId] ON [Proyectos] ([ClienteId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_RoleClaims_RoleId] ON [RoleClaims] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [RoleNameIndex] ON [Roles] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE UNIQUE INDEX [IX_RolPermisos_Rol_PermisoCodigo] ON [RolPermisos] ([Rol], [PermisoCodigo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_TareasFase_FaseId] ON [TareasFase] ([FaseId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_TareasFase_ResponsableId] ON [TareasFase] ([ResponsableId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_UsuarioClaims_UserId] ON [UsuarioClaims] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_UsuarioLogins_UserId] ON [UsuarioLogins] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_UsuarioPermisos_ModificadoPorId] ON [UsuarioPermisos] ([ModificadoPorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE UNIQUE INDEX [IX_UsuarioPermisos_UsuarioId_PermisoCodigo] ON [UsuarioPermisos] ([UsuarioId], [PermisoCodigo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [IX_UsuarioRoles_RoleId] ON [UsuarioRoles] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    CREATE INDEX [EmailIndex] ON [Usuarios] ([NormalizedEmail]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UserNameIndex] ON [Usuarios] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260731032104_InitialSqlServer'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260731032104_InitialSqlServer', N'10.0.8');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806193408_AddInvitaciones'
)
BEGIN
    CREATE TABLE [Invitaciones] (
        [Id] int NOT NULL IDENTITY,
        [Email] nvarchar(200) NOT NULL,
        [RolWorkspace] nvarchar(50) NOT NULL,
        [Token] nvarchar(100) NOT NULL,
        [EmpresaId] int NOT NULL,
        [InvitadoPorId] int NOT NULL,
        [FechaCreacion] datetime2 NOT NULL,
        [FechaExpiracion] datetime2 NOT NULL,
        [Estado] nvarchar(20) NOT NULL,
        [FechaAceptacion] datetime2 NULL,
        [AceptadoPorId] int NULL,
        CONSTRAINT [PK_Invitaciones] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Invitaciones_PerfilesConstructor_EmpresaId] FOREIGN KEY ([EmpresaId]) REFERENCES [PerfilesConstructor] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_Invitaciones_Usuarios_AceptadoPorId] FOREIGN KEY ([AceptadoPorId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Invitaciones_Usuarios_InvitadoPorId] FOREIGN KEY ([InvitadoPorId]) REFERENCES [Usuarios] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806193408_AddInvitaciones'
)
BEGIN
    CREATE INDEX [IX_Invitaciones_AceptadoPorId] ON [Invitaciones] ([AceptadoPorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806193408_AddInvitaciones'
)
BEGIN
    CREATE INDEX [IX_Invitaciones_EmpresaId] ON [Invitaciones] ([EmpresaId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806193408_AddInvitaciones'
)
BEGIN
    CREATE INDEX [IX_Invitaciones_InvitadoPorId] ON [Invitaciones] ([InvitadoPorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806193408_AddInvitaciones'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Invitaciones_Token] ON [Invitaciones] ([Token]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260806193408_AddInvitaciones'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260806193408_AddInvitaciones', N'10.0.8');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807042523_AddInvitacionTipoCampos'
)
BEGIN
    ALTER TABLE [Invitaciones] ADD [Tipo] nvarchar(20) NOT NULL DEFAULT N'Invitacion';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807042523_AddInvitacionTipoCampos'
)
BEGIN
    ALTER TABLE [Invitaciones] ADD [UsuarioCreadorId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807042523_AddInvitacionTipoCampos'
)
BEGIN
    CREATE INDEX [IX_Invitaciones_UsuarioCreadorId] ON [Invitaciones] ([UsuarioCreadorId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807042523_AddInvitacionTipoCampos'
)
BEGIN
    ALTER TABLE [Invitaciones] ADD CONSTRAINT [FK_Invitaciones_Usuarios_UsuarioCreadorId] FOREIGN KEY ([UsuarioCreadorId]) REFERENCES [Usuarios] ([Id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807042523_AddInvitacionTipoCampos'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260807042523_AddInvitacionTipoCampos', N'10.0.8');
END;

COMMIT;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807043536_AddUsuarioEstadoCuenta'
)
BEGIN
    ALTER TABLE [Usuarios] ADD [EstadoCuenta] nvarchar(20) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807043536_AddUsuarioEstadoCuenta'
)
BEGIN
    ALTER TABLE [Usuarios] ADD [MotivoRegistro] nvarchar(1000) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260807043536_AddUsuarioEstadoCuenta'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260807043536_AddUsuarioEstadoCuenta', N'10.0.8');
END;

COMMIT;
GO


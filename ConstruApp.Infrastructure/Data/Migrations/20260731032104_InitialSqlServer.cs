using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConstruApp.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialSqlServer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Materiales",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    UnidadMedida = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Categoria = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    CodigoProducto = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Materiales", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RolPermisos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Rol = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    PermisoCodigo = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RolPermisos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Telefono = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    AvatarUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Rol = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Activo = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UltimoAcceso = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SecurityStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoleClaims_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AuditoriaLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: true),
                    UsuarioNombre = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Accion = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Modulo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    EntidadId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Detalle = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    IpAddress = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditoriaLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AuditoriaLogs_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Configuraciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Clave = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Valor = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Categoria = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Editable = table.Column<bool>(type: "bit", nullable: false),
                    ModificadoPorId = table.Column<int>(type: "int", nullable: true),
                    FechaModificacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Configuraciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Configuraciones_Usuarios_ModificadoPorId",
                        column: x => x.ModificadoPorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "EmailLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Para = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Asunto = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Exitoso = table.Column<bool>(type: "bit", nullable: false),
                    Error = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    FechaEnvio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Evento = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ReferenciaId = table.Column<int>(type: "int", nullable: true),
                    UsuarioId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmailLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmailLogs_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PerfilesConstructor",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    NombreEmpresa = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Bio = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Especialidades = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ZonasCobertura = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    AniosExperiencia = table.Column<int>(type: "int", nullable: false),
                    CedulaJuridica = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    SitioWeb = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Instagram = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    Verificado = table.Column<bool>(type: "bit", nullable: false),
                    CalificacionPromedio = table.Column<decimal>(type: "decimal(3,2)", nullable: false),
                    TotalProyectos = table.Column<int>(type: "int", nullable: false),
                    EmailFacturacion = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DireccionFiscal = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TelefonoFiscal = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PrefijoFactura = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DiasVencimiento = table.Column<int>(type: "int", nullable: false),
                    TasaIVA = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AplicaIVADefault = table.Column<bool>(type: "bit", nullable: false),
                    TerminosCondiciones = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FormasPago = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CuentasBancarias = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PerfilesConstructor", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PerfilesConstructor_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PerfilesProveedor",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    NombreComercial = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Direccion = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    Canton = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Provincia = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    TelefonoNegocio = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    SitioWeb = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    HorarioAtencion = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Verificado = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PerfilesProveedor", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PerfilesProveedor_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Proyectos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClienteId = table.Column<int>(type: "int", nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: false),
                    TipoProyecto = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Canton = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Provincia = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PresupuestoMax = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    AreaM2 = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    FechaPublicacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaFin = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Proyectos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Proyectos_Usuarios_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UsuarioClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UsuarioClaims_Usuarios_UserId",
                        column: x => x.UserId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UsuarioLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_UsuarioLogins_Usuarios_UserId",
                        column: x => x.UserId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UsuarioPermisos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    PermisoCodigo = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Concedido = table.Column<bool>(type: "bit", nullable: false),
                    ModificadoPorId = table.Column<int>(type: "int", nullable: true),
                    Motivo = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioPermisos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UsuarioPermisos_Usuarios_ModificadoPorId",
                        column: x => x.ModificadoPorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UsuarioPermisos_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "UsuarioRoles",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    RoleId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_UsuarioRoles_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UsuarioRoles_Usuarios_UserId",
                        column: x => x.UserId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UsuarioTokens",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuarioTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_UsuarioTokens_Usuarios_UserId",
                        column: x => x.UserId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Empleados",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConstructorId = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Rol = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Telefono = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Empleados", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Empleados_PerfilesConstructor_ConstructorId",
                        column: x => x.ConstructorId,
                        principalTable: "PerfilesConstructor",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PortafolioItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ConstructorId = table.Column<int>(type: "int", nullable: false),
                    ImagenUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PortafolioItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PortafolioItems_PerfilesConstructor_ConstructorId",
                        column: x => x.ConstructorId,
                        principalTable: "PerfilesConstructor",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PreciosMaterial",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaterialId = table.Column<int>(type: "int", nullable: false),
                    ProveedorId = table.Column<int>(type: "int", nullable: false),
                    Precio = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Moneda = table.Column<string>(type: "nvarchar(5)", maxLength: 5, nullable: false),
                    UrlProducto = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Disponible = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PreciosMaterial", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PreciosMaterial_Materiales_MaterialId",
                        column: x => x.MaterialId,
                        principalTable: "Materiales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PreciosMaterial_PerfilesProveedor_ProveedorId",
                        column: x => x.ProveedorId,
                        principalTable: "PerfilesProveedor",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Archivos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    NombreArchivo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    TipoArchivo = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Categoria = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Descripcion = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    SubidoPorId = table.Column<int>(type: "int", nullable: true),
                    Version = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    TamanioBytes = table.Column<long>(type: "bigint", nullable: true),
                    FechaSubida = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Archivos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Archivos_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Archivos_Usuarios_SubidoPorId",
                        column: x => x.SubidoPorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "CotizacionesIA",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    RangoMinimo = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RangoMaximo = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ResumenIA = table.Column<string>(type: "nvarchar(max)", maxLength: 5000, nullable: false),
                    FechaGeneracion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TipoProyectoIA = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DuracionEstimada = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ManoDeObraJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RecomendacionesJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Plan = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    NombrePlan = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GeneradoPorId = table.Column<int>(type: "int", nullable: true),
                    Version = table.Column<int>(type: "int", nullable: false, defaultValue: 1),
                    Estado = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false, defaultValue: "Activa")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CotizacionesIA", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CotizacionesIA_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CotizacionesIA_Usuarios_GeneradoPorId",
                        column: x => x.GeneradoPorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "FasesProyecto",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaFin = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PorcentajeCompletado = table.Column<int>(type: "int", nullable: false),
                    ResponsableId = table.Column<int>(type: "int", nullable: true),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    Color = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "#1976d2"),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaActualizacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FasesProyecto", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FasesProyecto_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FasesProyecto_Usuarios_ResponsableId",
                        column: x => x.ResponsableId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "MiembrosEquipo",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    UsuarioId = table.Column<int>(type: "int", nullable: true),
                    Nombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Rol = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    Empresa = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Telefono = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Responsabilidades = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Permisos = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Activo = table.Column<bool>(type: "bit", nullable: false),
                    FechaAsignacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MiembrosEquipo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MiembrosEquipo_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MiembrosEquipo_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Notificaciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Mensaje = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    UrlDestino = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Leida = table.Column<bool>(type: "bit", nullable: false),
                    FechaCreacion = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProyectoId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notificaciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notificaciones_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Notificaciones_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OrdenesCambio",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    SolicitadoPorId = table.Column<int>(type: "int", nullable: false),
                    AprobadoPorId = table.Column<int>(type: "int", nullable: true),
                    Titulo = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", maxLength: 5000, nullable: false),
                    ImpactoEconomico = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ImpactoCronogramaDias = table.Column<int>(type: "int", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Notas = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    ArchivoEvidenciaUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FechaSolicitud = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaResolucion = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OrdenesCambio", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OrdenesCambio_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_OrdenesCambio_Usuarios_AprobadoPorId",
                        column: x => x.AprobadoPorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_OrdenesCambio_Usuarios_SolicitadoPorId",
                        column: x => x.SolicitadoPorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PresupuestoPartidas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Categoria = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PresupuestoEstimado = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PresupuestoPartidas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PresupuestoPartidas_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Propuestas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    ConstructorId = table.Column<int>(type: "int", nullable: false),
                    MontoTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: false),
                    Incluye = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    PlazoEstimadoDias = table.Column<int>(type: "int", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ArchivoUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FechaEnvio = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaRespuesta = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Propuestas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Propuestas_PerfilesConstructor_ConstructorId",
                        column: x => x.ConstructorId,
                        principalTable: "PerfilesConstructor",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Propuestas_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AsignacionesEmpleado",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EmpleadoId = table.Column<int>(type: "int", nullable: false),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    Notas = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    FechaAsignacion = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AsignacionesEmpleado", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AsignacionesEmpleado_Empleados_EmpleadoId",
                        column: x => x.EmpleadoId,
                        principalTable: "Empleados",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AsignacionesEmpleado_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LineasCotizacion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CotizacionIAId = table.Column<int>(type: "int", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Categoria = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Cantidad = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    Unidad = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PrecioTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    EsManoDeObra = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LineasCotizacion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LineasCotizacion_CotizacionesIA_CotizacionIAId",
                        column: x => x.CotizacionIAId,
                        principalTable: "CotizacionesIA",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AvancesObra",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    ConstructorId = table.Column<int>(type: "int", nullable: false),
                    Titulo = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: false),
                    Responsable = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    PorcentajeAvance = table.Column<int>(type: "int", nullable: false, defaultValue: 0),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FaseId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AvancesObra", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AvancesObra_FasesProyecto_FaseId",
                        column: x => x.FaseId,
                        principalTable: "FasesProyecto",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_AvancesObra_PerfilesConstructor_ConstructorId",
                        column: x => x.ConstructorId,
                        principalTable: "PerfilesConstructor",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AvancesObra_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TareasFase",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FaseId = table.Column<int>(type: "int", nullable: false),
                    Nombre = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    FechaInicio = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaFin = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ResponsableId = table.Column<int>(type: "int", nullable: true),
                    Orden = table.Column<int>(type: "int", nullable: false),
                    Completada = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TareasFase", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TareasFase_FasesProyecto_FaseId",
                        column: x => x.FaseId,
                        principalTable: "FasesProyecto",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TareasFase_Usuarios_ResponsableId",
                        column: x => x.ResponsableId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "GastosObra",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    PartidaId = table.Column<int>(type: "int", nullable: true),
                    RegistradoPorId = table.Column<int>(type: "int", nullable: false),
                    Descripcion = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Categoria = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Monto = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Referencia = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GastosObra", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GastosObra_PresupuestoPartidas_PartidaId",
                        column: x => x.PartidaId,
                        principalTable: "PresupuestoPartidas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_GastosObra_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_GastosObra_Usuarios_RegistradoPorId",
                        column: x => x.RegistradoPorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Calificaciones",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    PropuestaId = table.Column<int>(type: "int", nullable: true),
                    EvaluadorId = table.Column<int>(type: "int", nullable: false),
                    EvaluadoId = table.Column<int>(type: "int", nullable: false),
                    Puntuacion = table.Column<int>(type: "int", nullable: false),
                    Comentario = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    RespuestaComentario = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Calificaciones", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Calificaciones_Propuestas_PropuestaId",
                        column: x => x.PropuestaId,
                        principalTable: "Propuestas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Calificaciones_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Calificaciones_Usuarios_EvaluadoId",
                        column: x => x.EvaluadoId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Calificaciones_Usuarios_EvaluadorId",
                        column: x => x.EvaluadorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CartasAceptacion",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    PropuestaId = table.Column<int>(type: "int", nullable: false),
                    ObservacionesCliente = table.Column<string>(type: "nvarchar(3000)", maxLength: 3000, nullable: true),
                    Aceptado = table.Column<bool>(type: "bit", nullable: false),
                    FechaEmision = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaAceptacion = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CartasAceptacion", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CartasAceptacion_Propuestas_PropuestaId",
                        column: x => x.PropuestaId,
                        principalTable: "Propuestas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CartasAceptacion_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Facturas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    PropuestaId = table.Column<int>(type: "int", nullable: true),
                    ConstructorId = table.Column<int>(type: "int", nullable: false),
                    Numero = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Concepto = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Notas = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    FechaEmision = table.Column<DateTime>(type: "datetime2", nullable: false),
                    FechaVencimiento = table.Column<DateTime>(type: "datetime2", nullable: true),
                    MontoTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MontoPagado = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Estado = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    LineasJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AplicaIVA = table.Column<bool>(type: "bit", nullable: false),
                    MontoIVA = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MontoDescuento = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FechaEnvioEmail = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FechaEnvioChat = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Facturas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Facturas_PerfilesConstructor_ConstructorId",
                        column: x => x.ConstructorId,
                        principalTable: "PerfilesConstructor",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Facturas_Propuestas_PropuestaId",
                        column: x => x.PropuestaId,
                        principalTable: "Propuestas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Facturas_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Mensajes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProyectoId = table.Column<int>(type: "int", nullable: false),
                    PropuestaId = table.Column<int>(type: "int", nullable: true),
                    RemitenteId = table.Column<int>(type: "int", nullable: false),
                    DestinatarioId = table.Column<int>(type: "int", nullable: true),
                    Contenido = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    AdjuntoUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AdjuntoNombre = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Canal = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "General"),
                    Leido = table.Column<bool>(type: "bit", nullable: false),
                    FechaEnvio = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Mensajes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Mensajes_Propuestas_PropuestaId",
                        column: x => x.PropuestaId,
                        principalTable: "Propuestas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Mensajes_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Mensajes_Usuarios_DestinatarioId",
                        column: x => x.DestinatarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Mensajes_Usuarios_RemitenteId",
                        column: x => x.RemitenteId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FotosAvance",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AvanceObraId = table.Column<int>(type: "int", nullable: false),
                    Url = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    NombreArchivo = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Tipo = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    TamanioBytes = table.Column<long>(type: "bigint", nullable: true),
                    FechaSubida = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FotosAvance", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FotosAvance_AvancesObra_AvanceObraId",
                        column: x => x.AvanceObraId,
                        principalTable: "AvancesObra",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PagosFactura",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FacturaId = table.Column<int>(type: "int", nullable: false),
                    Monto = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Fecha = table.Column<DateTime>(type: "datetime2", nullable: false),
                    MetodoPago = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Referencia = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Notas = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PagosFactura", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PagosFactura_Facturas_FacturaId",
                        column: x => x.FacturaId,
                        principalTable: "Facturas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Archivos_ProyectoId",
                table: "Archivos",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_Archivos_SubidoPorId",
                table: "Archivos",
                column: "SubidoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_AsignacionesEmpleado_EmpleadoId_ProyectoId",
                table: "AsignacionesEmpleado",
                columns: new[] { "EmpleadoId", "ProyectoId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AsignacionesEmpleado_ProyectoId",
                table: "AsignacionesEmpleado",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_AuditoriaLogs_UsuarioId",
                table: "AuditoriaLogs",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_AvancesObra_ConstructorId",
                table: "AvancesObra",
                column: "ConstructorId");

            migrationBuilder.CreateIndex(
                name: "IX_AvancesObra_FaseId",
                table: "AvancesObra",
                column: "FaseId");

            migrationBuilder.CreateIndex(
                name: "IX_AvancesObra_ProyectoId",
                table: "AvancesObra",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_Calificaciones_EvaluadoId",
                table: "Calificaciones",
                column: "EvaluadoId");

            migrationBuilder.CreateIndex(
                name: "IX_Calificaciones_EvaluadorId",
                table: "Calificaciones",
                column: "EvaluadorId");

            migrationBuilder.CreateIndex(
                name: "IX_Calificaciones_PropuestaId",
                table: "Calificaciones",
                column: "PropuestaId");

            migrationBuilder.CreateIndex(
                name: "IX_Calificaciones_ProyectoId",
                table: "Calificaciones",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_CartasAceptacion_PropuestaId",
                table: "CartasAceptacion",
                column: "PropuestaId");

            migrationBuilder.CreateIndex(
                name: "IX_CartasAceptacion_ProyectoId",
                table: "CartasAceptacion",
                column: "ProyectoId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Configuraciones_Clave",
                table: "Configuraciones",
                column: "Clave",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Configuraciones_ModificadoPorId",
                table: "Configuraciones",
                column: "ModificadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_CotizacionesIA_Estado",
                table: "CotizacionesIA",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_CotizacionesIA_FechaGeneracion",
                table: "CotizacionesIA",
                column: "FechaGeneracion");

            migrationBuilder.CreateIndex(
                name: "IX_CotizacionesIA_GeneradoPorId",
                table: "CotizacionesIA",
                column: "GeneradoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_CotizacionesIA_ProyectoId",
                table: "CotizacionesIA",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_EmailLogs_Exitoso",
                table: "EmailLogs",
                column: "Exitoso");

            migrationBuilder.CreateIndex(
                name: "IX_EmailLogs_FechaEnvio",
                table: "EmailLogs",
                column: "FechaEnvio");

            migrationBuilder.CreateIndex(
                name: "IX_EmailLogs_UsuarioId",
                table: "EmailLogs",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Empleados_ConstructorId",
                table: "Empleados",
                column: "ConstructorId");

            migrationBuilder.CreateIndex(
                name: "IX_Facturas_ConstructorId",
                table: "Facturas",
                column: "ConstructorId");

            migrationBuilder.CreateIndex(
                name: "IX_Facturas_PropuestaId",
                table: "Facturas",
                column: "PropuestaId");

            migrationBuilder.CreateIndex(
                name: "IX_Facturas_ProyectoId",
                table: "Facturas",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_FasesProyecto_ProyectoId",
                table: "FasesProyecto",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_FasesProyecto_ResponsableId",
                table: "FasesProyecto",
                column: "ResponsableId");

            migrationBuilder.CreateIndex(
                name: "IX_FotosAvance_AvanceObraId",
                table: "FotosAvance",
                column: "AvanceObraId");

            migrationBuilder.CreateIndex(
                name: "IX_GastosObra_PartidaId",
                table: "GastosObra",
                column: "PartidaId");

            migrationBuilder.CreateIndex(
                name: "IX_GastosObra_ProyectoId",
                table: "GastosObra",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_GastosObra_RegistradoPorId",
                table: "GastosObra",
                column: "RegistradoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_LineasCotizacion_CotizacionIAId",
                table: "LineasCotizacion",
                column: "CotizacionIAId");

            migrationBuilder.CreateIndex(
                name: "IX_Mensajes_DestinatarioId",
                table: "Mensajes",
                column: "DestinatarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Mensajes_PropuestaId",
                table: "Mensajes",
                column: "PropuestaId");

            migrationBuilder.CreateIndex(
                name: "IX_Mensajes_ProyectoId",
                table: "Mensajes",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_Mensajes_RemitenteId",
                table: "Mensajes",
                column: "RemitenteId");

            migrationBuilder.CreateIndex(
                name: "IX_MiembrosEquipo_ProyectoId",
                table: "MiembrosEquipo",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_MiembrosEquipo_UsuarioId",
                table: "MiembrosEquipo",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Notificaciones_FechaCreacion",
                table: "Notificaciones",
                column: "FechaCreacion");

            migrationBuilder.CreateIndex(
                name: "IX_Notificaciones_ProyectoId",
                table: "Notificaciones",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_Notificaciones_UsuarioId_Leida",
                table: "Notificaciones",
                columns: new[] { "UsuarioId", "Leida" });

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesCambio_AprobadoPorId",
                table: "OrdenesCambio",
                column: "AprobadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesCambio_ProyectoId",
                table: "OrdenesCambio",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_OrdenesCambio_SolicitadoPorId",
                table: "OrdenesCambio",
                column: "SolicitadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_PagosFactura_FacturaId",
                table: "PagosFactura",
                column: "FacturaId");

            migrationBuilder.CreateIndex(
                name: "IX_PerfilesConstructor_UsuarioId",
                table: "PerfilesConstructor",
                column: "UsuarioId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PerfilesProveedor_UsuarioId",
                table: "PerfilesProveedor",
                column: "UsuarioId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PortafolioItems_ConstructorId",
                table: "PortafolioItems",
                column: "ConstructorId");

            migrationBuilder.CreateIndex(
                name: "IX_PreciosMaterial_MaterialId",
                table: "PreciosMaterial",
                column: "MaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_PreciosMaterial_ProveedorId",
                table: "PreciosMaterial",
                column: "ProveedorId");

            migrationBuilder.CreateIndex(
                name: "IX_PresupuestoPartidas_ProyectoId",
                table: "PresupuestoPartidas",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_Propuestas_ConstructorId",
                table: "Propuestas",
                column: "ConstructorId");

            migrationBuilder.CreateIndex(
                name: "IX_Propuestas_ProyectoId",
                table: "Propuestas",
                column: "ProyectoId");

            migrationBuilder.CreateIndex(
                name: "IX_Proyectos_ClienteId",
                table: "Proyectos",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_RoleClaims_RoleId",
                table: "RoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "Roles",
                column: "NormalizedName",
                unique: true,
                filter: "[NormalizedName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_RolPermisos_Rol_PermisoCodigo",
                table: "RolPermisos",
                columns: new[] { "Rol", "PermisoCodigo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TareasFase_FaseId",
                table: "TareasFase",
                column: "FaseId");

            migrationBuilder.CreateIndex(
                name: "IX_TareasFase_ResponsableId",
                table: "TareasFase",
                column: "ResponsableId");

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioClaims_UserId",
                table: "UsuarioClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioLogins_UserId",
                table: "UsuarioLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioPermisos_ModificadoPorId",
                table: "UsuarioPermisos",
                column: "ModificadoPorId");

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioPermisos_UsuarioId_PermisoCodigo",
                table: "UsuarioPermisos",
                columns: new[] { "UsuarioId", "PermisoCodigo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UsuarioRoles_RoleId",
                table: "UsuarioRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "Usuarios",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "Usuarios",
                column: "NormalizedUserName",
                unique: true,
                filter: "[NormalizedUserName] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Archivos");

            migrationBuilder.DropTable(
                name: "AsignacionesEmpleado");

            migrationBuilder.DropTable(
                name: "AuditoriaLogs");

            migrationBuilder.DropTable(
                name: "Calificaciones");

            migrationBuilder.DropTable(
                name: "CartasAceptacion");

            migrationBuilder.DropTable(
                name: "Configuraciones");

            migrationBuilder.DropTable(
                name: "EmailLogs");

            migrationBuilder.DropTable(
                name: "FotosAvance");

            migrationBuilder.DropTable(
                name: "GastosObra");

            migrationBuilder.DropTable(
                name: "LineasCotizacion");

            migrationBuilder.DropTable(
                name: "Mensajes");

            migrationBuilder.DropTable(
                name: "MiembrosEquipo");

            migrationBuilder.DropTable(
                name: "Notificaciones");

            migrationBuilder.DropTable(
                name: "OrdenesCambio");

            migrationBuilder.DropTable(
                name: "PagosFactura");

            migrationBuilder.DropTable(
                name: "PortafolioItems");

            migrationBuilder.DropTable(
                name: "PreciosMaterial");

            migrationBuilder.DropTable(
                name: "RoleClaims");

            migrationBuilder.DropTable(
                name: "RolPermisos");

            migrationBuilder.DropTable(
                name: "TareasFase");

            migrationBuilder.DropTable(
                name: "UsuarioClaims");

            migrationBuilder.DropTable(
                name: "UsuarioLogins");

            migrationBuilder.DropTable(
                name: "UsuarioPermisos");

            migrationBuilder.DropTable(
                name: "UsuarioRoles");

            migrationBuilder.DropTable(
                name: "UsuarioTokens");

            migrationBuilder.DropTable(
                name: "Empleados");

            migrationBuilder.DropTable(
                name: "AvancesObra");

            migrationBuilder.DropTable(
                name: "PresupuestoPartidas");

            migrationBuilder.DropTable(
                name: "CotizacionesIA");

            migrationBuilder.DropTable(
                name: "Facturas");

            migrationBuilder.DropTable(
                name: "Materiales");

            migrationBuilder.DropTable(
                name: "PerfilesProveedor");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "FasesProyecto");

            migrationBuilder.DropTable(
                name: "Propuestas");

            migrationBuilder.DropTable(
                name: "PerfilesConstructor");

            migrationBuilder.DropTable(
                name: "Proyectos");

            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}

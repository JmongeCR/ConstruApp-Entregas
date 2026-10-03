using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConstruApp.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFavoritosProveedorFinal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FavoritosProveedor",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UsuarioId = table.Column<int>(type: "int", nullable: false),
                    PerfilProveedorId = table.Column<int>(type: "int", nullable: false),
                    FechaAgregado = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FavoritosProveedor", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FavoritosProveedor_PerfilesProveedor_PerfilProveedorId",
                        column: x => x.PerfilProveedorId,
                        principalTable: "PerfilesProveedor",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FavoritosProveedor_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Proyectos_Estado",
                table: "Proyectos",
                column: "Estado");

            migrationBuilder.CreateIndex(
                name: "IX_FavoritosProveedor_PerfilProveedorId",
                table: "FavoritosProveedor",
                column: "PerfilProveedorId");

            migrationBuilder.CreateIndex(
                name: "IX_FavoritosProveedor_UsuarioId_PerfilProveedorId",
                table: "FavoritosProveedor",
                columns: new[] { "UsuarioId", "PerfilProveedorId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FavoritosProveedor");

            migrationBuilder.DropIndex(
                name: "IX_Proyectos_Estado",
                table: "Proyectos");
        }
    }
}

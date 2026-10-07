using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConstruApp.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddFavoritosConstructorCliente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FavoritosConstructor",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClienteId = table.Column<int>(type: "int", nullable: false),
                    PerfilConstructorId = table.Column<int>(type: "int", nullable: false),
                    FechaAgregado = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FavoritosConstructor", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FavoritosConstructor_PerfilesConstructor_PerfilConstructorId",
                        column: x => x.PerfilConstructorId,
                        principalTable: "PerfilesConstructor",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FavoritosConstructor_Usuarios_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FavoritosConstructor_ClienteId_PerfilConstructorId",
                table: "FavoritosConstructor",
                columns: new[] { "ClienteId", "PerfilConstructorId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FavoritosConstructor_PerfilConstructorId",
                table: "FavoritosConstructor",
                column: "PerfilConstructorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FavoritosConstructor");
        }
    }
}

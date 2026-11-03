using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConstruApp.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class EntrevistasIa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "EntrevistasIa",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClienteId = table.Column<int>(type: "int", nullable: false),
                    Version = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActualizadaUtc = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Datos = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProyectoId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EntrevistasIa", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EntrevistasIa_Proyectos_ProyectoId",
                        column: x => x.ProyectoId,
                        principalTable: "Proyectos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_EntrevistasIa_Usuarios_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EntrevistasIa_ClienteId_ActualizadaUtc",
                table: "EntrevistasIa",
                columns: new[] { "ClienteId", "ActualizadaUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_EntrevistasIa_ProyectoId",
                table: "EntrevistasIa",
                column: "ProyectoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EntrevistasIa");
        }
    }
}

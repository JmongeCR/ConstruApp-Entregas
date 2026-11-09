using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConstruApp.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class Sprint3Integracion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ValidacionIaHash",
                table: "Proyectos",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PropuestaId",
                table: "CotizacionesIA",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CotizacionesIA_PropuestaId",
                table: "CotizacionesIA",
                column: "PropuestaId");

            migrationBuilder.AddForeignKey(
                name: "FK_CotizacionesIA_Propuestas_PropuestaId",
                table: "CotizacionesIA",
                column: "PropuestaId",
                principalTable: "Propuestas",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CotizacionesIA_Propuestas_PropuestaId",
                table: "CotizacionesIA");

            migrationBuilder.DropIndex(
                name: "IX_CotizacionesIA_PropuestaId",
                table: "CotizacionesIA");

            migrationBuilder.DropColumn(
                name: "ValidacionIaHash",
                table: "Proyectos");

            migrationBuilder.DropColumn(
                name: "PropuestaId",
                table: "CotizacionesIA");
        }
    }
}

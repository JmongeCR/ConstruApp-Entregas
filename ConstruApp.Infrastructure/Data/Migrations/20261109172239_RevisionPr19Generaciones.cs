using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConstruApp.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RevisionPr19Generaciones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "GeneracionId",
                table: "CotizacionesIA",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CotizacionesIA_ProyectoId_GeneracionId",
                table: "CotizacionesIA",
                columns: new[] { "ProyectoId", "GeneracionId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_CotizacionesIA_ProyectoId_GeneracionId",
                table: "CotizacionesIA");

            migrationBuilder.DropColumn(
                name: "GeneracionId",
                table: "CotizacionesIA");
        }
    }
}

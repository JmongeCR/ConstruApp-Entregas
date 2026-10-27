using ConstruApp.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConstruApp.Infrastructure.Data.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20261014120000_CAPP29EnvioACotizacion")]
public partial class CAPP29EnvioACotizacion : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "FechaEnvioCotizacion",
            table: "Proyectos",
            type: "datetime2",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "FechaEnvioCotizacion",
            table: "Proyectos");
    }
}

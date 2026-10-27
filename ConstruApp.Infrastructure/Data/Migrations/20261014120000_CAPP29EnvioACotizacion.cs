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
        migrationBuilder.AlterColumn<string>(
            name: "TipoProyecto", table: "Proyectos", type: "nvarchar(30)", maxLength: 30,
            nullable: true, oldClrType: typeof(string), oldType: "nvarchar(30)", oldMaxLength: 30);
        migrationBuilder.AddColumn<DateTime>(
            name: "FechaEnvioCotizacion",
            table: "Proyectos",
            type: "datetime2",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("UPDATE [Proyectos] SET [TipoProyecto] = N'Otro' WHERE [TipoProyecto] IS NULL;");
        migrationBuilder.AlterColumn<string>(
            name: "TipoProyecto", table: "Proyectos", type: "nvarchar(30)", maxLength: 30,
            nullable: false, oldClrType: typeof(string), oldType: "nvarchar(30)", oldMaxLength: 30,
            oldNullable: true);
        migrationBuilder.DropColumn(
            name: "FechaEnvioCotizacion",
            table: "Proyectos");
    }
}

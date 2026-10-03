using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConstruApp.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class Sprint2_EmpresaYPersonal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Empleados_ConstructorId",
                table: "Empleados");

            migrationBuilder.AddColumn<string>(
                name: "EmailContacto",
                table: "PerfilesConstructor",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Telefono",
                table: "PerfilesConstructor",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Cedula",
                table: "Empleados",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Empleados",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Puesto",
                table: "Empleados",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Empleados_ConstructorId_Cedula",
                table: "Empleados",
                columns: new[] { "ConstructorId", "Cedula" },
                unique: true,
                filter: "[Cedula] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Empleados_ConstructorId_Cedula",
                table: "Empleados");

            migrationBuilder.DropColumn(
                name: "EmailContacto",
                table: "PerfilesConstructor");

            migrationBuilder.DropColumn(
                name: "Telefono",
                table: "PerfilesConstructor");

            migrationBuilder.DropColumn(
                name: "Cedula",
                table: "Empleados");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Empleados");

            migrationBuilder.DropColumn(
                name: "Puesto",
                table: "Empleados");

            migrationBuilder.CreateIndex(
                name: "IX_Empleados_ConstructorId",
                table: "Empleados",
                column: "ConstructorId");
        }
    }
}

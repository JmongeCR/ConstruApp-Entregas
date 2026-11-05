using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConstruApp.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class CAPP49_OnvoKeysConstructor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OnvoPublicKey",
                table: "PerfilesConstructor",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OnvoSecretKeyEncriptado",
                table: "PerfilesConstructor",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OnvoPublicKey",
                table: "PerfilesConstructor");

            migrationBuilder.DropColumn(
                name: "OnvoSecretKeyEncriptado",
                table: "PerfilesConstructor");
        }
    }
}

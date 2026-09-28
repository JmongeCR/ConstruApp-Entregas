using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConstruApp.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInvitacionTipoCampos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Tipo",
                table: "Invitaciones",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Invitacion");

            migrationBuilder.AddColumn<int>(
                name: "UsuarioCreadorId",
                table: "Invitaciones",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invitaciones_UsuarioCreadorId",
                table: "Invitaciones",
                column: "UsuarioCreadorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Invitaciones_Usuarios_UsuarioCreadorId",
                table: "Invitaciones",
                column: "UsuarioCreadorId",
                principalTable: "Usuarios",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invitaciones_Usuarios_UsuarioCreadorId",
                table: "Invitaciones");

            migrationBuilder.DropIndex(
                name: "IX_Invitaciones_UsuarioCreadorId",
                table: "Invitaciones");

            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "Invitaciones");

            migrationBuilder.DropColumn(
                name: "UsuarioCreadorId",
                table: "Invitaciones");
        }
    }
}

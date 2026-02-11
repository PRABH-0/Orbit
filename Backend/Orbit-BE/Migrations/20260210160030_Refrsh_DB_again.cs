using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Orbit_BE.Migrations
{
    /// <inheritdoc />
    public partial class Refrsh_DB_again : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SupabaseUserId",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SupabaseUserId",
                table: "Users");
        }
    }
}

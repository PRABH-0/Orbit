using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Orbit_BE.Migrations
{
    /// <inheritdoc />
    public partial class add_property_in_NodeFile_Table : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StoragePath",
                table: "NodeFiles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StoragePath",
                table: "NodeFiles");
        }
    }
}

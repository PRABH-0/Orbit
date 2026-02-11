using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Orbit_BE.Migrations
{
    /// <inheritdoc />
    public partial class Refrsh_DB : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Plan",
                table: "UserPlans");

            migrationBuilder.DropColumn(
                name: "Gateway",
                table: "Payments");

            migrationBuilder.RenameColumn(
                name: "StorageLimitMb",
                table: "UserPlans",
                newName: "UsedStorageMb");

            migrationBuilder.RenameColumn(
                name: "ActivatedAt",
                table: "UserPlans",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "Plan",
                table: "Payments",
                newName: "GatewayName");

            migrationBuilder.RenameColumn(
                name: "GatewayPaymentId",
                table: "Payments",
                newName: "StripeSessionId");

            migrationBuilder.RenameColumn(
                name: "GatewayOrderId",
                table: "Payments",
                newName: "StripePaymentIntentId");

            migrationBuilder.AddColumn<long>(
                name: "TotalStorageMb",
                table: "UserPlans",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<long>(
                name: "PurchasedStorageMb",
                table: "Payments",
                type: "bigint",
                nullable: false,
                defaultValue: 0L);

            migrationBuilder.AddColumn<DateTime>(
                name: "VerifiedAt",
                table: "Payments",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TotalStorageMb",
                table: "UserPlans");

            migrationBuilder.DropColumn(
                name: "PurchasedStorageMb",
                table: "Payments");

            migrationBuilder.DropColumn(
                name: "VerifiedAt",
                table: "Payments");

            migrationBuilder.RenameColumn(
                name: "UsedStorageMb",
                table: "UserPlans",
                newName: "StorageLimitMb");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "UserPlans",
                newName: "ActivatedAt");

            migrationBuilder.RenameColumn(
                name: "StripeSessionId",
                table: "Payments",
                newName: "GatewayPaymentId");

            migrationBuilder.RenameColumn(
                name: "StripePaymentIntentId",
                table: "Payments",
                newName: "GatewayOrderId");

            migrationBuilder.RenameColumn(
                name: "GatewayName",
                table: "Payments",
                newName: "Plan");

            migrationBuilder.AddColumn<string>(
                name: "Plan",
                table: "UserPlans",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Gateway",
                table: "Payments",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}

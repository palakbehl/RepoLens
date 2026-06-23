using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RepoLens.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRepositoryIntelligence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<double>(
                name: "CommitFrequency",
                table: "Repositories",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "ContributorCount",
                table: "Repositories",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Frameworks",
                table: "Repositories",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "IssueCount",
                table: "Repositories",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "RepositoryCreatedAt",
                table: "Repositories",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TechnologyStack",
                table: "Repositories",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CommitFrequency",
                table: "Repositories");

            migrationBuilder.DropColumn(
                name: "ContributorCount",
                table: "Repositories");

            migrationBuilder.DropColumn(
                name: "Frameworks",
                table: "Repositories");

            migrationBuilder.DropColumn(
                name: "IssueCount",
                table: "Repositories");

            migrationBuilder.DropColumn(
                name: "RepositoryCreatedAt",
                table: "Repositories");

            migrationBuilder.DropColumn(
                name: "TechnologyStack",
                table: "Repositories");
        }
    }
}

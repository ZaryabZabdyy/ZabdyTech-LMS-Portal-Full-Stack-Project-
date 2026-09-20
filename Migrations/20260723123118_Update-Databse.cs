using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZabdyTech.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDatabse : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Projects",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "NOW()");

            migrationBuilder.AddColumn<int>(
                name: "InstructorId",
                table: "Projects",
                type: "integer",
                nullable: false,
                defaultValue: 10);

            migrationBuilder.CreateIndex(
                name: "IX_Projects_InstructorId",
                table: "Projects",
                column: "InstructorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Projects_Instructors_InstructorId",
                table: "Projects",
                column: "InstructorId",
                principalTable: "Instructors",
                principalColumn: "InstructorId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Projects_Instructors_InstructorId",
                table: "Projects");

            migrationBuilder.DropIndex(
                name: "IX_Projects_InstructorId",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "InstructorId",
                table: "Projects");
        }
    }
}

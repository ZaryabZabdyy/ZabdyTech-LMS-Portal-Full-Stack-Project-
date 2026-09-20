using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ZabdyTech.Migrations
{
    /// <inheritdoc />
    public partial class DBUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Projects_CourseId",
                table: "Projects",
                column: "CourseId");

            migrationBuilder.AddForeignKey(
                name: "FK_Projects_Courses_CourseId",
                table: "Projects",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "CourseId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Projects_Courses_CourseId",
                table: "Projects");

            migrationBuilder.DropIndex(
                name: "IX_Projects_CourseId",
                table: "Projects");
        }
    }
}

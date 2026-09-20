using Microsoft.EntityFrameworkCore;
using ZabdyTech.Models;

namespace ZabdyTech.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<Student> Students { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<StudentCourse> StudentCourses { get; set; }
        public DbSet<Instructor> Instructors { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectSubmission> Project_Submission{ get; set; }
        public DbSet<PasswordReset> ResetPassword { get; set; }



        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. Student Email Unique Index
            modelBuilder.Entity<Student>()
                .HasIndex(s => s.Email)
                .IsUnique();

            // 2. One-to-Many: Instructor & Course
            modelBuilder.Entity<Course>()
                .HasOne(c => c.Instructor)
                .WithMany(i => i.Courses)
                .HasForeignKey(c => c.InstructorId)
                .OnDelete(DeleteBehavior.Restrict);

            // 3. Many-to-Many with Surrogate Key (EnrollmentId)
            modelBuilder.Entity<StudentCourse>()
                .HasKey(sc => sc.EnrollmentId);

            // Composite Unique Index
            modelBuilder.Entity<StudentCourse>()
                .HasIndex(sc => new { sc.StudentId, sc.CourseId })
                .IsUnique();

            modelBuilder.Entity<StudentCourse>()
                .HasOne(sc => sc.Student)
                .WithMany(s => s.StudentCourses)
                .HasForeignKey(sc => sc.StudentId);

            modelBuilder.Entity<StudentCourse>()
                .HasOne(sc => sc.Course)
                .WithMany(c => c.StudentCourses)
                .HasForeignKey(sc => sc.CourseId);

            // 4. One-to-Many: StudentCourse & Transactions
            modelBuilder.Entity<Transaction>()
                .HasOne(t => t.StudentCourse)
                .WithMany(sc => sc.Transactions)
                .HasForeignKey(t => t.EnrollmentId)
                .OnDelete(DeleteBehavior.Cascade);

            // 5. Project & ProjectSubmission Relationships + Table Mapping
            modelBuilder.Entity<ProjectSubmission>(entity =>
            {
                entity.ToTable("Project_Submission"); // <-- Yeh line database ke exact underscore wale table name se map karegi!
                entity.HasKey(ps => ps.SubmissionId);
                entity.Property(ps => ps.Status).HasDefaultValue("Submitted");
                entity.Property(ps => ps.ObtainedMarks).IsRequired(false);
                entity.Property(ps => ps.EvaluatedAt).IsRequired(false);
            });

            modelBuilder.Entity<ProjectSubmission>()
                .HasOne(ps => ps.Project)
                .WithMany(p => p.Submissions)
                .HasForeignKey(ps => ps.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            // 6. Project Configurations & Relationships
            modelBuilder.Entity<Project>(entity =>
            {
                entity.HasKey(p => p.ProjectId);
                entity.Property(p => p.ScopeSpecificationText).IsRequired();

                entity.HasOne(p => p.Course)
                      .WithMany(c => c.Projects)
                      .HasForeignKey(p => p.CourseId)
                      .OnDelete(DeleteBehavior.Cascade); // <-- Yahan se 'Boy' hata diya hai

                entity.HasOne(p => p.Instructor)
                      .WithMany(i => i.Projects)
                      .HasForeignKey(p => p.InstructorId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // 7. PasswordReset Relationship
            modelBuilder.Entity<PasswordReset>()
                .HasOne(pr => pr.Student)
                .WithMany(s => s.PasswordResets)
                .HasForeignKey(pr => pr.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
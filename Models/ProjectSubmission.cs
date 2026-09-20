using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZabdyTech.Models
{
    public class ProjectSubmission
    {
        [Key]
        public int SubmissionId { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        public int StudentId { get; set; }

        // 👇 Ismein zip file ka location path save hoga (e.g., "/uploads/submissions/file.zip")
        [Required]
        [StringLength(500)]
        public string SubmissionUrl { get; set; } = string.Empty;

        public DateTime SubmittedAt { get; set; } = DateTime.Now;

        [Required]
        [StringLength(30)]
        public string Status { get; set; } = "Submitted"; // Submitted, Evaluated, Pending

        // 👇 INSTRUCTOR GRADING COLS (For Evaluated Metrics Engine)
        public int? ObtainedMarks { get; set; } // Out of 100

        public string InstructorFeedback { get; set; } = string.Empty; // Critique Logs

        public DateTime? EvaluatedAt { get; set; } // Checked Timestamp

        // 👇 Relationship Linker: FK mapping back to Project Model
        [ForeignKey("ProjectId")]
        public virtual Project Project { get; set; }

        [StringLength(500)]
        public string? GithubUrl { get; set; } = string.Empty;
    }
}
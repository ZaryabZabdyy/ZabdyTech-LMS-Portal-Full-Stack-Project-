using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ZabdyTech.Models
{
    public class Project
    {
        [Key]
        public int ProjectId { get; set; }

        [Required]
        public int CourseId { get; set; } // Foreign Key

        // 💡 ADDED: Course Navigation Property (Ab p.Course.InstructorId bilkul valid ho gaya!)
        public virtual Course? Course { get; set; }

        [Required]
        [StringLength(100)]
        public string Title { get; set; } // E.g., "LMS Portal"

        [Required]
        public DateTime Deadline { get; set; } // E.g., 2026-07-25

        [Required]
        public string ScopeSpecificationText { get; set; } // Bullet points ka data

        [StringLength(250)]
        public string DocumentDownloadUrl { get; set; } = string.Empty; // Spec Rules PDF path

        [StringLength(250)]
        public string WireframeUrl { get; set; } = string.Empty; // Wireframes link

        // 👇 Relationship: Aik project ki multiple student submissions ho sakti hain
        public virtual ICollection<ProjectSubmission> Submissions { get; set; } = new List<ProjectSubmission>();

        // 🎯 FOREIGN KEY RELATIONSHIP
        public int InstructorId { get; set; }

        // 🔗 NAVIGATION PROPERTY
        // Is se EF Core ko pata chalta hai ke project kis instructor ka hai

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [JsonIgnore]
        public Instructor? Instructor { get; set; }
    }
}
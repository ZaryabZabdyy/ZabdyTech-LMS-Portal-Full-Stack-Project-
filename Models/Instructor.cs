using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ZabdyTech.Models
{
    public class Instructor
    {
        [Key]
        public int InstructorId { get; set; }

        [Required]
        [StringLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        public string Study_BackGround { get; set; } = string.Empty; // E.g., Web Dev, SE, DLD

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Property: Ek instructor ke paas boht se courses ho sakte hain
        public ICollection<Course> Courses { get; set; } = new List<Course>();
        [JsonIgnore] // Circular reference JSON serialization issue ko rokne ke liye
        public ICollection<Project> Projects { get; set; } = new List<Project>();
    }
}

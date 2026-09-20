using System.ComponentModel.DataAnnotations;

namespace ZabdyTech.Models
{
    public class Course
    {
        [Key]
        public int CourseId { get; set; }

        [Required]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty; // E.g., "Full Stack Web Development"

        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        // 👇 DASHBOARD ICON: Sirf yeh AIK extra column add karein jo dashboard par "📚" ya "☕" dikhaye ga.
        [StringLength(10)]
        public string Icon { get; set; } = "📚";

        public int? InstructorId { get; set; }

        // Purani baki navigation fields jesi hain wesi hi rahengi, koi naya relationship nahi add kiya.
        public ICollection<StudentCourse> StudentCourses { get; set; } = new List<StudentCourse>();
        public Instructor? Instructor { get; set; }
        public virtual ICollection<Project> Projects { get; set; } = new List<Project>();
    }


}

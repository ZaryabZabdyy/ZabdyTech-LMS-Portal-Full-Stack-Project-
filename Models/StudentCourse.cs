using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ZabdyTech.Models
{
    public class StudentCourse
    {
        [Key]
        public int EnrollmentId { get; set; } //[cite: 21]

        [Required]
        public int StudentId { get; set; } //[cite: 21]
        public Student Student { get; set; } = null!; //[cite: 21]

        [Required]
        public int CourseId { get; set; } //[cite: 21]
        public Course Course { get; set; } = null!; //[cite: 21]

        public DateTime EnrollmentDate { get; set; } = DateTime.UtcNow; //[cite: 21]

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } //[cite: 21]

        [Required]
        [MaxLength(30)]
        // FIXED: Nullable operator (?) hata diya kyunki field [Required] hai
        public string Shift { get; set; } = string.Empty;

        public string? ProfileImage { get; set; }

        // FIXED: Required aur Nullable hata kar standard property banayi
        public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
    }
}
using System;
using System.ComponentModel.DataAnnotations;

namespace ZabdyTech.Models
{
    public class Student
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty; // Signup Field

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty; // Signup Field

        [Required]
        [EmailAddress]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty; // Signup & Enrollment Login

        [Required]
        public string PasswordHash { get; set; } = string.Empty; // Signup Password

        [Required]
        [MaxLength(20)]
        public string PhoneNumber { get; set; } = string.Empty; // Signup Phone

        [Required]
        public DateTime DateOfBirth { get; set; } // Signup DOB

        [Required]
        [MaxLength(100)]
        public string Country { get; set; } = string.Empty; // Signup Country

        [MaxLength(150)]
        public string Organization { get; set; } = string.Empty; // Enrollment Gateway Field


        // Navigation Property
        public ICollection<StudentCourse> StudentCourses { get; set; } = new List<StudentCourse>();

        // Aapke existing Student model ke andar yeh line add karein:
        public ICollection<PasswordReset> PasswordResets { get; set; } = new List<PasswordReset>();
    }
}
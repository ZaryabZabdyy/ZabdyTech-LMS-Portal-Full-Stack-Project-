using System.ComponentModel.DataAnnotations;

namespace ZabdyTech.DTOs
{
    public class EnrollmentDto
    {
        // UI Field: University / Organization Affiliation
        [Required(ErrorMessage = "University ya Organization ka naam likhna lazmi hai.")]
        [MaxLength(150, ErrorMessage = "Organization ka naam 150 characters se zyada nahi hona chahiye.")]
        public string Organization { get; set; } = string.Empty;

    }
}
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ZabdyTech.DTOs
{
    public class SubmitStepDto
    {
        [Required(ErrorMessage = "University ya Organization ka naam likhna lazmi hai.")]
        [StringLength(150, ErrorMessage = "Organization ka naam bohot lamba hai.")]
        [JsonPropertyName("organization")] // 👈 Explicitly bind for JSON
        public string Organization { get; set; } = string.Empty;

        [Required(ErrorMessage = "Class shift select karna lazmi hai.")]
        [RegularExpression("^(Morning|Evening)$", ErrorMessage = "Shift sirf 'Morning' ya 'Evening' ho sakti hai.")]
        [JsonPropertyName("shift")] // 👈 Explicitly bind for JSON
        public string Shift { get; set; } = string.Empty;

        [Required(ErrorMessage = "Course Title is required.")] // 👈 Isko required karein taake safe rahe
        [JsonPropertyName("title")] // 👈 Explicitly bind for JSON
        public string Title { get; set; } = string.Empty;
    }
}
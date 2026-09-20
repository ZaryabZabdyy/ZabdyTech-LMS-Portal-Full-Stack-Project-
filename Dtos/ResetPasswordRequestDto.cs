using System.ComponentModel.DataAnnotations;

namespace ZabdyTech.Dtos
{
    public class ResetPasswordRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(10, MinimumLength = 4)]
        public string ResetCode { get; set; } = string.Empty; // Security ke liye dobara verify karna behtar hai

        [Required]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
        public string NewPassword { get; set; } = string.Empty;
    }
}

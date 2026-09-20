using System.ComponentModel.DataAnnotations;

namespace ZabdyTech.DTOs
{
    public class LoginDto
    {
        [Required(ErrorMessage = "Email likhna lazmi hai.")]
        [EmailAddress(ErrorMessage = "Email ka format durust nahi hai.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password likhna lazmi hai.")]
        public string Password { get; set; } = string.Empty;
    }
}
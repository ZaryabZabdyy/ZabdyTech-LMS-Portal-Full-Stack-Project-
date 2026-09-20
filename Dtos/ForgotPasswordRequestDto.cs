using System.ComponentModel.DataAnnotations;

namespace ZabdyTech.Dtos
{
    public class ForgotPasswordRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}

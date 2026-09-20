using System.ComponentModel.DataAnnotations;

namespace ZabdyTech.Dtos
{
    public class VerifyCodeRequestDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(10, MinimumLength = 4)]
        public string ResetCode { get; set; } = string.Empty;
    }
}

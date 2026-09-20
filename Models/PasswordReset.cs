using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZabdyTech.Models
{
    public class PasswordReset
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int StudentId { get; set; } // Foreign Key mapping to Student table

        [Required]
        [MaxLength(10)]
        public string ResetCode { get; set; } = string.Empty;

        [Required]
        public DateTime ExpiryTime { get; set; }

        [Required]
        public bool IsUsed { get; set; } = false;

        // Navigation property for 1-to-Many relation
        [ForeignKey("StudentId")]
        public Student? Student { get; set; }
    }
}

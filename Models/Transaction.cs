using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZabdyTech.Models
{
    public class Transaction
    {
        [Key]
        public int Id { get; set; }

        // M:N Enrollment table ke sath 1:N ka relation (Foreign Key)
        [Required]
        public int EnrollmentId { get; set; }
        public StudentCourse ? StudentCourse { get; set; }

        // UI Element: Amount (e.g., Rs. 11,500)
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        // UI Element: Choose Funding Route (Visa, EasyPaisa, JazzCash)
        [Required]
        [MaxLength(50)]
        public string PaymentMethod { get; set; } = string.Empty; // "Card", "EasyPaisa", "JazzCash"

        // ============================================================
        // 💳 CARD SPECIFIC FIELDS (Nullable: Kyunki EasyPaisa me empty hon gi)
        // ============================================================

        [MaxLength(100)]
        public string? CardholderName { get; set; }

        // Security Reason: Database me sirf last 4 digits save krte hain (e.g., "xxxx-xxxx-xxxx-1234")
        [MaxLength(20)]
        public string? MaskedCardNumber { get; set; }

        // ============================================================
        // 📱 MOBILE WALLET SPECIFIC FIELDS (EasyPaisa / JazzCash)
        // ============================================================

        [MaxLength(20)]
        public string? AccountNumber { get; set; } // EasyPaisa ya JazzCash ka phone number

        // ============================================================
        // ⚙️ GATEWAY & AUDIT FIELDS
        // ============================================================

        // Stripe/JazzCash/EasyPaisa gateway se milne wali unique Tracking ID
        [Required]
        [MaxLength(100)]
        public string TransactionRef { get; set; } = string.Empty;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending"; // "Pending", "Success", "Failed"

        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    }
}
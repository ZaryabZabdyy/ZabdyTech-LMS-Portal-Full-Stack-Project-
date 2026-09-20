using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ZabdyTech.DTOs
{
    public class PaymentDto : IValidatableObject
    {
        [Required(ErrorMessage = "Funding route select karna lazmi hai.")]
        [RegularExpression("^(Card|EasyPaisa|JazzCash)$", ErrorMessage = "Ghalat payment route select kiya gaya hai.")]
        public string PaymentMethod { get; set; } = string.Empty; // "Card", "EasyPaisa", "JazzCash"

        // ============================================================
        // 🔑 MANUAL TRANSACTION ID (METHOD 1 REQUIREMENT)
        // ============================================================
        [Required(ErrorMessage = "Transaction Reference ID (TrxID) enter karna lazmi hai.")]
        [StringLength(50, MinimumLength = 4, ErrorMessage = "Transaction ID bohot choti ya bohot lambi hai.")]
        public string TransactionId { get; set; } = string.Empty;

        // ============================================================
        // 💳 CARD FIELDS
        // ============================================================
        [StringLength(100, ErrorMessage = "Cardholder name bohot lamba hai.")]
        public string? CardholderName { get; set; }

        [CreditCard(ErrorMessage = "Card number ka format durust nahi hai.")]
        public string? CardNumber { get; set; }

        [RegularExpression(@"^(0[1-9]|1[0-2])\/([0-9]{2})$", ErrorMessage = "Expiry date ka format MM/YY hona chahiye.")]
        public string? ExpiryDate { get; set; }

        [RegularExpression(@"^[0-9]{3,4}$", ErrorMessage = "CVV code sirf 3 ya 4 digits ka hona chahiye.")]
        public string? CVV { get; set; }

        // ============================================================
        // 📱 MOBILE WALLET FIELDS
        // ============================================================
        [RegularExpression(@"^(03[0-9]{9})$", ErrorMessage = "Mobile wallet number ka format durust nahi hai (e.g., 03001234567).")]
        public string? AccountNumber { get; set; }

        [Range(typeof(bool), "true", "true", ErrorMessage = "Terms aur elements ki accuracy ko verify karna lazmi hai.")]
        public bool IsVerified { get; set; }

        [Required(ErrorMessage = "Price (Amount) bhejna lazmi hai.")]
        [Range(1, double.MaxValue, ErrorMessage = "Amount 0 se barhi honi chahiye.")]
        public decimal Amount { get; set; }

        // ============================================================
        // 🛠️ CUSTOM DYNAMIC VALIDATION & CLEANING LOGIC
        // ============================================================
        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            // Transaction ID ki basic safety check
            if (string.IsNullOrWhiteSpace(TransactionId))
            {
                yield return new ValidationResult("Transaction Reference ID (TrxID) enter karna lazmi hai.", new[] { nameof(TransactionId) });
            }

            if (PaymentMethod == "Card")
            {
                // Mobile fields ko forcefully empty karna hai
                AccountNumber = null;

                if (string.IsNullOrWhiteSpace(CardholderName))
                    yield return new ValidationResult("Cardholder name likhna lazmi hai.", new[] { nameof(CardholderName) });

                if (string.IsNullOrWhiteSpace(CardNumber))
                    yield return new ValidationResult("Card number enter karna lazmi hai.", new[] { nameof(CardNumber) });

                if (string.IsNullOrWhiteSpace(ExpiryDate))
                    yield return new ValidationResult("Card ki Expiry Date (MM/YY) lazmi hai.", new[] { nameof(ExpiryDate) });

                if (string.IsNullOrWhiteSpace(CVV))
                    yield return new ValidationResult("Security Code (CVV) likhna lazmi hai.", new[] { nameof(CVV) });
            }
            else if (PaymentMethod == "EasyPaisa" || PaymentMethod == "JazzCash")
            {
                // Card fields ko forcefully empty karna hai
                CardholderName = null;
                CardNumber = null;
                ExpiryDate = null;
                CVV = null;

                if (string.IsNullOrWhiteSpace(AccountNumber))
                {
                    yield return new ValidationResult($"{PaymentMethod} ka mobile account number likhna lazmi hai.", new[] { nameof(AccountNumber) });
                }
            }
        }
    }
}
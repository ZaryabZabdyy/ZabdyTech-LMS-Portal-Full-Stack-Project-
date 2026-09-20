using System;
using System.ComponentModel.DataAnnotations;

namespace ZabdyTech.DTOs
{
    public class SignupDto
    {
        [Required(ErrorMessage = "First Name is required.")]
        [MaxLength(50, ErrorMessage = "First Name cannot exceed 50 characters.")]
        // FIXED: Allows letters and spaces to support double names
        [RegularExpression(@"^[a-zA-Z\s]+$", ErrorMessage = "First Name can only contain letters and spaces.")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Last Name is required.")]
        [MaxLength(50, ErrorMessage = "Last Name cannot exceed 50 characters.")]
        [RegularExpression(@"^[a-zA-Z\s]+$", ErrorMessage = "Last Name can only contain letters and spaces.")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid email address format.")]
        [MaxLength(150, ErrorMessage = "Email cannot exceed 150 characters.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required.")]
        [StringLength(100, MinimumLength = 8, ErrorMessage = "Password must be at least 8 characters long.")]
        // Strong Password Validation
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$",
            ErrorMessage = "Password must be strong. (At least: 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character)")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Phone number is required.")]
        [MaxLength(20, ErrorMessage = "Phone number cannot exceed 20 digits.")]
        // FIXED: Handles optional '+', spaces, and dashes safely according to placeholder
        [RegularExpression(@"^\+?[0-9\s\-]+$", ErrorMessage = "Invalid phone number format. Only numbers and '+' are allowed.")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Date of Birth is required.")]
        [DataType(DataType.Date)]
        public DateTime DateOfBirth { get; set; }

        [Required(ErrorMessage = "Country is required.")]
        [MaxLength(100, ErrorMessage = "Country name cannot exceed 100 characters.")]
        public string Country { get; set; } = string.Empty;
    }
}
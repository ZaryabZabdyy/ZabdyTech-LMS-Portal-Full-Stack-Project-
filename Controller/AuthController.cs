using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZabdyTech.Data;
using ZabdyTech.Dtos;
using ZabdyTech.Models;
using System.Net;
using System.Net.Mail;

namespace ZabdyTech.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AuthController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 1️⃣ POST: api/auth/forgot-password (Email par 5-digit OTP bhejne ke liye)
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var student = await _context.Students.FirstOrDefaultAsync(s => s.Email == model.Email);
            if (student == null)
            {
                return NotFound(new { message = "Email address not found in our records." });
            }

            string randomCode = new Random().Next(10000, 99999).ToString();

            var passwordResetRecord = new PasswordReset
            {
                StudentId = student.Id,
                ResetCode = randomCode,
                ExpiryTime = DateTime.UtcNow.AddMinutes(10),
                IsUsed = false
            };

            _context.ResetPassword.Add(passwordResetRecord);
            await _context.SaveChangesAsync();

            // 📧 SMTP BLOCK (Aap apni detail yahan khud put kar lein)
            try
            {
                var smtpClient = new SmtpClient("smtp.gmail.com")
                {
                    Port = 587,
                    Credentials = new NetworkCredential("zarysbahmad@gmail.com", "jnyf xqfu rlmt sshx"),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress("zarysbahmad@gmail.com", "Enterprise Tech Academy"),
                    Subject = "Password Recovery Verification Code",
                    Body = $"Your 5-digit security verification code is: {randomCode}\n\nThis code will expire in 10 minutes.",
                    IsBodyHtml = false,
                };

                mailMessage.To.Add(model.Email);
                await smtpClient.SendMailAsync(mailMessage);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to send email.", error = ex.Message });
            }

            return Ok(new { message = "Verification code generated and dispatched successfully." });
        }

        // 2️⃣ POST: api/auth/verify-code (5-digit code ko verify karne ke liye)
        [HttpPost("verify-code")]
        public async Task<IActionResult> VerifyCode([FromBody] VerifyCodeRequestDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var student = await _context.Students.FirstOrDefaultAsync(s => s.Email == model.Email);
            if (student == null)
            {
                return NotFound(new { message = "Invalid request context." });
            }

            // Database mein active, un-used aur non-expired code find karein
            var validResetEntry = await _context.ResetPassword
                .Where(pr => pr.StudentId == student.Id && pr.ResetCode == model.ResetCode && !pr.IsUsed && pr.ExpiryTime > DateTime.UtcNow)
                .OrderByDescending(pr => pr.Id)
                .FirstOrDefaultAsync();

            if (validResetEntry == null)
            {
                return BadRequest(new { message = "The verification code is invalid or has expired." });
            }

            return Ok(new { message = "Code verified successfully." });
        }

        // 3️⃣ POST: api/auth/reset-password (Naya password hash kar ke database mein update karne ke liye)
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var student = await _context.Students.FirstOrDefaultAsync(s => s.Email == model.Email);
            if (student == null)
            {
                return NotFound(new { message = "Student record not found." });
            }

            // Dobara code verify karein security ke liye taake direct hit na ho sake
            var validResetEntry = await _context.ResetPassword
                .Where(pr => pr.StudentId == student.Id && pr.ResetCode == model.ResetCode && !pr.IsUsed && pr.ExpiryTime > DateTime.UtcNow)
                .OrderByDescending(pr => pr.Id)
                .FirstOrDefaultAsync();

            if (validResetEntry == null)
            {
                return BadRequest(new { message = "Invalid session or code expired. Please restart the recovery process." });
            }

            // Naye password ko secure hash mein convert karein (BCrypt ya ASP.NET Core PasswordHasher use karein)
            // Misal ke tor par agar aap BCrypt use kar rahe hain:
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(model.NewPassword);

            // Student ka password update karein
            // (Farz karein aapke Student model mein Password field ka naam PasswordHash ya Password hai)
            student.PasswordHash = hashedPassword;

            // Code ko mark kar dein ke yeh dobara use na ho sake
            validResetEntry.IsUsed = true;

            _context.Students.Update(student);
            _context.ResetPassword.Update(validResetEntry);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password successfully updated and hashed in database." });
        }
    }
}

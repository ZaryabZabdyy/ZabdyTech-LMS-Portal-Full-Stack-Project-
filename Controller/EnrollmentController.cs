using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ZabdyTech.Data;
using ZabdyTech.DTOs;
using ZabdyTech.Models;

namespace ZabdyTech.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EnrollmentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EnrollmentController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ============================================================
        // 📥 1. GET LOGGED-IN STUDENT INFO (Step 01 Autofill)
        // ============================================================
        [HttpGet("student-profile")]
        public async Task<IActionResult> GetStudentProfileForEnrollment()
        {
            var studentIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(studentIdClaim))
                return Unauthorized(new { message = "User login nahi hai ya session expire ho chuka hai." });

            int studentId = int.Parse(studentIdClaim);

            var student = await _context.Students.FindAsync(studentId);
            if (student == null)
                return NotFound(new { message = "Student ka record nahi mila." });

            return Ok(new
            {
                fullName = $"{student.FirstName} {student.LastName}",
                email = student.Email,
                phoneNumber = student.PhoneNumber
            });
        }

        // ============================================================
        // 🚀 2. SUBMIT ENROLLMENT DATA (Step 02: Proceed To Payment)
        // ============================================================
        [HttpPost("proceed-to-payment")]
        public async Task<IActionResult> ProcessEnrollmentSteps([FromBody] ZabdyTech.DTOs.SubmitStepDto model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var studentIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(studentIdClaim))
                return Unauthorized(new { message = "Session verification failed! Please login again." });

            int studentId = int.Parse(studentIdClaim);

            var student = await _context.Students.FindAsync(studentId);
            if (student == null)
                return NotFound(new { message = "Student profile database mein mojood nahi hai." });

            if (string.IsNullOrEmpty(model.Title))
            {
                return BadRequest(new { message = "Course Title bhejna lazmi hai!" });
            }

            var course = await _context.Courses
                .FirstOrDefaultAsync(c => c.Title.ToLower() == model.Title.ToLower());

            if (course == null)
            {
                return NotFound(new { message = $"Course '{model.Title}' system mein registered nahi hai!" });
            }

            var studentAllEnrollments = await _context.StudentCourses
                .Include(sc => sc.Course)
                .Where(sc => sc.StudentId == studentId)
                .ToListAsync();

            if (studentAllEnrollments.Any())
            {
                bool hasActiveCourse = studentAllEnrollments.Any(sc =>
                    sc.Status.Equals("Active", StringComparison.OrdinalIgnoreCase));

                if (hasActiveCourse)
                {
                    return BadRequest(new { message = "Aap naye course mein enroll nahi kar sakte! Aapka pehla koi course abhi tak Active state mein hai. Use pehle complete karein." });
                }

                var pendingEnrollment = studentAllEnrollments.FirstOrDefault(sc =>
                    sc.Status.Equals("Pending", StringComparison.OrdinalIgnoreCase));

                if (pendingEnrollment != null && pendingEnrollment.Course != null)
                {
                    string username = $"{student.FirstName} {student.LastName}";
                    return BadRequest(new
                    {
                        isPendingResume = true,
                        enrollmentId = pendingEnrollment.EnrollmentId,
                        courseTitle = pendingEnrollment.Course.Title,
                        message = $"Ye user ({username}) pehle se is course ({pendingEnrollment.Course.Title}) mein enrolled hai aur iski payment pending hai."
                    });
                }
            }

            student.Organization = model.Organization;
            _context.Students.Update(student);

            var newEnrollment = new StudentCourse
            {
                StudentId = studentId,
                CourseId = course.CourseId,
                Shift = model.Shift,
                EnrollmentDate = DateTime.UtcNow,
                Status = "Pending"
            };

            _context.StudentCourses.Add(newEnrollment);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Enrollment details captured successfully! Proceeding to payment...",
                enrollmentId = newEnrollment.EnrollmentId
            });
        }

        // ============================================================
        // 💳 SECURE PAYMENT VERIFICATION API (TrxID Pure Client-Driven Flow)
        // ============================================================
        [HttpPost("submit-payment/{enrollmentId}")]
        public async Task<IActionResult> SubmitEnrollmentPayment(int enrollmentId, [FromBody] PaymentDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var enrollment = await _context.StudentCourses
                .FirstOrDefaultAsync(sc => sc.EnrollmentId == enrollmentId);

            if (enrollment == null)
            {
                return NotFound(new { message = "Enrollment ID nahi mila!" });
            }

            // 1. Check if payment already exists for this enrollment
            var existingPayment = await _context.Transactions
                .AnyAsync(t => t.EnrollmentId == enrollmentId && t.Status == "Success");

            if (existingPayment)
            {
                return BadRequest(new { message = "Is course ki payment pehle hi completed hai!" });
            }

            // 2. Security Check: Wallet methods ke liye unique Transaction ID validation
            if (dto.PaymentMethod == "EasyPaisa" || dto.PaymentMethod == "JazzCash")
            {
                if (string.IsNullOrEmpty(dto.TransactionId))
                {
                    return BadRequest(new { message = "Transaction ID enter karna lazmi hai!" });
                }

                // Fraud prevention check against global transactions ledger
                var duplicateTrxId = await _context.Transactions
                    .AnyAsync(t => t.TransactionRef == dto.TransactionId && t.Status == "Success");

                if (duplicateTrxId)
                {
                    return BadRequest(new { message = "Yeh Transaction ID pehle se use ho chuki hai! Invalid request." });
                }
            }

            // 3. Mapping Payment Data to Transaction Ledger Entity
            var transaction = new Transaction
            {
                EnrollmentId = enrollmentId,
                Amount = dto.Amount,
                PaymentMethod = dto.PaymentMethod,
                Status = "Success",
                TransactionDate = DateTime.UtcNow,
                TransactionRef = (dto.PaymentMethod == "Card") ? $"CARD-TX-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}" : dto.TransactionId
            };

            // Handling data cleanup fields based on dynamic runtime types
            if (dto.PaymentMethod == "Card")
            {
                transaction.CardholderName = dto.CardholderName;
                if (!string.IsNullOrEmpty(dto.CardNumber))
                {
                    string cleanCard = dto.CardNumber.Replace(" ", "").Replace("-", "");
                    if (cleanCard.Length >= 4)
                    {
                        string lastFourDigits = cleanCard.Substring(cleanCard.Length - 4);
                        transaction.MaskedCardNumber = $"xxxx-xxxx-xxxx-{lastFourDigits}";
                    }
                }
                transaction.AccountNumber = null;
            }
            else // EasyPaisa or JazzCash
            {
                transaction.AccountNumber = dto.AccountNumber;
                transaction.CardholderName = null;
                transaction.MaskedCardNumber = null;
            }

            // =========================================================================
            // ⚙️ TRANSACTION SAFETY WRAPPER & ATOMIC STATE ACTIVATION
            // =========================================================================
            using (var dbTransaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    // Action 01: Append to financial auditing table ledger
                    _context.Transactions.Add(transaction);

                    // Action 02: 🟢 Update system authorization status to Active instantly!
                    enrollment.Status = "Active";
                    _context.StudentCourses.Update(enrollment);

                    // Action 03: Safe atomic commit
                    await _context.SaveChangesAsync();
                    await dbTransaction.CommitAsync();
                }
                catch (Exception ex)
                {
                    await dbTransaction.RollbackAsync();
                    return StatusCode(500, new { message = "Database mapping error! Payment could not be completed securely.", details = ex.Message });
                }
            }

            return Ok(new
            {
                message = "Payment successfully verified and student enrollment is now active!",
                transactionId = transaction.Id,
                referenceNumber = transaction.TransactionRef,
                amountPaid = transaction.Amount
            });
        }
    }
}
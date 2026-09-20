using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZabdyTech.DTOs;
using ZabdyTech.Models;
using ZabdyTech.Data;
using BCrypt.Net;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace ZabdyTech.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _config;

        public AccountController(ApplicationDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // ==========================================
        // SIGNUP / REGISTER ACTION METHOD
        // ==========================================
        [HttpPost("signup")]
        public async Task<IActionResult> RegisterStudent([FromBody] SignupDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // 1. Email Normalization (Trim & Lowercase)
            var normalizedEmail = model.Email.Trim().ToLower();

            var emailExists = await _context.Students.AnyAsync(s => s.Email.ToLower() == normalizedEmail);
            if (emailExists) return BadRequest(new { message = "This email is already registered." });

            // 2. Hash plain-text password using BCrypt
            string securePasswordHash = BCrypt.Net.BCrypt.HashPassword(model.Password);

            var newStudent = new Student
            {
                FirstName = model.FirstName.Trim(),
                LastName = model.LastName.Trim(),
                Email = normalizedEmail,
                PasswordHash = securePasswordHash,
                PhoneNumber = model.PhoneNumber,
                DateOfBirth = DateTime.SpecifyKind(model.DateOfBirth, DateTimeKind.Utc),
                Country = model.Country,
                Organization = string.Empty
            };

            _context.Students.Add(newStudent);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Student account created successfully." });
        }

        // ==========================================
        // SIGNIN / LOGIN ACTION METHOD WITH JWT
        // ==========================================
        [HttpPost("signin")]
        public async Task<IActionResult> LoginStudent([FromBody] LoginDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var normalizedEmail = model.Email.Trim().ToLower();

            // 1. Fetch Student record from DB
            var student = await _context.Students.FirstOrDefaultAsync(s => s.Email.ToLower() == normalizedEmail);
            if (student == null)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            // 2. Verify BCrypt Password Hash
            bool isPasswordValid = false;
            try
            {
                isPasswordValid = BCrypt.Net.BCrypt.Verify(model.Password, student.PasswordHash);
            }
            catch
            {
                isPasswordValid = false;
            }

            if (!isPasswordValid)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            // 3. Generate JWT Token
            var token = GenerateJwtToken(student);

            // 4. Client Payload Response
            return Ok(new
            {
                message = "Login successful.",
                token = token,
                studentName = $"{student.FirstName} {student.LastName}"
            });
        }

        // ==========================================
        // JWT TOKEN GENERATION HELPER
        // ==========================================
        private string GenerateJwtToken(Student student)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, student.Id.ToString()),
                new Claim(ClaimTypes.Email, student.Email),
                new Claim("FirstName", student.FirstName),
                new Claim(ClaimTypes.Role, "Student")
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // ==========================================
        // INSTRUCTOR SIGNIN / LOGIN METHOD
        // ==========================================
        [HttpPost("instructor/signin")]
        public async Task<IActionResult> LoginInstructor([FromBody] LoginDto model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var normalizedEmail = model.Email.Trim().ToLower();

            // 1. Fetch Instructor record from DB
            var instructor = await _context.Instructors.FirstOrDefaultAsync(i => i.Email.ToLower() == normalizedEmail);
            if (instructor == null)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            // 2. Direct Plain-Text Password Check
            if (instructor.PasswordHash != model.Password)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            // 3. Generate Instructor JWT Token
            var token = GenerateJwtTokenForInstructor(instructor);

            // 4. Client Response
            return Ok(new
            {
                message = "Instructor login successful.",
                token = token,
                instructorName = instructor.FullName,
                instructorId = instructor.InstructorId
            });
        }

        // ==========================================
        // INSTRUCTOR JWT TOKEN GENERATOR HELPER
        // ==========================================
        private string GenerateJwtTokenForInstructor(Instructor instructor)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, instructor.InstructorId.ToString()),
                new Claim(ClaimTypes.Email, instructor.Email),
                new Claim("FullName", instructor.FullName ?? "Instructor"),
                new Claim(ClaimTypes.Role, "Instructor")
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
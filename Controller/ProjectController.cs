using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using System;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using ZabdyTech.Data;
using ZabdyTech.Dtos;
using ZabdyTech.DTOs;
using ZabdyTech.Models;

namespace ZabdyTech.Controllers
{
    [Authorize] // 🛡️ ENFORCE JWT AUTHORIZATION ACROSS ENTIRE CONTROLLER
    [ApiController]
    [Route("api/Project")]
    public class ProjectController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ProjectController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 🔑 HELPER: EXTRACT USER ID FROM INCOMING JWT BEARER TOKEN CLAIMS
        private int GetUserIdFromClaims()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                              ?? User.FindFirst("sub")?.Value
                              ?? User.FindFirst("id")?.Value
                              ?? User.FindFirst("userId")?.Value;

            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            return 0;
        }

        // 🚀 ROUTE 0: GET DYNAMIC STUDENT DASHBOARD METRICS FROM DB (NO DTO)
        [HttpGet("dashboard-summary/{studentId}")]
        public async Task<IActionResult> GetDashboardSummary(int studentId)
        {
            try
            {
                int currentUserId = GetUserIdFromClaims();
                int targetStudentId = studentId > 0 ? studentId : currentUserId;

                // 1. Fetch Student's Enrolled Course (Flexible check for Active/Enrolled)
                var activeCourse = await _context.StudentCourses
                    .Include(sc => sc.Course)
                    .Where(sc => sc.StudentId == targetStudentId && (sc.Status == "Active" || sc.Status == "Enrolled"))
                    .Select(sc => sc.Course)
                    .FirstOrDefaultAsync();

                if (activeCourse == null)
                {
                    return Ok(new
                    {
                        courseName = "No Active Course",
                        projectName = "N/A",
                        deadline = "N/A",
                        submissionStatus = "N/A"
                    });
                }

                // 2. Fetch Active Course Project
                var activeProject = await _context.Projects
                    .Where(p => p.CourseId == activeCourse.CourseId)
                    .OrderByDescending(p => p.ProjectId)
                    .FirstOrDefaultAsync();

                string projectName = activeProject != null ? activeProject.Title : "N/A";
                string deadlineText = activeProject != null ? activeProject.Deadline.ToString("dd MMMM yyyy") : "N/A";

                // 3. Fetch current submission status for active project
                string submissionStatus = "Pending ⏳";
                if (activeProject != null)
                {
                    var submission = await _context.Project_Submission
                        .FirstOrDefaultAsync(s => s.StudentId == targetStudentId && s.ProjectId == activeProject.ProjectId);

                    if (submission != null)
                    {
                        if (submission.Status == "Graded" || submission.ObtainedMarks != null)
                        {
                            submissionStatus = "Graded 🎯";
                        }
                        else
                        {
                            submissionStatus = "Submitted ✅";
                        }
                    }
                }

                return Ok(new
                {
                    courseName = activeCourse.Title,
                    projectName = projectName,
                    deadline = deadlineText,
                    submissionStatus = submissionStatus
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Dashboard API Error]: {ex.Message}");
                return StatusCode(500, new { message = "Failed to fetch dashboard metrics.", error = ex.Message });
            }
        }

        // 🚀 ROUTE 1: UPLOAD SUBMITTED CODE MULTIPART PACKETS FROM FORM SUBMIT
        [HttpPost("upload-submission")]
        [ApiExplorerSettings(IgnoreApi = true)]
        public async Task<IActionResult> UploadSubmission([FromForm] int projectId, [FromForm] int studentId, [FromForm] string githubUrl, [FromForm] Microsoft.AspNetCore.Http.IFormFile submissionUrl)
        {
            if (submissionUrl == null || submissionUrl.Length == 0)
            {
                return BadRequest(new { message = "Uploaded file is empty or invalid." });
            }

            try
            {
                int tokenUserId = GetUserIdFromClaims();
                int effectiveStudentId = studentId > 0 ? studentId : tokenUserId;

                string simulatedPath = $"/uploads/submissions/project_{projectId}_student_{effectiveStudentId}.zip";

                var newSubmission = new ProjectSubmission
                {
                    ProjectId = projectId,
                    StudentId = effectiveStudentId,
                    SubmissionUrl = simulatedPath,
                    GithubUrl = githubUrl,
                    Status = "Submitted",
                    SubmittedAt = DateTime.UtcNow,
                    InstructorFeedback = string.Empty,
                    EvaluatedAt = null
                };

                _context.Project_Submission.Add(newSubmission);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Project submitted successfully!" });
            }
            catch (Exception ex)
            {
                System.Console.WriteLine("=== CRITICAL SUBMISSION EXCEPTION ===");
                System.Console.WriteLine(ex.Message);
                if (ex.InnerException != null)
                {
                    System.Console.WriteLine("Inner Exception: " + ex.InnerException.Message);
                }
                System.Console.WriteLine("=====================================");

                return StatusCode(500, new { message = "Failed to upload project submission.", error = ex.Message });
            }
        }

        // 🚀 ROUTE: GET ALL SUBMITTED/GRADED ACTIVE STUDENTS FOR LOGGED-IN INSTRUCTOR
        [HttpGet("submitted-students")]
        public async Task<IActionResult> GetSubmittedStudents()
        {
            try
            {
                int currentInstructorId = GetUserIdFromClaims();

                if (currentInstructorId <= 0)
                {
                    return Unauthorized(new { message = "Instructor session expired. Please log in again." });
                }

                var submissionsData = await (
                    from ps in _context.Set<ProjectSubmission>()
                    join proj in _context.Projects on ps.ProjectId equals proj.ProjectId
                    join st in _context.Students on ps.StudentId equals st.Id
                    join sc in _context.StudentCourses on st.Id equals sc.StudentId
                    where proj.InstructorId == currentInstructorId
                          && sc.CourseId == proj.CourseId
                          && sc.Status == "Active"
                          && (ps.Status == "Submitted" || ps.Status == "Graded" || ps.Status == "Evaluated")
                    select new
                    {
                        StudentId = st.Id,
                        StudentName = ((st.FirstName ?? "") + " " + (st.LastName ?? "")).Trim(),
                        ProjectId = proj.ProjectId,
                        ProjectTitle = proj.Title ?? "",
                        SubmissionUrl = ps.SubmissionUrl ?? "",
                        GithubUrl = ps.GithubUrl ?? "",
                        Status = ps.Status ?? "Submitted",
                        SubmittedAt = ps.SubmittedAt
                    }
                ).Distinct().ToListAsync();

                return Ok(submissionsData);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SUBMITTED STUDENTS DB ERROR]: {ex.Message}");
                return StatusCode(500, new
                {
                    message = "Failed to fetch student records from database.",
                    error = ex.Message
                });
            }
        }

        // 🚀 ROUTE 3: LOG MARKS AND EVALUATION
        [HttpPost("publish-grade")]
        public async Task<IActionResult> PublishGrade([FromBody] System.Text.Json.JsonElement payload)
        {
            try
            {
                int GetIntVal(string propName)
                {
                    if (payload.TryGetProperty(propName, out var val) ||
                        payload.TryGetProperty(char.ToLower(propName[0]) + propName[1..], out val))
                    {
                        if (val.ValueKind == System.Text.Json.JsonValueKind.Number)
                            return val.GetInt32();
                    }
                    return 0;
                }

                string GetStrVal(string propName)
                {
                    if (payload.TryGetProperty(propName, out var val) ||
                        payload.TryGetProperty(char.ToLower(propName[0]) + propName[1..], out val))
                    {
                        return val.GetString() ?? "";
                    }
                    return "";
                }

                int projectId = GetIntVal("ProjectId");
                int studentId = GetIntVal("StudentId");
                int obtainedMarks = GetIntVal("ObtainedMarks");
                string instructorFeedback = GetStrVal("InstructorFeedback");

                Console.WriteLine($"[GRADING LOG]: Incoming Request -> ProjectId: {projectId}, StudentId: {studentId}, Marks: {obtainedMarks}");

                var submission = await _context.Set<ProjectSubmission>()
                    .FirstOrDefaultAsync(s => s.StudentId == studentId && (projectId == 0 || s.ProjectId == projectId));
                if (submission == null)
                {
                    return NotFound(new { message = $"No submission record found for Student ID #{studentId} and Project ID #{projectId}." });
                }

                if (submission == null)
                {
                    return NotFound(new { message = $"No submission record found for Student ID #{studentId}." });
                }

                submission.ObtainedMarks = obtainedMarks;
                submission.InstructorFeedback = instructorFeedback;
                submission.Status = "Graded";
                submission.EvaluatedAt = DateTime.UtcNow;

                _context.Set<ProjectSubmission>().Update(submission);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Marks and feedback saved successfully!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine("=== CRITICAL GRADING RUNTIME EXCEPTION ===");
                Console.WriteLine(ex.Message);
                return StatusCode(500, new { message = "Failed to publish grade.", error = ex.Message });
            }
        }

        // 🚀 ROUTE 4: RETURN OBTAINED EVALUATIONS
        

        [HttpGet("student-submissions/{studentId}")]
        public async Task<IActionResult> GetStudentSubmissionHistory(int studentId)
        {
            try
            {
                int currentUserId = GetUserIdFromClaims();
                int targetStudentId = studentId > 0 ? studentId : currentUserId;

                var submissionsHistory = await _context.Project_Submission
                    .Where(p => p.StudentId == targetStudentId)
                    .OrderByDescending(p => p.SubmittedAt)
                    .Select(p => new
                    {
                        p.SubmissionId,
                        p.ProjectId,
                        SubmissionUrl = p.SubmissionUrl ?? "ZIP File",
                        Status = p.Status ?? "Submitted",
                        ObtainedMarks = p.ObtainedMarks,
                        SubmittedAt = p.SubmittedAt
                    })
                    .ToListAsync();

                return Ok(submissionsHistory);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to retrieve submission history.", error = ex.Message });
            }
        }

        // 1. GET STUDENT PROFILE
        [HttpGet("profile/{studentId}")]
        public async Task<IActionResult> GetProfile(int studentId)
        {
            try
            {
                int currentUserId = GetUserIdFromClaims();
                int targetStudentId = studentId > 0 ? studentId : currentUserId;

                var student = await _context.Students
                    .FirstOrDefaultAsync(s => s.Id == targetStudentId);

                if (student == null)
                {
                    return NotFound(new { message = $"Student ID #{targetStudentId} not found." });
                }

                // Fetch student course mapping with course details[cite: 1]
                var studentCourse = await _context.StudentCourses
                    .Include(sc => sc.Course)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(sc => sc.StudentId == targetStudentId && (sc.Status == "Active" || sc.Status == "Enrolled"));

                bool isEnrolled = studentCourse != null;

                return Ok(new
                {
                    studentId = student.Id,
                    firstName = student.FirstName ?? "",
                    lastName = student.LastName ?? "",
                    fullName = $"{student.FirstName} {student.LastName}".Trim(),
                    email = student.Email ?? "",
                    profilePictureUrl = studentCourse?.ProfileImage, // Frontend expects 'profilePictureUrl'[cite: 1]
                    isEnrolled = isEnrolled,
                    courseId = studentCourse?.CourseId,
                    courseName = studentCourse?.Course?.Title
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Profile API Crash]: {ex.Message}");
                return StatusCode(500, new
                {
                    message = "An error occurred while fetching profile details.",
                    error = ex.Message
                });
            }
        }

        // 2. UPDATE STUDENT PROFILE
        [HttpPut("update-profile/{studentId}")]
        public async Task<IActionResult> UpdateProfile(int studentId, [FromForm] UpdateProfileDto dto)
        {
            int currentUserId = GetUserIdFromClaims();
            int targetStudentId = studentId > 0 ? studentId : currentUserId;

            var student = await _context.Students.FindAsync(targetStudentId);
            if (student == null)
                return NotFound(new { message = "Student profile not found." });

            if (!string.IsNullOrWhiteSpace(dto.FirstName))
                student.FirstName = dto.FirstName;

            if (!string.IsNullOrWhiteSpace(dto.LastName))
                student.LastName = dto.LastName;

            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                student.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            }

            if (dto.ProfileImage != null && dto.ProfileImage.Length > 0)
            {
                string webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                string uploadsFolder = Path.Combine(webRootPath, "uploads", "profiles");

                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                string uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(dto.ProfileImage.FileName)}";
                string filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.ProfileImage.CopyToAsync(stream);
                }

                var studentCourse = await _context.StudentCourses
                    .FirstOrDefaultAsync(sc => sc.StudentId == targetStudentId);

                if (studentCourse != null)
                {
                    studentCourse.ProfileImage = $"http://localhost:5127/uploads/profiles/{uniqueFileName}";
                    _context.StudentCourses.Update(studentCourse);
                }
            }

            _context.Students.Update(student);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Profile updated successfully!" });
        }

        // 🎓 GET: api/Project/course-instructor/{studentId}
        // 🎓 GET: api/Project/course-instructor/{studentId} (Safe & Null-Protected)
        [HttpGet("course-instructor/{studentId}")]
        public async Task<IActionResult> GetCourseInstructor(int studentId)
        {
            try
            {
                int currentUserId = GetUserIdFromClaims();
                int targetStudentId = studentId > 0 ? studentId : currentUserId;

                // 1. Pehle student ki active course enrollment nikalain
                var studentCourse = await _context.StudentCourses
                    .Include(sc => sc.Course)
                    .ThenInclude(c => c.Instructor)
                    .Where(e => e.StudentId == targetStudentId && (e.Status == "Active" || e.Status == "Enrolled"))
                    .FirstOrDefaultAsync();

                if (studentCourse == null || studentCourse.Course == null)
                {
                    return Ok(new
                    {
                        courseName = "Enrolled Course",
                        courseDescription = "No description provided.",
                        fullName = "Assigned Mentor",
                        email = "mentor@zabdytech.com",
                        studyBackground = "Software Engineering"
                    });
                }

                var course = studentCourse.Course;
                var instructor = course.Instructor;

                return Ok(new
                {
                    // 🌟 Yeh course ki properties yahan add kar di hain
                    courseName = course.Title ?? "Enrolled Course",
                    courseDescription = course.Description ?? "No description provided.",

                    // Instructor ki properties
                    fullName = instructor?.FullName ?? "Assigned Mentor",
                    email = instructor?.Email ?? "mentor@zabdytech.com",
                    studyBackground = instructor?.Study_BackGround ?? "Software Engineering"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[COURSE INSTRUCTOR ERROR]: {ex.Message}");
                return StatusCode(500, new { message = "Failed to retrieve instructor record.", error = ex.Message });
            }
        }

        // 🚀 ROUTE 1: INSTRUCTOR PROFILE DETAILS
        [HttpGet("profile/instructor/{instructorId}")]
        public async Task<IActionResult> GetInstructorProfile(int instructorId)
        {
            try
            {
                int currentUserId = GetUserIdFromClaims();
                int targetId = instructorId > 0 ? instructorId : (currentUserId > 0 ? currentUserId : 10);

                var instructor = await _context.Instructors
                    .Where(i => i.InstructorId == targetId)
                    .Select(i => new
                    {
                        i.InstructorId,
                        FullName = i.FullName ?? "Instructor",
                        Study_BackGround = i.Study_BackGround ?? "Software Engineering"
                    })
                    .FirstOrDefaultAsync();

                if (instructor == null)
                {
                    return Ok(new
                    {
                        InstructorId = targetId,
                        FullName = "Lead Instructor",
                        Study_BackGround = "Software Engineering"
                    });
                }

                return Ok(instructor);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch instructor profile.", error = ex.Message });
            }
        }

        // 🚀 ROUTE 2: DASHBOARD OVERVIEW METRICS
        [HttpGet("dashboard-overview/{instructorId}")]
        public async Task<IActionResult> GetDashboardOverview(int instructorId)
        {
            try
            {
                int currentUserId = GetUserIdFromClaims();
                int targetId = instructorId > 0 ? instructorId : (currentUserId > 0 ? currentUserId : 10);

                var instructorCourseIds = await _context.Courses
                    .Where(c => c.InstructorId == targetId)
                    .Select(c => c.CourseId)
                    .ToListAsync();

                if (!instructorCourseIds.Any())
                {
                    instructorCourseIds = await _context.Courses.Select(c => c.CourseId).ToListAsync();
                }

                var totalProjects = await _context.Projects
                    .Where(p => instructorCourseIds.Contains(p.CourseId))
                    .CountAsync();

                var totalEnrolledStudents = await _context.StudentCourses
                    .Where(e => instructorCourseIds.Contains(e.CourseId))
                    .Select(e => e.StudentId)
                    .Distinct()
                    .CountAsync();

                var totalSubmissions = await _context.Project_Submission
                    .Where(ps => _context.Projects
                        .Where(p => instructorCourseIds.Contains(p.CourseId))
                        .Select(p => p.ProjectId)
                        .Contains(ps.ProjectId))
                    .CountAsync();

                return Ok(new
                {
                    TotalCreatedProjects = totalProjects,
                    TotalEnrolledStudents = totalEnrolledStudents,
                    TotalStudentSubmissions = totalSubmissions
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch dashboard metrics.", error = ex.Message });
            }
        }

        [HttpGet("allocated-courses/{instructorId}")]
        public async Task<IActionResult> GetAllocatedCourses(int instructorId)
        {
            try
            {
                int currentUserId = GetUserIdFromClaims();
                int targetId = instructorId > 0 ? instructorId : currentUserId;

                var courses = await _context.Courses
                    .Where(c => c.InstructorId.HasValue && c.InstructorId.Value == targetId)
                    .Select(c => new
                    {
                        CourseId = c.CourseId,
                        CourseName = c.Title
                    })
                    .ToListAsync();

                if (courses == null || !courses.Any())
                {
                    return NotFound(new { message = $"No courses assigned to Instructor ID #{targetId}." });
                }

                return Ok(courses);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch assigned courses.", details = ex.Message });
            }
        }

        // 🚀 ROUTE: DEPLOY NEW PROJECT BLUEPRINT
        [HttpPost("assign-project")]
        public async Task<IActionResult> AssignProject([FromBody] CreateProjectDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                int currentInstructorId = GetUserIdFromClaims();
                int effectiveInstructorId = dto.InstructorId > 0 ? dto.InstructorId : currentInstructorId;

                var courseExists = await _context.Courses.AnyAsync(c => c.CourseId == dto.CourseId);
                if (!courseExists)
                {
                    return BadRequest(new { message = $"Course ID #{dto.CourseId} does not exist." });
                }

                var newProject = new Project
                {
                    InstructorId = effectiveInstructorId,
                    CourseId = dto.CourseId,
                    Title = dto.Title,
                    Deadline = dto.Deadline,
                    ScopeSpecificationText = dto.ScopeSpecificationText,
                    DocumentDownloadUrl = dto.DocumentDownloadUrl ?? "",
                    WireframeUrl = dto.WireframeUrl ?? "",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Projects.Add(newProject);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Project assigned successfully!", projectId = newProject.ProjectId });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ASSIGN PROJECT ERROR]: {ex.Message}");
                return StatusCode(500, new
                {
                    message = "Failed to assign project due to a database error.",
                    error = ex.Message
                });
            }
        }

        // 📦 DTO Matching Front-End JS Payload
        public class CreateProjectDto
        {
            public int CourseId { get; set; }
            public int InstructorId { get; set; }
            public string Title { get; set; } = string.Empty;
            public DateTime Deadline { get; set; }
            public string ScopeSpecificationText { get; set; } = string.Empty;
            public string DocumentDownloadUrl { get; set; } = string.Empty;
            public string WireframeUrl { get; set; } = string.Empty;
        }

        [HttpGet("active-project/{studentId}")]
        public async Task<IActionResult> GetActiveUnsubmittedProject(int studentId)
        {
            try
            {
                int currentUserId = GetUserIdFromClaims();
                int targetStudentId = studentId > 0 ? studentId : currentUserId;

                var enrollment = await _context.StudentCourses
                    .Where(sc => sc.StudentId == targetStudentId)
                    .Select(sc => sc.CourseId)
                    .FirstOrDefaultAsync();

                if (enrollment == 0)
                {
                    return NotFound(new { message = "No course enrollment record found." });
                }

                var activeProject = await _context.Projects
                    .Where(p => p.CourseId == enrollment)
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefaultAsync();

                if (activeProject == null)
                {
                    return NotFound(new { message = "No active project assigned for your course." });
                }

                var submission = await _context.Project_Submission
                    .Where(ps => ps.ProjectId == activeProject.ProjectId && ps.StudentId == targetStudentId)
                    .FirstOrDefaultAsync();

                bool isSubmitted = submission != null;

                return Ok(new
                {
                    projectId = activeProject.ProjectId,
                    courseId = activeProject.CourseId,
                    title = activeProject.Title,
                    deadline = activeProject.Deadline.ToString("yyyy-MM-dd"),
                    scopeSpecificationText = activeProject.ScopeSpecificationText,
                    documentDownloadUrl = activeProject.DocumentDownloadUrl,
                    wireframeUrl = activeProject.WireframeUrl,
                    hasSubmitted = isSubmitted,
                    submissionStatus = isSubmitted ? submission.Status : "Pending"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to load project requirements.", error = ex.Message });
            }
        }
        [HttpGet("project-details")]
        public async Task<IActionResult> GetStudentActiveProjectDetails()
        {
            try
            {
                // 1. Get student ID from JWT token claims
                int currentUserId = GetUserIdFromClaims();
                if (currentUserId <= 0)
                {
                    return Unauthorized(new { message = "Invalid token or student session expired." });
                }

                // 2. Find the active course the student is enrolled in
                var activeCourseId = await _context.StudentCourses
                    .Where(sc => sc.StudentId == currentUserId && (sc.Status == "Active" || sc.Status == "Enrolled"))
                    .Select(sc => sc.CourseId)
                    .FirstOrDefaultAsync();

                if (activeCourseId == 0)
                {
                    return NotFound(new { message = "You are not enrolled in any active course." });
                }

                // 3. Find the latest project assigned to that course automatically
                var activeProject = await _context.Projects
                    .Where(p => p.CourseId == activeCourseId)
                    .OrderByDescending(p => p.CreatedAt)
                    .FirstOrDefaultAsync();

                if (activeProject == null)
                {
                    return NotFound(new { message = "No active project found for your enrolled course." });
                }

                // 4. Return the exact structure your frontend expects
                return Ok(new
                {
                    projectId = activeProject.ProjectId,
                    courseId = activeProject.CourseId,
                    title = activeProject.Title,
                    deadline = activeProject.Deadline,
                    scopeSpecificationText = activeProject.ScopeSpecificationText,
                    documentDownloadUrl = activeProject.DocumentDownloadUrl,
                    wireframeUrl = activeProject.WireframeUrl
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PROJECT DETAILS ERROR]: {ex.Message}");
                return StatusCode(500, new { message = "Failed to fetch project details.", error = ex.Message });
            }
        }

        // 🚀 ROUTE: SUBMIT PROJECT JSON PAYLOAD (Matches frontend submit-project call from student.js)
        [HttpPost("submit-project")]
        public async Task<IActionResult> SubmitProject([FromBody] System.Text.Json.JsonElement payload)
        {
            try
            {
                int studentId = payload.TryGetProperty("StudentId", out var sId) ? sId.GetInt32() : GetUserIdFromClaims();
                int projectId = payload.TryGetProperty("ProjectId", out var pId) ? pId.GetInt32() : 0;
                string githubUrl = payload.TryGetProperty("GithubUrl", out var gUrl) ? gUrl.GetString() ?? "" : "";
                string submissionUrl = payload.TryGetProperty("SubmissionUrl", out var subUrl) ? subUrl.GetString() ?? "Uploaded_Archive_Bundle.zip" : "Uploaded_Archive_Bundle.zip";

                // Check if project exists
                var projectExists = await _context.Projects.AnyAsync(p => p.ProjectId == projectId);
                if (!projectExists)
                {
                    return BadRequest(new { message = $"Project ID #{projectId} does not exist." });
                }

                var newSubmission = new ProjectSubmission
                {
                    ProjectId = projectId,
                    StudentId = studentId,
                    GithubUrl = githubUrl,
                    SubmissionUrl = submissionUrl,
                    Status = "Submitted",
                    SubmittedAt = DateTime.UtcNow,
                    InstructorFeedback = string.Empty,
                    EvaluatedAt = null
                };

                _context.Project_Submission.Add(newSubmission);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Project submitted successfully!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SUBMIT PROJECT ERROR]: {ex.Message}");
                return StatusCode(500, new { message = "Failed to submit project.", error = ex.Message });
            }
        }
        [HttpGet("graded-projects/{studentId}")]
        public async Task<IActionResult> GetGradedProjectsForStudent(int studentId)
        {
            try
            {
                int currentUserId = GetUserIdFromClaims();
                int targetStudentId = studentId > 0 ? studentId : currentUserId;

                // 1. StudentCourses associative entity se check karein ke student kis course mein enrolled hai
                var studentCourseMapping = await _context.StudentCourses
                    .Where(sc => sc.StudentId == targetStudentId)
                    .FirstOrDefaultAsync();

                if (studentCourseMapping == null)
                {
                    return Ok(new List<object>());
                }

                int courseId = studentCourseMapping.CourseId;

                // 2. Us course ke projects aur unki submissions jinka status Graded ho
                var gradedProjects = await _context.Projects
                    .Where(p => p.CourseId == courseId)
                    .Join(_context.Project_Submission,
                        project => project.ProjectId,
                        submission => submission.ProjectId,
                        (project, submission) => new { Project = project, Submission = submission })
                    .Where(x => x.Submission.StudentId == targetStudentId &&
                                (x.Submission.Status == "Graded" || x.Submission.ObtainedMarks != null))
                    .Select(x => new
                    {
                        projectId = x.Project.ProjectId,
                        projectTitle = x.Project.Title ?? x.Project.Title
                    })
                    .Distinct()
                    .ToListAsync();

                return Ok(gradedProjects);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch graded projects.", error = ex.Message });
            }
        }

        [HttpGet("student-result/{studentId}")]
        public async Task<IActionResult> GetStudentResultByStudent(int studentId)
        {
            try
            {
                int currentUserId = GetUserIdFromClaims();
                int targetStudentId = studentId > 0 ? studentId : currentUserId;

                // Student ki latest submission dhoondain (agar primary key ID ki jagah kuch aur ho toh yahan change karein)
                var submission = await _context.Project_Submission
                    .Where(s => s.StudentId == targetStudentId)
                    .OrderByDescending(s => s.SubmissionId) // Agar yahan error aaye toh apni primary key ka naam likhein jese SubmissionId
                    .FirstOrDefaultAsync();

                if (submission == null)
                {
                    return Ok(new
                    {
                        obtainedMarks = 0,
                        instructorFeedback = "No result or feedback uploaded yet for your current course track.",
                        status = "Pending"
                    });
                }

                return Ok(new
                {
                    obtainedMarks = submission.ObtainedMarks,
                    instructorFeedback = submission.InstructorFeedback ?? "No feedback provided yet.",
                    status = submission.Status ?? "Graded"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch student result.", error = ex.Message });
            }
        }

        [HttpGet("student-result/{projectId}/{studentId}")]
        public async Task<IActionResult> GetStudentResultByProjectAndStudent(int projectId, int studentId)
        {
            try
            {
                int currentUserId = GetUserIdFromClaims();
                int targetStudentId = studentId > 0 ? studentId : currentUserId;

                // Specific project aur student ki submission fetch karna
                var submission = await _context.Project_Submission
                    .Where(s => s.StudentId == targetStudentId && s.ProjectId == projectId)
                    .OrderByDescending(s => s.SubmissionId) // Agar yahan red line aaye toh s.Id ko apne model ki primary key se replace kar dein
                    .FirstOrDefaultAsync();

                if (submission == null)
                {
                    return Ok(new
                    {
                        obtainedMarks = 0,
                        instructorFeedback = "No result or feedback uploaded yet for this specific project.",
                        status = "Pending"
                    });
                }

                return Ok(new
                {
                    obtainedMarks = submission.ObtainedMarks,
                    instructorFeedback = submission.InstructorFeedback ?? "No feedback provided yet.",
                    status = submission.Status ?? "Graded"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch student result.", error = ex.Message });
            }
        }

        [HttpGet("pending-projects/{studentId}")]
        public async Task<IActionResult> GetPendingProjects(int studentId)
        {
            try
            {
                var submittedProjectIds = await _context.Project_Submission
                    .Where(s => s.StudentId == studentId)
                    .Select(s => s.ProjectId)
                    .ToListAsync();

                var pendingProjects = await _context.Projects
                    .Where(p => !submittedProjectIds.Contains(p.ProjectId))
                    .Select(p => new
                    {
                        projectId = p.ProjectId,
                        projectTitle = p.Title
                    })
                    .ToListAsync();

                return Ok(pendingProjects);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[PENDING PROJECTS ERROR]: {ex.Message}");
                return StatusCode(500, new { message = "Failed to fetch pending projects.", error = ex.Message });
            }
        }
    }
}
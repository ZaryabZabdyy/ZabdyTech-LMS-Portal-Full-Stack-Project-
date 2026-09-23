# Learning Management System (LMS) - Complete System & API Documentation

Welcome to the comprehensive technical documentation for the Learning Management System (LMS). This document covers the overall architecture, database schema, RESTful API endpoints, frontend integration modules, and security protocols implemented across the platform.

---

## 1. System Architecture & Tech Stack

The application is built using a modern decoupled architecture:
*   **Backend:** ASP.NET Core Web API / Entity Framework Core (C#), utilizing DTOs, Repository pattern, and SQL Server DbContext.
*   **Frontend:** Vanilla JavaScript (ES6+), HTML5, and CSS3/Tailwind styling structured across specialized portals (Enrollment, Authentication, Homepage, and Instructor Dashboard).
*   **Security & Auth:** Token/Session management, hashed credential storage, and multi-step OTP verification pipelines.

---

## 2. Database Schema & Models

The relational database is managed via Entity Framework Core with the following core entities:

### Users & Authentication
*   `UserId` (Primary Key, GUID/Int)
*   `Email` (Unique, String)
*   `PasswordHash` (String)
*   `Role` (Enum: Student, Instructor, Admin)
*   `ResetToken` (String, nullable)
*   `TokenExpiry` (DateTime, nullable)

### Courses & Syllabus
*   `CourseId` (Primary Key)
*   `Title` (String)
*   `Shift` (Enum: Morning, Evening)
*   `Description` (Text)
*   `InstructorId` (Foreign Key referencing Users)

### Enrollments & Payments
*   `EnrollmentId` (Primary Key)
*   `StudentId` (Foreign Key)
*   `CourseId` (Foreign Key)
*   `ShiftSelection` (String)
*   `PaymentMethod` (Enum: EasyPaisa, JazzCash)
*   `TransactionId` (String)
*   `Status` (Enum: Pending, Verified, Rejected)

---

## 3. Core Frontend Modules & Integration Logic

### A. Course Enrollment Gateway (`enrollment.html`, `enrollment.js`)
*   **Multi-step Form Flow:** Step 1 fetches student identity, Step 2 handles shift selection (Morning/Evening), and Step 3 manages mobile payment gateway verification (EasyPaisa/JazzCash) with transaction ID validation.
*   **API Payload Example:**
    ```json
    {
      "studentId": "10492",
      "courseId": "CS-101",
      "shift": "Morning",
      "paymentMethod": "EasyPaisa",
      "transactionId": "EP982347561"
    }
    ```

### B. Password Recovery Pipeline (`forget-pass.html`, `forget-pass.js`)
*   **3-Step Secure Flow:** 
    1. Email input and 5-digit OTP generation request.
    2. OTP verification code matching.
    3. Password update and database hashing commit.

### C. Homepage & Syllabus System (`homepage.html`, `homepage.js`)
*   Features a dynamic course catalog, interactive syllabus viewer, persistent user session states, and intelligent portal redirection based on user roles (Student vs. Instructor).

### D. Instructor Dashboard (`instructor_dashboard.html`, `instructor_dashboard.js`)
*   Faculty workspace allowing instructors to deploy project blueprints, evaluate student submissions, publish grades, and query the central student repository.

---

## 4. RESTful API Endpoints Reference

### Authentication & Password Reset
*   `POST /api/auth/login`
    *   *Request:* `{"email": "user@domain.com", "password": "securePassword"}`
    *   *Response:* `200 OK` with JWT Token and User Profile.
*   `POST /api/auth/forgot-password`
    *   *Request:* `{"email": "user@domain.com"}`
    *   *Response:* `200 OK` ("OTP sent successfully")
*   `POST /api/auth/verify-otp`
    *   *Request:* `{"email": "user@domain.com", "otp": "48192"}`
    *   *Response:* `200 OK` ("OTP verified")
*   `POST /api/auth/reset-password`
    *   *Request:* `{"email": "user@domain.com", "token": "...", "newPassword": "..."}`
    *   *Response:* `200 OK` ("Password updated successfully")

### Course Enrollment & Management
*   `GET /api/courses`
    *   *Response:* `200 OK` (Array of available courses and syllabi)
*   `POST /api/enrollments/submit`
    *   *Request:* Enrollment payload with payment credentials.
    *   *Response:* `201 Created` (Enrollment status: Pending Verification)

### Instructor Actions
*   `GET /api/instructor/submissions`
    *   *Response:* `200 OK` (List of pending student submissions)
*   `POST /api/instructor/grade`
    *   *Request:* `{"submissionId": 42, "marks": 88, "feedback": "Great structure!"}`
    *   *Response:* `20 0 OK` ("Grade published successfully")
 ### Password Recovery APIs 
 * This part handles forgotten passwords and sending 5-digit security codes via email.
   *  *Forgot PasswordEndpoint:* `POST /api/Auth/forgot-password`
   *  *What it takes:"* `ForgotPasswordRequestDto` (Email)
     What it does: Generates a random 5-digit code and emails it to the user using Gmail SMTP.
   *  *Verify CodeEndpoint:* `POST /api/Auth/verify-code`
   *  *What it takes:* `VerifyCodeRequestDto` (Email, ResetCode)
     What it does: Checks the database to make sure the code is correct, hasn't been used yet, and hasn't expired.
   *  *Reset PasswordEndpoint:* `POST /api/Auth/reset-password`
   *  *What it takes:* `ResetPasswordRequestDto` (Email, ResetCode, NewPassword)
    hat it does: Double-checks the code, hashes the brand-new password with BCrypt, and updates it in the database

---

## 5. Setup & Deployment Guidelines

1. **Database Connection:** Configure your connection string in `appsettings.json` targeting your SQL Server instance. Run Entity Framework migrations via terminal:
   ```bash
   dotnet ef database update
   ```
2. **Backend Execution:** Start the ASP.NET Core Web API server:
   ```bash
   dotnet run
   ```
3. **Frontend Deployment:** Serve the HTML/JS frontend files through a static web server or integrate them directly into the `wwwroot` folder of your ASP.NET Core project.

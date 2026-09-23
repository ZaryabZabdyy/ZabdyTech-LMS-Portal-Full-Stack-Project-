# Zabdy's Tech LMS Portal - Backend API Documentation

Yeh documentation Zabdy's Tech LMS portal ke backend APIs ki mukammal tafseel fraaham karti hai. Is project mein ASP.NET Core 8 Web API, Entity Framework Core, aur SQL Server/PostgreSQL ka istemal kiya gaya hai[cite: 1].

---

## 🔐 1. Account & Authentication APIs (`AccountController`)

Ye controller students aur instructors ki registration, login, aur JWT token generation ko handle karta hai[cite: 1].

### Register Student
- **Endpoint:** `POST /api/Account/signup`
- **Payload:** `SignupDto` (FirstName, LastName, Email, Password, PhoneNumber, DateOfBirth, Country)[cite: 1, 11]
- **Functionality:** Email normalization karta hai, BCrypt ke zariye password ko secure hash mein convert karta hai, aur naye student ka record database mein save karta hai[cite: 1].

### Student Login
- **Endpoint:** `POST /api/Account/signin`
- **Payload:** `LoginDto` (Email, Password)[cite: 1, 8]
- **Functionality:** Email aur BCrypt password hash ko verify karta hai, aur successful login par ek secure JWT token return karta hai[cite: 1].

### Instructor Login
- **Endpoint:** `POST /api/Account/instructor/signin`
- **Payload:** `LoginDto` (Email, Password)[cite: 1, 8]
- **Functionality:** Instructor ke credentials verify karta hai aur instructor role ke sath JWT token generate kar ke deta hai[cite: 1].

---

## 🔑 2. Password Recovery APIs (`AuthController`)

Yeh controller password recovery aur 5-digit OTP verification ko manage karta hai[cite: 2].

### Forgot Password
- **Endpoint:** `POST /api/Auth/forgot-password`
- **Payload:** `ForgotPasswordRequestDto` (Email)[cite: 2, 7]
- **Functionality:** User ki email par 5-digit ka random security verification code generate kar ke SMTP (Gmail) ke zariye bhejta hai[cite: 2].

### Verify Code
- **Endpoint:** `POST /api/Auth/verify-code`
- **Payload:** `VerifyCodeRequestDto` (Email, ResetCode)[cite: 2, 14]
- **Functionality:** Database mein check karta hai ke aya OTP valid, un-used aur non-expired hai ya nahi[cite: 2].

### Reset Password
- **Endpoint:** `POST /api/Auth/reset-password`
- **Payload:** `ResetPasswordRequestDto` (Email, ResetCode, NewPassword)[cite: 2, 10]
- **Functionality:** OTP ko dobara verify karne ke baad naye password ko BCrypt se hash karta hai aur database mein update kar deta hai[cite: 2].

---

## 🎒 3. Enrollment & Payment APIs (`EnrollmentController`)

Yeh controller students ki course enrollment aur fee submission ko handle karta hai[cite: 3].

### Get Student Profile For Enrollment
- **Endpoint:** `GET /api/Enrollment/student-profile`
- **Authorization:** Bearer Token (JWT)[cite: 3]
- **Functionality:** Logged-in student ki basic details (Name, Email, Phone) fetch karta hai taake enrollment form autofill ho sakay[cite: 3].

### Proceed To Payment
- **Endpoint:** `POST /api/Enrollment/proceed-to-payment`
- **Payload:** `SubmitStepDto` (Organization, Shift, Title)[cite: 3, 12]
- **Functionality:** Check karta hai ke student ka koi active course ya pending enrollment toh mojood nahi, phir naye course ke liye 'Pending' status ke sath enrollment create karta hai[cite: 3].

### Submit Payment
- **Endpoint:** `POST /api/Enrollment/submit-payment/{enrollmentId}`
- **Payload:** `PaymentDto` (PaymentMethod, TransactionId, Amount, aur optional Card/Wallet fields)[cite: 3, 9]
- **Functionality:** Manual TrxID ya Card details verify karta hai, duplicate transactions ko roktay huay ledger mein record save karta hai, aur student ki enrollment status ko atomic transaction ke sath instantly **'Active'** kar deta hai[cite: 3].

---

## 🚀 4. Project & Dashboard APIs (`ProjectController`)

Yeh controller students aur instructors ke project assignments, submissions, aur grading ko control karta hai[cite: 4].

### Get Dashboard Summary
- **Endpoint:** `GET /api/Project/dashboard-summary/{studentId}`
- **Functionality:** Student ke active course, assigned project, deadline, aur current submission status ki summary fetch karta hai[cite: 4].

### Assign Project (Instructor)
- **Endpoint:** `POST /api/Project/assign-project`
- **Payload:** `AssignProjectDto` (InstructorId, Title, Deadline, ScopeSpecificationText, DocumentDownloadUrl, WireframeUrl)[cite: 4, 5]
- **Functionality:** Instructor ki taraf se course ke liye naya project blueprint assign kiya jata hai[cite: 4].

### Submit Project (Student)
- **Endpoint:** `POST /api/Project/submit-project`
- **Functionality:** Student apne project ka GitHub URL aur submission details system mein upload karta hai[cite: 4].

### Publish Grade (Instructor)
- **Endpoint:** `POST /api/Project/publish-grade`
- **Functionality:** Instructor student ki submission par marks aur feedback publish karta hai jisse status 'Graded' ho jata hai[cite: 4].

### Student Profile & Results
- **Endpoints:** 
  - `GET /api/Project/profile/{studentId}` - Student profile details aur enrollment status fetch karta hai[cite: 4].
  - `PUT /api/Project/update-profile/{studentId}` - Student ki personal info aur profile picture update karta hai[cite: 4].
  - `GET /api/Project/student-result/{studentId}` - Student ke obtained marks aur feedback return karta hai[cite: 4].

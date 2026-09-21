Zabdy's Tech LMS Portal 🚀
Welcome to Zabdy''s Tech Learning Management System (LMS)! This is a full-stack web application built to provide a smooth and organized platform for technical courses—including Python, Artificial Intelligence (AI), and .NET Development.

Designed with simplicity, scalability, and performance in mind, this project connects a powerful backend API with a clean, lightweight frontend.

🛠️ Technologies Used
Backend
ASP.NET Core 8 Web API: Handles all server-side logic, routing, and business rules.
Entity Framework Core (EF Core): Manages database operations and maps C# models to SQL tables.
SQL Server: A structured, normalized relational database keeping all user, course, and enrollment data secure and organized.
JSON Web Tokens (JWT): Used for secure user authentication and session management.
Frontend
HTML5 & CSS3: Provides a clean, modern, and responsive user interface layout.
Vanilla JavaScript (ES6+): Handles dynamic user interactions, fetching data from the API, and updating the webpage seamlessly without heavy frameworks.
📚 Key Features
Course Catalog: Easily explore tech tracks like Python, AI, and .NET Development.
Normalized Database Design: Tables are carefully structured to avoid data duplication and ensure fast performance.
RESTful API Architecture: Clean endpoints that communicate between the server and client using simple, readable JSON formats.
Secure Endpoints: Protected routes ensuring data security and proper access control.
🎯 Future Improvements
**Adding student progress tracking and completion certificates.
**Enhancing UI animations and themes.
**Implementing role-based dashboards for admins and students.
📂 Project Structure
ZabdysTech-LMS/
│
├── Backend/                 # ASP.NET Core 8 Web API Project
│   ├── Controllers/         # API Endpoints (Courses, Users, Auth)
│   ├── Models/              # Database Entities & DTOs
│   ├── Data/                # Database Context & Configurations
│   └── Program.cs           # App startup and service configurations
│
└── Frontend/                # Client-side files
    ├── css/                 # Stylesheets
    ├── js/                  # JavaScript logic & API fetch handlers
    └── index.html           # Main user interface entry point


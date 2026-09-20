// LocalStorage se Auth Token hasil karne ka helper
function getAuthHeader() {
    const token = localStorage.getItem("jwt_token") || localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken") || localStorage.getItem("token") || sessionStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}

document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // 🔑 JWT DECODER HELPER (JWT TOKEN PARSER)
    // ==========================================
    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    function getAuthToken() {
        return localStorage.getItem("jwt_token") || localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken") || localStorage.getItem("token") || sessionStorage.getItem("token");
    }

    // Dynamic JWT extraction logic replacing hardcoded fallback ID
    const activeToken = getAuthToken();
    const tokenClaims = activeToken ? parseJwt(activeToken) : null;

    const extractedInstructorId = tokenClaims ?
        (tokenClaims.nameid || tokenClaims.sub || tokenClaims.InstructorId || tokenClaims.instructor_id || tokenClaims.UserId || tokenClaims.userId || tokenClaims["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"])
        : null;

    const rawInstructorId = extractedInstructorId || localStorage.getItem("instructor_id") || sessionStorage.getItem("instructor_id");
    const CURRENT_INSTRUCTOR_ID = rawInstructorId ? parseInt(rawInstructorId) : 12;

    const TARGET_PROJECT_ID = 6;
    const BASE_API_URL = "http://localhost:5127/api";

    let cachedSubmissionsList = [];
    let studentNamesCache = {};

    // ==========================================
    // 2. DOM ELEMENT REFERENCES
    // ==========================================
    const sidebarInstructorName = document.getElementById("sidebarInstructorName");
    const sidebarInstructorRole = document.getElementById("sidebarInstructorRole");
    const dynamicGreetingText = document.getElementById("dynamicGreetingText");
    const instructorSpecsText = document.getElementById("instructorSpecsText");

    const specsBulletContainer = document.getElementById("specsBulletContainer");
    const btnAddSpecBullet = document.getElementById("btnAddSpecBullet");

    const blueprintDeploymentForm = document.getElementById("blueprintDeploymentForm");
    const gradingSystemForm = document.getElementById("gradingSystemForm");

    const navItems = document.querySelectorAll(".nav-item");
    const viewPanels = document.querySelectorAll(".view-panel");

    const repoStudentSelect = document.getElementById("repoStudentSelect");
    const gradeStudentId = document.getElementById("gradeStudentId");
    const btnFetchRepoSubmission = document.getElementById("btnFetchRepoSubmission");
    const repoResultsDisplay = document.getElementById("repoResultsDisplay");
    const repoFallbackMessage = document.getElementById("repoFallbackMessage");
    const instructorLogoutBtn = document.getElementById("instructorLogoutBtn");

    // ==========================================
    // 🌀 CUSTOM Z-LOADER & POPUP CONTROLLERS
    // ==========================================
    function showZLoader(statusText = "Processing System Data...") {
        const loader = document.getElementById("zLoaderOverlay");
        const loaderText = document.getElementById("zLoaderText");
        if (loaderText) loaderText.textContent = statusText;
        if (loader) loader.classList.remove("hidden");
    }

    function hideZLoader() {
        const loader = document.getElementById("zLoaderOverlay");
        if (loader) loader.classList.add("hidden");
    }

    function showCustomPopup({ title = "Notification", message = "", icon = "⚡", isConfirm = false }) {
        return new Promise((resolve) => {
            const overlay = document.getElementById("customModalOverlay");
            const titleNode = document.getElementById("modalTitle");
            const msgNode = document.getElementById("modalMessage");
            const iconNode = document.getElementById("modalIcon");
            const confirmBtn = document.getElementById("modalConfirmBtn");
            const cancelBtn = document.getElementById("modalCancelBtn");

            if (!overlay) {
                alert(message);
                resolve(true);
                return;
            }

            if (titleNode) titleNode.textContent = title;
            if (msgNode) msgNode.textContent = message;
            if (iconNode) iconNode.textContent = icon;

            if (isConfirm) {
                if (cancelBtn) cancelBtn.classList.remove("hidden");
            } else {
                if (cancelBtn) cancelBtn.classList.add("hidden");
            }

            overlay.classList.remove("hidden");

            const onConfirm = () => {
                cleanup();
                resolve(true);
            };

            const onCancel = () => {
                cleanup();
                resolve(false);
            };

            function cleanup() {
                overlay.classList.add("hidden");
                if (confirmBtn) confirmBtn.removeEventListener("click", onConfirm);
                if (cancelBtn) cancelBtn.removeEventListener("click", onCancel);
            }

            if (confirmBtn) confirmBtn.addEventListener("click", onConfirm);
            if (cancelBtn) cancelBtn.addEventListener("click", onCancel);
        });
    }

    // ==========================================
    // 3. UTILITY & DYNAMIC DATA EXTRACTION ENGINE
    // ==========================================
    function getAuthHeaders() {
        const token = getAuthToken();
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        return headers;
    }

    async function fetchStudentNameById(studentId) {
        if (studentNamesCache[studentId]) return studentNamesCache[studentId];

        try {
            // Using matched Endpoint: GET api/Project/profile/{studentId}
            const res = await fetch(`${BASE_API_URL}/Project/profile/${studentId}`, {
                method: "GET",
                headers: getAuthHeaders()
            });
            if (res.ok) {
                const data = await res.json();
                const fullName = data.fullName || data.FullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || `Student #${studentId}`;
                studentNamesCache[studentId] = fullName;
                return fullName;
            }
        } catch (e) {
            console.warn(`Could not resolve student profile for ID #${studentId}`);
        }

        const fallback = `Student Node #${studentId}`;
        studentNamesCache[studentId] = fallback;
        return fallback;
    }

    function formatDateDisplay(rawDate) {
        if (!rawDate) return "N/A";
        const parsed = new Date(rawDate);
        if (isNaN(parsed.getTime())) return rawDate;

        return parsed.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // ==========================================
    // 4. NAVIGATION ROUTING SYSTEM
    // ==========================================
    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();

            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");

            const targetViewId = item.getAttribute("data-target");

            viewPanels.forEach(panel => panel.classList.add("hidden"));

            const targetPanel = document.getElementById(targetViewId);
            if (targetPanel) {
                targetPanel.classList.remove("hidden");

                if (targetViewId === "dashboard-view") {
                    fetchInstructorProfileData();
                    fetchDashboardOverviewMetrics();
                }
            }
        });
    });

    // ==========================================
    // 5. PROFILE, METRICS & DYNAMIC COURSES API
    // ==========================================

    async function fetchInstructorProfileData() {
        try {
            const savedInstructorName = localStorage.getItem("instructor_name");

            // Matched Route: GET api/Project/profile/instructor/{instructorId}
            const response = await fetch(`${BASE_API_URL}/Project/profile/instructor/${CURRENT_INSTRUCTOR_ID}`, {
                method: "GET",
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const profile = await response.json();
                // Priority given to DB FullName over email fallback
                const name = profile.fullName || profile.FullName || profile.name || profile.Name || (savedInstructorName && !savedInstructorName.includes('.') ? savedInstructorName : "Lead Instructor");
                const bg = profile.study_BackGround || profile.Study_BackGround || "Software Engineering";

                if (sidebarInstructorName) sidebarInstructorName.textContent = name;
                if (sidebarInstructorRole) sidebarInstructorRole.textContent = bg;
                if (dynamicGreetingText) dynamicGreetingText.textContent = `Welcome Back, ${name}!`;
                if (instructorSpecsText) instructorSpecsText.textContent = `${bg} | Dashboard Active`;
            } else if (savedInstructorName) {
                if (sidebarInstructorName) sidebarInstructorName.textContent = savedInstructorName;
                if (dynamicGreetingText) dynamicGreetingText.textContent = `Welcome Back, ${savedInstructorName}!`;
            }
        } catch (err) {
            console.error("Profile sync exception:", err);
            const savedInstructorName = localStorage.getItem("instructor_name");
            if (savedInstructorName && sidebarInstructorName) {
                sidebarInstructorName.textContent = savedInstructorName;
            }
        }
    }

    async function fetchDashboardOverviewMetrics() {
        try {
            // Matched Route: GET api/Project/dashboard-overview/{instructorId}
            const response = await fetch(`${BASE_API_URL}/Project/dashboard-overview/${CURRENT_INSTRUCTOR_ID}`, {
                method: "GET",
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const stats = await response.json();
                const students = stats.totalEnrolledStudents ?? stats.TotalEnrolledStudents ?? 0;
                const projects = stats.totalCreatedProjects ?? stats.TotalCreatedProjects ?? 0;
                const submissions = stats.totalStudentSubmissions ?? stats.TotalStudentSubmissions ?? 0;

                const activeStudentsElem = document.getElementById("activeStudentsCount");
                if (activeStudentsElem) activeStudentsElem.textContent = students;

                const activeProjectsElem = document.getElementById("activeProjectsCount");
                if (activeProjectsElem) activeProjectsElem.textContent = projects;

                const pendingEvalsElem = document.getElementById("pendingEvaluationsCount");
                if (pendingEvalsElem) pendingEvalsElem.textContent = submissions;
            }
        } catch (err) {
            console.error("Dashboard overview error:", err);
        }
    }

    async function loadAllocatedInstructorCourses() {
        const trackSelect = document.getElementById("targetTrack");
        if (!trackSelect) return;

        try {
            // Matched Route: GET api/Project/allocated-courses/{instructorId}
            const response = await fetch(`${BASE_API_URL}/Project/allocated-courses/${CURRENT_INSTRUCTOR_ID}`, {
                method: "GET",
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const courses = await response.json();
                trackSelect.innerHTML = `<option value="" disabled selected>Select Authorized Course Mapping</option>`;

                courses.forEach(c => {
                    const cId = c.courseId || c.CourseId;
                    const cTitle = c.courseName || c.CourseName || `Course Track #${cId}`;

                    trackSelect.innerHTML += `<option value="${cId}">${cTitle}</option>`;
                });
            } else {
                trackSelect.innerHTML = `<option value="" disabled>No allocated courses found for this instructor</option>`;
            }
        } catch (err) {
            console.error("Course mapping sync error:", err);
            trackSelect.innerHTML = `<option value="" disabled>Failed to load allocated courses</option>`;
        }
    }

    // 🚀 INITIALIZE DASHBOARD & POPULATE SUBMITTED STUDENTS DROPDOWN
    async function initializeSystemComponents() {
        showZLoader("Initializing System Diagnostics & Fetching Data...");
        try {
            if (typeof fetchInstructorProfileData === "function") await fetchInstructorProfileData();
            if (typeof fetchDashboardOverviewMetrics === "function") await fetchDashboardOverviewMetrics();
            if (typeof loadAllocatedInstructorCourses === "function") await loadAllocatedInstructorCourses();

            // API Call: No parameters, pure JWT token authentication
            const response = await fetch(`${BASE_API_URL}/Project/submitted-students`, {
                method: "GET",
                headers: getAuthHeaders()
            });

            if (response.ok) {
                cachedSubmissionsList = await response.json();

                const defaultPlaceholder = `<option value="" disabled selected>Select a student node...</option>`;

                const gradeStudentSelect = document.getElementById("gradeStudentId");
                const repoStudentSelect = document.getElementById("repoStudentSelect");

                if (gradeStudentSelect) gradeStudentSelect.innerHTML = defaultPlaceholder;
                if (repoStudentSelect) repoStudentSelect.innerHTML = defaultPlaceholder;

                if (!cachedSubmissionsList || cachedSubmissionsList.length === 0) {
                    const emptyOption = `<option value="" disabled>No active student submissions found</option>`;
                    if (gradeStudentSelect) gradeStudentSelect.innerHTML += emptyOption;
                    if (repoStudentSelect) repoStudentSelect.innerHTML += emptyOption;
                } else {
                    // Populate Dropdown matching exact DB response fields (Value now contains both student ID and project ID separated by a hyphen)
                    cachedSubmissionsList.forEach(sub => {
                        const sId = sub.studentId || sub.StudentId;
                        const pId = sub.projectId || sub.ProjectId;
                        const sName = sub.studentName || sub.StudentName || `Student #${sId}`;
                        const projectTitle = sub.projectTitle || sub.ProjectTitle || 'Project';
                        const statusVal = sub.status || sub.Status || 'Submitted';

                        const optionHtml = `<option value="${sId}-${pId}">${sName} (ID: #${sId}) - [${projectTitle}] - [${statusVal}]</option>`;

                        if (gradeStudentSelect) gradeStudentSelect.innerHTML += optionHtml;
                        if (repoStudentSelect) repoStudentSelect.innerHTML += optionHtml;
                    });
                }
            }
        } catch (error) {
            console.error("Error populating submitted students dropdown:", error);
        } finally {
            hideZLoader();
        }
    }

    if (btnFetchRepoSubmission && repoStudentSelect) {
        btnFetchRepoSubmission.addEventListener("click", async () => {
            const selectedDropdownValue = repoStudentSelect.value;
            const [studentPart] = selectedDropdownValue.split("-");
            const selectedStudentId = parseInt(studentPart);

            if (!selectedStudentId) {
                if (typeof showCustomPopup === "function") {
                    await showCustomPopup({
                        title: "Student Unselected",
                        message: "Please select a student record first to query submission details.",
                        icon: "⚠️"
                    });
                } else {
                    alert("Please select a student record first.");
                }
                return;
            }

            // Direct client-side lookup from cached payload
            const selectedRecord = cachedSubmissionsList.find(sub =>
                (sub.studentId || sub.StudentId) == selectedStudentId
            );

            if (selectedRecord && typeof renderSubmissionDetails === "function") {
                renderSubmissionDetails({
                    studentId: selectedRecord.studentId || selectedRecord.StudentId,
                    studentName: selectedRecord.studentName || selectedRecord.StudentName,
                    projectTitle: selectedRecord.projectTitle || selectedRecord.ProjectTitle,
                    status: selectedRecord.status || selectedRecord.Status,
                    submittedAt: selectedRecord.submittedAt || selectedRecord.SubmittedAt,
                    submissionUrl: selectedRecord.submissionUrl || selectedRecord.SubmissionUrl,
                    githubUrl: selectedRecord.githubUrl || selectedRecord.GithubUrl
                });
            }
        });
    }

    // ==========================================
    // 6. DYNAMIC BULLET SPECIFICATION HANDLERS
    // ==========================================
    if (btnAddSpecBullet && specsBulletContainer) {
        btnAddSpecBullet.addEventListener("click", () => {
            const groupNode = document.createElement("div");
            groupNode.className = "spec-input-group";
            groupNode.innerHTML = `
                <input type="text" class="spec-bullet-input" placeholder="Specify requirement parameter..." required>
                <button type="button" class="btn-remove-bullet">×</button>
            `;
            specsBulletContainer.appendChild(groupNode);
        });
    }

    if (specsBulletContainer) {
        specsBulletContainer.addEventListener("click", async (e) => {
            if (e.target.classList.contains("btn-remove-bullet")) {
                const totalInputs = specsBulletContainer.querySelectorAll(".spec-input-group").length;
                if (totalInputs > 1) {
                    e.target.parentElement.remove();
                } else {
                    await showCustomPopup({
                        title: "Action Restricted",
                        message: "A minimum of one blueprint specification parameter is required for project creation.",
                        icon: "⚠️"
                    });
                }
            }
        });
    }

    // ==========================================
    // 7. FORM SUBMISSIONS & ACTIONS
    // ==========================================

    // Action 1: Deploy Project Blueprint (Matched Route: POST api/Project/assign-project)
    if (blueprintDeploymentForm) {
        blueprintDeploymentForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const trackElem = document.getElementById("targetTrack");
            const selectedCourseId = trackElem ? parseInt(trackElem.value) : 0;

            if (!selectedCourseId) {
                await showCustomPopup({
                    title: "Missing Course Track",
                    message: "Please select a valid allocated course track before deploying the blueprint.",
                    icon: "⚠️"
                });
                return;
            }

            const rawInputs = document.querySelectorAll(".spec-bullet-input");
            const specsListArray = [];
            rawInputs.forEach(input => {
                if (input.value.trim()) {
                    specsListArray.push(input.value.trim());
                }
            });

            const titleElem = document.getElementById("targetTitle");
            const deadlineElem = document.getElementById("targetDeadline");
            const docUrlElem = document.getElementById("specDocUrl");
            const wireframeElem = document.getElementById("wireframeUrl");

            let isoUtcDeadline = new Date().toISOString();

            if (deadlineElem && deadlineElem.value) {
                const parsedDate = new Date(deadlineElem.value);
                if (!isNaN(parsedDate.getTime())) {
                    isoUtcDeadline = parsedDate.toISOString();
                }
            }

            const deploymentPayloadDto = {
                instructorId: CURRENT_INSTRUCTOR_ID,
                courseId: selectedCourseId,
                title: titleElem ? titleElem.value.trim() : "New Project Blueprint",
                deadline: isoUtcDeadline,
                scopeSpecificationText: specsListArray.join("\n"),
                documentDownloadUrl: docUrlElem ? docUrlElem.value.trim() : "",
                wireframeUrl: wireframeElem ? wireframeElem.value.trim() : ""
            };

            showZLoader("Deploying metadata blueprint to database...");

            try {
                const response = await fetch(`${BASE_API_URL}/Project/assign-project`, {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify(deploymentPayloadDto)
                });

                const data = await response.json().catch(() => ({}));
                hideZLoader();

                if (response.ok) {
                    await showCustomPopup({
                        title: "Blueprint Deployed",
                        message: `Database Confirmed: New project blueprint created for Course ID #${selectedCourseId}!`,
                        icon: "✅"
                    });
                    blueprintDeploymentForm.reset();
                    fetchDashboardOverviewMetrics();
                } else {
                    await showCustomPopup({
                        title: "Deployment Failed",
                        message: `Server Error: ${data.message || "Failed project creation."}`,
                        icon: "❌"
                    });
                }
            } catch (error) {
                hideZLoader();
                console.error("Project deployment exception:", error);
                await showCustomPopup({
                    title: "Connection Error",
                    message: "API Cluster Error: Port 5127 backend endpoint unreachable.",
                    icon: "🚫"
                });
            }
        });
    }

    // Action 2: Publish Grade Evaluation (Matched Route: POST api/Project/publish-grade)
    if (gradingSystemForm) {
        gradingSystemForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const studentIdElem = document.getElementById("gradeStudentId");
            const marksElem = document.getElementById("allocatedMarks") || document.getElementById("gradeMarksInput");
            const feedbackElem = document.getElementById("gradingFeedback") || document.getElementById("gradeFeedbackInput");

            const selectedDropdownValue = studentIdElem ? studentIdElem.value : "";
            const [studentPart, projectPart] = selectedDropdownValue.split("-");

            const studentIdVal = studentPart ? parseInt(studentPart) : 0;
            const activeProjectId = projectPart ? parseInt(projectPart) : 0;

            const marksVal = marksElem ? parseInt(marksElem.value) : 0;
            const feedbackVal = feedbackElem ? feedbackElem.value.trim() : "";

            if (!studentIdVal || !activeProjectId) {
                await showCustomPopup({
                    title: "Selection Required",
                    message: "Please select a target student and project node before submitting scores.",
                    icon: "⚠️"
                });
                return;
            }

            const gradingPayloadDto = {
                ProjectId: parseInt(activeProjectId) || 0,
                StudentId: parseInt(studentIdVal) || 0,
                ObtainedMarks: parseInt(marksVal) || 0,
                InstructorFeedback: feedbackVal
            };

            showZLoader("Committing grade evaluation to database...");

            try {
                // Explicit lowercase/case-matched URL
                const response = await fetch(`${BASE_API_URL}/Project/publish-grade`, {
                    method: "POST",
                    headers: getAuthHeaders(), // JWT Token strictly passed here
                    body: JSON.stringify(gradingPayloadDto)
                });

                const data = await response.json().catch(() => ({}));
                hideZLoader();

                if (response.ok) {
                    await showCustomPopup({
                        title: "Evaluation Submitted",
                        message: "Evaluation criteria scores successfully logged in database!",
                        icon: "🎉"
                    });
                    gradingSystemForm.reset();
                    initializeSystemComponents();
                } else {
                    await showCustomPopup({
                        title: "Grading Error",
                        message: `Server Rejected (${response.status}): ${data.message || "Unable to commit evaluation grades."}`,
                        icon: "❌"
                    });
                }
            } catch (err) {
                hideZLoader();
                await showCustomPopup({
                    title: "Network Exception",
                    message: "Connection failed on API cluster port.",
                    icon: "🚫"
                });
            }
        });
    }

    // ==========================================
    // 8. REPOSITORY VIEW LOGIC (EXACT MATCH WITH CONTROLLER)
    // ==========================================
    if (btnFetchRepoSubmission && repoStudentSelect) {
        btnFetchRepoSubmission.addEventListener("click", async () => {
            const selectedDropdownValue = repoStudentSelect.value;
            const [studentPart, projectPart] = selectedDropdownValue.split("-");
            const selectedStudentId = parseInt(studentPart);
            const selectedProjectId = projectPart ? parseInt(projectPart) : TARGET_PROJECT_ID;

            if (!selectedStudentId) {
                await showCustomPopup({
                    title: "Student Unselected",
                    message: "Please select a student record first to query submission details.",
                    icon: "⚠️"
                });
                return;
            }

            showZLoader("Fetching student repository payload...");

            // Look up initial submission info cached during page initialization
            const cachedStudent = cachedSubmissionsList.find(sub =>
                (sub.studentId || sub.StudentId) == selectedStudentId && (sub.projectId || sub.ProjectId) == selectedProjectId
            );

            try {
                // Matched Existing Route: GET api/Project/student-submissions/{studentId}
                const response = await fetch(`${BASE_API_URL}/Project/student-submissions/${selectedStudentId}`, {
                    method: "GET",
                    headers: getAuthHeaders()
                });

                hideZLoader();

                if (response.ok) {
                    const historyList = await response.json();

                    // Filter history for exact selected project ID
                    const currentSubmission = historyList.find(h => (h.projectId || h.ProjectId) == selectedProjectId) || historyList[0];

                    if (currentSubmission) {
                        const studentName = await fetchStudentNameById(selectedStudentId);
                        renderSubmissionDetails({
                            studentId: selectedStudentId,
                            studentName: studentName,
                            status: currentSubmission.status || currentSubmission.Status || (cachedStudent ? (cachedStudent.status || cachedStudent.Status) : "Submitted"),
                            submittedAt: currentSubmission.submittedAt || currentSubmission.SubmittedAt,
                            submissionUrl: currentSubmission.submissionUrl || currentSubmission.SubmissionUrl || (cachedStudent ? (cachedStudent.submissionUrl || cachedStudent.SubmissionUrl) : ""),
                            githubUrl: currentSubmission.githubUrl || currentSubmission.GithubUrl || (cachedStudent ? (cachedStudent.githubUrl || cachedStudent.GithubUrl) : "")
                        });
                        return;
                    }
                }
            } catch (err) {
                hideZLoader();
                console.log("History fetch failed, using direct cached fallback.");
            }

            // Fallback Rendering using direct initial load data
            if (cachedStudent) {
                const studentName = await fetchStudentNameById(selectedStudentId);
                renderSubmissionDetails({
                    studentId: selectedStudentId,
                    studentName: studentName,
                    status: cachedStudent.status || cachedStudent.Status || "Submitted",
                    submittedAt: new Date().toISOString(),
                    submissionUrl: cachedStudent.submissionUrl || cachedStudent.SubmissionUrl || "",
                    githubUrl: cachedStudent.githubUrl || cachedStudent.GithubUrl || ""
                });
            } else {
                if (repoResultsDisplay) repoResultsDisplay.classList.add("hidden");

                if (repoFallbackMessage) {
                    repoFallbackMessage.classList.remove("hidden");
                    repoFallbackMessage.textContent = "No repository submission metadata logged for this student.";
                }
            }
        });
    }

    // Display Renderer (Fully Matched)
    function renderSubmissionDetails(data) {
        if (repoFallbackMessage) repoFallbackMessage.classList.add("hidden");

        if (repoResultsDisplay) {
            repoResultsDisplay.classList.remove("hidden");

            const sId = data.studentId;
            const sName = data.studentName || `Student #${sId}`;
            const statusVal = data.status || "Submitted";
            const formattedDate = formatDateDisplay(data.submittedAt);

            const sourceCodeUrl = data.submissionUrl || "";
            const externalUrl = data.githubUrl || "";

            repoResultsDisplay.innerHTML = `
                <div style="background: rgba(9, 15, 29, 0.8); border: 1px solid var(--border-color, #1e293b); padding: 1.75rem; border-radius: 10px; color: #f8fafc;">
                    
                    <h3 style="color: #00cbff; font-size: 1.3rem; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">
                        📋 Submission Record Node
                    </h3>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                        <div>
                            <span style="color: #94a3b8; font-size: 0.85rem; display: block;">Student Name</span>
                            <strong style="font-size: 1.05rem; color: #fff;">${sName}</strong>
                        </div>
                        <div>
                            <span style="color: #94a3b8; font-size: 0.85rem; display: block;">Student ID</span>
                            <strong style="font-size: 1.05rem; color: #fff;">#${sId}</strong>
                        </div>
                        <div>
                            <span style="color: #94a3b8; font-size: 0.85rem; display: block;">Submission Status</span>
                            <span style="background: #0284c7; color: #fff; padding: 2px 10px; border-radius: 4px; font-size: 0.85rem; font-weight: 600;">${statusVal}</span>
                        </div>
                        <div>
                            <span style="color: #94a3b8; font-size: 0.85rem; display: block;">Submitted Date & Time</span>
                            <strong style="font-size: 1rem; color: #e2e8f0;">${formattedDate}</strong>
                        </div>
                    </div>

                    <div style="border-top: 1px dashed rgba(255,255,255,0.15); margin: 1.25rem 0;"></div>

                    <div style="margin-bottom: 1.25rem;">
                        <h4 style="color: #38bdf8; margin-bottom: 0.35rem; font-size: 1rem;">📁 Source Code URL:</h4>
                        ${sourceCodeUrl ? `
                            <a href="${sourceCodeUrl}" target="_blank" style="color: #60a5fa; text-decoration: underline; word-break: break-all; font-size: 0.95rem;">
                                ${sourceCodeUrl}
                            </a>
                        ` : `<span style="color: #64748b; font-size: 0.9rem;">No source code file/link provided.</span>`}
                    </div>

                    <div>
                        <h4 style="color: #34d399; margin-bottom: 0.35rem; font-size: 1rem;">🌐 External Links / Repository:</h4>
                        ${externalUrl ? `
                            <a href="${externalUrl}" target="_blank" rel="noopener noreferrer" style="color: #4ade80; text-decoration: underline; word-break: break-all; font-size: 0.95rem;">
                                ${externalUrl}
                            </a>
                        ` : `<span style="color: #64748b; font-size: 0.9rem;">No external links or GitHub URL provided.</span>`}
                    </div>

                </div>
            `;
        }
    }

    // ==========================================
    // 9. LOGOUT GATEWAY CONTROLLER
    // ==========================================
    if (instructorLogoutBtn) {
        instructorLogoutBtn.addEventListener("click", async () => {
            const confirmLogout = await showCustomPopup({
                title: "Confirm Sign Out",
                message: "Are you sure you want to terminate your instructor session and log out?",
                icon: "🚪",
                isConfirm: true
            });

            if (confirmLogout) {
                localStorage.clear();
                sessionStorage.clear();
                window.location.replace("login.html");
            }
        });
    }

    // ==========================================
    // 10. SYSTEM EXECUTION BOOTSTRAP
    // ==========================================
    initializeSystemComponents();

});
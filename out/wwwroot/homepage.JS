// ==========================================================================
// 📚 DATA HUB: Dynamic Course Outlines, Benefits, Pricing, and Explicit URL Keys
// ==========================================================================
const courseSyllabusDatabase = {
    "Java Programming Masterclass": {
        key: "fswd",
        benefits: "Java is the backbone of global enterprise scaling. By mastering JVM architectures and concurrency controls inside this track, you qualify directly for high-throughput transactional engineering domains in multi-national software houses.",
        price: "Rs. 11,500",
        modules: [
            { title: "Module 1: JVM Architecture & Memory Frameworks", desc: "Understand Garbage Collection sweeps, Stack vs Heap management constraints, and custom compilation configurations." },
            { title: "Module 2: Advanced OOP & Object States", desc: "Design loose coupling behaviors using strict interface modeling patterns and behavioral isolation constructs." },
            { title: "Module 3: Enterprise Multi-Threading Cycles", desc: "Build asynchronous safe runtime environments, handle state contentions, and implement thread-pool optimization locks." }
        ]
    },
    "Python Scripting & Automation": {
        key: "cyber",
        benefits: "Automating operational workflows is an essential efficiency requirement for any tech stack. This track establishes foundational capabilities to write rapid automation modules, parse file formats securely, and map programmatic triggers.",
        price: "Rs. 9,500",
        modules: [
            { title: "Module 1: Script Logic and Advanced Structures", desc: "Master comprehension sequences, list slicing boundaries, memory pointers, and modular data transformations." },
            { title: "Module 2: Direct File OS & API Parsing Integrations", desc: "Construct multi-format IO automation scripts to scrape text matrix schemas, map file structures, and parse network objects." }
        ]
    },
    "Applied Machine Learning Systems": {
        key: "ai",
        benefits: "Predictive intelligence forms the core of modern enterprise decision logic. Mastery of algorithmic weights and dataset processing prepares you for highly technical AI engineering opportunities globally.",
        price: "Rs. 18,000",
        modules: [
            { title: "Module 1: Data Dimensionality & Vector Matrices", desc: "Implement linear algebraic structures, format multi-column vectors, and prepare mathematical input channels." },
            { title: "Module 2: Algorithmic Modeling & Performance Optimization", desc: "Train classification frameworks, manage loss calculations, control regression boundaries, and optimize gradient drops." }
        ]
    },
    "Data Science & Pipeline Engineering": {
        key: "dsa",
        benefits: "Data pipelines dictate business health. Learning pipeline wrangling structures helps you extract actionable insights from unstructured multi-million records instantly.",
        price: "Rs. 16,500",
        modules: [
            { title: "Module 1: High-Volume Extraction Realities", desc: "Process stream ingestion workflows, clean null-value distribution skewness, and set up automated data pipelines." }
        ]
    },
    "C# Core & Advanced Patterns": {
        key: "desktop",
        benefits: "C# combined with the .NET runtime empowers full-stack desktop and backend services with absolute type-safety. Understanding its granular structures optimizes memory boundaries during execution loops.",
        price: "Rs. 12,000",
        modules: [
            { title: "Module 1: Type Systems & Generic Contexts", desc: "Write explicit compile-time code generic behaviors, optimize memory allocation structures, and design generic constraints." },
            { title: "Module 2: Linq Architecture & Expression Trees", desc: "Execute complex conditional joins, query optimization pipelines, and map entity-framework database relationships cleanly." }
        ]
    },
    "Backend Architecture & Routing": {
        key: "devops",
        benefits: "A robust backend ensures zero-downtime data delivery. Master architectural routing isolation, data safety controls, and multi-tenant scaling rules.",
        price: "Rs. 14,500",
        modules: [
            { title: "Module 1: Database Schemes & Table Join Optimizations", desc: "Design safe 3rd Normal Form layouts, index frequent relational queries, and configure scalable foreign-key links." }
        ]
    },
    "Frontend UI/UX Engineering": {
        key: "mobile",
        benefits: "The frontend is the direct point of contact for users. Learn native DOM rendering performance tricks, slick functional micro-interactions, and fast CSS systems.",
        price: "Rs. 11,000",
        modules: [
            { title: "Module 1: Vanilla Dynamic Rendering Loops", desc: "Manipulate DOM nodes directly, eliminate reflow layout calculations, and program smooth dropdown navigation layers." }
        ]
    },
    "Full-Stack Application Deployment": {
        key: "fullstack",
        benefits: "Full-stack capabilities mean complete autonomy. Learn to build modern decoupled microservice frameworks, link persistent storage instances, and maintain data state synchronization rules smoothly.",
        price: "Rs. 22,000",
        modules: [
            { title: "Module 1: Decoupled API Routing Sync States", desc: "Establish stateless API endpoints, parse token authorization layers, and handle persistent asynchronous CRUD operational cycles." }
        ]
    }
};

// Global Tracker for Currently Viewed Course Key
let activeTargetCourseKey = "fswd";

// ==========================================================================
// ⚡ UTILITY HELPERS: Z-Loader & Custom Glassmorphic Modal Engines
// ==========================================================================
const showZLoader = (message = "Processing System Blueprint...") => {
    const loader = document.getElementById("zLoaderOverlay");
    const loaderText = document.getElementById("zLoaderText");
    if (loaderText) loaderText.innerText = message;
    if (loader) loader.classList.add("active");
};

const hideZLoader = () => {
    const loader = document.getElementById("zLoaderOverlay");
    if (loader) loader.classList.remove("active");
};

const showCustomModal = ({ title, message, icon = "⚡", isConfirm = false, onConfirm = null }) => {
    const overlay = document.getElementById("customModalOverlay");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const modalIcon = document.getElementById("modalIcon");
    const confirmBtn = document.getElementById("modalConfirmBtn");
    const cancelBtn = document.getElementById("modalCancelBtn");

    if (!overlay) return;

    if (modalTitle) modalTitle.innerText = title;
    if (modalMessage) modalMessage.innerText = message;
    if (modalIcon) modalIcon.innerText = icon;

    if (cancelBtn) cancelBtn.style.display = isConfirm ? "block" : "none";

    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newConfirmBtn.addEventListener("click", () => {
        overlay.classList.remove("active");
        if (onConfirm) onConfirm();
    });

    newCancelBtn.addEventListener("click", () => {
        overlay.classList.remove("active");
    });

    overlay.classList.add("active");
};

// ==========================================================================
// 🎮 CORE INTERACTIVE ROUTING ENGINE
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const homeLinkBtn = document.getElementById("homeLinkBtn");
    const aboutLinkBtn = document.getElementById("aboutLinkBtn");
    const contactLinkBtn = document.getElementById("contactLinkBtn");
    const instructorPortalTriggerBtn = document.getElementById("instructorPortalTriggerBtn");
    const exploreCoursesBtns = document.querySelectorAll(".tech-explore-btn");
    const watchPlatformTourBtn = document.getElementById("watchPlatformTourBtn");

    const defaultHomeContent = document.getElementById("defaultHomeContent");
    const syllabusViewer = document.getElementById("syllabusViewerContainer");
    const btnBackToCatalog = document.getElementById("btnBackToCatalog");
    const instructorLoginContainer = document.getElementById("instructorLoginContainer");
    const aboutUsContainer = document.getElementById("aboutUsContainer");
    const contactUsContainer = document.getElementById("contactUsContainer");
    const coursesCatalogSection = document.getElementById("coursesCatalogSection");

    const instructorLoginForm = document.getElementById("instructorLoginForm");

    const dynamicCourseTitle = document.getElementById("dynamicCourseTitle");
    const dynamicCourseBenefits = document.getElementById("dynamicCourseBenefits");
    const dynamicCoursePrice = document.getElementById("dynamicCoursePrice");
    const dynamicModulesGrid = document.getElementById("dynamicModulesGrid");

    function hideAllSections() {
        if (defaultHomeContent) defaultHomeContent.classList.add("hidden");
        if (syllabusViewer) syllabusViewer.classList.add("hidden");
        if (instructorLoginContainer) instructorLoginContainer.classList.add("hidden");
        if (aboutUsContainer) aboutUsContainer.classList.add("hidden");
        if (contactUsContainer) contactUsContainer.classList.add("hidden");

        document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    }

    function transitionToSection(targetAction, loaderMessage = "Loading Architecture View...") {
        showZLoader(loaderMessage);
        setTimeout(() => {
            hideAllSections();
            targetAction();
            hideZLoader();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 350);
    }

    exploreCoursesBtns.forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            transitionToSection(() => {
                if (defaultHomeContent) defaultHomeContent.classList.remove("hidden");
                if (homeLinkBtn) homeLinkBtn.classList.add("active");
                if (coursesCatalogSection) {
                    coursesCatalogSection.scrollIntoView({ behavior: "smooth" });
                }
            }, "Fetching Engineering Tracks...");
        });
    });

    if (watchPlatformTourBtn) {
        watchPlatformTourBtn.addEventListener("click", () => {
            showCustomModal({
                title: "Platform Tour Interactive Node",
                message: "Interactive Video Tour matrix is initializing. Detailed virtual walkthrough will be active in the next release cycle.",
                icon: "🎥"
            });
        });
    }

    // ==========================================================================
    // 🔍 EVENT: "View Syllabus" Handler (Captures EXACT Course Key)
    // ==========================================================================
    document.body.addEventListener("click", (e) => {
        if (e.target && e.target.classList.contains("btn-enroll-track")) {
            e.preventDefault();

            const courseCard = e.target.closest(".tech-course-card");
            if (!courseCard) return;

            const clickedTitle = courseCard.querySelector("h3") ? courseCard.querySelector("h3").innerText.trim() : "";
            const dataCourseAttr = e.target.getAttribute("data-course");

            // Direct Key Assignment
            if (dataCourseAttr) {
                activeTargetCourseKey = dataCourseAttr;
            }

            let syllabusData = courseSyllabusDatabase[clickedTitle];

            if (!syllabusData) {
                const matchedKey = Object.keys(courseSyllabusDatabase).find(key => 
                    clickedTitle.toLowerCase().includes(key.toLowerCase()) || 
                    key.toLowerCase().includes(clickedTitle.toLowerCase())
                );
                if (matchedKey) {
                    syllabusData = courseSyllabusDatabase[matchedKey];
                }
            }

            if (syllabusData) {
                // Key lock from database object
                if (syllabusData.key) {
                    activeTargetCourseKey = syllabusData.key;
                }

                transitionToSection(() => {
                    if (dynamicCourseTitle) dynamicCourseTitle.innerText = clickedTitle;
                    if (dynamicCourseBenefits) dynamicCourseBenefits.innerText = syllabusData.benefits;
                    if (dynamicCoursePrice) dynamicCoursePrice.innerText = syllabusData.price || "Rs. 0";

                    if (dynamicModulesGrid) {
                        dynamicModulesGrid.innerHTML = "";
                        syllabusData.modules.forEach(mod => {
                            const moduleItemHTML = `
                                <div class="module-outline-item">
                                    <h5>${mod.title}</h5>
                                    <p>${mod.desc}</p>
                                </div>
                            `;
                            dynamicModulesGrid.insertAdjacentHTML("beforeend", moduleItemHTML);
                        });
                    }

                    if (syllabusViewer) syllabusViewer.classList.remove("hidden");
                }, "Compiling Course Syllabus Blueprint...");
            }
        }
    });

    if (btnBackToCatalog) {
        btnBackToCatalog.addEventListener("click", () => {
            transitionToSection(() => {
                if (defaultHomeContent) defaultHomeContent.classList.remove("hidden");
                if (homeLinkBtn) homeLinkBtn.classList.add("active");
            });
        });
    }

    if (homeLinkBtn) {
        homeLinkBtn.addEventListener("click", (e) => {
            e.preventDefault();
            transitionToSection(() => {
                if (defaultHomeContent) defaultHomeContent.classList.remove("hidden");
                if (homeLinkBtn) homeLinkBtn.classList.add("active");
            });
        });
    }

    if (aboutLinkBtn) {
        aboutLinkBtn.addEventListener("click", (e) => {
            e.preventDefault();
            transitionToSection(() => {
                if (aboutUsContainer) aboutUsContainer.classList.remove("hidden");
                aboutLinkBtn.classList.add("active");
            });
        });
    }

    if (contactLinkBtn) {
        contactLinkBtn.addEventListener("click", (e) => {
            e.preventDefault();
            transitionToSection(() => {
                if (contactUsContainer) contactUsContainer.classList.remove("hidden");
                contactLinkBtn.classList.add("active");
            });
        });
    }

    if (instructorPortalTriggerBtn) {
        instructorPortalTriggerBtn.addEventListener("click", (e) => {
            e.preventDefault();

            const token = localStorage.getItem("jwt_token") || localStorage.getItem("jwtToken");
            const instructorName = localStorage.getItem("instructor_name");

            if (token && instructorName) {
                showZLoader("Launching Active Instructor Workspace...");
                setTimeout(() => {
                    window.location.href = "instructor_dashboard.html";
                }, 400);
            } else {
                transitionToSection(() => {
                    if (instructorLoginContainer) instructorLoginContainer.classList.remove("hidden");
                    instructorPortalTriggerBtn.classList.add("active");
                }, "Loading Faculty Access Node...");
            }
        });
    }

    if (instructorLoginForm) {
        instructorLoginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const instructorFields = ["instructorEmail", "instructorPassword"];
            let isInstructorValid = true;

            instructorFields.forEach(id => {
                const inputField = document.getElementById(id);
                if (inputField && !inputField.value.trim()) {
                    inputField.parentElement.classList.add("invalid-field");
                    isInstructorValid = false;
                } else if (inputField) {
                    inputField.parentElement.classList.remove("invalid-field");
                }
            });

            if (isInstructorValid) {
                const emailInput = document.getElementById("instructorEmail");
                const passwordInput = document.getElementById("instructorPassword");

                const emailVal = emailInput ? emailInput.value.trim() : "";
                const passwordVal = passwordInput ? passwordInput.value.trim() : "";

                showZLoader("Verifying Instructor Credentials...");

                try {
                    const response = await fetch("http://localhost:5127/api/Account/instructor/signin", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: emailVal, password: passwordVal })
                    });

                    const data = await response.json().catch(() => ({}));
                    hideZLoader();

                    if (response.ok && data.token) {
                        const jwtToken = data.token;
                        const returnedName = data.instructorName || data.fullName || data.name || emailVal.split('@')[0].toUpperCase();
                        const instructorId = data.instructorId || data.userId || data.id;

                        localStorage.setItem("jwt_token", jwtToken);
                        localStorage.setItem("jwtToken", jwtToken);
                        localStorage.setItem("instructor_name", returnedName);
                        localStorage.setItem("userRole", "Instructor");
                        if (instructorId) {
                            localStorage.setItem("instructor_id", instructorId);
                        }

                        localStorage.removeItem("student_name");

                        showCustomModal({
                            title: "Node Access Granted",
                            message: "Instructor Node Verified successfully! Opening authorization dashboard.",
                            icon: "🔑",
                            onConfirm: () => {
                                showZLoader("Launching Instructor Portal...");
                                setTimeout(() => {
                                    window.location.replace("instructor_dashboard.html");
                                }, 500);
                            }
                        });
                    } else {
                        showCustomModal({
                            title: "Authentication Failed",
                            message: data.message || "Invalid instructor credentials provided. Please check your login details.",
                            icon: "⚠️"
                        });
                    }
                } catch (error) {
                    hideZLoader();
                    console.error("Login Exception:", error);
                    showCustomModal({
                        title: "Server Unreachable",
                        message: "Unable to connect to authentication server on port 5127.",
                        icon: "🚫"
                    });
                }
            } else {
                showCustomModal({
                    title: "Validation Error",
                    message: "Please enter valid email and password credentials.",
                    icon: "⚠️"
                });
            }
        });
    }
});

// ==========================================================================
// 🔄 AUTH & USER HEADER STATE CONTROLLER
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const guestNavLinks = document.getElementById("guest-nav-links");
    const userProfileMenu = document.getElementById("user-profile-menu");
    const userInitialsSpan = document.getElementById("userInitials");
    const dropdownUserName = document.getElementById("dropdownUserName");

    const avatarBtn = document.getElementById("avatarBtn");
    const avatarDropdown = document.getElementById("avatarDropdown");
    const logoutBtn = document.getElementById("logoutBtn");

    const studentPortalTriggerBtn = document.getElementById("studentPortalTriggerBtn");
    const instructorPortalTriggerBtn = document.getElementById("instructorPortalTriggerBtn");

    const token = localStorage.getItem("jwt_token") || localStorage.getItem("jwtToken");
    const studentName = localStorage.getItem("student_name");
    const instructorName = localStorage.getItem("instructor_name");

    if (studentPortalTriggerBtn) studentPortalTriggerBtn.style.display = "inline-block";
    if (instructorPortalTriggerBtn) instructorPortalTriggerBtn.style.display = "inline-block";

    if (token && studentName) {
        if (guestNavLinks) guestNavLinks.style.display = "none";
        if (userProfileMenu) userProfileMenu.style.display = "block";

        const firstLetter = studentName.trim().charAt(0).toUpperCase();
        if (userInitialsSpan) userInitialsSpan.textContent = firstLetter;
        if (dropdownUserName) dropdownUserName.textContent = studentName;

        if (instructorPortalTriggerBtn) instructorPortalTriggerBtn.style.display = "none";
    }
    else if (token && instructorName) {
        if (guestNavLinks) guestNavLinks.style.display = "none";
        if (userProfileMenu) userProfileMenu.style.display = "block";

        if (userInitialsSpan) userInitialsSpan.textContent = "👨‍🏫";
        if (dropdownUserName) dropdownUserName.textContent = instructorName;

        if (studentPortalTriggerBtn) studentPortalTriggerBtn.style.display = "none";
    }
    else {
        if (guestNavLinks) guestNavLinks.style.display = "flex";
        if (userProfileMenu) userProfileMenu.style.display = "none";
    }

    if (avatarBtn && avatarDropdown) {
        avatarBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isCurrentlyOpen = avatarDropdown.style.display === "flex";
            avatarDropdown.style.display = isCurrentlyOpen ? "none" : "flex";
        });
    }

    document.addEventListener("click", () => {
        if (avatarDropdown) avatarDropdown.style.display = "none";
    });

    if (avatarDropdown) {
        avatarDropdown.addEventListener("click", (e) => e.stopPropagation());
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            showCustomModal({
                title: "Confirm Log Out",
                message: "Are you sure you want to end your current active session?",
                icon: "🚪",
                isConfirm: true,
                onConfirm: () => {
                    showZLoader("Terminating Active Session...");
                    localStorage.clear();
                    sessionStorage.clear();
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }
            });
        });
    }
});

// ==========================================================================
// 🚀 ENROLLMENT REDIRECT (DYNAMIC QUERY PARAM MAPPER)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    const studentPortalTriggerBtn = document.getElementById("studentPortalTriggerBtn");

    if (studentPortalTriggerBtn) {
        studentPortalTriggerBtn.addEventListener("click", (e) => {
            e.preventDefault();

            const token = localStorage.getItem("jwt_token") || localStorage.getItem("jwtToken");
            const studentName = localStorage.getItem("student_name");

            showZLoader("Routing to Student Workspace...");

            setTimeout(() => {
                if (token && studentName) {
                    window.location.href = "studentportal.html";
                } else {
                    hideZLoader();
                    showCustomModal({
                        title: "Authentication Required",
                        message: "Please log in to access your personal Student Portal dashboard.",
                        icon: "🔒",
                        onConfirm: () => {
                            showZLoader("Redirecting to Login...");
                            window.location.href = "login.html?portal=student";
                        }
                    });
                }
            }, 400);
        });
    }

    const dynamicEnrollRedirectBtn = document.getElementById("dynamicEnrollRedirectBtn");

    if (dynamicEnrollRedirectBtn) {
        dynamicEnrollRedirectBtn.addEventListener("click", (e) => {
            e.preventDefault();

            const token = localStorage.getItem("jwt_token") || localStorage.getItem("jwtToken");
            const studentName = localStorage.getItem("student_name");

            // 🎯 Read current open course title from active modal view
            const courseTitleElement = document.getElementById("dynamicCourseTitle");
            if (courseTitleElement) {
                const titleText = courseTitleElement.textContent.trim().toLowerCase();
                
                if (titleText.includes("java")) activeTargetCourseKey = "fswd";
                else if (titleText.includes("c#")) activeTargetCourseKey = "desktop";
                else if (titleText.includes("python")) activeTargetCourseKey = "cyber";
                else if (titleText.includes("machine learning")) activeTargetCourseKey = "ai";
                else if (titleText.includes("backend")) activeTargetCourseKey = "devops";
                else if (titleText.includes("frontend")) activeTargetCourseKey = "mobile";
                else if (titleText.includes("data science")) activeTargetCourseKey = "dsa";
                else if (titleText.includes("full-stack")) activeTargetCourseKey = "fullstack";
            }

            if (token && studentName) {
                showZLoader("Processing Enrollment Gateway...");
                setTimeout(() => {
                    // 🎉 Redirects with exact selected key!
                    window.location.href = `enrollment.html?course=${activeTargetCourseKey}`;
                }, 500);
            } else {
                showCustomModal({
                    title: "Portal Registration Required",
                    message: "Please log in first to enroll in this engineering track.",
                    icon: "🎓",
                    onConfirm: () => {
                        showZLoader("Redirecting to Login...");
                        window.location.replace("login.html?portal=student");
                    }
                });
            }
        });
    }
});
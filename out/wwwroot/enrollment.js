document.addEventListener("DOMContentLoaded", () => {

    // 💻 8 COURSES CATALOG DICTIONARY DATA STORAGE MATCHED WITH HOMEPAGE DATA Blueprints
    const courseCatalog = {
        "fswd": { title: "Java Programming Masterclass", icon: "☕", desc: "Master Object-Oriented Programming, multithreading, enterprise frameworks, and JVM execution architectures.", price: "Rs. 11,500" },
        "desktop": { title: "C# Core & Advanced Patterns", icon: "🖥️", desc: "Deep-dive into generic definitions, asynchronous patterns, async/await execution loops, and LINQ parameters.", price: "Rs. 12,000" },
        "cyber": { title: "Python Scripting & Automation", icon: "🐍", desc: "Build programmatic automation matrices, work with file processing APIs, advanced data structures, and scripting.", price: "Rs. 9,500" },
        "ai": { title: "Applied Machine Learning Systems", icon: "🤖", desc: "Train, implement, and deploy statistical predictive algorithms, neural network layers, and regression metrics.", price: "Rs. 18,000" },
        "devops": { title: "Backend Architecture & Routing", icon: "☁️", desc: "Build highly resilient relational database schema infrastructures, data isolation controls, and secure Web APIs.", price: "Rs. 14,500" },
        "mobile": { title: "Frontend UI/UX Engineering", icon: "📱", desc: "Craft responsive interface components with native high-performance DOM integrations and fluid layout modules.", price: "Rs. 11,000" },
        "dsa": { title: "Data Science & Pipeline Engineering", icon: "📊", desc: "Ingest structural datasets, execute advanced data wrangling loops, and process automated operational setups.", price: "Rs. 16,500" },
        "fullstack": { title: "Full-Stack Application Deployment", icon: "🚀", desc: "Master modern decoupled microservice frameworks, persistent storage instances, and deployment workflows.", price: "Rs. 22,000" }
    };

    let parsedCourseKey = "fswd";

    // Dynamic Modal Handlers
    const enrollmentModal = document.getElementById("enrollmentModal");
    const enrollmentModalBox = document.getElementById("enrollmentModalBox");
    const enrollmentModalIcon = document.getElementById("enrollmentModalIcon");
    const enrollmentModalTitle = document.getElementById("enrollmentModalTitle");
    const enrollmentModalText = document.getElementById("enrollmentModalText");
    const closeEnrollmentModalBtn = document.getElementById("closeEnrollmentModalBtn");

    function showModal(title, message, isError = false, isSuccess = false) {
        if (!enrollmentModal) return;
        enrollmentModalTitle.textContent = title;
        enrollmentModalText.textContent = message;

        if (isError) {
            enrollmentModalBox.classList.add("error-modal");
            enrollmentModalIcon.textContent = "❌";
        } else {
            enrollmentModalBox.classList.remove("error-modal");
            enrollmentModalIcon.textContent = isSuccess ? "🎉" : "⚡";
        }

        enrollmentModal.classList.remove("hidden");
    }

    if (closeEnrollmentModalBtn) {
        closeEnrollmentModalBtn.addEventListener("click", () => {
            if (enrollmentModal) enrollmentModal.classList.add("hidden");
        });
    }

    // Dynamic Button Loading Spinner Toggle
    function toggleButtonLoading(btnElement, isLoading, originalText = "") {
        if (!btnElement) return;
        if (isLoading) {
            btnElement.classList.add("is-loading");
            btnElement.disabled = true;
            btnElement.innerHTML = `<span class="z-spinner">Z</span> Processing...`;
        } else {
            btnElement.classList.remove("is-loading");
            btnElement.disabled = false;
            btnElement.innerHTML = originalText;
        }
    }

    function extractUrlCoursePayload() {
        const urlParams = new URLSearchParams(window.location.search);
        const courseParam = urlParams.get('course');
        if (courseParam && courseCatalog[courseParam]) {
            parsedCourseKey = courseParam;
        }
        const activeData = courseCatalog[parsedCourseKey];
        
        const titleEl = document.getElementById("targetCourseTitle");
        const iconEl = document.getElementById("targetCourseIcon");
        const descEl = document.getElementById("targetCourseDesc");
        const priceDisplayEl = document.getElementById("dynamicPaymentPriceDisplay");

        if (titleEl && iconEl && descEl) {
            titleEl.textContent = activeData.title;
            iconEl.textContent = activeData.icon;
            descEl.textContent = activeData.desc;
        }

        if (priceDisplayEl) {
            priceDisplayEl.innerHTML = `${activeData.price} <span class="tax-tag">/ One-time</span>`;
        }
    }

    extractUrlCoursePayload();

    async function loadStudentProfileForEnrollment() {
        const token = localStorage.getItem("jwt_token");
        if (!token) {
            showModal("Authorization Required", "Authorized identity token was not found. Redirecting to the login portal.", true);
            setTimeout(() => {
                window.location.href = "login.html?portal=student";
            }, 1800);
            return;
        }

        try {
            const response = await fetch("http://localhost:5127/api/enrollment/student-profile", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.status === 401) {
                showModal("Session Expired", "Your session has expired. Please log in again to verify your identity.", true);
                localStorage.removeItem("jwt_token");
                localStorage.removeItem("student_name");
                setTimeout(() => {
                    window.location.href = "login.html?portal=student";
                }, 1800);
                return;
            }

            const student = await response.json();

            if (response.ok) {
                const nameInput = document.getElementById("enrollName"); 
                const emailInput = document.getElementById("enrollEmail"); 
                const phoneInput = document.getElementById("enrollPhone");

                if(nameInput) { nameInput.value = student.fullName; nameInput.readOnly = true; }
                if(emailInput) { emailInput.value = student.email; emailInput.readOnly = true; }
                if(phoneInput) { phoneInput.value = student.phoneNumber; phoneInput.readOnly = true; }
            }
        } catch (error) {
            console.error("Error fetching student profile:", error);
            showModal("Connection Error", "Failed to establish secure gateway handshake. Redirecting to home page.", true);
            setTimeout(() => {
                window.location.href = "homepage.html";
            }, 2000);
        }
    }
    loadStudentProfileForEnrollment();

    /* ==========================================================================
        🧭 MULTI-STEP NAVIGATION & STEP HISTORY ENGINE
       ========================================================================== */
    const stepPanes = { 
        1: document.getElementById("stepPane1"), 
        2: document.getElementById("stepPane2"), 
        3: document.getElementById("stepPane3") 
    };
    
    const stepIndicators = { 
        1: document.getElementById("stepIndicator1"),
        2: document.getElementById("stepIndicator2"), 
        3: document.getElementById("stepIndicator3") 
    };
    
    const stepLines = { 
        1: document.getElementById("stepLine1"), 
        2: document.getElementById("stepLine2") 
    };
    
    const enrollmentForm = document.getElementById("enrollmentGatewayForm");
    const btnTriggerPaymentFlow = document.getElementById("btnTriggerPaymentFlow");
    const verificationOverlayBlock = document.getElementById("verificationOverlayBlock");

    let currentActiveStep = 1;

    function renderStepView(targetStep) {
        Object.keys(stepPanes).forEach(step => {
            const numStep = parseInt(step);
            if (numStep === targetStep) {
                if (stepPanes[numStep]) stepPanes[numStep].classList.remove("hidden");
                if (stepIndicators[numStep]) stepIndicators[numStep].classList.add("active");
            } else {
                if (stepPanes[numStep]) stepPanes[numStep].classList.add("hidden");
                if (numStep > targetStep && stepIndicators[numStep]) {
                    stepIndicators[numStep].classList.remove("active");
                }
            }
        });

        if (stepLines[1]) {
            if (targetStep >= 2) stepLines[1].classList.add("active");
            else stepLines[1].classList.remove("active");
        }
        if (stepLines[2]) {
            if (targetStep >= 3) stepLines[2].classList.add("active");
            else stepLines[2].classList.remove("active");
        }

        currentActiveStep = targetStep;
    }

    // Push initial browser state
    history.replaceState({ step: 1 }, "", window.location.href);

    // Form ke andar steps ke darmiyan smooth navigation ke liye popstate
    window.addEventListener("popstate", (event) => {
        if (event.state && event.state.step) {
            renderStepView(event.state.step);
        } else {
            renderStepView(1);
        }
    });

    function navigateToStep(stepNum) {
        renderStepView(stepNum);
        history.pushState({ step: stepNum }, "", window.location.href);
    }

    function validateStep(currentStep) {
        if (currentStep === 1) {
            const name = document.getElementById("enrollName");
            const email = document.getElementById("enrollEmail");
            const phone = document.getElementById("enrollPhone");
            return name.checkValidity() && email.checkValidity() && phone.checkValidity() ? true : (name.reportValidity() || email.reportValidity() || phone.reportValidity(), false);
        }
        return true;
    }

    document.querySelectorAll(".btn-nav-next").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetStep = parseInt(btn.getAttribute("data-next"));
            const currentStep = targetStep - 1;

            if (validateStep(currentStep)) {
                navigateToStep(targetStep);
            }
        });
    });

    if (btnTriggerPaymentFlow && verificationOverlayBlock) {
        btnTriggerPaymentFlow.addEventListener("click", async () => {
            if (validateStep(2)) {
                const organizationInput = document.getElementById("enrollInstitute");
                const selectedShiftRadio = document.querySelector('input[name="shiftPreference"]:checked');
                
                if (!organizationInput || !organizationInput.value.trim()) {
                    showModal("Organization Required", "Please specify your university or organization affiliation before proceeding.", true);
                    organizationInput.focus();
                    return;
                }

                const originalBtnHtml = btnTriggerPaymentFlow.innerHTML;
                toggleButtonLoading(btnTriggerPaymentFlow, true);

                const organizationValue = organizationInput.value.trim();
                let rawShift = selectedShiftRadio ? selectedShiftRadio.value : "Morning";
                const shiftValue = rawShift.charAt(0).toUpperCase() + rawShift.slice(1).toLowerCase();

                const activeCourse = courseCatalog[parsedCourseKey];
                const courseTitleValue = activeCourse ? activeCourse.title : "";

                if (!courseTitleValue) {
                    toggleButtonLoading(btnTriggerPaymentFlow, false, originalBtnHtml);
                    showModal("Invalid Configuration", "Active course details could not be resolved.", true);
                    return;
                }

                verificationOverlayBlock.classList.remove("hidden");

                try {
                    const token = localStorage.getItem("jwt_token");

                    const response = await fetch("http://localhost:5127/api/enrollment/proceed-to-payment", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            organization: organizationValue,
                            shift: shiftValue,
                            title: courseTitleValue 
                        })
                    });

                    const responseData = await response.json();

                    if (response.ok) {
                        setTimeout(() => {
                            verificationOverlayBlock.classList.add("hidden");
                            toggleButtonLoading(btnTriggerPaymentFlow, false, originalBtnHtml);

                            navigateToStep(3);

                            localStorage.setItem("current_enrollment_id", responseData.enrollmentId);

                            // Sync text container instructions for default selected route
                            updateWalletInstructionDetails();

                        }, 1800);
                    } else {
                        verificationOverlayBlock.classList.add("hidden");
                        toggleButtonLoading(btnTriggerPaymentFlow, false, originalBtnHtml);
                        
                        if (responseData.isPendingResume) {
                            showModal(
                                "Pending Payment Detected",
                                `${responseData.message} You are now redirected to the payment screen to complete your registration.`,
                                false,
                                true
                            );

                            localStorage.setItem("current_enrollment_id", responseData.enrollmentId);

                            const matchedCatalogKey = Object.keys(courseCatalog).find(
                                key => courseCatalog[key].title.toLowerCase() === responseData.courseTitle.toLowerCase()
                            );

                            if (matchedCatalogKey) {
                                parsedCourseKey = matchedCatalogKey;
                                const activeData = courseCatalog[parsedCourseKey];
                                
                                const titleEl = document.getElementById("targetCourseTitle");
                                const iconEl = document.getElementById("targetCourseIcon");
                                const descEl = document.getElementById("targetCourseDesc");
                                const priceDisplayEl = document.getElementById("dynamicPaymentPriceDisplay");

                                if (titleEl && iconEl && descEl) {
                                    titleEl.textContent = activeData.title;
                                    iconEl.textContent = activeData.icon;
                                    descEl.textContent = activeData.desc;
                                }

                                if (priceDisplayEl) {
                                    priceDisplayEl.innerHTML = `${activeData.price} <span class="tax-tag">/ One-time</span>`;
                                }
                            }

                            navigateToStep(3);
                            updateWalletInstructionDetails();
                        } else {
                            let serverErrorMessage = responseData.message || "An error occurred while saving enrollment data.";
                            if (responseData.errors) {
                                serverErrorMessage = Object.values(responseData.errors).flat().join(" ");
                            }
                            showModal("Backend Validation Error", serverErrorMessage, true);
                        }
                    }

                } catch (error) {
                    verificationOverlayBlock.classList.add("hidden");
                    toggleButtonLoading(btnTriggerPaymentFlow, false, originalBtnHtml);
                    console.error("Error during proceed-to-payment API:", error);
                    showModal("Network Connection Error", "Failed to connect to the backend server. Please check your network.", true);
                }
            }
        });
    }

    // Standard Back Navigation
    document.querySelectorAll(".btn-nav-prev").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetStep = parseInt(btn.getAttribute("data-prev"));
            navigateToStep(targetStep);
        });
    });

    // 💡 LIVE UPDATE MANUAL TRANSACTION INSTRUCTIONS LAYER
    function updateWalletInstructionDetails() {
        const checkedRadio = document.querySelector('input[name="paymentRoute"]:checked');
        if (!checkedRadio) return;

        const instructionWalletName = document.getElementById("instructionWalletName");
        if (instructionWalletName) {
            instructionWalletName.textContent = checkedRadio.value === "easypaisa" ? "EasyPaisa" : "JazzCash";
        }
    }

    // 💳 PAYMENT INTERFACE ROUTE SWITCHER 
    const paymentRadios = document.querySelectorAll('input[name="paymentRoute"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener("change", () => {
            updateWalletInstructionDetails();
        });
    });

    // 🚀 FORM SUBMIT LOGIC 
    if (enrollmentForm) {
        enrollmentForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById("btnSubmitEnroll");
            const originalSubmitBtnHtml = submitBtn ? submitBtn.innerHTML : "";

            const currentEnrollmentId = localStorage.getItem("current_enrollment_id");
            if (!currentEnrollmentId) {
                showModal("Enrollment Session Expired", "Your active session was lost. Please restart from Step 1 and complete Step 2 again.", true);
                navigateToStep(1);
                return;
            }

            const rawMethod = document.querySelector('input[name="paymentRoute"]:checked')?.value;
            if (!rawMethod) {
                showModal("Funding Route Required", "Please select your preferred payment transfer option.", true);
                return;
            }
            
            let selectedMethod = rawMethod === "easypaisa" ? "EasyPaisa" : "JazzCash";

            const activeCoursePriceString = courseCatalog[parsedCourseKey]?.price || "Rs. 0";
            const cleanAmount = parseFloat(activeCoursePriceString.replace(/[^0-9]/g, ''));

            let termsCheckbox = document.getElementById("termsAgreement");
            if (!termsCheckbox) {
                termsCheckbox = document.querySelector('input[type="checkbox"]');
            }
            const isTermsChecked = termsCheckbox ? termsCheckbox.checked : false;

            let walletSenderAccountInput = document.getElementById("walletSenderAccountInput");
            let walletTrxInput = document.getElementById("walletTransactionIdInput");

            const accountNoVal = walletSenderAccountInput ? walletSenderAccountInput.value.trim() : "";
            const trxIdVal = walletTrxInput ? walletTrxInput.value.trim() : "";

            if (!accountNoVal) {
                showModal("Account Number Missing", `Please enter your ${selectedMethod} mobile account number used for payment transfer.`, true);
                if (walletSenderAccountInput) walletSenderAccountInput.focus();
                return;
            }

            // Regex Check for 03xxxxxxxxx format matching C# PaymentDto
            const phoneRegex = /^03[0-9]{9}$/;
            if (!phoneRegex.test(accountNoVal)) {
                showModal("Invalid Account Number", "Mobile account number must be in the format 03001234567 (11 digits starting with 03).", true);
                if (walletSenderAccountInput) walletSenderAccountInput.focus();
                return;
            }

            if (!trxIdVal) {
                showModal("Transaction ID Missing", "Please enter the unique Transaction Reference ID (TrxID) generated after completing your transfer.", true);
                if (walletTrxInput) walletTrxInput.focus();
                return;
            }

            if (!isTermsChecked) {
                showModal("Verification Required", "Terms aur elements ki accuracy ko verify karna lazmi hai.", true);
                return;
            }

            toggleButtonLoading(submitBtn, true);

            // 🎯 Clean Payload mapping matching backend C# PaymentDto schema
            let payload = {
                amount: cleanAmount,
                paymentMethod: selectedMethod,
                cardholderName: null,
                cardNumber: null,
                expiryDate: null,
                cvv: null,
                accountNumber: accountNoVal, 
                transactionId: trxIdVal, 
                isVerified: isTermsChecked
            };

            if (verificationOverlayBlock) {
                verificationOverlayBlock.classList.remove("hidden");
                const overlayText = verificationOverlayBlock.querySelector("p");
                if (overlayText) {
                    overlayText.innerHTML = `<b>Verifying Transaction Reference Packet...</b><br/>Please wait while the system checks your <b>${selectedMethod} Transaction ID (${payload.transactionId})</b> from secure ledger servers.`;
                }
            }

            try {
                const token = localStorage.getItem("jwt_token");

                const response = await fetch(`http://localhost:5127/api/enrollment/submit-payment/${currentEnrollmentId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (verificationOverlayBlock) {
                    verificationOverlayBlock.classList.add("hidden");
                }

                toggleButtonLoading(submitBtn, false, originalSubmitBtnHtml);

                if (response.ok) {
                    const finalSuccessOverlay = document.getElementById("finalSuccessOverlay");
                    if (finalSuccessOverlay) {
                        finalSuccessOverlay.classList.remove("hidden");
                    }
                    localStorage.removeItem("current_enrollment_id");
                } else {
                    if (data.errors) {
                        const errorMessages = Object.values(data.errors).flat().join(" ");
                        showModal("Validation Error", errorMessages, true);
                    } else {
                        showModal("Payment Authorization Failed", data.message || "Payment submission could not be verified by the server.", true);
                    }
                }
            } catch (error) {
                if (verificationOverlayBlock) {
                    verificationOverlayBlock.classList.add("hidden");
                }
                toggleButtonLoading(submitBtn, false, originalSubmitBtnHtml);
                console.error("Payment API Integration Error:", error);
                showModal("Server Unreachable", "Unable to establish a connection with the server. Please check your internet connection and try again.", true);
            }
        });
    }
});
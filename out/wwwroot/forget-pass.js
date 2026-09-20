document.addEventListener("DOMContentLoaded", () => {

    let verifiedEmailContext = "";

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

    // Dynamic "Z" Loading Spinner Toggle for Buttons
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
    
    const verificationOverlayBlock = document.getElementById("verificationOverlayBlock");

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
    }

    history.replaceState({ step: 1 }, "", window.location.href);

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

    // Standard Back Button Handlers
    document.querySelectorAll(".btn-nav-prev").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetStep = parseInt(btn.getAttribute("data-prev"));
            navigateToStep(targetStep);
        });
    });

    // ==========================================
    // 🚀 STEP 1: SEND CODE API HANDLER (`/api/auth/forgot-password`)
    // ==========================================
    const btnSendCode = document.getElementById("btnSendCode");
    if (btnSendCode) {
        btnSendCode.addEventListener("click", async () => {
            const emailInput = document.getElementById("recoveryEmail");
            if (!emailInput.checkValidity()) {
                emailInput.reportValidity();
                return;
            }

            verifiedEmailContext = emailInput.value.trim();
            const originalBtnHtml = btnSendCode.innerHTML;
            toggleButtonLoading(btnSendCode, true);
            verificationOverlayBlock.classList.remove("hidden");

            try {
                const response = await fetch("http://localhost:5127/api/auth/forgot-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: verifiedEmailContext })
                });

                const data = await response.json();
                verificationOverlayBlock.classList.add("hidden");
                toggleButtonLoading(btnSendCode, false, originalBtnHtml);

                if (response.ok) {
                    showModal("Code Dispatched", data.message || "A 5-digit verification code has been sent to your email.", false, true);
                    navigateToStep(2);
                } else {
                    showModal("Request Failed", data.message || "Email not found in database records.", true);
                }
            } catch (error) {
                verificationOverlayBlock.classList.add("hidden");
                toggleButtonLoading(btnSendCode, false, originalBtnHtml);
                console.error("Forgot Password Error:", error);
                showModal("Connection Error", "Unable to connect to authentication server.", true);
            }
        });
    }

    // ==========================================
    // 🔐 STEP 2: VERIFY CODE API HANDLER (`/api/auth/verify-code`)
    // ==========================================
    const btnVerifyCode = document.getElementById("btnVerifyCode");
    if (btnVerifyCode) {
        btnVerifyCode.addEventListener("click", async () => {
            const codeInput = document.getElementById("recoveryCodeInput");
            const codeVal = codeInput.value.trim();

            if (!codeVal || codeVal.length < 5) {
                showModal("Validation Error", "Please enter a valid 5-digit verification code.", true);
                codeInput.focus();
                return;
            }

            const originalBtnHtml = btnVerifyCode.innerHTML;
            toggleButtonLoading(btnVerifyCode, true);
            verificationOverlayBlock.classList.remove("hidden");

            try {
                const response = await fetch("http://localhost:5127/api/auth/verify-code", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: verifiedEmailContext, resetCode: codeVal })
                });

                const data = await response.json();
                verificationOverlayBlock.classList.add("hidden");
                toggleButtonLoading(btnVerifyCode, false, originalBtnHtml);

                if (response.ok) {
                    showModal("Code Verified", data.message || "Security code successfully validated.", false, true);
                    navigateToStep(3);
                } else {
                    showModal("Invalid Code", data.message || "The verification code is invalid or has expired.", true);
                }
            } catch (error) {
                verificationOverlayBlock.classList.add("hidden");
                toggleButtonLoading(btnVerifyCode, false, originalBtnHtml);
                console.error("Verify Code Error:", error);
                showModal("Connection Error", "Failed to verify code with server.", true);
            }
        });
    }

    // ==========================================
    // 🔑 STEP 3: UPDATE PASSWORD API HANDLER (`/api/auth/reset-password`)
    // ==========================================
    const forgotPasswordForm = document.getElementById("forgotPasswordForm");
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const newPassInput = document.getElementById("newPasswordInput");
            const confirmPassInput = document.getElementById("confirmPasswordInput");
            const codeInput = document.getElementById("recoveryCodeInput");

            const newPassword = newPassInput.value.trim();
            const confirmPassword = confirmPassInput.value.trim();

            if (newPassword.length < 6) {
                showModal("Weak Password", "Password must be at least 6 characters long.", true);
                newPassInput.focus();
                return;
            }

            if (newPassword !== confirmPassword) {
                showModal("Mismatch Error", "New password and confirmation password do not match.", true);
                confirmPassInput.focus();
                return;
            }

            const updateBtn = document.getElementById("btnUpdatePassword");
            const originalUpdateBtnHtml = updateBtn ? updateBtn.innerHTML : "";
            toggleButtonLoading(updateBtn, true);

            verificationOverlayBlock.classList.remove("hidden");
            const overlayText = verificationOverlayBlock.querySelector("p");
            if (overlayText) {
                overlayText.innerHTML = "<b>Re-hashing Credentials...</b><br/>Applying secure cryptographic hash functions and updating database records.";
            }

            try {
                const response = await fetch("http://localhost:5127/api/auth/reset-password", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: verifiedEmailContext,
                        resetCode: codeInput.value.trim(),
                        newPassword: newPassword
                    })
                });

                const data = await response.json();
                verificationOverlayBlock.classList.add("hidden");
                toggleButtonLoading(updateBtn, false, originalUpdateBtnHtml);

                if (response.ok) {
                    const finalSuccessOverlay = document.getElementById("finalSuccessOverlay");
                    if (finalSuccessOverlay) {
                        finalSuccessOverlay.classList.remove("hidden");
                    }
                } else {
                    showModal("Update Failed", data.message || "Failed to update password in database.", true);
                }
            } catch (error) {
                verificationOverlayBlock.classList.add("hidden");
                toggleButtonLoading(updateBtn, false, originalUpdateBtnHtml);
                console.error("Reset Password Error:", error);
                showModal("Server Error", "Could not connect to database backend.", true);
            }
        });
    }

});
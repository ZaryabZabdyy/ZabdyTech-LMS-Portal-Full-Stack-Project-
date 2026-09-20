document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const loginModal = document.getElementById("loginModal");
    const loginModalBox = document.getElementById("loginModalBox");
    const loginModalIcon = document.getElementById("loginModalIcon");
    const loginModalTitle = document.getElementById("loginModalTitle");
    const loginModalText = document.getElementById("loginModalText");
    const closeLoginModalBtn = document.getElementById("closeLoginModalBtn");
    const portalRequiredNotice = document.getElementById("portalRequiredNotice");
    
    let isSuccessRedirect = false;

    // Helper to show styled custom modal
    function showModal(title, message, isError = false, isSuccess = false) {
        loginModalTitle.textContent = title;
        loginModalText.textContent = message;
        
        if (isError) {
            loginModalBox.classList.add("error-modal");
            loginModalIcon.textContent = "❌";
        } else {
            loginModalBox.classList.remove("error-modal");
            loginModalIcon.textContent = isSuccess ? "⚡" : "ℹ️";
        }
        
        loginModal.classList.remove("hidden");
    }

    // Check query params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('portal') === 'student' && portalRequiredNotice) {
        portalRequiredNotice.classList.remove("hidden");
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById("loginEmail");
            const passwordInput = document.getElementById("loginPassword");
            const submitBtn = loginForm.querySelector(".btn-submit-form");
            const originalBtnText = submitBtn.innerHTML;
            
            let isLoginValid = true;

            [emailInput, passwordInput].forEach(inputField => {
                if (inputField && !inputField.value.trim()) {
                    inputField.parentElement.classList.add("invalid-field");
                    isLoginValid = false;
                } else if (inputField) {
                    inputField.parentElement.classList.remove("invalid-field");
                }
            });

            if (!isLoginValid) {
                showModal("Missing Credentials", "Please enter both your email address and password to log in.", true);
                return;
            }

            // Enable subtle Z-Spinner
            submitBtn.classList.add("is-loading");
            submitBtn.innerHTML = `<span class="z-spinner">Z</span> Processing...`;

            const backendLoginUrl = "http://localhost:5127/api/Account/signin";

            try {
                const response = await fetch(backendLoginUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: emailInput.value.trim(),
                        password: passwordInput.value
                    })
                });

                const data = await response.json().catch(() => ({}));

                if (response.ok) {
                    localStorage.setItem("jwt_token", data.token);
                    localStorage.setItem("student_name", data.studentName);
                    isSuccessRedirect = true;
                    showModal("Access Granted", "Login successful! Connecting to your account portal...", false, true);
                } else {
                    showModal("Authentication Failed", data.message || "Invalid email or password. Please try again.", true);
                }
            } catch (error) {
                console.error("Login API connection error:", error);
                showModal("Server Connection Error", "Unable to connect to the server. Please check your network connection.", true);
            } finally {
                submitBtn.classList.remove("is-loading");
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    if (closeLoginModalBtn && loginModal) {
        closeLoginModalBtn.addEventListener("click", () => {
            loginModal.classList.add("hidden");
            if (isSuccessRedirect) {
                if (loginForm) loginForm.reset();
                window.location.href = "homepage.html";
            }
        });
    }
});
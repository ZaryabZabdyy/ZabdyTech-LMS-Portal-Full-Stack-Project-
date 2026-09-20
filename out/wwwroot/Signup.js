document.addEventListener("DOMContentLoaded", () => {
    const registrationForm = document.getElementById("registrationForm");
    const signupModal = document.getElementById("signupModal");
    const signupModalBox = document.getElementById("signupModalBox");
    const signupModalIcon = document.getElementById("signupModalIcon");
    const signupModalTitle = document.getElementById("signupModalTitle");
    const signupModalText = document.getElementById("signupModalText");
    const closeSignupModalBtn = document.getElementById("closeSignupModalBtn");

    let isSuccessRedirect = false;

    function showModal(title, message, isError = false, isSuccess = false) {
        signupModalTitle.textContent = title;
        signupModalText.textContent = message;

        if (isError) {
            signupModalBox.classList.add("error-modal");
            signupModalIcon.textContent = "❌";
        } else {
            signupModalBox.classList.remove("error-modal");
            signupModalIcon.textContent = isSuccess ? "🎉" : "ℹ️";
        }

        signupModal.classList.remove("hidden");
    }

    if (registrationForm) {
        registrationForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const fieldsToValidate = ["firstName", "lastName", "emailAddress", "password", "confirmPassword", "phoneNumber", "dob", "country"];
            let isFormValid = true;

            fieldsToValidate.forEach(id => {
                const inputField = document.getElementById(id);
                if (inputField && !inputField.value.trim()) {
                    inputField.parentElement.classList.add("invalid-field");
                    isFormValid = false;
                } else if (inputField) {
                    inputField.parentElement.classList.remove("invalid-field");
                }
            });

            const passInput = document.getElementById("password");
            const confirmPassInput = document.getElementById("confirmPassword");

            // 📌 SIMPLE POPUP 1: Password Mismatch
            if (passInput && confirmPassInput && passInput.value !== confirmPassInput.value) {
                confirmPassInput.parentElement.classList.add("invalid-field");
                showModal("Passwords Do Not Match", "Please make sure both passwords are the same.", true);
                return;
            }

            // 📌 SIMPLE POPUP 2: Incomplete Form
            if (!isFormValid) {
                showModal("Form Incomplete", "Please fill in all the required fields.", true);
                return;
            }

            const submitBtn = registrationForm.querySelector(".btn-submit-form");
            const originalBtnText = submitBtn.innerHTML;

            // Enable Z Loading State
            submitBtn.classList.add("is-loading");
            submitBtn.innerHTML = `<span class="z-spinner">Z</span> Registering...`;

            const signupData = {
                firstName: document.getElementById("firstName").value.trim(),
                lastName: document.getElementById("lastName").value.trim(),
                email: document.getElementById("emailAddress").value.trim(),
                password: passInput.value,
                phoneNumber: document.getElementById("phoneNumber").value.trim(),
                dateOfBirth: document.getElementById("dob").value,
                country: document.getElementById("country").value.trim()
            };

            const backendUrl = "http://localhost:5127/api/Account/signup";

            try {
                const response = await fetch(backendUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(signupData)
                });

                if (response.ok) {
                    isSuccessRedirect = true;
                    // 📌 SIMPLE POPUP 3: Registration Success
                    showModal("Account Created!", "Your account is ready. Click OK to log in.", false, true);
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    if (errorData.errors) {
                        let detailedErrors = Object.values(errorData.errors).flatMap(m => m).join(" ");
                        // 📌 SIMPLE POPUP 4: Server Validation Errors
                        showModal("Registration Failed", detailedErrors || "Please check your information and try again.", true);
                    } else {
                        // 📌 SIMPLE POPUP 5: General Failure
                        showModal("Registration Failed", errorData.message || "Could not create account. Please try again.", true);
                    }
                }
            } catch (error) {
                console.error("Connection error detail:", error);
                // 📌 SIMPLE POPUP 6: Server Connection Error
                showModal("Server Error", "Cannot connect to the server. Please check your internet or try later.", true);
            } finally {
                submitBtn.classList.remove("is-loading");
                submitBtn.innerHTML = originalBtnText;
            }
        });
    }

    // 👁️ Toggle Password Visibility Logic
    const toggleButtons = document.querySelectorAll(".toggle-password-btn");

    toggleButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("data-target");
            const passwordInput = document.getElementById(targetId);

            if (passwordInput) {
                const isPassword = passwordInput.type === "password";
                passwordInput.type = isPassword ? "text" : "password";
                // Eye icon state change
                btn.textContent = isPassword ? "🙈" : "👁️";
            }
        });
    });

    if (closeSignupModalBtn && signupModal) {
        closeSignupModalBtn.addEventListener("click", () => {
            signupModal.classList.add("hidden");
            if (isSuccessRedirect) {
                if (registrationForm) registrationForm.reset();
                window.location.href = "login.html";
            }
        });
    }
});
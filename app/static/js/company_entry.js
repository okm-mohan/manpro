document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("companyEntryForm");
    const companyCodeInput = document.getElementById("company_code");
    const inputBox = companyCodeInput?.closest(".input-box");
    const inputMessage = document.getElementById("inputMessage");
    const continueButton = document.getElementById("continueButton");
    const helpLink = document.querySelector(".help-link");

    if (
        !form ||
        !companyCodeInput ||
        !inputBox ||
        !inputMessage ||
        !continueButton
    ) {
        return;
    }

    /**
     * Company-code rules:
     * - Minimum 3 characters
     * - Maximum 50 characters
     * - Letters, numbers, hyphens and underscores only
     */
    const companyCodePattern = /^[A-Z0-9_-]{3,50}$/;

    function normalizeCompanyCode(value) {
        return value
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "");
    }

    function clearValidation() {
        inputBox.classList.remove("valid", "invalid");
        inputMessage.textContent = "";
    }

    function showValid() {
        inputBox.classList.remove("invalid");
        inputBox.classList.add("valid");
        inputMessage.textContent = "";
    }

    function showInvalid(message) {
        inputBox.classList.remove("valid");
        inputBox.classList.add("invalid");
        inputMessage.textContent = message;
    }

    function validateCompanyCode() {
        const companyCode = normalizeCompanyCode(
            companyCodeInput.value
        );

        companyCodeInput.value = companyCode;

        if (!companyCode) {
            showInvalid("Please enter your company code.");
            return false;
        }

        if (companyCode.length < 3) {
            showInvalid(
                "Company code must contain at least 3 characters."
            );
            return false;
        }

        if (!companyCodePattern.test(companyCode)) {
            showInvalid(
                "Use only letters, numbers, hyphens or underscores."
            );
            return false;
        }

        showValid();
        return true;
    }

    function startLoading() {
        form.classList.add("is-loading");
        continueButton.disabled = true;
        companyCodeInput.readOnly = true;
    }

    function stopLoading() {
        form.classList.remove("is-loading");
        continueButton.disabled = false;
        companyCodeInput.readOnly = false;
    }

    companyCodeInput.addEventListener("input", () => {
        const normalizedValue = normalizeCompanyCode(
            companyCodeInput.value
        );

        companyCodeInput.value = normalizedValue;

        if (!normalizedValue) {
            clearValidation();
            return;
        }

        if (companyCodePattern.test(normalizedValue)) {
            showValid();
        } else {
            inputBox.classList.remove("valid");
            inputBox.classList.add("invalid");
            inputMessage.textContent =
                "Use only letters, numbers, hyphens or underscores.";
        }
    });

    companyCodeInput.addEventListener("blur", () => {
        if (companyCodeInput.value.trim()) {
            validateCompanyCode();
        }
    });

    companyCodeInput.addEventListener("paste", () => {
        window.setTimeout(() => {
            companyCodeInput.value = normalizeCompanyCode(
                companyCodeInput.value
            );

            if (companyCodeInput.value) {
                validateCompanyCode();
            }
        }, 0);
    });

    form.addEventListener("submit", (event) => {
        if (!validateCompanyCode()) {
            event.preventDefault();
            companyCodeInput.focus();
            return;
        }

        startLoading();
    });

    /*
     * Restore the button when the browser returns to this
     * page using the Back button.
     */
    window.addEventListener("pageshow", () => {
        stopLoading();
    });

    if (helpLink) {
        helpLink.addEventListener("click", (event) => {
            event.preventDefault();

            window.alert(
                "Please contact your ERP administrator to obtain your company code."
            );
        });
    }
});
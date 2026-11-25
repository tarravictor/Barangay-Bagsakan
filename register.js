// Barangay Bagsakan: register a donor account (register.js)
// Load auth.js and forms.js before this file.

const registerForm = document.getElementById("register-form");
const registerAlert = document.getElementById("register-alert");
const registerButton = document.getElementById("register-submit");

const nextPage = (function () {
  const raw = new URLSearchParams(window.location.search).get("next") || "";
  return /^[a-z-]+\.html(\?[A-Za-z0-9=&%._-]*)?$/.test(raw) ? raw : "report.html";
})();
document.getElementById("login-link").href = "login.html?next=" + encodeURIComponent(nextPage);

const validateRegister = connectValidation(registerForm, {
  "reg-name": function (field) {
    const value = field.value.trim();
    if (!value) return "Enter your full name.";
    if (value.length < 2 || value.length > 100) return "Your name must be 2 to 100 characters long.";
    if (!NAME_PATTERN.test(value)) return "Use letters, spaces, periods, hyphens and apostrophes only (no numbers or symbols).";
    return "";
  },
  "reg-email": function (field) {
    const value = field.value.trim();
    if (!value) return "Enter your email.";
    if (value.length > 254 || !EMAIL_PATTERN.test(value)) return "Please enter a valid email address, such as name@example.com.";
    if (isEmailRegistered(value)) return "This email is already registered. Log in instead.";
    return "";
  },
  "reg-phone": function (field) {
    if (!field.value.trim()) return "Enter your mobile number.";
    if (!PHONE_PATTERN.test(cleanPhone(field.value))) return "Enter a mobile number like 0917 123 4567 or +63 917 123 4567.";
    return "";
  },
  "reg-org": function (field) {
    return field.value.trim().length > 100 ? "Keep the organization name to 100 characters or fewer." : "";
  },
  "reg-password": function (field) {
    const value = field.value;
    if (!value) return "Create a password.";
    if (value.length < 8) return "Your password needs at least 8 characters.";
    if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return "Your password needs at least one letter and one number.";
    return "";
  },
  "reg-confirm": function (field) {
    if (!field.value) return "Type your password again.";
    if (field.value !== document.getElementById("reg-password").value) return "The passwords don't match.";
    return "";
  },
  "reg-consent": function (field) {
    return field.checked ? "" : "Please agree to the privacy policy to create an account.";
  }
}, registerAlert);

registerForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  if (validateRegister().length) return;

  registerButton.disabled = true;
  let result;
  try {
    result = await registerDonor({
      name: document.getElementById("reg-name").value.trim().replace(/\s+/g, " "),
      email: document.getElementById("reg-email").value,
      phone: cleanPhone(document.getElementById("reg-phone").value),
      organization: document.getElementById("reg-org").value,
      password: document.getElementById("reg-password").value
    });
  } catch (error) {
    registerAlert.textContent = error.message;
    registerAlert.hidden = false;
    registerButton.disabled = false;
    return;
  }

  if (!result.ok) {
    registerButton.disabled = false;
    registerAlert.textContent = result.reason === "taken"
      ? "This email is already registered. Log in instead."
      : "This browser blocked saving, so the account could not be created. Turn off private browsing and try again.";
    registerAlert.hidden = false;
    registerAlert.focus();
    return;
  }

  // Registered and logged in: go to the page they wanted (usually the report form).
  window.location.href = nextPage;
});

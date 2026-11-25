// Barangay Bagsakan: log in page (login.js)
// Load auth.js and forms.js before this file.

const loginForm = document.getElementById("login-form");
const loginAlert = document.getElementById("login-alert");
const loginNotice = document.getElementById("login-notice");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const submitButton = document.getElementById("login-submit");

const params = new URLSearchParams(window.location.search);
const need = params.get("need");          // "donor", "admin" or "any"
const next = safeNext(params.get("next")); // page to go back to after logging in

// Only allow going back to one of our own pages, like "report.html" or
// "track.html?ref=BB-2026-0148", never to another website.
function safeNext(raw) {
  return /^[a-z-]+\.html(\?[A-Za-z0-9=&%._-]*)?$/.test(raw || "") ? raw : "";
}

// ---------- Why the visitor is here ----------

const NOTICES = {
  donor: "Please log in or register first. Only registered donors can report surplus food.",
  admin: "This page is for barangay staff. Log in with the barangay admin account.",
  any: "Please log in to continue."
};

const already = currentUser();
if (already) {
  loginNotice.textContent = "You are logged in as " + already.name + ". Logging in again switches accounts.";
  loginNotice.hidden = false;
} else if (NOTICES[need]) {
  loginNotice.textContent = NOTICES[need];
  loginNotice.hidden = false;
}

// Keep "next" when the visitor chooses Register instead.
if (next) {
  document.getElementById("register-link").href = "register.html?next=" + encodeURIComponent(next);
}

// ---------- Too many wrong passwords: wait 30 seconds ----------

const MAX_TRIES = 5;
const LOCK_SECONDS = 30;

function readTries() {
  try {
    return JSON.parse(sessionStorage.getItem("bb-login-tries")) || { count: 0, until: 0 };
  } catch (error) {
    return { count: 0, until: 0 };
  }
}

function writeTries(tries) {
  try {
    sessionStorage.setItem("bb-login-tries", JSON.stringify(tries));
  } catch (error) {
    // storage blocked: the lock simply doesn't apply
  }
}

function secondsLocked() {
  return Math.max(0, Math.ceil((readTries().until - Date.now()) / 1000));
}

// ---------- Checking the fields ----------

const validateLogin = connectValidation(loginForm, {
  "login-email": function (field) {
    const value = field.value.trim();
    if (!value) return "Enter your email.";
    if (!EMAIL_PATTERN.test(value)) return "Please enter a valid email address, such as name@example.com.";
    return "";
  },
  "login-password": function (field) {
    return field.value ? "" : "Enter your password.";
  }
}, null);

function showAlert(message) {
  loginAlert.textContent = message;
  loginAlert.hidden = !message;
}

// Where to go after logging in.
function destinationFor(role) {
  if (next && (need === role || need === "any" || !need)) return next;
  return role === "admin" ? "staff.html" : "report.html";
}

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  showAlert("");

  const wait = secondsLocked();
  if (wait > 0) {
    showAlert("Too many wrong tries. Please wait " + wait + " seconds and try again.");
    return;
  }

  if (validateLogin().length) return;

  submitButton.disabled = true;
  let result;
  try {
    result = await logIn(emailInput.value, passwordInput.value);
  } catch (error) {
    showAlert(error.message);
    submitButton.disabled = false;
    return;
  }
  submitButton.disabled = false;

  if (!result.ok) {
    const tries = readTries();
    tries.count += 1;
    if (tries.count >= MAX_TRIES) {
      tries.count = 0;
      tries.until = Date.now() + LOCK_SECONDS * 1000;
      showAlert("Too many wrong tries. Please wait " + LOCK_SECONDS + " seconds and try again.");
    } else {
      // Same message for a wrong email or a wrong password, so nobody can use
      // this form to find out which emails have accounts.
      showAlert("The email or password is incorrect. Check them and try again.");
    }
    writeTries(tries);
    passwordInput.value = "";
    passwordInput.focus();
    return;
  }

  writeTries({ count: 0, until: 0 });
  window.location.href = destinationFor(result.role);
});

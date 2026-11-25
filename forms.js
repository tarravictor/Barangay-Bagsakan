// Barangay Bagsakan: shared form helpers (forms.js)
// Used by report.js, register.js, login.js and track.js so every form shows
// errors the same way: a message right under the field, plus a red border.

// Philippine mobile number: 09 + 9 digits, or +639 + 9 digits (spaces are ignored).
const PHONE_PATTERN = /^(09\d{9}|\+639\d{9})$/;
// Email: something@something.something, no spaces.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Name: letters (including ñ and accents), spaces, periods, hyphens, apostrophes.
const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ .'-]+$/;

function cleanPhone(text) {
  return String(text || "").replace(/\s/g, "");
}

// Today's date as "YYYY-MM-DD" in local time (not UTC).
function todayText() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// Shows (or clears, with an empty message) the error under a field.
// The error element's id is the field's id + "-error".
function setFieldError(field, message) {
  const error = document.getElementById(field.id + "-error");
  const hintId = field.dataset.hint || "";
  field.setAttribute("aria-invalid", message ? "true" : "false");

  const describedBy = [hintId, message && error ? error.id : ""].filter(Boolean).join(" ");
  if (describedBy) {
    field.setAttribute("aria-describedby", describedBy);
  } else {
    field.removeAttribute("aria-describedby");
  }

  if (error) {
    error.textContent = message || "";
    error.hidden = !message;
  }
}

// Fills the red summary box at the top of a form: "Please fix 3 fields: ..."
// Each field name links to the field so keyboard users can jump to it.
function showSummary(box, problems) {
  if (!box) return;
  box.innerHTML = "";
  if (problems.length === 0) {
    box.hidden = true;
    return;
  }

  const title = document.createElement("p");
  title.className = "form-alert-title";
  title.textContent = problems.length === 1
    ? "Please fix 1 field before submitting."
    : "Please fix " + problems.length + " fields before submitting.";

  const list = document.createElement("ul");
  problems.forEach(function (problem) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = "#" + problem.field.id;
    link.textContent = problem.label;
    link.addEventListener("click", function (event) {
      event.preventDefault();
      problem.field.focus();
    });
    item.appendChild(link);
    list.appendChild(item);
  });

  box.append(title, list);
  box.hidden = false;
}

// The text of a field's <label>, without "(optional)".
function labelOf(field) {
  if (field.dataset.label) return field.dataset.label;
  const label = document.querySelector('label[for="' + field.id + '"]');
  if (!label) return field.name || field.id;
  const copy = label.cloneNode(true);
  copy.querySelectorAll(".optional, a").forEach(function (el) { el.remove(); });
  return copy.textContent.replace(/\s+/g, " ").trim() || field.id;
}

// Wires up a form: checks a field when you leave it, clears the error as soon as
// it's fixed, and checks everything on submit.
// rules: { fieldId: function (field) { return "" or "error message"; } }
// Returns a function that validates every field and returns the problems.
function connectValidation(form, rules, summaryBox) {
  const fields = Object.keys(rules).map(function (id) {
    return document.getElementById(id);
  });

  function check(field) {
    const message = rules[field.id](field);
    setFieldError(field, message);
    return message;
  }

  fields.forEach(function (field) {
    const eventName = field.type === "checkbox" || field.type === "file" || field.tagName === "SELECT" ? "change" : "blur";
    field.addEventListener(eventName, function () { check(field); });
    field.addEventListener("input", function () {
      if (field.getAttribute("aria-invalid") === "true" && !rules[field.id](field)) {
        setFieldError(field, "");
      }
    });
  });

  return function validateAll() {
    const problems = [];
    fields.forEach(function (field) {
      if (field.closest("[hidden]")) {
        setFieldError(field, "");
        return; // a hidden field (like "Specify the food") is skipped
      }
      if (check(field)) problems.push({ field: field, label: labelOf(field) });
    });
    showSummary(summaryBox, problems);
    if (problems.length) problems[0].field.focus();
    return problems;
  };
}

// Show/hide password buttons: <button data-toggle-password="password-id">
document.querySelectorAll("[data-toggle-password]").forEach(function (button) {
  const input = document.getElementById(button.getAttribute("data-toggle-password"));
  button.addEventListener("click", function () {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.textContent = show ? "Hide" : "Show";
    button.setAttribute("aria-pressed", show ? "true" : "false");
  });
});

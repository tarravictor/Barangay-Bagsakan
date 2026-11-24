// Barangay Bagsakan: report form (report.js)
// Demo only: nothing is sent to a server. A valid report is saved in this browser
// (see reports.js) so its reference number can be looked up on the Track page.

const form = document.getElementById("report-form");
const success = document.getElementById("form-success");

// Don't allow a best-before date in the past.
const dateInput = document.getElementById("best-before-date");
const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
dateInput.min = today.toISOString().slice(0, 10);

function showError(field, message) {
  const error = document.getElementById(field.id + "-error");
  field.setAttribute("aria-invalid", message ? "true" : "false");
  if (message) {
    field.setAttribute("aria-describedby", error.id);
  } else {
    field.removeAttribute("aria-describedby");
  }
  error.hidden = !message;
}

// Mobile number: 09 + 9 digits, or +639 + 9 digits (spaces are ignored).
const PHONE_PATTERN = /^(09\d{9}|\+639\d{9})$/;
// Email: something@something.something, no spaces.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValid(field) {
  const value = field.value.trim();
  if (field.type === "checkbox") return field.checked;
  if (field.type === "number") return value !== "" && Number(value) >= 1 && Number(value) <= 1000;
  if (field.id === "best-before-date") return field.value !== "" && field.value >= field.min;
  if (field.id === "donor-phone") return PHONE_PATTERN.test(field.value.replace(/\s/g, ""));
  if (field.id === "donor-email") return value.length <= 254 && EMAIL_PATTERN.test(value);
  if (field.id === "notes") return value.length >= 10 && value.length <= 500;
  return value !== "";
}

const required = form.querySelectorAll("[required]");

required.forEach(function (field) {
  field.addEventListener("blur", function () {
    showError(field, isValid(field) ? "" : "invalid");
  });
  field.addEventListener("input", function () {
    if (field.getAttribute("aria-invalid") === "true" && isValid(field)) {
      showError(field, "");
    }
  });
});

form.addEventListener("submit", function (event) {
  event.preventDefault();

  let firstInvalid = null;
  required.forEach(function (field) {
    const ok = isValid(field);
    showError(field, ok ? "" : "invalid");
    if (!ok && !firstInvalid) firstInvalid = field;
  });

  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  // Build the report from the form and save it (reports.js).
  const ref = newReference();
  const now = new Date().toISOString();
  const photoFile = document.getElementById("photo").files[0];
  const report = {
    ref: ref,
    food: document.getElementById("food-name").value.trim(),
    category: document.getElementById("category").value,
    quantity: Number(document.getElementById("quantity").value),
    unit: document.getElementById("unit").value,
    condition: document.getElementById("condition").value,
    notes: document.getElementById("notes").value.trim(),
    photoName: photoFile ? photoFile.name : "",
    bestBeforeDate: document.getElementById("best-before-date").value,
    bestBeforeTime: document.getElementById("best-before-time").value,
    pickup: document.getElementById("pickup-point").value.trim(),
    barangay: document.getElementById("barangay").value,
    donorName: document.getElementById("donor-name").value.trim(),
    donorPhone: document.getElementById("donor-phone").value.replace(/\s/g, ""),
    email: document.getElementById("donor-email").value.trim(),
    status: "Reported",
    remarks: "",
    createdAt: now,
    history: [{ status: "Reported", at: now }]
  };
  const saved = saveReport(report);

  document.getElementById("success-ref").textContent = ref;
  document.getElementById("success-track").href = "track.html?ref=" + encodeURIComponent(ref);
  document.getElementById("save-warning").hidden = saved;

  form.hidden = true;
  success.hidden = false;
  success.focus();
  success.scrollIntoView({ behavior: "smooth", block: "start" });
});

// Photo upload: check type and size, then show a preview.
const photo = document.getElementById("photo");
const preview = document.getElementById("photo-preview");
const previewImg = document.getElementById("photo-preview-img");
const photoError = document.getElementById("photo-error");
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

function clearPhoto() {
  photo.value = "";
  if (previewImg.src) URL.revokeObjectURL(previewImg.src);
  previewImg.removeAttribute("src");
  preview.hidden = true;
}

photo.addEventListener("change", function () {
  const file = photo.files[0];
  photoError.hidden = true;
  photo.setAttribute("aria-invalid", "false");
  if (!file) {
    clearPhoto();
    return;
  }

  let message = "";
  if (PHOTO_TYPES.indexOf(file.type) === -1) {
    message = "Choose a JPG, PNG or WebP image.";
  } else if (file.size > MAX_PHOTO_BYTES) {
    message = "That photo is over 5 MB. Choose a smaller one.";
  }

  if (message) {
    clearPhoto();
    photoError.textContent = message;
    photoError.hidden = false;
    photo.setAttribute("aria-invalid", "true");
    return;
  }

  if (previewImg.src) URL.revokeObjectURL(previewImg.src);
  previewImg.src = URL.createObjectURL(file);
  preview.hidden = false;
});

document.getElementById("photo-remove").addEventListener("click", function () {
  clearPhoto();
  photo.focus();
});

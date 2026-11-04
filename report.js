// Barangay Bagsakan: report form (report.js)
// Demo only: nothing is sent anywhere. It validates the form and shows a sample reference number.

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

function isValid(field) {
  if (field.type === "checkbox") return field.checked;
  if (field.type === "number") return Number(field.value) >= 1;
  if (field.id === "best-before-date") return field.value !== "" && field.value >= field.min;
  return field.value.trim() !== "";
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

  const number = String(Math.floor(Math.random() * 9000) + 1000);
  document.getElementById("success-ref").textContent = "BB-" + new Date().getFullYear() + "-" + number;

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

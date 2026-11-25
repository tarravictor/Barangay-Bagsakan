// Barangay Bagsakan: report form (report.js)
// Load auth.js, forms.js and reports.js before this file.
// Demo only: nothing is sent to a server. A valid report (with a smaller copy of
// the photo) is saved in this browser, so it can be tracked and managed by staff.

// Only registered donors can report. Everyone else goes to the login page first.
const donor = requireLogin("donor");

const form = document.getElementById("report-form");
const success = document.getElementById("form-success");
const alertBox = document.getElementById("report-alert");
const submitButton = document.getElementById("report-submit");

// ---------- Contact details come from the donor's account ----------

if (donor) {
  document.getElementById("acct-name").textContent = donor.name;
  document.getElementById("acct-email").textContent = donor.email;
  document.getElementById("acct-phone").textContent = donor.phone;
  document.getElementById("acct-org").textContent = donor.organization || "";
  document.getElementById("acct-org-row").hidden = !donor.organization;
}

// ---------- Date limits (also shown by the date pickers) ----------

const TODAY = todayText();
document.getElementById("date-prepared").max = TODAY;
document.getElementById("best-before-date").min = TODAY;
document.getElementById("pickup-date").min = TODAY;

// "HH:MM" right now, to stop a pickup time earlier today.
function nowTimeText() {
  const now = new Date();
  return String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
}

function value(id) {
  return document.getElementById(id).value.trim();
}

// ---------- "Other" category needs a short description ----------

const category = document.getElementById("category");
const otherField = document.getElementById("other-spec-field");
category.addEventListener("change", function () {
  otherField.hidden = category.value !== "Other";
});

// ---------- Live character count for the description ----------

const notes = document.getElementById("notes");
const notesCount = document.getElementById("notes-count");
notes.addEventListener("input", function () {
  notesCount.textContent = notes.value.trim().length;
});

// ---------- Photo: required, JPG/PNG/WEBP, 5 MB or less ----------

const photo = document.getElementById("photo");
const preview = document.getElementById("photo-preview");
const previewImg = document.getElementById("photo-preview-img");
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

function photoProblem(file) {
  if (!file) return "Please add a photo of the food so staff can check its condition.";
  if (PHOTO_TYPES.indexOf(file.type) === -1) return "This file type is not supported. Please upload a JPG, PNG or WEBP photo.";
  if (file.size > MAX_PHOTO_BYTES) return "This photo is larger than 5 MB. Please upload a smaller photo.";
  return "";
}

function clearPreview() {
  if (previewImg.src) URL.revokeObjectURL(previewImg.src);
  previewImg.removeAttribute("src");
  preview.hidden = true;
}

photo.addEventListener("change", function () {
  const file = photo.files[0];
  const problem = photoProblem(file);
  clearPreview();
  if (problem) return; // connectValidation shows the message under the field
  previewImg.src = URL.createObjectURL(file);
  preview.hidden = false;
});

document.getElementById("photo-remove").addEventListener("click", function () {
  photo.value = "";
  clearPreview();
  photo.focus();
});

// Shrinks the photo (longest side 960 px, JPEG) so it fits in the browser's storage.
// A 5 MB phone photo becomes roughly 100 to 200 KB.
function shrinkPhoto(file) {
  return new Promise(function (resolve, reject) {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = function () {
      const scale = Math.min(1, 960 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff"; // transparent PNGs get a white background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable"));
    };
    img.src = url;
  });
}

// ---------- The rules for every field ----------
// Each rule returns "" when the field is fine, or the message to show under it.

const validateForm = connectValidation(form, {
  "food-name": function (field) {
    const v = field.value.trim();
    if (!v) return "Enter the name of the food, for example Pandesal.";
    if (v.length < 2) return "The food name must be at least 2 characters.";
    return "";
  },
  "category": function (field) {
    return field.value ? "" : "Please select a food category from the list.";
  },
  "condition": function (field) {
    return field.value ? "" : "Choose the food's condition: Fresh or Near expiry.";
  },
  "other-spec": function (field) {
    const v = field.value.trim();
    if (!v) return "You chose Other. Please say what kind of food it is.";
    if (v.length > 50) return "Keep this to 50 characters or fewer.";
    return "";
  },
  "quantity": function (field) {
    const v = field.value.trim();
    if (v === "") return "Enter how much food there is.";
    const n = Number(v);
    if (!Number.isInteger(n)) return "Enter a whole number, like 40.";
    if (n < 1) return "The quantity must be at least 1. Negative numbers and zero aren't allowed.";
    if (n > 1000) return "The quantity can't be more than 1000. For bigger donations, contact the barangay hall.";
    return "";
  },
  "unit": function (field) {
    return field.value ? "" : "Choose a unit, such as pieces or kg.";
  },
  "notes": function (field) {
    const length = field.value.trim().length;
    if (length < 10) return "Please describe the food, including its condition, packaging and how it is stored (at least 10 characters).";
    if (length > 500) return "Keep the description to 500 characters or fewer.";
    return "";
  },
  "photo": function (field) {
    return photoProblem(field.files[0]);
  },
  "date-prepared": function (field) {
    if (!field.value) return "Enter the date the food was prepared or bought.";
    if (field.value > TODAY) return "The date prepared can't be in the future.";
    return "";
  },
  "best-before-date": function (field) {
    if (!field.value) return "Enter the best-before date.";
    if (field.value < TODAY) return "This food is past its best-before date. Expired food can't be reported.";
    const prepared = value("date-prepared");
    if (prepared && field.value < prepared) return "The best-before date can't be earlier than the date prepared.";
    return "";
  },
  "best-before-time": function (field) {
    if (field.value && value("best-before-date") === TODAY && field.value <= nowTimeText()) {
      return "That time has already passed today. Expired food can't be reported.";
    }
    return "";
  },
  "pickup-point": function (field) {
    const length = field.value.trim().length;
    if (length === 0) return "Please enter the pickup address so we know where to collect the food.";
    if (length < 10) return "Add more detail to the address, like the house number and street (at least 10 characters).";
    if (length > 200) return "Keep the address to 200 characters or fewer.";
    return "";
  },
  "barangay": function (field) {
    return field.value ? "" : "Please select your barangay so we know where to collect the food.";
  },
  "landmark": function (field) {
    return field.value.trim().length > 100 ? "Keep the landmark to 100 characters or fewer." : "";
  },
  "pickup-date": function (field) {
    if (!field.value) return "";
    if (field.value < TODAY) return "The pickup date can't be in the past.";
    const bestBefore = value("best-before-date");
    if (bestBefore && field.value > bestBefore) return "Pick a pickup date on or before the best-before date.";
    return "";
  },
  "pickup-time": function (field) {
    if (!field.value) return "";
    const date = value("pickup-date");
    if (!date) return "Choose a pickup date to go with this time.";
    if (date === TODAY && field.value <= nowTimeText()) return "That pickup time has already passed today.";
    return "";
  },
  "privacy-consent": function (field) {
    return field.checked ? "" : "Please agree to the privacy policy before submitting.";
  },
  "confirm": function (field) {
    return field.checked ? "" : "Please confirm the food is safe and not expired.";
  }
}, alertBox);

// ---------- Spam safeguard: at most 5 reports per hour per account ----------

const MAX_REPORTS_PER_HOUR = 5;

function reportsInLastHour(email) {
  const hourAgo = Date.now() - 60 * 60 * 1000;
  return reportsByOwner(email).filter(function (report) {
    return new Date(report.createdAt).getTime() > hourAgo;
  }).length;
}

function showFormMessage(text, link) {
  alertBox.innerHTML = "";
  const p = document.createElement("p");
  p.className = "form-alert-title";
  p.textContent = text;
  alertBox.appendChild(p);
  if (link) {
    const a = document.createElement("a");
    a.href = link.href;
    a.textContent = link.text;
    alertBox.appendChild(a);
  }
  alertBox.hidden = false;
  alertBox.focus();
}

// ---------- Submit ----------

form.addEventListener("submit", async function (event) {
  event.preventDefault();
  if (!donor) return;

  // Invalid fields keep everything you typed; only the errors change.
  if (validateForm().length) return;

  const now = new Date().toISOString();
  const report = {
    ref: newReference(),
    food: value("food-name"),
    category: category.value,
    otherSpec: category.value === "Other" ? value("other-spec") : "",
    quantity: Number(value("quantity")),
    unit: value("unit"),
    condition: value("condition"),
    notes: value("notes"),
    photoName: photo.files[0].name,
    photo: "",
    datePrepared: value("date-prepared"),
    bestBeforeDate: value("best-before-date"),
    bestBeforeTime: value("best-before-time"),
    pickup: value("pickup-point"),
    barangay: value("barangay"),
    city: value("city"),
    landmark: value("landmark"),
    pickupDate: value("pickup-date"),
    pickupTime: value("pickup-time"),
    donorName: donor.name,
    donorPhone: donor.phone,
    email: donor.email,
    organization: donor.organization || "",
    ownerEmail: donor.email,
    status: "Reported",
    remarks: "",
    updates: [],
    createdAt: now,
    history: [{ status: "Reported", at: now }]
  };

  // Duplicate report: the same food, address and best-before date is already open.
  const duplicate = findDuplicate(report);
  if (duplicate) {
    showFormMessage(
      "You already reported this food. Its reference number is " + duplicate.ref + ", so this report was not sent again.",
      { href: "track.html?ref=" + encodeURIComponent(duplicate.ref), text: "Track " + duplicate.ref }
    );
    return;
  }

  if (reportsInLastHour(donor.email) >= MAX_REPORTS_PER_HOUR) {
    showFormMessage("You've sent " + MAX_REPORTS_PER_HOUR + " reports in the last hour. To prevent spam, please wait a while before sending another.");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "Submitting…";
  try {
    report.photo = await shrinkPhoto(photo.files[0]);
  } catch (error) {
    submitButton.disabled = false;
    submitButton.textContent = "Submit report";
    setFieldError(photo, "We couldn't read this photo. Please try another JPG, PNG or WEBP photo.");
    photo.focus();
    return;
  }

  const saved = saveReport(report);
  submitButton.disabled = false;
  submitButton.textContent = "Submit report";
  if (!saved) {
    showFormMessage("This browser is out of storage space, so the report could not be saved. Ask barangay staff to reset the demo data, then try again.");
    return;
  }

  document.getElementById("success-ref").textContent = report.ref;
  document.getElementById("success-track").href = "track.html?ref=" + encodeURIComponent(report.ref);
  form.hidden = true;
  success.hidden = false;
  success.focus();
  success.scrollIntoView({ behavior: "smooth", block: "start" });
});

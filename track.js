// Barangay Bagsakan: track a report (track.js)
// Looks up a reference number with getReport() from reports.js and fills in the
// result card that is already in track.html. Demo only: data comes from this browser.
// Load auth.js, forms.js and reports.js before this file.
// Anyone can track a report, but only the donor who sent it (and the admin) see the
// full details and photo. The donor can also reply when staff ask for more info.

const lookupForm = document.getElementById("lookup-form");
const refInput = document.getElementById("ref");
const refError = document.getElementById("ref-error");
const emptyState = document.getElementById("track-empty");
const resultBox = document.getElementById("track-result");

// The three main steps every report goes through.
const MAIN_STEPS = ["Reported", "Verified", "Picked up"];


// ---------- Formatting helpers ----------

// "2026-11-24T08:12:00Z" -> "Nov 24, 4:12 PM"
function formatWhen(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-PH", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
  });
}

// "2026-11-24" + "18:00" -> "Today, 6:00 PM" / "Tomorrow" / "Nov 26"
function formatBestBefore(dateText, timeText) {
  if (!dateText) return "Not given";
  const parts = dateText.split("-").map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysAway = Math.round((date - today) / 86400000);

  let label = date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  if (daysAway === 0) label = "Today";
  if (daysAway === 1) label = "Tomorrow";
  if (daysAway < 0) label += " (passed)";

  if (timeText) {
    const t = timeText.split(":").map(Number);
    const withTime = new Date(2000, 0, 1, t[0], t[1]);
    label += ", " + withTime.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
  }
  return label;
}

// Latest time a report reached a status, from its history.
function timeOf(report, status) {
  const entries = (report.history || []).filter(function (entry) {
    return entry.status === status;
  });
  return entries.length ? entries[entries.length - 1].at : "";
}

// ---------- Timeline ----------
// Builds the 3 main steps. "Requires more info", "Rejected" and "Duplicate" take
// the place of the Verified step, because that is where staff decide.
function buildSteps(report) {
  const status = report.status;
  const reachedIndex = MAIN_STEPS.indexOf(status); // -1 for the two exception statuses

  return MAIN_STEPS.map(function (name, index) {
    const step = { name: name, time: timeOf(report, name), state: "todo" };

    if (reachedIndex >= 0) {
      if (index < reachedIndex) step.state = "done";
      if (index === reachedIndex) step.state = index === MAIN_STEPS.length - 1 ? "done" : "current";
    } else {
      if (index === 0) step.state = "done";
      if (index === 1) {
        step.name = status;
        step.time = timeOf(report, status);
        step.state = status === "Requires more info" ? "warning" : "rejected";
      }
    }
    return step;
  });
}

const STEP_WORDS = { done: "done", current: "current step", warning: "needs your action", rejected: "stopped here", todo: "not yet" };
const STEP_ICON = { done: "✓", current: "", warning: "!", rejected: "✕", todo: "" };

function renderTimeline(report) {
  const timeline = document.getElementById("timeline");
  timeline.innerHTML = "";

  buildSteps(report).forEach(function (step) {
    const item = document.createElement("li");
    item.className = "is-" + step.state;
    if (step.state === "current" || step.state === "warning" || step.state === "rejected") {
      item.setAttribute("aria-current", "step");
    }

    const dot = document.createElement("span");
    dot.className = "timeline-dot";
    dot.setAttribute("aria-hidden", "true");
    dot.textContent = STEP_ICON[step.state];

    const name = document.createElement("span");
    name.className = "timeline-name";
    name.textContent = step.name;

    const hidden = document.createElement("span");
    hidden.className = "visually-hidden";
    hidden.textContent = " (" + STEP_WORDS[step.state] + ")";
    name.appendChild(hidden);

    const time = document.createElement("span");
    time.className = "timeline-time";
    if (step.time) {
      time.textContent = formatWhen(step.time);
    } else {
      const stopped = report.status === "Rejected" || report.status === "Duplicate";
      time.textContent = stopped && step.state === "todo" ? "Not going ahead" : "Waiting";
    }

    item.append(dot, name, time);
    timeline.appendChild(item);
  });
}

// ---------- Showing a result ----------

function showReport(report) {
  document.getElementById("result-title").textContent =
    report.food + ", " + report.quantity + " " + report.unit;
  document.getElementById("result-meta").textContent =
    report.ref + " · " + report.category + (report.sample ? " · Demo report" : "");

  const badge = document.getElementById("result-status");
  badge.className = "status " + (STATUS_CLASS[report.status] || "");
  badge.textContent = report.status;

  renderTimeline(report);

  document.getElementById("detail-pickup").textContent = report.pickup || "Not given";
  document.getElementById("detail-remarks").textContent = report.remarks || "No remarks yet.";
  document.getElementById("detail-best-before").textContent =
    formatBestBefore(report.bestBeforeDate, report.bestBeforeTime);
  const entries = report.history || [];
  document.getElementById("detail-updated").textContent =
    entries.length ? formatWhen(entries[entries.length - 1].at) : formatWhen(report.createdAt);

  const viewer = currentUser();
  const isOwner = Boolean(viewer && viewer.role === "donor" && report.ownerEmail === viewer.email);
  const isAdmin = Boolean(viewer && viewer.role === "admin");

  renderBanner(report, isOwner, isAdmin);
  renderOwnerDetails(report, isOwner || isAdmin);
  replyForm.hidden = !(isOwner && report.status === "Requires more info");
  currentRef = report.ref;

  emptyState.hidden = true;
  resultBox.hidden = false;
  document.getElementById("result-title").focus();
}

// ---------- "Action needed" banner ----------

const BANNERS = {
  "Requires more info": { title: "Action needed", fallback: "Staff need more information from you." },
  "Rejected": { title: "Report not accepted", fallback: "Staff could not accept this food." },
  "Duplicate": { title: "Already reported", fallback: "This food was already reported." }
};

function renderBanner(report, isOwner, isAdmin) {
  const banner = document.getElementById("action-banner");
  const button = document.getElementById("action-button");
  const info = BANNERS[report.status];
  banner.hidden = !info;
  if (!info) return;

  banner.classList.toggle("is-rejected", report.status !== "Requires more info");
  banner.querySelector(".action-title").textContent = info.title;
  document.getElementById("action-message").textContent = report.remarks || info.fallback;

  // What the button does depends on who is looking.
  button.hidden = false;
  if (isAdmin) {
    button.textContent = "Open dashboard";
    button.href = "staff.html";
  } else if (report.status === "Requires more info") {
    if (isOwner) {
      button.textContent = "Reply to staff";
      button.href = "#reply-form";
    } else {
      button.textContent = "Log in to reply";
      button.href = "login.html?need=donor&next=" + encodeURIComponent("track.html?ref=" + report.ref);
    }
  } else if (report.status === "Duplicate") {
    button.textContent = isOwner ? "See my reports" : "Track another report";
    button.href = isOwner ? "my-reports.html" : "track.html";
  } else {
    button.textContent = "Report other food";
    button.href = "report.html";
  }
}

// ---------- Full details for the owner and the admin ----------

function formatDay(dateText, timeText) {
  if (!dateText) return "";
  const p = dateText.split("-").map(Number);
  const t = (timeText || "").split(":").map(Number);
  const d = new Date(p[0], p[1] - 1, p[2], t[0] || 0, t[1] || 0);
  let label = d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  if (timeText) label += ", " + d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
  return label;
}

function renderOwnerDetails(report, show) {
  const box = document.getElementById("owner-details");
  const body = document.getElementById("owner-body");
  box.hidden = !show;
  document.getElementById("track-privacy").hidden = show;
  body.innerHTML = "";
  if (!show) return;

  const figure = document.createElement("figure");
  figure.className = "dash-photo";
  if (report.photo) {
    const img = document.createElement("img");
    img.src = report.photo;
    img.alt = "Photo of " + report.food;
    figure.appendChild(img);
  } else {
    const none = document.createElement("p");
    none.className = "dash-nophoto";
    none.textContent = "No photo for this sample report.";
    figure.appendChild(none);
  }

  const list = document.createElement("dl");
  list.className = "dash-list";
  [
    ["Category", report.category + (report.otherSpec ? " (" + report.otherSpec + ")" : "")],
    ["Condition", report.condition],
    ["Description", report.notes],
    ["Date prepared", formatDay(report.datePrepared)],
    ["Barangay", [report.barangay, report.city].filter(Boolean).join(", ")],
    ["Landmark", report.landmark],
    ["Preferred pickup", formatDay(report.pickupDate, report.pickupTime)]
  ].forEach(function (pair) {
    if (!pair[1]) return;
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    dt.textContent = pair[0];
    const dd = document.createElement("dd");
    dd.textContent = pair[1];
    row.append(dt, dd);
    list.appendChild(row);
  });

  (report.updates || []).forEach(function (update) {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    dt.textContent = "Your reply, " + formatWhen(update.at);
    const dd = document.createElement("dd");
    dd.textContent = update.message;
    row.append(dt, dd);
    list.appendChild(row);
  });

  body.append(figure, list);
}

// ---------- Donor replies to "Requires more info" ----------

const replyForm = document.getElementById("reply-form");
const replyText = document.getElementById("reply-text");
let currentRef = "";

const validateReply = connectValidation(replyForm, {
  "reply-text": function (field) {
    const length = field.value.trim().length;
    if (length < 10) return "Write at least 10 characters so staff know what changed.";
    if (length > 500) return "Keep your reply to 500 characters or fewer.";
    return "";
  }
}, null);

replyForm.addEventListener("submit", function (event) {
  event.preventDefault();
  if (validateReply().length) return;

  const viewer = currentUser();
  const report = getReport(currentRef);
  if (!report || !viewer || report.ownerEmail !== viewer.email) return;

  const now = new Date().toISOString();
  report.updates = (report.updates || []).concat([{ at: now, message: replyText.value.trim() }]);
  report.status = "Reported";
  report.history = (report.history || []).concat([{ status: "Reported", at: now, note: "donor sent more information" }]);
  report.remarks = "";
  if (!saveReport(report)) {
    setFieldError(replyText, "Could not save. This browser may be blocking storage.");
    return;
  }
  replyText.value = "";
  showReport(report);
});

function showError(message) {
  refError.textContent = message;
  refError.hidden = false;
  refInput.setAttribute("aria-invalid", "true");
  resultBox.hidden = true;
  emptyState.hidden = false;
}

function clearError() {
  refError.hidden = true;
  refInput.setAttribute("aria-invalid", "false");
}

// ---------- Lookup ----------

function lookUp(rawRef) {
  const ref = normalizeRef(rawRef);
  refInput.value = ref;

  if (ref === "") {
    showError("Enter your reference number, for example BB-2026-0148.");
    refInput.focus();
    return;
  }
  if (!isValidRefFormat(ref)) {
    showError("Reference numbers look like BB-2026-0148. Check the number and try again.");
    refInput.focus();
    return;
  }

  const report = getReport(ref);
  if (!report) {
    showError("We couldn't find " + ref + ". Check the number, or contact the barangay hall so staff can find your report.");
    refInput.focus();
    return;
  }

  clearError();
  showReport(report);
  // Keep the address shareable, e.g. track.html?ref=BB-2026-0148
  history.replaceState(null, "", "track.html?ref=" + encodeURIComponent(ref));
}

lookupForm.addEventListener("submit", function (event) {
  event.preventDefault();
  lookUp(refInput.value);
});

refInput.addEventListener("input", clearError);

// "Demo reports to try" buttons
document.querySelectorAll(".sample-ref").forEach(function (button) {
  button.addEventListener("click", function () {
    lookUp(button.getAttribute("data-ref"));
  });
});

// Coming from the report form's "Track this report" button: track.html?ref=BB-...
const refFromAddress = new URLSearchParams(window.location.search).get("ref");
if (refFromAddress) {
  lookUp(refFromAddress);
}

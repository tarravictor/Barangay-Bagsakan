// Barangay Bagsakan: track a report (track.js)
// Looks up a reference number with getReport() from reports.js and fills in the
// result card that is already in track.html. Demo only: data comes from this browser.

const lookupForm = document.getElementById("lookup-form");
const refInput = document.getElementById("ref");
const refError = document.getElementById("ref-error");
const emptyState = document.getElementById("track-empty");
const resultBox = document.getElementById("track-result");

// The three main steps every report goes through.
const MAIN_STEPS = ["Reported", "Verified", "Picked up"];

// Which colour tag (style.css) goes with each status.
const STATUS_CLASS = {
  "Reported": "status-reported",
  "Verified": "status-verified",
  "Picked up": "status-picked",
  "Requires more info": "status-info",
  "Rejected": "status-rejected"
};

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
// Builds the 3 main steps. "Requires more info" and "Rejected" take the place
// of the Verified step, because that is where staff decide.
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
        step.state = status === "Rejected" ? "rejected" : "warning";
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
      time.textContent = report.status === "Rejected" && step.state === "todo" ? "Not going ahead" : "Waiting";
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

  // The yellow banner only appears when the donor has to do something.
  const banner = document.getElementById("action-banner");
  const needsAction = report.status === "Requires more info" || report.status === "Rejected";
  banner.hidden = !needsAction;
  if (needsAction) {
    const rejected = report.status === "Rejected";
    banner.classList.toggle("is-rejected", rejected);
    banner.querySelector(".action-title").textContent = rejected ? "Report not accepted" : "Action needed";
    banner.querySelector(".btn").textContent = rejected ? "Report other food" : "Update report";
    document.getElementById("action-message").textContent =
      report.remarks || (rejected ? "Staff could not accept this food." : "Staff need more information from you.");
  }

  emptyState.hidden = true;
  resultBox.hidden = false;
  document.getElementById("result-title").focus();
}

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

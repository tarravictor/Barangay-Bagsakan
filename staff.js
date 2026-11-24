// Barangay Bagsakan: staff view (staff.js)
// Demo only: there is no login and nothing is sent to a server. Staff can change a
// report's status and remarks. Changes are saved with reports.js, so they show on the
// Track page after a refresh. Load reports.js before this file.

const rowsBox = document.getElementById("staff-rows");
const countText = document.getElementById("staff-count");
const savedText = document.getElementById("staff-saved");
const resetButton = document.getElementById("reset-demo");

// Which colour tag (style.css) goes with each status. Same words as track.js.
const STATUS_CLASS = {
  "Reported": "status-reported",
  "Verified": "status-verified",
  "Picked up": "status-picked",
  "Requires more info": "status-info",
  "Rejected": "status-rejected"
};

let savedTimer = null;

// ---------- Small helpers ----------

// "2026-11-24T08:12:00Z" -> "Nov 24, 4:12 PM"
function formatWhen(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-PH", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
  });
}

function makeCell(content) {
  const cell = document.createElement("td");
  if (content) cell.append(content);
  return cell;
}

// Shows "Saved" (or another message) for a few seconds.
function showSaved(message) {
  savedText.textContent = message;
  clearTimeout(savedTimer);
  savedTimer = setTimeout(function () {
    savedText.textContent = "";
  }, 4000);
}

// ---------- One table row ----------

function buildRow(report) {
  const row = document.createElement("tr");
  row.dataset.ref = report.ref;

  // Reference (+ when it was reported)
  const refCell = makeCell();
  const refText = document.createElement("span");
  refText.className = "staff-ref";
  refText.textContent = report.ref;
  const when = document.createElement("span");
  when.className = "staff-sub";
  when.textContent = formatWhen(report.createdAt);
  refCell.append(refText, when);
  if (report.sample) {
    const demo = document.createElement("span");
    demo.className = "staff-sub";
    demo.textContent = "Demo report";
    refCell.append(demo);
  }

  // Food, quantity and category
  const foodCell = makeCell();
  const food = document.createElement("span");
  food.textContent = report.food;
  const detail = document.createElement("span");
  detail.className = "staff-sub";
  detail.textContent = report.quantity + " " + report.unit + " · " + report.category;
  foodCell.append(food, detail);

  // Pickup point
  const pickupCell = makeCell();
  pickupCell.textContent = report.pickup || "Not given";

  // Status: current tag + dropdown to change it
  const statusCell = makeCell();
  const select = document.createElement("select");
  select.className = "form-select form-select-sm";
  select.id = "status-" + report.ref;
  STATUSES.forEach(function (name) {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    if (name === report.status) option.selected = true;
    select.appendChild(option);
  });
  const selectLabel = document.createElement("label");
  selectLabel.className = "visually-hidden";
  selectLabel.htmlFor = select.id;
  selectLabel.textContent = "Status for " + report.ref;
  const tag = document.createElement("span");
  tag.className = "status staff-tag " + (STATUS_CLASS[report.status] || "");
  tag.textContent = report.status;
  statusCell.append(selectLabel, select, tag);

  // Remarks
  const remarksCell = makeCell();
  const remarks = document.createElement("textarea");
  remarks.className = "form-control form-control-sm";
  remarks.id = "remarks-" + report.ref;
  remarks.rows = 2;
  remarks.maxLength = 300;
  remarks.value = report.remarks || "";
  const remarksLabel = document.createElement("label");
  remarksLabel.className = "visually-hidden";
  remarksLabel.htmlFor = remarks.id;
  remarksLabel.textContent = "Remarks for " + report.ref;
  remarksCell.append(remarksLabel, remarks);

  // Save button
  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-primary-solid btn-sm";
  button.textContent = "Save";
  const buttonLabel = document.createElement("span");
  buttonLabel.className = "visually-hidden";
  buttonLabel.textContent = " changes for " + report.ref;
  button.appendChild(buttonLabel);
  button.addEventListener("click", function () {
    saveRow(report.ref, select.value, remarks.value);
  });
  const buttonCell = makeCell(button);

  row.append(refCell, foodCell, pickupCell, statusCell, remarksCell, buttonCell);
  return row;
}

// ---------- Saving ----------

function saveRow(ref, status, remarks) {
  const report = getReport(ref);
  if (!report) {
    showSaved("Could not find " + ref + ".");
    return;
  }

  let ok;
  if (report.status === status) {
    // Only the remarks changed: don't add a repeat step to the timeline.
    report.remarks = remarks.trim();
    ok = saveReport(report);
  } else {
    ok = setStatus(ref, status, remarks);
  }

  if (!ok) {
    showSaved("Could not save. This browser may be blocking storage.");
    return;
  }

  renderTable();
  const row = rowsBox.querySelector('tr[data-ref="' + ref + '"]');
  if (row) row.classList.add("staff-row-saved");
  showSaved("Saved: " + ref + " is now " + status + ".");
}

// ---------- Drawing the table ----------

function renderTable() {
  const reports = allReports();
  rowsBox.innerHTML = "";

  if (reports.length === 0) {
    const empty = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "staff-empty";
    cell.textContent = "No reports yet.";
    empty.appendChild(cell);
    rowsBox.appendChild(empty);
  }

  reports.forEach(function (report) {
    rowsBox.appendChild(buildRow(report));
  });

  countText.textContent = reports.length + (reports.length === 1 ? " report" : " reports");
}

// ---------- Reset demo data ----------
// Removes the saved reports and status changes. The three sample reports are built
// fresh by reports.js, so they come back in their starting state.

resetButton.addEventListener("click", function () {
  if (!window.confirm("Reset the demo data? Reports submitted in this browser and all status changes will be removed.")) {
    return;
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    showSaved("Could not reset. This browser may be blocking storage.");
    return;
  }
  renderTable();
  showSaved("Demo data reset.");
});

renderTable();

// Barangay Bagsakan: admin dashboard (staff.js)
// Load auth.js, forms.js and reports.js before this file.
// Only the barangay admin account can open this page. Staff can search, filter and
// sort reports, see the photo and the donor's contact details, and change a report's
// status and remarks. Changes are saved with reports.js, so donors see them on the
// Track page and in My reports.

const admin = requireLogin("admin");

const rowsBox = document.getElementById("staff-rows");
const countText = document.getElementById("staff-count");
const savedText = document.getElementById("staff-saved");
const statsBox = document.getElementById("dash-stats");
const searchInput = document.getElementById("dash-search");
const filterSelect = document.getElementById("dash-filter");
const sortSelect = document.getElementById("dash-sort");

let savedTimer = null;
const openDetails = {}; // which reports have their details opened

// ---------- Small helpers ----------

// "2026-11-24T08:12:00Z" -> "Nov 24, 4:12 PM"
function formatWhen(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-PH", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
  });
}

// "2026-11-24" (+ "18:00") -> "Nov 24, 2026, 6:00 PM"
function formatDate(dateText, timeText) {
  if (!dateText) return "";
  const p = dateText.split("-").map(Number);
  const t = (timeText || "").split(":").map(Number);
  const d = new Date(p[0], p[1] - 1, p[2], t[0] || 0, t[1] || 0);
  let label = d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  if (timeText) label += ", " + d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
  return label;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}

function showSaved(message) {
  savedText.textContent = message;
  clearTimeout(savedTimer);
  savedTimer = setTimeout(function () { savedText.textContent = ""; }, 5000);
}

function isPastBestBefore(report) {
  return report.bestBeforeDate && report.bestBeforeDate < todayText() &&
    CLOSED_STATUSES.indexOf(report.status) === -1;
}

// ---------- Numbers at the top ----------

function renderStats(reports) {
  statsBox.innerHTML = "";
  const items = [["All reports", reports.length]].concat(STATUSES.map(function (status) {
    return [status, reports.filter(function (r) { return r.status === status; }).length];
  }));
  items.forEach(function (item) {
    const box = el("div", "dash-stat");
    const label = el("dt", "", item[0]);
    if (STATUS_CLASS[item[0]]) {
      label.textContent = "";
      label.appendChild(el("span", "status " + STATUS_CLASS[item[0]], item[0]));
    }
    box.append(label, el("dd", "", item[1]));
    statsBox.appendChild(box);
  });
}

// ---------- Details (photo, description, donor contact, history) ----------

function addDetail(list, term, content) {
  if (content === "" || content === null || content === undefined) return;
  const row = el("div");
  const dd = el("dd");
  if (typeof content === "string" || typeof content === "number") dd.textContent = content;
  else dd.appendChild(content);
  row.append(el("dt", "", term), dd);
  list.appendChild(row);
}

function buildDetails(report) {
  const box = el("div", "dash-details");

  const figure = el("figure", "dash-photo");
  if (report.photo) {
    const img = el("img");
    img.src = report.photo;
    img.alt = "Photo of " + report.food + " sent by the donor";
    figure.appendChild(img);
    figure.appendChild(el("figcaption", "", report.photoName || ""));
  } else {
    figure.appendChild(el("p", "dash-nophoto", report.sample ? "No photo (sample report)." : "No photo."));
  }

  const food = el("dl", "dash-list");
  addDetail(food, "Category", report.category + (report.otherSpec ? " (" + report.otherSpec + ")" : ""));
  addDetail(food, "Condition", report.condition || "");
  addDetail(food, "Description", report.notes || "");
  addDetail(food, "Date prepared", formatDate(report.datePrepared));
  addDetail(food, "Best before", formatDate(report.bestBeforeDate, report.bestBeforeTime));

  const pickup = el("dl", "dash-list");
  addDetail(pickup, "Pickup address", report.pickup || "");
  addDetail(pickup, "Barangay", [report.barangay, report.city].filter(Boolean).join(", "));
  addDetail(pickup, "Landmark", report.landmark || "");
  addDetail(pickup, "Preferred pickup", formatDate(report.pickupDate, report.pickupTime));

  const donor = el("dl", "dash-list");
  addDetail(donor, "Donor", report.donorName || (report.sample ? "Sample report" : ""));
  addDetail(donor, "Organization", report.organization || "");
  if (report.email) {
    const mail = el("a", "text-link", report.email);
    mail.href = "mailto:" + report.email;
    addDetail(donor, "Email", mail);
  }
  if (report.donorPhone) {
    const tel = el("a", "text-link", report.donorPhone);
    tel.href = "tel:" + report.donorPhone;
    addDetail(donor, "Mobile", tel);
  }

  const columns = el("div", "dash-columns");
  [["Food", food], ["Pickup", pickup], ["Donor (staff only)", donor]].forEach(function (pair) {
    const col = el("div");
    col.append(el("h3", "dash-heading", pair[0]), pair[1]);
    columns.appendChild(col);
  });

  // Donor replies sent from the Track page after "Requires more info"
  const updates = report.updates || [];
  if (updates.length) {
    const col = el("div", "dash-updates");
    col.appendChild(el("h3", "dash-heading", "Donor replies"));
    const list = el("ul", "side-list");
    updates.forEach(function (u) {
      list.appendChild(el("li", "", formatWhen(u.at) + ": " + u.message));
    });
    col.appendChild(list);
    columns.appendChild(col);
  }

  const history = el("div");
  history.appendChild(el("h3", "dash-heading", "Status history"));
  const steps = el("ol", "side-list");
  (report.history || []).forEach(function (h) {
    steps.appendChild(el("li", "", h.status + ", " + formatWhen(h.at) + (h.note ? " (" + h.note + ")" : "")));
  });
  history.appendChild(steps);
  columns.appendChild(history);

  box.append(figure, columns);
  return box;
}

// ---------- One report = one row (+ an optional details row) ----------

function buildRows(report) {
  const row = el("tr");
  row.dataset.ref = report.ref;

  const refCell = el("td");
  refCell.dataset.label = "Reference";
  refCell.append(el("span", "staff-ref", report.ref), el("span", "staff-sub", formatWhen(report.createdAt)));
  if (report.sample) refCell.appendChild(el("span", "staff-sub", "Sample report"));

  const foodCell = el("td");
  foodCell.dataset.label = "Food";
  foodCell.append(
    el("span", "staff-food", report.food),
    el("span", "staff-sub", report.quantity + " " + report.unit + " · " + report.category)
  );

  const bbCell = el("td");
  bbCell.dataset.label = "Best before";
  bbCell.appendChild(el("span", "", formatDate(report.bestBeforeDate, report.bestBeforeTime) || "Not given"));
  if (isPastBestBefore(report)) bbCell.appendChild(el("span", "staff-warn", "⚠ Past best-before"));

  const statusCell = el("td");
  statusCell.dataset.label = "Status";
  const select = el("select", "form-select form-select-sm");
  select.id = "status-" + report.ref;
  STATUSES.forEach(function (name) {
    const option = el("option", "", name);
    option.value = name;
    if (name === report.status) option.selected = true;
    select.appendChild(option);
  });
  const selectLabel = el("label", "visually-hidden", "Status for " + report.ref);
  selectLabel.htmlFor = select.id;
  statusCell.append(selectLabel, select, el("span", "status staff-tag " + (STATUS_CLASS[report.status] || ""), report.status));

  const remarksCell = el("td");
  remarksCell.dataset.label = "Remarks for the donor";
  const remarks = el("textarea", "form-control form-control-sm");
  remarks.id = "remarks-" + report.ref;
  remarks.rows = 2;
  remarks.maxLength = 300;
  remarks.value = report.remarks || "";
  const remarksLabel = el("label", "visually-hidden", "Remarks for " + report.ref);
  remarksLabel.htmlFor = remarks.id;
  remarksCell.append(remarksLabel, remarks);

  const actionCell = el("td", "staff-actions");
  const save = el("button", "btn btn-primary-solid btn-sm", "Save");
  save.type = "button";
  save.appendChild(el("span", "visually-hidden", " changes for " + report.ref));
  save.addEventListener("click", function () {
    saveRow(report.ref, select.value, remarks.value);
  });

  const toggle = el("button", "btn btn-outline btn-sm", openDetails[report.ref] ? "Hide details" : "View details");
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", openDetails[report.ref] ? "true" : "false");
  toggle.setAttribute("aria-controls", "details-" + report.ref);
  toggle.addEventListener("click", function () {
    openDetails[report.ref] = !openDetails[report.ref];
    detailRow.hidden = !openDetails[report.ref];
    toggle.textContent = openDetails[report.ref] ? "Hide details" : "View details";
    toggle.setAttribute("aria-expanded", openDetails[report.ref] ? "true" : "false");
  });
  actionCell.append(save, toggle);

  row.append(refCell, foodCell, bbCell, statusCell, remarksCell, actionCell);

  const detailRow = el("tr", "staff-detail-row");
  detailRow.id = "details-" + report.ref;
  detailRow.hidden = !openDetails[report.ref];
  const detailCell = el("td");
  detailCell.colSpan = 6;
  detailCell.appendChild(buildDetails(report));
  detailRow.appendChild(detailCell);

  return [row, detailRow];
}

// ---------- Saving ----------

function saveRow(ref, status, remarksText) {
  const report = getReport(ref);
  if (!report) {
    showSaved("Could not find " + ref + ".");
    return;
  }

  const needsRemark = status === "Requires more info" || status === "Rejected" || status === "Duplicate";
  if (needsRemark && !remarksText.trim()) {
    showSaved("Add a remark for the donor before saving " + status + ", so they know what to do.");
    document.getElementById("remarks-" + ref).focus();
    return;
  }

  let ok;
  if (report.status === status) {
    report.remarks = remarksText.trim(); // only the remarks changed
    ok = saveReport(report);
  } else {
    ok = setStatus(ref, status, remarksText);
  }

  if (!ok) {
    showSaved("Could not save. This browser may be blocking storage.");
    return;
  }

  render();
  const row = rowsBox.querySelector('tr[data-ref="' + ref + '"]');
  if (row) row.classList.add("staff-row-saved");
  showSaved("Saved: " + ref + " is now " + status + ".");
}

// ---------- Search, filter and sort ----------

function visibleReports(reports) {
  const words = searchInput.value.trim().toLowerCase();
  const status = filterSelect.value;

  const list = reports.filter(function (r) {
    if (status && r.status !== status) return false;
    if (!words) return true;
    const text = [r.ref, r.food, r.category, r.donorName, r.barangay, r.pickup].join(" ").toLowerCase();
    return text.indexOf(words) !== -1;
  });

  const sort = sortSelect.value;
  list.sort(function (a, b) {
    if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sort === "expiry") {
      return (a.bestBeforeDate + (a.bestBeforeTime || "")).localeCompare(b.bestBeforeDate + (b.bestBeforeTime || ""));
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  return list;
}

function render() {
  const reports = allReports();
  renderStats(reports);

  const list = visibleReports(reports);
  rowsBox.innerHTML = "";

  if (list.length === 0) {
    const empty = el("tr");
    const cell = el("td", "staff-empty", reports.length ? "No reports match your search." : "No reports yet.");
    cell.colSpan = 6;
    empty.appendChild(cell);
    rowsBox.appendChild(empty);
  }

  list.forEach(function (report) {
    buildRows(report).forEach(function (row) { rowsBox.appendChild(row); });
  });

  countText.textContent = list.length === reports.length
    ? reports.length + (reports.length === 1 ? " report" : " reports")
    : "Showing " + list.length + " of " + reports.length + " reports";
}

// ---------- Reset demo data ----------

document.getElementById("reset-demo").addEventListener("click", function () {
  if (!window.confirm("Reset the demo data? Reports submitted in this browser and all status changes will be removed. Donor accounts are kept.")) {
    return;
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    showSaved("Could not reset. This browser may be blocking storage.");
    return;
  }
  render();
  showSaved("Demo data reset.");
});

// ---------- Start ----------

if (admin) {
  STATUSES.forEach(function (name) {
    const option = el("option", "", name);
    option.value = name;
    filterSelect.appendChild(option);
  });
  searchInput.addEventListener("input", render);
  filterSelect.addEventListener("change", render);
  sortSelect.addEventListener("change", render);
  render();
}

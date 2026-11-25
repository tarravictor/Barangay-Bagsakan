// Barangay Bagsakan: home page numbers and recent reports (home.js)
// Counts the reports saved by reports.js (3 samples + anything submitted in this browser)
// and shows the 3 newest. Only the food, quantity, category and status are shown:
// never a donor's name or phone number. Load reports.js before this file.


function countWithStatus(reports, names) {
  return reports.filter(function (report) {
    return names.indexOf(report.status) !== -1;
  }).length;
}

function showStats(reports) {
  // Submitted: every report.
  // Coordinated: staff accepted it (Verified) or it was already collected (Picked up).
  // Resolved: staff finished with it (Picked up or Rejected).
  document.getElementById("stat-submitted").textContent = reports.length;
  document.getElementById("stat-coordinated").textContent = countWithStatus(reports, ["Verified", "Picked up"]);
  document.getElementById("stat-resolved").textContent = countWithStatus(reports, ["Picked up", "Rejected"]);
}

function showRecent(reports) {
  const list = document.getElementById("recent-list");
  list.innerHTML = "";

  // allReports() is already newest first.
  reports.slice(0, 3).forEach(function (report) {
    const item = document.createElement("li");
    item.className = "listing";

    const name = document.createElement("span");
    name.className = "listing-name";
    name.textContent = report.food;

    const category = document.createElement("span");
    category.className = "listing-category";
    category.textContent = report.category;

    const qty = document.createElement("span");
    qty.className = "listing-qty";
    qty.textContent = report.quantity + " " + report.unit;

    const status = document.createElement("span");
    status.className = "status " + (STATUS_CLASS[report.status] || "");
    status.textContent = report.status;

    item.append(name, category, qty, status);
    list.appendChild(item);
  });

  if (reports.length === 0) {
    const empty = document.createElement("li");
    empty.className = "listing";
    empty.textContent = "No reports yet.";
    list.appendChild(empty);
  }
}

const reports = allReports();
showStats(reports);
showRecent(reports);

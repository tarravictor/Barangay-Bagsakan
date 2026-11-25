// Barangay Bagsakan: a donor's own reports (my-reports.js)
// Load auth.js and reports.js before this file.

const me = requireLogin("donor");

function formatWhen(iso) {
  return new Date(iso).toLocaleString("en-PH", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
  });
}

function showMyReports() {
  const list = document.getElementById("my-list");
  const reports = reportsByOwner(me.email);
  list.innerHTML = "";

  document.getElementById("my-intro").textContent =
    "Hi " + me.name.split(" ")[0] + ". Here is every food report you sent, with its latest status. Open one to see the timeline and staff remarks.";
  document.getElementById("my-count").textContent =
    reports.length + (reports.length === 1 ? " report" : " reports");
  document.getElementById("my-empty").hidden = reports.length > 0;

  reports.forEach(function (report) {
    const item = document.createElement("li");
    item.className = "my-item";

    if (report.photo) {
      const img = document.createElement("img");
      img.className = "my-thumb";
      img.src = report.photo;
      img.alt = "";
      item.appendChild(img);
    }

    const text = document.createElement("div");
    text.className = "my-text";
    const title = document.createElement("a");
    title.className = "my-title";
    title.href = "track.html?ref=" + encodeURIComponent(report.ref);
    title.textContent = report.food + ", " + report.quantity + " " + report.unit;
    const meta = document.createElement("span");
    meta.className = "staff-sub";
    meta.textContent = report.ref + " · Sent " + formatWhen(report.createdAt);
    text.append(title, meta);

    if (report.status === "Requires more info") {
      const note = document.createElement("span");
      note.className = "my-action";
      note.textContent = "Staff need more information. Open the report to reply.";
      text.appendChild(note);
    }

    const status = document.createElement("span");
    status.className = "status " + (STATUS_CLASS[report.status] || "");
    status.textContent = report.status;

    item.append(text, status);
    list.appendChild(item);
  });
}

if (me) showMyReports();

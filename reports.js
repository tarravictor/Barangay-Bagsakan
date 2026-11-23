// Barangay Bagsakan: shared report storage (reports.js)
// Demo only: reports are saved in THIS browser's localStorage, not on a server.
// Load this file before report.js, track.js or staff.js.
//
// Functions other pages can use:
//   getReport(ref)                 -> one report, or null if not found
//   saveReport(report)             -> saves a new or changed report, returns true/false
//   allReports()                   -> every report (samples + saved), newest first
//   setStatus(ref, status, remark) -> changes a report's status and adds it to the history
//   newReference()                 -> a new unused reference like "BB-2026-4821"
//   normalizeRef(text)             -> cleans what a user typed, e.g. "bb-2026-148" -> "BB-2026-0148"
//   STATUSES                       -> the only status words the site uses

const STORAGE_KEY = "bb-reports";

const STATUSES = ["Reported", "Verified", "Picked up", "Requires more info", "Rejected"];

// ---------- Small date helpers ----------

// A date N days from today, as "YYYY-MM-DD" (local time, not UTC).
function dateFromToday(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// A moment N hours ago, as an ISO timestamp.
function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

// ---------- Sample reports ----------
// Built fresh every time the page loads, so their dates always look recent.
// These are the three "Demo reports to try" on the Track page.
function sampleReports() {
  return [
    {
      ref: "BB-2026-0001",
      food: "Tomatoes",
      category: "Fruits and vegetables",
      quantity: 5,
      unit: "kg",
      bestBeforeDate: dateFromToday(2),
      bestBeforeTime: "",
      pickup: "Purok 2, near the chapel",
      status: "Requires more info",
      remarks: "Please upload a clearer photo of the packaging.",
      createdAt: hoursAgo(26),
      history: [
        { status: "Reported", at: hoursAgo(26) },
        { status: "Requires more info", at: hoursAgo(3) }
      ],
      sample: true
    },
    {
      ref: "BB-2026-0148",
      food: "Pandesal",
      category: "Bread and pastries",
      quantity: 40,
      unit: "pieces",
      bestBeforeDate: dateFromToday(0),
      bestBeforeTime: "18:00",
      pickup: "Barangay Hall",
      status: "Verified",
      remarks: "Checked by barangay staff. Volunteers will pick up this afternoon.",
      createdAt: hoursAgo(5),
      history: [
        { status: "Reported", at: hoursAgo(5) },
        { status: "Verified", at: hoursAgo(2) }
      ],
      sample: true
    },
    {
      ref: "BB-2026-0097",
      food: "Chicken adobo",
      category: "Cooked meals",
      quantity: 20,
      unit: "servings",
      bestBeforeDate: dateFromToday(0),
      bestBeforeTime: "20:00",
      pickup: "Covered court, Purok 4",
      status: "Picked up",
      remarks: "Delivered to the community kitchen. Salamat po!",
      createdAt: hoursAgo(30),
      history: [
        { status: "Reported", at: hoursAgo(30) },
        { status: "Verified", at: hoursAgo(28) },
        { status: "Picked up", at: hoursAgo(25) }
      ],
      sample: true
    }
  ];
}

// ---------- Reading and writing localStorage ----------
// localStorage can be blocked (private mode, strict settings), so every
// read and write is wrapped in try/catch and the site keeps working without it.

function readSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && typeof saved === "object" ? saved : {};
  } catch (error) {
    return {};
  }
}

function writeSaved(saved) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    return true;
  } catch (error) {
    return false;
  }
}

// ---------- Public functions ----------

function normalizeRef(text) {
  const cleaned = String(text || "").trim().toUpperCase().replace(/\s+/g, "");
  const match = cleaned.match(/^BB-(\d{4})-(\d{1,4})$/);
  if (!match) return cleaned;
  return "BB-" + match[1] + "-" + match[2].padStart(4, "0");
}

function isValidRefFormat(ref) {
  return /^BB-\d{4}-\d{4}$/.test(ref);
}

function getReport(ref) {
  const key = normalizeRef(ref);
  const saved = readSaved();
  if (saved[key]) return saved[key];

  const sample = sampleReports().find(function (report) {
    return report.ref === key;
  });
  return sample || null;
}

function saveReport(report) {
  const saved = readSaved();
  saved[report.ref] = report;
  return writeSaved(saved);
}

function allReports() {
  const byRef = {};
  sampleReports().forEach(function (report) {
    byRef[report.ref] = report;
  });
  // A saved copy wins over a sample (for example, a sample whose status staff changed).
  const saved = readSaved();
  Object.keys(saved).forEach(function (ref) {
    byRef[ref] = saved[ref];
  });

  return Object.values(byRef).sort(function (a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

function setStatus(ref, status, remarks) {
  if (STATUSES.indexOf(status) === -1) return false;

  const report = getReport(ref);
  if (!report) return false;

  report.status = status;
  if (typeof remarks === "string") report.remarks = remarks.trim();
  report.history = (report.history || []).concat([{ status: status, at: new Date().toISOString() }]);
  return saveReport(report);
}

function newReference() {
  const year = new Date().getFullYear();
  let ref = "";
  // Try until we find a number nobody has used yet.
  for (let tries = 0; tries < 50; tries++) {
    ref = "BB-" + year + "-" + String(Math.floor(Math.random() * 9000) + 1000);
    if (!getReport(ref)) break;
  }
  return ref;
}

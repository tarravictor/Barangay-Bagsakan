// Barangay Bagsakan: accounts, log in and log out (auth.js)
// Load this file on every page, before script.js.
//
// Demo only: there is no server. Donor accounts are saved in THIS browser's
// localStorage, and passwords are never saved as typed. We save a SHA-256 hash
// of the password instead (see hashPassword below).
//
// Two kinds of accounts:
//   donor - anyone who registers on register.html. Donors can report food.
//   admin - one fixed barangay admin account. Admins use the dashboard (staff.html).
//
// Functions other pages can use:
//   currentUser()                -> the logged-in user, or null
//   registerDonor(details)       -> creates an account (returns a Promise)
//   logIn(email, password)       -> checks the password (returns a Promise)
//   logOut()                     -> ends the session
//   requireLogin(role)           -> sends visitors who aren't allowed here to login.html
//   isEmailRegistered(email)     -> true if the email already has an account

const USERS_KEY = "bb-users";
const SESSION_KEY = "bb-session";

// The barangay admin account. Only the hash of the password is stored here,
// so the real password is not visible in the code.
const ADMIN_ACCOUNT = {
  email: "barangaybagsakanadmin01@gmail.com",
  name: "Barangay admin",
  role: "admin",
  passwordHash: "f9adf2452544e31e6c7811cc4bdd3e68d3c1df0b02b5eb591f1efa1334ea3c43"
};

// ---------- Reading and writing localStorage (never crash if it's blocked) ----------

function readJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value === null || value === undefined ? fallback : value;
  } catch (error) {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

function cleanEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// ---------- Password hashing ----------
// SHA-256 of "bb-v1:<email>:<password>". Adding the email (a "salt") means two
// people with the same password still get different hashes.
async function hashPassword(email, password) {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error("This browser can't hash passwords here. Open the site over https (GitHub Pages) or as a local file.");
  }
  const text = "bb-v1:" + cleanEmail(email) + ":" + password;
  const bytes = new TextEncoder().encode(text);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map(function (b) { return b.toString(16).padStart(2, "0"); })
    .join("");
}

// ---------- Accounts ----------

function allDonors() {
  const users = readJSON(USERS_KEY, {});
  return users && typeof users === "object" ? users : {};
}

function isEmailRegistered(email) {
  const key = cleanEmail(email);
  return key === ADMIN_ACCOUNT.email || Boolean(allDonors()[key]);
}

// details: { name, email, phone, organization, password }
async function registerDonor(details) {
  const email = cleanEmail(details.email);
  if (isEmailRegistered(email)) {
    return { ok: false, reason: "taken" };
  }

  const users = allDonors();
  users[email] = {
    name: details.name.trim(),
    email: email,
    phone: details.phone,
    organization: (details.organization || "").trim(),
    role: "donor",
    passwordHash: await hashPassword(email, details.password),
    createdAt: new Date().toISOString()
  };
  if (!writeJSON(USERS_KEY, users)) {
    return { ok: false, reason: "storage" };
  }
  startSession(email, "donor");
  return { ok: true, role: "donor" };
}

async function logIn(email, password) {
  const key = cleanEmail(email);
  const hash = await hashPassword(key, password);

  if (key === ADMIN_ACCOUNT.email) {
    if (hash !== ADMIN_ACCOUNT.passwordHash) return { ok: false };
    startSession(key, "admin");
    return { ok: true, role: "admin" };
  }

  const user = allDonors()[key];
  if (!user || user.passwordHash !== hash) return { ok: false };
  startSession(key, "donor");
  return { ok: true, role: "donor" };
}

// ---------- Session (who is logged in) ----------

function startSession(email, role) {
  writeJSON(SESSION_KEY, { email: email, role: role, at: new Date().toISOString() });
}

function logOut() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    // Nothing to do: storage is blocked, so there is no session either.
  }
}

// Returns { name, email, phone, organization, role } or null.
function currentUser() {
  const session = readJSON(SESSION_KEY, null);
  if (!session || !session.email) return null;

  if (session.role === "admin" && session.email === ADMIN_ACCOUNT.email) {
    return { name: ADMIN_ACCOUNT.name, email: ADMIN_ACCOUNT.email, role: "admin" };
  }

  const user = allDonors()[session.email];
  if (!user) return null; // account was removed: treat as logged out
  return {
    name: user.name,
    email: user.email,
    phone: user.phone,
    organization: user.organization,
    role: "donor"
  };
}

// Use at the top of a page's script. If the visitor isn't allowed here, they go
// to the login page, which brings them back after they log in.
// role: "donor", "admin", or "any" (any logged-in user). Returns the user or null.
function requireLogin(role) {
  const user = currentUser();
  if (user && (role === "any" || user.role === role)) return user;

  const page = window.location.pathname.split("/").pop() || "index.html";
  const params = new URLSearchParams({ next: page + window.location.search, need: role });
  window.location.replace("login.html?" + params.toString());
  return null;
}

// ---------- Navigation bar: show the right buttons ----------
// Logged out: Log in + Register. Donor: My reports + Log out. Admin: Dashboard + Log out.
function updateNavForUser() {
  const box = document.querySelector(".nav-actions");
  if (!box) return;
  const user = currentUser();
  if (!user) return; // the HTML already shows Log in + Register

  box.innerHTML = "";

  const link = document.createElement("a");
  link.className = "btn btn-outline";
  if (user.role === "admin") {
    link.href = "staff.html";
    link.textContent = "Dashboard";
  } else {
    link.href = "my-reports.html";
    link.textContent = "My reports";
  }
  const page = window.location.pathname.split("/").pop();
  if (link.getAttribute("href") === page) link.setAttribute("aria-current", "page");

  const button = document.createElement("button");
  button.type = "button";
  button.className = "btn btn-nav-primary";
  button.textContent = "Log out";
  button.addEventListener("click", function () {
    logOut();
    window.location.href = "index.html";
  });

  const who = document.createElement("span");
  who.className = "nav-user";
  who.textContent = "Hi, " + user.name.split(" ")[0];

  box.append(who, link, button);
}

updateNavForUser();

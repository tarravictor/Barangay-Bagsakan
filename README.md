# Barangay Bagsakan

**Share food, not waste.**

Barangay Bagsakan is a website where residents can report surplus food that is still safe to eat, like leftover pandesal from a bakery or extra servings from an event, so the barangay can collect it and give it to families who need it instead of letting it go to waste. Donors register, report the food with a photo, and get a reference number they can use to follow the report. Barangay staff review every report in an admin dashboard before any food is shared.

We made this as our final project for Web Development (WEBDEVT). It is a front-end project, so there is no server or database. Accounts and reports are saved in the browser using `localStorage`, which is enough to show how the whole system works from start to finish, and the data stays there after a page refresh.

## Key features

**Donor accounts.** Only registered donors can report food, which keeps out spam and fake reports. The register form checks the full name (2 to 100 letters), email format, that the email isn't already registered, the Philippine mobile number format (`09XX XXX XXXX` or `+63 9XX XXX XXXX`), the password (at least 8 characters with a letter and a number) and the privacy agreement. Passwords are never saved as typed: we save a SHA-256 hash instead. After 5 wrong passwords, the login form makes you wait 30 seconds.

**Admin account.** One barangay admin account opens the admin dashboard. Its password is stored in the code only as a SHA-256 hash. Donors can't open the dashboard, and the admin can't submit reports.

**Report form.** The donor's name, email and mobile number are filled in from their account. The form asks for the food name, category (with a short specification when it's "Other"), food condition (Fresh or Near expiry), quantity (1 to 1000) and unit, a description (10 to 500 characters), a **required photo** (JPG, PNG or WEBP, up to 5 MB), the date prepared (not in the future), the best-before date (today or later, and not before the date prepared), the pickup address (10 to 200 characters), barangay, an optional landmark, an optional preferred pickup date and time (not in the past), the privacy agreement and a food-safety confirmation. Each problem shows a message right under its field, a red box at the top lists every field to fix, and anything you already typed stays in the form.

**Spam and duplicate safeguards.** Reporting needs an account. If the same donor reports the same food at the same address with the same best-before date while the first report is still open, the form stops it and shows the first reference number. A donor can send at most 5 reports per hour.

**Reference numbers and tracking.** Each report gets a reference number like `BB-2026-4821`. On the Track page, anyone with the number can see the status, a three-step timeline (**Reported → Verified → Picked up**), the pickup point, the best-before time and staff remarks, but never who reported it. Wrong or unknown numbers show a clear error. The donor who sent the report (and the admin) also see the full details and the photo.

**Admin dashboard (`staff.html`).** Counts of reports by status, search (reference, food, donor or barangay), a status filter, sorting (newest, oldest, best-before soonest), and a details panel for each report with the photo, description, dates, pickup details, the donor's contact details and the status history. Staff change the status and write remarks for the donor. **Requires more info**, **Rejected** and **Duplicate** need a remark so the donor knows what to do. Reports past their best-before date are flagged.

**Replying to staff.** When a report is marked **Requires more info**, the donor logs in, opens the report on the Track page and sends a reply. The report goes back to **Reported** so staff can check it again, and the reply shows in the dashboard.

**My reports.** Donors see all their reports with photos and statuses in one list.

**Static pages.** Home, About, How it works (with the reporting guidelines and what each status means), FAQ (with search), Contact and Privacy policy (Data Privacy Act of 2012, RA 10173).

**Mobile and accessibility.** Every page works at 375 px wide with no sideways scrolling. The menu folds into a hamburger, form fields stack into one column, and the dashboard table turns into one card per report. Every field has a label, errors are announced to screen readers, status tags always show the status word (not only a color), and buttons and fields are at least 40 to 48 px tall.

## Technologies used

- HTML5
- CSS3, with our own stylesheets on top of Bootstrap
- Bootstrap 5.3.3 (loaded from a CDN) for the grid, the mobile menu and the FAQ accordion
- Plain JavaScript for accounts, form validation, saving reports, tracking and the dashboard
- Web Crypto API (`crypto.subtle`) for SHA-256 password hashing
- `localStorage` for keeping accounts and reports in the browser
- Schibsted Grotesk from Google Fonts

We didn't use any frameworks or build tools, so there is nothing to install.

## Installation and setup

Download the project, either by cloning it:

```bash
git clone https://github.com/tarravictor/Barangay-Bagsakan.git
```

or by clicking **Code → Download ZIP** on GitHub and extracting the folder.

You need an internet connection the first time you open a page, since Bootstrap and the font are loaded online.

## How to run the project

Open the live site on GitHub Pages, or open `index.html` in Chrome, Edge or Firefox (double-clicking the file works).

To try the full flow:

1. Click **Register** and create a donor account.
2. Go to **Report**, fill in the form with a photo and submit it. Note the reference number.
3. Click **Track this report**. The status is **Reported**.
4. Log out, then log in with the barangay admin account and open the **Dashboard**. Change the report's status and add a remark.
5. Track the report again. It shows the new status and the remark.

There are also three sample reports you can look up on the Track page:

| Reference number | Food | Status |
| --- | --- | --- |
| `BB-2026-0001` | Tomatoes, 5 kg | Requires more info |
| `BB-2026-0148` | Pandesal, 40 pieces | Verified |
| `BB-2026-0097` | Chicken adobo, 20 servings | Picked up |

The admin login email is `barangaybagsakanadmin01@gmail.com`. Ask the group for the password.

## Project structure

```
Barangay-Bagsakan/
├── index.html         Home page
├── about.html         About the project and the team
├── how-it-works.html  The four steps, status guide and reporting guidelines
├── report.html        Report surplus food (donors only)
├── track.html         Track a report by reference number
├── my-reports.html    A donor's own reports
├── staff.html         Admin dashboard (admin only)
├── login.html         Log in
├── register.html      Register a donor account
├── faq.html           Frequently asked questions
├── contact.html       Contact the barangay
├── privacy.html       Privacy policy
├── style.css          Main stylesheet shared by all pages
├── track.css          Styles for the Track page
├── faq.css            Styles for the FAQ page
├── auth.js            Accounts, password hashing, log in/out, page protection, navbar buttons
├── forms.js           Shared validation helpers and error messages
├── reports.js         Saves and loads reports, sample reports, duplicate check
├── script.js          Shared script for every page (mobile menu, footer year)
├── report.js          Report form rules, photo check and resize, saving
├── track.js           Report lookup, timeline, owner details and replies
├── staff.js           Admin dashboard
├── my-reports.js      My reports list
├── login.js           Log in page
├── register.js        Register page
├── home.js            Home page numbers and recent reports
└── faq.js             FAQ search
```

## Limitations and next steps

- **No server or database.** Accounts and reports live in one browser. A report made on one laptop won't appear on another, and clearing the browser data removes everything. Next step: move accounts and reports to a real database behind a server (for example PHP and MySQL, or Firebase).
- **The login runs in the browser.** It shows how roles and protected pages work, but someone who knows how to use the browser's developer tools could get around it. A real system checks passwords and roles on the server.
- **Photos are shrunk to fit browser storage** (about 100 to 200 KB each), so the browser can hold a few dozen reports with photos. If storage runs out, the dashboard's **Reset demo data** button clears the reports.
- **No email or SMS notifications.** Donors see updates on the Track page and in My reports. Next step: send a message when the status changes.
- **No map pin** for the pickup location yet. The address, barangay and landmark are used instead.

Made by the Times Square group for Web Development (WEBDEVT).

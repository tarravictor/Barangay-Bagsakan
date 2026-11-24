# Barangay Bagsakan

Barangay Bagsakan is a website where residents can report surplus food that is still safe to eat, like leftover pandesal from a bakery or extra servings from an event, so the barangay can collect it and give it to families who need it instead of letting it go to waste. After sending a report, the donor gets a reference number they can use to check its status.

We made this as our final project for Web Development (WEBDEVT). It is a front-end project, so there is no server or database. Reports are saved in the browser using `localStorage`, which is enough to show how the system works from start to finish.

## Key features

**Report form.** Donors fill in what the food is, the category, quantity, condition, a short description, the best-before date and time, the pickup location and barangay, and their contact details. They can also attach an optional photo (JPG, PNG or WEBP, up to 5 MB), which shows a preview before submitting. Every required field is checked before the form goes through. For example, the mobile number has to follow the `09XX XXX XXXX` or `+639XX XXX XXXX` format, the description needs 10 to 500 characters, and the best-before date can't be in the past. If something is wrong, an error message appears right under that field.

**Reference numbers.** When a report is submitted, it gets a reference number like `BB-2026-4821` and is saved in the browser. The success screen has a "Track this report" button that opens it on the Track page.

**Report tracking.** On the Track page, you enter a reference number and see the report's details, current status, pickup location, best-before time and any remarks from barangay staff. A timeline shows the three main steps: **Reported**, **Verified** and **Picked up**. A report can also be marked **Requires more info** or **Rejected**, and in those cases a banner tells the donor what to do next. Wrong or unknown reference numbers show a clear error message.

**Home and FAQ pages.** The home page explains how the process works and links to reporting and tracking. The FAQ page answers common questions about what can be donated, reporting, tracking, pickup and privacy.

The site also works on phones, with a collapsible navigation menu and layouts that stack on smaller screens.

## Technologies used

- HTML5
- CSS3, with our own stylesheets on top of Bootstrap
- Bootstrap 5.3.3 (loaded from a CDN) for the grid and the mobile menu
- Plain JavaScript for form validation, saving reports and the tracking page
- `localStorage` for keeping reports in the browser
- Schibsted Grotesk from Google Fonts

We didn't use any frameworks or build tools, so there is nothing to install.

## Installation and setup

Download the project, either by cloning it:

```bash
git clone https://github.com/tarravictor/Barangay-Bagsakan.git
```

or by clicking **Code → Download ZIP** on GitHub and extracting the folder. That's all the setup there is.

You do need an internet connection the first time you open a page, since Bootstrap and the font are loaded online.

## How to run the project

Open `index.html` in a browser (Chrome, Edge or Firefox). You can just double-click the file. You can also open it with the Live Server extension in VS Code if you prefer, but it isn't required.

To try the main flow:

1. Go to **Report** and fill in the form, then submit it.
2. Copy the reference number on the success screen, or click **Track this report**.
3. The Track page shows the report with the status **Reported**.

There are also three sample reports you can look up on the Track page, each with a different status:

| Reference number | Food | Status |
| --- | --- | --- |
| `BB-2026-0001` | Tomatoes, 5 kg | Requires more info |
| `BB-2026-0148` | Pandesal, 40 pieces | Verified |
| `BB-2026-0097` | Chicken adobo, 20 servings | Picked up |

## Project structure

```
Barangay-Bagsakan/
├── index.html     Home page
├── report.html    Report surplus food form
├── track.html     Track a report by reference number
├── faq.html       Frequently asked questions
├── style.css      Main stylesheet shared by all pages
├── track.css      Styles for the Track page
├── faq.css        Styles for the FAQ page
├── script.js      Shared script for every page (mobile menu, footer year)
├── reports.js     Saves and loads reports, includes the sample reports
├── report.js      Report form validation, photo preview and saving
├── track.js       Looks up a report and shows its status and timeline
└── faq.js         FAQ page script
```

`reports.js` is shared by the Report and Track pages. It has the functions for saving a report, finding one by its reference number and changing its status, so the pages don't each have their own copy of that code.

## Additional notes

Since everything is stored in `localStorage`, reports only exist in the browser where they were made. A report submitted on one laptop won't show up on another, and clearing the browser data removes it. The photo itself isn't saved either, only its file name. If you want to start fresh, open the browser console (F12) and run:

```js
localStorage.removeItem("bb-reports");
```

The three sample reports will still be there after that.

Some parts are still being worked on. The Log in, Register, About and Privacy policy links don't have pages yet, and the search box on the FAQ page doesn't filter the questions yet. There is also no page for barangay staff to update a report's status, so right now a status can only be changed through code.

Made by the Times Square group for Web Development (WEBDEVT).

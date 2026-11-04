// Barangay Bagsakan: home page scripts (script.js)

// 1. Close the mobile (hamburger) menu after a link is tapped,
//    so the open menu doesn't keep covering the page.
const menu = document.getElementById("main-menu");

menu.querySelectorAll("a").forEach(function (link) {
  link.addEventListener("click", function () {
    if (menu.classList.contains("show")) {
      bootstrap.Collapse.getOrCreateInstance(menu).hide();
    }
  });
});

// 2. Keep the hamburger's label in sync for screen readers.
const toggler = document.querySelector(".navbar-toggler");

menu.addEventListener("shown.bs.collapse", function () {
  toggler.setAttribute("aria-label", "Close menu");
});

menu.addEventListener("hidden.bs.collapse", function () {
  toggler.setAttribute("aria-label", "Open menu");
});

// 3. Keep the footer year up to date.
document.getElementById("year").textContent = new Date().getFullYear();

// FAQ search
var searchForm = document.getElementById("faqSearchForm");
var searchInput = document.getElementById("faqSearch");
var faqItems = document.querySelectorAll(".faq-item");
var faqTopics = document.querySelectorAll(".faq-topic");
var noResults = document.getElementById("noResults");

searchForm.addEventListener("submit", function (event) {
    event.preventDefault();
});

searchInput.addEventListener("input", function () {
    var query = searchInput.value.trim().toLowerCase();
    var totalShown = 0;

    faqItems.forEach(function (item) {
        var matches = item.textContent.toLowerCase().indexOf(query) !== -1;
        item.hidden = !matches;
        if (matches) {
            totalShown++;
        }
    });

    // hide a topic heading when none of its questions match
    faqTopics.forEach(function (topic) {
        var visibleItems = topic.querySelectorAll(".faq-item:not([hidden])").length;
        topic.hidden = visibleItems === 0;
    });

    noResults.hidden = totalShown !== 0;
});

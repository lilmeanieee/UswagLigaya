document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('badgesModal');
    const iframe = document.getElementById('badgesIframe');

    // When modal is about to show, load the badges shelf
    modal.addEventListener('show.bs.modal', function () {
        // Add timestamp to prevent caching and ensure fresh load
        const timestamp = new Date().getTime();
        iframe.src = `badges-shelf.html?t=${timestamp}`;
    });

    // When modal is hidden, clear the iframe src to reset it
    modal.addEventListener('hidden.bs.modal', function () {
        iframe.src = '';
    });

    // Optional: Handle iframe load events
    iframe.addEventListener('load', function () {
        console.log('Badges shelf loaded successfully');
    });

    // Add hover effects to badge cards
    const badgeItems = document.querySelectorAll('.badge-img');
    badgeItems.forEach(badge => {
        badge.addEventListener('mouseenter', function () {
            this.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.4)';
        });

        badge.addEventListener('mouseleave', function () {
            this.style.boxShadow = '';
        });
    });
});
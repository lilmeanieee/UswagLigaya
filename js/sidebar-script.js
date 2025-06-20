document.addEventListener('DOMContentLoaded', function () {
    // Only activate popovers if screen is small
    if (window.innerWidth < 990) {
        let popoverTriggerList = [].slice.call(document.querySelectorAll('.mobile-popover'))
        popoverTriggerList.map(function (popoverTriggerEl) {
            return new bootstrap.Popover(popoverTriggerEl)
        })
    }
});

document.addEventListener('DOMContentLoaded', function () {
    if (window.innerWidth < 990) {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }
});
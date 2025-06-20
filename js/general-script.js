window.addEventListener('load', adjustMainContentPadding);
window.addEventListener('resize', adjustMainContentPadding);

function adjustMainContentPadding() {
    var navbar = document.querySelector('.navbar');
    var mainContent = document.querySelector('.main-content');
    if (navbar && mainContent) {
        var navbarHeight = navbar.offsetHeight;
        mainContent.style.paddingTop = (navbarHeight + 30) + 'px'; // add 20px extra space
    }
}


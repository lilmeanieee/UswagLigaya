// Hamburger menu functionality
document.addEventListener('DOMContentLoaded', function () {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const sidebarWrapper = document.getElementById('sidebarWrapper');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const closeSidebar = document.getElementById('closeSidebar');

    function openSidebar() {
        sidebarWrapper.classList.add('show');
        sidebarOverlay.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function closeSidebarFn() {
        sidebarWrapper.classList.remove('show');
        sidebarOverlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    hamburgerMenu.addEventListener('click', openSidebar);
    closeSidebar.addEventListener('click', closeSidebarFn);
    sidebarOverlay.addEventListener('click', closeSidebarFn);

    // Close sidebar when clicking on a navigation link (mobile)
    const navLinks = document.querySelectorAll('.sidebar .nav-link:not(.dropdown-toggle)');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth < 992) {
                closeSidebarFn();
            }
        });
    });

    // Handle window resize
    window.addEventListener('resize', function () {
        if (window.innerWidth >= 992) {
            closeSidebarFn();
        }
    });
});
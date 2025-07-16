document.addEventListener("DOMContentLoaded", function () {
    function checkLoginStatus() {
        const userData = localStorage.getItem('userData');

        const loginButton = document.getElementById('loginButton');
        const notificationIcon = document.getElementById('notificationIcon');
        const userDropdown = document.getElementById('userDropdown');

        if (userData) {
            const user = JSON.parse(userData);

            if (loginButton) loginButton.style.display = 'none';
            if (userDropdown) userDropdown.style.display = 'block';
            if (notificationIcon) notificationBell.style.display = 'block';

            const creditPointsElement = document.getElementById('creditPoints');
            if (creditPointsElement && user.role === "Resident") {
                creditPointsElement.textContent = user.credit_points ?? 0;
            }

            const idElement = document.getElementById('resident_code');
            if (idElement && user.role === "Resident") {
                idElement.textContent = user.resident_code ?? '';
            }

        } else {
            if (loginButton) loginButton.style.display = 'block';
            if (userDropdown) userDropdown.style.display = 'none';
            if (notificationIcon) notificationIcon.style.display = 'none';
        }
    }

    // ✅ Logout button logic
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function () {
            localStorage.removeItem('userData');
            
            // Also clear PHP session via a logout endpoint
            fetch('/UswagLigaya/php-handlers/logout.php')
                .then(() => {
                    window.location.href = 'index.html';
                })
                .catch(() => {
                    // If the fetch fails, still redirect
                    window.location.href = 'index.html';
                });
        });
}

    checkLoginStatus();
});

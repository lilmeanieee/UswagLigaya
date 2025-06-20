// Logout Button
document.addEventListener('DOMContentLoaded', function() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            document.getElementById('dashboardPage').classList.add('d-none');
            document.getElementById('loginPage').classList.remove('d-none');
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
        });
    } else {
        console.error('Logout button not found in the DOM.');
    }
});
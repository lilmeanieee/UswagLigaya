// Sign out functionality with modal confirmation
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent default link behavior
            
            // Show the sign out confirmation modal
            const signoutModal = new bootstrap.Modal(document.getElementById('signoutModal'));
            signoutModal.show();
        });
    }

    // Handle confirm sign out
    const confirmSignoutBtn = document.getElementById('confirmSignoutBtn');
    if (confirmSignoutBtn) {
        confirmSignoutBtn.addEventListener('click', function() {
            // Clear any stored session data (if using localStorage/sessionStorage)
            // localStorage.clear();
            // sessionStorage.clear();
            
            // Redirect to the login page
            window.location.href = 'http://localhost/UswagLigaya/index.html';
        });
    }
});
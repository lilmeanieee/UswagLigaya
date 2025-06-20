document.addEventListener("DOMContentLoaded", function () {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    // Format and display name from localStorage immediately
    if (userData && userData.first_name && userData.last_name) {
        const fullName = `${userData.first_name} ${userData.last_name}`.trim();
        document.getElementById("residentName").textContent = fullName;
        
        // Also update userName in the navbar if it exists
        const userNameElement = document.getElementById("userName");
        if (userNameElement) {
            userNameElement.textContent = fullName;
        }
        
        // Set other user data from localStorage
        document.getElementById("residentCode").textContent = userData.resident_code || '';
        document.getElementById("creditPoints").textContent = parseInt(userData.credit_points || 0);
        document.getElementById("redeemablePoints").textContent = parseInt(userData.redeemable_points || 0);
        document.getElementById("totalParticipated").textContent = parseInt(userData.total_participated || 0);
    }

    // Then fetch fresh data from server
    if (userData && userData.resident_id) {
        fetch('/php-handlers/get-resident-data.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `resident_id=${encodeURIComponent(userData.resident_id)}`
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const r = data.resident;
                
                // Update name in First Name Last Name format if the server returns name parts
                if (r.first_name && r.last_name) {
                    const fullName = `${r.first_name} ${r.last_name}`.trim();
                    document.getElementById('residentName').textContent = fullName;
                    
                    // Also update userName in the navbar if it exists
                    const userNameElement = document.getElementById("userName");
                    if (userNameElement) {
                        userNameElement.textContent = fullName;
                    }
                }
                
                // Update other fields with server data
                document.getElementById('residentCode').textContent = r.resident_code || '';
                document.getElementById('creditPoints').textContent = r.creditPointsFormatted || '0 pts';
                document.getElementById('redeemablePoints').textContent = r.redeemablePointsFormatted || '0 pts';
                document.getElementById('totalParticipated').textContent = r.totalParticipatedFormatted || '0';
            } else {
                console.error(data.error);
            }
        })
        .catch(err => {
            console.error("Error fetching resident data:", err);
        });
    }
});
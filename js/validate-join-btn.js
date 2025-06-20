document.addEventListener("DOMContentLoaded", function () {
    // Check all join buttons
    document.querySelectorAll('.join-button').forEach(button => {
        button.addEventListener('click', function () {
            const userData = localStorage.getItem('userData');
            const volunteerId = this.dataset.volunteerId;

            if (!userData) {
                alert("⚠️ You need to log in first to join this activity.");
                return;
            }

            // Show confirmation popup
            const confirmationDiv = document.createElement("div");
            confirmationDiv.className = "join-confirmation";
            confirmationDiv.innerHTML = `
                <div class="p-3 border rounded bg-light mt-2">
                    <p>Are you sure you want to join this activity?</p>
                    <button class="btn btn-success btn-sm me-2 yes-btn">Yes</button>
                    <button class="btn btn-secondary btn-sm no-btn">No</button>
                </div>
            `;
            this.parentElement.appendChild(confirmationDiv);

            const yesBtn = confirmationDiv.querySelector(".yes-btn");
            const noBtn = confirmationDiv.querySelector(".no-btn");

            yesBtn.addEventListener("click", function () {
                const user = JSON.parse(userData);
                const residentId = user.resident_id;

                fetch('/php-handlers/join-volunteer.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: `resident_id=${encodeURIComponent(residentId)}&volunteer_announcement_id=${encodeURIComponent(volunteerId)}`
                })
                .then(res => res.text())
                .then(response => {
                    console.log("Server response:", response);
                    button.textContent = "Joined";
                    button.disabled = true;
                    confirmationDiv.remove();
                })
                .catch(err => {
                    console.error("Join failed:", err);
                    alert("An error occurred. Please try again.");
                });
            });

            noBtn.addEventListener("click", function () {
                confirmationDiv.remove();
            });
        });
    });
});
document.addEventListener('DOMContentLoaded', function () {
    populateEventDropdown();
    fetchParticipants(); // Load all by default

    document.getElementById('event-filter').addEventListener('change', function () {
        const selectedId = this.value;
        document.getElementById('search-input').value = '';
        fetchParticipants(selectedId); // fetch based on selected event
    });

    document.getElementById('mark-participated').addEventListener('click', () => {
        updateAttendance("Participated");
    });

    document.getElementById('mark-not-participated').addEventListener('click', () => {
        updateAttendance("Did Not Participated");
    });

    document.getElementById('select-all-participants').addEventListener('change', function () {
        document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = this.checked);
    });

    document.getElementById('search-input').addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
    
        document.querySelectorAll('#participants-table tbody tr').forEach(row => {
            const nameCell = row.querySelector('td:nth-child(2)');
            const originalName = nameCell.dataset.original || nameCell.textContent;
    
            // Save original on first run
            if (!nameCell.dataset.original) {
                nameCell.dataset.original = originalName;
            }
    
            const lowerName = originalName.toLowerCase();
    
            if (lowerName.includes(searchTerm)) {
                // Highlight matching text with bold
                const start = lowerName.indexOf(searchTerm);
                const end = start + searchTerm.length;
                const highlighted = originalName.substring(0, start) +
                    `<strong>` +
                    originalName.substring(start, end) +
                    `</strong>` +
                    originalName.substring(end);
    
                nameCell.innerHTML = highlighted;
                row.style.display = '';
            } else {
                // No match
                nameCell.innerHTML = originalName;
                row.style.display = 'none';
            }
        });
    });
});

function makeRowsClickable() {
    document.querySelectorAll("#participants-table tbody tr").forEach(row => {
        row.addEventListener("click", function (e) {
            // Prevent toggling when the actual checkbox is clicked
            if (e.target.tagName.toLowerCase() === 'input') return;

            const checkbox = this.querySelector("input[type='checkbox']");
            if (checkbox) {
                checkbox.checked = !checkbox.checked;
            }
        });
    });
}

function populateEventDropdown() {
    fetch('/UswagLigaya/php-handlers/fetch-upcoming-event.php')
        .then(res => res.json())
        .then(events => {
            const dropdown = document.getElementById('event-filter');
            dropdown.innerHTML = `<option value="all">All Events</option>`;
            events.forEach(event => {
                dropdown.innerHTML += `<option value="${event.volunteer_announcement_id}">${event.volunteer_announcement_title}</option>`;
            });
        });
}

function fetchParticipants(eventId = 'all') {
    fetch(`/UswagLigaya/php-handlers/fetch-volunteer-attendance.php?event_id=${eventId}`)
        .then(res => res.json())
        .then(data => {
            const tbody = document.querySelector("#participants-table tbody");
            tbody.innerHTML = '';

            if (data.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-muted fw-bold">No pending participants to evaluate.</td>
                    </tr>
                `;
                return;
            }

            // Filter out participants who already have attendance marked
            const pendingParticipants = data.filter(item => 
                item.attendance !== 'Participated' && item.attendance !== 'Did Not Participated'
            );

            if (pendingParticipants.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-muted fw-bold">No pending participants to evaluate.</td>
                    </tr>
                `;
                return;
            }

            pendingParticipants.forEach(item => {
                const badgeClass = item.attendance === 'Participated' ? 'bg-success' :
                                  item.attendance === 'Did Not Participated' ? 'bg-danger' :
                                  'bg-warning';

                tbody.innerHTML += `
                    <tr data-resident-id="${item.resident_id}">
                        <td><input type="checkbox" class="row-checkbox" value="${item.participation_id}"></td>
                        <td>${item.name}</td>
                        <td>${item.event_title}</td>
                        <td>${item.event_date}</td>
                        <td>${item.credit_points}</td>
                        <td><span class="badge ${badgeClass}">${item.attendance}</span></td>
                    </tr>`;
            });
            makeRowsClickable();
        });
}
    
function updateAttendance(status) {
    const selectedCheckboxes = Array.from(document.querySelectorAll('.row-checkbox:checked'));

    if (selectedCheckboxes.length === 0) {
        alert("Please select participants.");
        return;
    }

    const participationData = [];

        selectedCheckboxes.forEach(checkbox => {
        const row = checkbox.closest("tr");
        const participationId = checkbox.value;
        const creditPoints = parseInt(row.cells[4].textContent);
        const residentId = row.dataset.residentId;

        participationData.push({
            id: participationId,
            residentId: residentId,
            creditPoints: creditPoints,
            status: status
        });
    });


    fetch('/UswagLigaya/php-handlers/update-volunteer-attendance.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            participation_data: participationData,
            status: status
        })
    })
    .then(res => res.json())
    .then(response => {
        if (response.success) {
            participationData.forEach(item => {
            checkAndAwardBadges(item.residentId);
        });
            // Show success message
            alert("✅ Attendance updated successfully!");
            
            // Remove the selected rows from the table
            selectedCheckboxes.forEach(checkbox => {
                const row = checkbox.closest("tr");
                if (row) {
                    row.remove();
                }
            });
            
            // Uncheck the "Select All" checkbox if it exists
            const selectAllCheckbox = document.getElementById('select-all-participants');
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = false;
            }
            
            // If the table is now empty, show a message
            const tbody = document.querySelector("#participants-table tbody");
            if (tbody.children.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center text-muted fw-bold">No pending participants to evaluate.</td>
                    </tr>
                `;
            }
        } else {
            alert("❌ Failed to update attendance: " + (response.error || "Unknown error"));
        }
    })
    .catch(err => {
        console.error("🔥 Error:", err);
        alert("❌ Error occurred while updating attendance.");
    });
}

function checkAndAwardBadges(residentId) {
    fetch('/UswagLigaya/php-handlers/manage-leaderboard/check-and-award-badges.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `resident_id=${residentId}`
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success' && data.earned.length > 0) {
            data.earned.forEach(badge => {
                showBadgeEarnedPopup(badge); // You must have defined this function
            });
        }
    })
    .catch(err => {
        console.error("Badge check failed", err);
    });
}

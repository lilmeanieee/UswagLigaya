let announcementsFromDB = [];
let joinedEventIds = []; // Track joined event IDs

// Fetch announcements
function fetchAnnouncementsAndJoinedEvents() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const residentId = userData.resident_id;

    // First fetch announcements
    fetch('/php-handlers/get-announcement.php')
        .then(res => res.json())
        .then(data => {
            announcementsFromDB = data;

            // Then fetch joined events if logged in
            if (residentId) {
                return fetch('/php-handlers/get-joined-events.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `resident_id=${encodeURIComponent(residentId)}`
                })
                    .then(res => res.json())
                    .then(joinedEvents => {
                        // Store joined events as strings for easier comparison
                        joinedEventIds = joinedEvents.map(id => String(id));
                        console.log('Joined event IDs:', joinedEventIds);
                        renderAnnouncements(); // Now render with complete data
                    })
                    .catch(err => {
                        console.error('Error fetching joined events:', err);
                        renderAnnouncements(); // Render anyway, even if joined status fetch fails
                    });
            } else {
                renderAnnouncements(); // Not logged in, just render
            }
        })
        .catch(err => {
            console.error('Error fetching announcements:', err);
        });
        
}

// Initialize by fetching all data
fetchAnnouncementsAndJoinedEvents();

function renderAnnouncements(categoryFilter = 'all', searchQuery = '') {
    const newsContainer = document.getElementById('newsUpdatesList');
    const eventsContainer = document.getElementById('upcomingEventsList');
    const volunteerContainer = document.getElementById('volunteerEventsList');

    if (!newsContainer || !eventsContainer || !volunteerContainer) {
        console.error('One or more announcement containers are missing.');
        return;
    }

    // Section containers
        const newsSection = document.getElementById('news-updates');
        const eventsSection = document.getElementById('upcoming-events');
        const volunteerSection = document.getElementById('volunteer-events');

        // Hide/show entire sections based on filter
        if (categoryFilter === 'News and Update') {
            newsSection.style.display = '';
            eventsSection.style.display = 'none';
            volunteerSection.style.display = 'none';
        } else if (categoryFilter === 'Upcoming Event') {
            newsSection.style.display = 'none';
            eventsSection.style.display = '';
            volunteerSection.style.display = 'none';
        } else if (categoryFilter === 'Barangay Volunteer Drive') {
            newsSection.style.display = 'none';
            eventsSection.style.display = 'none';
            volunteerSection.style.display = '';
        } else {
            // Show all if 'all'
            newsSection.style.display = '';
            eventsSection.style.display = '';
            volunteerSection.style.display = '';
        }
        const highlight = (text) => {
            if (!searchQuery) return text;
            const regex = new RegExp(`(${searchQuery})`, 'gi');
            return text.replace(regex, '<strong>$1</strong>');
        };

    // Clear previous content
    newsContainer.innerHTML = '';
    eventsContainer.innerHTML = '';
    volunteerContainer.innerHTML = '';

    // Normalize search
    const query = searchQuery.toLowerCase();

    const filtered = announcementsFromDB.filter(a => {
        const matchesCategory = categoryFilter === 'all' || a.type === categoryFilter;
        const matchesSearch = a.title.toLowerCase().includes(query) || a.details.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        const noDataHTML = '<p class="text-muted">No announcements posted yet.</p>';
        newsContainer.innerHTML = noDataHTML;
        eventsContainer.innerHTML = noDataHTML;
        volunteerContainer.innerHTML = noDataHTML;
        return;
    }

    // Sort announcements based on type/date
    filtered.sort((a, b) => {
        const getDate = (item) => {
            let dateStr = '';
            if (item.type === 'News and Update') dateStr = item.created_at;
            else if (item.type === 'Upcoming Event') dateStr = item.event_date;
            else if (item.type === 'Barangay Volunteer Drive') dateStr = item.date;
            const parsed = new Date(dateStr);
            return isNaN(parsed) ? new Date(8640000000000000) : parsed; // Max future date if invalid
        };
        return getDate(a) - getDate(b);
    });

    // Render all filtered announcements
    filtered.forEach(announcement => {
        switch (announcement.type) {
            case 'News and Update':
                const newsCard = document.createElement('div');
                newsCard.className = 'col-md-4 mb-4';

                const dateHTML = announcement.date ? `<div class="text-muted mb-2">${announcement.date}</div>` : '';

                newsCard.innerHTML = `
                    <div class="card h-100">
                        <div class="card-body">
                            ${dateHTML}
                            <h5 class="card-title">${announcement.title}</h5>
                            <p class="card-text">${announcement.details}</p>
                            ${announcement.time_start && announcement.time_end
                        ? `<small class="text-muted">${announcement.time_start} - ${announcement.time_end}</small>` : ''}
                        </div>
                    </div>
                `;
                newsContainer.appendChild(newsCard);
                break;

            case 'Upcoming Event':
                const eventCard = document.createElement('div');
                eventCard.className = 'col-md-4 mb-4';

                const eventDateHTML = announcement.date ? `<div class="text-muted mb-2">${announcement.date}</div>` : '';

                eventCard.innerHTML = `
                    <div class="card h-100">
                        <div class="card-body">
                            ${eventDateHTML}
                            <h5 class="card-title">${announcement.title}</h5>
                            <p class="card-text">${announcement.details}</p>
                            ${announcement.time_start && announcement.time_end
                        ? `<small class="text-muted">${announcement.time_start} - ${announcement.time_end}</small>` : ''}
                        </div>
                    </div>
                `;
                eventsContainer.appendChild(eventCard);
                break;

            case 'Barangay Volunteer Drive':
                const volunteerCard = document.createElement('div');
                volunteerCard.className = 'col-md-12 mb-4';

                // Filter per type
const newsFiltered = filtered.filter(a => a.type === 'News and Update');
const eventsFiltered = filtered.filter(a => a.type === 'Upcoming Event');
const volunteerFiltered = filtered.filter(a => a.type === 'Barangay Volunteer Drive');

// 📰 News
if (newsFiltered.length > 0) {
    newsSection.style.display = '';
    newsContainer.innerHTML = '';
    newsFiltered.forEach(announcement => {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${highlight(announcement.title)}</h5>
                    <p class="card-text">${highlight(announcement.details)}</p>
                </div>
            </div>
        `;
        newsContainer.appendChild(card);
    });
} else {
    newsSection.style.display = '';
    newsContainer.innerHTML = `<p class="text-muted">No announcements posted yet.</p>`;
}

// 📅 Upcoming
if (eventsFiltered.length > 0) {
    eventsSection.style.display = '';
    eventsContainer.innerHTML = '';
    eventsFiltered.forEach(announcement => {
        const card = document.createElement('div');
        card.className = 'col-md-4 mb-4';
        card.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${highlight(announcement.title)}</h5>
                    <p class="card-text">${highlight(announcement.details)}</p>
                </div>
            </div>
        `;
        eventsContainer.appendChild(card);
    });
} else {
    eventsSection.style.display = '';
    eventsContainer.innerHTML = `<p class="text-muted">No announcements posted yet.</p>`;
}

// 🤝 Volunteer
if (volunteerFiltered.length > 0) {
    volunteerSection.style.display = '';
    volunteerContainer.innerHTML = '';
    volunteerFiltered.forEach(announcement => {
        const volunteerCard = document.createElement('div');
        volunteerCard.className = 'col-md-12 mb-4';
    
        const volunteerId = String(announcement.id);
        const hasJoined = joinedEventIds.includes(volunteerId);
    
        const buttonHTML = hasJoined
            ? `<button class="btn btn-sm btn-secondary" disabled>Joined</button>`
            : `<button class="btn btn-sm btn-outline-primary join-button" data-volunteer-id="${volunteerId}">Join</button>`;
    
        volunteerCard.innerHTML = `
            <div class="card volunteer-card shadow-sm">
                <div class="card-body d-flex justify-content-between align-items-start flex-wrap">
                    <div style="flex: 1 1 auto; min-width: 70%;">
                        <div class="d-flex flex-wrap align-items-center mb-2 volunteer-title-container">
                            <h5 class="card-title mb-0">${highlight(announcement.title)}</h5>
                            <span class="badge bg-success ms-md-2">${formatDate(announcement.date)}</span>
                        </div>
                        <p class="card-text volunteer-details">${highlight(announcement.details)}</p>
                        <p class="mb-1">
                            <small class="text-muted">
                                📅 <strong>Application:</strong> ${formatDate(announcement.application_start)} - ${formatDate(announcement.application_deadline)}
                            </small>
                        </p>
                        <p class="mb-1">
                            <small class="text-muted">
                                ⏰ <strong>Event Time:</strong> ${formatTime(announcement.time_start)} - ${formatTime(announcement.time_end)}
                            </small>
                        </p>
                        <p class="mb-1">
                            <small class="text-muted">🎖️ Credit Points: ${announcement.credit_points}</small>
                        </p>
                    </div>
                </div>
                <div class="volunteer-joins-container px-3 pb-3">
                    <p class="volunteer-remaining-joins text-muted small mb-2">
                        🔁 Remaining Joins This Month: 0
                    </p>
                    <div class="volunteer-button">${buttonHTML}</div>
                </div>
            </div>
        `;
        volunteerContainer.appendChild(volunteerCard);
    });
    
} else {
    volunteerContainer.style.display = '';
    newsContainer.innerHTML = `<p class="text-muted">No announcements posted yet.</p>`;
}


    // Debug logging for volunteer announcement data
    console.log('Volunteer announcement data:', announcement);
    console.log('Volunteer ID from data:', announcement.id);

                // Check if the user has already joined this event
                // Convert both to strings for proper comparison
                const volunteerId = String(announcement.id);
                const hasJoined = joinedEventIds.includes(volunteerId);

                console.log(`Checking if event ${volunteerId} is joined: ${hasJoined}`);

    // Determine button state based on join status
    let buttonHTML;
    if (hasJoined) {
        buttonHTML = `<button class="btn btn-sm btn-secondary" disabled>Joined</button>`;
    } else {
        buttonHTML = `<button class="btn btn-sm btn-outline-primary join-button" data-volunteer-id="${volunteerId}">Join</button>`;
    }

                volunteerCard.innerHTML = `
                <div class="card volunteer-card shadow-sm">
                    <div class="card-body d-flex justify-content-between align-items-start flex-wrap">
                        <div style="flex: 1 1 auto; min-width: 70%;">
                            <div class="d-flex flex-wrap align-items-center mb-2 volunteer-title-container">
                                <h5 class="card-title mb-0">${announcement.title}</h5>
                                <span class="badge bg-success ms-md-2">${formatDate(announcement.date)}</span>
                            </div>


                            <p class="card-text volunteer-details">${announcement.details}</p>
                            <p class="mb-1">
                                <small class="text-muted">
                                    📅 <strong>Application:</strong> ${formatDate(announcement.application_start)} - ${formatDate(announcement.application_deadline)}
                                </small>
                            </p>
                            <p class="mb-1">
                                <small class="text-muted">
                                    ⏰ <strong>Event Time:</strong> ${formatTime(announcement.time_start)} - ${formatTime(announcement.time_end)}
                                </small>
                            </p>
                            <p class="mb-1">
                                <small class="text-muted">🎖️ Credit Points: ${announcement.credit_points}</small>
                            </p>
                        </div>
                    </div>

                    <!-- ✅ Add this new flex container for Remaining Joins + Button -->
                    <div class="volunteer-joins-container px-3 pb-3">
                        <p class="volunteer-remaining-joins text-muted small mb-2">
                            🔁 Remaining Joins This Month: 0
                        </p>
                        <div class="volunteer-button">
                            ${buttonHTML}
                        </div>
                    </div>
                </div>
                `;
                volunteerContainer.appendChild(volunteerCard);
                break;

            default:
                console.warn('Uncategorized announcement:', announcement);
                break;
        }
    });

    // Bind join buttons after DOM is updated
    document.querySelectorAll('.join-button').forEach(btn => {
        btn.addEventListener('click', function () {
            const card = this.closest('.card');
            const volunteerId = this.dataset.volunteerId;

            console.log("Volunteer ID being used:", volunteerId); // Debug log

            // Remove any existing modal
            const existing = document.querySelector('.terms-modal-container');
            if (existing) existing.remove();

            // Insert Terms & Conditions Modal
            const modalHTML = `
                <div class="terms-modal-container position-absolute top-50 start-50 translate-middle bg-white border rounded shadow p-4" style="z-index: 20; width: 100%; max-width: 600px;">
                    <h5 class="mb-3">📋 Terms and Conditions</h5>
                    <div class="terms-content" style="max-height: 300px; overflow-y: auto; font-size: 0.9rem;">
                        <p><strong>📌 Commitment to Participate</strong><br>
                        You are expected to be present and actively participate in the scheduled event.<br>
                        ❌ If you join but fail to attend 3 consecutive events, you will be subject to a deduction of points and may be temporarily restricted from joining future volunteer events.</p>

                        <p><strong>⏱️ Minimum Time Requirement</strong><br>
                        Volunteers must complete the full scheduled event time to be eligible for rewards.<br>
                        Leaving early or partially attending without approval will result in no points awarded for that event.</p>

                        <p><strong>🏅 Point Allocation</strong><br>
                        ✅ After the event is completed and verified by event coordinators.<br>
                        ✅ Based on full attendance and active participation.</p>

                        <p><strong>📆 Monthly Join Limit</strong><br>
                        To ensure equal opportunity among residents, each individual may only join up to 3 volunteer events per month.<br>
                        After confirming, your remaining chances will decrease by 1.</p>

                        <p><strong>🤝 Proper Conduct</strong><br>
                        All volunteers are expected to:<br>
                        - Show respect to coordinators, residents, and fellow volunteers.<br>
                        - Follow all instructions given by the event organizers.<br>
                        - Refrain from any disruptive or inappropriate behavior.</p>
                    </div>

                    <div class="form-check mt-3">
                        <input class="form-check-input" type="checkbox" id="agreeCheckbox">
                        <label class="form-check-label" for="agreeCheckbox">
                            I have read and agree to the terms and conditions above.
                        </label>
                    </div>

                    <div class="d-flex justify-content-end gap-2 mt-3">
                        <button class="btn btn-success btn-sm" id="confirmJoinBtn" disabled>Yes, Join</button>
                        <button class="btn btn-outline-secondary btn-sm" id="cancelJoinBtn">Cancel</button>
                    </div>
                </div>
            `;
            card.insertAdjacentHTML('beforeend', modalHTML);

            // Now safely select the modal elements
            const confirmBtn = card.querySelector('#confirmJoinBtn');
            const cancelBtn = card.querySelector('#cancelJoinBtn');
            const agreeCheckbox = card.querySelector('#agreeCheckbox');

            // Store volunteerId on button
            confirmBtn.dataset.volunteerId = volunteerId;

            // Enable "Yes" only when checkbox is checked
            agreeCheckbox.addEventListener('change', function () {
                confirmBtn.disabled = !this.checked;
            });

            // Cancel button: remove modal
            cancelBtn.addEventListener('click', () => {
                card.querySelector('.terms-modal-container')?.remove();
            });

            // Confirm Join click
            confirmBtn.addEventListener('click', function () {
                // Get user data from localStorage
                const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                const residentId = userData.resident_id;
                const volunteerId = this.dataset.volunteerId;

                console.log("Sending data:", {
                    residentId: residentId,
                    volunteerId: volunteerId
                });

                if (!residentId) {
                    alert('Please log in to join volunteer events.');
                    return;
                }

                fetch('/php-handlers/join-volunteer.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `resident_id=${residentId}&volunteer_announcement_id=${volunteerId}`
                })
                    .then(res => res.json())
                    .then(response => {
                        console.log("Server response:", response); // Debug log

                        if (response.success) {
                            // Add to our tracked joined events
                            joinedEventIds.push(volunteerId);

                            // Update button to show joined
                            const joinButton = this.closest('.card').querySelector('.join-button');
                            joinButton.textContent = 'Joined';
                            joinButton.disabled = true;
                            joinButton.classList.remove('btn-outline-primary');
                            joinButton.classList.add('btn-secondary');
                            joinButton.classList.remove('join-button');

                            // Remove modal
                            card.querySelector('.terms-modal-container')?.remove();

                            // Update remaining joins count
                            fetchJoinCountAndUpdateCards(residentId);
                        } else {
                            alert('❌ ' + (response.error || 'Join failed.'));
                        }
                    })
                    .catch(err => {
                        console.error('❌ Join error:', err);
                        alert('An error occurred. Please try again.');
                    });
            });
        });
    });

    // Update remaining joins count after rendering
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.resident_id) {
        fetchJoinCountAndUpdateCards(userData.resident_id);
    }
}

function fetchJoinCountAndUpdateCards(residentId) {
    fetch('/php-handlers/join-volunteer.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `resident_id=${encodeURIComponent(residentId)}&check_only=true`
    })
        .then(res => res.json())
        .then(data => {
            const used = parseInt(data.joined_this_month || 0);
            const remaining = Math.max(3 - used, 0);

            // Update all volunteer cards
            document.querySelectorAll('.volunteer-remaining-joins').forEach(elem => {
                elem.textContent = `🔁 Remaining Joins This Month: ${remaining}`;

                // Disable join buttons if no remaining joins
                if (remaining === 0) {
                    const card = elem.closest('.card');
                    const joinButton = card?.querySelector('.join-button');
                    if (joinButton) {
                        joinButton.disabled = true;
                        joinButton.classList.remove('btn-outline-primary');
                        joinButton.classList.add('btn-outline-secondary');
                    }
                }
            });
        })
        .catch(err => {
            console.error('Error fetching join count:', err);
        });
}

// Filter by category
document.getElementById('categoryFilter')?.addEventListener('change', function () {
    const selected = this.value;
    const searchQuery = document.getElementById('searchInput')?.value || '';
    renderAnnouncements(selected, searchQuery);
});

// Search announcements
document.getElementById('searchBtn')?.addEventListener('click', function () {
    document.getElementById('searchInput')?.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            const selectedCategory = document.getElementById('categoryFilter')?.value || 'all';
            const searchQuery = this.value || '';
            renderAnnouncements(selectedCategory, searchQuery);
        }
    });
    
    const selectedCategory = document.getElementById('categoryFilter')?.value || 'all';
    const searchQuery = document.getElementById('searchInput')?.value || '';
    renderAnnouncements(selectedCategory, searchQuery);
});

function formatDate(dateString) {
    if (!dateString) return 'N/A';

    try {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (e) {
        console.error('Error formatting date:', e);
        return dateString || 'N/A';
    }
}

function formatTime(timeString) {
    if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) {
        return 'N/A';
    }

    try {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    } catch (e) {
        console.error('Error formatting time:', e);
        return timeString || 'N/A';
    }
}

const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', () => {
        const selectedCategory = document.getElementById('categoryFilter')?.value || 'all';
        const searchQuery = searchInput.value.trim();
        renderAnnouncements(selectedCategory, searchQuery);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips and popovers
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Sample data for leaderboard
    const residents = [
        {
            id: 1,
            name: "John Smith",
            avatar: "/api/placeholder/40/40",
            totalXp: 850,
            rank: 1,
            badges: [
                { name: "Gold Achiever", color: "gold", icon: "trophy" },
                { name: "Community Helper", color: "silver", icon: "heart" },
                { name: "Event Master", color: "bronze", icon: "star" }
            ]
        },
        {
            id: 2,
            name: "Emma Johnson",
            avatar: "/api/placeholder/40/40",
            totalXp: 720,
            rank: 2,
            badges: [
                { name: "Silver Achiever", color: "silver", icon: "award" },
                { name: "Volunteer Star", color: "bronze", icon: "star" }
            ]
        },
        {
            id: 3,
            name: "Michael Brown",
            avatar: "/api/placeholder/40/40",
            totalXp: 690,
            rank: 3,
            badges: [
                { name: "Bronze Achiever", color: "bronze", icon: "trophy" }
            ]
        },
        {
            id: 4,
            name: "Sarah Davis",
            avatar: "/api/placeholder/40/40",
            totalXp: 540,
            rank: 4,
            badges: [
                { name: "Bronze Achiever", color: "bronze", icon: "trophy" }
            ]
        },
        {
            id: 5,
            name: "James Wilson",
            avatar: "/api/placeholder/40/40",
            totalXp: 480,
            rank: 5,
            badges: []
        },
        {
            id: 6,
            name: "Lisa Anderson",
            avatar: "/api/placeholder/40/40",
            totalXp: 350,
            rank: 6,
            badges: []
        },
        {
            id: 7,
            name: "Robert Martinez",
            avatar: "/api/placeholder/40/40",
            totalXp: 320,
            rank: 7,
            badges: []
        }
    ];

    // Sample XP history data
    const xpHistoryData = {
        1: [
            { date: "2025-04-10", activity: "Volunteer Drive", xpEarned: 100, runningTotal: 850 },
            { date: "2025-04-05", activity: "Community Workshop", xpEarned: 75, runningTotal: 750 },
            { date: "2025-03-28", activity: "Sustainability Initiative", xpEarned: 150, runningTotal: 675 },
            { date: "2025-03-15", activity: "Clean-up Drive", xpEarned: 100, runningTotal: 525 },
            { date: "2025-03-01", activity: "Welcome Event", xpEarned: 50, runningTotal: 425 },
            { date: "2025-02-22", activity: "Educational Seminar", xpEarned: 125, runningTotal: 375 },
            { date: "2025-02-10", activity: "Fitness Challenge", xpEarned: 200, runningTotal: 250 },
            { date: "2025-02-01", activity: "Registration Bonus", xpEarned: 50, runningTotal: 50 }
        ],
        2: [
            { date: "2025-04-12", activity: "Cooking Class", xpEarned: 50, runningTotal: 720 },
            { date: "2025-04-02", activity: "Gardening Initiative", xpEarned: 100, runningTotal: 670 },
            { date: "2025-03-20", activity: "Book Club Meeting", xpEarned: 70, runningTotal: 570 },
            { date: "2025-03-05", activity: "Fitness Challenge", xpEarned: 200, runningTotal: 500 },
            { date: "2025-02-15", activity: "Volunteer Drive", xpEarned: 150, runningTotal: 300 },
            { date: "2025-02-01", activity: "Registration Bonus", xpEarned: 150, runningTotal: 150 }
        ]
    };

    // Sample badge definitions
    const badges = {
        xp: [
            {
                id: 1,
                name: "Bronze Achiever",
                description: "Earned 300 XP in community activities",
                icon: "trophy",
                color: "bronze",
                xpRequired: 300,
                recipients: 5
            },
            {
                id: 2,
                name: "Silver Achiever",
                description: "Earned 600 XP in community activities",
                icon: "trophy",
                color: "silver", 
                xpRequired: 600,
                recipients: 3
            },
            {
                id: 3,
                name: "Gold Achiever",
                description: "Earned 800 XP in community activities",
                icon: "trophy",
                color: "gold",
                xpRequired: 800,
                recipients: 1
            },
            {
                id: 4,
                name: "Platinum Achiever",
                description: "Earned 1000 XP in community activities",
                icon: "trophy",
                color: "platinum",
                xpRequired: 1000,
                recipients: 0
            }
        ],
        event: [
            {
                id: 5,
                name: "Community Helper",
                description: "Participated in 3 volunteer drives",
                icon: "heart",
                color: "silver",
                eventType: "volunteer",
                eventCount: 3,
                recipients: 1
            },
            {
                id: 6,
                name: "Workshop Maven",
                description: "Attended 5 community workshops",
                icon: "book",
                color: "gold",
                eventType: "workshop",
                eventCount: 5,
                recipients: 0
            },
            {
                id: 7,
                name: "Event Master",
                description: "Participated in 10 community events",
                icon: "star",
                color: "bronze",
                eventType: "community",
                eventCount: 10,
                recipients: 1
            }
        ]
    };

    // Sample badge recipients data
    const badgeRecipients = {
        1: [
            { residentId: 3, residentName: "Michael Brown", dateEarned: "2025-03-15", currentXp: 690 },
            { residentId: 4, residentName: "Sarah Davis", dateEarned: "2025-03-20", currentXp: 540 },
            { residentId: 5, residentName: "James Wilson", dateEarned: "2025-04-01", currentXp: 480 },
            { residentId: 6, residentName: "Lisa Anderson", dateEarned: "2025-04-05", currentXp: 350 },
            { residentId: 7, residentName: "Robert Martinez", dateEarned: "2025-04-10", currentXp: 320 }
        ],
        2: [
            { residentId: 2, residentName: "Emma Johnson", dateEarned: "2025-03-10", currentXp: 720 },
            { residentId: 3, residentName: "Michael Brown", dateEarned: "2025-04-05", currentXp: 690 },
            { residentId: 4, residentName: "Sarah Davis", dateEarned: "2025-04-12", currentXp: 540 }
        ],
        3: [
            { residentId: 1, residentName: "John Smith", dateEarned: "2025-04-10", currentXp: 850 }
        ],
        5: [
            { residentId: 1, residentName: "John Smith", dateEarned: "2025-03-28", currentXp: 850 }
        ],
        7: [
            { residentId: 1, residentName: "John Smith", dateEarned: "2025-04-05", currentXp: 850 }
        ]
    };

    // Populate leaderboard table
    function populateLeaderboard(residentData) {
        const leaderboardBody = document.getElementById('leaderboardBody');
        leaderboardBody.innerHTML = ''; // Clear existing content

        residentData.forEach(resident => {
            const row = document.createElement('tr');
            row.className = 'resident-row';
            row.setAttribute('data-resident-id', resident.id);

            // Determine special ranking styling
            let rankClass = '';
            if (resident.rank === 1) rankClass = 'rank-1';
            else if (resident.rank === 2) rankClass = 'rank-2';
            else if (resident.rank === 3) rankClass = 'rank-3';

            // Create HTML for badges
            let badgesHtml = '';
            resident.badges.forEach(badge => {
                badgesHtml += `
                    <span class="resident-badge badge-${badge.color}" 
                          data-bs-toggle="tooltip" 
                          title="${badge.name}">
                        <i class="bi bi-${badge.icon}"></i>
                    </span>
                `;
            });

            if (badgesHtml === '') {
                badgesHtml = '<span class="text-muted">None yet</span>';
            }

            // Create row HTML
            row.innerHTML = `
                <td class="${rankClass}">#${resident.rank}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="resident-avatar me-2">
                            <img src="${resident.avatar}" alt="${resident.name}" class="img-fluid">
                        </div>
                        <span>${resident.name}</span>
                    </div>
                </td>
                <td>${resident.totalXp} XP</td>
                <td>${badgesHtml}</td>
                <td>
                    <button class="action-btn view-btn view-history-btn" 
                            data-resident-id="${resident.id}" 
                            data-bs-toggle="tooltip" 
                            title="View XP History">
                        <i class="bi bi-clock-history"></i>
                    </button>
                    <button class="action-btn remove-btn remove-resident-btn" 
                            data-resident-id="${resident.id}" 
                            data-bs-toggle="tooltip" 
                            title="Remove from Leaderboard">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;

            leaderboardBody.appendChild(row);
        });

        // Reinitialize tooltips
        const tooltips = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltips.map(tooltipTriggerEl => {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        // Add event listeners to action buttons
        document.querySelectorAll('.view-history-btn').forEach(button => {
            button.addEventListener('click', function() {
                const residentId = parseInt(this.getAttribute('data-resident-id'));
                openXpHistoryModal(residentId);
            });
        });

        document.querySelectorAll('.remove-resident-btn').forEach(button => {
            button.addEventListener('click', function() {
                const residentId = parseInt(this.getAttribute('data-resident-id'));
                if (confirm('Are you sure you want to remove this resident from the leaderboard?')) {
                    removeResidentFromLeaderboard(residentId);
                }
            });
        });
    }

    // Function to open XP history modal
    function openXpHistoryModal(residentId) {
        const resident = residents.find(r => r.id === residentId);
        if (!resident) return;

        // Set resident info in modal
        document.getElementById('residentName').textContent = resident.name;
        document.getElementById('residentTotalXp').textContent = resident.totalXp;
        document.getElementById('residentRank').textContent = '#' + resident.rank;
        document.getElementById('residentAvatar').src = resident.avatar;

        // Populate XP history table
        const historyTableBody = document.getElementById('xpHistoryTableBody');
        historyTableBody.innerHTML = ''; // Clear existing content

        if (xpHistoryData[residentId]) {
            xpHistoryData[residentId].forEach(entry => {
                const row = document.createElement('tr');
                
                // Format date
                const date = new Date(entry.date);
                const formattedDate = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
                
                row.innerHTML = `
                    <td>${formattedDate}</td>
                    <td>${entry.activity}</td>
                    <td>+${entry.xpEarned}</td>
                    <td>${entry.runningTotal}</td>
                `;
                historyTableBody.appendChild(row);
            });
        } else {
            historyTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center">No XP history available for this resident.</td>
                </tr>
            `;
        }

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('residentXpHistoryModal'));
        modal.show();
    }

    // Function to remove resident from leaderboard
    function removeResidentFromLeaderboard(residentId) {
        // In a real application, this would make an API call
        // For now, we'll just remove from our local array and refresh the display
        const index = residents.findIndex(r => r.id === residentId);
        if (index !== -1) {
            residents.splice(index, 1);
            
            // Recompute ranks
            residents.sort((a, b) => b.totalXp - a.totalXp);
            residents.forEach((resident, idx) => {
                resident.rank = idx + 1;
            });
            
            // Refresh the leaderboard
            populateLeaderboard(residents);
        }
    }

    // Populate badges in the Achievements tab
    function populateBadges() {
        const xpBadgesContainer = document.getElementById('xpBadgesContainer');
        const eventBadgesContainer = document.getElementById('eventBadgesContainer');
        
        xpBadgesContainer.innerHTML = ''; // Clear existing content
        eventBadgesContainer.innerHTML = ''; // Clear existing content

        // Populate XP milestone badges
        badges.xp.forEach(badge => {
            const badgeCard = createBadgeCard(badge);
            xpBadgesContainer.appendChild(badgeCard);
        });

        // Populate event-based badges
        badges.event.forEach(badge => {
            const badgeCard = createBadgeCard(badge);
            eventBadgesContainer.appendChild(badgeCard);
        });
    }

    // Create a badge card element
    function createBadgeCard(badge) {
        const cardCol = document.createElement('div');
        cardCol.className = 'col-md-4';
        
        cardCol.innerHTML = `
            <div class="card badge-card h-100 shadow-sm">
                <div class="card-body text-center">
                    <div class="badge-icon badge-${badge.color} mx-auto">
                        <i class="bi bi-${badge.icon}"></i>
                    </div>
                    <h5 class="card-title">${badge.name}</h5>
                    <p class="card-text text-muted small">${badge.description}</p>
                    <div class="badge-requirements small">
                        ${badge.xpRequired ? `<div><strong>XP Required:</strong> ${badge.xpRequired}</div>` : ''}
                        ${badge.eventCount ? `<div><strong>Events Required:</strong> ${badge.eventCount} ${badge.eventType}</div>` : ''}
                    </div>
                    <div class="badge-recipients mt-3">
                        <span class="badge rounded-pill bg-light text-dark border">
                            <i class="bi bi-people-fill me-1"></i> ${badge.recipients} Recipients
                        </span>
                    </div>
                </div>
                <div class="card-footer bg-transparent border-top-0">
                    <div class="btn-group w-100" role="group">
                        <button type="button" class="btn btn-sm btn-primary view-recipients-btn" data-badge-id="${badge.id}">
                            <i class="bi bi-eye me-1"></i> View Recipients
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary edit-badge-btn" data-badge-id="${badge.id}">
                            <i class="bi bi-pencil me-1"></i> Edit
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger delete-badge-btn" data-badge-id="${badge.id}">
                            <i class="bi bi-trash me-1"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        cardCol.querySelector('.view-recipients-btn').addEventListener('click', function() {
            const badgeId = parseInt(this.getAttribute('data-badge-id'));
            openBadgeRecipientsModal(badgeId);
        });

        cardCol.querySelector('.edit-badge-btn').addEventListener('click', function() {
            const badgeId = parseInt(this.getAttribute('data-badge-id'));
            editBadge(badgeId);
        });

        cardCol.querySelector('.delete-badge-btn').addEventListener('click', function() {
            const badgeId = parseInt(this.getAttribute('data-badge-id'));
            if (confirm('Are you sure you want to delete this badge?')) {
                deleteBadge(badgeId);
            }
        });

        return cardCol;
    }

    // Function to open badge recipients modal
    function openBadgeRecipientsModal(badgeId) {
        // Find the badge
        let badge;
        for (const category in badges) {
            const found = badges[category].find(b => b.id === badgeId);
            if (found) {
                badge = found;
                break;
            }
        }
        
        if (!badge) return;

        // Set badge info in modal
        document.getElementById('modalBadgeName').textContent = badge.name;
        document.getElementById('modalBadgeDescription').textContent = badge.description;
        document.getElementById('modalBadgeIcon').className = `badge-icon badge-${badge.color} me-3`;
        document.getElementById('modalBadgeIcon').innerHTML = `<i class="bi bi-${badge.icon} fs-1"></i>`;

        // Populate recipients table
        const recipientsTableBody = document.getElementById('badgeRecipientsTableBody');
        recipientsTableBody.innerHTML = ''; // Clear existing content

        if (badgeRecipients[badgeId] && badgeRecipients[badgeId].length > 0) {
            badgeRecipients[badgeId].forEach(recipient => {
                const row = document.createElement('tr');
                
                // Format date
                const date = new Date(recipient.dateEarned);
                const formattedDate = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
                
                row.innerHTML = `
                    <td>${recipient.residentName}</td>
                    <td>${formattedDate}</td>
                    <td>${recipient.currentXp} XP</td>
                `;
                recipientsTableBody.appendChild(row);
            });
        } else {
            recipientsTableBody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center">No residents have earned this badge yet.</td>
                </tr>
            `;
        }

        // Show the modal
        const modal = new bootstrap.Modal(document.getElementById('viewBadgeRecipientsModal'));
        modal.show();
    }

    // Function to edit a badge
    function editBadge(badgeId) {
        // In a real application, this would open a form to edit the badge
        // For now, we'll just console log
        console.log('Editing badge:', badgeId);
        alert('Edit badge functionality would be implemented here.');
    }

    // Function to delete a badge
    function deleteBadge(badgeId) {
        // In a real application, this would make an API call
        // For now, we'll remove from our local arrays and refresh the display
        for (const category in badges) {
            const index = badges[category].findIndex(b => b.id === badgeId);
            if (index !== -1) {
                badges[category].splice(index, 1);
                // Refresh badges display
                populateBadges();
                break;
            }
        }
    }

    // Handle form submission for adding a new badge
    document.getElementById('saveBadgeBtn').addEventListener('click', function() {
        // In a real application, this would make an API call
        // For now, we'll just add to our local arrays and refresh the display
        
        const badgeName = document.getElementById('badgeName').value;
        const badgeDescription = document.getElementById('badgeDescription').value;
        const badgeIcon = document.getElementById('badgeIcon').value;
        const badgeType = document.getElementById('badgeType').value;
        const badgeColor = document.getElementById('badgeColor').value;
        
        let newBadge = {
            id: Math.max(...[...badges.xp, ...badges.event].map(b => b.id)) + 1,
            name: badgeName,
            description: badgeDescription,
            icon: badgeIcon,
            color: badgeColor === 'custom' ? document.getElementById('customColor').value : badgeColor,
            recipients: 0
        };
        
        if (badgeType === 'xp') {
            newBadge.xpRequired = parseInt(document.getElementById('xpRequired').value);
            badges.xp.push(newBadge);
        } else {
            newBadge.eventType = document.getElementById('eventType').value;
            newBadge.eventCount = parseInt(document.getElementById('eventCount').value);
            badges.event.push(newBadge);
        }
        
        // Refresh badges display
        populateBadges();
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addBadgeModal'));
        modal.hide();
        
        // Reset form
        document.getElementById('badgeForm').reset();
    });

    // Reset leaderboard button event
    document.getElementById('confirmResetBtn').addEventListener('click', function() {
        // In a real application, this would make an API call
        alert('Leaderboard reset functionality would be implemented here.');
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('resetLeaderboardModal'));
        modal.hide();
    });

    // Dynamic form handling for adding new badge
    document.getElementById('badgeType').addEventListener('change', function() {
        const badgeType = this.value;
        document.getElementById('xpMilestoneFields').style.display = badgeType === 'xp' ? 'block' : 'none';
        document.getElementById('eventBasedFields').style.display = badgeType === 'event' ? 'block' : 'none';
    });

    document.getElementById('badgeColor').addEventListener('change', function() {
        const badgeColor = this.value;
        document.getElementById('customColorContainer').style.display = badgeColor === 'custom' ? 'block' : 'none';
    });

    document.getElementById('resetReason').addEventListener('change', function() {
        const resetReason = this.value;
        document.getElementById('otherReasonContainer').style.display = resetReason === 'other' ? 'block' : 'none';
    });

    // Search and filter functionality
    document.getElementById('applyFilters').addEventListener('click', function() {
        const nameSearch = document.getElementById('nameSearch').value.toLowerCase();
        const sortOption = document.getElementById('sortOption').value;
        const timeFilter = document.getElementById('timeFilter').value;
        
        // Clone the residents array to avoid modifying the original
        let filteredResidents = [...residents];
        
        // Filter by name
        if (nameSearch) {
            filteredResidents = filteredResidents.filter(resident => 
                resident.name.toLowerCase().includes(nameSearch)
            );
        }
        
        // In a real application, timeFilter would filter based on actual date ranges
        // For this demo, we'll just keep the existing data regardless of time filter
        
        // Sort based on selected option
        switch (sortOption) {
            case 'name':
                filteredResidents.sort((a, b) => a.name.localeCompare(b.name));
                // Update ranks after sorting
                filteredResidents.forEach((resident, idx) => {
                    resident.rank = idx + 1;
                });
                break;
            case 'points':
                filteredResidents.sort((a, b) => b.totalXp - a.totalXp);
                // Update ranks after sorting
                filteredResidents.forEach((resident, idx) => {
                    resident.rank = idx + 1;
                });
                break;
            case 'pointsAsc':
                filteredResidents.sort((a, b) => a.totalXp - b.totalXp);
                // Update ranks after sorting
                filteredResidents.forEach((resident, idx) => {
                    resident.rank = idx + 1;
                });
                break;
            case 'rank':
                // Default is already sorted by rank
                filteredResidents.sort((a, b) => a.rank - b.rank);
                break;
        }
        
        // Update leaderboard with filtered results
        populateLeaderboard(filteredResidents);
    });

    // Initial population of data
    populateLeaderboard(residents);
    populateBadges();
});
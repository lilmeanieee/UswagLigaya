document.addEventListener("DOMContentLoaded", function () {
    fetchLeaderboard();

    // Event listener for "Apply Filters"
    document.getElementById("applyFilters").addEventListener("click", fetchLeaderboard);
    
    // Real-time search functionality
    document.getElementById("nameSearch").addEventListener("input", debounce(fetchLeaderboard, 300));
    
    // Auto-apply filters when dropdowns change
    document.getElementById("sortOption").addEventListener("change", fetchLeaderboard);
    document.getElementById("timeFilter").addEventListener("change", fetchLeaderboard);
});

// Debounce function to limit API calls during typing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Keep track of initialized components for cleanup
let currentTooltips = [];
let currentEventListeners = [];

function fetchLeaderboard() {
    // Show loading state
    const leaderboardBody = document.getElementById("leaderboardBody");
    leaderboardBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';

    fetch("/UswagLigaya/php-handlers/get-leaderboard-data.php") 
        .then((response) => response.json())
        .then((data) => {
            // Clean up before re-rendering
            cleanupComponents();

            leaderboardBody.innerHTML = "";

            // Get filter values
            const nameSearch = document.getElementById("nameSearch").value.toLowerCase().trim();
            const sortOption = document.getElementById("sortOption").value;
            const timeFilter = document.getElementById("timeFilter").value;

            // Apply filters
            let filteredData = applyFilters(data, nameSearch, timeFilter);
            
            // Apply sorting
            filteredData = applySorting(filteredData, sortOption);

            // Check if no results
            if (filteredData.length === 0) {
                leaderboardBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No residents found matching your criteria.</td></tr>';
                return;
            }

            // Populate table
            filteredData.forEach((resident, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="ms-2">
                                <div>${escapeHtml(resident.full_name)}</div>
                                ${resident.email ? `<small class="text-muted">${escapeHtml(resident.email)}</small>` : ''}
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge bg-primary fs-6">${resident.credit_points} pts</span>
                        ${getPointsChangeIndicator(resident)}
                    </td>
                    <td>
                        <div class="btn-group" role="group">
                            <button class="action-btn view-btn view-history-btn rounded-circle"
                                data-resident-id="${resident.resident_id}" 
                                title="View XP History">
                                <i class="bi bi-clock-history"></i>
                            </button>
                            <button class="action-btn remove-btn remove-resident-btn rounded-circle"
                                data-resident-id="${resident.resident_id}" 
                                title="Remove from Leaderboard">
                                <i class="bi bi-trash"></i>
                            </button>
                            <button class="action-btn badge-btn rounded-circle"
                                data-resident-id="${resident.resident_id}" 
                                data-resident-name="${escapeHtml(resident.full_name)}"
                                title="Assign Manual Badge">
                                <i class="bi bi-award"></i>
                            </button>
                        </div>
                    </td>
                `;
                leaderboardBody.appendChild(row);
            });

            // Initialize tooltips and bind events
            initializeTooltips();
            bindLeaderboardEvents();
            
            // Update results counter
            updateResultsCounter(filteredData.length, data.length);
        })
        .catch((error) => {
            console.error("Error fetching leaderboard:", error);
            leaderboardBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading leaderboard data. Please try again.</td></tr>';
            showNotification("Error loading leaderboard data", "error");
        });
}

function applyFilters(data, nameSearch, timeFilter) {
    let filteredData = data.filter((resident) => resident.credit_points > 1);

    // Apply name search filter
    if (nameSearch) {
        filteredData = filteredData.filter((resident) =>
            resident.full_name.toLowerCase().includes(nameSearch) ||
            (resident.email && resident.email.toLowerCase().includes(nameSearch))
        );
    }

    // Apply time filter
    if (timeFilter !== 'all') {
        filteredData = applyTimeFilter(filteredData, timeFilter);
    }

    return filteredData;
}

function applyTimeFilter(data, timeFilter) {
    const now = new Date();
    const currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return data.filter(resident => {
        // If there's no last_activity date, exclude from time-based filters
        if (!resident.last_activity) {
            return timeFilter === 'all';
        }

        const activityDate = new Date(resident.last_activity);
        const activityDateOnly = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());

        switch (timeFilter) {
            case 'weekly':
                const weekStart = new Date(currentDate);
                weekStart.setDate(currentDate.getDate() - currentDate.getDay()); // Start of current week (Sunday)
                return activityDateOnly >= weekStart;

            case 'monthly':
                const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                return activityDateOnly >= monthStart;

            case 'quarterly':
                const currentQuarter = Math.floor(currentDate.getMonth() / 3);
                const quarterStart = new Date(currentDate.getFullYear(), currentQuarter * 3, 1);
                return activityDateOnly >= quarterStart;

            default:
                return true;
        }
    });
}

function applySorting(data, sortOption) {
    const sortedData = [...data]; // Create a copy to avoid mutating original array

    switch (sortOption) {
        case "name":
            return sortedData.sort((a, b) => a.full_name.localeCompare(b.full_name));
        
        case "points":
            return sortedData.sort((a, b) => b.credit_points - a.credit_points);
        
        case "pointsAsc":
            return sortedData.sort((a, b) => a.credit_points - b.credit_points);
        
        case "recent":
            return sortedData.sort((a, b) => {
                const dateA = a.last_activity ? new Date(a.last_activity) : new Date(0);
                const dateB = b.last_activity ? new Date(b.last_activity) : new Date(0);
                return dateB - dateA;
            });
        
        case "rank":
        default:
            return sortedData.sort((a, b) => b.credit_points - a.credit_points);
    }
}

function getPointsChangeIndicator(resident) {
    // This would require additional data from your backend about point changes
    // For now, returning empty string, but you can implement this based on your needs
    if (resident.points_change) {
        const changeClass = resident.points_change > 0 ? 'text-success' : 'text-danger';
        const changeIcon = resident.points_change > 0 ? 'bi-arrow-up' : 'bi-arrow-down';
        return `<small class="${changeClass}"><i class="bi ${changeIcon}"></i> ${Math.abs(resident.points_change)}</small>`;
    }
    return '';
}

function updateResultsCounter(filteredCount, totalCount) {
    // Add or update results counter
    let counterElement = document.getElementById('resultsCounter');
    if (!counterElement) {
        counterElement = document.createElement('div');
        counterElement.id = 'resultsCounter';
        counterElement.className = 'text-muted small mb-2';
        
        const tableContainer = document.querySelector('.table-responsive');
        tableContainer.parentNode.insertBefore(counterElement, tableContainer);
    }
    
    if (filteredCount === totalCount) {
        counterElement.textContent = `Showing ${filteredCount} residents`;
    } else {
        counterElement.textContent = `Showing ${filteredCount} of ${totalCount} residents`;
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function cleanupComponents() {
    // Dispose of existing tooltips
    currentTooltips.forEach(tooltip => {
        if (tooltip && typeof tooltip.dispose === 'function') {
            tooltip.dispose();
        }
    });
    currentTooltips = [];

    // Remove event listeners (if we were tracking them)
    currentEventListeners = [];
}

function initializeTooltips() {
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
        const tooltipTriggerList = document.querySelectorAll('#leaderboardBody [title]');
        tooltipTriggerList.forEach(el => {
            // Check if tooltip already exists
            const existingTooltip = bootstrap.Tooltip.getInstance(el);
            if (existingTooltip) {
                existingTooltip.dispose();
            }
            
            // Create new tooltip and track it
            const tooltip = new bootstrap.Tooltip(el);
            currentTooltips.push(tooltip);
        });
    }
}

function bindLeaderboardEvents() {
    // Badge assignment buttons
    document.querySelectorAll("#leaderboardBody .badge-btn").forEach((button) => {
        const handler = function (e) {
            e.preventDefault();
            const residentId = this.getAttribute("data-resident-id");
            const residentName = this.getAttribute("data-resident-name");
            assignManualBadge(residentId, residentName);
        };
        
        button.addEventListener("click", handler);
        currentEventListeners.push({ element: button, event: 'click', handler });
    });

    // View history buttons
    document.querySelectorAll("#leaderboardBody .view-history-btn").forEach((button) => {
        const handler = function (e) {
            e.preventDefault();
            const residentId = this.getAttribute("data-resident-id");
            viewResidentHistory(residentId);
        };
        
        button.addEventListener("click", handler);
        currentEventListeners.push({ element: button, event: 'click', handler });
    });

    // Remove resident buttons
    document.querySelectorAll("#leaderboardBody .remove-resident-btn").forEach((button) => {
        const handler = function (e) {
            e.preventDefault();
            const residentId = this.getAttribute("data-resident-id");
            removeFromLeaderboard(residentId);
        };
        
        button.addEventListener("click", handler);
        currentEventListeners.push({ element: button, event: 'click', handler });
    });
}

// Clear filters function
function clearAllFilters() {
    document.getElementById("nameSearch").value = '';
    document.getElementById("sortOption").value = 'rank';
    document.getElementById("timeFilter").value = 'all';
    fetchLeaderboard();
}

// Add clear filters button functionality
document.addEventListener("DOMContentLoaded", function() {
    // Add clear filters button if it doesn't exist
    const filtersRow = document.querySelector('.filters-row');
    if (filtersRow && !document.getElementById('clearFilters')) {
        const clearButton = document.createElement('div');
        clearButton.className = 'col-md-12 mt-2';
        clearButton.innerHTML = '<button class="btn btn-outline-secondary btn-sm" id="clearFilters">Clear All Filters</button>';
        filtersRow.appendChild(clearButton);
        
        document.getElementById('clearFilters').addEventListener('click', clearAllFilters);
    }
});

// Integration with badge assignment system
function assignManualBadge(residentId, residentName = null) {
    if (window.badgeAssignment && typeof window.badgeAssignment.openDropdown === 'function') {
        window.badgeAssignment.openDropdown(residentId, residentName);
    } else {
        if (typeof BadgeAssignment !== 'undefined') {
            if (!window.badgeAssignment) {
                window.badgeAssignment = new BadgeAssignment();
            }
            window.badgeAssignment.openDropdown(residentId, residentName);
        } else {
            console.error('Badge assignment system not available. Make sure badge-assignment.js is loaded.');
            showNotification("Badge assignment system not available. Please refresh the page.", "error");
        }
    }
}

// Placeholder functions for other actions
function viewResidentHistory(residentId) {
    console.log(`View history for resident ID: ${residentId}`);
    showNotification("History viewing feature coming soon", "info");
}

function removeFromLeaderboard(residentId) {
    if (confirm("Are you sure you want to remove this resident from the leaderboard?")) {
        fetch("/UswagLigaya/php-handlers/manage-leaderboard/remove-resident.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ resident_id: residentId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification("Resident removed from leaderboard", "success");
                fetchLeaderboard();
            } else {
                showNotification(data.message || "Failed to remove resident", "error");
            }
        })
        .catch(error => {
            console.error("Error removing resident:", error);
            showNotification("Error removing resident from leaderboard", "error");
        });
    }
}

// Utility function for notifications
function showNotification(message, type = "info") {
    if (typeof Swal !== 'undefined') {
        const iconMap = {
            success: 'success',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };
        
        Swal.fire({
            icon: iconMap[type] || 'info',
            title: message,
            showConfirmButton: false,
            timer: 3000,
            toast: true,
            position: 'top-end'
        });
    } else {
        alert(message);
    }
}

// Function to refresh leaderboard (can be called from badge assignment)
function refreshLeaderboard() {
    fetchLeaderboard();
}

// Make refresh function globally available for badge assignment callback
window.refreshLeaderboard = refreshLeaderboard;

// Cleanup when page is about to unload
window.addEventListener('beforeunload', cleanupComponents);
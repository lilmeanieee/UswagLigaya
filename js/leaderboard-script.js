// Leaderboard refresh functionality

document.addEventListener('DOMContentLoaded', function() {
    // Initial load of leaderboard data
    refreshLeaderboard();
    
    // Set up automatic refresh
    // Update every 30 seconds for real-time changes
    setInterval(refreshLeaderboard, 30000);
});

// Fetch the latest leaderboard data and update the UI
function refreshLeaderboard() {
    console.log('Attempting to fetch leaderboard data...');
    fetch('/php-handlers/get-leaderboard-data.php')
        .then(response => {
            console.log('Response received:', response);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Data received:', data);
            updateLeaderboardUI(data);
        })
        .catch(error => {
            console.error('Error fetching leaderboard data:', error);
        });
}

// Format a resident's full name including middle name when available
function formatFullName(resident) {
    if (resident.full_name) {
        return resident.full_name; // Use pre-formatted full name if available
    }
    
    let fullName = resident.first_name || '';
    
    // Add middle name if available (not empty and not null)
    if (resident.middle_name && resident.middle_name.trim() !== '') {
        fullName += ' ' + resident.middle_name;
    }
    
    // Add last name if available
    if (resident.last_name && resident.last_name.trim() !== '') {
        fullName += ' ' + resident.last_name;
    }
    
    return fullName.trim();
}

// Update the leaderboard UI with new data
function updateLeaderboardUI(leaderboard) {
    if (!leaderboard || !Array.isArray(leaderboard)) {
        console.log('No valid leaderboard data available');
        return;
    }
    
    // Reset podium positions (all empty by default)
    resetPodium();
    
    // Update leaderboard list
    const listContainer = document.querySelector('.list-container');
    listContainer.innerHTML = ''; // Clear current list
    
    // Only update positions that actually have data
    leaderboard.forEach((entry, index) => {
        // If this is one of the top 3, update podium
        if (index < 3) {
            updatePodiumPosition(index, entry);
        }
        
        // Add to the list regardless of rank
        addToLeaderboardList(listContainer, entry, index);
    });
    
    // Log refresh time for debugging
    console.log('Leaderboard refreshed at:', new Date().toLocaleTimeString());
}

// Reset podium to empty/default state
function resetPodium() {
    // First place (center)
    document.querySelector('.podium-place:nth-child(2) .podium-points').textContent = "";
    document.querySelector('.podium-place:nth-child(2) .podium-name-container').textContent = "";
    
    // Second place (left)
    document.querySelector('.podium-place:nth-child(1) .podium-points').textContent = "";
    document.querySelector('.podium-place:nth-child(1) .podium-name-container').textContent = "";
    
    // Third place (right)
    document.querySelector('.podium-place:nth-child(3) .podium-points').textContent = "";
    document.querySelector('.podium-place:nth-child(3) .podium-name-container').textContent = "";
}

// Update a specific podium position
function updatePodiumPosition(position, data) {
    if (!data) return;
    
    let selector;
    
    // Map the array index to the correct podium position
    switch (position) {
        case 0: // First place (center in the podium)
            selector = '.podium-place:nth-child(2)';
            break;
        case 1: // Second place (left in the podium)
            selector = '.podium-place:nth-child(1)';
            break;
        case 2: // Third place (right in the podium)
            selector = '.podium-place:nth-child(3)';
            break;
        default:
            return; // Not a podium position
    }
    
    // Update the points and full name
    document.querySelector(`${selector} .podium-points`).textContent = data.credit_points;
    document.querySelector(`${selector} .podium-name-container`).textContent = formatFullName(data);
}

// Add an entry to the leaderboard list
function addToLeaderboardList(container, entry, index) {
    const row = document.createElement('div');
    row.className = 'list-row';
    
    // Create rank container
    const rankContainer = document.createElement('div');
    const rankElement = document.createElement('div');
    
    if (index < 3) {
        const medalClass = index === 0 ? 'gold-medal' : (index === 1 ? 'silver-medal' : 'bronze-medal');
        rankElement.className = `medal ${medalClass}`;
    } else {
        rankElement.className = 'rank-number';
    }
    
    rankElement.textContent = index + 1;
    rankContainer.appendChild(rankElement);
    
    // Create name element with full name including middle name
    const nameElement = document.createElement('div');
    nameElement.textContent = formatFullName(entry);
    
    // Create points element
    const pointsElement = document.createElement('div');
    pointsElement.className = 'text-end';
    pointsElement.textContent = entry.credit_points;
    
    // Add all elements to row
    row.appendChild(rankContainer);
    row.appendChild(nameElement);
    row.appendChild(pointsElement);
    
    // Add row to container
    container.appendChild(row);
}
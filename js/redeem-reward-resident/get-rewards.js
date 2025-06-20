let currentTab = 'available';
let userPoints = 120; // This would come from your user session/database

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    loadRewards();
}

function getImagePath(imageUrl) {
    return imageUrl ? `../../uploads/rewards/${imageUrl}` : null;
}

function createRewardCard(reward) {
    const canRedeem = userPoints >= reward.points_required;
    const imagePath = getImagePath(reward.image_url);
    
    return `
        <div class="reward-card">
            <div class="points-badge">${reward.points_required}</div>
            
            <div class="reward-image">
                ${imagePath ? 
                    `<img src="${imagePath}" alt="${reward.reward_name}" onerror="this.parentElement.innerHTML='🎁'">` : 
                    '🎁'
                }
            </div>
            
            <div class="reward-content">
                <div class="reward-title">${reward.reward_name}</div>
                <div class="reward-type">${reward.reward_type}</div>
                <div class="reward-description">${reward.description}</div>
                
                ${canRedeem ? 
                    `<button class="redeem-btn" onclick="redeemReward(${reward.reward_id})">
                        🎁 Redeem Reward
                    </button>` :
                    `<button class="redeem-btn need-more-points" disabled>
                        🔒 Need ${reward.points_required - userPoints} More Points
                    </button>`
                }
            </div>
        </div>
    `;
}

function loadRewards() {
    const container = document.getElementById('rewards-container');
    container.innerHTML = '<div class="loading">Loading rewards...</div>';
    
    // Updated fetch URL to use the correct path
    fetch(`/php-handlers/redeem-rewards-residents/get-reward.php?tab=${currentTab}`)
        .then(response => {
            // Check if response is ok
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Check content type
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return response.text().then(text => {
                    throw new Error(`Expected JSON but got: ${text.substring(0, 100)}...`);
                });
            }
            
            return response.json();
        })
        .then(data => {
            if (data.success) {
                if (data.rewards.length === 0) {
                    container.innerHTML = `<div class="loading">No ${currentTab} rewards found.</div>`;
                    return;
                }
                
                container.innerHTML = data.rewards.map(reward => createRewardCard(reward)).join('');
            } else {
                container.innerHTML = `<div class="error">Error loading rewards: ${data.message}</div>`;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            container.innerHTML = `<div class="error">Failed to load rewards: ${error.message}</div>`;
        });
}

function redeemReward(rewardId) {
    if (confirm('Are you sure you want to redeem this reward?')) {
        // Updated fetch URL to use the correct path
        fetch('../php-handlers/redeem-rewards-residents/redeem-reward.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                reward_id: rewardId,
                user_id: getUserId()
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                return response.text().then(text => {
                    throw new Error(`Expected JSON but got: ${text.substring(0, 100)}...`);
                });
            }
            
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert(`Reward "${data.reward_name}" redeemed successfully! Points used: ${data.points_used}`);
                // Update user points
                userPoints = data.new_points_balance;
                // Update points display if you have one
                updatePointsDisplay();
                // Reload rewards to update the display
                loadRewards();
            } else {
                alert('Error redeeming reward: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to redeem reward: ' + error.message);
        });
    }
}

function getUserId() {
    // Implement this function to get the current user ID
    // This could be from a session variable, local storage, or an API call
    return 1; // Placeholder - replace with actual implementation
}

function updatePointsDisplay() {
    // Update points display in the UI if you have a points counter
    const pointsDisplay = document.getElementById('user-points');
    if (pointsDisplay) {
        pointsDisplay.textContent = userPoints;
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadRewards();
});
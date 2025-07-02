let currentTab = 'available';
let userCreditPoints = 0;
let userRedeemablePoints = 0;

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    loadRewards();
}

function getImagePath(imageUrl) {
    return imageUrl ? `/UswagLigaya/uploads/rewards/${imageUrl}` : null;
}

function createRewardCard(reward) {
    const canRedeem = userRedeemablePoints >= reward.points_required;
    const imagePath = getImagePath(reward.image_url);
    
    if (currentTab === 'redeemed') {
        // Show redeemed rewards with equipment controls
        return `
            <div class="reward-card redeemed-card" data-reward-id="${reward.reward_id}">
                <div class="points-badge redeemed-badge">Redeemed</div>
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
                    <div class="equipment-status">
                        ${reward.is_equipped ? 
                            '<span class="badge bg-success mb-2">Currently Equipped</span>' : 
                            '<span class="badge bg-secondary mb-2">Not Equipped</span>'
                        }
                    </div>
                    ${(reward.reward_type === 'frame' || reward.reward_type === 'title') ? 
                        `<button class="redeem-btn ${reward.is_equipped ? 'unequip-btn' : 'equip-btn'}" 
                                onclick="toggleEquipment(${reward.reward_id}, '${reward.reward_type}', ${reward.is_equipped})">
                            ${reward.is_equipped ? '❌ Unequip' : '✅ Equip'}
                        </button>` :
                        '<span class="text-muted">Trophies are always equipped</span>'
                    }
                </div>
            </div>
        `;
    } else {
        // Show available rewards
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
                            🔒 Need ${reward.points_required - userRedeemablePoints} More Points
                        </button>`
                    }
                </div>
            </div>
        `;
    }
}

function loadUserPoints() {
    return fetch(`/UswagLigaya/php-handlers/redeem-rewards-residents/get-resident-point.php`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
                userCreditPoints = parseInt(data.credit_points) || 0;
                userRedeemablePoints = parseInt(data.redeemable_points) || 0;
                updatePointsDisplay();
            } else {
                console.error('Error loading user points:', data.message);
                
                // Handle session-related errors
                if (data.message.includes('resident_id is required')) {
                    console.error('Session issue detected:', data.debug);
                    // Redirect to login or show login prompt
                    alert('Your session has expired. Please log in again.');
                    // window.location.href = '/login.php';
                }
                
                userCreditPoints = 0;
                userRedeemablePoints = 0;
                updatePointsDisplay();
            }
        })
        .catch(error => {
            console.error('Error fetching user points:', error);
            userCreditPoints = 0;
            userRedeemablePoints = 0;
            updatePointsDisplay();
        });
}

function loadRewards() {
    const container = document.getElementById('rewards-container');
    container.innerHTML = '<div class="loading">Loading rewards...</div>';

    loadUserPoints().then(() => {
        fetch(`/UswagLigaya/php-handlers/redeem-rewards-residents/get-reward.php?tab=${currentTab}`)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
                    container.innerHTML = data.rewards.length === 0
                        ? `<div class="loading">No ${currentTab} rewards found.</div>`
                        : data.rewards.map(reward => createRewardCard(reward)).join('');
                } else {
                    container.innerHTML = `<div class="error">Error loading rewards: ${data.message}</div>`;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                container.innerHTML = `<div class="error">Failed to load rewards: ${error.message}</div>`;
            });
    });
}

function redeemReward(rewardId) {
    if (confirm('Are you sure you want to redeem this reward?')) {
        // Disable the button immediately to prevent double-clicking
        const button = document.querySelector(`[onclick="redeemReward(${rewardId})"]`);
        if (button) {
            button.disabled = true;
            button.textContent = 'Processing...';
        }
        
        fetch('/UswagLigaya/php-handlers/redeem-rewards-residents/redeem-reward.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reward_id: rewardId
            })
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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
                // Check if modal confirmation is needed
                if (data.needs_confirmation) {
                    showEquipmentConfirmationModal(data);
                } else {
                    // Show success message
                    let message = `Reward "${data.reward_name}" redeemed successfully!\nPoints used: ${data.points_used}`;
                    if (data.auto_equipped) {
                        message += `\n${data.reward_type} is now equipped!`;
                    }
                    alert(message);
                    
                    // Update points display
                    userRedeemablePoints = data.new_redeemable_points;
                    updatePointsDisplay();
                    
                    // Update UI
                    updateRewardUI(rewardId, button, true);
                    
                    // If auto-equipped, update equipped rewards display
                    if (data.auto_equipped) {
                        updateEquippedRewards();
                    }
                }
            } else {
                // Show error message
                alert('Error redeeming reward: ' + data.message);
                
                // Re-enable button on error
                if (button) {
                    button.disabled = false;
                    button.textContent = '🎁 Redeem Reward';
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to redeem reward: ' + error.message);
            
            // Re-enable button on error
            if (button) {
                button.disabled = false;
                button.textContent = '🎁 Redeem Reward';
            }
        });
    }
}

function showEquipmentConfirmationModal(data) {
    // Create modal HTML
    const modalHTML = `
        <div class="modal fade" id="equipmentConfirmationModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Equipment Confirmation</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <p>You already have a <strong>${data.current_equipped.reward_type}</strong> equipped:</p>
                        <p class="text-info"><strong>"${data.current_equipped.reward_name}"</strong></p>
                        <p>Do you want to equip the new <strong>${data.new_reward.reward_type}</strong>:</p>
                        <p class="text-success"><strong>"${data.new_reward.reward_name}"</strong></p>
                        <p class="text-muted">This will replace your currently equipped ${data.current_equipped.reward_type}.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Keep Current</button>
                        <button type="button" class="btn btn-primary" onclick="confirmEquipReward(${data.new_reward.reward_id})">Equip New</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('equipmentConfirmationModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('equipmentConfirmationModal'));
    modal.show();
}

function confirmEquipReward(rewardId) {
    // Close the modal first
    const modal = bootstrap.Modal.getInstance(document.getElementById('equipmentConfirmationModal'));
    if (modal) {
        modal.hide();
    }
    
    // Call equip reward API
    fetch('/UswagLigaya/php-handlers/redeem-rewards-residents/equip-reward.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            reward_id: rewardId
        })
    })
    .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert(`${data.reward_type} "${data.reward_name}" equipped successfully!`);
            
            // Update equipped rewards display
            updateEquippedRewards();
            
            // If we're on the redeemed tab, refresh the rewards
            if (currentTab === 'redeemed') {
                loadRewards();
            }
        } else {
            alert('Error equipping reward: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Failed to equip reward: ' + error.message);
    });
}

function toggleEquipment(rewardId, rewardType, isCurrentlyEquipped) {
    const action = isCurrentlyEquipped ? 'unequip' : 'equip';
    const confirmMessage = isCurrentlyEquipped 
        ? `Are you sure you want to unequip this ${rewardType}?`
        : `Are you sure you want to equip this ${rewardType}?`;
    
    if (confirm(confirmMessage)) {
        // Disable the button immediately
        const button = document.querySelector(`[onclick="toggleEquipment(${rewardId}, '${rewardType}', ${isCurrentlyEquipped})"]`);
        if (button) {
            button.disabled = true;
            button.textContent = 'Processing...';
        }
        
        fetch('/UswagLigaya/php-handlers/redeem-rewards-residents/equip-reward.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reward_id: rewardId
            })
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert(`${data.reward_type} "${data.reward_name}" ${data.action} successfully!`);
                
                // Update equipped rewards display
                updateEquippedRewards();
                
                // Refresh the redeemed rewards view
                loadRewards();
            } else {
                alert('Error changing equipment: ' + data.message);
                
                // Re-enable button on error
                if (button) {
                    button.disabled = false;
                    button.textContent = isCurrentlyEquipped ? '❌ Unequip' : '✅ Equip';
                }
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to change equipment: ' + error.message);
            
            // Re-enable button on error
            if (button) {
                button.disabled = false;
                button.textContent = isCurrentlyEquipped ? '❌ Unequip' : '✅ Equip';
            }
        });
    }
}

function updatePointsDisplay() {
    // Update points display elements if they exist
    const creditPointsElement = document.getElementById('credit-points');
    const redeemablePointsElement = document.getElementById('redeemable-points');
    
    if (creditPointsElement) {
        creditPointsElement.textContent = userCreditPoints.toLocaleString();
    }
    
    if (redeemablePointsElement) {
        redeemablePointsElement.textContent = userRedeemablePoints.toLocaleString();
    }
}

function updateRewardUI(rewardId, button, isRedeemed) {
    if (isRedeemed) {
        // Update the reward card to show as redeemed
        const rewardCard = document.querySelector(`[data-reward-id="${rewardId}"]`);
        if (rewardCard) {
            // Change the card styling or remove it from available rewards
            if (currentTab === 'available') {
                rewardCard.style.opacity = '0.5';
                rewardCard.style.pointerEvents = 'none';
                
                // Update button text
                if (button) {
                    button.textContent = '✅ Redeemed';
                    button.disabled = true;
                    button.classList.add('redeemed');
                }
            }
        }
    }
}

function updateEquippedRewards() {
    // Fetch updated equipped rewards
    fetch('/UswagLigaya/php-handlers/redeem-rewards-residents/get-equipped-rewards.php')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Update UI elements based on equipped rewards
                updateProfileDisplay(data.equipped_rewards);
            }
        })
        .catch(error => {
            console.error('Error fetching equipped rewards:', error);
        });
}

function updateProfileDisplay(equippedRewards) {
    // Update profile frame
    const profileFrame = document.getElementById('profile-frame');
    if (profileFrame) {
        if (equippedRewards.frame) {
            profileFrame.style.backgroundImage = `url(/UswagLigaya/uploads/rewards/${equippedRewards.frame.image_url})`;
            profileFrame.classList.add('has-frame');
        } else {
            profileFrame.style.backgroundImage = 'none';
            profileFrame.classList.remove('has-frame');
        }
    }
    
    // Update profile title
    const profileTitle = document.getElementById('profile-title');
    if (profileTitle) {
        if (equippedRewards.title) {
            profileTitle.textContent = equippedRewards.title.reward_name;
            profileTitle.style.display = 'block';
        } else {
            profileTitle.textContent = '';
            profileTitle.style.display = 'none';
        }
    }
    
    // Update trophies display
    const trophiesContainer = document.getElementById('trophies-container');
    if (trophiesContainer) {
        trophiesContainer.innerHTML = '';
        
        if (equippedRewards.trophies && equippedRewards.trophies.length > 0) {
            equippedRewards.trophies.forEach(trophy => {
                const trophyElement = document.createElement('div');
                trophyElement.className = 'trophy-item';
                trophyElement.innerHTML = `
                    <img src="/UswagLigaya/uploads/rewards/${trophy.image_url}" 
                         alt="${trophy.reward_name}" 
                         title="${trophy.reward_name}"
                         onerror="this.src='/UswagLigaya/assets/images/default-trophy.png'">
                `;
                trophiesContainer.appendChild(trophyElement);
            });
        }
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadRewards();
    
    // Set up tab event listeners if not already set
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.dataset.tab || this.textContent.toLowerCase());
        });
    });
});

// Utility function to handle errors gracefully
function handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    // Show user-friendly error message
    const errorMessage = error.message || 'An unexpected error occurred';
    
    // You can customize this based on your UI framework
    if (typeof showToast === 'function') {
        showToast('Error: ' + errorMessage, 'error');
    } else {
        alert('Error: ' + errorMessage);
    }
}

// Export functions if using modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        switchTab,
        loadRewards,
        redeemReward,
        toggleEquipment,
        updateEquippedRewards
    };
}
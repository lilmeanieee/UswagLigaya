let currentTab = 'goods';
let userCreditPoints = 0;
let userRedeemablePoints = 0;
let currentResident = null;
let redeemedRewards = new Set(); // Track redeemed reward IDs

// Updated reward type mapping to match your database values
const rewardTypeMap = {
    'goods': ['Goods'], 
    'eventTicket': ['Event Ticket'], 
    'priorityStab': ['Priority Stab'], 
    'redeemed': 'all'
};

function switchTab(tab) {
    currentTab = tab;
    
    // Remove active classes from all tabs
    document.querySelectorAll('.tab-pane').forEach(t => t.classList.remove('active', 'show'));
    document.querySelectorAll('.nav-link').forEach(t => t.classList.remove('active'));
    
    // Find and activate the correct tab button
    const tabButton = document.querySelector(`[data-bs-target="#${tab}-tab-pane"]`);
    if (tabButton) {
        tabButton.classList.add('active');
    }
    
    // Show the correct tab pane
    const tabPane = document.getElementById(`${tab}-tab-pane`);
    if (tabPane) {
        tabPane.classList.add('active', 'show');
    }
    
    loadRewards();
}

function getImagePath(imageUrl) {
    return imageUrl ? `/UswagLigaya/uploads/rewards/${imageUrl}` : null;
}

// Load redeemed rewards for current user
function loadRedeemedRewards() {
    return fetch('/UswagLigaya/php-handlers/redeem-rewards-residents/get-reward.php?tab=redeemed')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                redeemedRewards.clear();
                data.rewards.forEach(reward => {
                    redeemedRewards.add(reward.reward_id);
                });
            }
            return data;
        })
        .catch(error => {
            console.error('Error loading redeemed rewards:', error);
            return { success: false, rewards: [] };
        });
}

function createRewardCard(reward) {
    const canRedeem = userRedeemablePoints >= reward.points_required;
    const imagePath = getImagePath(reward.image_url);
    const isRedeemed = redeemedRewards.has(reward.reward_id);
    
    if (currentTab === 'redeemed') {
        // Show redeemed rewards
        return `
            <div class="reward-col">
                <div class="reward-card redeemed-card" data-reward-id="${reward.reward_id}">
                    <div class="points-badge redeemed-badge">✅ Redeemed</div>
                    <div class="reward-image">
                        ${imagePath ? 
                            `<img src="${imagePath}" alt="${reward.reward_name}" onerror="this.parentElement.innerHTML='<div class=\\"text-center p-3\\" style=\\"font-size: 3rem;\\">🎁</div>'">` : 
                            '<div class="text-center p-3" style="font-size: 3rem;">🎁</div>'
                        }
                    </div>
                    <div class="reward-content">
                        <h5 class="reward-title">${reward.reward_name}</h5>
                        <span class="badge bg-secondary mb-2 align-self-start">${reward.reward_type}</span>
                        <p class="reward-description">${reward.description}</p>
                        <div class="mt-auto">
                            <small class="text-muted d-block mb-2">Redeemed: ${new Date(reward.redeemed_at).toLocaleDateString()}</small>
                            <button class="btn btn-outline-primary btn-sm w-100" onclick="downloadReceipt(${reward.reward_id})">
                                📄 Download Receipt
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Show available rewards
        let buttonHTML = '';
        
        if (isRedeemed) {
            // Already redeemed - show permanent redeemed state
            buttonHTML = `
                <button class="btn btn-secondary w-100" disabled>
                    ✅ Redeemed
                </button>
            `;
        } else if (canRedeem) {
            // Can redeem
            buttonHTML = `
                <button class="btn btn-success w-100" onclick="redeemReward(${reward.reward_id}, this)">
                    🎁 Redeem Reward
                </button>
            `;
        } else {
            // Cannot redeem - insufficient points
            buttonHTML = `
                <button class="btn btn-outline-secondary w-100" disabled>
                    🔒 Need ${reward.points_required - userRedeemablePoints} More Points
                </button>
            `;
        }
        
        return `
            <div class="reward-col">
                <div class="reward-card ${isRedeemed ? 'opacity-75' : ''}" data-reward-id="${reward.reward_id}">
                    <div class="points-badge ${isRedeemed ? 'redeemed-badge' : ''}">${isRedeemed ? '✅ Redeemed' : reward.points_required}</div>
                    <div class="reward-image">
                        ${imagePath ? 
                            `<img src="${imagePath}" alt="${reward.reward_name}" onerror="this.parentElement.innerHTML='<div class=\\"text-center p-3\\" style=\\"font-size: 3rem;\\">🎁</div>'">` : 
                            '<div class="text-center p-3" style="font-size: 3rem;">🎁</div>'
                        }
                    </div>
                    <div class="reward-content">
                        <h5 class="reward-title">${reward.reward_name}</h5>
                        <span class="badge bg-info mb-2 align-self-start">${reward.reward_type}</span>
                        <p class="reward-description">${reward.description}</p>
                        <div class="mt-auto">
                            ${buttonHTML}
                        </div>
                    </div>
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
                
                if (data.message.includes('resident_id is required')) {
                    console.error('Session issue detected:', data.debug);
                    alert('Your session has expired. Please log in again.');
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
    let container;
    
    if (currentTab === 'goods') {
        container = document.getElementById('rewards-container');
    } else {
        // For other tabs, find the container within the tab pane
        const tabPane = document.getElementById(`${currentTab}-tab-pane`);
        if (tabPane) {
            container = tabPane.querySelector('.rewards-container');
            if (!container) {
                // Create container if it doesn't exist
                container = document.createElement('div');
                container.className = 'rewards-container mt-3';
                tabPane.innerHTML = '';
                tabPane.appendChild(container);
            }
        }
    }
    
     if (!container) {
        console.error('Container not found for tab:', currentTab);
        return;
    }
    
    // Show loading state
     container.innerHTML = '<div class="loading"><div class="spinner-border text-primary me-2" role="status"></div>Loading rewards...</div>';

    // Load user points and redeemed rewards first
    Promise.all([loadUserPoints(), loadRedeemedRewards()]).then(() => {
        const rewardTypes = rewardTypeMap[currentTab];
        let url = `/UswagLigaya/php-handlers/redeem-rewards-residents/get-reward.php?tab=${currentTab}`;
        
        if (currentTab !== 'redeemed' && rewardTypes && rewardTypes !== 'all') {
            url += `&types=${rewardTypes.join(',')}`;
        }
        
        console.log('Fetching rewards from:', url);
        
        fetch(url)
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
                console.log('Received data:', data);
                
                if (data.success) {
                    if (data.rewards.length === 0) {
                        const tabName = currentTab.charAt(0).toUpperCase() + currentTab.slice(1);
                        container.innerHTML = `
                            <div class="empty-state">
                                <div class="empty-icon">📦</div>
                                <h5 class="text-muted">No ${tabName.replace(/([A-Z])/g, ' $1').trim()} Found</h5>
                                <p class="text-muted">Check back later for new rewards!</p>
                            </div>
                        `;
                    } else {
                        // Create proper grid structure
                        const rewardCards = data.rewards.map(reward => createRewardCard(reward)).join('');
                        container.innerHTML = `<div class="rewards-row">${rewardCards}</div>`;
                    }
                } else {
                    container.innerHTML = `
                        <div class="error">
                            <strong>Error loading rewards:</strong> ${data.message}
                        </div>
                    `;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                container.innerHTML = `
                    <div class="error">
                        <strong>Failed to load rewards:</strong> ${error.message}
                    </div>
                `;
            });
    });
}

function redeemReward(rewardId, buttonElement) {
    // Check if already redeemed
    if (redeemedRewards.has(rewardId)) {
        alert('This reward has already been redeemed.');
        return;
    }
    
    if (confirm('Are you sure you want to redeem this reward?')) {
        // Store original button content
        const originalText = buttonElement.innerHTML;
        const originalClass = buttonElement.className;
        
        // Set processing state
        buttonElement.disabled = true;
        buttonElement.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Processing...';
        buttonElement.className = 'btn btn-warning w-100';
        
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
                // Success - update button to permanent redeemed state
                buttonElement.innerHTML = '✅ Redeemed';
                buttonElement.className = 'btn btn-secondary w-100';
                buttonElement.disabled = true;
                buttonElement.onclick = null; // Remove click handler
                
                // Add to redeemed set
                redeemedRewards.add(rewardId);
                
                // Show success message
                alert(`Reward "${data.reward_name}" redeemed successfully!\nPoints used: ${data.points_used}`);
                
                // Update points display
                userRedeemablePoints = data.new_redeemable_points;
                updatePointsDisplay();
                
                // Generate and download receipt
                generateReceipt(data);
                
                // Update the card to show redeemed state
                const rewardCard = buttonElement.closest('.reward-card');
                if (rewardCard) {
                    rewardCard.classList.add('opacity-75');
                    const pointsBadge = rewardCard.querySelector('.points-badge');
                    if (pointsBadge) {
                        pointsBadge.textContent = '✅ Redeemed';
                        pointsBadge.classList.add('redeemed-badge');
                    }
                }
                
            } else {
                // Error - reset button to original state
                buttonElement.innerHTML = originalText;
                buttonElement.className = originalClass;
                buttonElement.disabled = false;
                
                alert('Error redeeming reward: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Error - reset button to original state
            buttonElement.innerHTML = originalText;
            buttonElement.className = originalClass;
            buttonElement.disabled = false;
            
            alert('Failed to redeem reward: ' + error.message);
        });
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Set up Bootstrap tab switching
    const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabButtons.forEach(button => {
        button.addEventListener('shown.bs.tab', function(e) {
            const target = e.target.getAttribute('data-bs-target');
            if (target) {
                const tabName = target.replace('#', '').replace('-tab-pane', '');
                currentTab = tabName;
                console.log('Switching to tab:', tabName);
                loadRewards();
            }
        });
    });
    
    // Load initial rewards for the goods tab
    loadRewards();
});

function generateReceipt(rewardData) {
    const receiptNumber = 'RCP-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const currentDate = new Date().toLocaleString();
    
    // Get resident data from localStorage or session
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const residentName = userData.name || userData.first_name + ' ' + userData.last_name || 'Unknown Resident';
    
    const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reward Redemption Receipt</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background: white;
                }
                .header {
                    text-align: center;
                    border-bottom: 2px solid #333;
                    padding-bottom: 20px;
                    margin-bottom: 20px;
                }
                .logo {
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 10px;
                }
                .receipt-info {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    padding-bottom: 10px;
                    border-bottom: 1px dotted #ccc;
                }
                .info-row:last-child {
                    border-bottom: none;
                    margin-bottom: 0;
                }
                .label {
                    font-weight: bold;
                    color: #333;
                }
                .value {
                    color: #666;
                }
                .reward-details {
                    border: 2px solid #007bff;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                    margin: 20px 0;
                }
                .reward-name {
                    font-size: 24px;
                    font-weight: bold;
                    color: #007bff;
                    margin-bottom: 10px;
                }
                .reward-type {
                    background: #007bff;
                    color: white;
                    padding: 5px 15px;
                    border-radius: 15px;
                    display: inline-block;
                    margin-bottom: 15px;
                }
                .points-used {
                    font-size: 18px;
                    color: #28a745;
                    font-weight: bold;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 2px solid #333;
                    color: #666;
                }
                .barcode {
                    text-align: center;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    margin: 20px 0;
                    padding: 10px;
                    background: #f8f9fa;
                    border: 1px solid #ddd;
                }
                @media print {
                    body { margin: 0; padding: 10px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo">🏛️</div>
                <h1>BARANGAY LIGAYA</h1>
                <h2>REWARD REDEMPTION RECEIPT</h2>
                <p>Official Receipt for Reward Redemption</p>
            </div>
            
            <div class="receipt-info">
                <div class="info-row">
                    <span class="label">Receipt Number:</span>
                    <span class="value">${receiptNumber}</span>
                </div>
                <div class="info-row">
                    <span class="label">Date & Time:</span>
                    <span class="value">${currentDate}</span>
                </div>
                <div class="info-row">
                    <span class="label">Resident Name:</span>
                    <span class="value">${residentName}</span>
                </div>
                <div class="info-row">
                    <span class="label">Resident ID:</span>
                    <span class="value">${userData.resident_id || 'N/A'}</span>
                </div>
            </div>
            
            <div class="reward-details">
                <div class="reward-name">${rewardData.reward_name}</div>
                <div class="reward-type">${rewardData.reward_type.toUpperCase()}</div>
                <div class="points-used">Points Used: ${rewardData.points_used}</div>
            </div>
            
            <div class="receipt-info">
                <div class="info-row">
                    <span class="label">Previous Balance:</span>
                    <span class="value">${(rewardData.new_redeemable_points + rewardData.points_used).toLocaleString()} points</span>
                </div>
                <div class="info-row">
                    <span class="label">Points Deducted:</span>
                    <span class="value">-${rewardData.points_used.toLocaleString()} points</span>
                </div>
                <div class="info-row">
                    <span class="label">Remaining Balance:</span>
                    <span class="value">${rewardData.new_redeemable_points.toLocaleString()} points</span>
                </div>
            </div>
            
            <div class="barcode">
                <div>||||| | || ||| | |||| || | ||||| || | ||</div>
                <div>${receiptNumber}</div>
            </div>
            
            <div class="footer">
                <p><strong>Important Notes:</strong></p>
                <ul style="text-align: left; display: inline-block;">
                    <li>This receipt serves as proof of reward redemption</li>
                    <li>Keep this receipt for your records</li>
                    <li>Contact barangay office for any inquiries</li>
                    <li>Rewards are non-transferable and non-refundable</li>
                </ul>
                <p><em>Thank you for your participation in barangay activities!</em></p>
                <p>Barangay Ligaya - Building a Better Community Together</p>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 20px;">
                <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Receipt</button>
            </div>
        </body>
        </html>
    `;
    
    // Create and download the receipt
    const blob = new Blob([receiptHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt_${receiptNumber}_${rewardData.reward_name.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Also offer to open in new window for immediate viewing/printing
    setTimeout(() => {
        if (confirm('Would you like to view and print the receipt now?')) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(receiptHTML);
            printWindow.document.close();
            printWindow.focus();
        }
    }, 500);
}

function downloadReceipt(rewardId) {
    // Fetch reward redemption details for receipt generation
    fetch(`/UswagLigaya/php-handlers/redeem-rewards-residents/get-redemption-details.php?reward_id=${rewardId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                generateReceipt(data.redemption);
            } else {
                alert('Error fetching redemption details: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to generate receipt: ' + error.message);
        });
}

function updatePointsDisplay() {
    const creditPointsElement = document.getElementById('creditPoints');
    const redeemablePointsElement = document.getElementById('redeemablePoints');
    
    if (creditPointsElement) {
        creditPointsElement.textContent = userCreditPoints.toLocaleString();
    }
    
    if (redeemablePointsElement) {
        redeemablePointsElement.textContent = userRedeemablePoints.toLocaleString();
    }
}

function updateRewardUI(rewardId, button, isRedeemed) {
    if (isRedeemed) {
        const rewardCard = document.querySelector(`[data-reward-id="${rewardId}"]`);
        if (rewardCard) {
            rewardCard.style.opacity = '0.5';
            rewardCard.style.pointerEvents = 'none';
            
            if (button) {
                button.textContent = '✅ Redeemed';
                button.disabled = true;
                button.classList.add('redeemed');
            }
        }
    }
}

function handleError(error, context = '') {
    console.error(`Error in ${context}:`, error);
    
    const errorMessage = error.message || 'An unexpected error occurred';
    
    if (typeof showToast === 'function') {
        showToast('Error: ' + errorMessage, 'error');
    } else {
        alert('Error: ' + errorMessage);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        switchTab,
        loadRewards,
        redeemReward,
        generateReceipt,
        downloadReceipt
    };
}
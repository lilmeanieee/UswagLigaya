// Reward management with database integration
let rewards = [];
let currentRewardId = null; // For tracking which reward is being edited

// DOM elements
const rewardTableBody = document.getElementById('incentivesTable');
const rewardForm = document.getElementById('rewardForm');
const rewardNameInput = document.getElementById('rewardName');
const rewardTypeSelect = document.getElementById('rewardType');
const rewardDescriptionInput = document.getElementById('rewardDescription');
const rewardPointsInput = document.getElementById('rewardPoints');
const rewardImageInput = document.getElementById('rewardImage');
const hasExpirationCheckbox = document.getElementById('hasExpiration');
const expirationDateContainer = document.getElementById('expirationDateContainer');
const expirationDateInput = document.getElementById('expirationDate');
const rewardStatusCheckbox = document.getElementById('rewardStatus');
const activationDateContainer = document.getElementById('activationDateContainer');
const activationDateInput = document.getElementById('activationDateInput');

// Modal elements
let addRewardModal, rewardPreviewModal, archiveRewardModal, imageModal;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing modals...');
    
    // Initialize Bootstrap modals - Fixed modal initialization
    const addRewardModalEl = document.getElementById('addRewardModal');
    const rewardPreviewModalEl = document.getElementById('rewardPreviewModal');
    const archiveRewardModalEl = document.getElementById('archiveRewardModal');
    const imageModalEl = document.getElementById('imageModal');

    if (addRewardModalEl) {
        addRewardModal = new bootstrap.Modal(addRewardModalEl);
        console.log('Add Reward Modal initialized');
    }
    
    if (rewardPreviewModalEl) {
        rewardPreviewModal = new bootstrap.Modal(rewardPreviewModalEl);
        console.log('Preview Modal initialized');
    }
    
    if (archiveRewardModalEl) {
        archiveRewardModal = new bootstrap.Modal(archiveRewardModalEl);
        console.log('Archive Modal initialized');
    }
    
    if (imageModalEl) {
        imageModal = new bootstrap.Modal(imageModalEl);
        console.log('Image Modal initialized');
    }

    // Load rewards from database and render table
    autoActivateRewards();
    autoArchiveRewards();
    loadRewardsFromDatabase();
    setupEventListeners();
});

// Auto-activate rewards based on activation date
function autoActivateRewards() {
    fetch('/UswagLigaya/php-handlers/reward-management/auto-activate-rewards.php') 
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                console.log(data.message);
                loadRewardsFromDatabase();
            } else {
                console.error('Activation failed:', data.message);
            }
        })
        .catch(error => {
            console.error('Error during reward auto-activation:', error);
        });
}

// Auto-archive expired rewards
function autoArchiveRewards() {
    fetch('/UswagLigaya/php-handlers/reward-management/auto-archive-rewards.php') 
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                console.log(data.message);
                loadRewardsFromDatabase(); 
            } else {
                console.error('Archiving failed:', data.message);
            }
        })
        .catch(error => {
            console.error('Error during reward auto-archiving:', error);
        });
}

// Load rewards from database
function loadRewardsFromDatabase() {
    fetch('/UswagLigaya/php-handlers/reward-management/fetch-reward.php')
        .then(response => response.json())
        .then(data => {
            rewards = data;
            console.log('Loaded rewards:', rewards);
            renderRewardTable();
        })
        .catch(error => {
            console.error('Error loading rewards:', error);
            showToast('Error loading rewards from database', 'error');
        });
}

// Setup event listeners
function setupEventListeners() {
    // Add new reward button
    const addNewRewardBtn = document.querySelector('[data-bs-target="#addRewardModal"]');
    if (addNewRewardBtn) {
        addNewRewardBtn.addEventListener('click', () => {
            console.log('Add new reward button clicked');
            resetForm();
            document.querySelector('#addRewardModal .modal-title').textContent = 'Add New Reward';
            currentRewardId = null;
        });
    }
    
    // Reward status toggle - Enhanced to handle both add and edit scenarios
    if (rewardStatusCheckbox && activationDateContainer) {
        rewardStatusCheckbox.addEventListener('change', function () {
            if (!rewardStatusCheckbox.checked) {
                // Reward is inactive, show activation date container
                activationDateContainer.classList.remove('d-none');
            } else {
                // Reward is active, hide activation date container and clear the value
                activationDateContainer.classList.add('d-none');
                if (activationDateInput) {
                    activationDateInput.value = '';
                }
            }
        });
    }
    
    // Expiration checkbox
    if (hasExpirationCheckbox) {
        hasExpirationCheckbox.addEventListener('change', () => {
            if (hasExpirationCheckbox.checked) {
                expirationDateContainer.classList.remove('d-none');
            } else {
                expirationDateContainer.classList.add('d-none');
                expirationDateInput.value = '';
            }
        });
    }

    // Form submission handler
    if (rewardForm) {
        rewardForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (currentRewardId) {
                updateRewardInDatabase();
            } else {
                saveRewardToDatabase();
            }
        });
    }

    // Confirm archive button
    const confirmArchiveBtn = document.getElementById('confirmArchiveBtn');
    if (confirmArchiveBtn) {
        confirmArchiveBtn.addEventListener('click', confirmArchiveReward);
    }
}

// Save new reward to database
function saveRewardToDatabase() {
    // Validate required fields
    const rewardName = rewardNameInput.value.trim();
    const rewardType = rewardTypeSelect.value;
    const rewardDescription = rewardDescriptionInput.value.trim();
    const rewardPoints = rewardPointsInput.value;
    const rewardImage = rewardImageInput.files[0];

    if (!rewardName || !rewardType || !rewardDescription || !rewardPoints) {
        showToast('Please fill in all required fields!', 'error');
        return;
    }

    if (!rewardImage && !currentRewardId) {
        showToast('Please upload an image for the reward!', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('rewardName', rewardName);
    formData.append('rewardType', rewardType);
    formData.append('rewardDescription', rewardDescription);
    formData.append('rewardPoints', rewardPoints);
    
    if (rewardImage) {
        formData.append('rewardImage', rewardImage);
    }

    // Handle status and dates
    const isActive = rewardStatusCheckbox.checked;
    formData.append('isActive', isActive ? '1' : '0');
    
    const activationDate = activationDateInput ? activationDateInput.value : '';
    formData.append('activationDate', activationDate || '');
    
    const expirationDate = expirationDateInput.value;
    formData.append('expirationDate', expirationDate || '');

    console.log('Sending new reward data...');

    fetch('/UswagLigaya/php-handlers/reward-management/add-reward.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(resultText => {
        console.log('Server response:', resultText);
        
        if (resultText.includes('successfully')) {
            showToast('Reward added successfully!');
            addRewardModal.hide();
            resetForm();
            loadRewardsFromDatabase();
        } else {
            showToast('Server response: ' + resultText, 'error');
        }
    })
    .catch(error => {
        console.error('Error during fetch:', error);
        showToast('An error occurred while submitting the form. Please try again later.', 'error');
    });
}

// Update existing reward in database
function updateRewardInDatabase() {
    // Validate required fields
    const rewardName = rewardNameInput.value.trim();
    const rewardType = rewardTypeSelect.value;
    const rewardDescription = rewardDescriptionInput.value.trim();
    const rewardPoints = rewardPointsInput.value;

    if (!rewardName || !rewardType || !rewardDescription || !rewardPoints) {
        showToast('Please fill in all required fields!', 'error');
        return;
    }

    const formData = new FormData();
    formData.append('rewardId', currentRewardId);
    formData.append('rewardName', rewardName);
    formData.append('rewardType', rewardType);
    formData.append('rewardDescription', rewardDescription);
    formData.append('rewardPoints', rewardPoints);
    
    // Handle file upload
    const rewardImageFile = rewardImageInput.files[0];
    if (rewardImageFile) {
        formData.append('rewardImage', rewardImageFile);
    }

    // Handle status and dates
    const isActive = rewardStatusCheckbox.checked;
    formData.append('isActive', isActive ? '1' : '0');
    
    const activationDate = activationDateInput ? activationDateInput.value : '';
    formData.append('activationDate', activationDate || '');
    
    const expirationDate = expirationDateInput.value;
    formData.append('expirationDate', expirationDate || '');

    console.log('Updating reward with ID:', currentRewardId);

    fetch('/UswagLigaya/php-handlers/reward-management/update-reward.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(response => {
        console.log("Server response:", response);
        if (response.success) {
            showToast("Reward successfully updated!");
            addRewardModal.hide();
            resetForm();
            currentRewardId = null;
            loadRewardsFromDatabase();
        } else {
            showToast("Error: " + response.error, 'error');
        }
    })
    .catch(error => {
        console.error("Request error:", error);
        showToast("An unexpected error occurred.", 'error');
    });
}

// Render reward table with enhanced functionality
function renderRewardTable() {
    if (!rewardTableBody) return;
    
    rewardTableBody.innerHTML = '';
    
    if (rewards.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" class="text-center text-muted py-4">
                <i class="bi bi-gift fa-2x mb-2"></i>
                <div>No rewards found</div>
            </td>
        `;
        rewardTableBody.appendChild(row);
        return;
    }
    
    rewards.forEach(reward => {
        const row = document.createElement('tr');
        
        // Format status info with activation date for inactive rewards
        let statusInfo = '';
        if (reward.status || reward.is_active) {
            statusInfo = `<span class="badge bg-success">Active</span>`;
        } else {
            statusInfo = `<span class="badge bg-secondary">Inactive</span>`;
            if (reward.activationDate || reward.activation_date) {
                const activationDate = reward.activationDate || reward.activation_date;
                statusInfo += `<div><small class="text-muted">Activate: ${formatDate(activationDate)}</small></div>`;
            }
        }
        
        // Format expiration date if present
        let expirationInfo = '';
        if (reward.expiration || reward.expiration_date) {
            const expirationDate = reward.expiration || reward.expiration_date;
            expirationInfo = `<div><small class="text-muted">Expires: ${formatDate(expirationDate)}</small></div>`;
        }
        
        row.innerHTML = `
            <td>${reward.id}</td>
            <td>
                <div class="image-container">
                    <img src="${reward.image}" alt="${reward.name}" 
                         class="reward-image"
                         onclick="showImageModal('${reward.image}', '${reward.name}')"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNSA0MEwzNSA0MEwzMCAzMkwyNSA0MFoiIGZpbGw9IiM5Q0E2QUYiLz4KPC9zdmc+'" />
                </div>
            </td>
            <td><strong>${reward.name}</strong></td>
            <td>${reward.description}</td>
            <td><span class="badge bg-primary">${reward.points} points</span></td>
            <td>
                ${statusInfo}
                ${expirationInfo}
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary edit-reward" data-id="${reward.id}" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info preview-reward" data-id="${reward.id}" title="Preview">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger archive-reward" data-id="${reward.id}" title="Archive">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        rewardTableBody.appendChild(row);
    });
    
    console.log('Table rendered, attaching event listeners...');
    
    // Add event listeners to action buttons - Fixed event listener attachment
    const editButtons = document.querySelectorAll('.edit-reward');
    const archiveButtons = document.querySelectorAll('.archive-reward');
    const previewButtons = document.querySelectorAll('.preview-reward');
    
    console.log(`Found ${editButtons.length} edit buttons, ${archiveButtons.length} archive buttons, ${previewButtons.length} preview buttons`);
    
    editButtons.forEach(button => {
        button.addEventListener('click', handleEditReward);
    });
    
    archiveButtons.forEach(button => {
        button.addEventListener('click', handleArchiveReward);
    });
    
    previewButtons.forEach(button => {
        button.addEventListener('click', handlePreviewReward);
    });
}

// Handle edit reward - Fixed modal checking
function handleEditReward(e) {
    console.log('Edit reward clicked');
    const rewardId = parseInt(e.currentTarget.dataset.id);
    console.log('Editing reward ID:', rewardId);
    
    const reward = rewards.find(r => parseInt(r.id) === rewardId);
    
    if (reward) {
        console.log('Found reward:', reward);
        resetForm();
        
        document.querySelector('#addRewardModal .modal-title').textContent = 'Edit Reward';
        currentRewardId = rewardId;
        rewardNameInput.value = reward.name;
        rewardTypeSelect.value = reward.type || reward.reward_type || '';
        rewardDescriptionInput.value = reward.description;
        rewardPointsInput.value = reward.points;
        
        // Set expiration date if applicable
        if (reward.expiration || reward.expiration_date) {
            hasExpirationCheckbox.checked = true;
            expirationDateContainer.classList.remove('d-none');
            expirationDateInput.value = reward.expiration || reward.expiration_date;
        }
        
        // Handle activation date BEFORE setting the status checkbox
        const isActive = reward.status || reward.is_active;
        if (!isActive && activationDateContainer && activationDateInput) {
            activationDateContainer.classList.remove('d-none');
            if (reward.activationDate || reward.activation_date) {
                activationDateInput.value = reward.activationDate || reward.activation_date;
            }
        }
        
        // Set status AFTER handling activation date
        rewardStatusCheckbox.checked = isActive;
        
        // Check if modal exists before showing
        if (addRewardModal) {
            console.log('Showing edit modal');
            addRewardModal.show();
        } else {
            console.error('Add reward modal not initialized');
        }
    } else {
        console.error('Reward not found:', rewardId);
    }
}

// Handle archive reward - Fixed modal checking
function handleArchiveReward(e) {
    console.log('Archive reward clicked');
    const rewardId = parseInt(e.currentTarget.dataset.id);
    console.log('Archiving reward ID:', rewardId);
    
    const reward = rewards.find(r => r.id === rewardId);

    if (reward) {
        console.log('Found reward for archiving:', reward);
        
        const archiveRewardNameEl = document.getElementById('archiveRewardName');
        if (archiveRewardNameEl) {
            archiveRewardNameEl.textContent = reward.name;
        }
        
        currentRewardId = rewardId;
        
        // Check if modal exists before showing
        if (archiveRewardModal) {
            console.log('Showing archive modal');
            archiveRewardModal.show();
        } else {
            console.error('Archive reward modal not initialized');
        }
    } else {
        console.error('Reward not found for archiving:', rewardId);
    }
}

// Confirm archive reward
function confirmArchiveReward() {
    console.log('Confirming archive for reward ID:', currentRewardId);
    
    if (currentRewardId) {
        fetch('/UswagLigaya/php-handlers/reward-management/archive-reward.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reward_id: currentRewardId })
        })
        .then(res => res.json())
        .then(response => {
            console.log('Archive response:', response);
            if (response.success) {
                if (archiveRewardModal) {
                    archiveRewardModal.hide();
                }
                currentRewardId = null;
                showToast('Reward archived successfully');
                loadRewardsFromDatabase();
            } else {
                showToast("Error archiving reward: " + response.message, 'error');
            }
        })
        .catch(error => {
            console.error("Archive error:", error);
            showToast("An error occurred while archiving the reward.", 'error');
        });
    }
}

// Handle preview reward - Fixed modal checking
function handlePreviewReward(e) {
    console.log('Preview reward clicked');
    const rewardId = parseInt(e.currentTarget.dataset.id);
    console.log('Previewing reward ID:', rewardId);
    
    const reward = rewards.find(r => r.id === rewardId);
    
    if (reward) {
        console.log('Found reward for preview:', reward);
        
        const previewRewardIcon = document.getElementById('previewRewardIcon');
        const previewRewardName = document.getElementById('previewRewardName');
        const previewRewardDescription = document.getElementById('previewRewardDescription');
        const previewRequiredPoints = document.getElementById('previewRequiredPoints');
        const previewRewardStatus = document.getElementById('previewRewardStatus');
        
        // Set reward image
        if (previewRewardIcon) {
            previewRewardIcon.innerHTML = `<img src="${reward.image}" alt="${reward.name}" style="max-width: 100px; max-height: 100px; object-fit: cover; border-radius: 8px;">`;
        }
        
        // Set reward info
        if (previewRewardName) previewRewardName.textContent = reward.name;
        if (previewRewardDescription) previewRewardDescription.textContent = reward.description;
        if (previewRequiredPoints) previewRequiredPoints.textContent = `${reward.points} Points Required`;
        
        // Set reward status
        if (previewRewardStatus) {
            const isActive = reward.status || reward.is_active;
            if (isActive) {
                previewRewardStatus.className = 'badge bg-success';
                previewRewardStatus.textContent = 'Active';
            } else {
                previewRewardStatus.className = 'badge bg-secondary';
                previewRewardStatus.textContent = 'Inactive';
            }
        }
        
        // Check if modal exists before showing
        if (rewardPreviewModal) {
            console.log('Showing preview modal');
            rewardPreviewModal.show();
        } else {
            console.error('Preview reward modal not initialized');
        }
    } else {
        console.error('Reward not found for preview:', rewardId);
    }
}

// Show image modal
function showImageModal(imageSrc, imageTitle) {
    console.log('Showing image modal for:', imageTitle);
    
    if (imageModal) {
        const modalImage = document.getElementById('modalImage');
        const modalImageTitle = document.getElementById('modalImageTitle');
        
        if (modalImage) modalImage.src = imageSrc;
        if (modalImageTitle) modalImageTitle.textContent = imageTitle;
        
        imageModal.show();
    } else {
        console.error('Image modal not initialized');
    }
}

// Reset form to default values
function resetForm() {
    rewardNameInput.value = '';
    rewardTypeSelect.value = '';
    rewardDescriptionInput.value = '';
    rewardPointsInput.value = '';
    rewardImageInput.value = '';
    
    // Reset expiration
    hasExpirationCheckbox.checked = false;
    expirationDateContainer.classList.add('d-none');
    expirationDateInput.value = '';
    
    // Reset activation date - ensure it's hidden by default
    if (activationDateContainer) {
        activationDateContainer.classList.add('d-none');
    }
    if (activationDateInput) {
        activationDateInput.value = '';
    }
    
    // Reset status to active by default
    rewardStatusCheckbox.checked = true;
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Show toast notification
function showToast(message, type = 'success') {
    // Check if toast container exists, if not create it
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = `toast-${Date.now()}`;
    const toastElement = document.createElement('div');
    toastElement.className = `toast show ${type === 'error' ? 'bg-danger text-white' : ''}`;
    toastElement.id = toastId;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    
    toastElement.innerHTML = `
        <div class="toast-header ${type === 'error' ? 'bg-danger text-white' : ''}">
            <strong class="me-auto">Reward Management</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toastElement);
    
    // Create Bootstrap toast instance
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
        toast.show();
        
        // Remove toast after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    } else {
        // Fallback if Bootstrap is not available
        setTimeout(() => {
            toastElement.remove();
        }, 3000);
    }
}

// Legacy functions for backward compatibility
function editReward(rewardId) {
    const reward = rewards.find(r => r.id === rewardId);
    if (reward) {
        const button = document.createElement('button');
        button.dataset.id = rewardId;
        handleEditReward({ currentTarget: button });
    }
}

function deleteReward(rewardId) {
    const reward = rewards.find(r => r.id === rewardId);
    if (reward) {
        const button = document.createElement('button');
        button.dataset.id = rewardId;
        handleArchiveReward({ currentTarget: button });
    }
}
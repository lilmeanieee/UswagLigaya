// Badge management with database integration
let badges = [];
let currentBadgeId = null; // For tracking which badge is being edited

// DOM elements
const badgeTableBody = document.getElementById('badgeTableBody');
const badgeForm = document.getElementById('badgeForm');
const badgeFormModalLabel = document.getElementById('badgeFormModalLabel');
const badgeIdInput = document.getElementById('badgeId');
const badgeNameInput = document.getElementById('badgeName');
const badgeDescriptionInput = document.getElementById('badgeDescription');
const badgeIconInput = document.getElementById('badgeIcon');
const iconPreview = document.getElementById('iconPreview');
const defaultIconBtn = document.getElementById('defaultIconBtn');
const constraintTypeInputs = document.querySelectorAll('.constraint-type');
const pointsThresholdInput = document.getElementById('pointsThreshold');
const eventsCountInput = document.getElementById('eventsCount');
const rankingPositionInput = document.getElementById('rankingPosition');
const rankingTypeSelect = document.getElementById('rankingType');
const hasExpirationCheckbox = document.getElementById('hasExpiration');
const expirationDateContainer = document.getElementById('expirationDateContainer');
const expirationDateInput = document.getElementById('expirationDate');
const badgeStatusCheckbox = document.getElementById('badgeStatus');
const activationDateContainer = document.getElementById('activationDateContainer');
const activationDateInput = document.getElementById('activationDateInput');
const saveBadgeBtn = document.getElementById('saveBadgeBtn');

// Modal elements
let badgeFormModal, badgePreviewModal, archiveBadgeModal;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap modals
    badgeFormModal = new bootstrap.Modal(document.getElementById('badgeFormModal'));
    if (document.getElementById('badgePreviewModal')) {
        badgePreviewModal = new bootstrap.Modal(document.getElementById('badgePreviewModal'));
    }
    if (document.getElementById('archiveBadgeModal')) {
        archiveBadgeModal = new bootstrap.Modal(document.getElementById('archiveBadgeModal'));
    }

    // Load badges from database and render table
    autoActivateBadges();
    autoArchivedBadges();
    loadBadgesFromDatabase();
    setupEventListeners();
});

function autoActivateBadges() {
    fetch('/UswagLigaya/php-handlers/manage-leaderboard/auto-activate-badges.php') 
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                console.log(data.message);
                // Optionally refresh badge list
                loadBadgesFromDatabase(); // if you already have this function
            } else {
                console.error('Activation failed:', data.message);
            }
        })
        .catch(error => {
            console.error('Error during badge auto-activation:', error);
        });
}

function autoArchivedBadges() {
    fetch('/UswagLigaya/php-handlers/manage-leaderboard/auto-archive-badge.php') 
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                console.log(data.message);
                loadBadgesFromDatabase(); 
            } else {
                console.error('Archiving failed:', data.message);
            }
        })
        .catch(error => {
            console.error('Error during badge auto-archiving:', error);
        });
}


// Load badges from database
function loadBadgesFromDatabase() {
    fetch('/UswagLigaya/php-handlers/manage-leaderboard/fetch-badges.php')
        .then(response => response.json())
        .then(data => {
            badges = data;
            renderBadgeTable();
        })
        .catch(error => {
            console.error('Error loading badges:', error);
            showToast('Error loading badges from database', 'error');
        });
}

// Setup event listeners
function setupEventListeners() {
    // Add new badge button
    if (document.getElementById('addBadgeBtn')) {
        document.getElementById('addBadgeBtn').addEventListener('click', () => {
            resetForm();
            badgeFormModalLabel.textContent = 'Add New Badge';
            currentBadgeId = null;
        });
    }
    
    // Default icon button
    if (defaultIconBtn) {
        defaultIconBtn.addEventListener('click', () => {
            badgeIconInput.value = '';
            iconPreview.innerHTML = '<i class="fa fa-award fa-2x"></i>';
        });
    }
    
    // Badge icon upload
    if (badgeIconInput) {
        badgeIconInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    iconPreview.innerHTML = `<img src="${e.target.result}" alt="Badge Icon">`;
                };
                reader.readAsDataURL(e.target.files[0]);
            }
        });
    }
    
    // Constraint type radio buttons
    constraintTypeInputs.forEach(input => {
        input.addEventListener('change', () => {
            // Hide all constraint details
            document.querySelectorAll('.constraint-details').forEach(el => {
                el.classList.add('d-none');
            });
            
            // Show the selected constraint details
            if (input.checked && input.value !== 'manual') {
                const detailClass = '.' + input.value + '-constraint';
                const detailElement = document.querySelector(detailClass);
                if (detailElement) {
                    detailElement.classList.remove('d-none');
                }
            }
        });
    });
    
    // Badge status toggle - Enhanced to handle both add and edit scenarios
    if (badgeStatusCheckbox && activationDateContainer) {
        badgeStatusCheckbox.addEventListener('change', function () {
            if (!badgeStatusCheckbox.checked) {
                // Badge is inactive, show activation date container
                activationDateContainer.classList.remove('d-none');
            } else {
                // Badge is active, hide activation date container and clear the value
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
    
    // Save badge button
    if (saveBadgeBtn) {
        saveBadgeBtn.addEventListener('click', function() {
            if (currentBadgeId) {
                // Update existing badge
                updateBadgeInDatabase();
            } else {
                // Add new badge (use existing add-badge.php)
                saveBadgeToDatabase();
            }
        });
    }

    // Confirm archive button
    if (document.getElementById('confirmArchiveBtn')) {
        document.getElementById('confirmArchiveBtn').addEventListener('click', confirmArchiveBadge);
    }
}

// Update badge in database
function updateBadgeInDatabase() {
    // Validate required fields
    const badgeName = badgeNameInput.value.trim();
    const badgeDescription = badgeDescriptionInput.value.trim();
    const selectedConstraint = document.querySelector('input[name="constraintType"]:checked');
    
    if (!badgeName) {
        alert("Badge name is required!");
        return;
    }
    
    if (!selectedConstraint) {
        alert("Please select a constraint type!");
        return;
    }

    const formData = new FormData();
    formData.append('badgeId', currentBadgeId);
    formData.append('badgeName', badgeName);
    formData.append('badgeDescription', badgeDescription);
    formData.append('constraintType', selectedConstraint.value);
    
    // Handle constraint-specific data
    const constraintType = selectedConstraint.value;
    if (constraintType === 'points') {
        const pointsThreshold = pointsThresholdInput.value;
        if (!pointsThreshold || pointsThreshold <= 0) {
            alert("Please enter a valid points threshold!");
            return;
        }
        formData.append('pointsThreshold', pointsThreshold);
        formData.append('eventsCount', '');
        formData.append('rankingPosition', '');
        formData.append('rankingType', '');
    } else if (constraintType === 'events') {
        const eventsCount = eventsCountInput.value;
        if (!eventsCount || eventsCount <= 0) {
            alert("Please enter a valid events count!");
            return;
        }
        formData.append('pointsThreshold', '');
        formData.append('eventsCount', eventsCount);
        formData.append('rankingPosition', '');
        formData.append('rankingType', '');
    } else if (constraintType === 'ranking') {
        const rankingPosition = rankingPositionInput.value;
        const rankingType = rankingTypeSelect.value;
        if (!rankingPosition || rankingPosition <= 0) {
            alert("Please enter a valid ranking position!");
            return;
        }
        formData.append('pointsThreshold', '');
        formData.append('eventsCount', '');
        formData.append('rankingPosition', rankingPosition);
        formData.append('rankingType', rankingType);
    } else {
        // Manual constraint
        formData.append('pointsThreshold', '');
        formData.append('eventsCount', '');
        formData.append('rankingPosition', '');
        formData.append('rankingType', '');
    }
    
    // Handle status and dates
    const isActive = badgeStatusCheckbox.checked;
    formData.append('isActive', isActive ? '1' : '0');
    
    const activationDate = activationDateInput ? activationDateInput.value : '';
    formData.append('activationDate', activationDate || '');
    
    const expirationDate = expirationDateInput.value;
    formData.append('expirationDate', expirationDate || '');

    // Handle file upload
    const badgeIconFile = badgeIconInput.files[0];
    if (badgeIconFile) {
        formData.append('badgeIcon', badgeIconFile);
    } else if (iconPreview.innerHTML.includes('fa-award')) {
        // User selected default icon
        formData.append('useDefault', 'true');
    }

    // Debug: Log form data
    console.log("Updating badge with data:");
    for (let [key, value] of formData.entries()) {
        console.log(key, value);
    }

    fetch('/UswagLigaya/php-handlers/manage-leaderboard/update-badge.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(response => {
        console.log("Server response:", response);
        if (response.success) {
            showToast("Badge successfully updated!");
            badgeFormModal.hide();
            resetForm();
            currentBadgeId = null;
            // Reload badges from database
            loadBadgesFromDatabase();
        } else {
            alert("Error: " + response.error);
        }
    })
    .catch(error => {
        console.error("Request error:", error);
        alert("An unexpected error occurred.");
    });
}

// Save new badge to database (existing function for adding)
function saveBadgeToDatabase() {
    // Validate required fields
    const badgeName = badgeNameInput.value.trim();
    const badgeDescription = badgeDescriptionInput.value.trim();
    const selectedConstraint = document.querySelector('input[name="constraintType"]:checked');
    
    if (!badgeName) {
        alert("Badge name is required!");
        return;
    }
    
    if (!selectedConstraint) {
        alert("Please select a constraint type!");
        return;
    }

    const formData = new FormData();
    formData.append('badgeName', badgeName);
    formData.append('badgeDescription', badgeDescription);
    formData.append('constraintType', selectedConstraint.value);
    
    // Handle constraint-specific data
    const constraintType = selectedConstraint.value;
    if (constraintType === 'points') {
        const pointsThreshold = pointsThresholdInput.value;
        if (!pointsThreshold || pointsThreshold <= 0) {
            alert("Please enter a valid points threshold!");
            return;
        }
        formData.append('pointsThreshold', pointsThreshold);
        formData.append('eventsCount', '');
        formData.append('rankingPosition', '');
        formData.append('rankingType', '');
    } else if (constraintType === 'events') {
        const eventsCount = eventsCountInput.value;
        if (!eventsCount || eventsCount <= 0) {
            alert("Please enter a valid events count!");
            return;
        }
        formData.append('pointsThreshold', '');
        formData.append('eventsCount', eventsCount);
        formData.append('rankingPosition', '');
        formData.append('rankingType', '');
    } else if (constraintType === 'ranking') {
        const rankingPosition = rankingPositionInput.value;
        const rankingType = rankingTypeSelect.value;
        if (!rankingPosition || rankingPosition <= 0) {
            alert("Please enter a valid ranking position!");
            return;
        }
        formData.append('pointsThreshold', '');
        formData.append('eventsCount', '');
        formData.append('rankingPosition', rankingPosition);
        formData.append('rankingType', rankingType);
    } else {
        // Manual constraint
        formData.append('pointsThreshold', '');
        formData.append('eventsCount', '');
        formData.append('rankingPosition', '');
        formData.append('rankingType', '');
    }
    
    // Handle status and dates
    const isActive = badgeStatusCheckbox.checked;
    formData.append('isActive', isActive ? '1' : '0');
    
    const activationDate = activationDateInput ? activationDateInput.value : '';
    formData.append('activationDate', activationDate || '');
    
    const expirationDate = expirationDateInput.value;
    formData.append('expirationDate', expirationDate || '');

    // Handle file upload
    const badgeIconFile = badgeIconInput.files[0];
    if (badgeIconFile) {
        formData.append('badgeIcon', badgeIconFile);
    } else {
        formData.append('useDefault', 'true');
    }

    // Debug: Log form data
    console.log("Sending data:");
    for (let [key, value] of formData.entries()) {
        console.log(key, value);
    }

    fetch('/UswagLigaya/php-handlers/manage-leaderboard/add-badge.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(response => {
        console.log("Server response:", response);
        if (response.success) {
            showToast("Badge successfully saved!");
            badgeFormModal.hide();
            resetForm();
            // Reload badges from database
            loadBadgesFromDatabase();
        } else {
            alert("Error: " + response.error);
        }
    })
    .catch(error => {
        console.error("Request error:", error);
        alert("An unexpected error occurred.");
    });
}

// Updated renderBadgeTable function to show activation date for inactive badges
function renderBadgeTable() {
    if (!badgeTableBody) return;
    
    badgeTableBody.innerHTML = '';
    
    if (badges.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="5" class="text-center text-muted py-4">
                <i class="fa fa-award fa-2x mb-2"></i>
                <div>No badges found</div>
            </td>
        `;
        badgeTableBody.appendChild(row);
        return;
    }
    
    badges.forEach(badge => {
        const row = document.createElement('tr');
        
        // Format the constraint summary
        let constraintSummary = getConstraintSummary(badge.constraint);
        
        // Format status info with activation date for inactive badges
        let statusInfo = '';
        if (badge.status) {
            // Badge is active
            statusInfo = `
                <span class="status-active">
                    <i class="fa fa-check-circle"></i>
                    Active
                </span>
            `;
        } else {
            // Badge is inactive - show activation date if available
            statusInfo = `
                <span class="status-inactive">
                    <i class="fa fa-times-circle"></i>
                    Inactive
                </span>
            `;
            
            // Add activation date if present
            if (badge.activationDate) {
                statusInfo += `<div><small class="text-muted">Activate: ${formatDate(badge.activationDate)}</small></div>`;
            }
        }
        
        // Format expiration date if present
        let expirationInfo = badge.expiration ? 
            `<div><small class="text-muted">Expires: ${formatDate(badge.expiration)}</small></div>` : '';
        
        row.innerHTML = `
            <td>
                <div class="table-badge-icon">
                    ${badge.iconSrc ? 
                        `<img src="${badge.iconSrc}" alt="${badge.name}">` : 
                        '<i class="fa fa-award"></i>'}
                </div>
            </td>
            <td>
                <strong>${badge.name}</strong>
                <div><small class="text-muted">${badge.description}</small></div>
            </td>
            <td>${constraintSummary}</td>
            <td>
                ${statusInfo}
                ${expirationInfo}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary edit-badge" data-id="${badge.id}">
                        <i class="fa fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger archive-badge" data-id="${badge.id}">
                        <i class="fa fa-trash"></i> Archive
                    </button>
                    <button class="btn btn-sm btn-outline-secondary preview-badge" data-id="${badge.id}">
                        <i class="fa fa-eye"></i> Preview
                    </button>
                </div>
            </td>
        `;
        
        badgeTableBody.appendChild(row);
    });
    
    // Add event listeners to action buttons
    document.querySelectorAll('.edit-badge').forEach(button => {
        button.addEventListener('click', handleEditBadge);
    });
    
    document.querySelectorAll('.archive-badge').forEach(button => {
        button.addEventListener('click', handleArchiveBadge);
    });
    
    document.querySelectorAll('.preview-badge').forEach(button => {
        button.addEventListener('click', handlePreviewBadge);
    });
}
// Handle edit badge - Fixed to properly show activation date
function handleEditBadge(e) {
    const badgeId = parseInt(e.currentTarget.dataset.id);
    const badge = badges.find(b => b.id === badgeId);
    
    if (badge) {
        resetForm();
        
        badgeFormModalLabel.textContent = 'Edit Badge';
        currentBadgeId = badgeId;
        badgeIdInput.value = badgeId;
        badgeNameInput.value = badge.name;
        badgeDescriptionInput.value = badge.description;
        
        // Set icon preview
        if (badge.iconSrc) {
            iconPreview.innerHTML = `<img src="${badge.iconSrc}" alt="${badge.name}">`;
        } else {
            iconPreview.innerHTML = '<i class="fa fa-award fa-2x"></i>';
        }
        
        // Set constraint type
        const constraintType = badge.constraint.type;
        const constraintRadio = document.getElementById(`${constraintType}Constraint`);
        if (constraintRadio) {
            constraintRadio.checked = true;
            
            // Show constraint details if applicable
            if (constraintType !== 'manual') {
                const detailClass = '.' + constraintType + '-constraint';
                const detailElement = document.querySelector(detailClass);
                if (detailElement) {
                    detailElement.classList.remove('d-none');
                }
                
                // Set constraint details
                if (constraintType === 'points' && badge.constraint.details) {
                    pointsThresholdInput.value = badge.constraint.details.threshold;
                } else if (constraintType === 'events' && badge.constraint.details) {
                    eventsCountInput.value = badge.constraint.details.count;
                } else if (constraintType === 'ranking' && badge.constraint.details) {
                    rankingPositionInput.value = badge.constraint.details.position;
                    rankingTypeSelect.value = badge.constraint.details.type;
                }
            }
        }
        
        // Set expiration date if applicable
        if (badge.expiration) {
            hasExpirationCheckbox.checked = true;
            expirationDateContainer.classList.remove('d-none');
            expirationDateInput.value = badge.expiration;
        }
        
        // SOLUTION: Handle activation date BEFORE setting the status checkbox
        // This prevents the checkbox change event from interfering
        if (!badge.status && activationDateContainer && activationDateInput) {
            // Badge is inactive, show activation date container
            activationDateContainer.classList.remove('d-none');
            if (badge.activationDate) {
                activationDateInput.value = badge.activationDate;
            }
        }
        
        // Set status AFTER handling activation date
        badgeStatusCheckbox.checked = badge.status;
        
        badgeFormModal.show();
    }
}

// Handle archive badge
function handleArchiveBadge(e) {
    const badgeId = parseInt(e.currentTarget.dataset.id);
    const badge = badges.find(b => b.id === badgeId);

    if (badge && archiveBadgeModal) {
        document.getElementById('archiveBadgeName').textContent = badge.name;
        currentBadgeId = badgeId;
        archiveBadgeModal.show();
    }
}

// Confirm archive badge
function confirmArchiveBadge() {
    if (currentBadgeId) {
        // Here you would call your archive-badge.php endpoint
        fetch('/UswagLigaya/php-handlers/manage-leaderboard/archive-badge.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ badge_id: currentBadgeId })
        })
        .then(res => res.json())
        .then(response => {
            if (response.success) {
                if (archiveBadgeModal) {
                    archiveBadgeModal.hide();
                }
                currentBadgeId = null;
                showToast('Badge archived successfully');
                // Reload badges from database
                loadBadgesFromDatabase();
            } else {
                alert("Error archiving badge: " + response.message);
            }
        })
        .catch(error => {
            console.error("Archive error:", error);
            alert("An error occurred while archiving the badge.");
        });
    }
}

// Handle preview badge
function handlePreviewBadge(e) {
    const badgeId = parseInt(e.currentTarget.dataset.id);
    const badge = badges.find(b => b.id === badgeId);
    
    if (badge && badgePreviewModal) {
        const previewBadgeIcon = document.getElementById('previewBadgeIcon');
        const previewBadgeName = document.getElementById('previewBadgeName');
        const previewBadgeDescription = document.getElementById('previewBadgeDescription');
        const previewBadgeConstraints = document.getElementById('previewBadgeConstraints');
        const previewBadgeStatus = document.getElementById('previewBadgeStatus');
        
        // Set badge icon
        if (badge.iconSrc) {
            previewBadgeIcon.innerHTML = `<img src="${badge.iconSrc}" alt="${badge.name}">`;
        } else {
            previewBadgeIcon.innerHTML = '<i class="fa fa-award fa-3x"></i>';
        }
        
        // Set badge info
        previewBadgeName.textContent = badge.name;
        previewBadgeDescription.textContent = badge.description;
        previewBadgeConstraints.textContent = getConstraintSummary(badge.constraint);
        
        // Set badge status
        if (badge.status) {
            previewBadgeStatus.className = 'badge bg-success';
            previewBadgeStatus.textContent = 'Active';
        } else {
            previewBadgeStatus.className = 'badge bg-secondary';
            previewBadgeStatus.textContent = 'Inactive';
        }
        
        badgePreviewModal.show();
    }
}

// Reset form to default values
function resetForm() {
    if (badgeIdInput) badgeIdInput.value = '';
    badgeNameInput.value = '';
    badgeDescriptionInput.value = '';
    badgeIconInput.value = '';
    iconPreview.innerHTML = '<i class="fa fa-award fa-2x"></i>';
    
    // Reset constraint type radios
    constraintTypeInputs.forEach(input => {
        input.checked = false;
    });
    const manualConstraint = document.getElementById('manualConstraint');
    if (manualConstraint) {
        manualConstraint.checked = true;
    }
    
    // Hide all constraint details
    document.querySelectorAll('.constraint-details').forEach(el => {
        el.classList.add('d-none');
    });
    
    // Reset constraint inputs
    pointsThresholdInput.value = '';
    eventsCountInput.value = '';
    rankingPositionInput.value = '';
    if (rankingTypeSelect) rankingTypeSelect.value = 'overall';
    
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
    badgeStatusCheckbox.checked = true;
}

// Get constraint summary for display
function getConstraintSummary(constraint) {
    switch (constraint.type) {
        case 'points':
            return `Points Threshold: ${constraint.details ? constraint.details.threshold : 'N/A'}`;
        case 'events':
            return `Events: ${constraint.details ? constraint.details.count : 'N/A'}+ participations`;
        case 'ranking':
            return `Ranking: Top ${constraint.details ? constraint.details.position : 'N/A'} in ${constraint.details ? constraint.details.type : 'overall'} leaderboard`;
        case 'manual':
            return 'Manual Assignment Only';
        default:
            return 'Unknown Constraint';
    }
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
            <strong class="me-auto">Badge Management</strong>
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

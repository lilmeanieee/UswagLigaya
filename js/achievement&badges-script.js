// Sample badge data for demonstration
let badges = [
    {
        id: 1,
        name: "Event Champion",
        description: "Awarded to participants who made significant contributions to events",
        iconSrc: null, // null means using default icon
        constraint: {
            type: "events",
            details: {
                count: 5
            }
        },
        status: true, // active
        expiration: null // no expiration
    },
    {
        id: 2,
        name: "Points Master",
        description: "Earned by accumulating a large number of points",
        iconSrc: null,
        constraint: {
            type: "points",
            details: {
                threshold: 1000
            }
        },
        status: true,
        expiration: null
    },
    {
        id: 3,
        name: "Top Collector",
        description: "For users who rank high on the leaderboard",
        iconSrc: null,
        constraint: {
            type: "ranking",
            details: {
                position: 3,
                type: "overall"
            }
        },
        status: true,
        expiration: null
    },
    {
        id: 4,
        name: "Special Recognition",
        description: "Manually assigned for special achievements",
        iconSrc: null,
        constraint: {
            type: "manual"
        },
        status: false, // inactive
        expiration: "2025-12-31"
    }
];

let nextId = 5; // For generating new badge IDs
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
const saveBadgeBtn = document.getElementById('saveBadgeBtn');

// Modal elements
const badgeFormModal = new bootstrap.Modal(document.getElementById('badgeFormModal'));
const badgePreviewModal = new bootstrap.Modal(document.getElementById('badgePreviewModal'));
const deleteBadgeModal = new bootstrap.Modal(document.getElementById('deleteBadgeModal'));

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    renderBadgeTable();
    setupEventListeners();
});

// Render the badge table
function renderBadgeTable() {
    badgeTableBody.innerHTML = '';
    
    badges.forEach(badge => {
        const row = document.createElement('tr');
        
        // Format the constraint summary
        let constraintSummary = getConstraintSummary(badge.constraint);
        
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
                <span class="${badge.status ? 'status-active' : 'status-inactive'}">
                    <i class="fa ${badge.status ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                    ${badge.status ? 'Active' : 'Inactive'}
                </span>
                ${expirationInfo}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-outline-primary edit-badge" data-id="${badge.id}">
                        <i class="fa fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-badge" data-id="${badge.id}">
                        <i class="fa fa-trash"></i> Delete
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
    
    document.querySelectorAll('.delete-badge').forEach(button => {
        button.addEventListener('click', handleDeleteBadge);
    });
    
    document.querySelectorAll('.preview-badge').forEach(button => {
        button.addEventListener('click', handlePreviewBadge);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Add new badge button
    document.getElementById('addBadgeBtn').addEventListener('click', () => {
        resetForm();
        badgeFormModalLabel.textContent = 'Add New Badge';
        currentBadgeId = null;
    });
    
    // Default icon button
    defaultIconBtn.addEventListener('click', () => {
        badgeIconInput.value = '';
        iconPreview.innerHTML = '<i class="fa fa-award fa-2x"></i>';
    });
    
    // Badge icon upload
    badgeIconInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                iconPreview.innerHTML = `<img src="${e.target.result}" alt="Badge Icon">`;
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    });
    
    // Constraint type radio buttons
    constraintTypeInputs.forEach(input => {
        input.addEventListener('change', () => {
            // Hide all constraint details
            document.querySelectorAll('.constraint-details').forEach(el => {
                el.classList.add('d-none');
            });
            
            // Show the selected constraint details
            if (input.checked && input.value !== 'manual') {
                document.querySelector(`.${input.value}-constraint`).classList.remove('d-none');
            }
        });
    });
    
    // Expiration checkbox
    hasExpirationCheckbox.addEventListener('change', () => {
        if (hasExpirationCheckbox.checked) {
            expirationDateContainer.classList.remove('d-none');
        } else {
            expirationDateContainer.classList.add('d-none');
            expirationDateInput.value = '';
        }
    });
    
    // Save badge button
    saveBadgeBtn.addEventListener('click', saveBadge);
    
    // Confirm delete button
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDeleteBadge);
}

// Handle edit badge
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
        document.getElementById(`${constraintType}Constraint`).checked = true;
        
        // Show constraint details if applicable
        if (constraintType !== 'manual') {
            document.querySelector(`.${constraintType}-constraint`).classList.remove('d-none');
            
            // Set constraint details
            if (constraintType === 'points') {
                pointsThresholdInput.value = badge.constraint.details.threshold;
            } else if (constraintType === 'events') {
                eventsCountInput.value = badge.constraint.details.count;
            } else if (constraintType === 'ranking') {
                rankingPositionInput.value = badge.constraint.details.position;
                rankingTypeSelect.value = badge.constraint.details.type;
            }
        }
        
        // Set expiration date if applicable
        if (badge.expiration) {
            hasExpirationCheckbox.checked = true;
            expirationDateContainer.classList.remove('d-none');
            expirationDateInput.value = badge.expiration;
        }
        
        // Set status
        badgeStatusCheckbox.checked = badge.status;
        
        badgeFormModal.show();
    }
}

// Handle delete badge
function handleDeleteBadge(e) {
    const badgeId = parseInt(e.currentTarget.dataset.id);
    const badge = badges.find(b => b.id === badgeId);
    
    if (badge) {
        document.getElementById('deleteBadgeName').textContent = badge.name;
        currentBadgeId = badgeId;
        deleteBadgeModal.show();
    }
}

// Confirm delete badge
function confirmDeleteBadge() {
    if (currentBadgeId) {
        badges = badges.filter(badge => badge.id !== currentBadgeId);
        renderBadgeTable();
        deleteBadgeModal.hide();
        currentBadgeId = null;
    }
}

// Handle preview badge
function handlePreviewBadge(e) {
    const badgeId = parseInt(e.currentTarget.dataset.id);
    const badge = badges.find(b => b.id === badgeId);
    
    if (badge) {
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

// Save badge data
function saveBadge() {
    // Validate form
    if (!badgeNameInput.value.trim()) {
        alert('Please enter a badge name');
        return;
    }
    
    // Get selected constraint type
    let selectedConstraintType = null;
    constraintTypeInputs.forEach(input => {
        if (input.checked) {
            selectedConstraintType = input.value;
        }
    });
    
    if (!selectedConstraintType) {
        alert('Please select a constraint type');
        return;
    }
    
    // Build constraint object
    let constraint = {
        type: selectedConstraintType
    };
    
    // Add constraint details if applicable
    if (selectedConstraintType === 'points') {
        if (!pointsThresholdInput.value || pointsThresholdInput.value <= 0) {
            alert('Please enter a valid points threshold');
            return;
        }
        constraint.details = {
            threshold: parseInt(pointsThresholdInput.value)
        };
    } else if (selectedConstraintType === 'events') {
        if (!eventsCountInput.value || eventsCountInput.value <= 0) {
            alert('Please enter a valid events count');
            return;
        }
        constraint.details = {
            count: parseInt(eventsCountInput.value)
        };
    } else if (selectedConstraintType === 'ranking') {
        if (!rankingPositionInput.value || rankingPositionInput.value <= 0) {
            alert('Please enter a valid ranking position');
            return;
        }
        constraint.details = {
            position: parseInt(rankingPositionInput.value),
            type: rankingTypeSelect.value
        };
    }
    
    // Get expiration date if applicable
    let expiration = null;
    if (hasExpirationCheckbox.checked && expirationDateInput.value) {
        expiration = expirationDateInput.value;
    }
    
    // Create badge object
    const badgeData = {
        name: badgeNameInput.value.trim(),
        description: badgeDescriptionInput.value.trim(),
        iconSrc: iconPreview.querySelector('img') ? iconPreview.querySelector('img').src : null,
        constraint: constraint,
        status: badgeStatusCheckbox.checked,
        expiration: expiration
    };
    
    // Update existing badge or add new badge
    if (currentBadgeId) {
        // Update existing badge
        const index = badges.findIndex(badge => badge.id === currentBadgeId);
        if (index !== -1) {
            badgeData.id = currentBadgeId;
            badges[index] = badgeData;
        }
    } else {
        // Add new badge
        badgeData.id = nextId++;
        badges.push(badgeData);
    }
    
    // Update the table and close the modal
    renderBadgeTable();
    badgeFormModal.hide();
    
    // Show success message
    showToast(`Badge "${badgeData.name}" was successfully ${currentBadgeId ? 'updated' : 'created'}.`);
    
    // Reset the form and current badge ID
    resetForm();
    currentBadgeId = null;
}

// Reset form to default values
function resetForm() {
    badgeIdInput.value = '';
    badgeNameInput.value = '';
    badgeDescriptionInput.value = '';
    badgeIconInput.value = '';
    iconPreview.innerHTML = '<i class="fa fa-award fa-2x"></i>';
    
    // Reset constraint type radios
    constraintTypeInputs.forEach(input => {
        input.checked = false;
    });
    document.getElementById('manualConstraint').checked = true;
    
    // Hide all constraint details
    document.querySelectorAll('.constraint-details').forEach(el => {
        el.classList.add('d-none');
    });
    
    // Reset constraint inputs
    pointsThresholdInput.value = '';
    eventsCountInput.value = '';
    rankingPositionInput.value = '';
    rankingTypeSelect.value = 'overall';
    
    // Reset expiration
    hasExpirationCheckbox.checked = false;
    expirationDateContainer.classList.add('d-none');
    expirationDateInput.value = '';
    
    // Reset status
    badgeStatusCheckbox.checked = true;
}

// Get constraint summary for display
function getConstraintSummary(constraint) {
    switch (constraint.type) {
        case 'points':
            return `Points Threshold: ${constraint.details.threshold}`;
        case 'events':
            return `Events: ${constraint.details.count}+ participations`;
        case 'ranking':
            return `Ranking: Top ${constraint.details.position} in ${constraint.details.type} leaderboard`;
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

// Show toast notification (simple implementation)
function showToast(message) {
    // Check if toast container exists, if not create it
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = `toast-${Date.now()}`;
    const toastElement = document.createElement('div');
    toastElement.className = 'toast show';
    toastElement.id = toastId;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    
    toastElement.innerHTML = `
        <div class="toast-header">
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
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 3000 });
    toast.show();
    
    // Remove toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}
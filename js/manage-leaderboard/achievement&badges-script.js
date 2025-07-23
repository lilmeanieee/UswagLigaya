//this is for fetching the badges and achievements from the server -dbms
let badges = [];
let currentBadgeId = null;

// DOM elements for table display
const badgeTableBody = document.getElementById('badgeTableBody');

// Modal elements for preview and archive
const badgePreviewModal = new bootstrap.Modal(document.getElementById('badgePreviewModal'));
const archiveBadgeModal = new bootstrap.Modal(document.getElementById('archiveBadgeModal'));

document.addEventListener('DOMContentLoaded', function () {
    loadBadgesFromServer(); // fetch from backend
});

// Load badge data from backend
function loadBadgesFromServer() {
    fetch('/UswagLigaya/php-handlers/manage-leaderboard/fetch-badges.php')
        .then(response => response.json())
        .then(data => {
            badges = data;
            renderBadgeTable();
        })
        .catch(error => {
            console.error('Error loading badges:', error);
            showToast('Failed to load badges from the server.');
        });
}

function renderBadgeTable() {
    if (!badgeTableBody) return;
    
    badgeTableBody.innerHTML = '';

    badges.forEach(badge => {
        const row = document.createElement('tr');
        let constraintSummary = getConstraintSummary(badge.constraint);
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
    document.querySelectorAll('.edit-badge').forEach(btn => btn.addEventListener('click', handleEditBadge));
    document.querySelectorAll('.archive-badge').forEach(btn => btn.addEventListener('click', handleArchiveBadge));
    document.querySelectorAll('.preview-badge').forEach(btn => btn.addEventListener('click', handlePreviewBadge));
}

// Handle edit badge - triggers the badge form modal
function handleEditBadge(e) {
    const badgeId = parseInt(e.currentTarget.dataset.id);
    const badge = badges.find(b => b.id === badgeId);
    
    if (badge && typeof populateBadgeForm === 'function') {
        // Call the form population function from badge-management.js
        populateBadgeForm(badge);
    }
}

// Handle archive badge
function handleArchiveBadge(e) {
    const badgeId = parseInt(e.currentTarget.dataset.id);
    const badge = badges.find(b => b.id === badgeId);
    
    if (badge) {
        document.getElementById('archiveBadgeName').textContent = badge.name;
        currentBadgeId = badgeId;
        archiveBadgeModal.show();
    }
}

// Confirm archive badge - sends request to server
function confirmArchiveBadge() {
    if (currentBadgeId) {
        fetch('/UswagLigaya/php-handlers/manage-leaderboard/archive-badge.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ badgeId: currentBadgeId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Remove badge from local array
                badges = badges.filter(badge => badge.id !== currentBadgeId);
                renderBadgeTable();
                archiveBadgeModal.hide();
                showToast('Badge archived successfully');
            } else {
                showToast('Failed to archive badge: ' + data.error);
            }
        })
        .catch(error => {
            console.error('Error archiving badge:', error);
            showToast('An error occurred while archiving the badge');
        })
        .finally(() => {
            currentBadgeId = null;
        });
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
        toastContainer.style.zIndex = '9999';
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

// Add event listener for confirm archive button
document.addEventListener('DOMContentLoaded', function() {
    const confirmArchiveBtn = document.getElementById('confirmArchiveBtn');
    if (confirmArchiveBtn) {
        confirmArchiveBtn.addEventListener('click', confirmArchiveBadge);
    }
});

// Function to refresh badge table after successful add/update
function refreshBadgeTable() {
    loadBadgesFromServer();
}
// all and unread buttons responsive behavior
document.querySelectorAll('.btn-group .btn').forEach(button => {
    button.addEventListener('click', function () {
      document.querySelectorAll('.btn-group .btn').forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
    });
  });

//   checkbox for selecting individual notifications behaviior
document.addEventListener("DOMContentLoaded", function () {
    const selectAllCheckbox = document.getElementById("selectAllCheckbox");
    const individualCheckboxes = document.querySelectorAll(".individual-checkbox");
    const markAsReadBtn = document.getElementById("markAsReadBtn");

    function updateMarkAsReadVisibility() {
        const anyChecked = Array.from(individualCheckboxes).some(cb => cb.checked);
        markAsReadBtn.classList.toggle("d-none", !anyChecked);
    }

    // Handle "Select All"
    selectAllCheckbox.addEventListener("change", function () {
        individualCheckboxes.forEach(cb => {
            cb.checked = selectAllCheckbox.checked;
        });
        updateMarkAsReadVisibility();
    });

    // Handle individual checkbox click
    individualCheckboxes.forEach(cb => {
        cb.addEventListener("change", () => {
            updateMarkAsReadVisibility();

            // Uncheck "Select All" if any item is unchecked
            if (!cb.checked) {
                selectAllCheckbox.checked = false;
            }

            // Re-check "Select All" only if all are selected
            const allChecked = Array.from(individualCheckboxes).every(c => c.checked);
            selectAllCheckbox.checked = allChecked;
        });
    });
});




// Notification System Demo
// Global variables
let currentUserType = 'resident';
let notifications = [];
let notificationCounter = 0;

// Sample notification data
const sampleNotifications = {
    resident: [
        {
            id: 1,
            type: 'announcement',
            title: 'New Barangay Event',
            body: 'Join us for the annual Barangay Festival this Saturday at 6:00 PM.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            read: false,
            priority: 'medium',
            icon: 'fas fa-bullhorn'
        },
        {
            id: 2,
            type: 'document',
            title: 'Document Request Update',
            body: 'Your Barangay Clearance is ready for pickup. Please bring valid ID.',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            read: false,
            priority: 'high',
            icon: 'fas fa-file-alt'
        },
        {
            id: 3,
            type: 'gamification',
            title: 'Points Earned!',
            body: 'You earned 50 points for attending the community meeting.',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            read: true,
            priority: 'low',
            icon: 'fas fa-trophy'
        }
    ]
};

// Initialize notifications
function initializeNotifications() {
    notifications = [...sampleNotifications[currentUserType]];
    notificationCounter = Math.max(...notifications.map(n => n.id)) + 1;
    updateNotificationUI();
}


// Format time ago
function formatTimeAgo(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
        return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`;
    } else if (hours < 24) {
        return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else {
        return days === 1 ? '1 day ago' : `${days} days ago`;
    }
}

// Get notification icon class
function getNotificationIconClass(type) {
    const iconMap = {
        announcement: 'fas fa-bullhorn',
        document: 'fas fa-file-alt',
        complaint: 'fas fa-exclamation-triangle',
        gamification: 'fas fa-trophy',
        system: 'fas fa-cog'
    };
    return iconMap[type] || 'fas fa-bell';
}

// Create notification HTML
function createNotificationHTML(notification, isPreview = false) {
    const timeAgo = formatTimeAgo(notification.timestamp);
    const iconClass = getNotificationIconClass(notification.type);
    
    return `
        <div class="notification-item ${notification.read ? 'read' : 'unread'}" 
             data-id="${notification.id}" 
             onclick="markAsRead(${notification.id})">
            <div class="d-flex">
                <div class="notification-icon icon-${notification.type}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="notification-header">
                        <div class="notification-title">${notification.title}</div>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                    <div class="notification-body">${notification.body}</div>
                    ${!isPreview ? `
                        <div class="notification-meta">
                            <span class="notification-type type-${notification.type}">
                                ${notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                            </span>
                            <span class="notification-priority priority-${notification.priority}">
                                ${notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                            </span>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// Update notification UI
function updateNotificationUI() {
    const notificationList = document.getElementById('notificationList');
    const notificationCount = document.getElementById('notificationCount');
    const totalNotifications = document.getElementById('totalNotifications');
    const unreadNotifications = document.getElementById('unreadNotifications');
    
    // Get recent notifications (last 5 for dropdown)
    const recentNotifications = notifications
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);
    
    // Update dropdown
    if (recentNotifications.length === 0) {
        notificationList.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-bell-slash"></i>
                <h6>No notifications</h6>
                <p>You're all caught up!</p>
            </div>
        `;
    } else {
        notificationList.innerHTML = recentNotifications
            .map(notification => createNotificationHTML(notification, true))
            .join('');
    }
    
    // Update counts
    const unreadCount = notifications.filter(n => !n.read).length;
    notificationCount.textContent = unreadCount;
    notificationCount.style.display = unreadCount > 0 ? 'inline' : 'none';
    
    totalNotifications.textContent = notifications.length;
    unreadNotifications.textContent = unreadCount;
}

// Mark notification as read
function markAsRead(notificationId) {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        updateNotificationUI();
    }
}

// Mark all notifications as read
function markAllAsRead() {
    notifications.forEach(notification => {
        notification.read = true;
    });
    updateNotificationUI();
}

// Show all notifications modal
function showAllNotifications() {
    const modal = new bootstrap.Modal(document.getElementById('allNotificationsModal'));
    updateAllNotificationsList();
    modal.show();
}

// Update all notifications list
function updateAllNotificationsList() {
    const allNotificationsList = document.getElementById('allNotificationsList');
    const filterType = document.getElementById('filterType').value;
    const filterStatus = document.getElementById('filterStatus').value;
    
    let filteredNotifications = notifications;
    
    // Apply filters
    if (filterType !== 'all') {
        filteredNotifications = filteredNotifications.filter(n => n.type === filterType);
    }
    
    if (filterStatus !== 'all') {
        filteredNotifications = filteredNotifications.filter(n => 
            filterStatus === 'read' ? n.read : !n.read
        );
    }
    
    // Sort by timestamp (newest first)
    filteredNotifications.sort((a, b) => b.timestamp - a.timestamp);
    
    if (filteredNotifications.length === 0) {
        allNotificationsList.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-filter"></i>
                <h6>No notifications found</h6>
                <p>Try adjusting your filters.</p>
            </div>
        `;
    } else {
        allNotificationsList.innerHTML = filteredNotifications
            .map(notification => createNotificationHTML(notification, false))
            .join('');
    }
}


// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
        toast.remove();
    });
}

// Create toast container
function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    return container;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeNotifications();
    
    // Add event listeners for filter changes
    document.getElementById('filterType').addEventListener('change', updateAllNotificationsList);
    document.getElementById('filterStatus').addEventListener('change', updateAllNotificationsList);
    
    // Simulate real-time notifications (for demo purposes)
    setInterval(() => {
        if (Math.random() < 0.1) { // 10% chance every 5 seconds
            addSampleNotification();
        }
    }, 5000);
});

// Export functions for global access
window.switchUserType = switchUserType;
window.markAsRead = markAsRead;
window.markAllAsRead = markAllAsRead;
window.showAllNotifications = showAllNotifications;
window.addSampleNotification = addSampleNotification;
window.simulateNewSubmission = simulateNewSubmission;
window.simulateStatusUpdate = simulateStatusUpdate;
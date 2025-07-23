// badge-assignment.js
class BadgeAssignment {
    constructor() {
        this.currentResidentId = null;
        this.selectedBadges = [];
        this.badges = [];
        this.init();
    }

    init() {
        this.createDropdownHTML();
        this.bindEvents();
    }

    createDropdownHTML() {
        // Create the dropdown HTML structure and append to body
        const dropdownHTML = `
            <div id="badgeDropdownOverlay" class="badge-dropdown-overlay" style="display: none;">
                <div id="badgeDropdownContainer" class="badge-dropdown-container">
                    <div class="badge-dropdown-header">
                        <h5 class="mb-1">Assign Badges</h5>
                        <p class="text-muted small mb-0">Select badges to assign to resident</p>
                        <button type="button" class="btn-close" id="closeBadgeDropdown"></button>
                    </div>
                    <div class="badge-dropdown-body">
                        <div id="badgeLoadingSpinner" class="text-center p-4">
                            <div class="spinner-border spinner-border-sm" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-2 mb-0">Loading badges...</p>
                        </div>
                        <div id="badgesList" style="display: none;"></div>
                    </div>
                    <div class="badge-comments-section" style="padding: 1rem; border-top: 1px solid #dee2e6; display: none;">
                        <label for="badgeComments" class="form-label small">Comments/Remarks (Optional)</label>
                        <textarea 
                            id="badgeComments" 
                            class="form-control form-control-sm" 
                            rows="3" 
                            placeholder="Enter reason for manual badge assignment..."
                            maxlength="500">
                        </textarea>
                        <small class="text-muted">This will be recorded in the system logs</small>
                    </div>
                    <div id="badgeDropdownFooter" class="badge-dropdown-footer" style="display: none;">
                        <button type="button" class="btn btn-secondary btn-sm" id="cancelBadgeAssignment">Cancel</button>
                        <button type="button" class="btn btn-success btn-sm" id="confirmBadgeAssignment" disabled>
                            Assign <span id="badgeCount">0</span> Badge(s)
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Add CSS styles
        const styles = `
            <style>
                .badge-dropdown-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    z-index: 1050;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .badge-dropdown-container {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                    max-width: 400px;
                    width: 90%;
                    max-height: 80vh;
                    display: flex;
                    flex-direction: column;
                }

                .badge-dropdown-header {
                    padding: 1rem;
                    border-bottom: 1px solid #dee2e6;
                    position: relative;
                }

                .badge-dropdown-header .btn-close {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                }

                .badge-dropdown-body {
                    flex: 1;
                    overflow-y: auto;
                    max-height: 400px;
                }

                .badge-item {
                    padding: 0.75rem;
                    border-bottom: 1px solid #f8f9fa;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .badge-item:hover:not(.awarded) {
                    background-color: #f8f9fa;
                }

                .badge-item.selected {
                    background-color: #e3f2fd;
                    border-left: 3px solid #2196f3;
                }

                .badge-item.awarded {
                    background-color: #f8f9fa;
                    opacity: 0.6;
                    cursor: not-allowed;
                    border-left: 3px solid #28a745;
                }

                .badge-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 0.875rem;
                    flex-shrink: 0;
                    position: relative;
                }

                .badge-icon.awarded::after {
                    content: '✓';
                    position: absolute;
                    bottom: -2px;
                    right: -2px;
                    background-color: #28a745;
                    color: white;
                    border-radius: 50%;
                    width: 16px;
                    height: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    font-weight: bold;
                    border: 2px solid white;
                }

                .badge-info {
                    flex: 1;
                    min-width: 0;
                }

                .badge-name {
                    font-weight: 500;
                    font-size: 0.875rem;
                    margin-bottom: 0.25rem;
                }

                .badge-name.awarded {
                    color: #28a745;
                }

                .badge-description {
                    font-size: 0.75rem;
                    color: #6c757d;
                    margin: 0;
                }

                .badge-selected-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background-color: #28a745;
                    flex-shrink: 0;
                }

                .badge-awarded-label {
                    font-size: 0.625rem;
                    background-color: #28a745;
                    color: white;
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.25rem;
                    text-transform: uppercase;
                    font-weight: 500;
                    letter-spacing: 0.5px;
                }

                .badge-comments-section {
                    padding: 1rem;
                    border-top: 1px solid #dee2e6;
                }

                .badge-comments-section textarea {
                    resize: vertical;
                    min-height: 60px;
                }

                .badge-dropdown-footer {
                    padding: 1rem;
                    border-top: 1px solid #dee2e6;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                #confirmBadgeAssignment:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* Custom Toast Styles (Fallback) */
                .custom-toast-container {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 9999;
                    max-width: 350px;
                }

                .custom-toast {
                    display: none;
                    background: white;
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    border-left: 4px solid #28a745;
                    position: relative;
                    transform: translateX(100%);
                    transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
                    opacity: 0;
                }

                .custom-toast.show {
                    display: block;
                    transform: translateX(0);
                    opacity: 1;
                }

                .custom-toast.error {
                    border-left-color: #dc3545;
                }

                .custom-toast-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .custom-toast-title {
                    font-weight: 600;
                    color: #333;
                    margin: 0;
                    font-size: 14px;
                }

                .custom-toast-close {
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    color: #999;
                    padding: 0;
                    line-height: 1;
                }

                .custom-toast-close:hover {
                    color: #666;
                }

                .custom-toast-body {
                    color: #666;
                    font-size: 13px;
                    line-height: 1.4;
                }

                .custom-toast-icon {
                    display: inline-block;
                    width: 16px;
                    height: 16px;
                    margin-right: 8px;
                    border-radius: 50%;
                    text-align: center;
                    line-height: 16px;
                    font-size: 10px;
                    color: white;
                    background-color: #28a745;
                }

                .custom-toast.error .custom-toast-icon {
                    background-color: #dc3545;
                }
            </style>
        `;

        // Add styles to head
        document.head.insertAdjacentHTML('beforeend', styles);
        
        // Add dropdown to body
        document.body.insertAdjacentHTML('beforeend', dropdownHTML);
    }

    bindEvents() {
        // Close dropdown events
        document.getElementById('closeBadgeDropdown').addEventListener('click', () => this.closeDropdown());
        document.getElementById('cancelBadgeAssignment').addEventListener('click', () => this.closeDropdown());
        document.getElementById('badgeDropdownOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'badgeDropdownOverlay') {
                this.closeDropdown();
            }
        });

        // Confirm assignment
        document.getElementById('confirmBadgeAssignment').addEventListener('click', () => this.confirmAssignment());

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('badgeDropdownOverlay').style.display !== 'none') {
                this.closeDropdown();
            }
        });
    }

    async openDropdown(residentId) {
        this.currentResidentId = residentId;
        this.selectedBadges = [];
        
        // Show overlay and loading
        document.getElementById('badgeDropdownOverlay').style.display = 'flex';
        document.getElementById('badgeLoadingSpinner').style.display = 'block';
        document.getElementById('badgesList').style.display = 'none';
        document.getElementById('badgeDropdownFooter').style.display = 'none';
        document.querySelector('.badge-comments-section').style.display = 'none';

        // Clear previous comments
        document.getElementById('badgeComments').value = '';

        try {
            await this.loadBadges();
            this.renderBadges();
            
            // Hide loading and show content
            document.getElementById('badgeLoadingSpinner').style.display = 'none';
            document.getElementById('badgesList').style.display = 'block';
            
            // Only show footer and comments if there are badges available
            if (this.badges.length > 0) {
                document.querySelector('.badge-comments-section').style.display = 'block';
                document.getElementById('badgeDropdownFooter').style.display = 'flex';
                this.updateFooter(); // Initialize footer state
            }
        } catch (error) {
            console.error('Error loading badges:', error);
            this.showToast('Failed to load badges. Please try again.', 'error');
        }
    }

    async loadBadges() {
        const response = await fetch(`/UswagLigaya/php-handlers/manage-leaderboard/get-manual-badges.php?resident_id=${this.currentResidentId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch badges');
        }
        this.badges = await response.json();
    }

    renderBadges() {
        const badgesList = document.getElementById('badgesList');
        
        if (this.badges.length === 0) {
            badgesList.innerHTML = '<div class="text-center p-4 text-muted">No manual badges available</div>';
            return;
        }

        badgesList.innerHTML = this.badges.map(badge => {
            const isSelected = this.selectedBadges.includes(badge.badge_id);
            const isAwarded = badge.is_awarded;
            const badgeColor = this.getBadgeColor(badge.badge_name);
            
            return `
                <div class="badge-item ${isSelected ? 'selected' : ''} ${isAwarded ? 'awarded' : ''}" 
                     data-badge-id="${badge.badge_id}" 
                     data-awarded="${isAwarded}">
                    <div class="badge-icon ${isAwarded ? 'awarded' : ''}" style="background-color: ${badgeColor}">
                        <img src="${badge.badge_icon_url}" alt="badge icon" style="width: 100%; height: 100%; border-radius: 50%;">
                    </div>
                    <div class="badge-info">
                        <div class="badge-name ${isAwarded ? 'awarded' : ''}">${badge.badge_name}</div>
                        <p class="badge-description">${badge.badge_description || 'No description available'}</p>
                    </div>
                    ${isAwarded ? '<div class="badge-awarded-label">Awarded</div>' : 
                      (isSelected ? '<div class="badge-selected-indicator"></div>' : '')}
                </div>
            `;
        }).join('');

        // Add click events to badge items (only for non-awarded badges)
        badgesList.querySelectorAll('.badge-item').forEach(item => {
            const isAwarded = item.dataset.awarded === 'true';
            
            if (!isAwarded) {
                item.addEventListener('click', (e) => {
                    const badgeId = parseInt(item.dataset.badgeId);
                    this.toggleBadgeSelection(badgeId);
                    this.renderBadges(); // Re-render to update selection state
                    this.updateFooter();
                });
            }
        });
    }

    toggleBadgeSelection(badgeId) {
        const index = this.selectedBadges.indexOf(badgeId);
        if (index === -1) {
            this.selectedBadges.push(badgeId);
        } else {
            this.selectedBadges.splice(index, 1);
        }
    }

    updateFooter() {
        const badgeCount = document.getElementById('badgeCount');
        const confirmBtn = document.getElementById('confirmBadgeAssignment');

        // Update the badge count in the button
        badgeCount.textContent = this.selectedBadges.length;

        // Enable or disable the Assign button based on selection
        confirmBtn.disabled = this.selectedBadges.length === 0;
        
        // Update button text based on selection
        if (this.selectedBadges.length === 0) {
            confirmBtn.innerHTML = 'Assign <span id="badgeCount">0</span> Badge(s)';
        } else {
            confirmBtn.innerHTML = `Assign <span id="badgeCount">${this.selectedBadges.length}</span> Badge(s)`;
        }
    }

    async confirmAssignment() {
        if (this.selectedBadges.length === 0) return;

        const confirmBtn = document.getElementById('confirmBadgeAssignment');
        const originalBtnText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Assigning...';
        confirmBtn.disabled = true;

        const comment = document.getElementById('badgeComments').value;

        try {
            const response = await fetch('/UswagLigaya/php-handlers/manage-leaderboard/assign-manual-badges.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resident_id: this.currentResidentId,
                    badge_ids: this.selectedBadges,
                    remarks: comment
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showToast(`Successfully assigned ${this.selectedBadges.length} badge(s)!`, 'success');
                
                // Reset button to normal state
                confirmBtn.innerHTML = originalBtnText;
                confirmBtn.disabled = false;
                
                // Close dropdown after a short delay to show the toast
                setTimeout(() => {
                    this.closeDropdown();
                }, 500);
                
                // Optional: Refresh the leaderboard or update the UI
                // fetchLeaderboard();
            } else {
                throw new Error(result.message || 'Failed to assign badges');
            }

        } catch (error) {
            console.error('Error assigning badges:', error);
            this.showToast('Failed to assign badges. Please try again.', 'error');

            // Reset button
            confirmBtn.innerHTML = originalBtnText;
            confirmBtn.disabled = this.selectedBadges.length === 0;
        }
    }

    closeDropdown() {
        document.getElementById('badgeDropdownOverlay').style.display = 'none';
        this.currentResidentId = null;
        this.selectedBadges = [];
    }

    getBadgeColor(badgeName) {
        // Simple color assignment based on badge name
        const colors = [
            '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', 
            '#fd7e14', '#20c997', '#6c757d', '#343a40', '#17a2b8'
        ];
        let hash = 0;
        for (let i = 0; i < badgeName.length; i++) {
            hash = badgeName.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }

    showToast(message, type = 'success') {
        // Create custom toast (fallback implementation)
        this.createCustomToast(message, type);
    }

    createCustomToast(message, type = 'success') {
        // Check if toast container exists, if not create it
        let toastContainer = document.getElementById('customToastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'customToastContainer';
            toastContainer.className = 'custom-toast-container';
            document.body.appendChild(toastContainer);
        }
        
        // Create toast element
        const toastId = `custom-toast-${Date.now()}`;
        const toastElement = document.createElement('div');
        toastElement.className = `custom-toast ${type === 'error' ? 'error' : ''}`;
        toastElement.id = toastId;
        
        const icon = type === 'error' ? '✕' : '✓';
        
        toastElement.innerHTML = `
            <div class="custom-toast-header">
                <div class="custom-toast-title">
                    <span class="custom-toast-icon">${icon}</span>
                    Badge Assignment
                </div>
                <button type="button" class="custom-toast-close" onclick="this.closest('.custom-toast').remove()">&times;</button>
            </div>
            <div class="custom-toast-body">
                ${message}
            </div>
        `;
        
        // Add toast to container
        toastContainer.appendChild(toastElement);
        
        // Show toast with animation
        setTimeout(() => {
            toastElement.classList.add('show');
        }, 100);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            toastElement.classList.remove('show');
            setTimeout(() => {
                if (toastElement.parentNode) {
                    toastElement.remove();
                }
            }, 300); // Allow fade out animation
        }, 4000);
    }

    showSuccess(message) {
        // Deprecated - use showToast instead
        this.showToast(message, 'success');
    }

    showError(message) {
        // Deprecated - use showToast instead
        this.showToast(message, 'error');
    }
}

// Initialize badge assignment when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.badgeAssignment = new BadgeAssignment();
});

// Update the assignManualBadge function in your leaderboard.js
function assignManualBadge(residentId) {
    if (window.badgeAssignment) {
        window.badgeAssignment.openDropdown(residentId);
    } else {
        console.error('Badge assignment system not initialized');
    }
}
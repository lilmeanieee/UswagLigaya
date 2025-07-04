// Resident Points Manager - Updated to match your dashboard approach
class ResidentPointsManager {
    constructor() {
        this.resident_id = null;
        this.points_data = null;
        this.init();
    }

    async init() {
        // Get resident_id from localStorage (matching your dashboard approach)
        this.resident_id = this.getResidentId();
        
        if (this.resident_id) {
            await this.loadPoints();
            this.updatePointsDisplay();
            // Set up auto-refresh every 30 seconds
            setInterval(() => this.refreshPoints(), 30000);
        } else {
            console.error('Resident ID not found');
            this.showError('Unable to load resident data');
        }
    }

    getResidentId() {
        // Get resident_id from localStorage userData (matching your dashboard)
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (userData && userData.resident_id) {
            return userData.resident_id;
        }
        
        // Fallback: Try to get from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('resident_id')) {
            return urlParams.get('resident_id');
        }
        
        // Fallback: From a global variable
        if (typeof window.resident_id !== 'undefined') {
            return window.resident_id;
        }
        
        return null;
    }

    async loadPoints() {
        try {
            console.log('Attempting to load points for resident_id:', this.resident_id);
            
            // Use the same endpoint as your dashboard
            const response = await fetch('/UswagLigaya/php-handlers/get-resident-data.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `resident_id=${encodeURIComponent(this.resident_id)}`
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (data.success) {
                this.points_data = data.resident;
                console.log('Points data loaded:', this.points_data);
            } else {
                throw new Error(data.error || 'Failed to load points data');
            }

        } catch (error) {
            console.error('Error loading points:', error);
            this.showError('Failed to load points data');
        }
    }

    updatePointsDisplay() {
        if (!this.points_data) return;

        // Update Credit Points
        const creditPointsElement = document.getElementById('creditPoints');
        if (creditPointsElement) {
            creditPointsElement.textContent = this.points_data.creditPointsFormatted || this.formatNumber(this.points_data.credit_points);
        }

        // Update Redeemable Points
        const redeemablePointsElement = document.getElementById('redeemablePoints');
        if (redeemablePointsElement) {
            redeemablePointsElement.textContent = this.points_data.redeemablePointsFormatted || this.formatNumber(this.points_data.redeemable_points);
        }

        // Update Total Participated
        const totalParticipatedElement = document.getElementById('totalParticipated');
        if (totalParticipatedElement) {
            totalParticipatedElement.textContent = this.points_data.totalParticipatedFormatted || this.formatNumber(this.points_data.total_participated);
        }

        // Update any other elements that might show points
        this.updateOtherPointsElements();

        // Trigger custom event for other components that might need to know about points update
        const event = new CustomEvent('pointsUpdated', {
            detail: {
                credit_points: this.points_data.credit_points,
                redeemable_points: this.points_data.redeemable_points,
                resident_data: this.points_data
            }
        });
        document.dispatchEvent(event);
    }

    updateOtherPointsElements() {
        // Update any other elements that might show points with different IDs
        const alternativeSelectors = [
            '#credit-points',
            '#redeemable-points',
            '.credit-points-value',
            '.redeemable-points-value',
            '[data-points-type="credit"]',
            '[data-points-type="redeemable"]'
        ];

        alternativeSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (selector.includes('credit')) {
                    element.textContent = this.points_data.creditPointsFormatted || this.formatNumber(this.points_data.credit_points);
                } else if (selector.includes('redeemable')) {
                    element.textContent = this.points_data.redeemablePointsFormatted || this.formatNumber(this.points_data.redeemable_points);
                } else if (element.getAttribute('data-points-type') === 'credit') {
                    element.textContent = this.points_data.creditPointsFormatted || this.formatNumber(this.points_data.credit_points);
                } else if (element.getAttribute('data-points-type') === 'redeemable') {
                    element.textContent = this.points_data.redeemablePointsFormatted || this.formatNumber(this.points_data.redeemable_points);
                }
            });
        });
    }

    formatNumber(number) {
        return new Intl.NumberFormat().format(number || 0);
    }

    async refreshPoints() {
        await this.loadPoints();
        this.updatePointsDisplay();
    }

    showError(message) {
        console.error(message);
        
        // Show error in points display
        const creditPointsElement = document.getElementById('creditPoints');
        const redeemablePointsElement = document.getElementById('redeemablePoints');
        
        if (creditPointsElement) {
            creditPointsElement.textContent = '--';
            creditPointsElement.title = message;
        }
        
        if (redeemablePointsElement) {
            redeemablePointsElement.textContent = '--';
            redeemablePointsElement.title = message;
        }
    }

    // Public method to manually refresh points (can be called from outside)
    async refresh() {
        await this.refreshPoints();
    }

    // Public method to get current points data
    getPointsData() {
        return this.points_data;
    }

    // Public method to set resident ID (useful if it's determined later)
    setResidentId(resident_id) {
        this.resident_id = resident_id;
        this.init();
    }
}

// Initialize the points manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure localStorage is ready
    setTimeout(() => {
        window.residentPointsManager = new ResidentPointsManager();
    }, 100);
});

// Alternative initialization function that can be called manually
function initializePointsDisplay(resident_id = null) {
    if (resident_id) {
        // Update localStorage if a new resident_id is provided
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        userData.resident_id = resident_id;
        localStorage.setItem('userData', JSON.stringify(userData));
    }
    
    if (!window.residentPointsManager) {
        window.residentPointsManager = new ResidentPointsManager();
    } else {
        if (resident_id) {
            window.residentPointsManager.setResidentId(resident_id);
        } else {
            window.residentPointsManager.refresh();
        }
    }
}

// Function to manually update points (useful after actions that change points)
function refreshPoints() {
    if (window.residentPointsManager) {
        window.residentPointsManager.refresh();
    }
}
// JavaScript functionality
class ComplaintSystem {
    constructor() {
        this.complaints = this.loadComplaints();
        this.currentComplaintId = null;
        this.selectedRating = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadMyComplaints();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('complaintForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitComplaint();
        });

        // File upload
        const fileUploadArea = document.getElementById('fileUploadArea');
        const fileInput = document.getElementById('fileInput');

        fileUploadArea.addEventListener('click', () => fileInput.click());
        fileUploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            fileUploadArea.classList.add('dragover');
        });
        fileUploadArea.addEventListener('dragleave', () => {
            fileUploadArea.classList.remove('dragover');
        });
        fileUploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            fileUploadArea.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });

        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        // Follow-up submission
        document.getElementById('submitFollowUp').addEventListener('click', () => {
            this.submitFollowUp();
        });

        // Feedback submission
        document.getElementById('submitFeedback').addEventListener('click', () => {
            this.submitFeedback();
        });

        // Star rating
        this.setupStarRating();

        // Tab switching
        document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
            tab.addEventListener('shown.bs.tab', (e) => {
                if (e.target.id === 'my-complaints-tab') {
                    this.loadMyComplaints();
                }
            });
        });
    }

    setupStarRating() {
        const stars = document.querySelectorAll('.star');
        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(star.getAttribute('data-rating'));
                this.selectedRating = rating;
                document.getElementById('rating').value = rating;

                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
            });

            star.addEventListener('mouseover', (e) => {
                const rating = parseInt(star.getAttribute('data-rating'));
                stars.forEach((s, index) => {
                    if (index < rating) {
                        s.classList.add('active');
                    } else {
                        s.classList.remove('active');
                    }
                });
            });
        });

        document.getElementById('starRating').addEventListener('mouseleave', () => {
            stars.forEach((s, index) => {
                if (index < this.selectedRating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    }

    handleFileUpload(files) {
        const fileList = document.getElementById('fileList');
        fileList.innerHTML = '';

        Array.from(files).forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                alert(`File ${file.name} is too large. Maximum size is 5MB.`);
                return;
            }

            const fileItem = document.createElement('div');
            fileItem.className = 'alert alert-info alert-dismissible fade show d-flex align-items-center';
            fileItem.innerHTML = `
                        <i class="fas fa-file me-2"></i>
                        <span>${file.name} (${this.formatFileSize(file.size)})</span>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    `;
            fileList.appendChild(fileItem);
        });
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
        return Math.round(bytes / (1024 * 1024)) + ' MB';
    }

    submitComplaint() {
        const form = document.getElementById('complaintForm');
        const formData = new FormData(form);

        const complaint = {
            id: Date.now(),
            category: document.getElementById('category').value,
            description: document.getElementById('description').value,
            status: 'pending',
            submittedDate: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            replies: [],
            statusHistory: [
                {
                    status: 'pending',
                    date: new Date().toISOString(),
                    note: 'Complaint submitted'
                }
            ],
            followUps: [],
            feedback: null
        };

        this.complaints.push(complaint);
        this.saveComplaints();

        // Show success message
        this.showAlert('success', 'Complaint submitted successfully!');

        // Reset form
        form.reset();
        document.getElementById('fileList').innerHTML = '';

        // Switch to My Complaints tab
        const myComplaintsTab = new bootstrap.Tab(document.getElementById('my-complaints-tab'));
        myComplaintsTab.show();
    }

    loadMyComplaints() {
        const container = document.getElementById('complaintsContainer');

        if (this.complaints.length === 0) {
            container.innerHTML = `
                        <div class="text-center text-muted py-5">
                            <i class="fas fa-inbox fa-3x mb-3"></i>
                            <h5>No complaints yet</h5>
                            <p>You haven't submitted any complaints yet.</p>
                        </div>
                    `;
            return;
        }

        container.innerHTML = this.complaints.map(complaint => `
                    <div class="complaint-card">
                        <div class="complaint-header">
                            <div class="d-flex justify-content-between align-items-start">
                                <div>
                                    <h6 class="mb-1">${this.getCategoryName(complaint.category)}</h6>
                                    <div class="complaint-meta">
                                        <i class="fas fa-calendar me-1"></i>
                                        Submitted: ${this.formatDate(complaint.submittedDate)}
                                    </div>
                                    <div class="complaint-meta">
                                        <i class="fas fa-clock me-1"></i>
                                        Last updated: ${this.formatDate(complaint.lastUpdated)}
                                    </div>
                                </div>
                                <span class="status-badge status-${complaint.status}">${complaint.status}</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <p class="card-text">${complaint.description.substring(0, 150)}${complaint.description.length > 150 ? '...' : ''}</p>
                            <div class="d-flex gap-2 flex-wrap">
                                <button class="btn btn-outline-primary btn-sm" onclick="complaintSystem.viewComplaintDetails(${complaint.id})">
                                    <i class="fas fa-eye me-1"></i>View Details
                                </button>
                                ${complaint.status !== 'resolved' ? `
                                    <button class="btn btn-outline-success btn-sm" onclick="complaintSystem.showFollowUpModal(${complaint.id})">
                                        <i class="fas fa-comment-dots me-1"></i>Follow-up
                                    </button>
                                ` : ''}
                                ${complaint.status === 'resolved' && !complaint.feedback ? `
                                    <button class="btn btn-outline-warning btn-sm" onclick="complaintSystem.showFeedbackModal(${complaint.id})">
                                        <i class="fas fa-star me-1"></i>Rate Resolution
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `).join('');
    }

    viewComplaintDetails(complaintId) {
        const complaint = this.complaints.find(c => c.id === complaintId);
        if (!complaint) return;

        const modal = document.getElementById('complaintDetailsModal');
        const content = document.getElementById('complaintDetailsContent');

        content.innerHTML = `
                    <div class="complaint-details">
                        <div class="mb-4">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <h5>${this.getCategoryName(complaint.category)}</h5>
                                <span class="status-badge status-${complaint.status}">${complaint.status}</span>
                            </div>
                            <div class="complaint-meta mb-3">
                                <div><i class="fas fa-calendar me-2"></i>Submitted: ${this.formatDate(complaint.submittedDate)}</div>
                                <div><i class="fas fa-clock me-2"></i>Last updated: ${this.formatDate(complaint.lastUpdated)}</div>
                            </div>
                            <div class="mb-3">
                                <h6>Description:</h6>
                                <p>${complaint.description}</p>
                            </div>
                        </div>

                        ${complaint.replies.length > 0 ? `
                            <div class="reply-section mb-4">
                                <h6><i class="fas fa-comments me-2"></i>Official Responses</h6>
                                ${complaint.replies.map(reply => `
                                    <div class="reply-item">
                                        <div class="reply-header">
                                            <strong>${reply.author}</strong> - ${this.formatDate(reply.date)}
                                        </div>
                                        <p class="mb-0">${reply.message}</p>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}

                        ${complaint.followUps.length > 0 ? `
                            <div class="mb-4">
                                <h6><i class="fas fa-comment-dots me-2"></i>Follow-ups</h6>
                                <div class="follow-up-section">
                                    ${complaint.followUps.map(followUp => `
                                        <div class="mb-2">
                                            <small class="text-muted">${this.formatDate(followUp.date)}</small>
                                            <p class="mb-1">${followUp.message}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <div class="status-history">
                            <h6><i class="fas fa-history me-2"></i>Status History</h6>
                            ${complaint.statusHistory.map(item => `
                                <div class="status-item">
                                    <div class="status-icon ${item.status}"></div>
                                    <div class="flex-grow-1">
                                        <div class="fw-semibold text-capitalize">${item.status}</div>
                                        <small class="text-muted">${this.formatDate(item.date)} - ${item.note}</small>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        ${complaint.feedback ? `
                            <div class="feedback-section mt-4">
                                <h6><i class="fas fa-star me-2"></i>Your Feedback</h6>
                                <div class="d-flex align-items-center mb-2">
                                    <div class="star-rating me-3">
                                        ${Array.from({ length: 5 }, (_, i) =>
            `<span class="star ${i < complaint.feedback.rating ? 'active' : ''}">
                                                <i class="fas fa-star"></i>
                                            </span>`
        ).join('')}
                                    </div>
                                    <small class="text-muted">${this.formatDate(complaint.feedback.date)}</small>
                                </div>
                                ${complaint.feedback.comment ? `<p class="mb-0">${complaint.feedback.comment}</p>` : ''}
                            </div>
                        ` : ''}
                    </div>
                `;

        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    showFollowUpModal(complaintId) {
        this.currentComplaintId = complaintId;
        document.getElementById('followUpText').value = '';
        const modal = new bootstrap.Modal(document.getElementById('followUpModal'));
        modal.show();
    }

    showFeedbackModal(complaintId) {
        this.currentComplaintId = complaintId;
        this.selectedRating = 0;
        document.getElementById('rating').value = '0';
        document.getElementById('feedbackText').value = '';

        // Reset stars
        document.querySelectorAll('.star').forEach(star => {
            star.classList.remove('active');
        });

        const modal = new bootstrap.Modal(document.getElementById('feedbackModal'));
        modal.show();
    }

    submitFollowUp() {
        const followUpText = document.getElementById('followUpText').value.trim();
        if (!followUpText) {
            this.showAlert('warning', 'Please enter a follow-up comment.');
            return;
        }

        const complaint = this.complaints.find(c => c.id === this.currentComplaintId);
        if (complaint) {
            complaint.followUps.push({
                message: followUpText,
                date: new Date().toISOString()
            });
            complaint.lastUpdated = new Date().toISOString();

            this.saveComplaints();
            this.loadMyComplaints();

            const modal = bootstrap.Modal.getInstance(document.getElementById('followUpModal'));
            modal.hide();

            this.showAlert('success', 'Follow-up added successfully!');
        }
    }

    submitFeedback() {
        if (this.selectedRating === 0) {
            this.showAlert('warning', 'Please select a rating.');
            return;
        }

        const feedbackText = document.getElementById('feedbackText').value.trim();
        const complaint = this.complaints.find(c => c.id === this.currentComplaintId);

        if (complaint) {
            complaint.feedback = {
                rating: this.selectedRating,
                comment: feedbackText,
                date: new Date().toISOString()
            };

            this.saveComplaints();
            this.loadMyComplaints();

            const modal = bootstrap.Modal.getInstance(document.getElementById('feedbackModal'));
            modal.hide();

            this.showAlert('success', 'Thank you for your feedback!');
        }
    }

    getCategoryName(categoryValue) {
        const categories = {
            'road-maintenance': 'Road Maintenance',
            'water-supply': 'Water Supply',
            'garbage-collection': 'Garbage Collection',
            'street-lighting': 'Street Lighting',
            'noise-complaint': 'Noise Complaint',
            'public-safety': 'Public Safety',
            'other': 'Other'
        };
        return categories[categoryValue] || categoryValue;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1050; min-width: 300px;';
        alertDiv.innerHTML = `
                    ${message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                `;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            if (alertDiv && alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    loadComplaints() {
        // Load from memory (in a real app, this would be from localStorage or API)
        // Adding some sample data for demonstration
        return [
            {
                id: 1,
                category: 'road-maintenance',
                description: 'There is a large pothole on Main Street that needs urgent repair. It\'s causing damage to vehicles and creating a safety hazard.',
                status: 'resolved',
                submittedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                replies: [
                    {
                        author: 'Public Works Department',
                        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                        message: 'Thank you for reporting this issue. Our team has inspected the location and scheduled repair work for tomorrow.'
                    },
                    {
                        author: 'Public Works Department',
                        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                        message: 'The pothole repair has been completed. The road is now safe for travel.'
                    }
                ],
                statusHistory: [
                    {
                        status: 'pending',
                        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                        note: 'Complaint submitted'
                    },
                    {
                        status: 'progress',
                        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                        note: 'Inspection completed, repair scheduled'
                    },
                    {
                        status: 'resolved',
                        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                        note: 'Pothole repair completed'
                    }
                ],
                followUps: [],
                feedback: null
            },
            {
                id: 2,
                category: 'street-lighting',
                description: 'The street light at the corner of Oak Avenue and 2nd Street has been flickering for weeks and now completely out.',
                status: 'progress',
                submittedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                replies: [
                    {
                        author: 'Electrical Maintenance',
                        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                        message: 'We have identified the issue and ordered replacement parts. Repair will be completed within 2-3 business days.'
                    }
                ],
                statusHistory: [
                    {
                        status: 'pending',
                        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                        note: 'Complaint submitted'
                    },
                    {
                        status: 'progress',
                        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                        note: 'Parts ordered, repair in progress'
                    }
                ],
                followUps: [
                    {
                        message: 'The light is still not working. When can we expect the repair to be completed?',
                        date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
                    }
                ],
                feedback: null
            }
        ];
    }

    saveComplaints() {
        // In a real application, this would save to localStorage or send to API
        // For now, we'll just keep in memory
    }
}

// Initialize the complaint system when the page loads
let complaintSystem;
document.addEventListener('DOMContentLoaded', function () {
    complaintSystem = new ComplaintSystem();
});
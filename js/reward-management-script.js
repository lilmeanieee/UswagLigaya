// Mock data for development purposes
const mockPendingRequests = [
    { id: 'REQ001', date: '2025-04-10', resident: 'Juan', reward: 'Barangay Certificate', category: 'goods', points: 500, status: 'pending' },
    { id: 'REQ002', date: '2025-04-11', resident: 'Jane Smith', reward: 'Barangay Certificate', category: 'goods', points: 300, status: 'pending' },
     { id: 'REQ004', date: '2025-04-13', resident: 'Anna Rose', reward: 'Grocery Voucher', category: 'goods', points: 400, status: 'pending' },
 ];

const mockRewards = [
    { id: 1, name: 'Amazon Gift Card', description: '$25 Amazon Gift Card', points: 500, quantity: 10, startDate: '2025-01-01', endDate: '2025-12-31', isActive: true },
    { id: 2, name: 'Movie Tickets', description: 'Two movie tickets for any showing', points: 300, quantity: 5, startDate: '2025-01-01', endDate: '2025-06-30', isActive: true },
    { id: 3, name: 'Restaurant Voucher', description: '$50 voucher for local restaurants', points: 750, quantity: 3, startDate: '2025-01-01', endDate: '2025-12-31', isActive: true },
    { id: 4, name: 'Grocery Voucher', description: '$40 grocery store voucher', points: 400, quantity: 8, startDate: '2025-01-01', endDate: '2025-12-31', isActive: true },
    { id: 5, name: 'Fitness Membership', description: 'One month fitness center membership', points: 1000, quantity: 2, startDate: '2025-01-01', endDate: '2025-12-31', isActive: true },
    { id: 6, name: 'Coffee Shop Card', description: '$15 coffee shop gift card', points: 200, quantity: 0, startDate: '2025-01-01', endDate: '2025-03-31', isActive: false }
];

const mockRedemptionHistory = [
    { id: 'HIST001', date: '2025-04-01', resident: 'John Doe', reward: 'Amazon Gift Card', points: 500, status: 'completed' },
    { id: 'HIST002', date: '2025-04-02', resident: 'Jane Smith', reward: 'Coffee Shop Card', points: 200, status: 'completed' },
    { id: 'HIST003', date: '2025-04-03', resident: 'Robert Johnson', reward: 'Movie Tickets', points: 300, status: 'completed' },
    { id: 'HIST004', date: '2025-04-05', resident: 'Emily Brown', reward: 'Restaurant Voucher', points: 750, status: 'rejected' },
    { id: 'HIST005', date: '2025-04-07', resident: 'Michael Wilson', reward: 'Grocery Voucher', points: 400, status: 'completed' },
    { id: 'HIST006', date: '2025-04-08', resident: 'Sarah Miller', reward: 'Fitness Membership', points: 1000, status: 'completed' },
    { id: 'HIST007', date: '2025-04-09', resident: 'David Taylor', reward: 'Amazon Gift Card', points: 500, status: 'completed' },
    { id: 'HIST008', date: '2025-04-10', resident: 'Lisa Anderson', reward: 'Movie Tickets', points: 300, status: 'rejected' }
];

// DOM loaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tabs
    const tabElements = document.querySelectorAll('a[data-bs-toggle="tab"]');
    tabElements.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all tabs
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab panes
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
            });
            
            // Show the target tab pane
            const targetId = this.getAttribute('href').substring(1);
            const targetPane = document.getElementById(targetId);
            targetPane.classList.add('show', 'active');
        });
    });
    
    // Load initial data
    loadPendingRequests();
    loadIncentivesTable();
    loadRewardsCatalog();
    loadRedemptionHistory();
    
    // Event listeners
    document.getElementById('saveRewardBtn').addEventListener('click', saveReward);
    document.getElementById('historyFilterBtn').addEventListener('click', filterHistory);
    document.getElementById('catalogSearch').addEventListener('input', function() {
        loadRewardsCatalog(this.value);
    });
    document.getElementById('catalogFilter').addEventListener('change', function() {
        loadRewardsCatalog(document.getElementById('catalogSearch').value);
    });
    document.getElementById('catalogSort').addEventListener('change', function() {
        loadRewardsCatalog(document.getElementById('catalogSearch').value);
    });
});

// Load pending redemption requests
function loadPendingRequests() {
    const tableBody = document.getElementById('pendingRequestsTable');
    tableBody.innerHTML = '';
    
    mockPendingRequests.forEach(request => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.id}</td>
            <td>${request.date}</td>
            <td>${request.resident}</td>
            <td>${request.reward}</td>
            <td>${request.category}</td>
            <td>${request.points}</td>
            <td><span class="badge bg-warning text-dark">Pending</span></td>
            <td class="action-buttons">
                <button class="btn btn-success btn-sm approve-btn" data-id="${request.id}">
                    <i class="bi bi-check-circle"></i> Approve
                </button>
                <button class="btn btn-danger btn-sm reject-btn" data-id="${request.id}">
                    <i class="bi bi-x-circle"></i> Reject
                </button>
                <button class="btn btn-info btn-sm view-btn" data-id="${request.id}">
                    <i class="bi bi-eye"></i> View
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners for action buttons
    document.querySelectorAll('.approve-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            approveRequest(this.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.reject-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            rejectRequest(this.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            viewRequestDetails(this.getAttribute('data-id'));
        });
    });
}

// Approve a redemption request
function approveRequest(requestId) {
    if (confirm(`Are you sure you want to approve request ${requestId}?`)) {
        // In a real application, this would make an API call
        // For demo, we'll just remove it from the mock data
        const index = mockPendingRequests.findIndex(req => req.id === requestId);
        if (index !== -1) {
            const request = mockPendingRequests.splice(index, 1)[0];
            request.status = 'approved';
            mockRedemptionHistory.unshift({...request, id: `HIST${mockRedemptionHistory.length + 1}`.padStart(7, '0')});
            loadPendingRequests();
            
            // Show success message
            alert(`Request ${requestId} has been approved successfully.`);
        }
    }
}

// Reject a redemption request
function rejectRequest(requestId) {
    if (confirm(`Are you sure you want to reject request ${requestId}?`)) {
        // In a real application, this would make an API call
        const index = mockPendingRequests.findIndex(req => req.id === requestId);
        if (index !== -1) {
            const request = mockPendingRequests.splice(index, 1)[0];
            request.status = 'rejected';
            mockRedemptionHistory.unshift({...request, id: `HIST${mockRedemptionHistory.length + 1}`.padStart(7, '0')});
            loadPendingRequests();
            
            // Show success message
            alert(`Request ${requestId} has been rejected.`);
        }
    }
}

// View request details
function viewRequestDetails(requestId) {
    const request = mockPendingRequests.find(req => req.id === requestId);
    if (request) {
        const detailsContent = document.getElementById('redemptionDetailsContent');
        detailsContent.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Request #${request.id}</h5>
                    <p class="card-text">
                        <strong>Date:</strong> ${request.date}<br>
                        <strong>Resident:</strong> ${request.resident}<br>
                        <strong>Reward:</strong> ${request.reward}<br>
                        <strong>Points:</strong> ${request.points}<br>
                        <strong>Status:</strong> <span class="badge bg-warning text-dark">Pending</span>
                    </p>
                    <div class="mt-3">
                        <h6>Resident Information:</h6>
                        <p>
                            <strong>Email:</strong> ${request.resident.toLowerCase().replace(' ', '.')}@example.com<br>
                            <strong>Phone:</strong> (555) 123-4567<br>
                            <strong>Apartment:</strong> #301
                        </p>
                    </div>
                    <div class="mt-3">
                        <h6>Notes:</h6>
                        <p>This is a sample note that would be added by the resident when redeeming points.</p>
                    </div>
                </div>
            </div>
        `;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('redemptionDetailsModal'));
        modal.show();
    }
}

// Load incentives management table
function loadIncentivesTable() {
    const tableBody = document.getElementById('incentivesTable');
    tableBody.innerHTML = '';
    
    mockRewards.forEach(reward => {
        const row = document.createElement('tr');
        
        // Determine availability status
        let availabilityText, availabilityClass;
        const today = new Date();
        const endDate = reward.endDate ? new Date(reward.endDate) : null;
        
        if (!reward.isActive || (endDate && endDate < today)) {
            availabilityText = 'Expired';
            availabilityClass = 'expired';
        } else if (reward.quantity <= 0) {
            availabilityText = 'Out of Stock';
            availabilityClass = 'expired';
        } else if (reward.quantity < 5) {
            availabilityText = `Limited (${reward.quantity})`;
            availabilityClass = 'limited';
        } else {
            availabilityText = `Available (${reward.quantity})`;
            availabilityClass = 'available';
        }
        
        row.innerHTML = `
            <td>${reward.id}</td>
            <td>${reward.name}</td>
            <td>${reward.description}</td>
            <td>${reward.points}</td>
            <td><span class="availability-badge ${availabilityClass}">${availabilityText}</span></td>
            <td class="action-buttons">
                <button class="btn btn-primary btn-sm edit-reward-btn" data-id="${reward.id}">
                    <i class="bi bi-pencil"></i> Edit
                </button>
                <button class="btn btn-danger btn-sm delete-reward-btn" data-id="${reward.id}">
                    <i class="bi bi-trash"></i> Delete
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Add event listeners for action buttons
    document.querySelectorAll('.edit-reward-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            editReward(this.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.delete-reward-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteReward(this.getAttribute('data-id'));
        });
    });
}

// Edit reward
function editReward(rewardId) {
    // Find the reward by ID
    const reward = mockRewards.find(r => r.id === parseInt(rewardId));
    if (reward) {
        // Populate the modal form
        document.getElementById('rewardId').value = reward.id;
        document.getElementById('rewardName').value = reward.name;
        document.getElementById('rewardDescription').value = reward.description;
        document.getElementById('rewardPoints').value = reward.points;
        document.getElementById('rewardQuantity').value = reward.quantity;
        document.getElementById('startDate').value = reward.startDate;
        document.getElementById('endDate').value = reward.endDate || '';
        document.getElementById('isActive').checked = reward.isActive;
        
        // Update modal title
        document.getElementById('addRewardModalLabel').textContent = 'Edit Reward';
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addRewardModal'));
        modal.show();
    }
}

// Delete reward
function deleteReward(rewardId) {
    if (confirm(`Are you sure you want to delete reward #${rewardId}?`)) {
        // In a real application, this would make an API call
        const index = mockRewards.findIndex(r => r.id === parseInt(rewardId));
        if (index !== -1) {
            mockRewards.splice(index, 1);
            loadIncentivesTable();
            loadRewardsCatalog();
            
            // Show success message
            alert(`Reward #${rewardId} has been deleted.`);
        }
    }
}

// Save reward (add or update)
function saveReward() {
    // Get form values
    const rewardId = document.getElementById('rewardId').value;
    const rewardName = document.getElementById('rewardName').value;
    const rewardDescription = document.getElementById('rewardDescription').value;
    const rewardPoints = parseInt(document.getElementById('rewardPoints').value);
    const rewardQuantity = parseInt(document.getElementById('rewardQuantity').value);
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const isActive = document.getElementById('isActive').checked;
    
    // Validate form
    if (!rewardName || !rewardDescription || !rewardPoints || isNaN(rewardQuantity) || !startDate) {
        alert('Please fill in all required fields.');
        return;
    }
    
    // Create reward object
    const rewardData = {
        name: rewardName,
        description: rewardDescription,
        points: rewardPoints,
        quantity: rewardQuantity,
        startDate: startDate,
        endDate: endDate || null,
        isActive: isActive
    };
    
    // Update existing or add new reward
    if (rewardId) {
        // Update existing reward
        const index = mockRewards.findIndex(r => r.id === parseInt(rewardId));
        if (index !== -1) {
            rewardData.id = parseInt(rewardId);
            mockRewards[index] = rewardData;
            alert(`Reward #${rewardId} has been updated.`);
        }
    } else {
        // Add new reward
        rewardData.id = mockRewards.length > 0 ? Math.max(...mockRewards.map(r => r.id)) + 1 : 1;
        mockRewards.push(rewardData);
        alert('New reward has been added successfully.');
    }
    
    // Refresh tables and close modal
    loadIncentivesTable();
    loadRewardsCatalog();
    bootstrap.Modal.getInstance(document.getElementById('addRewardModal')).hide();
    
    // Reset form
    document.getElementById('rewardForm').reset();
    document.getElementById('rewardId').value = '';
    document.getElementById('addRewardModalLabel').textContent = 'Add New Reward';
}

// Load rewards catalog
function loadRewardsCatalog(searchQuery = '') {
    const catalogGrid = document.getElementById('rewardsCatalogGrid');
    catalogGrid.innerHTML = '';
    
    let filteredRewards = [...mockRewards];
    
    // Apply search filter if provided
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredRewards = filteredRewards.filter(reward => 
            reward.name.toLowerCase().includes(query) || 
            reward.description.toLowerCase().includes(query)
        );
    }
    
    // Apply availability filter
    const filterValue = document.getElementById('catalogFilter').value;
    if (filterValue === 'available') {
        filteredRewards = filteredRewards.filter(reward => 
            reward.isActive && 
            reward.quantity > 0 && 
            (new Date(reward.endDate) > new Date() || !reward.endDate)
        );
    } else if (filterValue === 'expired') {
        filteredRewards = filteredRewards.filter(reward => 
            !reward.isActive || 
            reward.quantity <= 0 || 
            (reward.endDate && new Date(reward.endDate) < new Date())
        );
    }
    
    // Apply sorting
    const sortValue = document.getElementById('catalogSort').value;
    if (sortValue === 'name') {
        filteredRewards.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortValue === 'points') {
        filteredRewards.sort((a, b) => a.points - b.points);
    } else if (sortValue === 'popularity') {
        // For demo, we'll just use a random order
        filteredRewards.sort(() => Math.random() - 0.5);
    }
    
    // Create catalog grid
    filteredRewards.forEach(reward => {
        const today = new Date();
        const endDate = reward.endDate ? new Date(reward.endDate) : null;
        const isExpired = !reward.isActive || (endDate && endDate < today) || reward.quantity <= 0;
        
        const col = document.createElement('div');
        col.className = 'col-md-4';
        
        let availabilityText, availabilityClass;
        if (!reward.isActive || (endDate && endDate < today)) {
            availabilityText = 'Expired';
            availabilityClass = 'expired';
        } else if (reward.quantity <= 0) {
            availabilityText = 'Out of Stock';
            availabilityClass = 'expired';
        } else if (reward.quantity < 5) {
            availabilityText = `Limited (${reward.quantity} left)`;
            availabilityClass = 'limited';
        } else {
            availabilityText = `Available (${reward.quantity})`;
            availabilityClass = 'available';
        }
        
        col.innerHTML = `
            <div class="card reward-card ${isExpired ? 'expired-reward' : ''}">
                <div class="card-body">
                    <h5 class="card-title">${reward.name}</h5>
                    <span class="badge bg-primary points-badge">${reward.points} Points</span>
                    <p class="card-text mt-2">${reward.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="availability-badge ${availabilityClass}">${availabilityText}</span>
                        <small class="text-muted">ID: ${reward.id}</small>
                    </div>
                    <div class="mt-3">
                        <small class="text-muted">
                            Available from: ${reward.startDate}
                            ${reward.endDate ? ' to ' + reward.endDate : ''}
                        </small>
                    </div>
                </div>
                <div class="card-footer d-flex justify-content-between">
                    <button class="btn btn-sm btn-outline-primary edit-catalog-btn" data-id="${reward.id}">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-catalog-btn" data-id="${reward.id}">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
        
        catalogGrid.appendChild(col);
    });
    
    // Add event listeners for catalog buttons
    document.querySelectorAll('.edit-catalog-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            editReward(this.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.delete-catalog-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteReward(this.getAttribute('data-id'));
        });
    });
    
    // Display message if no results
    if (filteredRewards.length === 0) {
        catalogGrid.innerHTML = `
            <div class="col-12 text-center my-5">
                <h4>No rewards found</h4>
                <p>Try adjusting your search criteria or add new rewards.</p>
            </div>
        `;
    }
}

// Load redemption history
function loadRedemptionHistory(page = 1) {
    const tableBody = document.getElementById('historyTable');
    tableBody.innerHTML = '';
    
    // For pagination demo
    const itemsPerPage = 5;
    const totalPages = Math.ceil(mockRedemptionHistory.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedHistory = mockRedemptionHistory.slice(startIndex, endIndex);
    
    paginatedHistory.forEach(record => {
        const row = document.createElement('tr');
        
        // Determine status badge class
        let statusClass = '';
        switch (record.status) {
            case 'completed':
                statusClass = 'bg-success';
                break;
            case 'rejected':
                statusClass = 'bg-danger';
                break;
            case 'pending':
                statusClass = 'bg-warning text-dark';
                break;
            default:
                statusClass = 'bg-secondary';
        }
        
        row.innerHTML = `
            <td>${record.id}</td>
            <td>${record.date}</td>
            <td>${record.resident}</td>
            <td>${record.reward}</td>
            <td>${record.points}</td>
            <td><span class="badge ${statusClass}">${record.status.charAt(0).toUpperCase() + record.status.slice(1)}</span></td>
            <td>
                <button class="btn btn-sm btn-info view-history-btn" data-id="${record.id}">
                    <i class="bi bi-eye"></i> View
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    // Create pagination
    createPagination(page, totalPages);
    
    // Add event listeners for view buttons
    document.querySelectorAll('.view-history-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            viewHistoryDetails(this.getAttribute('data-id'));
        });
    });
}

// Create pagination
function createPagination(currentPage, totalPages) {
    const pagination = document.getElementById('historyPagination');
    pagination.innerHTML = '';
    
    // Previous button
    const prevItem = document.createElement('li');
    prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevItem.innerHTML = `
        <a class="page-link" href="#" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
        </a>
    `;
    if (currentPage > 1) {
        prevItem.addEventListener('click', () => loadRedemptionHistory(currentPage - 1));
    }
    pagination.appendChild(prevItem);
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageItem.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageItem.addEventListener('click', () => loadRedemptionHistory(i));
        pagination.appendChild(pageItem);
    }
    
    // Next button
    const nextItem = document.createElement('li');
    nextItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextItem.innerHTML = `
        <a class="page-link" href="#" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
        </a>
    `;
    if (currentPage < totalPages) {
        nextItem.addEventListener('click', () => loadRedemptionHistory(currentPage + 1));
    }
    pagination.appendChild(nextItem);
}

// View history details
function viewHistoryDetails(recordId) {
    const record = mockRedemptionHistory.find(rec => rec.id === recordId);
    if (record) {
        const detailsContent = document.getElementById('redemptionDetailsContent');
        
        // Determine status badge class
        let statusClass = '';
        switch (record.status) {
            case 'completed':
                statusClass = 'bg-success';
                break;
            case 'rejected':
                statusClass = 'bg-danger';
                break;
            case 'pending':
                statusClass = 'bg-warning text-dark';
                break;
            default:
                statusClass = 'bg-secondary';
        }
        
        detailsContent.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Redemption #${record.id}</h5>
                    <p class="card-text">
                        <strong>Date:</strong> ${record.date}<br>
                        <strong>Resident:</strong> ${record.resident}<br>
                        <strong>Reward:</strong> ${record.reward}<br>
                        <strong>Points:</strong> ${record.points}<br>
                        <strong>Status:</strong> <span class="badge ${statusClass}">${record.status.charAt(0).toUpperCase() + record.status.slice(1)}</span>
                    </p>
                    <div class="mt-3">
                        <h6>Resident Information:</h6>
                        <p>
                            <strong>Email:</strong> ${record.resident.toLowerCase().replace(' ', '.')}@example.com<br>
                            <strong>Phone:</strong> (555) 123-4567<br>
                            <strong>Apartment:</strong> #301
                        </p>
                    </div>
                    <div class="mt-3">
                        <h6>Processing Information:</h6>
                        <p>
                            <strong>Processed by:</strong> Admin User<br>
                            <strong>Process Date:</strong> ${new Date(new Date(record.date).getTime() + 86400000).toISOString().split('T')[0]}<br>
                            <strong>Notes:</strong> ${record.status === 'rejected' ? 'Redemption request was rejected due to insufficient points.' : 'Redemption processed successfully.'}
                        </p>
                    </div>
                </div>
            </div>
        `;
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('redemptionDetailsModal'));
        modal.show();
    }
}

// Filter history by date range
function filterHistory() {
    const fromDate = document.getElementById('historyDateFrom').value;
    const toDate = document.getElementById('historyDateTo').value;
    
    // You would typically make an API call with these parameters
    // For this demo, we'll just log the filter values
    console.log(`Filtering history from ${fromDate} to ${toDate}`);
    
    // Reload redemption history with first page
    loadRedemptionHistory(1);
    
    // Show a message
    alert(`History filtered from ${fromDate || 'all past dates'} to ${toDate || 'present'}`);
}
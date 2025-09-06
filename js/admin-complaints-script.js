// script.js

// Sample data for complaints
let complaintsData = [
    {
        id: 'CMP-001',
        residentName: 'John Doe',
        category: 'infrastructure',
        status: 'pending',
        dateSubmitted: '2024-08-15',
        assignedOfficial: 'Sarah Johnson',
        lastUpdated: '2024-08-20',
        contact: '+1234567890',
        address: '123 Main St, City, State',
        description: 'Pothole on Main Street causing traffic issues and potential damage to vehicles.',
        notes: 'Initial assessment completed. Waiting for road repair crew scheduling.',
        timeline: [
            { date: '2024-08-15', action: 'Complaint submitted by resident' },
            { date: '2024-08-16', action: 'Assigned to Sarah Johnson' },
            { date: '2024-08-18', action: 'Site inspection completed' },
            { date: '2024-08-20', action: 'Forwarded to road maintenance department' }
        ]
    },
    {
        id: 'CMP-002',
        residentName: 'Jane Smith',
        category: 'waste-management',
        status: 'resolved',
        dateSubmitted: '2024-08-10',
        assignedOfficial: 'Mike Davis',
        lastUpdated: '2024-08-22',
        contact: '+1234567891',
        address: '456 Oak Ave, City, State',
        description: 'Garbage pickup missed for two weeks in residential area.',
        notes: 'Issue resolved. New pickup schedule implemented.',
        timeline: [
            { date: '2024-08-10', action: 'Complaint received' },
            { date: '2024-08-11', action: 'Assigned to waste management team' },
            { date: '2024-08-15', action: 'Investigation completed' },
            { date: '2024-08-20', action: 'Makeup collection scheduled' },
            { date: '2024-08-22', action: 'Issue resolved - regular schedule restored' }
        ]
    },
    {
        id: 'CMP-003',
        residentName: 'Robert Johnson',
        category: 'public-safety',
        status: 'in-progress',
        dateSubmitted: '2024-08-12',
        assignedOfficial: 'Lisa Anderson',
        lastUpdated: '2024-08-21',
        contact: '+1234567892',
        address: '789 Pine St, City, State',
        description: 'Broken streetlight creating safety hazard at night.',
        notes: 'Replacement parts ordered. Installation scheduled for next week.',
        timeline: [
            { date: '2024-08-12', action: 'Safety complaint filed' },
            { date: '2024-08-13', action: 'Assigned to public safety department' },
            { date: '2024-08-14', action: 'Site assessment conducted' },
            { date: '2024-08-18', action: 'Repair parts ordered' },
            { date: '2024-08-21', action: 'Installation crew scheduled' }
        ]
    },
    {
        id: 'CMP-004',
        residentName: 'Maria Garcia',
        category: 'utilities',
        status: 'pending',
        dateSubmitted: '2024-08-18',
        assignedOfficial: 'John Smith',
        lastUpdated: '2024-08-19',
        contact: '+1234567893',
        address: '321 Elm St, City, State',
        description: 'Water pressure issues in apartment building affecting multiple units.',
        notes: 'Initial report filed. Awaiting utility company response.',
        timeline: [
            { date: '2024-08-18', action: 'Complaint submitted' },
            { date: '2024-08-19', action: 'Forwarded to utilities department' }
        ]
    },
    {
        id: 'CMP-005',
        residentName: 'David Wilson',
        category: 'other',
        status: 'closed',
        dateSubmitted: '2024-08-05',
        assignedOfficial: 'Sarah Johnson',
        lastUpdated: '2024-08-15',
        contact: '+1234567894',
        address: '654 Maple Ave, City, State',
        description: 'Noise complaints from construction site exceeding permitted hours.',
        notes: 'Issue resolved. Construction company fined and schedule adjusted.',
        timeline: [
            { date: '2024-08-05', action: 'Noise complaint filed' },
            { date: '2024-08-06', action: 'Investigation initiated' },
            { date: '2024-08-08', action: 'Site visit conducted' },
            { date: '2024-08-12', action: 'Violation notice issued' },
            { date: '2024-08-15', action: 'Compliance verified - case closed' }
        ]
    }
];

// Pagination variables
let currentPage = 1;
let itemsPerPage = 5;
let filteredData = [...complaintsData];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    renderComplaintsTable();
    updateDashboardStats();
    initializeCharts();
    setupEventListeners();
    setDefaultDates();
}

// Event Listeners Setup
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showSection(this.dataset.section);
            updateActiveNav(this);
        });
    });

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', function() {
        searchComplaints(this.value);
    });

    // Real-time filtering
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    document.getElementById('dateFrom').addEventListener('change', applyFilters);
    document.getElementById('dateTo').addEventListener('change', applyFilters);
}

// Navigation Functions
function showSection(sectionName) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName + '-section').classList.add('active');
    
    if (sectionName === 'reports') {
        updateDashboardStats();
        updateCharts();
    }
}

function updateActiveNav(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// Table Rendering Functions
function renderComplaintsTable() {
    const tableBody = document.getElementById('complaintsTableBody');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = filteredData.slice(startIndex, endIndex);

    tableBody.innerHTML = currentData.map(complaint => `
        <tr>
            <td><strong>${complaint.id}</strong></td>
            <td>${complaint.residentName}</td>
            <td><span class="category-badge category-${complaint.category}">${formatCategory(complaint.category)}</span></td>
            <td><span class="status-badge status-${complaint.status}">${formatStatus(complaint.status)}</span></td>
            <td>${formatDate(complaint.dateSubmitted)}</td>
            <td>${complaint.assignedOfficial}</td>
            <td>${formatDate(complaint.lastUpdated)}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary btn-action" onclick="viewComplaint('${complaint.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-warning btn-action" onclick="manageComplaint('${complaint.id}')" title="Manage">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="btn btn-outline-danger btn-action" onclick="deleteComplaint('${complaint.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    renderPagination();
}

function renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Previous</a>
        </li>
    `;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
        </li>
    `;

    pagination.innerHTML = paginationHTML;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        renderComplaintsTable();
    }
}

// Utility Functions
function formatStatus(status) {
    return status.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function formatCategory(category) {
    return category.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Filtering Functions
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter').value;
    const categoryFilter = document.getElementById('categoryFilter').value;
    const dateFrom = document.getElementById('dateFrom').value;
    const dateTo = document.getElementById('dateTo').value;

    filteredData = complaintsData.filter(complaint => {
        const matchesStatus = !statusFilter || complaint.status === statusFilter;
        const matchesCategory = !categoryFilter || complaint.category === categoryFilter;
        const matchesDateFrom = !dateFrom || new Date(complaint.dateSubmitted) >= new Date(dateFrom);
        const matchesDateTo = !dateTo || new Date(complaint.dateSubmitted) <= new Date(dateTo);

        return matchesStatus && matchesCategory && matchesDateFrom && matchesDateTo;
    });

    currentPage = 1;
    renderComplaintsTable();
}

function clearFilters() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    
    filteredData = [...complaintsData];
    currentPage = 1;
    renderComplaintsTable();
}

function searchComplaints(searchTerm) {
    const term = searchTerm.toLowerCase();
    
    filteredData = complaintsData.filter(complaint => {
        return complaint.id.toLowerCase().includes(term) ||
               complaint.residentName.toLowerCase().includes(term) ||
               complaint.category.toLowerCase().includes(term) ||
               complaint.description.toLowerCase().includes(term);
    });

    currentPage = 1;
    renderComplaintsTable();
}

// Modal Functions
function viewComplaint(complaintId) {
    const complaint = complaintsData.find(c => c.id === complaintId);
    if (!complaint) return;

    const detailsHTML = `
        <div class="detail-section">
            <h6>Resident Information</h6>
            <p><strong>Name:</strong> ${complaint.residentName}</p>
            <p><strong>Contact:</strong> ${complaint.contact}</p>
            <p><strong>Address:</strong> ${complaint.address}</p>
        </div>

        <div class="detail-section">
            <h6>Complaint Details</h6>
            <p><strong>ID:</strong> ${complaint.id}</p>
            <p><strong>Category:</strong> ${formatCategory(complaint.category)}</p>
            <p><strong>Status:</strong> ${formatStatus(complaint.status)}</p>
            <p><strong>Date Submitted:</strong> ${formatDate(complaint.dateSubmitted)}</p>
            <p><strong>Assigned to:</strong> ${complaint.assignedOfficial}</p>
            <p><strong>Description:</strong></p>
            <p>${complaint.description}</p>
        </div>

        <div class="detail-section">
            <h6>Admin Notes</h6>
            <p>${complaint.notes || 'No notes available.'}</p>
        </div>

        <div class="detail-section">
            <h6>Timeline</h6>
            <div class="timeline">
                ${complaint.timeline.map(item => `
                    <div class="timeline-item">
                        <div class="timeline-date">${formatDate(item.date)}</div>
                        <div class="timeline-content">${item.action}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    document.getElementById('complaintDetails').innerHTML = detailsHTML;
    new bootstrap.Modal(document.getElementById('detailModal')).show();
}

function manageComplaint(complaintId) {
    const complaint = complaintsData.find(c => c.id === complaintId);
    if (!complaint) return;

    document.getElementById('manageComplaintId').value = complaintId;
    document.getElementById('manageStatus').value = complaint.status;
    document.getElementById('manageAssignee').value = complaint.assignedOfficial;
    document.getElementById('adminNotes').value = complaint.notes || '';

    new bootstrap.Modal(document.getElementById('managementModal')).show();
}

function saveManagementChanges() {
    const complaintId = document.getElementById('manageComplaintId').value;
    const newStatus = document.getElementById('manageStatus').value;
    const newAssignee = document.getElementById('manageAssignee').value;
    const newNotes = document.getElementById('adminNotes').value;

    const complaintIndex = complaintsData.findIndex(c => c.id === complaintId);
    if (complaintIndex !== -1) {
        complaintsData[complaintIndex].status = newStatus;
        complaintsData[complaintIndex].assignedOfficial = newAssignee;
        complaintsData[complaintIndex].notes = newNotes;
        complaintsData[complaintIndex].lastUpdated = new Date().toISOString().split('T')[0];

        // Add timeline entry
        complaintsData[complaintIndex].timeline.push({
            date: new Date().toISOString().split('T')[0],
            action: `Status updated to ${formatStatus(newStatus)} by admin`
        });

        // Close modal and refresh table
        bootstrap.Modal.getInstance(document.getElementById('managementModal')).hide();
        applyFilters();
        updateDashboardStats();

        // Show success message
        showAlert('Complaint updated successfully!', 'success');
    }
}

function deleteComplaint(complaintId) {
    if (confirm('Are you sure you want to delete this complaint? This action cannot be undone.')) {
        const index = complaintsData.findIndex(c => c.id === complaintId);
        if (index !== -1) {
            complaintsData.splice(index, 1);
            applyFilters();
            updateDashboardStats();
            showAlert('Complaint deleted successfully!', 'warning');
        }
    }
}

// Dashboard and Reports Functions
function updateDashboardStats() {
    const total = complaintsData.length;
    const pending = complaintsData.filter(c => c.status === 'pending').length;
    const resolved = complaintsData.filter(c => c.status === 'resolved' || c.status === 'closed').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    document.getElementById('totalComplaints').textContent = total;
    document.getElementById('pendingComplaints').textContent = pending;
    document.getElementById('resolvedComplaints').textContent = resolved;
    document.getElementById('resolutionRate').textContent = `${resolutionRate}%`;
}

function initializeCharts() {
    createCategoryChart();
    createTrendChart();
}

function updateCharts() {
    createCategoryChart();
    createTrendChart();
}

function createCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.categoryChart) {
        window.categoryChart.destroy();
    }

    const categoryData = {};
    complaintsData.forEach(complaint => {
        categoryData[complaint.category] = (categoryData[complaint.category] || 0) + 1;
    });

    window.categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categoryData).map(formatCategory),
            datasets: [{
                data: Object.values(categoryData),
                backgroundColor: [
                    '#0d6efd',
                    '#6f42c1',
                    '#d63384',
                    '#fd7e14',
                    '#20c997'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createTrendChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.trendChart) {
        window.trendChart.destroy();
    }

    // Generate monthly data for the last 6 months
    const monthlyData = {};
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().slice(0, 7);
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        months.push(monthLabel);
        monthlyData[monthKey] = 0;
    }

    complaintsData.forEach(complaint => {
        const monthKey = complaint.dateSubmitted.slice(0, 7);
        if (monthlyData.hasOwnProperty(monthKey)) {
            monthlyData[monthKey]++;
        }
    });

    window.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Complaints',
                data: Object.values(monthlyData),
                borderColor: '#0d6efd',
                backgroundColor: 'rgba(13, 110, 253, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Report Generation Functions
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;

    if (!startDate || !endDate) {
        showAlert('Please select both start and end dates for the report.', 'warning');
        return;
    }

    // Filter data based on date range
    const reportData = complaintsData.filter(complaint => {
        const complaintDate = new Date(complaint.dateSubmitted);
        return complaintDate >= new Date(startDate) && complaintDate <= new Date(endDate);
    });

    // Generate report summary
    const total = reportData.length;
    const resolved = reportData.filter(c => c.status === 'resolved' || c.status === 'closed').length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    showAlert(`Report generated: ${total} complaints, ${resolved} resolved (${resolutionRate}% resolution rate)`, 'success');
}

function downloadReport() {
    showAlert('Report download feature would be implemented here.', 'info');
}

// Utility Functions
function exportData() {
    const csvContent = convertToCSV(filteredData);
    downloadCSV(csvContent, 'complaints_export.csv');
}

function convertToCSV(data) {
    const headers = ['ID', 'Resident Name', 'Category', 'Status', 'Date Submitted', 'Assigned Official', 'Last Updated'];
    const csvRows = [headers.join(',')];

    data.forEach(row => {
        const values = [
            row.id,
            row.residentName,
            formatCategory(row.category),
            formatStatus(row.status),
            row.dateSubmitted,
            row.assignedOfficial,
            row.lastUpdated
        ];
        csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function setDefaultDates() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    document.getElementById('reportStartDate').value = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('reportEndDate').value = today.toISOString().split('T')[0];
}

function showAlert(message, type) {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Add to page
    document.body.appendChild(alertDiv);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}
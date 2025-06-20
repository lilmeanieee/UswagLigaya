// -----------------------
// MOCK DATA
// -----------------------
const mockPendingRequests = [
    { id: 'REQ001', date: '2025-04-10', resident: 'John Doe', reward: 'Amazon Gift Card', points: 500, status: 'pending' },
    { id: 'REQ002', date: '2025-04-11', resident: 'Jane Smith', reward: 'Movie Tickets', points: 300, status: 'pending' },
    { id: 'REQ003', date: '2025-04-12', resident: 'Robert Johnson', reward: 'Restaurant Voucher', points: 750, status: 'pending' },
];

const mockRewards = [
    { id: 1, name: 'Amazon Gift Card', description: '$25 Amazon Gift Card', points: 500, quantity: 10, startDate: '2025-01-01', endDate: '2025-12-31', isActive: true },
    { id: 2, name: 'Movie Tickets', description: 'Any movie, any time', points: 300, quantity: 3, startDate: '2025-01-01', endDate: '2025-12-31', isActive: true },
];

const mockRedemptionHistory = [
    { id: 'HIST001', date: '2025-04-01', resident: 'John Doe', reward: 'Amazon Gift Card', points: 500, status: 'completed' },
    { id: 'HIST002', date: '2025-04-02', resident: 'Jane Smith', reward: 'Movie Tickets', points: 300, status: 'completed' },
];

// -----------------------
// ON DOCUMENT LOAD
// -----------------------
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('pendingRequestsTable')) loadPendingRequests();
    if (document.getElementById('incentivesTable')) loadIncentivesTable();
    if (document.getElementById('rewardsCatalogGrid')) loadRewardsCatalog();
    if (document.getElementById('historyTable')) loadRedemptionHistory();

    if (document.getElementById('saveRewardBtn')) {
        document.getElementById('saveRewardBtn').addEventListener('click', saveReward);
    }

    if (document.getElementById('historyFilterBtn')) {
        document.getElementById('historyFilterBtn').addEventListener('click', () => {
            alert('Filtering history... (demo only)');
        });
    }

    if (document.getElementById('catalogSearch')) {
        document.getElementById('catalogSearch').addEventListener('input', function () {
            loadRewardsCatalog(this.value);
        });
    }
});

// -----------------------
// LOAD PENDING REQUESTS
// -----------------------
function loadPendingRequests() {
    const tbody = document.getElementById('pendingRequestsTable');
    tbody.innerHTML = '';

    mockPendingRequests.forEach(req => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${req.id}</td>
            <td>${req.date}</td>
            <td>${req.resident}</td>
            <td>${req.reward}</td>
            <td>${req.points}</td>
            <td><span class="badge bg-warning text-dark">${req.status}</span></td>
            <td>
                <button class="btn btn-success btn-sm me-1" onclick="approveRequest('${req.id}')">Approve</button>
                <button class="btn btn-danger btn-sm" onclick="rejectRequest('${req.id}')">Reject</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function approveRequest(id) {
    alert(`Approved request ${id} ✅`);
    // Here you'd update the backend or mock data
}

function rejectRequest(id) {
    alert(`Rejected request ${id} ❌`);
    // Here you'd update the backend or mock data
}

// -----------------------
// LOAD INCENTIVES TABLE
// -----------------------
function loadIncentivesTable() {
    const tbody = document.getElementById('incentivesTable');
    tbody.innerHTML = '';

    mockRewards.forEach(reward => {
        tbody.innerHTML += `
            <tr>
                <td>${reward.id}</td>
                <td>${reward.name}</td>
                <td>${reward.description}</td>
                <td>${reward.points}</td>
                <td>${reward.quantity}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editReward(${reward.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteReward(${reward.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}

function editReward(editReward) {
    alert(`Editing reward #${id} 🛠`);
}

function deleteReward(id) {
    if (confirm(`Delete reward #${id}?`)) {
        alert(`Deleted reward #${id}`);
    }
}

function saveReward() {
    alert('Reward saved! (demo only)');
    document.getElementById('rewardForm').reset();
}

// -----------------------
// LOAD REWARDS CATALOG
// -----------------------
function loadRewardsCatalog(search = '') {
    const grid = document.getElementById('rewardsCatalogGrid');
    grid.innerHTML = '';

    const filtered = mockRewards.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase())
    );

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-12"><p class="text-muted text-center">No rewards found.</p></div>`;
        return;
    }

    filtered.forEach(reward => {
        const col = document.createElement('div');
        col.className = 'col-md-4';
        col.innerHTML = `
            <div class="card reward-card">
                <div class="card-body">
                    <h5 class="card-title">${reward.name}</h5>
                    <p class="card-text">${reward.description}</p>
                    <span class="badge bg-primary">${reward.points} pts</span>
                    <div class="mt-3">
                        <small class="text-muted">Available: ${reward.quantity}</small>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(col);
    });
}

// -----------------------
// LOAD REDEMPTION HISTORY
// -----------------------
function loadRedemptionHistory() {
    const tbody = document.getElementById('historyTable');
    tbody.innerHTML = '';

    mockRedemptionHistory.forEach(hist => {
        const badgeClass = hist.status === 'completed' ? 'bg-success' : 'bg-danger';

        tbody.innerHTML += `
            <tr>
                <td>${hist.id}</td>
                <td>${hist.date}</td>
                <td>${hist.resident}</td>
                <td>${hist.reward}</td>
                <td>${hist.points}</td>
                <td><span class="badge ${badgeClass}">${hist.status}</span></td>
                <td><button class="btn btn-sm btn-outline-info">View</button></td>
            </tr>
        `;
    });
}

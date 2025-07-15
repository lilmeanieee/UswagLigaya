document.getElementById('accountType').addEventListener('change', function () {
    const selected = this.value;
    const commonFields = document.getElementById('commonFields');
    const adminFields = document.getElementById('adminFields');

    // Show common fields
    commonFields.classList.remove('hidden');

    if (selected === 'admin') {
        adminFields.classList.remove('hidden');
    } else {
        adminFields.classList.add('hidden');
    }
});

// Sample account data for demonstration purposes
const sampleAccounts = [
    {
        accID: '32',
        fullname: 'Princess Dela Cruz',
        username: 'captain',
        email: 'captain@brgy.com',
        password: '123456',
        position: 'Barangay Captain',
        committee: 'Health & Safety'
    },
    {
        accID: '34',
        fullname: 'Mark Santos',
        username: 'secretary01',
        email: 'secretary@brgy.com',
        password: 'secret',
        position: 'Secretary',
        committee: 'Education'
    }
];

function renderTable() {
    const tbody = document.getElementById('accountTableBody');
    tbody.innerHTML = '';
    sampleAccounts.forEach((acc, i) => {
        tbody.innerHTML += `
            <tr>
                <td>${acc.fullname}</td>
                <td>${acc.username}</td>
                <td class="text-truncate" style="max-width: 150px;">${acc.email}</td>
                <td>${acc.password}</td>
                <td>${acc.position}</td>
                <td>${acc.committee}</td>
                <td class="d-flex flex-column flex-sm-row gap-1">
                    <button class="btn btn-sm btn-warning me-1" onclick="openEdit(${i})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteAccount(${i})">Delete</button>
                </td>
            </tr>
        `;
    });
}

function renderCards() {
    const cardsContainer = document.getElementById('accountCardsContainer');
    if (!cardsContainer) return; // Exit if cards container doesn't exist
    
    cardsContainer.innerHTML = '';
    sampleAccounts.forEach((acc, i) => {
        cardsContainer.innerHTML += `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="card-title mb-0">${acc.fullname}</h6>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                Actions
                            </button>
                            <ul class="dropdown-menu">
                                <li><button class="dropdown-item" onclick="openEdit(${i})">Edit</button></li>
                                <li><button class="dropdown-item text-danger" onclick="deleteAccount(${i})">Delete</button></li>
                            </ul>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-6">
                            <small class="text-muted">Username:</small>
                            <p class="mb-1">${acc.username}</p>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Position:</small>
                            <p class="mb-1">${acc.position}</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12">
                            <small class="text-muted">Email:</small>
                            <p class="mb-1 text-break">${acc.email}</p>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12">
                            <small class="text-muted">Committee:</small>
                            <p class="mb-2">${acc.committee}</p>
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-warning flex-fill" onclick="openEdit(${i})">Edit</button>
                        <button class="btn btn-sm btn-danger flex-fill" onclick="deleteAccount(${i})">Delete</button>
                    </div>
                </div>
            </div>
        `;
    });
}

function renderResponsiveContent() {
    renderTable();
    renderCards();
}

function openEdit(index) {
    const acc = sampleAccounts[index];
    document.getElementById('editAccountID').value = acc.accID;
    document.getElementById('editIndex').value = index;
    document.getElementById('editFullname').value = acc.fullname;
    document.getElementById('editUsername').value = acc.username;
    document.getElementById('editEmail').value = acc.email;
    document.getElementById('editPassword').value = acc.password;
    document.getElementById('editPosition').value = acc.position;
    document.getElementById('editCommittee').value = acc.committee;

    const modal = new bootstrap.Modal(document.getElementById('editAccountModal'));
    modal.show();
}

function deleteAccount(index) {
    if (confirm('Are you sure you want to delete this account?')) {
        sampleAccounts.splice(index, 1);
        renderResponsiveContent(); // Render both table and cards
    }
}

document.getElementById('editForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const index = document.getElementById('editIndex').value;
    sampleAccounts[index] = {
        accID: document.getElementById('editAccountID').value,
        fullname: document.getElementById('editFullname').value,
        username: document.getElementById('editUsername').value,
        email: document.getElementById('editEmail').value,
        password: document.getElementById('editPassword').value,
        position: document.getElementById('editPosition').value,
        committee: document.getElementById('editCommittee').value
    };
    bootstrap.Modal.getInstance(document.getElementById('editAccountModal')).hide();
    renderResponsiveContent(); // Render both table and cards
});

// Initialize the content
renderResponsiveContent();
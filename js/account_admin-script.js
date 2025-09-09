let administrators = [];
let committees = [];
let systemModules = [];
let currentFormData = null;

// API endpoint - adjust path as needed
const API_ENDPOINT = '../php-handlers/admin_account/get-admin-accounts.php';

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadAdministrators();
    loadCommittees();
    loadSystemModules();
    setupEventListeners();
});

// Load administrators from database
async function loadAdministrators() {
    try {
        const searchParams = new URLSearchParams({
            search: document.getElementById('nameSearch')?.value || '',
            role: document.getElementById('filterRole')?.value || '',
            status: document.getElementById('filterStatus')?.value || ''
        });
        
        const response = await fetch(`${API_ENDPOINT}?${searchParams}`);
        const data = await response.json();
        
        if (data.success) {
            administrators = data.data.map(admin => ({
                id: admin.admin_id,
                employeeId: admin.employee_id,
                firstName: admin.first_name,
                middleName: admin.middle_name || '',
                lastName: admin.last_name,
                position: admin.position,
                contactNumber: admin.contact_number,
                committee: admin.committee_id,
                committeeName: admin.committee_name || 'Not Assigned',
                email: admin.email,
                accessRole: admin.access_role,
                assignedModules: admin.assignedModules || [],
                status: admin.status || 'Active',
                createdBy: admin.created_by,
                createdDate: admin.created_at,
                profilePicture: admin.profile_picture,
                userId: admin.user_id
            }));
            renderAdministrators();
        } else {
            console.error('Error loading administrators:', data.error);
            showAlert('Error loading administrators: ' + data.error, 'danger');
        }
    } catch (error) {
        console.error('Network error loading administrators:', error);
        showAlert('Error loading administrators. Please try again.', 'danger');
    }
}

// Load committees from database
async function loadCommittees() {
    try {
        const response = await fetch(`${API_ENDPOINT}?action=committees`);
        const data = await response.json();
        
        if (data.success) {
            committees = data.committees;
            populateCommitteeDropdown();
        } else {
            console.error('Error loading committees:', data.error);
        }
    } catch (error) {
        console.error('Network error loading committees:', error);
    }
}

// Load system modules from database
async function loadSystemModules() {
    try {
        const response = await fetch(`${API_ENDPOINT}?action=modules`);
        const data = await response.json();
        
        if (data.success) {
            systemModules = data.modules;
            populateModuleCheckboxes();
        } else {
            console.error('Error loading modules:', data.error);
            const moduleContainer = document.getElementById('moduleAccessSection');
            const rowContainer = moduleContainer.querySelector('.row');
            if (rowContainer) {
                rowContainer.innerHTML = '<div class="col-12"><p class="text-danger text-center">Error loading modules. Please refresh the page.</p></div>';
            }
        }
    } catch (error) {
        console.error('Network error loading modules:', error);
        const moduleContainer = document.getElementById('moduleAccessSection');
        const rowContainer = moduleContainer.querySelector('.row');
        if (rowContainer) {
            rowContainer.innerHTML = '<div class="col-12"><p class="text-danger text-center">Failed to load modules. Please check your connection and refresh the page.</p></div>';
        }
    }
}

// Populate committee dropdown
function populateCommitteeDropdown() {
    const committeeSelect = document.getElementById('committee');
    if (!committeeSelect) return;
    
    committeeSelect.innerHTML = '<option value="">Select Committee</option>';
    
    committees.forEach(committee => {
        const option = document.createElement('option');
        option.value = committee.committee_id;
        option.textContent = committee.committee_name;
        committeeSelect.appendChild(option);
    });
}

// Populate module checkboxes
function populateModuleCheckboxes() {
    const moduleContainer = document.getElementById('moduleAccessSection');
    const rowContainer = moduleContainer.querySelector('.row');
    
    if (!rowContainer) {
        console.error('Module row container not found');
        return;
    }
    
    rowContainer.innerHTML = '';
    
    if (!systemModules || systemModules.length === 0) {
        rowContainer.innerHTML = '<div class="col-12"><p class="text-muted text-center">Loading modules...</p></div>';
        return;
    }
    
    const col1 = document.createElement('div');
    col1.className = 'col-md-6';
    const col2 = document.createElement('div');
    col2.className = 'col-md-6';
    
    const activeModules = systemModules.filter(module => module.is_active == 1);
    
    if (activeModules.length === 0) {
        rowContainer.innerHTML = '<div class="col-12"><p class="text-muted text-center">No active modules available</p></div>';
        return;
    }
    
    activeModules.forEach((module, index) => {
        const moduleDiv = document.createElement('div');
        moduleDiv.className = 'access-module';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'form-check-input';
        checkbox.id = `module_${module.module_id}`;
        checkbox.name = 'modules[]';
        checkbox.value = module.module_code;
        
        const label = document.createElement('label');
        label.className = 'form-check-label ms-2';
        label.htmlFor = `module_${module.module_id}`;
        label.textContent = module.module_name;
        
        if (module.module_description) {
            label.title = module.module_description;
        }
        
        moduleDiv.appendChild(checkbox);
        moduleDiv.appendChild(label);
        
        if (index % 2 === 0) {
            col1.appendChild(moduleDiv);
        } else {
            col2.appendChild(moduleDiv);
        }
    });
    
    rowContainer.appendChild(col1);
    rowContainer.appendChild(col2);
}

function setupEventListeners() {
    // Profile picture upload
    document.getElementById('profilePic')?.addEventListener('change', handleProfilePicture);
    
    // Access role change
    document.getElementById('accessRole')?.addEventListener('change', toggleModuleAccess);
    
    // Create account button
    document.getElementById('createAdminBtn')?.addEventListener('click', handleCreateAdmin);
    
    // Password verification
    document.getElementById('verifyPasswordBtn')?.addEventListener('click', verifyPassword);
    
    // Enter key on password field
    document.getElementById('currentPassword')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            verifyPassword();
        }
    });
    
    // Search and filter
    document.getElementById('nameSearch')?.addEventListener('input', filterAdministrators);
    document.getElementById('filterRole')?.addEventListener('change', filterAdministrators);
    document.getElementById('filterStatus')?.addEventListener('change', filterAdministrators);
}

function handleProfilePicture(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            showAlert('File size must be less than 2MB', 'danger');
            event.target.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('profilePreview').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function toggleModuleAccess() {
    const role = document.getElementById('accessRole').value;
    const moduleSection = document.getElementById('moduleAccessSection');
    
    if (role === 'Sub-admin') {
        moduleSection.classList.remove('hidden');
    } else {
        moduleSection.classList.add('hidden');
        // Uncheck all modules if admin
        document.querySelectorAll('#moduleAccessSection input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
    }
}

function validateForm() {
    const form = document.getElementById('createAdminForm');
    const requiredFields = ['firstName', 'lastName', 'position', 'employeeId', 'contactNumber', 'accessRole'];
    
    for (let field of requiredFields) {
        const element = document.getElementById(field);
        if (!element.value.trim()) {
            element.focus();
            element.classList.add('is-invalid');
            setTimeout(() => element.classList.remove('is-invalid'), 3000);
            return false;
        }
    }
    
    // Check if sub-admin has at least one module selected
    const role = document.getElementById('accessRole').value;
    if (role === 'Sub-admin') {
        const checkedModules = document.querySelectorAll('#moduleAccessSection input[type="checkbox"]:checked');
        if (checkedModules.length === 0) {
            showAlert('Sub-admin must have at least one module assigned.', 'warning');
            document.getElementById('moduleAccessSection').scrollIntoView({ behavior: 'smooth' });
            return false;
        }
    }
    
    // Check for duplicate employee ID
    const employeeId = document.getElementById('employeeId').value;
    if (administrators.some(admin => admin.employeeId === employeeId)) {
        showAlert('Employee ID already exists. Please use a different ID.', 'danger');
        document.getElementById('employeeId').focus();
        return false;
    }
    
    return true;
}

function handleCreateAdmin() {
    if (!validateForm()) {
        return;
    }
    
    // Store form data
    const formData = new FormData(document.getElementById('createAdminForm'));
    currentFormData = Object.fromEntries(formData.entries());
    
    // Get selected modules for sub-admin
    if (currentFormData.accessRole === 'Sub-admin') {
        const checkedModules = Array.from(document.querySelectorAll('#moduleAccessSection input[type="checkbox"]:checked'))
            .map(cb => cb.value);
        currentFormData.modules = checkedModules;
    } else {
        currentFormData.modules = [];
    }
    
    // Hide create modal and show verification modal
    bootstrap.Modal.getInstance(document.getElementById('createAdminModal')).hide();
    new bootstrap.Modal(document.getElementById('passwordVerificationModal')).show();
}

async function verifyPassword() {
    const password = document.getElementById('currentPassword').value;
    const passwordError = document.getElementById('passwordError');
    const passwordField = document.getElementById('currentPassword');
    
    if (!password.trim()) {
        passwordField.classList.add('is-invalid');
        passwordError.textContent = 'Password is required.';
        passwordField.focus();
        return;
    }
    
    try {
        // Verify password with server
        const formData = new FormData();
        formData.append('current_password', password);
        
        const response = await fetch(`${API_ENDPOINT}?verify_password=1`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Password correct, proceed with account creation
            createAdminAccount();
        } else {
            // Password incorrect
            passwordField.classList.add('is-invalid');
            passwordError.textContent = 'Incorrect password. Please try again.';
            passwordField.focus();
        }
    } catch (error) {
        console.error('Password verification error:', error);
        passwordField.classList.add('is-invalid');
        passwordError.textContent = 'Error verifying password. Please try again.';
    }
}

async function createAdminAccount() {
    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('firstName', currentFormData.firstName);
        formData.append('middleName', currentFormData.middleName || '');
        formData.append('lastName', currentFormData.lastName);
        formData.append('employeeId', currentFormData.employeeId);
        formData.append('position', currentFormData.position);
        formData.append('contactNumber', currentFormData.contactNumber);
        formData.append('committee', currentFormData.committee || '');
        formData.append('accessRole', currentFormData.accessRole);
        formData.append('modules', JSON.stringify(currentFormData.modules || []));
        formData.append('createdBy', 'IT001'); // Should come from current user session
        
        // Add profile picture if exists
        const profilePicFile = document.getElementById('profilePic').files[0];
        if (profilePicFile) {
            formData.append('profilePicture', profilePicFile);
        }
        
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Hide verification modal and show success modal
            bootstrap.Modal.getInstance(document.getElementById('passwordVerificationModal')).hide();
            showSuccessModal(data.data);
            
            // Refresh administrators list
            await loadAdministrators();
        } else {
            throw new Error(data.error || 'Unknown error occurred');
        }
        
    } catch (error) {
        console.error('Error creating admin:', error);
        showAlert('Error creating admin: ' + error.message, 'danger');
        
        // Go back to create modal
        bootstrap.Modal.getInstance(document.getElementById('passwordVerificationModal')).hide();
        new bootstrap.Modal(document.getElementById('createAdminModal')).show();
    }
}

function showSuccessModal(adminData) {
    document.getElementById('successEmployeeId').textContent = adminData.employee_id;
    document.getElementById('successEmail').textContent = adminData.email;
    document.getElementById('successPassword').textContent = adminData.temp_password;
    
    new bootstrap.Modal(document.getElementById('successModal')).show();
}

function copyPassword() {
    const password = document.getElementById('successPassword').textContent;
    navigator.clipboard.writeText(password).then(() => {
        const btn = event.target.closest('button');
        const icon = btn.querySelector('i');
        const originalClass = icon.className;
        icon.className = 'bi bi-check';
        setTimeout(() => {
            icon.className = originalClass;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy password:', err);
        showAlert('Failed to copy password to clipboard', 'warning');
    });
}

function closeSuccessModal() {
    bootstrap.Modal.getInstance(document.getElementById('successModal')).hide();
    resetCreateForm();
}

function cancelPasswordVerification() {
    bootstrap.Modal.getInstance(document.getElementById('passwordVerificationModal')).hide();
    new bootstrap.Modal(document.getElementById('createAdminModal')).show();
    
    // Clear password field
    document.getElementById('currentPassword').value = '';
    document.getElementById('currentPassword').classList.remove('is-invalid');
    document.getElementById('passwordError').textContent = '';
}

function resetCreateForm() {
    document.getElementById('createAdminForm').reset();
    document.getElementById('profilePreview').src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%23dee2e6' viewBox='0 0 16 16'%3E%3Cpath d='M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0z'/%3E%3Cpath fill-rule='evenodd' d='M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1z'/%3E%3C/svg%3E";
    document.getElementById('moduleAccessSection').classList.add('hidden');
    document.getElementById('currentPassword').value = '';
    document.getElementById('currentPassword').classList.remove('is-invalid');
    document.getElementById('passwordError').textContent = '';
    currentFormData = null;
}

// Filter administrators based on search and filter criteria
async function filterAdministrators() {
    await loadAdministrators(); // Reload with current filters
}

function renderAdministrators() {
    renderTable();
    renderCards();
}

function renderTable() {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;
    
    if (administrators.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    <i class="bi bi-inbox fs-1 text-muted"></i>
                    <p class="text-muted mt-2">No administrators found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = '';
    
    administrators.forEach((admin, index) => {
        const fullName = `${admin.firstName} ${admin.middleName} ${admin.lastName}`.replace(/\s+/g, ' ').trim();
        const statusBadge = getStatusBadge(admin.status);
        
        tbody.innerHTML += `
            <tr>
                <td><strong>${admin.employeeId}</strong></td>
                <td>
                    <div class="d-flex align-items-center">
                        ${admin.profilePicture ? 
                            `<img src="../uploads/profiles/${admin.profilePicture}" alt="Profile" class="rounded-circle me-2" width="32" height="32">` :
                            `<div class="bg-secondary rounded-circle d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
                                <i class="bi bi-person text-white"></i>
                            </div>`
                        }
                        <span>${fullName}</span>
                    </div>
                </td>
                <td>${admin.position}</td>
                <td class="text-truncate" style="max-width: 200px;">${admin.email}</td>
                <td>${admin.contactNumber}</td>
                <td><span class="badge bg-primary">${admin.accessRole}</span></td>
                <td>${statusBadge}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info" onclick="viewAdmin(${index})" title="View Details">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="editAdmin(${index})" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-${admin.status === 'Active' ? 'secondary' : 'success'}" 
                                onclick="toggleStatus(${index})" 
                                title="${admin.status === 'Active' ? 'Suspend' : 'Activate'}">
                            <i class="bi bi-${admin.status === 'Active' ? 'pause' : 'play'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function renderCards() {
    const container = document.getElementById('adminCardsContainer');
    if (!container) return;
    
    if (administrators.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="bi bi-inbox fs-1 text-muted"></i>
                <p class="text-muted mt-2">No administrators found</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    administrators.forEach((admin, index) => {
        const fullName = `${admin.firstName} ${admin.middleName} ${admin.lastName}`.replace(/\s+/g, ' ').trim();
        const statusBadge = getStatusBadge(admin.status);
        const moduleCount = admin.assignedModules ? admin.assignedModules.length : 0;
        
        const assignedModuleNames = admin.assignedModules && admin.assignedModules.length > 0
            ? admin.assignedModules.map(moduleCode => {
                const module = systemModules.find(m => m.module_code === moduleCode);
                return module ? module.module_name : moduleCode;
            }).join(', ')
            : 'No modules assigned';
        
        container.innerHTML += `
            <div class="card mb-3 admin-card">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="d-flex align-items-center">
                            ${admin.profilePicture ? 
                                `<img src="../uploads/profiles/${admin.profilePicture}" alt="Profile" class="rounded-circle me-3" width="50" height="50">` :
                                `<div class="bg-secondary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 50px; height: 50px;">
                                    <i class="bi bi-person text-white fs-4"></i>
                                </div>`
                            }
                            <div>
                                <h6 class="card-title mb-1">${fullName}</h6>
                                <small class="text-muted">${admin.employeeId}</small>
                            </div>
                        </div>
                        <div class="dropdown">
                            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                Actions
                            </button>
                            <ul class="dropdown-menu">
                                <li><button class="dropdown-item" onclick="viewAdmin(${index})">
                                    <i class="bi bi-eye me-2"></i>View Details
                                </button></li>
                                <li><button class="dropdown-item" onclick="editAdmin(${index})">
                                    <i class="bi bi-pencil me-2"></i>Edit
                                </button></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><button class="dropdown-item" onclick="toggleStatus(${index})">
                                    <i class="bi bi-${admin.status === 'Active' ? 'pause' : 'play'} me-2"></i>
                                    ${admin.status === 'Active' ? 'Suspend' : 'Activate'}
                                </button></li>
                            </ul>
                        </div>
                    </div>
                    
                    <div class="row mb-2">
                        <div class="col-6">
                            <small class="text-muted">Position:</small>
                            <p class="mb-0 fw-medium">${admin.position}</p>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Role:</small>
                            <p class="mb-0"><span class="badge bg-primary">${admin.accessRole}</span></p>
                        </div>
                    </div>
                    
                    <div class="row mb-2">
                        <div class="col-12">
                            <small class="text-muted">Committee:</small>
                            <p class="mb-0">${admin.committeeName}</p>
                        </div>
                    </div>
                    
                    <div class="row mb-2">
                        <div class="col-12">
                            <small class="text-muted">Email:</small>
                            <p class="mb-0 text-break">${admin.email}</p>
                        </div>
                    </div>
                    
                    <div class="row mb-2">
                        <div class="col-6">
                            <small class="text-muted">Contact:</small>
                            <p class="mb-0">${admin.contactNumber}</p>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Status:</small>
                            <p class="mb-0">${statusBadge}</p>
                        </div>
                    </div>
                    
                    ${admin.accessRole === 'Sub-admin' ? `
                    <div class="row">
                        <div class="col-12">
                            <small class="text-muted">Modules Access:</small>
                            <p class="mb-0">${moduleCount} module${moduleCount !== 1 ? 's' : ''} assigned</p>
                            ${assignedModuleNames !== 'No modules assigned' ? `<small class="text-muted">${assignedModuleNames}</small>` : '<small class="text-muted text-warning">No modules assigned</small>'}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
}

function getStatusBadge(status) {
    const badges = {
        'Active': '<span class="badge bg-success badge-status">Active</span>',
        'Suspended': '<span class="badge bg-warning badge-status">Suspended</span>',
        'Deactivated': '<span class="badge bg-danger badge-status">Deactivated</span>'
    };
    return badges[status] || '<span class="badge bg-secondary badge-status">Unknown</span>';
}

function viewAdmin(index) {
    const admin = administrators[index];
    
    const assignedModuleNames = admin.assignedModules && admin.assignedModules.length > 0
        ? admin.assignedModules.map(moduleCode => {
            const module = systemModules.find(m => m.module_code === moduleCode);
            return module ? module.module_name : moduleCode;
        }).join(', ')
        : 'No modules assigned';
    
    const adminDetails = `
Admin Details:

Name: ${admin.firstName} ${admin.middleName} ${admin.lastName}
Employee ID: ${admin.employeeId}
Position: ${admin.position}
Committee: ${admin.committeeName}
Email: ${admin.email}
Contact: ${admin.contactNumber}
Role: ${admin.accessRole}
Assigned Modules: ${assignedModuleNames}
Status: ${admin.status}
Created: ${new Date(admin.createdDate).toLocaleString()}
    `.trim();
    
    alert(adminDetails);
}

async function toggleStatus(index) {
    const admin = administrators[index];
    const newStatus = admin.status === 'Active' ? 'Suspended' : 'Active';
    
    if (!confirm(`Are you sure you want to ${newStatus.toLowerCase()} ${admin.firstName} ${admin.lastName}'s account?`)) {
        return;
    }
    
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                admin_id: admin.id,
                status: newStatus
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            admin.status = newStatus;
            renderAdministrators();
            showAlert(`Admin status updated to ${newStatus}`, 'success');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showAlert('Error updating admin status: ' + error.message, 'danger');
    }
}

// Utility function to show alerts
function showAlert(message, type = 'info') {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}
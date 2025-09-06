// Sample data storage
let goods = [
    {
        id: 'SKU001',
        name: '5kg Rice',
        category: 'Food',
        quantity: 25,
        unit: 'kg',
        points: 150,
        description: 'Premium quality rice suitable for daily consumption',
        image: '../../asset/img/default.png'
    },
    {
        id: 'SKU002',
        name: 'Priority Ticket',
        category: 'Ticket',
        quantity: 100,
        unit: 'pcs',
        points: 500,
        description: 'Priority for upcoming event',
        image: '../../asset/img/default.png'
    },
    {
        id: 'SKU003',
        name: 'Cooking Oil',
        category: 'Grocery',
        quantity: 75,
        unit: 'bottles',
        points: 80,
        description: 'High-quality cooking oil for all your cooking needs',
        image: '../../asset/img/default.png'
    },
    {
        id: 'SKU004',
        name: 'Instant Noodles',
        category: 'Food',
        quantity: 5,
        unit: 'packs',
        points: 25,
        description: 'Delicious instant noodles, ready in 3 minutes',
        image: '../../asset/img/default.png'
    },
    {
        id: 'SKU005',
        name: 'Mutya Tickets',
        category: 'Ticket',
        quantity: 40,
        unit: 'pcs',
        points: 200,
        description: 'Premium cinema experience with reserved seating',
        image: '../../asset/img/default.png'
    }
];

let editingId = null;

// Initialize the interface
document.addEventListener('DOMContentLoaded', function () {
    updateStatistics();
});

// Image preview function
function previewImage(event) {
    const preview = document.getElementById('imagePreview');
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.innerHTML = `<img src="${e.target.result}" class="preview-image" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

// View good details
function viewGood(id) {
    const good = goods.find(g => g.id === id);
    if (good) {
        const content = document.getElementById('viewGoodContent');
        content.innerHTML = `
                    <div class="row">
                        <div class="col-md-4 text-center mb-3">
                            <img src="${good.image}" alt="${good.name}" class="img-fluid rounded" style="max-width: 120px; max-height: 120px; object-fit: cover;">
                        </div>
                        <div class="col-md-8">
                            <h6><strong>ID/SKU:</strong> ${good.id}</h6>
                            <h6><strong>Name:</strong> ${good.name}</h6>
                            <h6><strong>Category:</strong> <span class="badge bg-primary">${good.category}</span></h6>
                            <h6><strong>Stock:</strong> ${good.quantity} ${good.unit}</h6>
                            <h6><strong>Points Required:</strong> <span class="badge bg-success">${good.points} pts</span></h6>
                            ${good.description ? `<h6><strong>Description:</strong></h6><p>${good.description}</p>` : ''}
                        </div>
                    </div>
                `;
        new bootstrap.Modal(document.getElementById('viewGoodModal')).show();
    }
}

// Edit good
function editGood(id) {
    const good = goods.find(g => g.id === id);
    if (good) {
        editingId = id;
        document.getElementById('addGoodModalLabel').innerHTML = '<i class="fas fa-edit me-2"></i>Edit Good';
        document.getElementById('goodId').value = good.id;
        document.getElementById('goodName').value = good.name;
        document.getElementById('category').value = good.category;
        document.getElementById('quantity').value = good.quantity;
        document.getElementById('unit').value = good.unit;
        document.getElementById('pointsRequired').value = good.points;
        document.getElementById('description').value = good.description || '';

        new bootstrap.Modal(document.getElementById('addGoodModal')).show();
    }
}

// Delete good
function deleteGood(id) {
    const good = goods.find(g => g.id === id);
    if (good) {
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        document.getElementById('confirmDelete').onclick = function () {
            goods = goods.filter(g => g.id !== id);
            refreshTable();
            updateStatistics();
            modal.hide();
            showAlert('Good deleted successfully!', 'success');
        };
        modal.show();
    }
}

// Save good (add or edit)
function saveGood() {
    const form = document.getElementById('goodForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const goodData = {
        id: editingId || generateSKU(),
        name: document.getElementById('goodName').value,
        category: document.getElementById('category').value,
        quantity: parseInt(document.getElementById('quantity').value),
        unit: document.getElementById('unit').value,
        points: parseInt(document.getElementById('pointsRequired').value),
        description: document.getElementById('description').value,
        image: '../../asset/img/default.png' // In real app, handle file upload
    };

    if (editingId) {
        // Update existing good
        const index = goods.findIndex(g => g.id === editingId);
        goods[index] = goodData;
        showAlert('Good updated successfully!', 'success');
    } else {
        // Add new good
        goods.push(goodData);
        showAlert('Good added successfully!', 'success');
    }

    // Reset form and close modal
    resetForm();
    bootstrap.Modal.getInstance(document.getElementById('addGoodModal')).hide();
    refreshTable();
    updateStatistics();
}

// Reset form
function resetForm() {
    document.getElementById('goodForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('addGoodModalLabel').innerHTML = '<i class="fas fa-plus-circle me-2"></i>Add New Good';
    editingId = null;
}

// Generate SKU
function generateSKU() {
    const timestamp = Date.now().toString().slice(-6);
    return `SKU${timestamp}`;
}

// Refresh table
function refreshTable() {
    const tbody = document.getElementById('goodsTableBody');
    tbody.innerHTML = '';

    goods.forEach(good => {
        const stockClass = good.quantity <= 10 ? 'stock-low' : good.quantity <= 30 ? 'stock-medium' : 'stock-good';
        const categoryBadge = getCategoryBadge(good.category);

        tbody.innerHTML += `
                    <tr>
                        <td><strong>${good.id}</strong></td>
                        <td>
                            <div class="d-flex align-items-center">
                                <img src="${good.image}" alt="${good.name}" class="rounded me-2" style="width: 40px; height: 40px; object-fit: cover;">
                                <span>${good.name}</span>
                            </div>
                        </td>
                        <td><span class="badge ${categoryBadge} badge-category">${good.category}</span></td>
                        <td><span class="${stockClass}">${good.quantity}</span></td>
                        <td>${good.unit}</td>
                        <td><span class="badge bg-primary">${good.points} pts</span></td>
                        <td class="action-buttons">
                            <button class="btn btn-info btn-sm" onclick="viewGood('${good.id}')" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-warning btn-sm" onclick="editGood('${good.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteGood('${good.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
    });
}

// Get category badge class
function getCategoryBadge(category) {
    switch (category) {
        case 'Food': return 'bg-success';
        case 'Grocery': return 'bg-warning text-dark';
        case 'Ticket': return 'bg-info';
        default: return 'bg-secondary';
    }
}

// Update statistics
function updateStatistics() {
    document.getElementById('totalItems').textContent = goods.length;
    document.getElementById('totalCategories').textContent = [...new Set(goods.map(g => g.category))].length;
    document.getElementById('totalStock').textContent = goods.reduce((sum, good) => sum + good.quantity, 0);
    document.getElementById('lowStock').textContent = goods.filter(g => g.quantity <= 10).length;
}

// Show alert
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 1055; min-width: 300px;';
    alertDiv.innerHTML = `
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Reset modal when it's hidden
document.getElementById('addGoodModal').addEventListener('hidden.bs.modal', function () {
    resetForm();
});

// Search and filter functionality (bonus feature)
function filterGoods() {
    const searchTerm = document.getElementById('searchInput')?.value?.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';

    let filteredGoods = goods;

    if (searchTerm) {
        filteredGoods = filteredGoods.filter(good =>
            good.name.toLowerCase().includes(searchTerm) ||
            good.id.toLowerCase().includes(searchTerm)
        );
    }

    if (categoryFilter) {
        filteredGoods = filteredGoods.filter(good => good.category === categoryFilter);
    }

    displayFilteredGoods(filteredGoods);
}

function displayFilteredGoods(filteredGoods) {
    const tbody = document.getElementById('goodsTableBody');
    tbody.innerHTML = '';

    filteredGoods.forEach(good => {
        const stockClass = good.quantity <= 10 ? 'stock-low' : good.quantity <= 30 ? 'stock-medium' : 'stock-good';
        const categoryBadge = getCategoryBadge(good.category);

        tbody.innerHTML += `
                    <tr>
                        <td><strong>${good.id}</strong></td>
                        <td>
                            <div class="d-flex align-items-center">
                                <img src="${good.image}" alt="${good.name}" class="rounded me-2" style="width: 40px; height: 40px; object-fit: cover;">
                                <span>${good.name}</span>
                            </div>
                        </td>
                        <td><span class="badge ${categoryBadge} badge-category">${good.category}</span></td>
                        <td><span class="${stockClass}">${good.quantity}</span></td>
                        <td>${good.unit}</td>
                        <td><span class="badge bg-primary">${good.points} pts</span></td>
                        <td class="action-buttons">
                            <button class="btn btn-info btn-sm" onclick="viewGood('${good.id}')" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-warning btn-sm" onclick="editGood('${good.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteGood('${good.id}')" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
    });

    if (filteredGoods.length === 0) {
        tbody.innerHTML = `
                    <tr>
                        <td colspan="7" class="text-center py-4">
                            <i class="fas fa-search fs-2 text-muted mb-2"></i>
                            <p class="text-muted mb-0">No goods found matching your criteria</p>
                        </td>
                    </tr>
                `;
    }
}
// Enhanced Incentives management with database integration
let incentives = [];
let currentIncentiveId = null;

// DOM elements
const incentiveForm = document.getElementById('goodForm');
const incentiveNameInput = document.getElementById('goodName');
const categorySelect = document.getElementById('category');
const quantityInput = document.getElementById('quantity');
const unitSelect = document.getElementById('unit');
const pointsRequiredInput = document.getElementById('pointsRequired');
const descriptionInput = document.getElementById('description');
const imageUploadInput = document.getElementById('imageUpload');
const eventDateInput = document.getElementById('eventDate');
const eventTimeInput = document.getElementById('eventTime');

// Modal elements
let addIncentiveModal;
let addStockModal;

// Initialize the page
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM Content Loaded - Initializing enhanced incentives management...');

    // Initialize Bootstrap modals
    const addIncentiveModalEl = document.getElementById('addGoodModal');
    if (addIncentiveModalEl) {
        addIncentiveModal = new bootstrap.Modal(addIncentiveModalEl);
        console.log('Add Incentive Modal initialized');
    }

    const addStockModalEl = document.getElementById('addStockModal');
    if (addStockModalEl) {
        addStockModal = new bootstrap.Modal(addStockModalEl);
        console.log('Add Stock Modal initialized');
    }

    // Load incentives from database and render table
    loadIncentivesFromDatabase();
    setupEventListeners();
    
    // Check for expired items every 5 minutes
    setInterval(checkAndUpdateExpiredItems, 300000);
});

// Load incentives from database
function loadIncentivesFromDatabase() {
    return fetch('/UswagLigaya/php-handlers/reward-management/fetch-incentives.php')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                incentives = data.incentives || [];
                console.log('Loaded incentives:', incentives);
                
                // Initialize filtered incentives with active items - using item_status
                filteredIncentives = incentives.filter(i => i.item_status !== 'expired');
                
                // Apply current filters if any are active
                if (isFilterActive()) {
                    applyFilters();
                    renderFilteredIncentiveTable();
                } else {
                    renderIncentiveTable();
                }
                
                updateStatisticsFromData(data.statistics);
                
                return true;
            } else {
                console.error('Error loading incentives:', data.message);
                showToast('Error loading incentives: ' + data.message, 'error');
                throw new Error(data.message);
            }
        })
        .catch(error => {
            console.error('Error loading incentives:', error);
            showToast('Error loading incentives from database', 'error');
            throw error;
        });
}


// Setup event listeners
// Update your existing setupEventListeners function
function setupEventListeners() {
    // Category change handler for date fields
    if (categorySelect) {
        categorySelect.addEventListener('change', toggleDateFields);
    }

    // Add new incentive button
    const addNewIncentiveBtn = document.querySelector('[data-bs-target="#addGoodModal"]');
    if (addNewIncentiveBtn) {
        addNewIncentiveBtn.removeEventListener('click', handleAddNewIncentive);
        addNewIncentiveBtn.addEventListener('click', handleAddNewIncentive);
    }

    // Form submission handler
    if (incentiveForm) {
        incentiveForm.removeEventListener('submit', handleFormSubmit);
        incentiveForm.addEventListener('submit', handleFormSubmit);
    }

    // Save incentive button
    const saveButton = document.querySelector('[onclick="saveGood()"]');
    if (saveButton) {
        saveButton.removeAttribute('onclick');
        saveButton.removeEventListener('click', handleSaveButton);
        saveButton.addEventListener('click', handleSaveButton);
    }

    setupEnhancedFilterListeners();
}

// Toggle date fields based on category selection
function toggleDateFields() {
    const category = categorySelect.value;
    const dateFields = document.getElementById('dateFields');
    const dateLabel = document.getElementById('dateLabel');
    const eventDate = document.getElementById('eventDate');
    
    if (!dateFields || !dateLabel || !eventDate) return;
    
    if (category === 'Priority Stab') {
        dateFields.style.display = 'flex';
        dateLabel.textContent = 'Service Date';
        eventDate.required = true;
        
        // Set minimum date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        eventDate.min = tomorrow.toISOString().split('T')[0];
    } else if (category === 'Event Ticket') {
        dateFields.style.display = 'flex';
        dateLabel.textContent = 'Event Date';
        eventDate.required = true;
        
        // Set minimum date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        eventDate.min = tomorrow.toISOString().split('T')[0];
    } else {
        dateFields.style.display = 'none';
        eventDate.required = false;
        eventDate.value = '';
        if (eventTimeInput) eventTimeInput.value = '';
    }
}

// Check and update expired items
function checkAndUpdateExpiredItems() {
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    let hasExpiredItems = false;
    
    incentives.forEach(incentive => {
        if (incentive.event_date && (incentive.category === 'Priority Stab' || incentive.category === 'Event Ticket')) {
            const eventDate = new Date(incentive.event_date);
            eventDate.setHours(0, 0, 0, 0);
            
            if (eventDate < currentDate && incentive.item_status !== 'expired') {
                incentive.item_status = 'expired'; // Updated to use item_status
                hasExpiredItems = true;
                console.log(`Auto-expiring item: ${incentive.name}`);
            }
        }
    });
    
    if (hasExpiredItems) {
        renderIncentiveTable();
        updateStatistics();
    }
}

// Event handler functions
function handleAddNewIncentive() {
    console.log('Add new incentive button clicked');
    resetForm();
    const modalTitle = document.querySelector('#addGoodModal .modal-title');
    if (modalTitle) {
        modalTitle.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Add New Incentive';
    }
    currentIncentiveId = null;
}

function handleFormSubmit(e) {
    e.preventDefault();
    if (currentIncentiveId) {
        updateIncentiveInDatabase();
    } else {
        saveIncentiveToDatabase();
    }
}

function handleSaveButton(e) {
    e.preventDefault();
    if (currentIncentiveId) {
        updateIncentiveInDatabase();
    } else {
        saveIncentiveToDatabase();
    }
}

// Save new incentive to database
function saveIncentiveToDatabase() {
    if (!validateForm()) return;

    const formData = new FormData();
    formData.append('name', incentiveNameInput.value.trim());
    formData.append('category', categorySelect.value);
    formData.append('quantity', quantityInput.value);
    formData.append('unit', unitSelect.value);
    formData.append('points_required', pointsRequiredInput.value);
    formData.append('description', descriptionInput ? descriptionInput.value.trim() : '');
    
    // Add date fields for Priority Stab and Event Ticket
    if (eventDateInput && eventDateInput.value && 
        (categorySelect.value === 'Priority Stab' || categorySelect.value === 'Event Ticket')) {
        formData.append('event_date', eventDateInput.value);
        if (eventTimeInput && eventTimeInput.value) {
            formData.append('event_time', eventTimeInput.value);
        }
    }
    
    if (imageUploadInput && imageUploadInput.files[0]) {
        formData.append('image', imageUploadInput.files[0]);
    }

    console.log('Sending new incentive data...');

    fetch('/UswagLigaya/php-handlers/reward-management/add-incentive.php', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            console.log('Response text:', text);
            
            try {
                const data = JSON.parse(text);
                console.log('Parsed JSON:', data);
                
                if (data.success) {
                    showToast('Incentive added successfully!');
                    if (addIncentiveModal) {
                        addIncentiveModal.hide();
                    }
                    resetForm();
                    loadIncentivesFromDatabase();
                } else {
                    showToast('Error: ' + data.message, 'error');
                }
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response was not valid JSON:', text);
                showToast('Server returned invalid response. Check console for details.', 'error');
            }
        })
        .catch(error => {
            console.error('Error during fetch:', error);
            showToast('An error occurred while submitting the form. Please try again later.', 'error');
        });
}

// Update existing incentive in database
function updateIncentiveInDatabase() {
    if (!validateForm()) return;

    const formData = new FormData();
    formData.append('id', currentIncentiveId);
    formData.append('name', incentiveNameInput.value.trim());
    formData.append('category', categorySelect.value);
    formData.append('quantity', quantityInput.value);
    formData.append('unit', unitSelect.value);
    formData.append('points_required', pointsRequiredInput.value);
    formData.append('description', descriptionInput ? descriptionInput.value.trim() : '');
    
    // Add date fields for Priority Stab and Event Ticket
    if (eventDateInput && eventDateInput.value && 
        (categorySelect.value === 'Priority Stab' || categorySelect.value === 'Event Ticket')) {
        formData.append('event_date', eventDateInput.value);
        if (eventTimeInput && eventTimeInput.value) {
            formData.append('event_time', eventTimeInput.value);
        }
    }
    
    // Handle image upload or removal
    const imageUploadInput = document.getElementById('imageUpload');
    if (imageUploadInput && imageUploadInput.files[0]) {
        // New image selected
        formData.append('image', imageUploadInput.files[0]);
    } else if (imageUploadInput && imageUploadInput.dataset.removeImage === 'true') {
        // Mark for image removal
        formData.append('remove_image', 'true');
    }

    console.log('Updating incentive with ID:', currentIncentiveId);

    fetch('/UswagLigaya/php-handlers/reward-management/update-incentive.php', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            console.log('Update response text:', text);
            
            try {
                const data = JSON.parse(text);
                console.log("Server response:", data);
                
                if (data.success) {
                    showToast("Incentive successfully updated!");
                    if (addIncentiveModal) {
                        addIncentiveModal.hide();
                    }
                    resetForm();
                    currentIncentiveId = null;
                    loadIncentivesFromDatabase();
                } else {
                    showToast("Error: " + data.message, 'error');
                }
            } catch (parseError) {
                console.error('JSON parse error on update:', parseError);
                console.error('Response was not valid JSON:', text);
                showToast('Server returned invalid response during update.', 'error');
            }
        })
        .catch(error => {
            console.error("Request error:", error);
            showToast("An unexpected error occurred.", 'error');
        });
}

// Validate form inputs
function validateForm() {
    if (!incentiveNameInput || !categorySelect || !quantityInput || !unitSelect || !pointsRequiredInput) {
        showToast('Form elements not found!', 'error');
        return false;
    }

    const incentiveName = incentiveNameInput.value.trim();
    const category = categorySelect.value;
    const quantity = quantityInput.value;
    const unit = unitSelect.value;
    const pointsRequired = pointsRequiredInput.value;

    if (!incentiveName || !category || !quantity || !unit || !pointsRequired) {
        showToast('Please fill in all required fields!', 'error');
        return false;
    }

    // Validate date for Priority Stab and Event Ticket
    if ((category === 'Priority Stab' || category === 'Event Ticket')) {
        if (!eventDateInput || !eventDateInput.value) {
            const dateType = category === 'Priority Stab' ? 'Service' : 'Event';
            showToast(`${dateType} date is required for ${category}!`, 'error');
            return false;
        }

        const eventDate = new Date(eventDateInput.value);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        if (eventDate <= currentDate) {
            showToast('Event/Service date must be in the future!', 'error');
            return false;
        }
    }

    return true;
}

// Show add stock modal
function showAddStockModal(id) {
    const incentive = incentives.find(i => (i.id == id || i.reward_id == id));
    if (!incentive) return;

    document.getElementById('stockItemId').value = id;
    document.getElementById('stockItemName').textContent = incentive.reward_name || incentive.name;
    document.getElementById('stockItemDetails').textContent = 
        `Current Stock: ${incentive.quantity} ${incentive.unit} | Category: ${incentive.reward_type || incentive.category}`;
    
    const warningDiv = document.getElementById('stockDateWarning');
    const confirmButton = document.getElementById('confirmAddStock');
    
    // Check if item has expiration date and validate
    if (incentive.event_date && (incentive.reward_type === 'Priority Stab' || incentive.reward_type === 'Event Ticket' || 
                                 incentive.category === 'Priority Stab' || incentive.category === 'Event Ticket')) {
        const eventDate = new Date(incentive.event_date);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        if (eventDate <= currentDate) {
            warningDiv.style.display = 'block';
            document.getElementById('stockDateMessage').textContent = 
                'Cannot add stock to expired items. The service/event date has passed.';
            confirmButton.disabled = true;
        } else {
            warningDiv.style.display = 'block';
            document.getElementById('stockDateMessage').textContent = 
                `Note: Stock can only be added until ${eventDate.toLocaleDateString()}.`;
            confirmButton.disabled = false;
        }
    } else {
        warningDiv.style.display = 'none';
        confirmButton.disabled = false;
    }

    if (addStockModal) {
        addStockModal.show();
    }
}

// Confirm add stock
function confirmAddStock() {
    const id = parseInt(document.getElementById('stockItemId').value);
    const quantityToAdd = parseInt(document.getElementById('stockQuantity').value);
    
    if (!quantityToAdd || quantityToAdd < 1) {
        showToast('Please enter a valid quantity to add.', 'error');
        return;
    }

    const requestData = {
        id: id,
        quantity_to_add: quantityToAdd
    };

    fetch('/UswagLigaya/php-handlers/reward-management/add-stock.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(text => {
        try {
            const data = JSON.parse(text);
            if (data.success) {
                showToast(data.message);
                if (addStockModal) {
                    addStockModal.hide();
                }
                document.getElementById('stockQuantity').value = '';
                loadIncentivesFromDatabase();
            } else {
                showToast('Error: ' + data.message, 'error');
            }
        } catch (parseError) {
            console.error('JSON parse error on add stock:', parseError);
            console.error('Response was not valid JSON:', text);
            showToast('Server returned invalid response during stock addition.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('An error occurred while adding stock.', 'error');
    });
}

// Render incentive table
function renderIncentiveTable() {
    // Always ensure filteredIncentives is properly initialized
    if (!Array.isArray(filteredIncentives) || filteredIncentives.length === 0) {
        filteredIncentives = incentives.filter(i => i.status !== 'expired');
    }
    
    // Use the enhanced filtered rendering
    renderFilteredIncentiveTable();
}

// Update statistics from server data
function updateStatisticsFromData(stats) {
    const totalItemsEl = document.getElementById('totalItems');
    const inStockItemsEl = document.getElementById('inStockItems');
    const lowStockItemsEl = document.getElementById('lowStockItems');
    const outOfStockItemsEl = document.getElementById('outOfStockItems');

    if (totalItemsEl) totalItemsEl.textContent = stats.total_items || 0;
    if (inStockItemsEl) inStockItemsEl.textContent = stats.in_stock_items || 0;
    if (lowStockItemsEl) lowStockItemsEl.textContent = stats.low_stock_items || 0;
    if (outOfStockItemsEl) outOfStockItemsEl.textContent = stats.out_of_stock_items || 0;
}

// Update statistics from local data
function updateStatistics() {
    const activeIncentives = incentives.filter(i => i.item_status !== 'expired' && i.item_status !== 'archived');
    
    const totalItems = activeIncentives.length;
    const inStockItems = activeIncentives.filter(i => i.quantity > 0).length;
    const lowStockItems = activeIncentives.filter(i => i.quantity <= (i.low_stock_threshold || 5) && i.quantity > 0).length;
    const outOfStockItems = activeIncentives.filter(i => i.quantity === 0).length;

    const totalItemsEl = document.getElementById('totalItems');
    const inStockItemsEl = document.getElementById('inStockItems');
    const lowStockItemsEl = document.getElementById('lowStockItems');
    const outOfStockItemsEl = document.getElementById('outOfStockItems');

    if (totalItemsEl) totalItemsEl.textContent = totalItems;
    if (inStockItemsEl) inStockItemsEl.textContent = inStockItems;
    if (lowStockItemsEl) lowStockItemsEl.textContent = lowStockItems;
    if (outOfStockItemsEl) outOfStockItemsEl.textContent = outOfStockItems;
}


// Filter incentives
function filterIncentives() {
    const searchInput = document.getElementById('search');
    const categoryFilter = document.querySelector('select[aria-label="Filter by category"]');
    
    if (!searchInput || !categoryFilter) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const categoryFilterValue = categoryFilter.value;
    
    let filteredIncentives = incentives.filter(i => i.status !== 'expired');
    
    if (searchTerm) {
        filteredIncentives = filteredIncentives.filter(incentive => {
            const name = incentive.reward_name || incentive.name || '';
            const description = incentive.description || '';
            return name.toLowerCase().includes(searchTerm) || description.toLowerCase().includes(searchTerm);
        });
    }
    
    if (categoryFilterValue) {
        filteredIncentives = filteredIncentives.filter(incentive => {
            const category = incentive.category || incentive.reward_type || '';
            return category === categoryFilterValue;
        });
    }
    
    // Temporarily replace incentives array for rendering
    const originalIncentives = incentives;
    incentives = filteredIncentives;
    renderIncentiveTable();
    incentives = originalIncentives;
}

// Legacy function implementations for backward compatibility
// Fixed viewGood function to properly show the modal
function viewGood(id) {
    const incentive = incentives.find(i => (i.id == id || i.reward_id == id));
    if (!incentive) {
        showToast('Incentive not found', 'error');
        return;
    }
    
    console.log('Viewing incentive:', incentive);
    
    // Get the modal elements
    const viewModal = document.getElementById('viewGoodModal');
    const modalContent = document.getElementById('viewGoodContent');
    const modalTitle = document.getElementById('viewGoodModalLabel');
    
    if (!viewModal || !modalContent || !modalTitle) {
        console.error('View modal elements not found');
        showToast('Modal elements not found', 'error');
        return;
    }
    
    // Set modal title
    modalTitle.textContent = `${incentive.reward_name || incentive.name} Details`;
    
    // Determine status and stock info
    let stockStatusClass = 'text-success';
    let stockStatusText = 'Good Stock';
    
    if (incentive.quantity === 0) {
        stockStatusClass = 'text-danger';
        stockStatusText = 'Out of Stock';
    } else if (incentive.quantity <= (incentive.low_stock_threshold || 5)) {
        stockStatusClass = 'text-warning';
        stockStatusText = 'Low Stock';
    }
    
    // Format event date if available
    let eventDateInfo = '';
    if (incentive.event_date) {
        const eventDate = new Date(incentive.event_date);
        const currentDate = new Date();
        const diffTime = eventDate - currentDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        eventDateInfo = `
            <div class="row mb-3">
                <div class="col-4"><strong>Event/Service Date:</strong></div>
                <div class="col-8">
                    ${eventDate.toLocaleDateString()}
                    ${incentive.event_time ? ` at ${incentive.event_time}` : ''}
                    ${diffDays > 0 ? `<br><small class="text-muted">${diffDays} days remaining</small>` : 
                      diffDays === 0 ? `<br><small class="text-warning">Today!</small>` :
                      `<br><small class="text-danger">Expired ${Math.abs(diffDays)} days ago</small>`}
                </div>
            </div>
        `;
    }
    
    // Set modal content
    modalContent.innerHTML = `
        <div class="container-fluid">
            <div class="row mb-3">
                <div class="col-4 text-center">
                    <img src="${incentive.image_url || incentive.image || '../../asset/img/default.png'}" 
                         alt="${incentive.reward_name || incentive.name}" 
                         class="img-fluid rounded"
                         style="max-width: 150px; max-height: 150px; object-fit: cover;"
                         onerror="this.src='../../asset/img/default.png'">
                </div>
                <div class="col-8">
                    <h5 class="mb-3">${incentive.reward_name || incentive.name}</h5>
                    <div class="row mb-2">
                        <div class="col-4"><strong>SKU:</strong></div>
                        <div class="col-8">SKU${String(incentive.reward_id || incentive.id).padStart(3, '0')}</div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-4"><strong>Category:</strong></div>
                        <div class="col-8">
                            <span class="badge ${getCategoryBadgeClass(incentive.reward_type || incentive.category)}">
                                ${incentive.reward_type || incentive.category}
                            </span>
                        </div>
                    </div>
                    <div class="row mb-2">
                        <div class="col-4"><strong>Stock Status:</strong></div>
                        <div class="col-8">
                            <span class="${stockStatusClass} fw-bold">${stockStatusText}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <hr>
            
            <div class="row mb-3">
                <div class="col-4"><strong>Current Stock:</strong></div>
                <div class="col-8">${incentive.quantity} ${incentive.unit}</div>
            </div>
            
            <div class="row mb-3">
                <div class="col-4"><strong>Points Required:</strong></div>
                <div class="col-8">
                    <span class="badge bg-primary fs-6">${incentive.points_required} points</span>
                </div>
            </div>
            
            ${eventDateInfo}
            
            <div class="row mb-3">
                <div class="col-4"><strong>Status:</strong></div>
                <div class="col-8">
                    <span class="badge ${getStatusBadgeClass(incentive.item_status || incentive.status)}">
                        ${getStatusText(incentive.item_status || incentive.status, incentive.quantity)}
                    </span>
                </div>
            </div>
            
            ${incentive.description ? `
                <div class="row mb-3">
                    <div class="col-4"><strong>Description:</strong></div>
                    <div class="col-8">${incentive.description}</div>
                </div>
            ` : ''}
            
            <div class="row mb-3">
                <div class="col-4"><strong>Created:</strong></div>
                <div class="col-8">${incentive.created_at ? new Date(incentive.created_at).toLocaleDateString() : 'N/A'}</div>
            </div>
        </div>
    `;
    
    // Show the modal
    const bsModal = new bootstrap.Modal(viewModal);
    bsModal.show();
}

// Helper functions for the view modal
function getCategoryBadgeClass(category) {
    if (!category) return 'bg-secondary';
    
    switch(category.toLowerCase()) {
        case 'goods':
            return 'bg-success';
        case 'priority stab':
            return 'bg-warning text-dark';
        case 'event ticket':
            return 'bg-info';
        default:
            return 'bg-primary';
    }
}

function getStatusBadgeClass(status) {
    if (!status) return 'bg-secondary';
    
    switch(status.toLowerCase()) {
        case 'active':
            return 'bg-success';
        case 'expired':
            return 'bg-danger';
        case 'archived':
            return 'bg-secondary';
        case 'disabled':
            return 'bg-warning text-dark';
        default:
            return 'bg-primary';
    }
}

function getStatusText(status, quantity) {
    if (!status) {
        return quantity > 0 ? 'Active' : 'Out of Stock';
    }
    
    switch(status.toLowerCase()) {
        case 'active':
            return quantity > 0 ? 'Active' : 'Out of Stock';
        case 'expired':
            return 'Expired';
        case 'archived':
            return 'Archived';
        case 'disabled':
            return 'Disabled';
        default:
            return status;
    }
}

function editGood(id) {
    const incentive = incentives.find(i => (i.id == id || i.reward_id == id));
    if (incentive) {
        resetForm();
        const modalTitle = document.querySelector('#addGoodModal .modal-title');
        if (modalTitle) {
            modalTitle.innerHTML = '<i class="bi bi-pencil me-2"></i>Edit Incentive';
        }
        currentIncentiveId = id;
        
        // Populate form - use correct field names
        if (incentiveNameInput) incentiveNameInput.value = incentive.reward_name || incentive.name || '';
        if (categorySelect) {
            categorySelect.value = incentive.reward_type || incentive.category || '';
            toggleDateFields(); // Show/hide date fields based on category
        }
        if (quantityInput) quantityInput.value = incentive.quantity || '';
        if (unitSelect) unitSelect.value = incentive.unit || '';
        if (pointsRequiredInput) pointsRequiredInput.value = incentive.points_required || '';
        if (descriptionInput) descriptionInput.value = incentive.description || '';
        if (eventDateInput) eventDateInput.value = incentive.event_date || '';
        if (eventTimeInput) eventTimeInput.value = incentive.event_time || '';
        
        // Handle image display and management
        displayCurrentImage(incentive);
        
        if (addIncentiveModal) {
            addIncentiveModal.show();
        }
    }
}

function displayCurrentImage(incentive) {
    const imagePreview = document.getElementById('imagePreview');
    if (!imagePreview) return;
    
    const currentImageUrl = incentive.image_url || incentive.image;
    let imageSrc = '../../asset/img/default.png'; // Default image
    
    // Determine the correct image path
    if (currentImageUrl) {
        if (currentImageUrl.startsWith('../../uploads/incentives/')) {
            imageSrc = currentImageUrl;
        } else if (currentImageUrl.includes('uploads/incentives/')) {
            imageSrc = currentImageUrl;
        } else {
            // Handle other formats or construct the path
            imageSrc = currentImageUrl.startsWith('http') ? currentImageUrl : 
                      (currentImageUrl.startsWith('/') ? currentImageUrl : `../../uploads/incentives/${currentImageUrl}`);
        }
    }
    
    imagePreview.innerHTML = `
        <div class="current-image-container mt-2">
            <label class="form-label text-muted small">Current Image:</label>
            <div class="position-relative d-inline-block">
                <img id="currentImage" 
                     src="${imageSrc}" 
                     alt="Current incentive image" 
                     class="img-fluid rounded border current-image-preview"
                     style="max-width: 200px; max-height: 200px; object-fit: cover; cursor: pointer;"
                     onerror="this.src='../../asset/img/default.png'"
                     onclick="enlargeImage('${imageSrc}')">
                ${currentImageUrl && currentImageUrl !== '../../asset/img/default.png' ? `
                    <button type="button" 
                            class="btn btn-danger btn-sm position-absolute remove-image-btn"
                            style="top: -5px; right: -5px; width: 25px; height: 25px; border-radius: 50%; padding: 0; font-size: 12px;"
                            onclick="removeCurrentImage()"
                            title="Remove current image">
                        <i class="bi bi-x"></i>
                    </button>
                ` : ''}
            </div>
            <div class="mt-2">
                <small class="text-muted">Click image to view larger. Upload a new image to replace the current one.</small>
            </div>
        </div>
    `;
    
    // Add some CSS for better styling
    addImagePreviewStyles();
}

function addImagePreviewStyles() {
    const existingStyles = document.getElementById('imagePreviewStyles');
    if (existingStyles) return;
    
    const styles = document.createElement('style');
    styles.id = 'imagePreviewStyles';
    styles.textContent = `
        .current-image-preview {
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .current-image-preview:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        .remove-image-btn {
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            z-index: 10;
        }
        .remove-image-btn:hover {
            transform: scale(1.1);
        }
        .current-image-container {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
        }
    `;
    document.head.appendChild(styles);
}

function enlargeImage(imageSrc) {
    // Remove existing enlarged modal if present
    const existingModal = document.getElementById('enlargedImageModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modalHtml = `
        <div class="modal fade" id="enlargedImageModal" tabindex="-1">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="bi bi-image me-2"></i>Current Incentive Image
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center p-4">
                        <img src="${imageSrc}" 
                             alt="Enlarged incentive image" 
                             class="img-fluid rounded"
                             style="max-width: 100%; max-height: 70vh; object-fit: contain;"
                             onerror="this.src='../../asset/img/default.png'">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const enlargedModal = new bootstrap.Modal(document.getElementById('enlargedImageModal'));
    enlargedModal.show();
    
    // Clean up modal after hiding
    document.getElementById('enlargedImageModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Remove current image (mark for removal)
function removeCurrentImage() {
    if (confirm('Are you sure you want to remove the current image? The default image will be used instead.')) {
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) {
            imagePreview.innerHTML = `
                <div class="removed-image-notice mt-2 p-3 bg-light border rounded">
                    <div class="text-center text-muted">
                        <i class="bi bi-image-fill fa-2x mb-2 d-block"></i>
                        <div><strong>Current image will be removed</strong></div>
                        <div class="small">Default image will be used after saving</div>
                        <button type="button" class="btn btn-sm btn-outline-secondary mt-2" onclick="restoreCurrentImage()">
                            <i class="bi bi-arrow-clockwise me-1"></i>Undo Remove
                        </button>
                    </div>
                </div>
            `;
            
            // Set a flag to indicate image should be removed
            const imageUploadInput = document.getElementById('imageUpload');
            if (imageUploadInput) {
                imageUploadInput.dataset.removeImage = 'true';
            }
        }
        
        showToast('Image marked for removal. Upload a new image or save to apply changes.', 'info');
    }
}

// Restore current image (undo remove action)
function restoreCurrentImage() {
    const incentive = incentives.find(i => (i.id == currentIncentiveId || i.reward_id == currentIncentiveId));
    if (incentive) {
        displayCurrentImage(incentive);
        
        // Remove the remove flag
        const imageUploadInput = document.getElementById('imageUpload');
        if (imageUploadInput) {
            delete imageUploadInput.dataset.removeImage;
        }
        
        showToast('Image removal cancelled.', 'info');
    }
}

// Enhanced image preview function that works with both new uploads and existing images
function previewImage(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('imagePreview');
    
    if (file && previewContainer) {
        // Clear any remove image flag when new file is selected
        delete event.target.dataset.removeImage;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            previewContainer.innerHTML = `
                <div class="new-image-preview mt-2">
                    <label class="form-label text-success small">
                        <i class="bi bi-upload me-1"></i>New Image Selected:
                    </label>
                    <div class="position-relative d-inline-block">
                        <img src="${e.target.result}" 
                             alt="New image preview" 
                             class="img-fluid rounded border"
                             style="max-width: 200px; max-height: 200px; object-fit: cover;">
                        <button type="button" 
                                class="btn btn-secondary btn-sm position-absolute"
                                style="top: -5px; right: -5px; width: 25px; height: 25px; border-radius: 50%; padding: 0; font-size: 12px;"
                                onclick="clearImageSelection()"
                                title="Clear selection">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                    <div class="mt-2">
                        <small class="text-success">This image will replace the current image when saved.</small>
                    </div>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
}

// Clear image selection and restore current image view if in edit mode
function clearImageSelection() {
    const imageUploadInput = document.getElementById('imageUpload');
    if (imageUploadInput) {
        imageUploadInput.value = '';
        delete imageUploadInput.dataset.removeImage;
    }
    
    if (currentIncentiveId) {
        // If editing, restore current image view
        const incentive = incentives.find(i => (i.id == currentIncentiveId || i.reward_id == currentIncentiveId));
        if (incentive) {
            displayCurrentImage(incentive);
        }
    } else {
        // If adding new, just clear the preview
        const imagePreview = document.getElementById('imagePreview');
        if (imagePreview) {
            imagePreview.innerHTML = '';
        }
    }
    
    showToast('Image selection cleared.', 'info');
}

// Enhanced reset form to handle image management
function resetForm() {
    if (incentiveForm) {
        incentiveForm.reset();
    }
    
    // Clear image preview and any removal flags
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
        imagePreview.innerHTML = '';
    }
    
    const imageUploadInput = document.getElementById('imageUpload');
    if (imageUploadInput) {
        delete imageUploadInput.dataset.removeImage;
    }
    
    // Hide date fields
    const dateFields = document.getElementById('dateFields');
    if (dateFields) {
        dateFields.style.display = 'none';
    }
    
    currentIncentiveId = null;
}

function deleteGood(id) {
    const incentive = incentives.find(i => (i.id == id || i.reward_id == id));
    if (!incentive) return;

    // Show archive confirmation modal instead of direct delete
    showArchiveModal(incentive, id);
}

function showArchiveModal(incentive, id) {
    const archiveModal = document.getElementById('archiveRewardModal');
    const archiveRewardName = document.getElementById('archiveRewardName');
    const confirmArchiveBtn = document.getElementById('confirmArchiveBtn');
    
    if (!archiveModal || !archiveRewardName || !confirmArchiveBtn) {
        console.error('Archive modal elements not found');
        return;
    }

    // Set the reward name in the modal
    archiveRewardName.textContent = incentive.reward_name || incentive.name || 'Unknown Item';
    
    // Remove existing event listeners and add new one
    confirmArchiveBtn.onclick = null;
    confirmArchiveBtn.onclick = () => confirmArchiveIncentive(id);
    
    // Show the modal
    const bsModal = new bootstrap.Modal(archiveModal);
    bsModal.show();
}

// Add this new function to handle the archive confirmation
function confirmArchiveIncentive(id) {
    fetch('/UswagLigaya/php-handlers/reward-management/archive-incentive.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: id })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
    })
    .then(text => {
        try {
            const data = JSON.parse(text);
            if (data.success) {
                showToast('Incentive archived successfully!');
                
                // Hide the archive modal
                const archiveModal = bootstrap.Modal.getInstance(document.getElementById('archiveRewardModal'));
                if (archiveModal) {
                    archiveModal.hide();
                }
                
                // Reload the data to reflect changes
                loadIncentivesFromDatabase();
            } else {
                showToast('Error: ' + data.message, 'error');
            }
        } catch (parseError) {
            console.error('JSON parse error on archive:', parseError);
            console.error('Response was not valid JSON:', text);
            showToast('Server returned invalid response during archive.', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('An error occurred while archiving the incentive.', 'error');
    });
}



// Image preview function
function previewImage(event) {
    const file = event.target.files[0];
    const previewContainer = document.getElementById('imagePreview');
    
    if (file && previewContainer) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewContainer.innerHTML = `
                <div class="mt-2">
                    <img src="${e.target.result}" alt="Preview" style="max-width: 200px; max-height: 200px; object-fit: cover; border-radius: 8px;">
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
}

// Reset form to default values
function resetForm() {
    if (incentiveForm) {
        incentiveForm.reset();
    }
    
    // Clear image preview
    const imagePreview = document.getElementById('imagePreview');
    if (imagePreview) {
        imagePreview.innerHTML = '';
    }
    
    // Hide date fields
    const dateFields = document.getElementById('dateFields');
    if (dateFields) {
        dateFields.style.display = 'none';
    }
    
    currentIncentiveId = null;
}

// Show archived incentives
function showArchivedIncentives() {
    // Filter for archived items using is_active field
    const archivedItems = incentives.filter(i => i.is_active === 0 || i.is_archived === 1);
    
    if (archivedItems.length === 0) {
        showToast('No archived items found.', 'info');
        return;
    }

    // Create archived items modal content
    const modalContent = archivedItems.map(item => `
        <div class="card mb-2">
            <div class="card-body py-2">
                <div class="row align-items-center">
                    <div class="col-md-4">
                        <strong>${item.reward_name || item.name}</strong><br>
                        <small class="text-muted">${item.reward_type || item.category}</small>
                    </div>
                    <div class="col-md-3">
                        <small>Last Stock: ${item.quantity} ${item.unit}</small><br>
                        <small class="text-muted">${item.points_required} points</small>
                    </div>
                    <div class="col-md-3">
                        <small class="text-danger">
                            Status: Archived
                            ${item.expiration_date ? `<br>Expired: ${new Date(item.expiration_date).toLocaleDateString()}` : ''}
                        </small>
                    </div>
                    <div class="col-md-2">
                        <button class="btn btn-sm btn-success" onclick="restoreIncentive('${item.reward_id || item.id}')" title="Restore">
                            <i class="bi bi-arrow-clockwise"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Remove existing modal if present
    const existingModal = document.getElementById('archivedModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modalHtml = `
        <div class="modal fade" id="archivedModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-secondary text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-archive me-2"></i>Archived Incentives
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body" style="max-height: 400px; overflow-y: auto;">
                        ${modalContent}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    new bootstrap.Modal(document.getElementById('archivedModal')).show();

    document.getElementById('archivedModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

function restoreIncentive(id) {
    const incentive = incentives.find(i => (i.id == id || i.reward_id == id));
    if (!incentive) return;

    if (confirm(`Are you sure you want to restore "${incentive.reward_name || incentive.name}"?`)) {
        fetch('/UswagLigaya/php-handlers/reward-management/restore-incentive.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: id })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Incentive restored successfully!');
                loadIncentivesFromDatabase();
                
                // Close and refresh archived modal
                const archivedModal = bootstrap.Modal.getInstance(document.getElementById('archivedModal'));
                if (archivedModal) {
                    archivedModal.hide();
                    setTimeout(() => showArchivedIncentives(), 500);
                }
            } else {
                showToast('Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred while restoring the incentive.', 'error');
        });
    }
}

// Permanently delete archived incentive
function permanentDeleteIncentive(id) {
    const incentive = incentives.find(i => (i.id == id || i.reward_id == id));
    if (!incentive) return;

    if (confirm(`Are you sure you want to permanently delete "${incentive.reward_name || incentive.name}"? This action cannot be undone and will remove all data.`)) {
        // In real implementation, this would call a different endpoint for permanent deletion
        fetch('/UswagLigaya/php-handlers/reward-management/permanent-delete-incentive.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: id })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            try {
                const data = JSON.parse(text);
                if (data.success) {
                    showToast('Incentive permanently deleted!');
                    loadIncentivesFromDatabase();
                    
                    // Close the archived modal and refresh it
                    const archivedModal = bootstrap.Modal.getInstance(document.getElementById('archivedModal'));
                    if (archivedModal) {
                        archivedModal.hide();
                        setTimeout(() => showArchivedIncentives(), 500);
                    }
                } else {
                    showToast('Error: ' + data.message, 'error');
                }
            } catch (parseError) {
                console.error('JSON parse error on permanent delete:', parseError);
                showToast('Server returned invalid response during permanent deletion.', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred while permanently deleting the incentive.', 'error');
        });
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    // Check if toast container exists, if not create it
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '9999';
        document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toastId = `toast-${Date.now()}`;
    const toastElement = document.createElement('div');
    
    let bgClass = 'bg-success text-white';
    let iconClass = 'bi-check-circle';
    
    switch(type) {
        case 'error':
            bgClass = 'bg-danger text-white';
            iconClass = 'bi-exclamation-triangle';
            break;
        case 'warning':
            bgClass = 'bg-warning text-dark';
            iconClass = 'bi-exclamation-triangle';
            break;
        case 'info':
            bgClass = 'bg-info text-white';
            iconClass = 'bi-info-circle';
            break;
    }
    
    toastElement.className = `toast show ${bgClass}`;
    toastElement.id = toastId;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');

    toastElement.innerHTML = `
        <div class="toast-header ${bgClass}">
            <i class="bi ${iconClass} me-2"></i>
            <strong class="me-auto">Inventory System</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;

    // Add toast to container
    toastContainer.appendChild(toastElement);

    // Create Bootstrap toast instance
    if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
        const toast = new bootstrap.Toast(toastElement, { 
            autohide: true, 
            delay: type === 'error' ? 5000 : 3000 
        });
        toast.show();

        // Remove toast after it's hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    } else {
        // Fallback if Bootstrap is not available
        setTimeout(() => {
            toastElement.remove();
        }, type === 'error' ? 5000 : 3000);
    }
}

// Additional utility functions for the enhanced system

// Get days until expiration
function getDaysUntilExpiration(eventDate) {
    if (!eventDate) return null;
    
    const event = new Date(eventDate);
    const current = new Date();
    const diffTime = event - current;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

// Check if item is expiring soon (within 7 days)
function isExpiringSoon(eventDate) {
    const days = getDaysUntilExpiration(eventDate);
    return days !== null && days <= 7 && days > 0;
}

// Check if item is expired
function isExpired(eventDate) {
    const days = getDaysUntilExpiration(eventDate);
    return days !== null && days <= 0;
}

// Format stock status for display
function formatStockStatus(quantity, threshold = 5) {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= threshold) return 'Low Stock';
    if (quantity <= threshold * 2) return 'Medium Stock';
    return 'Good Stock';
}

// Enhanced filter functionality for incentives management

// Global variables for filtering
let filteredIncentives = [];
let currentFilters = {
    search: '',
    category: '',
    status: '',
    sort: ''
};

// Setup enhanced event listeners for filters
function setupEnhancedFilterListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.removeEventListener('input', handleFilterChange);
        searchInput.addEventListener('input', debounce(handleFilterChange, 300));
    }

    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.removeEventListener('change', handleFilterChange);
        categoryFilter.addEventListener('change', handleFilterChange);
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.removeEventListener('change', handleFilterChange);
        statusFilter.addEventListener('change', handleFilterChange);
    }

    // Sort filter
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.removeEventListener('change', handleFilterChange);
        sortFilter.addEventListener('change', handleFilterChange);
    }
}

// Handle all filter changes
function handleFilterChange() {
    updateFilters();
    applyFilters();
    renderFilteredIncentiveTable();
    updateFilteredStatistics();
}

// Update current filter values
function updateFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const sortFilter = document.getElementById('sortFilter');

    currentFilters = {
        search: searchInput ? searchInput.value.toLowerCase().trim() : '',
        category: categoryFilter ? categoryFilter.value : '',
        status: statusFilter ? statusFilter.value : '',
        sort: sortFilter ? sortFilter.value : ''
    };

    console.log('Current filters:', currentFilters);
}

// Apply all filters to incentives data
function applyFilters() {
    if (!Array.isArray(incentives) || incentives.length === 0) {
        filteredIncentives = [];
        return;
    }
    
    // Start with all active incentives - using item_status
    let filtered = incentives.filter(incentive => {
        if (currentFilters.status !== 'expired' && incentive.item_status === 'expired') {
            return false;
        }
        return true;
    });

    // Apply search filter
    if (currentFilters.search) {
        filtered = filtered.filter(incentive => {
            const searchFields = [
                incentive.reward_name || incentive.name || '',
                incentive.description || '',
                incentive.reward_type || incentive.category || '',
                incentive.unit || ''
            ].join(' ').toLowerCase();
            
            return searchFields.includes(currentFilters.search);
        });
    }

    // Apply category filter
    if (currentFilters.category) {
        filtered = filtered.filter(incentive => {
            const itemCategory = incentive.reward_type || incentive.category || '';
            return itemCategory === currentFilters.category;
        });
    }

    // Apply status filter - Updated to use item_status
    if (currentFilters.status) {
        filtered = filtered.filter(incentive => {
            switch (currentFilters.status) {
                case 'active':
                    return incentive.item_status === 'active' && incentive.quantity > 0;
                case 'expired':
                    return incentive.item_status === 'expired';
                case 'out_of_stock':
                    return incentive.quantity === 0;
                case 'low_stock':
                    const threshold = incentive.low_stock_threshold || 5;
                    return incentive.quantity <= threshold && incentive.quantity > 0;
                case 'archived':
                    return incentive.item_status === 'archived';
                case 'disabled':
                    return incentive.item_status === 'disabled';
                default:
                    return true;
            }
        });
    }

    // Apply sorting
    if (currentFilters.sort) {
        filtered = sortIncentives(filtered, currentFilters.sort);
    }

    filteredIncentives = filtered;
}
// Sort incentives based on selected option
function sortIncentives(data, sortOption) {
    const sortedData = [...data];
    
    switch (sortOption) {
        case 'name_asc':
            return sortedData.sort((a, b) => {
                const nameA = (a.reward_name || a.name || '').toLowerCase();
                const nameB = (b.reward_name || b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
            
        case 'name_desc':
            return sortedData.sort((a, b) => {
                const nameA = (a.reward_name || a.name || '').toLowerCase();
                const nameB = (b.reward_name || b.name || '').toLowerCase();
                return nameB.localeCompare(nameA);
            });
            
        case 'date_asc':
            return sortedData.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateA - dateB;
            });
            
        case 'date_desc':
            return sortedData.sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA;
            });
            
        case 'points_asc':
            return sortedData.sort((a, b) => {
                return (a.points_required || 0) - (b.points_required || 0);
            });
            
        case 'points_desc':
            return sortedData.sort((a, b) => {
                return (b.points_required || 0) - (a.points_required || 0);
            });
            
        case 'stock_asc':
            return sortedData.sort((a, b) => {
                return (a.quantity || 0) - (b.quantity || 0);
            });
            
        case 'stock_desc':
            return sortedData.sort((a, b) => {
                return (b.quantity || 0) - (a.quantity || 0);
            });
            
        default:
            return sortedData;
    }
}

// Render filtered incentive table
function renderFilteredIncentiveTable() {
    const tableBody = document.getElementById('goodsTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (filteredIncentives.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="9" class="text-center text-muted py-4">
                <i class="bi bi-search fa-2x mb-2 d-block"></i>
                <div>No incentives found matching your criteria</div>
                <small class="text-muted mt-2">
                    Try adjusting your search terms or filters
                </small>
            </td>
        `;
        tableBody.appendChild(row);
        return;
    }

    filteredIncentives.forEach(incentive => {
        const row = createIncentiveTableRow(incentive);
        tableBody.appendChild(row);
    });
}

// Create incentive table row (extracted from original renderIncentiveTable)
function createIncentiveTableRow(incentive) {
    const row = document.createElement('tr');
    
    // Determine stock status class
    let stockClass = 'stock-good';
    let stockText = 'GOOD';
    
    if (incentive.quantity === 0) {
        stockClass = 'stock-out';
        stockText = 'OUT OF STOCK';
    } else if (incentive.quantity <= (incentive.low_stock_threshold || 5)) {
        stockClass = 'stock-low';
        stockText = 'LOW STOCK';
    } else if (incentive.quantity <= ((incentive.low_stock_threshold || 5) * 2)) {
        stockClass = 'stock-medium';
        stockText = 'MEDIUM';
    }

    // Category badge color
    const categoryToCheck = (incentive.category || incentive.reward_type || '').toLowerCase();
    let badgeClass = 'bg-primary';
    switch(categoryToCheck) {
        case 'goods':
            badgeClass = 'bg-success';
            break;
        case 'priority stab':
            badgeClass = 'bg-warning text-dark';
            break;
        case 'event ticket':
            badgeClass = 'bg-info';
            break;
    }

    // Status badge - Updated to use item_status
    let statusBadgeClass = 'bg-success';
    let statusText = 'Active';
    switch(incentive.item_status) {
        case 'expired':
            statusBadgeClass = 'bg-danger';
            statusText = 'Expired';
            break;
        case 'archived':
            statusBadgeClass = 'bg-secondary';
            statusText = 'Archived';
            break;
        case 'disabled':
            statusBadgeClass = 'bg-warning text-dark';
            statusText = 'Disabled';
            break;
        case 'active':
        default:
            if (incentive.quantity === 0) {
                statusBadgeClass = 'bg-warning text-dark';
                statusText = 'Out of Stock';
            } else {
                statusBadgeClass = 'bg-success';
                statusText = 'Active';
            }
            break;
    }

    // Date info
    let dateInfo = '-';
    if (incentive.event_date) {
        const eventDate = new Date(incentive.event_date);
        const currentDate = new Date();
        const diffTime = eventDate - currentDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        dateInfo = eventDate.toLocaleDateString();
        if (diffDays <= 7 && diffDays > 0) {
            dateInfo = `<small class="text-warning">${dateInfo}<br>${diffDays} days left</small>`;
        } else if (diffDays <= 0) {
            dateInfo = `<small class="text-danger">${dateInfo}<br>Expired</small>`;
        } else {
            dateInfo = `<small class="text-muted">${dateInfo}</small>`;
        }
    }

    // Row class for visual indication
    let rowClass = '';
    if (incentive.event_date) {
        const eventDate = new Date(incentive.event_date);
        const currentDate = new Date();
        const diffTime = eventDate - currentDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 7 && diffDays > 0) {
            rowClass = 'table-warning';
        }
    }

    const incentiveName = incentive.reward_name || incentive.name || 'Unknown';
    const incentiveCategory = incentive.reward_type || incentive.category || 'Unknown';
    const incentiveImage = incentive.image_url || incentive.image || '../../asset/img/default.png';
    const incentiveId = incentive.reward_id || incentive.id;

    row.className = rowClass;
    row.innerHTML = `
        <td><strong>SKU${String(incentiveId).padStart(3, '0')}</strong></td>
        <td>
            <div class="d-flex align-items-center">
                <img src="${incentiveImage}" 
                     alt="${incentiveName}" 
                     class="rounded me-2"
                     style="width: 40px; height: 40px; object-fit: cover;"
                     onerror="this.src='../../asset/img/default.png'">
                <span>${incentiveName}</span>
            </div>
        </td>
        <td><span class="badge ${badgeClass} badge-category">${incentiveCategory}</span></td>
        <td><span class="${stockClass}">${stockText}</span></td>
        <td>${incentive.quantity} ${incentive.unit}</td>
        <td><span class="badge bg-primary">${incentive.points_required} pts</span></td>
        <td>${dateInfo}</td>
        <td><span class="badge ${statusBadgeClass}">${statusText}</span></td>
        <td class="action-buttons">
            <div class="btn-group">
                <button class="btn btn-info btn-sm" onclick="viewGood('${incentiveId}')" title="View">
                    <i class="bi bi-eye"></i>
                </button>
                ${incentive.item_status !== 'expired' && incentive.item_status !== 'archived' ? `
                    <button class="btn btn-success btn-sm" onclick="showAddStockModal('${incentiveId}')" title="Add Stock">
                        <i class="bi bi-plus-square"></i>
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="editGood('${incentiveId}')" title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                ` : ''}
                <button class="btn btn-danger btn-sm" onclick="deleteGood('${incentiveId}')" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </td>
    `;

    return row;
}

// Check if any filter is active
function isFilterActive() {
    return currentFilters.search || 
           currentFilters.category || 
           currentFilters.status || 
           currentFilters.sort;
}

// Update statistics based on filtered results
function updateFilteredStatistics() {
    if (!Array.isArray(filteredIncentives)) {
        filteredIncentives = Array.isArray(incentives) ? 
            incentives.filter(i => i.item_status !== 'expired' && i.item_status !== 'archived') : [];
    }
    
    const totalItems = filteredIncentives.length;
    const inStockItems = filteredIncentives.filter(i => i.quantity > 0 && i.item_status === 'active').length;
    const lowStockItems = filteredIncentives.filter(i => i.quantity <= (i.low_stock_threshold || 5) && i.quantity > 0).length;
    const outOfStockItems = filteredIncentives.filter(i => i.quantity === 0).length;

    // Only update if filters are active, otherwise use original stats
    if (isFilterActive()) {
        const totalItemsEl = document.getElementById('totalItems');
        const inStockItemsEl = document.getElementById('inStockItems');
        const lowStockItemsEl = document.getElementById('lowStockItems');
        const outOfStockItemsEl = document.getElementById('outOfStockItems');

        if (totalItemsEl) {
            totalItemsEl.textContent = totalItems;
            totalItemsEl.parentElement.parentElement.classList.add('border-info');
        }
        if (inStockItemsEl) {
            inStockItemsEl.textContent = inStockItems;
            inStockItemsEl.parentElement.parentElement.classList.add('border-info');
        }
        if (lowStockItemsEl) {
            lowStockItemsEl.textContent = lowStockItems;
            lowStockItemsEl.parentElement.parentElement.classList.add('border-info');
        }
        if (outOfStockItemsEl) {
            outOfStockItemsEl.textContent = outOfStockItems;
            outOfStockItemsEl.parentElement.parentElement.classList.add('border-info');
        }
    }
}

// Clear all filters
function clearAllFilters() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    const sortFilter = document.getElementById('sortFilter');

    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (sortFilter) sortFilter.value = '';

    handleFilterChange();
    
    // Remove filter indicators from stats cards
    const statsCards = document.querySelectorAll('.stats-card');
    statsCards.forEach(card => card.classList.remove('border-info'));
    
    showToast('All filters cleared');
}

// Debounce function to limit search input frequency
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Enhanced search with highlighting
function highlightSearchTerm(text, searchTerm) {
    if (!searchTerm) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-warning text-dark">$1</mark>');
}

// Initialize enhanced filters when DOM is loaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM Content Loaded - Initializing enhanced incentives management...');

    // Initialize Bootstrap modals
    const addIncentiveModalEl = document.getElementById('addGoodModal');
    if (addIncentiveModalEl) {
        addIncentiveModal = new bootstrap.Modal(addIncentiveModalEl);
        console.log('Add Incentive Modal initialized');
    }

    const addStockModalEl = document.getElementById('addStockModal');
    if (addStockModalEl) {
        addStockModal = new bootstrap.Modal(addStockModalEl);
        console.log('Add Stock Modal initialized');
    }

    // Proper initialization sequence
    // 1. First load data
    loadIncentivesFromDatabase()
        .then(() => {
            // 2. Setup event listeners after data is loaded
            setupEventListeners();
            setupEnhancedFilterListeners();
            
            // 3. Initialize filtered incentives
            filteredIncentives = incentives.filter(i => i.status !== 'expired');
            
            // 4. Add UI elements
            setTimeout(() => {
                addClearFiltersButton();
            }, 100);
        });
    
    // Check for expired items every 5 minutes
    setInterval(checkAndUpdateExpiredItems, 300000);
});

// Add clear filters button functionality
function addClearFiltersButton() {
    const filtersRow = document.querySelector('.filters-row .row');
    if (filtersRow && !document.getElementById('clearFiltersBtn')) {
        const clearButtonCol = document.createElement('div');
        clearButtonCol.className = 'col-md-12 mt-2';
        clearButtonCol.innerHTML = `
            <button type="button" class="btn btn-outline-secondary btn-sm" id="clearFiltersBtn" onclick="clearAllFilters()">
                <i class="bi bi-x-circle me-1"></i>Clear All Filters
            </button>
        `;
        filtersRow.appendChild(clearButtonCol);
    }
}

// Initialize clear button
setTimeout(addClearFiltersButton, 1500);

// Export functions for global access
window.clearAllFilters = clearAllFilters;
window.handleFilterChange = handleFilterChange;

// Auto-refresh data periodically (every 5 minutes)
setInterval(() => {
    console.log('Auto-refreshing incentives data...');
    loadIncentivesFromDatabase();
}, 300000); // 5 minutes

// Export functions for global access if needed
window.editGood = editGood;
window.displayCurrentImage = displayCurrentImage;
window.enlargeImage = enlargeImage;
window.removeCurrentImage = removeCurrentImage;
window.restoreCurrentImage = restoreCurrentImage;
window.previewImage = previewImage;
window.clearImageSelection = clearImageSelection;
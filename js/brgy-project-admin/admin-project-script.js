// Merged admin-project-script.js - Clean implementation without redundancy

// Global variables
let selectedFiles = [];

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize image upload for both modals
    initializeImageUpload('addProjectModal');
    initializeImageUpload('updateProjectModal');
    
    // Initialize stage management
    initializeStageManagement();
    
    // Initialize sortable stages for update modal
    initializeSortableStages();
    
    // Initialize project stages functionality
    initializeProjectStages();
    
    // Initialize select status colors
    initializeSelectStatusColors();
    
    // Initialize image preview modal
    initializeImagePreviewModal();
    
    // Load categories for jQuery-based functionality
    if (typeof $ !== 'undefined') {
        loadCategories();
        initializeAddProjectHandler();
    }
});

// Initialize image upload functionality for specific modal
function initializeImageUpload(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const dropArea = modal.querySelector('#drop-area');
    const fileInput = modal.querySelector('#fileInput');
    const previewContainer = modal.querySelector('#imagePreviewContainer');
    
    if (!dropArea || !fileInput || !previewContainer) return;
    
    // Click to browse files
    dropArea.addEventListener('click', () => fileInput.click());
    
    // Handle file input change
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files, previewContainer, modalId));
    
    // Drag and drop events
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.classList.add('dragover');
    });
    
    dropArea.addEventListener('dragleave', () => {
        dropArea.classList.remove('dragover');
    });
    
    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files, previewContainer, modalId);
    });
    
    // Clear previews when modal is closed
    modal.addEventListener('hidden.bs.modal', function() {
        previewContainer.innerHTML = '';
        fileInput.value = '';
        if (modalId === 'addProjectModal') {
            selectedFiles = [];
        }
    });
}

// Handle file uploads with validation
function handleFiles(files, previewContainer, modalId) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            // Validate file size (5MB limit)
            if (file.size > 5 * 1024 * 1024) {
                showAlert('error', 'File size must be less than 5MB');
                return;
            }
            
            // Add file to selected files array for add modal
            if (modalId === 'addProjectModal') {
                selectedFiles.push(file);
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const wrapper = document.createElement('div');
                wrapper.classList.add('position-relative', 'd-inline-block', 'm-2');
                
                if (modalId === 'addProjectModal') {
                    wrapper.setAttribute('data-file-index', selectedFiles.length - 1);
                }
                
                const img = document.createElement('img');
                img.src = event.target.result;
                img.classList.add('img-thumbnail', 'project-image-thumb');
                img.style.width = '100px';
                img.style.height = '100px';
                img.style.objectFit = 'cover';
                
                const removeBtn = document.createElement('button');
                removeBtn.innerHTML = '&times;';
                removeBtn.classList.add('btn', 'btn-sm', 'btn-danger', 'position-absolute', 'top-0', 'end-0', 'rounded-circle');
                removeBtn.style.width = '25px';
                removeBtn.style.height = '25px';
                removeBtn.style.fontSize = '12px';
                removeBtn.style.lineHeight = '1';
                removeBtn.setAttribute('type', 'button');
                removeBtn.setAttribute('title', 'Remove');
                removeBtn.onclick = () => {
                    if (modalId === 'addProjectModal') {
                        const fileIndex = parseInt(wrapper.getAttribute('data-file-index'));
                        selectedFiles.splice(fileIndex, 1);
                        updateFileIndices(previewContainer);
                    }
                    wrapper.remove();
                };
                
                wrapper.appendChild(img);
                wrapper.appendChild(removeBtn);
                previewContainer.appendChild(wrapper);
            };
            reader.readAsDataURL(file);
        } else {
            showAlert('error', 'Only image files are allowed');
        }
    });
}

// Update file indices for remaining previews
function updateFileIndices(previewContainer) {
    const previews = previewContainer.querySelectorAll('[data-file-index]');
    previews.forEach((preview, index) => {
        preview.setAttribute('data-file-index', index);
    });
}

// Initialize stage management for both modals
function initializeStageManagement() {
    // Add Project Modal stage management
    const addStageBtnAdd = document.getElementById('addStageBtnAdd');
    const newStageInputAdd = document.getElementById('newStageInputAdd');
    const projectStagesContainer = document.getElementById('projectStagesContainerAdd');
    
    if (addStageBtnAdd && newStageInputAdd && projectStagesContainer) {
        addStageBtnAdd.addEventListener('click', function() {
            const stageInput = newStageInputAdd.value.trim();
            
            if (stageInput) {
                const stageDiv = document.createElement('div');
                stageDiv.className = 'stage-edit-item mb-3';
                stageDiv.innerHTML = `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" checked>
                        <label class="form-check-label">${stageInput}</label>
                        <button type="button" class="btn btn-sm btn-outline-danger ms-2 remove-stage-btn">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                `;
                
                // Add remove functionality
                stageDiv.querySelector('.remove-stage-btn').addEventListener('click', function() {
                    stageDiv.remove();
                });
                
                // Insert before the input group
                const inputGroup = projectStagesContainer.querySelector('.input-group');
                projectStagesContainer.insertBefore(stageDiv, inputGroup);
                
                // Clear input
                newStageInputAdd.value = '';
            }
        });
        
        // Allow adding stage by pressing Enter
        newStageInputAdd.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addStageBtnAdd.click();
            }
        });
    }
    
    // Update Project Modal stage management
    const addStageBtnUpdate = document.getElementById('addStageBtnUpdate');
    const newStageInputUpdate = document.getElementById('newStageInputUpdate');
    
    if (addStageBtnUpdate && newStageInputUpdate) {
        addStageBtnUpdate.addEventListener('click', function() {
            const stageName = newStageInputUpdate.value.trim();
            if (stageName === "") return;
            
            const html = `
                <div class="stage-edit-item d-flex align-items-center justify-content-between bg-light p-2 rounded mb-2">
                    <div class="fw-semibold stage-label">${stageName}</div>
                    <div class="d-flex align-items-center gap-2">
                        <select class="form-select select-status w-auto" aria-label="Stage Status">
                            <option selected>Not Started</option>
                            <option>In Progress</option>
                            <option>Completed</option>
                        </select>
                        <button type="button" class="btn-close btn-sm remove-stage-btn" aria-label="Remove"></button>
                    </div>
                </div>
            `;
            
            const sortableStages = document.getElementById('sortableStages');
            if (sortableStages) {
                sortableStages.insertAdjacentHTML('beforeend', html);
                newStageInputUpdate.value = '';
            }
        });
    }
}

// Initialize sortable stages for update modal
function initializeSortableStages() {
    const sortableStages = document.getElementById('sortableStages');
    if (sortableStages && typeof Sortable !== 'undefined') {
        Sortable.create(sortableStages, {
            animation: 150,
            handle: '.stage-edit-item',
            ghostClass: 'sortable-ghost'
        });
    }
}

// Initialize project stages functionality
function initializeProjectStages() {
    // Remove stage functionality for both Add and Update Modals
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('remove-stage-btn')) {
            const stageItem = e.target.closest('.stage-edit-item');
            if (stageItem) stageItem.remove();
        }
    });
    
    // Handle completion date display
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('select-status')) {
            const container = e.target.closest('.d-flex.align-items-center');
            const dateSpan = container?.querySelector('.completion-date');
            const dateText = container?.querySelector('.date-text');
            
            if (e.target.value === 'Completed' && dateSpan && dateText) {
                const now = new Date();
                const formattedDate = now.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
                dateText.textContent = formattedDate;
                dateSpan.classList.remove('d-none');
            } else if (dateSpan && dateText) {
                dateText.textContent = '';
                dateSpan.classList.add('d-none');
            }
        }
    });
}

// Initialize select status colors
function initializeSelectStatusColors() {
    function updateSelectColor(select) {
        select.classList.remove('not-started', 'in-progress', 'completed');
        switch (select.value) {
            case 'Not Started':
                select.classList.add('not-started');
                break;
            case 'In Progress':
                select.classList.add('in-progress');
                break;
            case 'Completed':
                select.classList.add('completed');
                break;
        }
    }
    
    // Handle existing selects
    document.querySelectorAll('.select-status').forEach(select => {
        updateSelectColor(select);
        select.addEventListener('change', () => updateSelectColor(select));
    });
    
    // Handle dynamically added selects
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('select-status')) {
            updateSelectColor(e.target);
        }
    });
}

// Initialize image preview modal
function initializeImagePreviewModal() {
    // View project details - making uploaded image to preview/show large image in modal
    document.querySelectorAll('.preview-thumb').forEach(img => {
        img.addEventListener('click', () => {
            const largePreviewImage = document.getElementById('largePreviewImage');
            if (largePreviewImage) {
                largePreviewImage.src = img.getAttribute('data-img-src');
            }
        });
    });
    
    // Close image preview modal when clicking outside the image
    const modal = document.getElementById('imagePreviewModal');
    const image = document.getElementById('largePreviewImage');
    
    if (modal && image) {
        modal.addEventListener('click', function(e) {
            if (!image.contains(e.target)) {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) bsModal.hide();
            }
        });
    }
}

// Global functions for file management
window.getSelectedFiles = function() {
    return selectedFiles;
};

window.clearSelectedFiles = function() {
    selectedFiles = [];
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    if (imagePreviewContainer) {
        imagePreviewContainer.innerHTML = '';
    }
};

// jQuery-based functionality (only if jQuery is available)
function loadCategories() {
    if (typeof $ === 'undefined') return;
    
    $.ajax({
        url: '../../php-handlers/brgy-project-admin/get-categories.php',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                const categorySelect = $('#addProjectModal select').first();
                categorySelect.empty();
                categorySelect.append('<option value="">Select category...</option>');
                
                response.categories.forEach(function(category) {
                    categorySelect.append(
                        `<option value="${category.category_id}">${category.category_name}</option>`
                    );
                });
            }
        },
        error: function() {
            console.log('Failed to load categories');
        }
    });
}

function initializeAddProjectHandler() {
    if (typeof $ === 'undefined') return;
    
    // Handle Add Project Button Click
    $('#addProjectModal .btn-primary').on('click', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = new FormData();
        
        // Basic project data
        formData.append('project_name', $('#addProjectModal input[placeholder="Enter project name"]').val().trim());
        formData.append('category', $('#addProjectModal select').first().val());
        formData.append('description', $('#addProjectModal textarea[placeholder="Project description..."]').val().trim());
        formData.append('location', $('#addProjectModal input[placeholder="Enter location of project"]').val().trim());
        formData.append('start_date', $('#addProjectModal input[type="date"]').first().val());
        formData.append('expected_completion', $('#addProjectModal input[type="date"]').last().val());
        formData.append('initial_budget', $('#addProjectModal input[placeholder="0.00"]').val());
        formData.append('funding_source', $('#addProjectModal input[placeholder="Source of funding"]').val().trim());
        formData.append('responsible_person', $('#addProjectModal input[placeholder="Enter responsible person"]').val().trim());
        
        // Get project stages
        const stages = [];
        $('#addProjectModal .stage-edit-item .form-check-input:checked').each(function() {
            const stageName = $(this).siblings('.form-check-label').text().trim();
            if (stageName) {
                stages.push(stageName);
            }
        });
        
        // Add stages to formData
        stages.forEach(function(stage, index) {
            formData.append(`project_stages[${index}]`, stage);
        });
        
        // Add uploaded images
        if (selectedFiles && selectedFiles.length > 0) {
            selectedFiles.forEach(function(file) {
                formData.append('project_images[]', file);
            });
        }
        
        // Validate form data
        if (!validateProjectForm(formData)) {
            return;
        }
        
        // Show loading state
        const submitBtn = $(this);
        const originalText = submitBtn.text();
        submitBtn.prop('disabled', true).text('Creating...');
        
        // Send AJAX request
        $.ajax({
            url: '../../php-handlers/brgy-project-admin/add-project.php',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function(response) {
                console.log('Success response:', response);
                if (response.success) {
                    // Show success message
                    showAlert('success', 'Project created successfully with all details!');
                    
                    // Reset form
                    $('#addProjectModal form')[0].reset();
                    
                    // Clear image previews and selected files
                    window.clearSelectedFiles();
                    
                    // Clear file input
                    const fileInput = document.getElementById('fileInput');
                    if (fileInput) fileInput.value = '';
                    
                    // Reset stages to default
                    resetStages();
                    
                    // Close modal
                    setTimeout(function() {
                        $('#addProjectModal').modal('hide');
                        location.reload();
                    }, 1500);
                } else {
                    showAlert('error', response.message || 'Failed to create project. Please try again.');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', xhr.responseText);
                showAlert('error', 'An error occurred while creating the project. Please try again.');
            },
            complete: function() {
                // Reset button state
                submitBtn.prop('disabled', false).text(originalText);
            }
        });
    });
    
    // Reset form when modal is closed
    $('#addProjectModal').on('hidden.bs.modal', function() {
        $('#addProjectModal form')[0].reset();
        $('.alert').remove();
        window.clearSelectedFiles();
        resetStages();
    });
    
    // Clear alerts when modal is shown
    $('#addProjectModal').on('show.bs.modal', function() {
        $(this).find('.alert').remove();
    });
}

// Form validation function
function validateProjectForm(formData) {
    const errors = [];
    
    // Get values from FormData
    const projectName = formData.get('project_name');
    const category = formData.get('category');
    const description = formData.get('description');
    const location = formData.get('location');
    const startDate = formData.get('start_date');
    const expectedCompletion = formData.get('expected_completion');
    const responsiblePerson = formData.get('responsible_person');
    
    if (!projectName) {
        errors.push('Project name is required.');
    }
    
    if (!category || category === 'Select category...') {
        errors.push('Category is required.');
    }
    
    if (!description) {
        errors.push('Description is required.');
    }
    
    if (!location) {
        errors.push('Location is required.');
    }
    
    if (!startDate) {
        errors.push('Start date is required.');
    }
    
    if (!expectedCompletion) {
        errors.push('Expected completion date is required.');
    }
    
    if (!responsiblePerson) {
        errors.push('Responsible person is required.');
    }
    
    // Validate date logic
    if (startDate && expectedCompletion) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(expectedCompletion);
        
        if (startDateObj >= endDateObj) {
            errors.push('Expected completion date must be after start date.');
        }
    }
    
    // Validate budget if provided
    const budget = formData.get('initial_budget');
    if (budget && (isNaN(budget) || parseFloat(budget) < 0)) {
        errors.push('Initial budget must be a valid positive number.');
    }
    
    if (errors.length > 0) {
        showAlert('error', errors.join('<br>'));
        return false;
    }
    
    return true;
}

// Reset stages to default
function resetStages() {
    const container = document.getElementById('projectStagesContainerAdd');
    if (container) {
        // Remove all custom stages
        container.querySelectorAll('.stage-edit-item').forEach(function(stage) {
            const label = stage.querySelector('.form-check-label');
            if (label && !label.textContent.includes('Site Survey') &&
                !label.textContent.includes('Material Procurement') &&
                !label.textContent.includes('Final Inspection')) {
                stage.remove();
            }
        });
        
        // Reset default checkboxes
        container.querySelectorAll('.form-check-input').forEach(function(checkbox) {
            checkbox.checked = false;
        });
    }
}

// Alert function
function showAlert(type, message) {
    const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
    const alertIcon = type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle';
    
    const alertHtml = `
        <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
            <i class="bi ${alertIcon} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // Remove existing alerts from modal
    const addModal = document.getElementById('addProjectModal');
    if (addModal) {
        const existingAlerts = addModal.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Add new alert at the top of modal body
        const modalBody = addModal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.insertAdjacentHTML('afterbegin', alertHtml);
        }
    }
    
    // Auto-dismiss after 5 seconds
    setTimeout(function() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => alert.style.display = 'none');
    }, 5000);
}
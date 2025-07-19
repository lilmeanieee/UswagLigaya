// add-project.js - Complete JavaScript handler for adding projects

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the add project functionality
    initializeAddProject();
});

function initializeAddProject() {
    // Load categories when modal opens
    $('#addProjectModal').on('show.bs.modal', function() {
        loadCategories();
        resetAddProjectForm();
    });

    // Initialize drag and drop functionality
    initializeDragAndDrop();

    // Initialize stage management
    initializeStageManagement();

    // Initialize form submission
    initializeFormSubmission();
}

// Load categories from database
function loadCategories() {
    $.ajax({
        url: '../../php-handlers/brgy-project-admin/get-categories.php',
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                const categorySelect = document.querySelector('#addProjectModal select[name="category"]');
                if (categorySelect) {
                    // Clear existing options except the first one
                    categorySelect.innerHTML = '<option value="">Select category...</option>';
                    
                    // Add categories from database
                    response.categories.forEach(category => {
                        const option = document.createElement('option');
                        option.value = category.category_id;
                        option.textContent = category.category_name;
                        categorySelect.appendChild(option);
                    });
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading categories:', error);
            showAlert('warning', 'Failed to load categories');
        }
    });
}

// Initialize drag and drop functionality
function initializeDragAndDrop() {
    const dropArea = document.getElementById('drop-area-add');
    const fileInput = document.getElementById('fileInputAdd');
    const imagePreview = document.getElementById('imagePreviewContainerAdd');

    if (!dropArea || !fileInput || !imagePreview) return;

    // Make drop area clickable
    dropArea.addEventListener('click', () => fileInput.click());

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Highlight drop area when item is dragged over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    // Handle dropped files
    dropArea.addEventListener('drop', handleDrop, false);

    // Handle file input change
    fileInput.addEventListener('change', function(e) {
        handleFiles(e.target.files);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        dropArea.classList.add('border-primary', 'bg-light');
    }

    function unhighlight(e) {
        dropArea.classList.remove('border-primary', 'bg-light');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/tiff'];
        const maxSize = 5 * 1024 * 1024; // 5MB

        Array.from(files).forEach(file => {
            if (!allowedTypes.includes(file.type)) {
                showAlert('warning', `File ${file.name} is not a supported image type`);
                return;
            }

            if (file.size > maxSize) {
                showAlert('warning', `File ${file.name} is too large (max 5MB)`);
                return;
            }

            displayImagePreview(file);
        });

        // Update the file input with selected files
        const dataTransfer = new DataTransfer();
        const existingFiles = fileInput.files;
        
        // Add existing files
        for (let i = 0; i < existingFiles.length; i++) {
            dataTransfer.items.add(existingFiles[i]);
        }
        
        // Add new files
        Array.from(files).forEach(file => {
            if (allowedTypes.includes(file.type) && file.size <= maxSize) {
                dataTransfer.items.add(file);
            }
        });
        
        fileInput.files = dataTransfer.files;
    }

    function displayImagePreview(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageContainer = document.createElement('div');
            imageContainer.className = 'position-relative';
            imageContainer.innerHTML = `
                <img src="${e.target.result}" class="img-thumbnail project-image-thumb" 
                     alt="Project Image" style="width: 100px; height: 100px; object-fit: cover;">
                <button type="button" class="btn-close position-absolute top-0 end-0 m-1 btn-sm bg-danger border rounded-circle remove-image-btn" 
                        title="Remove" data-filename="${file.name}"></button>
            `;
            
            // Add remove functionality
            const removeBtn = imageContainer.querySelector('.remove-image-btn');
            removeBtn.addEventListener('click', function() {
                removeImageFromInput(file.name);
                imageContainer.remove();
            });
            
            imagePreview.appendChild(imageContainer);
        };
        reader.readAsDataURL(file);
    }

    function removeImageFromInput(fileName) {
        const dataTransfer = new DataTransfer();
        const files = fileInput.files;
        
        for (let i = 0; i < files.length; i++) {
            if (files[i].name !== fileName) {
                dataTransfer.items.add(files[i]);
            }
        }
        
        fileInput.files = dataTransfer.files;
    }
}

// Initialize stage management
function initializeStageManagement() {
    const addStageBtn = document.getElementById('addStageBtnAdd');
    const newStageInput = document.getElementById('newStageInputAdd');
    const stagesContainer = document.getElementById('projectStagesContainerAdd');

    if (!addStageBtn || !newStageInput || !stagesContainer) return;

    // Add stage button click event
    addStageBtn.addEventListener('click', function() {
        const stageName = newStageInput.value.trim();
        if (stageName) {
            addNewStage(stageName);
            newStageInput.value = '';
        }
    });

    // Add stage on Enter key press
    newStageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addStageBtn.click();
        }
    });

    function addNewStage(stageName) {
        const stageItem = document.createElement('div');
        stageItem.className = 'stage-edit-item mb-3';
        stageItem.innerHTML = `
            <div class="form-check d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <input class="form-check-input me-2" type="checkbox" checked>
                    <label class="form-check-label">${stageName}</label>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger remove-stage-btn" title="Remove Stage">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;

        // Add remove functionality
        const removeBtn = stageItem.querySelector('.remove-stage-btn');
        removeBtn.addEventListener('click', function() {
            stageItem.remove();
        });

        // Insert before the input group
        const inputGroup = stagesContainer.querySelector('.input-group');
        stagesContainer.insertBefore(stageItem, inputGroup);
    }
}

// Initialize form submission
function initializeFormSubmission() {
    const createProjectBtn = document.querySelector('#addProjectModal .modal-footer .btn-primary');
    
    if (createProjectBtn) {
        createProjectBtn.addEventListener('click', submitAddProject);
    }
}

// Submit add project form
function submitAddProject() {
    const modal = document.getElementById('addProjectModal');
    const formData = new FormData();
    
    // Get form elements
    const projectName = modal.querySelector('input[placeholder="Enter project name"]');
    const category = modal.querySelector('select[name="category"]') || modal.querySelector('select.form-select');
    const description = modal.querySelector('textarea[placeholder="Project description..."]');
    const location = modal.querySelector('input[placeholder="Enter location of project"]');
    const startDate = modal.querySelector('input[type="date"]:first-of-type');
    const endDate = modal.querySelector('input[type="date"]:last-of-type');
    const budget = modal.querySelector('input[type="number"]');
    const fundingSource = modal.querySelector('input[placeholder="Source of funding"]');
    const responsiblePerson = modal.querySelector('input[placeholder="Enter responsible person"]');
    
    // Validate required fields
    const errors = [];
    
    if (!projectName?.value.trim()) errors.push('Project name is required');
    if (!category?.value || category.value === '') errors.push('Category is required');
    if (!description?.value.trim()) errors.push('Description is required');
    if (!location?.value.trim()) errors.push('Location is required');
    if (!startDate?.value) errors.push('Start date is required');
    if (!endDate?.value) errors.push('Expected completion date is required');
    if (!responsiblePerson?.value.trim()) errors.push('Responsible person is required');
    
    // Validate dates
    if (startDate?.value && endDate?.value) {
        const start = new Date(startDate.value);
        const end = new Date(endDate.value);
        if (start >= end) {
            errors.push('Expected completion date must be after start date');
        }
    }
    
    if (errors.length > 0) {
        showAlert('danger', errors.join(', '));
        return;
    }
    
    // Append basic project data
    formData.append('project_name', projectName.value.trim());
    formData.append('category', category.value);
    formData.append('description', description.value.trim());
    formData.append('location', location.value.trim());
    formData.append('start_date', startDate.value);
    formData.append('expected_completion', endDate.value);
    formData.append('initial_budget', budget?.value || '');
    formData.append('funding_source', fundingSource?.value.trim() || '');
    formData.append('responsible_person', responsiblePerson.value.trim());
    
    // Get project stages
    const stageItems = modal.querySelectorAll('.stage-edit-item .form-check-input:checked');
    const projectStages = [];
    
    stageItems.forEach(checkbox => {
        const label = checkbox.nextElementSibling;
        if (label) {
            projectStages.push(label.textContent.trim());
        }
    });
    
    // Append stages
    projectStages.forEach((stage, index) => {
        formData.append(`project_stages[${index}]`, stage);
    });
    
    // Append images
    const fileInput = document.getElementById('fileInputAdd');
    if (fileInput && fileInput.files.length > 0) {
        for (let i = 0; i < fileInput.files.length; i++) {
            formData.append('project_images[]', fileInput.files[i]);
        }
    }
    
    // Show loading state
    const createButton = document.querySelector('#addProjectModal .modal-footer .btn-primary');
    const originalText = createButton.textContent;
    createButton.disabled = true;
    createButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';
    
    // Submit the form
    $.ajax({
        url: '../../php-handlers/brgy-project-admin/add-project.php',
        method: 'POST',
        data: formData,
        processData: false,
        contentType: false,
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                // Show success message
                showAlert('success', 'Project created successfully!');
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('addProjectModal'));
                modal.hide();
                
                // Refresh the projects display
                if (typeof window.refreshProjects === 'function') {
                    window.refreshProjects();
                } else if (typeof refreshProjectsTable === 'function') {
                    refreshProjectsTable();
                } else {
                    location.reload();
                }
            } else {
                showAlert('danger', response.message || 'Failed to create project');
            }
        },
        error: function(xhr, status, error) {
            console.error('Create error:', error);
            console.error('Response:', xhr.responseText);
            showAlert('danger', 'An error occurred while creating the project');
        },
        complete: function() {
            // Reset button state
            createButton.disabled = false;
            createButton.textContent = originalText;
        }
    });
}

// Reset form when modal is closed
function resetAddProjectForm() {
    const modal = document.getElementById('addProjectModal');
    
    // Reset all form inputs
    modal.querySelectorAll('input, select, textarea').forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });
    
    // Clear image preview
    const imagePreview = document.getElementById('imagePreviewContainerAdd');
    if (imagePreview) {
        imagePreview.innerHTML = '';
    }
    
    // Clear file input
    const fileInput = document.getElementById('fileInputAdd');
    if (fileInput) {
        fileInput.value = '';
    }
    
    // Reset stages to default ones
    const stagesContainer = document.getElementById('projectStagesContainerAdd');
    if (stagesContainer) {
        // Remove all custom stages (keep only default ones)
        const customStages = stagesContainer.querySelectorAll('.stage-edit-item:not(.default-stage)');
        customStages.forEach(stage => stage.remove());
        
        // Reset default stage checkboxes
        const defaultStages = stagesContainer.querySelectorAll('.stage-edit-item .form-check-input');
        defaultStages.forEach(checkbox => {
            checkbox.checked = false;
        });
    }
}

// Utility function to show alerts
function showAlert(type, message) {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Add to document
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Add CSS styles for drag and drop
const style = document.createElement('style');
style.textContent = `
    .upload-box {
        border: 2px dashed #dee2e6;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .upload-box:hover {
        border-color: #0d6efd;
        background-color: #f8f9fa;
    }
    
    .upload-box.border-primary {
        border-color: #0d6efd !important;
    }
    
    .project-image-thumb {
        width: 100px;
        height: 100px;
        object-fit: cover;
    }
    
    .remove-image-btn {
        width: 20px;
        height: 20px;
        padding: 0;
        font-size: 10px;
    }
    
    .stage-edit-item {
        transition: all 0.3s ease;
    }
    
    .stage-edit-item:hover {
        background-color: #f8f9fa;
        border-radius: 4px;
    }
`;
document.head.appendChild(style);
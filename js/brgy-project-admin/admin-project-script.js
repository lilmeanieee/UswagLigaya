// Fixed implementation for project stages and image upload functionality

// Global variables
let selectedFiles = [];
let isInitialized = false;

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Initializing...');
    
    // Initialize basic functionality first
    initializeSelectStatusColors();
    initializeImagePreviewModal();
    
    // Check if modal exists
    const modal = document.getElementById('addProjectModal');
    if (modal) {
        console.log('Modal found, setting up modal event listeners');
        
        // Initialize modal features when modal is shown
        modal.addEventListener('shown.bs.modal', function() {
            console.log('Modal is shown - initializing features');
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                initializeModalFeatures();
            }, 100);
        });
        
        // Clear data when modal is hidden
        modal.addEventListener('hidden.bs.modal', function() {
            console.log('Modal hidden - clearing files');
            clearSelectedFiles();
            isInitialized = false;
        });
    } else {
        console.error('Modal not found!');
    }
    
    // Load categories if jQuery is available
    if (typeof $ !== 'undefined') {
        loadCategories();
        initializeAddProjectHandler();
    }
});

// Initialize modal-specific features
function initializeModalFeatures() {
    console.log('Initializing modal features...');
    
    // Prevent multiple initialization
    if (isInitialized) {
        console.log('Already initialized, skipping...');
        return;
    }
    
    const modal = document.getElementById('addProjectModal');
    if (!modal) {
        console.error('Modal not found');
        return;
    }
    
    // Check if modal is visible
    if (!modal.classList.contains('show')) {
        console.log('Modal not visible, skipping initialization');
        return;
    }
    
    // Wait for modal to be fully rendered
    const dropArea = modal.querySelector('#drop-area-add');
    const addStageBtn = modal.querySelector('#addStageBtnAdd');
    
    if (!dropArea || !addStageBtn) {
        console.log('Modal elements not ready, retrying...');
        setTimeout(() => {
            initializeModalFeatures();
        }, 200);
        return;
    }
    
    try {
        initializeImageUpload();
        initializeStageManagement();
        isInitialized = true;
        console.log('Feature initialization complete');
    } catch (error) {
        console.error('Error initializing features:', error);
    }
}

// Initialize image upload functionality
function initializeImageUpload() {
    console.log('Initializing image upload...');
    
    const dropArea = document.getElementById('drop-area-add');
    const fileInput = document.getElementById('fileInputAdd');
    const previewContainer = document.getElementById('imagePreviewContainerAdd');

    console.log('Image Upload Elements:', {
        dropArea: !!dropArea,
        fileInput: !!fileInput,
        previewContainer: !!previewContainer
    });
    
    if (!dropArea || !fileInput || !previewContainer) {
        console.error('Missing image upload elements');
        return;
    }
    
    // Remove existing event listeners by checking if they exist
    if (dropArea._uploadInitialized) {
        console.log('Image upload already initialized');
        return;
    }
    
    // Mark as initialized
    dropArea._uploadInitialized = true;
    fileInput._uploadInitialized = true;
    
    // Define event handlers
    const handleDropAreaClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Drop area clicked - opening file dialog');
        fileInput.click();
    };
    
    const handleFileInputChange = (e) => {
        console.log('File input changed:', e.target.files.length, 'files selected');
        if (e.target.files.length > 0) {
            handleFiles(e.target.files, previewContainer);
        }
    };
    
    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.add('dragover');
        dropArea.style.backgroundColor = '#f8f9fa';
        dropArea.style.border = '2px dashed #007bff';
    };
    
    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('dragover');
        dropArea.style.backgroundColor = '';
        dropArea.style.border = '';
    };
    
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropArea.classList.remove('dragover');
        dropArea.style.backgroundColor = '';
        dropArea.style.border = '';
        
        const files = e.dataTransfer.files;
        console.log('Files dropped:', files.length);
        if (files.length > 0) {
            handleFiles(files, previewContainer);
        }
    };
    
    // Add event listeners
    dropArea.addEventListener('click', handleDropAreaClick);
    fileInput.addEventListener('change', handleFileInputChange);
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    
    console.log('Image upload initialized successfully');
}

// Handle file uploads with validation
function handleFiles(files, previewContainer) {
    console.log('Processing', files.length, 'files');
    
    Array.from(files).forEach(file => {
        console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showAlert('error', `File "${file.name}" is not an image. Only image files are allowed.`);
            return;
        }
        
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            showAlert('error', `File "${file.name}" is too large. Maximum size is 5MB.`);
            return;
        }
        
        // Add file to selected files array
        selectedFiles.push(file);
        console.log('Added file to selectedFiles. Total files:', selectedFiles.length);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = function(event) {
            createImagePreview(event.target.result, file.name, selectedFiles.length - 1, previewContainer);
        };
        reader.readAsDataURL(file);
    });
}

// Create image preview element
function createImagePreview(src, fileName, fileIndex, previewContainer) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('position-relative', 'd-inline-block', 'm-2');
    wrapper.setAttribute('data-file-index', fileIndex);
    wrapper.style.width = '120px';
    wrapper.style.height = '120px';
    
    const img = document.createElement('img');
    img.src = src;
    img.classList.add('img-thumbnail');
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '8px';
    img.title = fileName;
    
    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '<i class="bi bi-x"></i>';
    removeBtn.classList.add('btn', 'btn-sm', 'btn-danger', 'position-absolute', 'top-0', 'end-0', 'rounded-circle');
    removeBtn.style.width = '30px';
    removeBtn.style.height = '30px';
    removeBtn.style.fontSize = '16px';
    removeBtn.style.lineHeight = '1';
    removeBtn.style.transform = 'translate(50%, -50%)';
    removeBtn.setAttribute('type', 'button');
    removeBtn.setAttribute('title', 'Remove image');
    
    removeBtn.onclick = function(e) {
        e.stopPropagation();
        const fileIndex = parseInt(wrapper.getAttribute('data-file-index'));
        selectedFiles.splice(fileIndex, 1);
        wrapper.remove();
        updateFileIndices(previewContainer);
        console.log('Image removed. Remaining files:', selectedFiles.length);
    };
    
    wrapper.appendChild(img);
    wrapper.appendChild(removeBtn);
    previewContainer.appendChild(wrapper);
    
    console.log('Image preview created for:', fileName);
}

// Update file indices for remaining previews
function updateFileIndices(previewContainer) {
    const previews = previewContainer.querySelectorAll('[data-file-index]');
    previews.forEach((preview, index) => {
        preview.setAttribute('data-file-index', index);
    });
}

// Initialize stage management
function initializeStageManagement() {
    console.log('Initializing stage management...');
    
    const addStageBtn = document.getElementById('addStageBtnAdd');
    const stageInput = document.getElementById('newStageInputAdd');
    const stagesContainer = document.getElementById('projectStagesContainerAdd');
    
    console.log('Stage Management Elements:', {
        addStageBtn: !!addStageBtn,
        stageInput: !!stageInput,
        stagesContainer: !!stagesContainer
    });
    
    if (!addStageBtn || !stageInput || !stagesContainer) {
        console.error('Missing stage management elements');
        return;
    }
    
    // Check if already initialized
    if (addStageBtn._stageInitialized) {
        console.log('Stage management already initialized');
        return;
    }
    
    // Mark as initialized
    addStageBtn._stageInitialized = true;
    stageInput._stageInitialized = true;
    
    // Add stage button click handler
    const handleAddStage = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const stageInputValue = stageInput.value.trim();
        console.log('Add Stage clicked. Input value:', stageInputValue);
        
        if (!stageInputValue) {
            showAlert('error', 'Please enter a stage name');
            stageInput.focus();
            return;
        }
        
        // Check if stage already exists
        const existingStages = stagesContainer.querySelectorAll('.form-check-label');
        const stageExists = Array.from(existingStages).some(label => 
            label.textContent.trim().toLowerCase() === stageInputValue.toLowerCase()
        );
        
        if (stageExists) {
            showAlert('error', 'This stage already exists');
            stageInput.focus();
            return;
        }
        
        // Create new stage element
        const stageDiv = document.createElement('div');
        stageDiv.className = 'stage-edit-item mb-3';
        stageDiv.innerHTML = `
            <div class="form-check d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <input class="form-check-input me-2" type="checkbox" checked>
                    <label class="form-check-label">${stageInputValue}</label>
                </div>
                <button type="button" class="btn btn-sm btn-outline-danger remove-stage-btn" title="Remove stage">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        
        // Add remove functionality
        const removeBtn = stageDiv.querySelector('.remove-stage-btn');
        removeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            stageDiv.remove();
            console.log('Stage removed:', stageInputValue);
            showAlert('success', 'Stage removed successfully!');
        });
        
        // Find the input group and insert the new stage before it
        const inputGroup = stagesContainer.querySelector('.input-group');
        if (inputGroup) {
            stagesContainer.insertBefore(stageDiv, inputGroup);
        } else {
            stagesContainer.appendChild(stageDiv);
        }
        
        // Clear input and focus
        stageInput.value = '';
        stageInput.focus();
        
        console.log('Stage added successfully:', stageInputValue);
        showAlert('success', 'Stage added successfully!');
    };
    
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddStage(e);
        }
    };
    
    // Add event listeners
    addStageBtn.addEventListener('click', handleAddStage);
    stageInput.addEventListener('keypress', handleKeyPress);
    
    console.log('Stage management initialized successfully');
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
    document.querySelectorAll('.preview-thumb').forEach(img => {
        img.addEventListener('click', () => {
            const largePreviewImage = document.getElementById('largePreviewImage');
            if (largePreviewImage) {
                largePreviewImage.src = img.getAttribute('data-img-src');
            }
        });
    });
}

// jQuery-based functionality (if available)
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
            const stageName = $(this).closest('.form-check').find('.form-check-label').text().trim();
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
                if (response.success) {
                    showAlert('success', 'Project created successfully!');
                    
                    // Reset form
                    $('#addProjectModal form')[0].reset();
                    clearSelectedFiles();
                    resetStages();
                    
                    setTimeout(function() {
                        $('#addProjectModal').modal('hide');
                        location.reload();
                    }, 1500);
                } else {
                    showAlert('error', response.message || 'Failed to create project');
                }
            },
            error: function(xhr) {
                console.error('AJAX Error:', xhr.responseText);
                showAlert('error', 'An error occurred while creating the project');
            },
            complete: function() {
                submitBtn.prop('disabled', false).text(originalText);
            }
        });
    });
}

// Form validation function
function validateProjectForm(formData) {
    const errors = [];
    
    const projectName = formData.get('project_name');
    const category = formData.get('category');
    const description = formData.get('description');
    const location = formData.get('location');
    const startDate = formData.get('start_date');
    const expectedCompletion = formData.get('expected_completion');
    const responsiblePerson = formData.get('responsible_person');
    
    if (!projectName) errors.push('Project name is required');
    if (!category) errors.push('Category is required');
    if (!description) errors.push('Description is required');
    if (!location) errors.push('Location is required');
    if (!startDate) errors.push('Start date is required');
    if (!expectedCompletion) errors.push('Expected completion date is required');
    if (!responsiblePerson) errors.push('Responsible person is required');
    
    // Validate dates
    if (startDate && expectedCompletion) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(expectedCompletion);
        
        if (startDateObj >= endDateObj) {
            errors.push('Expected completion date must be after start date');
        }
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
        // Remove custom stages, keep default ones
        container.querySelectorAll('.stage-edit-item').forEach(function(stage) {
            const label = stage.querySelector('.form-check-label');
            if (label) {
                const text = label.textContent.trim();
                if (!text.includes('Site Survey') && 
                    !text.includes('Material Procurement') && 
                    !text.includes('Final Inspection')) {
                    stage.remove();
                }
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
    
    // Remove existing alerts
    const addModal = document.getElementById('addProjectModal');
    if (addModal) {
        const existingAlerts = addModal.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());
        
        // Add new alert
        const modalBody = addModal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.insertAdjacentHTML('afterbegin', alertHtml);
        }
    }
    
    // Auto-dismiss success alerts after 3 seconds
    if (type === 'success') {
        setTimeout(function() {
            document.querySelectorAll('.alert-success').forEach(alert => {
                alert.style.display = 'none';
            });
        }, 3000);
    }
}

// Clear selected files function
function clearSelectedFiles() {
    selectedFiles = [];
    const imagePreviewContainer = document.getElementById('imagePreviewContainerAdd');
    if (imagePreviewContainer) {
        imagePreviewContainer.innerHTML = '';
    }
    const fileInput = document.getElementById('fileInputAdd');
    if (fileInput) {
        fileInput.value = '';
    }
}

// Manual initialization function for testing
window.manualInit = function() {
    console.log('Manual initialization triggered');
    isInitialized = false;
    initializeModalFeatures();
};

// Debug functions
window.testUpload = function() {
    console.log('Testing upload functionality...');
    const dropArea = document.getElementById('drop-area-add');
    const fileInput = document.getElementById('fileInputAdd');
    
    console.log('Drop area:', dropArea);
    console.log('File input:', fileInput);
    
    if (dropArea && fileInput) {
        console.log('Elements found, triggering click...');
        dropArea.click();
    } else {
        console.log('Elements not found');
    }
};

window.testStage = function() {
    console.log('Testing stage functionality...');
    const stageInput = document.getElementById('newStageInputAdd');
    const addBtn = document.getElementById('addStageBtnAdd');
    
    console.log('Stage input:', stageInput);
    console.log('Add button:', addBtn);
    
    if (stageInput && addBtn) {
        stageInput.value = 'Test Stage';
        addBtn.click();
    } else {
        console.log('Elements not found');
    }
};

// Alternative initialization if Bootstrap modal events aren't working
window.forceInit = function() {
    console.log('Force initialization triggered');
    isInitialized = false;
    setTimeout(() => {
        initializeModalFeatures();
    }, 500);
};
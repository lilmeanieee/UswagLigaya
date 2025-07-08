// Fixed add-project.js - Complete implementation
$(document).ready(function() {
    loadCategories();
    
    // Initialize image upload functionality
    initializeImageUpload();
    
    // Initialize stage management
    initializeStageManagement();
    
    // Function to load categories from database
    function loadCategories() {
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
    
    // Initialize image upload functionality
    function initializeImageUpload() {
        // Wait for DOM to be ready
        setTimeout(function() {
            const dropArea = document.getElementById('drop-area');
            const fileInput = document.getElementById('fileInput');
            const imagePreviewContainer = document.getElementById('imagePreviewContainer');
            
            // Check if elements exist
            if (!dropArea || !fileInput || !imagePreviewContainer) {
                console.error('Image upload elements not found');
                return;
            }
            
            // Store selected files globally
            let selectedFiles = [];
            
            // Remove any existing event listeners by cloning elements
            const newDropArea = dropArea.cloneNode(true);
            const newFileInput = fileInput.cloneNode(true);
            dropArea.parentNode.replaceChild(newDropArea, dropArea);
            fileInput.parentNode.replaceChild(newFileInput, fileInput);
            
            // Update references
            const finalDropArea = document.getElementById('drop-area');
            const finalFileInput = document.getElementById('fileInput');
            
            // Click to browse files
            finalDropArea.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Drop area clicked');
                finalFileInput.click();
            });
            
            // Handle file selection
            finalFileInput.addEventListener('change', function(e) {
                console.log('File input changed:', e.target.files);
                handleFiles(e.target.files);
            });
            
            // Handle drag and drop
            finalDropArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                e.stopPropagation();
                finalDropArea.classList.add('dragover');
            });
            
            finalDropArea.addEventListener('dragleave', function(e) {
                e.preventDefault();
                e.stopPropagation();
                finalDropArea.classList.remove('dragover');
            });
            
            finalDropArea.addEventListener('drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
                finalDropArea.classList.remove('dragover');
                console.log('Files dropped:', e.dataTransfer.files);
                handleFiles(e.dataTransfer.files);
            });
            
            function handleFiles(files) {
                console.log('Handling files:', files);
                
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    
                    // Validate file type
                    if (!file.type.startsWith('image/')) {
                        showAlert('error', 'Only image files are allowed');
                        continue;
                    }
                    
                    // Validate file size (5MB limit)
                    if (file.size > 5 * 1024 * 1024) {
                        showAlert('error', 'File size must be less than 5MB');
                        continue;
                    }
                    
                    // Add file to selected files array
                    selectedFiles.push(file);
                    
                    // Create preview
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const previewDiv = document.createElement('div');
                        previewDiv.className = 'position-relative d-inline-block m-2';
                        previewDiv.setAttribute('data-file-index', selectedFiles.length - 1);
                        previewDiv.innerHTML = `
                            <img src="${e.target.result}" class="img-thumbnail project-image-thumb" alt="Project Image" style="width: 100px; height: 100px; object-fit: cover;">
                            <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle remove-image-btn" style="width: 25px; height: 25px; font-size: 12px; line-height: 1;" title="Remove">&times;</button>
                        `;
                        
                        // Add remove functionality
                        previewDiv.querySelector('.remove-image-btn').addEventListener('click', function() {
                            const fileIndex = parseInt(previewDiv.getAttribute('data-file-index'));
                            selectedFiles.splice(fileIndex, 1);
                            previewDiv.remove();
                            
                            // Update file indices for remaining previews
                            updateFileIndices();
                        });
                        
                        imagePreviewContainer.appendChild(previewDiv);
                    };
                    reader.readAsDataURL(file);
                }
            }
            
            function updateFileIndices() {
                const previews = imagePreviewContainer.querySelectorAll('[data-file-index]');
                previews.forEach((preview, index) => {
                    preview.setAttribute('data-file-index', index);
                });
            }
            
            // Make selectedFiles accessible globally
            window.getSelectedFiles = function() {
                return selectedFiles;
            };
            
            // Function to clear selected files
            window.clearSelectedFiles = function() {
                selectedFiles = [];
                imagePreviewContainer.innerHTML = '';
            };
            
        }, 100); // Small delay to ensure DOM is ready
    }
    
    // Initialize stage management
    function initializeStageManagement() {
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
    }
    
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
        
        // Get uploaded images using the global function
        const selectedFiles = window.getSelectedFiles();
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
                    
                    // Clear image previews
                    document.getElementById('imagePreviewContainer').innerHTML = '';
                    
                    // Clear selected files
                    window.clearSelectedFiles();
                    
                    // Clear file input
                    document.getElementById('fileInput').value = '';
                    
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
            const inputGroup = container.querySelector('.input-group');
            
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
        $('#addProjectModal .alert').remove();
        
        // Add new alert at the top of modal body
        $('#addProjectModal .modal-body').find('.alert').remove();
        $('#addProjectModal .modal-body').prepend(alertHtml);
        
        // Auto-dismiss after 5 seconds
        setTimeout(function() {
            $('#addProjectModal .alert').fadeOut();
        }, 5000);
    }
    
    // Reset form when modal is closed
    $('#addProjectModal').on('hidden.bs.modal', function() {
        $('#addProjectModal form')[0].reset();
        $('.alert').remove();
        if (document.getElementById('imagePreviewContainer')) {
            document.getElementById('imagePreviewContainer').innerHTML = '';
        }
        if (document.getElementById('fileInput')) {
            document.getElementById('fileInput').value = '';
        }
        if (window.clearSelectedFiles) {
            window.clearSelectedFiles();
        }
        resetStages();
    });
});

// Clear alerts when modal is shown
$('#addProjectModal').on('show.bs.modal', function() {
    $(this).find('.alert').remove();
});
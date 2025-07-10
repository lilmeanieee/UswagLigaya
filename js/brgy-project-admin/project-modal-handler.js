// project-modal-handlers.js - Functions to populate project modals with database data

// Function to load project details for the view modal
function loadProjectDetails(projectId) {
    if (!projectId) {
        console.error('Project ID is required');
        return;
    }

    // Show loading state
    const modal = document.getElementById('projectDetailModal');
    const modalBody = modal.querySelector('.modal-body');
    const originalContent = modalBody.innerHTML;
    
    modalBody.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading project details...</p>
        </div>
    `;

    // Fetch project details
    $.ajax({
        url: '../../php-handlers/brgy-project-admin/get-project-details.php',
        method: 'GET',
        data: { project_id: projectId },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                populateProjectDetailModal(response.project);
            } else {
                modalBody.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        ${response.message || 'Failed to load project details'}
                    </div>
                `;
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading project details:', error);
            modalBody.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Failed to load project details. Please try again.
                </div>
            `;
        }
    });
}

    // Function to populate the project detail modal - FIXED VERSION
    function populateProjectDetailModal(project) {
        const modal = document.getElementById('projectDetailModal');
        
        // Update modal title
        const modalTitle = modal.querySelector('.modal-title');
        modalTitle.textContent = `${project.project_name} - Project Details`;
        
        // Format currency
        const formatCurrency = (amount) => {
            if (!amount || amount === 0) return 'N/A';
            return '₱' + Number(amount).toLocaleString('en-PH', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        };
        
        // Create project information table
        const projectInfoTable = `
            <table class="table table-sm">
                <tr>
                    <td class="fw-bold">Category:</td>
                    <td>${project.category_name || 'N/A'}</td>
                </tr>
                <tr>
                    <td class="fw-bold">Start Date:</td>
                    <td>${project.start_date_formatted || 'N/A'}</td>
                </tr>
                <tr>
                    <td class="fw-bold">Expected Completion:</td>
                    <td>${project.expected_completion_formatted || 'N/A'}</td>
                </tr>
                <tr>
                    <td class="fw-bold">Responsible Person:</td>
                    <td>${project.responsible_person || 'N/A'}</td>
                </tr>
                <tr>
                    <td class="fw-bold">Total Budget:</td>
                    <td>${formatCurrency(project.initial_budget)}</td>
                </tr>
                <tr>
                    <td class="fw-bold">Funding Source:</td>
                    <td>${project.funding_source || 'N/A'}</td>
                </tr>
            </table>
        `;
        
        // Create timeline/stages section
        let timelineHtml = '';
        if (project.stages && project.stages.length > 0) {
            project.stages.forEach(stage => {
                const statusClass = getStageStatusClass(stage.status);
                const startDate = stage.start_date && stage.start_date !== '0000-00-00' ? 
                    new Date(stage.start_date).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'short', day: 'numeric' 
                    }) : 'TBD';
                const endDate = stage.end_date && stage.end_date !== '0000-00-00' ? 
                    new Date(stage.end_date).toLocaleDateString('en-US', { 
                        year: 'numeric', month: 'short', day: 'numeric' 
                    }) : 'TBD';
                
                timelineHtml += `
                    <div class="timeline-item mb-3">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h6 class="mb-1">${stage.stage_name}</h6>
                                <small class="text-muted">${startDate} - ${endDate}</small>
                            </div>
                            <span class="badge ${statusClass}">${stage.status}</span>
                        </div>
                    </div>
                `;
            });
        } else {
            timelineHtml = '<p class="text-muted">No stages defined for this project.</p>';
        }
        
        // Create images section - FIXED VERSION
        let imagesHtml = '';
        if (project.project_images && project.project_images.length > 0) {
            project.project_images.forEach(image => {
                // Use the image_url provided by the backend
                const imageUrl = image.image_url;
                const filename = image.filename;
                
                imagesHtml += `
                    <img src="${imageUrl}" 
                        alt="Project Image" 
                        class="img-thumbnail preview-thumb" 
                        style="width: 100px; height: 100px; object-fit: cover; cursor: pointer;"
                        data-bs-toggle="modal" 
                        data-bs-target="#imagePreviewModal"
                        data-img-src="${imageUrl}">
                `;
            });
        } else {
            imagesHtml = '<p class="text-muted">No images uploaded for this project.</p>';
        }
        
        // Get last update date
        const lastUpdated = project.updated_at ? 
            new Date(project.updated_at).toLocaleDateString('en-US', { 
                year: 'numeric', month: 'short', day: 'numeric' 
            }) : 
            new Date(project.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', month: 'short', day: 'numeric' 
            });
        
        // Update modal body
        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = `
            <div class="mb-4">
                <h6>Project Information</h6>
                ${projectInfoTable}
            </div>
            
            <div class="mb-4">
                <h6>Project Timeline & Stages</h6>
                ${timelineHtml}
            </div>
            
            <div class="mb-3">
                <h6>Progress Updates</h6>
                <div class="progress mb-2" style="height: 20px;">
                    <div class="progress-bar bg-info" style="width: ${project.progress_percentage}%"></div>
                </div>
                <small class="text-muted">${project.progress_percentage}% Complete - Last updated: ${lastUpdated}</small>
            </div>
            
            <div class="mb-4">
                <h6>Project Description</h6>
                <p class="text-muted">${project.description || 'No description provided.'}</p>
            </div>
            
            <div class="mb-4">
                <h6>Location</h6>
                <p class="text-muted">${project.location || 'No location specified.'}</p>
            </div>
            
            <div class="mb-4">
                <h6>Uploaded Project Images</h6>
                <div class="d-flex flex-wrap gap-2">
                    ${imagesHtml}
                </div>
            </div>
        `;
        
        // Update modal footer button to show update modal
        const modalFooter = modal.querySelector('.modal-footer');
        const updateBtn = modalFooter.querySelector('.btn-primary');
        if (updateBtn) {
            updateBtn.onclick = function() {
                // Hide current modal
                const currentModal = bootstrap.Modal.getInstance(modal);
                currentModal.hide();
                
                // Show update modal
                setTimeout(() => {
                    loadProjectForUpdate(project.project_id);
                    const updateModal = new bootstrap.Modal(document.getElementById('updateProjectModal'));
                    updateModal.show();
                }, 300);
            };
        }
    }

// Function to get stage status badge class
function getStageStatusClass(status) {
    switch(status) {
        case 'Completed':
            return 'bg-success';
        case 'In Progress':
            return 'bg-primary';
        case 'Not Started':
            return 'bg-secondary';
        case 'On Hold':
            return 'bg-warning';
        default:
            return 'bg-secondary';
    }
}

// Function to load project data for update modal
function loadProjectForUpdate(projectId) {
    if (!projectId) {
        console.error('Project ID is required');
        return;
    }
    
    // Show loading state
    const modal = document.getElementById('updateProjectModal');
    const modalBody = modal.querySelector('.modal-body');
    const originalContent = modalBody.innerHTML;
    
    modalBody.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading project data...</p>
        </div>
    `;
    
    // Fetch project details
    $.ajax({
        url: '../../php-handlers/brgy-project-admin/get-project-details.php',
        method: 'GET',
        data: { project_id: projectId },
        dataType: 'json',
        success: function(response) {
            if (response.success) {
                populateUpdateProjectModal(response.project);
            } else {
                modalBody.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        ${response.message || 'Failed to load project data'}
                    </div>
                `;
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading project data:', error);
            modalBody.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Failed to load project data. Please try again.
                </div>
            `;
        }
    });
}

// Function to populate the update project modal
function populateUpdateProjectModal(project) {
    const modal = document.getElementById('updateProjectModal');
    
    // Update modal title
    const modalTitle = modal.querySelector('.modal-title');
    modalTitle.textContent = `Update Project - ${project.project_name}`;
    
    // Create the complete modal body HTML
    const modalBodyHtml = `
        <!-- Project Details -->
        <div class="card mb-3">
            <div class="card-header">
                <h5 class="mb-0">Project Details</h5>
            </div>
            <div class="card-body">
                <form id="updateProjectForm">
                    <input type="hidden" id="projectId" value="${project.project_id}">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Project Name</label>
                            <input type="text" class="form-control" id="projectName" value="${project.project_name || ''}">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Category</label>
                            <select class="form-select" id="projectCategory">
                                <option value="1" ${project.category_id == 1 ? 'selected' : ''}>Infrastructure</option>
                                <option value="2" ${project.category_id == 2 ? 'selected' : ''}>Public Service</option>
                                <option value="3" ${project.category_id == 3 ? 'selected' : ''}>Health & Wellness</option>
                                <option value="4" ${project.category_id == 4 ? 'selected' : ''}>Education</option>
                            </select>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="projectDescription" rows="3">${project.description || ''}</textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Location</label>
                        <input type="text" class="form-control" id="projectLocation" value="${project.location || ''}">
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Start Date</label>
                            <input type="date" class="form-control" id="projectStartDate" value="${project.start_date || ''}">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Expected Completion</label>
                            <input type="date" class="form-control" id="projectEndDate" value="${project.expected_completion || ''}">
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Budget</label>
                            <input type="number" class="form-control" id="projectBudget" value="${project.initial_budget || ''}" step="0.01">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Funding Source</label>
                            <input type="text" class="form-control" id="projectFunding" value="${project.funding_source || ''}">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Assign Responsible Personnel</label>
                        <input type="text" class="form-control" id="projectResponsible" value="${project.responsible_person || ''}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Project Status</label>
                        <select class="form-select" id="projectStatus">
                            <option value="Not Started" ${project.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                            <option value="Ongoing" ${project.status === 'Ongoing' ? 'selected' : ''}>Ongoing</option>
                            <option value="Delayed" ${project.status === 'Delayed' ? 'selected' : ''}>Delayed</option>
                            <option value="On Hold" ${project.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                            <option value="Completed" ${project.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="Cancelled" ${project.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Progress Percentage</label>
                        <input type="number" class="form-control" id="projectProgress" value="${project.progress_percentage || 0}" min="0" max="100">
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Project Stages -->
        <div class="card mb-3">
            <div class="card-header">
                <h5 class="mb-0">Project Stages</h5>
            </div>
            <div class="card-body" id="projectStagesContainerUpdate">
                <div class="sortable-stages" id="sortableStages">
                    ${generateStagesHtml(project.stages || [])}
                </div>
                <!-- Input and Add Button for new stage -->
                <div class="input-group mt-3">
                    <input type="text" id="newStageInputUpdate" class="form-control" placeholder="Enter new project stage">
                    <button type="button" class="btn btn-outline-primary" id="addStageBtnUpdate">
                        <i class="bi bi-plus me-1"></i>Add Stage
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Project Images -->
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Project Images</h5>
            </div>
            <div class="card-body">
                <div id="drop-area-update" class="upload-box text-center p-4" style="border: 2px dashed #dee2e6; border-radius: 8px; cursor: pointer;">
                    <p class="mb-2 fw-semibold">Drag & Drop image files<br><span class="text-primary">or Browse</span></p>
                    <p class="text-muted small">Supports: JPEG, PNG, GIF, TIFF</p>
                    <input type="file" id="fileInputUpdate" accept="image/*" multiple hidden>
                </div>
                <!-- Preview Container with existing images -->
                <div id="imagePreviewContainerUpdate" class="d-flex flex-wrap gap-2 mt-3">
                    ${generateImagesHtml(project.project_images || [], project.project_name)}
                </div>
            </div>
        </div>
    `;
    
    // Update modal body
    const modalBody = modal.querySelector('.modal-body');
    modalBody.innerHTML = modalBodyHtml;
    
    // Initialize stage management
    initializeStageManagement();
    
    // Initialize image upload
    initializeImageUpload();
}

// Function to generate stages HTML
function generateStagesHtml(stages) {
    if (!stages || stages.length === 0) {
        return '<p class="text-muted">No stages defined for this project.</p>';
    }
    
    return stages.map(stage => `
        <div class="stage-edit-item d-flex align-items-center justify-content-between bg-light p-2 rounded mb-2" data-stage-id="${stage.stage_id}">
            <div class="fw-semibold stage-label">${stage.stage_name}</div>
            <div class="d-flex align-items-center gap-2">
                <select class="form-select select-status w-auto" aria-label="Stage Status">
                    <option value="Not Started" ${stage.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                    <option value="In Progress" ${stage.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                    <option value="Completed" ${stage.status === 'Completed' ? 'selected' : ''}>Completed</option>
                </select>
                <button type="button" class="btn-close btn-sm remove-stage-btn" aria-label="Remove"></button>
            </div>
        </div>
    `).join('');
}


    // Function to generate images HTML - FIXED VERSION
    function generateImagesHtml(images, projectName) {
    if (!images || images.length === 0) {
        return '<p class="text-muted">No images uploaded for this project.</p>';
    }
    
        return images.map(image => {
            const imageUrl = image.image_url || image.filename;
            const filename = image.filename || image.image_filename;
            
            return `
                <div class="position-relative">
                    <img src="${imageUrl}" 
                        class="img-thumbnail project-image-thumb" 
                        alt="Project Image"
                        style="width: 100px; height: 100px; object-fit: cover; cursor: pointer;"
                        data-img-src="${imageUrl}">
                    <button class="btn-close position-absolute top-0 end-0 m-1 btn-sm bg-danger border rounded-circle remove-image-btn" 
                            title="Remove" 
                            data-image="${filename}"></button>
                </div>
            `;
      }).join('');
    }



    // Function to initialize stage management
    function initializeStageManagement() {
        // Add new stage functionality
        document.getElementById('addStageBtnUpdate').addEventListener('click', function() {
            const input = document.getElementById('newStageInputUpdate');
            const stageName = input.value.trim();
            
            if (stageName) {
                const stagesContainer = document.getElementById('sortableStages');
                const newStageHtml = `
                    <div class="stage-edit-item d-flex align-items-center justify-content-between bg-light p-2 rounded mb-2" data-stage-id="new">
                        <div class="fw-semibold stage-label">${stageName}</div>
                        <div class="d-flex align-items-center gap-2">
                            <select class="form-select select-status w-auto" aria-label="Stage Status">
                                <option value="Not Started" selected>Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                            </select>
                            <button type="button" class="btn-close btn-sm remove-stage-btn" aria-label="Remove"></button>
                        </div>
                    </div>
                `;
                stagesContainer.insertAdjacentHTML('beforeend', newStageHtml);
                input.value = '';
            }
        });
        
        // Remove stage functionality
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-stage-btn')) {
                e.target.closest('.stage-edit-item').remove();
            }
        });
    }

    // Function to initialize image upload
    function initializeImageUpload() {
        const dropArea = document.getElementById('drop-area-update');
        const fileInput = document.getElementById('fileInputUpdate');
        const imagePreviewContainer = document.getElementById('imagePreviewContainerUpdate');
        
        // Click to browse
        dropArea.addEventListener('click', () => fileInput.click());
        
        // File input change
        fileInput.addEventListener('change', handleFileSelect);
        
        // Drag and drop
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.classList.add('drag-over');
        });
        
        dropArea.addEventListener('dragleave', () => {
            dropArea.classList.remove('drag-over');
        });
        
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('drag-over');
            handleFileSelect(e);
        });
        
        // Remove image functionality
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('remove-image-btn')) {
                e.target.closest('.position-relative').remove();
            }
        });
    }

    // Function to handle file selection
    function handleFileSelect(e) {
        const files = e.target.files || e.dataTransfer.files;
        const imagePreviewContainer = document.getElementById('imagePreviewContainerUpdate');
        
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageHtml = `
                        <div class="position-relative">
                            <img src="${e.target.result}" 
                                class="img-thumbnail project-image-thumb" 
                                alt="New Project Image"
                                style="width: 100px; height: 100px; object-fit: cover;">
                            <button class="btn-close position-absolute top-0 end-0 m-1 btn-sm bg-danger border rounded-circle remove-image-btn" 
                                    title="Remove" 
                                    data-image="new"></button>
                        </div>
                    `;
                    imagePreviewContainer.insertAdjacentHTML('beforeend', imageHtml);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Initialize image preview modal functionality
    // Enhanced image preview modal functionality
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('preview-thumb') || e.target.classList.contains('project-image-thumb')) {
            const imgSrc = e.target.getAttribute('data-img-src') || e.target.src;
            const largePreviewImage = document.getElementById('largePreviewImage');
            
            if (largePreviewImage) {
                largePreviewImage.src = imgSrc;
                
                // Show the modal
                const imagePreviewModal = new bootstrap.Modal(document.getElementById('imagePreviewModal'), {
                    backdrop: true,  // Allow clicking backdrop to close
                    keyboard: true   // Allow ESC key to close
                });
                imagePreviewModal.show();
            }
        }
    });

    // Additional event listeners for better UX
    document.addEventListener('DOMContentLoaded', function() {
        const imagePreviewModal = document.getElementById('imagePreviewModal');
        
        if (imagePreviewModal) {
            // Close modal when clicking outside the image (on modal body or modal dialog)
            imagePreviewModal.addEventListener('click', function(e) {
                // Check if click is on modal body, modal dialog, or modal backdrop
                if (e.target === imagePreviewModal || 
                    e.target.classList.contains('modal-body') || 
                    e.target.classList.contains('modal-dialog') ||
                    e.target.classList.contains('modal-content')) {
                    const modal = bootstrap.Modal.getInstance(imagePreviewModal);
                    if (modal) {
                        modal.hide();
                    }
                }
            });
            
            // Close modal when clicking on the image itself (optional)
            const largePreviewImage = document.getElementById('largePreviewImage');
            if (largePreviewImage) {
                largePreviewImage.addEventListener('click', function() {
                    const modal = bootstrap.Modal.getInstance(imagePreviewModal);
                    if (modal) {
                        modal.hide();
                    }
                });
            }
            
            // Close modal with ESC key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    const modal = bootstrap.Modal.getInstance(imagePreviewModal);
                    if (modal) {
                        modal.hide();
                    }
                }
            });
            
            // Alternative method - listen for clicks on modal body
            const modalBody = imagePreviewModal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.addEventListener('click', function(e) {
                    // Only close if clicking on the modal body itself, not the image
                    if (e.target === modalBody) {
                        const modal = bootstrap.Modal.getInstance(imagePreviewModal);
                        if (modal) {
                            modal.hide();
                        }
                    }
                });
            }
        }
    });


    // Make functions globally available
    window.loadProjectDetails = loadProjectDetails;
    window.loadProjectForUpdate = loadProjectForUpdate;

    // Add this to your project-modal-handlers.js file

    // Function to handle project update form submission
    function handleUpdateProjectSubmission() {
        const form = document.getElementById('updateProjectForm');
        const modal = document.getElementById('updateProjectModal');
        
        // Add event listener to the update button in modal footer
        const updateButton = modal.querySelector('.modal-footer .btn-primary');
        if (updateButton) {
            updateButton.addEventListener('click', function() {
                submitUpdateProject();
            });
        }
    }

    // Function to submit the update project form
    function submitUpdateProject() {
        const form = document.getElementById('updateProjectForm');
        const formData = new FormData();
        
        // Get basic project data
        formData.append('project_id', document.getElementById('projectId').value);
        formData.append('project_name', document.getElementById('projectName').value);
        formData.append('category', document.getElementById('projectCategory').value);
        formData.append('description', document.getElementById('projectDescription').value);
        formData.append('location', document.getElementById('projectLocation').value);
        formData.append('start_date', document.getElementById('projectStartDate').value);
        formData.append('expected_completion', document.getElementById('projectEndDate').value);
        formData.append('initial_budget', document.getElementById('projectBudget').value);
        formData.append('funding_source', document.getElementById('projectFunding').value);
        formData.append('responsible_person', document.getElementById('projectResponsible').value);
        formData.append('status', document.getElementById('projectStatus').value);

        
        // Get stages data
        const stageItems = document.querySelectorAll('.stage-edit-item');
        const stageIds = [];
        const stageNames = [];
        const stageStatus = [];
        const stageStartDates = [];
        const stageEndDates = [];
        
        stageItems.forEach(item => {
            const stageId = item.dataset.stageId;
            const stageName = item.querySelector('.stage-label').textContent;
            const status = item.querySelector('.select-status').value;
            
            stageIds.push(stageId === 'new' ? '' : stageId);
            stageNames.push(stageName);
            stageStatus.push(status);
            stageStartDates.push(''); // You might want to add date inputs for stages
            stageEndDates.push(''); // You might want to add date inputs for stages
        });
        
        // Append stage data
        stageIds.forEach((id, index) => {
            formData.append('stage_ids[]', id);
            formData.append('stage_names[]', stageNames[index]);
            formData.append('stage_status[]', stageStatus[index]);
            formData.append('stage_start_dates[]', stageStartDates[index]);
            formData.append('stage_end_dates[]', stageEndDates[index]);
        });
        
        // Get removed images
        const removedImages = [];
        document.querySelectorAll('.remove-image-btn').forEach(btn => {
            const imageData = btn.dataset.image;
            if (imageData && imageData !== 'new') {
                removedImages.push(imageData);
            }
        });
        formData.append('removed_images', removedImages.join(','));
        
        // Get new images
        const fileInput = document.getElementById('fileInputUpdate');
        if (fileInput && fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('new_images[]', fileInput.files[i]);
            }
        }
        
        // Show loading state
        const updateButton = document.querySelector('#updateProjectModal .modal-footer .btn-primary');
        const originalText = updateButton.textContent;
        updateButton.disabled = true;
        updateButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
        
        // Submit the form
        $.ajax({
            url: '../../php-handlers/brgy-project-admin/update-project.php',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    // Show success message
                    showAlert('success', 'Project updated successfully!');
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('updateProjectModal'));
                    modal.hide();
                    
                    // Refresh the projects table or reload the page
                    if (typeof refreshProjectsTable === 'function') {
                        refreshProjectsTable();
                    } else {
                        location.reload();
                    }
                } else {
                    showAlert('danger', response.message || 'Failed to update project');
                }
            },
            error: function(xhr, status, error) {
                console.error('Update error:', error);
                showAlert('danger', 'An error occurred while updating the project');
            },
            complete: function() {
                // Reset button state
                updateButton.disabled = false;
                updateButton.textContent = originalText;
            }
        });
    }

    // Helper function to show alerts
    function showAlert(type, message) {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Insert alert at the top of the modal body or page
        const modalBody = document.querySelector('#updateProjectModal .modal-body');
        if (modalBody) {
            modalBody.insertAdjacentHTML('afterbegin', alertHtml);
        }
    }

    // Function to populate the update project modal
    function populateUpdateProjectModal(project) {
        const modal = document.getElementById('updateProjectModal');
        
        // Update modal title
        const modalTitle = modal.querySelector('.modal-title');
        modalTitle.textContent = `Update Project - ${project.project_name}`;
        
        // Create the complete modal body HTML
        const modalBodyHtml = `
            <!-- Project Details -->
            <div class="card mb-3">
                <div class="card-header">
                    <h5 class="mb-0">Project Details</h5>
                </div>
                <div class="card-body">
                    <form id="updateProjectForm">
                        <input type="hidden" id="projectId" value="${project.project_id}">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Project Name</label>
                                <input type="text" class="form-control" id="projectName" value="${project.project_name || ''}">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Category</label>
                                <select class="form-select" id="projectCategory">
                                    <option value="1" ${project.category_id == 1 ? 'selected' : ''}>Infrastructure</option>
                                    <option value="2" ${project.category_id == 2 ? 'selected' : ''}>Public Service</option>
                                    <option value="3" ${project.category_id == 3 ? 'selected' : ''}>Health & Wellness</option>
                                    <option value="4" ${project.category_id == 4 ? 'selected' : ''}>Education</option>
                                </select>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Description</label>
                            <textarea class="form-control" id="projectDescription" rows="3">${project.description || ''}</textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Location</label>
                            <input type="text" class="form-control" id="projectLocation" value="${project.location || ''}">
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Start Date</label>
                                <input type="date" class="form-control" id="projectStartDate" value="${project.start_date || ''}">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Expected Completion</label>
                                <input type="date" class="form-control" id="projectEndDate" value="${project.expected_completion || ''}">
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Budget</label>
                                <input type="number" class="form-control" id="projectBudget" value="${project.initial_budget || ''}" step="0.01">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Funding Source</label>
                                <input type="text" class="form-control" id="projectFunding" value="${project.funding_source || ''}">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Assign Responsible Personnel</label>
                            <input type="text" class="form-control" id="projectResponsible" value="${project.responsible_person || ''}">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Project Status</label>
                            <select class="form-select" id="projectStatus">
                                <option value="Not Started" ${project.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                                <option value="Ongoing" ${project.status === 'Ongoing' ? 'selected' : ''}>Ongoing</option>
                                <option value="Delayed" ${project.status === 'Delayed' ? 'selected' : ''}>Delayed</option>
                                <option value="On Hold" ${project.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                                <option value="Completed" ${project.status === 'Completed' ? 'selected' : ''}>Completed</option>
                                <option value="Cancelled" ${project.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Project Stages -->
            <div class="card mb-3">
                <div class="card-header">
                    <h5 class="mb-0">Project Stages</h5>
                </div>
                <div class="card-body" id="projectStagesContainerUpdate">
                    <div class="sortable-stages" id="sortableStages">
                        ${generateStagesHtml(project.stages || [])}
                    </div>
                    <!-- Input and Add Button for new stage -->
                    <div class="input-group mt-3">
                        <input type="text" id="newStageInputUpdate" class="form-control" placeholder="Enter new project stage">
                        <button type="button" class="btn btn-outline-primary" id="addStageBtnUpdate">
                            <i class="bi bi-plus me-1"></i>Add Stage
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Project Images -->
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Project Images</h5>
                </div>
                <div class="card-body">
                    <div id="drop-area-update" class="upload-box text-center p-4" style="border: 2px dashed #dee2e6; border-radius: 8px; cursor: pointer;">
                        <p class="mb-2 fw-semibold">Drag & Drop image files<br><span class="text-primary">or Browse</span></p>
                        <p class="text-muted small">Supports: JPEG, PNG, GIF, TIFF</p>
                        <input type="file" id="fileInputUpdate" accept="image/*" multiple hidden>
                    </div>
                    <!-- Preview Container with existing images -->
                    <div id="imagePreviewContainerUpdate" class="d-flex flex-wrap gap-2 mt-3">
                        ${generateImagesHtml(project.project_images || [], project.project_name)}
                    </div>
                </div>
            </div>
        `;
        
        // Update modal body
        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = modalBodyHtml;
        
        // Initialize stage management
        initializeStageManagement();
        
        // Initialize image upload
        initializeImageUpload();
        
        // Reset the update button to its default state
        resetUpdateButton();
        
        // Initialize form submission handler (only once)
        initializeUpdateButtonHandler();
    }

    // Function to reset the update button to its default state
    function resetUpdateButton() {
        const modal = document.getElementById('updateProjectModal');
        const updateButton = modal.querySelector('.modal-footer .btn-primary');
        
        if (updateButton) {
            updateButton.disabled = false;
            updateButton.textContent = 'Update Project';
            
            // Remove any existing event listeners by cloning the button
            const newButton = updateButton.cloneNode(true);
            updateButton.parentNode.replaceChild(newButton, updateButton);
        }
    }

    // Function to initialize the update button handler (only once)
    function initializeUpdateButtonHandler() {
        const modal = document.getElementById('updateProjectModal');
        const updateButton = modal.querySelector('.modal-footer .btn-primary');
        
        if (updateButton) {
            updateButton.addEventListener('click', function() {
                submitUpdateProject();
            });
        }
    }

    // Function to submit the update project form
    function submitUpdateProject() {
        const form = document.getElementById('updateProjectForm');
        const formData = new FormData();
        
        // Get basic project data
        formData.append('project_id', document.getElementById('projectId').value);
        formData.append('project_name', document.getElementById('projectName').value);
        formData.append('category', document.getElementById('projectCategory').value);
        formData.append('description', document.getElementById('projectDescription').value);
        formData.append('location', document.getElementById('projectLocation').value);
        formData.append('start_date', document.getElementById('projectStartDate').value);
        formData.append('expected_completion', document.getElementById('projectEndDate').value);
        formData.append('initial_budget', document.getElementById('projectBudget').value);
        formData.append('funding_source', document.getElementById('projectFunding').value);
        formData.append('responsible_person', document.getElementById('projectResponsible').value);
        formData.append('status', document.getElementById('projectStatus').value);
        
        // Get stages data
        const stageItems = document.querySelectorAll('.stage-edit-item');
        const stageIds = [];
        const stageNames = [];
        const stageStatus = [];
        const stageStartDates = [];
        const stageEndDates = [];
        
        stageItems.forEach(item => {
            const stageId = item.dataset.stageId;
            
            // Check if stage label exists before accessing textContent
            const stageLabelElement = item.querySelector('.stage-label');
            const stageName = stageLabelElement ? stageLabelElement.textContent.trim() : '';
            
            // Check if status select exists before accessing value
            const statusSelectElement = item.querySelector('.select-status');
            const status = statusSelectElement ? statusSelectElement.value : 'Not Started';
            
            // Only add stage if it has a name
            if (stageName) {
                stageIds.push(stageId === 'new' ? '' : stageId);
                stageNames.push(stageName);
                stageStatus.push(status);
                stageStartDates.push(''); // You might want to add date inputs for stages
                stageEndDates.push(''); // You might want to add date inputs for stages
            }
        });
        
        // Append stage data
        stageIds.forEach((id, index) => {
            formData.append('stage_ids[]', id);
            formData.append('stage_names[]', stageNames[index]);
            formData.append('stage_status[]', stageStatus[index]);
            formData.append('stage_start_dates[]', stageStartDates[index]);
            formData.append('stage_end_dates[]', stageEndDates[index]);
        });
        
        // Get removed images
        const removedImages = [];
        document.querySelectorAll('.remove-image-btn').forEach(btn => {
            const imageData = btn.dataset.image;
            if (imageData && imageData !== 'new') {
                removedImages.push(imageData);
            }
        });
        formData.append('removed_images', removedImages.join(','));
        
        // Get new images
        const fileInput = document.getElementById('fileInputUpdate');
        if (fileInput && fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('new_images[]', fileInput.files[i]);
            }
        }
        
        // Show loading state
        const updateButton = document.querySelector('#updateProjectModal .modal-footer .btn-primary');
        const originalText = updateButton.textContent;
        updateButton.disabled = true;
        updateButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
        
        // Submit the form
        $.ajax({
            url: '../../php-handlers/brgy-project-admin/update-project.php',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    // Show success message
                    showAlert('success', 'Project updated successfully!');
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('updateProjectModal'));
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
                    showAlert('danger', response.message || 'Failed to update project');
                }
            },
            error: function(xhr, status, error) {
                console.error('Update error:', error);
                showAlert('danger', 'An error occurred while updating the project');
            },
            complete: function() {
                // Reset button state
                updateButton.disabled = false;
                updateButton.textContent = originalText;
            }
        });
    }
    // Function to handle project update form submission
    function handleUpdateProjectSubmission() {
        const form = document.getElementById('updateProjectForm');
        const modal = document.getElementById('updateProjectModal');
        
        // Add event listener to the update button in modal footer
        const updateButton = modal.querySelector('.modal-footer .btn-primary');
        if (updateButton) {
            updateButton.addEventListener('click', function() {
                submitUpdateProject();
            });
        }
    }

    // Function to submit the update project form
    // Function to submit the update project form
    function submitUpdateProject() {
        const form = document.getElementById('updateProjectForm');
        const formData = new FormData();
        
        // Get basic project data
        formData.append('project_id', document.getElementById('projectId').value);
        formData.append('project_name', document.getElementById('projectName').value);
        formData.append('category', document.getElementById('projectCategory').value);
        formData.append('description', document.getElementById('projectDescription').value);
        formData.append('location', document.getElementById('projectLocation').value);
        formData.append('start_date', document.getElementById('projectStartDate').value);
        formData.append('expected_completion', document.getElementById('projectEndDate').value);
        formData.append('initial_budget', document.getElementById('projectBudget').value);
        formData.append('funding_source', document.getElementById('projectFunding').value);
        formData.append('responsible_person', document.getElementById('projectResponsible').value);
        formData.append('status', document.getElementById('projectStatus').value);
        
        // Get stages data
        const stageItems = document.querySelectorAll('.stage-edit-item');
        const stageIds = [];
        const stageNames = [];
        const stageStatus = [];
        const stageStartDates = [];
        const stageEndDates = [];
        
        stageItems.forEach(item => {
            const stageId = item.dataset.stageId;
            
            // Check if stage label exists before accessing textContent
            const stageLabelElement = item.querySelector('.stage-label');
            const stageName = stageLabelElement ? stageLabelElement.textContent.trim() : '';
            
            // Check if status select exists before accessing value
            const statusSelectElement = item.querySelector('.select-status');
            const status = statusSelectElement ? statusSelectElement.value : 'Not Started';
            
            // Only add stage if it has a name
            if (stageName) {
                stageIds.push(stageId === 'new' ? '' : stageId);
                stageNames.push(stageName);
                stageStatus.push(status);
                stageStartDates.push(''); // You might want to add date inputs for stages
                stageEndDates.push(''); // You might want to add date inputs for stages
            }
        });
        
        // Append stage data
        stageIds.forEach((id, index) => {
            formData.append('stage_ids[]', id);
            formData.append('stage_names[]', stageNames[index]);
            formData.append('stage_status[]', stageStatus[index]);
            formData.append('stage_start_dates[]', stageStartDates[index]);
            formData.append('stage_end_dates[]', stageEndDates[index]);
        });
        
        // Get removed images
        const removedImages = [];
        document.querySelectorAll('.remove-image-btn').forEach(btn => {
            const imageData = btn.dataset.image;
            if (imageData && imageData !== 'new') {
                removedImages.push(imageData);
            }
        });
        formData.append('removed_images', removedImages.join(','));
        
        // Get new images
        const fileInput = document.getElementById('fileInputUpdate');
        if (fileInput && fileInput.files.length > 0) {
            for (let i = 0; i < fileInput.files.length; i++) {
                formData.append('new_images[]', fileInput.files[i]);
            }
        }
        
        // Show loading state
        const updateButton = document.querySelector('#updateProjectModal .modal-footer .btn-primary');
        const originalText = updateButton.textContent;
        updateButton.disabled = true;
        updateButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';
        
        // Submit the form
        $.ajax({
            url: '../../php-handlers/brgy-project-admin/update-project.php',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    // Show success message
                    showAlert('success', 'Project updated successfully!');
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('updateProjectModal'));
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
                    showAlert('danger', response.message || 'Failed to update project');
                }
            },
            error: function(xhr, status, error) {
                console.error('Update error:', error);
                showAlert('danger', 'An error occurred while updating the project');
            },
            complete: function() {
                // Reset button state
                updateButton.disabled = false;
                updateButton.textContent = originalText;
            }
        });
    }

    // Make functions globally available
    window.submitUpdateProject = submitUpdateProject;
    window.handleUpdateProjectSubmission = handleUpdateProjectSubmission;
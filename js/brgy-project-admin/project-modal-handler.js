// project-modal-handler.js - Handle project modals (view and update)

// Function to load project details for view modal
function loadProjectDetails(projectId) {
    if (!projectId) {
        console.error('Project ID is required');
        return;
    }
    
    // Show loading state
    const modal = document.getElementById('projectDetailModal');
    if (modal) {
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = '<div class="text-center py-4"><i class="bi bi-hourglass-split"></i> Loading project details...</div>';
        }
    }
    
    $.ajax({
        url: '../../php-handlers/brgy-project-admin/get-project-details.php',
        method: 'GET',
        data: { project_id: projectId },
        dataType: 'json',
        success: function(response) {
            console.log('Project details loaded:', response);
            if (response.success) {
                populateViewModal(response.project);
            } else {
                console.error('Failed to load project details:', response.message);
                showModalError('projectDetailModal', response.message || 'Failed to load project details');
            }
        },
        error: function(xhr, status, error) {
            console.error('AJAX Error loading project details:', xhr.responseText);
            showModalError('projectDetailModal', 'Failed to load project details. Please try again.');
        }
    });
}

// Function to populate view modal with project data
function populateViewModal(project) {
    const modal = document.getElementById('projectDetailModal');
    if (!modal) {
        console.error('Project detail modal not found');
        return;
    }
    
    // Format data for display
    const formattedBudget = project.initial_budget ? 
        formatCurrency(project.initial_budget) : 'Not specified';
    
    const formattedStartDate = project.start_date ? 
        formatDate(project.start_date) : 'Not specified';
    
    const formattedEndDate = project.expected_completion ? 
        formatDate(project.expected_completion) : 'Not specified';
    
    const progressPercentage = project.progress_percentage || 0;
    
    // Create images gallery
    let imagesHtml = '';
    if (project.project_images && project.project_images.length > 0) {
        imagesHtml = '<div class="row g-2 mb-3">';
        project.project_images.forEach(function(image) {
            imagesHtml += `
                <div class="col-md-4 col-sm-6">
                    <img src="../../uploads/brgy_projects/${project.project_name}/${image}" 
                         class="img-fluid rounded" 
                         alt="Project Image"
                         style="height: 120px; object-fit: cover; width: 100%;"
                         onclick="showImageModal(this.src)">
                </div>
            `;
        });
        imagesHtml += '</div>';
    } else {
        imagesHtml = '<p class="text-muted">No images available</p>';
    }
    
    // Create stages display
    let stagesHtml = '';
    if (project.stages && project.stages.length > 0) {
        stagesHtml = '<div class="timeline">';
        project.stages.forEach(function(stage, index) {
            const stageClass = getStageStatusClass(stage.status);
            const stageIcon = getStageStatusIcon(stage.status);
            
            stagesHtml += `
                <div class="timeline-item">
                    <div class="timeline-marker ${stageClass}">
                        <i class="bi ${stageIcon}"></i>
                    </div>
                    <div class="timeline-content">
                        <h6 class="mb-1">${stage.stage_name}</h6>
                        <small class="text-muted">Status: <span class="badge ${stageClass}">${stage.status}</span></small>
                        ${stage.start_date && stage.start_date !== '0000-00-00' ? 
                            `<br><small class="text-muted">Started: ${formatDate(stage.start_date)}</small>` : ''}
                        ${stage.end_date && stage.end_date !== '0000-00-00' ? 
                            `<br><small class="text-muted">Completed: ${formatDate(stage.end_date)}</small>` : ''}
                    </div>
                </div>
            `;
        });
        stagesHtml += '</div>';
    } else {
        stagesHtml = '<p class="text-muted">No stages defined</p>';
    }
    
    // Populate modal content
    const modalContent = `
        <div class="row">
            <div class="col-md-8">
                <div class="mb-4">
                    <h4 class="mb-3">${project.project_name}</h4>
                    <div class="d-flex align-items-center mb-3">
                        <span class="badge ${getStatusClass(project.status)} me-2">${project.status}</span>
                        <span class="badge bg-secondary">${project.category_name}</span>
                    </div>
                    <p class="text-muted">${project.description || 'No description available'}</p>
                </div>
                
                <div class="mb-4">
                    <h5 class="mb-3">Progress</h5>
                    <div class="progress mb-2" style="height: 20px;">
                        <div class="progress-bar bg-info" style="width: ${progressPercentage}%">
                            ${progressPercentage}%
                        </div>
                    </div>
                </div>
                
                <div class="mb-4">
                    <h5 class="mb-3">Project Images</h5>
                    ${imagesHtml}
                </div>
                
                <div class="mb-4">
                    <h5 class="mb-3">Project Stages</h5>
                    ${stagesHtml}
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0">Project Details</h6>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <strong>Location:</strong>
                            <p class="mb-0 text-muted">${project.location || 'Not specified'}</p>
                        </div>
                        <div class="mb-3">
                            <strong>Budget:</strong>
                            <p class="mb-0 text-muted">${formattedBudget}</p>
                        </div>
                        <div class="mb-3">
                            <strong>Funding Source:</strong>
                            <p class="mb-0 text-muted">${project.funding_source || 'Not specified'}</p>
                        </div>
                        <div class="mb-3">
                            <strong>Responsible Person:</strong>
                            <p class="mb-0 text-muted">${project.responsible_person || 'Not specified'}</p>
                        </div>
                        <div class="mb-3">
                            <strong>Start Date:</strong>
                            <p class="mb-0 text-muted">${formattedStartDate}</p>
                        </div>
                        <div class="mb-3">
                            <strong>Expected Completion:</strong>
                            <p class="mb-0 text-muted">${formattedEndDate}</p>
                        </div>
                        <div class="mb-3">
                            <strong>Created:</strong>
                            <p class="mb-0 text-muted">${formatDate(project.created_at)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.innerHTML = modalContent;
    }
}

// Function to load project for update modal
function loadProjectForUpdate(projectId) {
    if (!projectId) {
        console.error('Project ID is required');
        return;
    }
    
    // Show loading state
    const modal = document.getElementById('updateProjectModal');
    if (modal) {
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = '<div class="text-center py-4"><i class="bi bi-hourglass-split"></i> Loading project data...</div>';
        }
    }
    
    $.ajax({
        url: '../../php-handlers/brgy-project-admin/get-project-details.php',
        method: 'GET',
        data: { project_id: projectId },
        dataType: 'json',
        success: function(response) {
            console.log('Project data for update loaded:', response);
            if (response.success) {
                populateUpdateModal(response.project);
            } else {
                console.error('Failed to load project data:', response.message);
                showModalError('updateProjectModal', response.message || 'Failed to load project data');
            }
        },
        error: function(xhr, status, error) {
            console.error('AJAX Error loading project data:', xhr.responseText);
            showModalError('updateProjectModal', 'Failed to load project data. Please try again.');
        }
    });
}

// Function to populate update modal with project data
function populateUpdateModal(project) {
    const modal = document.getElementById('updateProjectModal');
    if (!modal) {
        console.error('Update project modal not found');
        return;
    }
    
    // Create stages list for editing
    let stagesHtml = '';
    if (project.stages && project.stages.length > 0) {
        project.stages.forEach(function(stage, index) {
            stagesHtml += `
                <div class="stage-item mb-3 p-3 border rounded">
                    <div class="row align-items-center">
                        <div class="col-md-4">
                            <input type="text" class="form-control" 
                                   value="${stage.stage_name}" 
                                   placeholder="Stage name"
                                   name="stage_names[]">
                        </div>
                        <div class="col-md-3">
                            <select class="form-select" name="stage_status[]">
                                <option value="Not Started" ${stage.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                                <option value="In Progress" ${stage.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                                <option value="Completed" ${stage.status === 'Completed' ? 'selected' : ''}>Completed</option>
                                <option value="On Hold" ${stage.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <input type="date" class="form-control" 
                                   value="${stage.start_date !== '0000-00-00' ? stage.start_date : ''}" 
                                   name="stage_start_dates[]">
                        </div>
                        <div class="col-md-2">
                            <input type="date" class="form-control" 
                                   value="${stage.end_date !== '0000-00-00' ? stage.end_date : ''}" 
                                   name="stage_end_dates[]">
                        </div>
                        <div class="col-md-1">
                            <button type="button" class="btn btn-outline-danger btn-sm remove-stage">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>
                    </div>
                    <input type="hidden" name="stage_ids[]" value="${stage.stage_id}">
                </div>
            `;
        });
    }
    
    // Create current images display
    let currentImagesHtml = '';
    if (project.project_images && project.project_images.length > 0) {
        currentImagesHtml = '<div class="row g-2 mb-3">';
        project.project_images.forEach(function(image) {
            currentImagesHtml += `
                <div class="col-md-3 col-sm-4">
                    <div class="position-relative">
                        <img src="../../uploads/brgy_projects/${project.project_name}/${image}" 
                             class="img-fluid rounded" 
                             alt="Project Image"
                             style="height: 80px; object-fit: cover; width: 100%;">
                        <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0 remove-image" 
                                data-image="${image}" style="font-size: 10px; padding: 2px 6px;">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        currentImagesHtml += '</div>';
    }
    
    // Create update form
    const updateForm = `
        <form id="updateProjectForm" enctype="multipart/form-data">
            <input type="hidden" name="project_id" value="${project.project_id}">
            <input type="hidden" name="removed_images" id="removedImages" value="">
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Project Name *</label>
                    <input type="text" class="form-control" name="project_name" value="${project.project_name}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Category *</label>
                    <select class="form-select" name="category" required>
                        <option value="">Select category...</option>
                        <option value="1" ${project.category_id == 1 ? 'selected' : ''}>Infrastructure</option>
                        <option value="2" ${project.category_id == 2 ? 'selected' : ''}>Public Service</option>
                        <option value="3" ${project.category_id == 3 ? 'selected' : ''}>Health & Wellness</option>
                        <option value="4" ${project.category_id == 4 ? 'selected' : ''}>Education</option>
                    </select>
                </div>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Description *</label>
                <textarea class="form-control" name="description" rows="3" required>${project.description || ''}</textarea>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Location *</label>
                    <input type="text" class="form-control" name="location" value="${project.location || ''}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Status</label>
                    <select class="form-select" name="status">
                        <option value="Not Started" ${project.status === 'Not Started' ? 'selected' : ''}>Not Started</option>
                        <option value="Planning" ${project.status === 'Planning' ? 'selected' : ''}>Planning</option>
                        <option value="Ongoing" ${project.status === 'Ongoing' ? 'selected' : ''}>Ongoing</option>
                        <option value="On Hold" ${project.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                        <option value="Completed" ${project.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    </select>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Start Date *</label>
                    <input type="date" class="form-control" name="start_date" value="${project.start_date || ''}" required>
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Expected Completion *</label>
                    <input type="date" class="form-control" name="expected_completion" value="${project.expected_completion || ''}" required>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Initial Budget</label>
                    <input type="number" class="form-control" name="initial_budget" value="${project.initial_budget || ''}" step="0.01" min="0">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Progress Percentage</label>
                    <input type="number" class="form-control" name="progress_percentage" value="${project.progress_percentage || 0}" min="0" max="100">
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label class="form-label">Funding Source</label>
                    <input type="text" class="form-control" name="funding_source" value="${project.funding_source || ''}">
                </div>
                <div class="col-md-6 mb-3">
                    <label class="form-label">Responsible Person *</label>
                    <input type="text" class="form-control" name="responsible_person" value="${project.responsible_person || ''}" required>
                </div>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Current Images</label>
                ${currentImagesHtml || '<p class="text-muted">No images uploaded</p>'}
            </div>
            
            <div class="mb-3">
                <label class="form-label">Add New Images</label>
                <input type="file" class="form-control" name="new_images[]" multiple accept="image/*">
                <small class="text-muted">Select multiple images to add (JPG, PNG, GIF, TIFF)</small>
            </div>
            
            <div class="mb-3">
                <label class="form-label">Project Stages</label>
                <div id="stagesContainer">
                    ${stagesHtml}
                </div>
                <button type="button" class="btn btn-outline-secondary btn-sm" id="addStageBtn">
                    <i class="bi bi-plus"></i> Add Stage
                </button>
            </div>
            
            <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-save"></i> Save Changes
                </button>
            </div>
        </form>
    `;
    
    const modalBody = modal.querySelector('.modal-body');
    if (modalBody) {
        modalBody.innerHTML = updateForm;
    }
    
    // Initialize form handlers
    initializeUpdateFormHandlers();
}

// Initialize update form handlers
function initializeUpdateFormHandlers() {
    // Remove image handler
    $(document).on('click', '.remove-image', function(e) {
        e.preventDefault();
        const image = $(this).data('image');
        const removedImages = $('#removedImages').val();
        const newRemovedImages = removedImages ? removedImages + ',' + image : image;
        $('#removedImages').val(newRemovedImages);
        $(this).closest('.col-md-3').remove();
    });
    
    // Add stage handler
    $(document).on('click', '#addStageBtn', function(e) {
        e.preventDefault();
        const stageHtml = `
            <div class="stage-item mb-3 p-3 border rounded">
                <div class="row align-items-center">
                    <div class="col-md-4">
                        <input type="text" class="form-control" 
                               placeholder="Stage name"
                               name="stage_names[]">
                    </div>
                    <div class="col-md-3">
                        <select class="form-select" name="stage_status[]">
                            <option value="Not Started">Not Started</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="On Hold">On Hold</option>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <input type="date" class="form-control" name="stage_start_dates[]">
                    </div>
                    <div class="col-md-2">
                        <input type="date" class="form-control" name="stage_end_dates[]">
                    </div>
                    <div class="col-md-1">
                        <button type="button" class="btn btn-outline-danger btn-sm remove-stage">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </div>
                <input type="hidden" name="stage_ids[]" value="">
            </div>
        `;
        $('#stagesContainer').append(stageHtml);
    });
    
    // Remove stage handler
    $(document).on('click', '.remove-stage', function(e) {
        e.preventDefault();
        $(this).closest('.stage-item').remove();
    });
    
    // Form submission handler
    $(document).on('submit', '#updateProjectForm', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const submitBtn = $(this).find('button[type="submit"]');
        
        // Show loading state
        submitBtn.prop('disabled', true);
        submitBtn.html('<i class="bi bi-hourglass-split"></i> Saving...');
        
        $.ajax({
            url: '../../php-handlers/brgy-project-admin/update-project.php',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: function(response) {
                console.log('Update response:', response);
                if (response.success) {
                    // Show success message
                    showAlert('success', response.message);
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('updateProjectModal'));
                    if (modal) {
                        modal.hide();
                    }
                    
                    // Refresh projects list
                    if (window.refreshProjects) {
                        window.refreshProjects();
                    }
                } else {
                    showAlert('error', response.message || 'Failed to update project');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error updating project:', xhr.responseText);
                showAlert('error', 'Failed to update project. Please try again.');
            },
            complete: function() {
                // Reset button state
                submitBtn.prop('disabled', false);
                submitBtn.html('<i class="bi bi-save"></i> Save Changes');
            }
        });
    });
}

// Helper functions
function getStageStatusClass(status) {
    switch(status) {
        case 'Not Started':
            return 'bg-secondary';
        case 'In Progress':
            return 'bg-primary';
        case 'Completed':
            return 'bg-success';
        case 'On Hold':
            return 'bg-warning';
        default:
            return 'bg-secondary';
    }
}

function getStageStatusIcon(status) {
    switch(status) {
        case 'Not Started':
            return 'bi-circle';
        case 'In Progress':
            return 'bi-hourglass-split';
        case 'Completed':
            return 'bi-check-circle';
        case 'On Hold':
            return 'bi-pause-circle';
        default:
            return 'bi-circle';
    }
}

function getStatusClass(status) {
    switch(status) {
        case 'Planning':
            return 'bg-secondary';
        case 'Ongoing':
            return 'bg-primary';
        case 'Completed':
            return 'bg-success';
        case 'On Hold':
            return 'bg-warning';
        default:
            return 'bg-secondary';
    }
}

function formatDate(dateString) {
    if (!dateString || dateString === '0000-00-00') return 'Not specified';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatCurrency(amount) {
    if (!amount || amount === 0) return 'Not specified';
    return '₱' + Number(amount).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function showModalError(modalId, message) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    ${message}
                </div>
            `;
        }
    }
}

function showImageModal(imageSrc) {
    // Create image modal if it doesn't exist
    let imageModal = document.getElementById('imageModal');
    if (!imageModal) {
        const modalHtml = `
            <div class="modal fade" id="imageModal" tabindex="-1">
                <div class="modal-dialog modal-lg modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Project Image</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body text-center">
                            <img id="modalImage" src="" class="img-fluid" alt="Project Image">
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        imageModal = document.getElementById('imageModal');
    }
    
    // Set image source and show modal
    const modalImage = imageModal.querySelector('#modalImage');
    if (modalImage) {
        modalImage.src = imageSrc;
    }
    
    const bsModal = new bootstrap.Modal(imageModal);
    bsModal.show();
}

// Make functions available globally
window.loadProjectDetails = loadProjectDetails;
window.loadProjectForUpdate = loadProjectForUpdate;
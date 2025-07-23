class ProjectModalHandler {
        constructor() {
        this.hasUnsavedChanges = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeImagePreviewModal();
    }

    // Utility functions
    formatCurrency(amount) {
        if (!amount || amount === 0) return 'N/A';
        return '₱' + Number(amount).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    formatDate(date) {
        if (!date || date === '0000-00-00') return 'TBD';
        return new Date(date).toLocaleDateString('en-US', { 
            year: 'numeric', month: 'short', day: 'numeric' 
        });
    }

    getStageStatusClass(status) {
        const statusClasses = {
            'Completed': 'bg-success',
            'Ongoing': 'bg-primary',
            'Not Started': 'bg-secondary',
            'On Hold': 'bg-warning',
            'Delayed': 'bg-warning'
        };
        return statusClasses[status] || 'bg-secondary';
    }

    showAlert(type, message, container = null) {
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        const target = container || document.querySelector('#updateProjectModal .modal-body');
        if (target) {
            target.insertAdjacentHTML('afterbegin', alertHtml);
        }
    }

    showLoadingState(container, message = 'Loading...') {
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">${message}</p>
            </div>
        `;
    }

    showErrorState(container, message) {
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${message}
            </div>
        `;
    }

    // API calls
    async fetchProjectDetails(projectId) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: '../../php-handlers/brgy-project-admin/get-project-details.php',
                method: 'GET',
                data: { project_id: projectId },
                dataType: 'json',
                success: (response) => {
                    if (response.success) {
                        resolve(response.project);
                    } else {
                        reject(new Error(response.message || 'Failed to load project details'));
                    }
                },
                error: (xhr, status, error) => {
                    reject(new Error('Failed to load project details. Please try again.'));
                }
            });
        });
    }

    // Project details modal
    async loadProjectDetails(projectId) {
        if (!projectId) {
            console.error('Project ID is required');
            return;
        }

        const modal = document.getElementById('projectDetailModal');
        const modalBody = modal.querySelector('.modal-body');
        
        this.showLoadingState(modalBody, 'Loading project details...');

        try {
            const project = await this.fetchProjectDetails(projectId);
            this.populateProjectDetailModal(project);
        } catch (error) {
            console.error('Error loading project details:', error);
            this.showErrorState(modalBody, error.message);
        }
    }

    populateProjectDetailModal(project) {
    const modal = document.getElementById('projectDetailModal');
    const modalTitle = modal.querySelector('.modal-title');
    const modalBody = modal.querySelector('.modal-body');
    
    modalTitle.textContent = `${project.project_name} - Project Details`;

        const completedStages = project.stages ? project.stages.filter(stage => stage.status === 'Completed').length : 0;
        const totalStages = project.stages ? project.stages.length : 0;
        const calculatedProgress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

        console.log(`View Modal Progress: ${completedStages}/${totalStages} = ${calculatedProgress}%`);

        modalBody.innerHTML = `
            <div class="mb-4">
                <div class="mb-4">
                <h6>Project Description</h6>
                <p class="text-muted">${project.description || 'No description provided.'}</p>
            </div>
                ${this.generateProjectInfoTable(project)}
            </div>
            
            <div class="mb-4">
                <h6>Project Timeline & Stages</h6>
                ${this.generateTimelineHtml(project.stages)}
            </div>
            
            <div class="mb-3">
                <h6>Progress Updates</h6>
                <div class="progress mb-2" style="height: 20px;">
                    <div class="progress-bar bg-info" style="width: ${calculatedProgress}%"></div>
                </div>
                <small class="text-muted progress-text">${calculatedProgress}% Complete (${completedStages}/${totalStages} stages) - Last updated: ${this.getLastUpdated(project)}</small>
            </div>
            <div class="mb-4">
                <h6>Uploaded Project Images</h6>
                <div class="d-flex flex-wrap gap-2">
                    ${this.generateImagesHtml(project.project_images)}
                </div>
            </div>
        `;
        
        this.setupUpdateButton(modal, project.project_id);
    }


    generateProjectInfoTable(project) {
        const fields = [
            { label: 'Category', value: project.category_name },
            { label: 'Location', value: project.location || 'N/A' },
            { label: 'Start Date', value: project.start_date_formatted },
            { label: 'Expected Completion', value: project.expected_completion_formatted },
            { label: 'Responsible Person', value: project.responsible_person },
            { label: 'Total Budget', value: this.formatCurrency(project.initial_budget) },
            { label: 'Funding Source', value: project.funding_source }
        ];

        return `
            <table class="table table-sm">
                ${fields.map(field => `
                    <tr>
                        <td class="fw-bold">${field.label}:</td>
                        <td>${field.value || 'N/A'}</td>
                    </tr>
                `).join('')}
            </table>
        `;
    }

    generateTimelineHtml(stages) {
        if (!stages || stages.length === 0) {
            return '<p class="text-muted">No stages defined for this project.</p>';
        }

        return stages.map(stage => `
            <div class="timeline-item mb-3">
                <div class="d-flex justify-content-between">
                    <div>
                        <h6 class="mb-1">${stage.stage_name}</h6>
                        <small class="text-muted">${this.formatDate(stage.start_date)} - ${this.formatDate(stage.end_date)}</small>
                    </div>
                    <span class="badge ${this.getStageStatusClass(stage.status)}">${stage.status}</span>
                </div>
            </div>
        `).join('');
    }

    generateImagesHtml(images, isEditable = false) {
        if (!images || images.length === 0) {
            return '<p class="text-muted">No images uploaded for this project.</p>';
        }

        return images.map(image => {
            const imageUrl = image.image_url || image.filename;
            const filename = image.filename || image.image_filename;
            
            const removeButton = isEditable ? `
                <button class="btn-close position-absolute top-0 end-0 m-1 btn-sm bg-danger border rounded-circle remove-image-btn" 
                        title="Remove" 
                        data-image="${filename}"></button>
            ` : '';

            return `
                <div class="position-relative">
                    <img src="${imageUrl}" 
                        class="img-thumbnail ${isEditable ? 'project-image-thumb' : 'preview-thumb'}" 
                        alt="Project Image"
                        style="width: 100px; height: 100px; object-fit: cover; cursor: pointer;"
                        data-img-src="${imageUrl}"
                        ${!isEditable ? 'data-bs-toggle="modal" data-bs-target="#imagePreviewModal"' : ''}>
                    ${removeButton}
                </div>
            `;
        }).join('');
    }

    getLastUpdated(project) {
        const date = project.updated_at || project.created_at;
        return this.formatDate(date);
    }

    setupUpdateButton(modal, projectId) {
        const updateBtn = modal.querySelector('.modal-footer .btn-primary');
        if (updateBtn) {
            updateBtn.onclick = () => {
                const currentModal = bootstrap.Modal.getInstance(modal);
                currentModal.hide();
                
                setTimeout(() => {
                    this.loadProjectForUpdate(projectId);
                    const updateModal = new bootstrap.Modal(document.getElementById('updateProjectModal'));
                    updateModal.show();
                }, 300);
            };
        }
    }

    // Project update modal
    async loadProjectForUpdate(projectId) {
        if (!projectId) {
            console.error('Project ID is required');
            return;
        }
        
        const modal = document.getElementById('updateProjectModal');
        const modalBody = modal.querySelector('.modal-body');
        
        this.showLoadingState(modalBody, 'Loading project data...');
        
        try {
            const project = await this.fetchProjectDetails(projectId);
            await this.populateUpdateProjectModal(project);
        } catch (error) {
            console.error('Error loading project data:', error);
            this.showErrorState(modalBody, error.message);
        }
    }

    async fetchCategories() {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '../../php-handlers/brgy-project-admin/get-categories.php',
            method: 'GET',
            dataType: 'json',
            success: (response) => {
                if (response.success) {
                    resolve(response.categories);
                } else {
                    reject(new Error(response.message || 'Failed to load categories'));
                }
            },
            error: (xhr, status, error) => {
                reject(new Error('Failed to load categories. Please try again.'));
            }
            });
        });
    }

    generateCategoryOptions(categories, selectedCategoryId) {
        if (!categories || categories.length === 0) {
            return '<option value="">No categories available</option>';
        }
        
        return categories.map(category => 
            `<option value="${category.category_id}" ${category.category_id == selectedCategoryId ? 'selected' : ''}>${category.category_name}</option>`
        ).join('');
    }
    
    async populateUpdateProjectModal(project) {
        const modal = document.getElementById('updateProjectModal');
        const modalTitle = modal.querySelector('.modal-title');
        const modalBody = modal.querySelector('.modal-body');
        
        modalTitle.textContent = `Update Project - ${project.project_name}`;
        
        try {
            const categories = await this.fetchCategories();
            modalBody.innerHTML = `
                ${this.generateProjectDetailsCard(project, categories)}
                ${this.generateProjectStagesCard(project.stages)}
                ${this.generateProjectImagesCard(project.project_images, project.project_name)}
            `;
        } catch (error) {
            console.error('Error loading categories:', error);
            // Fallback to hardcoded categories
            modalBody.innerHTML = `
                ${this.generateProjectDetailsCard(project)}
                ${this.generateProjectStagesCard(project.stages)}
                ${this.generateProjectImagesCard(project.project_images, project.project_name)}
            `;
        }
        
        this.initializeUpdateModalComponents();
    }

    generateProjectDetailsCard(project, categories = null) {
        return `
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
                                    ${categories ? this.generateCategoryOptions(categories, project.category_id) : `
                                        <option value="1" ${project.category_id == 1 ? 'selected' : ''}>Infrastructure</option>
                                        <option value="2" ${project.category_id == 2 ? 'selected' : ''}>Public Service</option>
                                        <option value="3" ${project.category_id == 3 ? 'selected' : ''}>Health & Wellness</option>
                                        <option value="4" ${project.category_id == 4 ? 'selected' : ''}>Education</option>
                                    `}
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

                                <div class="mb-3" id="cancelReasonGroup" style="display: none;">
                                    <label class="form-label">Reason for Cancellation</label>
                                    <textarea class="form-control" id="cancelledReason" rows="2" placeholder="Provide reason..."></textarea>
                                </div>
                                
                                <option value="Ongoing" ${project.status === 'Ongoing' ? 'selected' : ''}>Ongoing</option>
                               
                                <option value="On Hold" ${project.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                                <option value="Cancelled" ${project.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    generateProjectStagesCard(stages) {
        return `
            <div class="card mb-3">
                <div class="card-header">
                    <h5 class="mb-0">Project Stages</h5>
                </div>
                <div class="card-body" id="projectStagesContainerUpdate">
                    <div class="sortable-stages" id="sortableStages">
                        ${this.generateStagesHtml(stages)}
                    </div>
                    <div class="input-group mt-3">
                        <input type="text" id="newStageInputUpdate" class="form-control" placeholder="Enter new project stage">
                        <button type="button" class="btn btn-outline-primary" id="addStageBtnUpdate">
                            <i class="bi bi-plus me-1"></i>Add Stage
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    generateProjectImagesCard(images, projectName) {
        return `
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
                    <div id="imagePreviewContainerUpdate" class="d-flex flex-wrap gap-2 mt-3">
                        ${this.generateImagesHtml(images, true)}
                    </div>
                </div>
            </div>
        `;
    }

    generateStagesHtml(stages) {
        if (!stages || stages.length === 0) {
            return '<p class="text-muted">No stages defined for this project.</p>';
        }
        
        return stages.map(stage => {
            const statusOptions = this.generateStatusOptions(stage.status);
            
            return `
                <div class="stage-edit-item d-flex align-items-center justify-content-between bg-light p-2 rounded mb-2" 
                    data-stage-id="${stage.stage_id}" 
                    data-is-new="false"
                    draggable="true">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-grip-vertical text-muted me-2" style="cursor: grab;"></i>
                        <div class="fw-semibold stage-label">${stage.stage_name}</div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <select class="form-select select-status w-auto" aria-label="Stage Status">
                            ${statusOptions}
                        </select>
                        <button type="button" 
                                class="btn btn-outline-danger btn-sm remove-stage-btn d-flex align-items-center justify-content-center" 
                                style="width: 32px; height: 32px; border-radius: 4px; padding: 0;"
                                title="Remove Stage"
                                aria-label="Remove">
                            <i class="bi bi-x-lg text-danger fw-bold" style="font-size: 14px;"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    generateStatusOptions(currentStatus) {
        const allStatuses = ['Not Started', 'Ongoing', 'Completed', 'On Hold', 'Delayed'];
        
        return allStatuses.map(status => {
            const isSelected = status === currentStatus;
            let isDisabled = false;
            
            // Apply restrictions based on current status
            if (currentStatus === 'Completed') {
                // If completed, disable all other options
                isDisabled = status !== 'Completed';
            } else if (currentStatus === 'Ongoing') {
                // If ongoing, disable "Not Started" (no turning back)
                isDisabled = status === 'Not Started';
            } else if (currentStatus === 'On Hold' || currentStatus === 'Delayed') {
                // If on hold or delayed, can only go to Ongoing or Completed
                // (assuming they were previously ongoing)
                isDisabled = status === 'Not Started';
            }
            
            return `<option value="${status}" ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}>${status}</option>`;
        }).join('');
    }


    initializeStageStatusRestrictions() {
    // Add event listener for status changes
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('select-status')) {
            this.handleStatusChange(e.target);
        }
    });
    
    // Apply initial restrictions when modal loads
    document.addEventListener('DOMContentLoaded', () => {
        this.applyInitialStatusRestrictions();
    });
    }

    applyInitialStatusRestrictions() {
        const statusSelects = document.querySelectorAll('.select-status');
        statusSelects.forEach(select => {
            this.applyStatusRestrictions(select, select.value, select.closest('.stage-edit-item').dataset.stageId);
        });
    }

    handleStatusChange(selectElement) {
        const stageItem = selectElement.closest('.stage-edit-item');
        const currentStatus = selectElement.value;
        const stageId = stageItem.dataset.stageId;
        
        console.log(`Status changed for stage ${stageId}: ${currentStatus}`);
        
        // Apply restrictions based on current status
        this.applyStatusRestrictions(selectElement, currentStatus, stageId);
        
        // CRITICAL: Update progress immediately after status change
        setTimeout(() => {
            this.updateProgressDisplay();
        }, 10); // Small delay to ensure DOM is updated
        
        this.hasUnsavedChanges = true;
    }

    updateProgressDisplay() {
    const progressPercentage = this.calculateProgressPercentageFromDOM();
    
    console.log(`Updating progress display to: ${progressPercentage}%`);
    
    // Update progress bars in update modal
    const progressBars = document.querySelectorAll('#updateProjectModal .progress-bar');
    const progressTexts = document.querySelectorAll('#updateProjectModal .progress-text');
    
    progressBars.forEach(bar => {
        bar.style.width = `${progressPercentage}%`;
        bar.setAttribute('aria-valuenow', progressPercentage);
    });
    
    const completedStages = document.querySelectorAll('#sortableStages .stage-edit-item .select-status[value="Completed"]').length;
    const totalStages = document.querySelectorAll('#sortableStages .stage-edit-item').length;
    
    progressTexts.forEach(text => {
        text.textContent = `${progressPercentage}% Complete (${completedStages}/${totalStages} stages)`;
    });
    
    console.log(`Progress display updated: ${progressPercentage}% (${completedStages}/${totalStages})`);
}

    applyStatusRestrictions(selectElement, currentStatus, stageId) {
        const options = selectElement.querySelectorAll('option');
        
        // Reset all options first
        options.forEach(option => {
            option.disabled = false;
        });
        
        // Apply restrictions based on current status
        if (currentStatus === 'Completed') {
            // If completed, disable all other options
            options.forEach(option => {
                if (option.value !== 'Completed') {
                    option.disabled = true;
                }
            });
        } else if (currentStatus === 'Ongoing') {
            // If ongoing, disable "Not Started" (no turning back)
            options.forEach(option => {
                if (option.value === 'Not Started') {
                    option.disabled = true;
                }
            });
        } else if (currentStatus === 'On Hold' || currentStatus === 'Delayed') {
            // If on hold or delayed, can only go to Ongoing or Completed
            // Cannot go back to "Not Started"
            options.forEach(option => {
                if (option.value === 'Not Started') {
                    option.disabled = true;
                }
            });
        }
    }


    initializeUpdateModalComponents() {
        this.initializeStageManagement();
        this.initializeImageUpload();
        this.initializeUpdateSubmission();
        this.initializeStageStatusRestrictions(); 
        this.initializeDragAndDrop();
        this.initializeChangeTracking();

        // FIXED: Ensure DOM is ready and calculate progress correctly
        setTimeout(() => {
            this.applyInitialStatusRestrictions();
            
            // CRITICAL: Recalculate and display progress after DOM is fully ready
            const initialProgress = this.calculateProgressPercentageFromDOM();
            console.log(`Initial progress calculated from DOM: ${initialProgress}%`);
            this.updateProgressDisplay();
            
            // Store initial progress for comparison
            this.initialProgress = initialProgress;
        }, 150); // Increased timeout to ensure DOM stability

        const statusSelect = document.getElementById('projectStatus');
        const cancelReasonGroup = document.getElementById('cancelReasonGroup');
        const cancelledReasonInput = document.getElementById('cancelledReason');

        if (statusSelect && cancelReasonGroup) {
            const toggleReasonField = () => {
                if (statusSelect.value === 'Cancelled') {
                    cancelReasonGroup.style.display = 'block';
                } else {
                    cancelReasonGroup.style.display = 'none';
                    cancelledReasonInput.value = ''; // clear reason if not cancelled
                }
            };

            statusSelect.addEventListener('change', toggleReasonField);
            toggleReasonField(); // call once to initialize based on current value
        }

    }

    initializeStageManagement() {
        const addStageBtn = document.getElementById('addStageBtnUpdate');
        const stageInput = document.getElementById('newStageInputUpdate');
        
        addStageBtn?.addEventListener('click', () => {
            const stageName = stageInput.value.trim();
            if (stageName) {
                this.addNewStage(stageName);
                stageInput.value = '';
            }
        });
        
        // Enter key support for adding stages
        stageInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addStageBtn.click();
            }
        });
    }

    addNewStage(stageName) {
        const stagesContainer = document.getElementById('sortableStages');
        
        const tempId = 'new_' + Date.now();
        
        const newStageHtml = `
            <div class="stage-edit-item d-flex align-items-center justify-content-between bg-light p-2 rounded mb-2" 
                 data-stage-id="new" 
                 data-is-new="true"
                 draggable="true">
                <div class="d-flex align-items-center">
                    <i class="bi bi-grip-vertical text-muted me-2" style="cursor: grab;"></i>
                    <div class="fw-semibold stage-label">${stageName}</div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <select class="form-select select-status w-auto" aria-label="Stage Status">
                        <option value="Not Started" selected>Not Started</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Delayed">Delayed</option>
                    </select>
                    <button type="button" 
                            class="btn btn-outline-danger btn-sm remove-stage-btn d-flex align-items-center justify-content-center" 
                            style="width: 32px; height: 32px; border-radius: 4px; padding: 0;"
                            title="Remove Stage"
                            aria-label="Remove">
                        <i class="bi bi-x-lg text-danger fw-bold" style="font-size: 14px;"></i>
                    </button>
                </div>
            </div>
        `;

        stagesContainer.insertAdjacentHTML('beforeend', newStageHtml);
        
        const newStageElement = stagesContainer.lastElementChild;
        const statusSelect = newStageElement.querySelector('.select-status');
        if (statusSelect) {
            this.applyStatusRestrictions(statusSelect, 'Not Started', 'new');
        }
        this.updateStageOrders();
        this.updateProgressDisplay();
    
        console.log('Added new stage:', stageName, 'with ID: new');
    }

    initializeDragAndDrop() {
    const stagesContainer = document.getElementById('sortableStages');
    if (!stagesContainer) return;

    let draggedElement = null;
    let placeholder = null;

    // Create placeholder element
    const createPlaceholder = () => {
        const div = document.createElement('div');
        div.className = 'stage-placeholder bg-primary-subtle border border-primary border-dashed p-2 rounded mb-2';
        div.style.height = '50px';
        div.innerHTML = '<div class="text-center text-primary">Drop here</div>';
        return div;
    };

    // Drag start
    stagesContainer.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('stage-edit-item')) {
            draggedElement = e.target;
            draggedElement.style.opacity = '0.5';
            
            // Create and insert placeholder
            placeholder = createPlaceholder();
            draggedElement.parentNode.insertBefore(placeholder, draggedElement.nextSibling);
            
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', draggedElement.outerHTML);
        }
    });

    // Drag end
    stagesContainer.addEventListener('dragend', (e) => {
        if (draggedElement) {
            draggedElement.style.opacity = '1';
            if (placeholder && placeholder.parentNode) {
                placeholder.parentNode.removeChild(placeholder);
            }
            draggedElement = null;
            placeholder = null;
        }
    });

    // Drag over
    stagesContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const afterElement = this.getDragAfterElement(stagesContainer, e.clientY);
        if (placeholder) {
            if (afterElement == null) {
                stagesContainer.appendChild(placeholder);
            } else {
                stagesContainer.insertBefore(placeholder, afterElement);
            }
        }
    });

    // Drop
    stagesContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        
        if (draggedElement && placeholder) {
            // Replace placeholder with dragged element
            placeholder.parentNode.replaceChild(draggedElement, placeholder);
            draggedElement.style.opacity = '1';
            
            // Update stage orders
            this.updateStageOrders();
        }
    });

    // Prevent default drag behavior on child elements that shouldn't be draggable
    stagesContainer.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('form-select') || 
            e.target.classList.contains('btn-close') ||
            e.target.tagName === 'OPTION') {
            e.preventDefault();
            e.stopPropagation();
        }
    });
}

//helper method to determine drop position
getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.stage-edit-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

updateStageOrders() {
    const stageItems = document.querySelectorAll('.stage-edit-item');
    
    console.log('Updating stage orders for', stageItems.length, 'stages');
    
    stageItems.forEach((item, index) => {
        const newOrder = index + 1;
        
        // Update the data-order attribute (this is what appendStagesData will use)
        item.dataset.order = newOrder;
        
        // Optional: Add visual indicator of order
        const orderIndicator = item.querySelector('.order-indicator');
        if (orderIndicator) {
            orderIndicator.textContent = newOrder;
        }
        
        // Debug logging
        const stageId = item.dataset.stageId;
        const stageName = item.querySelector('.stage-label')?.textContent?.trim();
        console.log(`Stage "${stageName}" (ID: ${stageId}) - New order: ${newOrder}`);
    });
    
    console.log('Stage orders updated');
}


    initializeImageUpload() {
        const dropArea = document.getElementById('drop-area-update');
        const fileInput = document.getElementById('fileInputUpdate');
        
        if (!dropArea || !fileInput) return;
        
        dropArea.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop events
        ['dragover', 'dragenter'].forEach(eventName => {
            dropArea.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropArea.classList.add('drag-over');
            });
        });
        
        ['dragleave', 'dragend'].forEach(eventName => {
            dropArea.addEventListener(eventName, () => {
                dropArea.classList.remove('drag-over');
            });
        });
        
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.classList.remove('drag-over');
            this.handleFileSelect(e);
        });
    }

    handleFileSelect(e) {
        const files = e.target.files || e.dataTransfer.files;
        const container = document.getElementById('imagePreviewContainerUpdate');
        
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
                    container.insertAdjacentHTML('beforeend', imageHtml);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    initializeUpdateSubmission() {
        const updateForm = document.getElementById('updateProjectForm');
        const submitBtn = document.querySelector('#updateProjectModal .modal-footer .btn-primary');

         if (submitBtn) {
            submitBtn.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Call the submit method directly
                this.submitUpdateProject();
            });
        }

        if (updateForm) {
            updateForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitUpdateProject();
            });
        }
    }

    async submitUpdateProject() {
    this.showUpdateConfirmation(async () => {
        const formData = this.collectFormData();
        const updateButton = document.querySelector('#updateProjectModal .modal-footer .btn-primary');
        
        this.setButtonLoadingState(updateButton, 'Updating...');
        
        try {
            const response = await this.submitFormData(formData);
            
            if (response.success) {
                this.hasUnsavedChanges = false; // Reset change tracking
                this.showAlert('success', 'Project updated successfully!');
                this.closeModalAndRefresh();
            } else {
                this.showAlert('danger', response.message || 'Failed to update project');
            }
        } catch (error) {
            console.error('Update error:', error);
            this.showAlert('danger', 'An error occurred while updating the project');
        } finally {
            this.resetButtonState(updateButton, 'Update Project');
        }
    });
}
    collectFormData() {
    const formData = new FormData();

    // CRITICAL: Calculate progress from current DOM state
    const progressPercentage = this.calculateProgressPercentageFromDOM();
    console.log(`Final progress calculation for submission: ${progressPercentage}%`);
    
    // Basic project data
    const fields = [
        'project_id', 'project_name', 'category', 'description', 'location',
        'start_date', 'expected_completion', 'initial_budget', 'funding_source',
        'responsible_person', 'status'
    ];
    
    const elementIds = [
        'projectId', 'projectName', 'projectCategory', 'projectDescription', 'projectLocation',
        'projectStartDate', 'projectEndDate', 'projectBudget', 'projectFunding',
        'projectResponsible', 'projectStatus'
    ];
    
    const cancelledReason = document.getElementById('cancelledReason');
    if (cancelledReason && document.getElementById('projectStatus')?.value === 'Cancelled') {
        formData.append('cancelled_reason', cancelledReason.value);
    }

    fields.forEach((field, index) => {
        const element = document.getElementById(elementIds[index]);
        if (element) {
            formData.append(field, element.value);
            console.log(`Added field ${field}:`, element.value);
        }
    });

    // CRITICAL: Add the correctly calculated progress
    formData.append('progress_percentage', progressPercentage.toString());
    console.log(`Progress percentage added to FormData: ${progressPercentage}%`);
    
    // Stages data
    this.appendStagesData(formData);
    
    // Images data
    this.appendImagesData(formData);
    
    return formData;
}

    appendStagesData(formData) {
        const stageItems = document.querySelectorAll('.stage-edit-item');
        
        console.log('Processing', stageItems.length, 'stage items');
        
        const existingStages = [];
        const newStages = [];
        
        stageItems.forEach((item, index) => {
            const stageId = item.dataset.stageId;
            const isNew = item.dataset.isNew === 'true' || stageId === 'new';
            const stageLabelElement = item.querySelector('.stage-label');
            const statusElement = item.querySelector('.select-status');
            
            if (!stageLabelElement || !statusElement) {
                console.warn('Missing stage elements, skipping stage item:', item);
                return;
            }
            
            const stageName = stageLabelElement.textContent.trim();
            const status = statusElement.value;
            
            if (!stageName) {
                console.warn('Empty stage name, skipping');
                return;
            }
            
            // **FIX: Use the data-order attribute set by drag-and-drop, fallback to DOM index**
            const orderFromDragDrop = item.dataset.order ? parseInt(item.dataset.order) : (index + 1);
            
            const stageData = {
                id: stageId,
                name: stageName,
                status: status,
                order: orderFromDragDrop // This now uses the drag-and-drop order
            };
            
            if (isNew) {
                newStages.push(stageData);
                console.log('New stage found:', stageData);
            } else if (stageId && stageId !== 'new' && !isNaN(stageId) && parseInt(stageId) > 0) {
                existingStages.push(stageData);
                console.log('Existing stage found:', stageData);
            } else {
                newStages.push(stageData);
                console.log('Invalid ID, treating as new stage:', stageData);
            }
        });
        
        console.log('Existing stages:', existingStages);
        console.log('New stages:', newStages);
        
        // **IMPORTANT: Sort stages by order before appending to FormData**
        existingStages.sort((a, b) => a.order - b.order);
        newStages.sort((a, b) => a.order - b.order);
        
        existingStages.forEach(stage => {
            formData.append('existing_stage_ids[]', stage.id);
            formData.append('existing_stage_names[]', stage.name);
            formData.append('existing_stage_status[]', stage.status);
            formData.append('existing_stage_order[]', stage.order);
        });
        
        newStages.forEach(stage => {
            formData.append('new_stage_names[]', stage.name);
            formData.append('new_stage_status[]', stage.status);
            formData.append('new_stage_order[]', stage.order);
        });
        
        console.log('Stage data appended to FormData');
        console.log('Existing stages count:', existingStages.length);
        console.log('New stages count:', newStages.length);
    }
    appendImagesData(formData) {
        // Removed images
        const removedImages = Array.from(document.querySelectorAll('.remove-image-btn'))
            .map(btn => btn.dataset.image)
            .filter(img => img && img !== 'new');
        
        formData.append('removed_images', removedImages.join(','));
        
        // New images
        const fileInput = document.getElementById('fileInputUpdate');
        if (fileInput?.files.length > 0) {
            Array.from(fileInput.files).forEach(file => {
                formData.append('new_images[]', file);
            });
        }
    }

    submitFormData(formData) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: '../../php-handlers/brgy-project-admin/update-project.php',
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            success: (response) => {
                console.log('Server response:', response);
                resolve(response);
            },
            error: (xhr, status, error) => {
                console.error('AJAX Error:', {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    responseText: xhr.responseText,
                    error: error
                });
                reject(new Error(`Request failed: ${error}`));
            }
        });
    });
}

    setButtonLoadingState(button, text) {
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>${text}`;
    }

    resetButtonState(button, text) {
        button.disabled = false;
        button.textContent = text;
    }

    closeModalAndRefresh() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('updateProjectModal'));
        modal.hide();
        
        if (typeof refreshProjectsTable === 'function') {
            refreshProjectsTable();
        } else {
            location.reload();
        }
    }

    // Image preview modal functionality
    initializeImagePreviewModal() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('preview-thumb') || 
                e.target.classList.contains('project-image-thumb')) {
                this.showImagePreview(e.target);
            }
        });
        
        this.bindImagePreviewEvents();
    }

    showImagePreview(imgElement) {
        const imgSrc = imgElement.getAttribute('data-img-src') || imgElement.src;
        const largePreviewImage = document.getElementById('largePreviewImage');
        
        if (largePreviewImage) {
            largePreviewImage.src = imgSrc;
            const modal = new bootstrap.Modal(document.getElementById('imagePreviewModal'));
            modal.show();
        }
    }

    bindImagePreviewEvents() {
        const modal = document.getElementById('imagePreviewModal');
        if (!modal) return;
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal || 
                e.target.classList.contains('modal-body') || 
                e.target.classList.contains('modal-dialog') ||
                e.target.classList.contains('modal-content')) {
                this.closeImagePreview();
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeImagePreview();
            }
        });
    }

    closeImagePreview() {
        const modal = bootstrap.Modal.getInstance(document.getElementById('imagePreviewModal'));
        if (modal) {
            modal.hide();
        }
    }

      initializeChangeTracking() {
        const modal = document.getElementById('updateProjectModal');
        
        // Track form field changes
        const formInputs = modal.querySelectorAll('input, select, textarea');
        formInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.hasUnsavedChanges = true;
            });
            input.addEventListener('input', () => {
                this.hasUnsavedChanges = true;
            });
        });
        
        // Track image uploads
        const fileInput = document.getElementById('fileInputUpdate');
        if (fileInput) {
            fileInput.addEventListener('change', () => {
                if (fileInput.files.length > 0) {
                    this.hasUnsavedChanges = true;
                }
            });
        }
        
        // Track stage additions/removals/reorders
        const stagesContainer = document.getElementById('sortableStages');
        if (stagesContainer) {
            const observer = new MutationObserver(() => {
                this.hasUnsavedChanges = true;
            });
            observer.observe(stagesContainer, { childList: true, subtree: true });
        }
        
        // ENHANCED: Handle modal close events (X button, backdrop click, ESC key)
        modal.addEventListener('hide.bs.modal', (e) => {
            if (this.hasUnsavedChanges) {
                e.preventDefault();
                this.showDiscardChangesConfirmation(() => {
                    this.hasUnsavedChanges = false;
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    modalInstance.hide();
                });
            }
        });

        // ENHANCED: Also handle backdrop clicks and ESC key
        modal.addEventListener('click', (e) => {
            if (e.target === modal && this.hasUnsavedChanges) {
                this.showDiscardChangesConfirmation(() => {
                    this.hasUnsavedChanges = false;
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    modalInstance.hide();
                });
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show') && this.hasUnsavedChanges) {
                e.preventDefault();
                this.showDiscardChangesConfirmation(() => {
                    this.hasUnsavedChanges = false;
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    modalInstance.hide();
                });
            }
        });
    }

showRemoveStageConfirmation(stageElement, callback) {
        const stageName = stageElement.querySelector('.stage-label')?.textContent?.trim() || 'this stage';
        
        const confirmationHtml = `
            <div class="modal fade" id="removeStageModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header border-0 pb-0">
                            <h5 class="modal-title text-danger">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                Confirm Stage Removal
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-3">Are you sure you want to remove "<strong>${stageName}</strong>"?</p>
                            <div class="alert alert-warning">
                                <i class="bi bi-info-circle me-2"></i>
                                This action cannot be undone and will permanently delete this stage from the project.
                            </div>
                        </div>
                        <div class="modal-footer border-0 pt-0">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x me-1"></i>Cancel
                            </button>
                            <button type="button" class="btn btn-danger" id="confirmRemoveStage">
                                <i class="bi bi-trash me-1"></i>Remove Stage
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing confirmation modal if any
        const existingModal = document.getElementById('removeStageModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', confirmationHtml);
        
        // Show modal and bind events
        const modal = new bootstrap.Modal(document.getElementById('removeStageModal'));
        modal.show();
        
        document.getElementById('confirmRemoveStage').addEventListener('click', () => {
            callback();
            modal.hide();
            // Clean up modal after it's hidden
            setTimeout(() => {
                document.getElementById('removeStageModal')?.remove();
            }, 300);
        });
        
        // Clean up modal when cancelled
        document.getElementById('removeStageModal').addEventListener('hidden.bs.modal', () => {
            setTimeout(() => {
                document.getElementById('removeStageModal')?.remove();
            }, 300);
        });
    }

  showUpdateConfirmation(callback) {
        const confirmationHtml = `
            <div class="modal fade" id="updateConfirmModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header border-0 pb-0">
                            <h5 class="modal-title text-primary">
                                <i class="bi bi-check-circle me-2"></i>
                                Confirm Update
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-3">Are you sure you want to save all changes to this project?</p>
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle me-2"></i>
                                This will update the project with all your modifications including stages, images, and project details.
                            </div>
                        </div>
                        <div class="modal-footer border-0 pt-0">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="bi bi-x me-1"></i>Cancel
                            </button>
                            <button type="button" class="btn btn-primary" id="confirmUpdate">
                                <i class="bi bi-check-lg me-1"></i>Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing confirmation modal if any
        const existingModal = document.getElementById('updateConfirmModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', confirmationHtml);
        
        // Show modal and bind events
        const modal = new bootstrap.Modal(document.getElementById('updateConfirmModal'));
        modal.show();
        
        document.getElementById('confirmUpdate').addEventListener('click', () => {
            callback();
            modal.hide();
            // Clean up modal after it's hidden
            setTimeout(() => {
                document.getElementById('updateConfirmModal')?.remove();
            }, 300);
        });
        
        // Clean up modal when cancelled
        document.getElementById('updateConfirmModal').addEventListener('hidden.bs.modal', () => {
            setTimeout(() => {
                document.getElementById('updateConfirmModal')?.remove();
            }, 300);
        });
    }

 showDiscardChangesConfirmation(callback) {
        const confirmationHtml = `
            <div class="modal fade" id="discardChangesModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header border-0 pb-0">
                            <h5 class="modal-title text-warning">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                Unsaved Changes
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-3">You have unsaved changes that will be lost.</p>
                            <div class="alert alert-warning">
                                <i class="bi bi-info-circle me-2"></i>
                                Are you sure you want to close without saving? All your changes will be permanently lost.
                            </div>
                        </div>
                        <div class="modal-footer border-0 pt-0">
                            <button type="button" class="btn btn-primary" data-bs-dismiss="modal">
                                <i class="bi bi-pencil me-1"></i>Stay and Continue Editing
                            </button>
                            <button type="button" class="btn btn-danger" id="confirmDiscard">
                                <i class="bi bi-trash me-1"></i>Discard Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        const existingModal = document.getElementById('discardChangesModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Add new modal to body
        document.body.insertAdjacentHTML('beforeend', confirmationHtml);
        
        // Show modal and bind events
        const modal = new bootstrap.Modal(document.getElementById('discardChangesModal'));
        modal.show();
        
        document.getElementById('confirmDiscard').addEventListener('click', () => {
            callback();
            modal.hide();
            // Clean up modal after it's hidden
            setTimeout(() => {
                document.getElementById('discardChangesModal')?.remove();
            }, 300);
        });
        
        // Clean up modal when cancelled
        document.getElementById('discardChangesModal').addEventListener('hidden.bs.modal', () => {
            setTimeout(() => {
                document.getElementById('discardChangesModal')?.remove();
            }, 300);
        });
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-stage-btn') || e.target.closest('.remove-stage-btn')) {
                const stageElement = e.target.closest('.stage-edit-item');
                this.showRemoveStageConfirmation(stageElement, () => {
                    stageElement.remove();
                    this.hasUnsavedChanges = true;
                    this.updateStageOrders(); 
                    this.updateProgressDisplay();
                });
            }
            
            if (e.target.classList.contains('remove-image-btn')) {
                e.target.closest('.position-relative').remove();
                this.hasUnsavedChanges = true;
            }
        });

            document.addEventListener('change', (e) => {
            if (e.target.classList.contains('select-status')) {
                this.handleStatusChange(e.target);
            }
        });
    }

    calculateProgressPercentage() {
    const stageItems = document.querySelectorAll('.stage-edit-item');
    
    if (stageItems.length === 0) {
        return 0;
    }
    
    let completedStages = 0;
    let totalStages = stageItems.length;
    
    stageItems.forEach(item => {
        const statusSelect = item.querySelector('.select-status');
        if (statusSelect && statusSelect.value === 'Completed') {
            completedStages++;
        }
    });
    
    // Calculate percentage and round to nearest whole number
    const percentage = Math.round((completedStages / totalStages) * 100);
    console.log(`Progress calculation: ${completedStages}/${totalStages} stages completed = ${percentage}%`);
    return this.calculateProgressPercentageFromDOM();
}
calculateProgressPercentageFromDOM() {
    const stageItems = document.querySelectorAll('#sortableStages .stage-edit-item');

    if (stageItems.length === 0) {
        console.log('No stage items found in DOM');
        return 0;
    }
    
    let completedStages = 0;
    let totalStages = stageItems.length;
    
    stageItems.forEach((item, index) => {
        const statusSelect = item.querySelector('.select-status');
        if (statusSelect) {
            const status = statusSelect.value;
            console.log(`Stage ${index + 1}: Status = "${status}"`);
            if (status === 'Completed') {
                completedStages++;
            }
        } else {
            console.warn(`Stage ${index + 1}: No status select found`);
        }
    });
    
    const percentage = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
    console.log(`DOM Progress calculation: ${completedStages}/${totalStages} stages completed = ${percentage}%`);
    return percentage;
}
}

const styleSheet = document.createElement('style');
styleSheet.textContent = `
    .remove-stage-btn:hover {
        background-color: #dc3545 !important;
        border-color: #dc3545 !important;
    }
    
    .remove-stage-btn:hover .bi-x-lg {
        color: white !important;
    }
    
    .stage-edit-item:hover .remove-stage-btn {
        box-shadow: 0 0 0 0.1rem rgba(220, 53, 69, 0.25);
    }
`;
document.head.appendChild(styleSheet);
const projectModalHandler = new ProjectModalHandler(); // Initialize the class
window.loadProjectDetails = (projectId) => projectModalHandler.loadProjectDetails(projectId); // Export functions for global access
window.loadProjectForUpdate = (projectId) => projectModalHandler.loadProjectForUpdate(projectId);
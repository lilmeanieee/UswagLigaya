class AddProjectModal {
    constructor() {
        this.selectedFiles = [];
        this.elements = {};
        this.init();
    }

    init() {
        this.bindElements();
        this.attachEventListeners();
        this.initializeDefaultStages();
        this.loadCategories();
        this.createErrorContainer();
    }
// Replace your bindElements method with this enhanced version

bindElements() {
    console.log('=== ELEMENT BINDING DEBUG ===');
    
    // Try different selectors for date inputs
    const dateInputs = document.querySelectorAll('#addProjectModal input[type="date"]');
    console.log('Found date inputs:', dateInputs.length);
    
    dateInputs.forEach((input, index) => {
        console.log(`Date input ${index}:`, input);
        console.log(`Date input ${index} value:`, input.value);
        console.log(`Date input ${index} name:`, input.name);
        console.log(`Date input ${index} id:`, input.id);
        console.log(`Date input ${index} parent label:`, input.closest('.mb-3')?.querySelector('label')?.textContent);
    });

    this.elements = {
        modal: document.getElementById('addProjectModal'),
        form: document.querySelector('#addProjectModal form'),
        projectNameInput: document.querySelector('#addProjectModal input[placeholder="Enter project name"]'),
        categorySelect: document.querySelector('#addProjectModal select'),
        descriptionInput: document.querySelector('#addProjectModal textarea'),
        locationInput: document.querySelector('#addProjectModal input[placeholder="Enter location of project"]'),
        
        // More specific selectors for date inputs
        startDateInput: dateInputs[0], // First date input should be start date
        completionDateInput: dateInputs[1], // Second date input should be completion date
        
        budgetInput: document.querySelector('#addProjectModal input[type="number"]'),
        fundingSourceInput: document.querySelector('#addProjectModal input[placeholder="Source of funding"]'),
        responsiblePersonInput: document.querySelector('#addProjectModal input[placeholder="Enter responsible person"]'),
        stagesContainer: document.getElementById('projectStagesContainerAdd'),
        newStageInput: document.getElementById('newStageInputAdd'),
        addStageBtn: document.getElementById('addStageBtnAdd'),
        dropArea: document.getElementById('drop-area-add'),
        fileInput: document.getElementById('fileInputAdd'),
        previewContainer: document.getElementById('imagePreviewContainerAdd'),
        createBtn: document.querySelector('#addProjectModal .btn-primary'),
        cancelBtn: document.querySelector('#addProjectModal .btn-secondary')
    };
    
    // Alternative binding method - by looking at the structure
    const startDateLabel = Array.from(document.querySelectorAll('#addProjectModal label')).find(label => 
        label.textContent.includes('Start Date'));
    const completionDateLabel = Array.from(document.querySelectorAll('#addProjectModal label')).find(label => 
        label.textContent.includes('Expected Completion'));
    
    if (startDateLabel) {
        const startDateInput = startDateLabel.parentElement.querySelector('input[type="date"]');
        if (startDateInput) {
            this.elements.startDateInput = startDateInput;
            console.log('Found start date input by label:', startDateInput);
        }
    }
    
    if (completionDateLabel) {
        const completionDateInput = completionDateLabel.parentElement.querySelector('input[type="date"]');
        if (completionDateInput) {
            this.elements.completionDateInput = completionDateInput;
            console.log('Found completion date input by label:', completionDateInput);
        }
    }
    
    // Debug: Check if critical elements are found
    console.log('Modal found:', !!this.elements.modal);
    console.log('Start date input found:', !!this.elements.startDateInput);
    console.log('End date input found:', !!this.elements.completionDateInput);
    console.log('Start date input element:', this.elements.startDateInput);
    console.log('End date input element:', this.elements.completionDateInput);
    
    // Verify they are different elements
    console.log('Are date inputs the same element?', this.elements.startDateInput === this.elements.completionDateInput);
    
    // Check current values
    if (this.elements.startDateInput && this.elements.completionDateInput) {
        console.log('Current start date value:', this.elements.startDateInput.value);
        console.log('Current completion date value:', this.elements.completionDateInput.value);
    }
}

    createErrorContainer() {
        // Create error container if it doesn't exist
        let errorContainer = document.getElementById('addProjectModalErrors');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.id = 'addProjectModalErrors';
            errorContainer.className = 'alert alert-danger d-none mb-3';
            errorContainer.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    <div>
                        <strong>Please fix the following errors:</strong>
                        <ul class="mb-0 mt-1" id="addProjectErrorList"></ul>
                    </div>
                </div>
            `;
            
            // Insert at the beginning of the modal body
            const modalBody = this.elements.modal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.insertBefore(errorContainer, modalBody.firstChild);
            }
        }
        
        this.elements.errorContainer = errorContainer;
        this.elements.errorList = document.getElementById('addProjectErrorList');
    }

    showErrors(errors) {
        if (!this.elements.errorContainer || !this.elements.errorList) {
            console.error('Error container not found');
            return;
        }

        // Clear previous errors
        this.elements.errorList.innerHTML = '';
        
        if (errors.length > 0) {
            // Add each error as a list item
            errors.forEach(error => {
                const li = document.createElement('li');
                li.textContent = error;
                this.elements.errorList.appendChild(li);
            });
            
            // Show the error container
            this.elements.errorContainer.classList.remove('d-none');
            
            // Scroll to top of modal to show errors
            const modalBody = this.elements.modal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.scrollTop = 0;
            }
        } else {
            // Hide error container if no errors
            this.elements.errorContainer.classList.add('d-none');
        }
    }

    hideErrors() {
        if (this.elements.errorContainer) {
            this.elements.errorContainer.classList.add('d-none');
        }
    }

    attachEventListeners() {
        // Stage management
        this.elements.addStageBtn.addEventListener('click', () => this.addNewStage());
        this.elements.newStageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addNewStage();
            }
        });

        // File upload events
        this.elements.dropArea.addEventListener('click', () => this.elements.fileInput.click());
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop events
        this.elements.dropArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.elements.dropArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.elements.dropArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Form submission
        this.elements.createBtn.addEventListener('click', () => this.handleSubmit());
        
        // Modal events
        this.elements.modal.addEventListener('hidden.bs.modal', () => this.resetForm());
        this.elements.cancelBtn.addEventListener('click', () => this.resetForm());
        
        // Hide errors when user starts typing/selecting
        this.addInputEventListeners();
    }

    addInputEventListeners() {
        // Add event listeners to form inputs to hide errors when user starts interacting
        const inputs = [
            this.elements.projectNameInput,
            this.elements.categorySelect,
            this.elements.descriptionInput,
            this.elements.locationInput,
            this.elements.startDateInput,
            this.elements.completionDateInput,
            this.elements.budgetInput,
            this.elements.fundingSourceInput,
            this.elements.responsiblePersonInput
        ];

        inputs.forEach(input => {
            if (input) {
                input.addEventListener('input', () => this.hideErrors());
                input.addEventListener('change', () => this.hideErrors());
            }
        });
    }

    initializeDefaultStages() {
        const defaultStages = [
            { name: 'Site Survey & Planning', checked: true },
            { name: 'Material Procurement', checked: true },
            { name: 'Final Inspection', checked: false }
        ];

        this.elements.stagesContainer.innerHTML = '';
        
        defaultStages.forEach(stage => {
            this.createStageElement(stage.name, stage.checked);
        });

        // Add the input group for new stages
        this.addStageInputGroup();
    }

    createStageElement(stageName, isChecked = false) {
        const stageDiv = document.createElement('div');
        stageDiv.className = 'stage-edit-item mb-3';
        stageDiv.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" ${isChecked ? 'checked' : ''}>
                <label class="form-check-label">${stageName}</label>
                <button type="button" class="btn btn-sm btn-outline-danger ms-2 remove-stage-btn" title="Remove stage">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;

        // Add remove functionality for custom stages
        const removeBtn = stageDiv.querySelector('.remove-stage-btn');
        removeBtn.addEventListener('click', () => {
            stageDiv.remove();
        });

        // Insert before the input group
        const inputGroup = this.elements.stagesContainer.querySelector('.input-group');
        this.elements.stagesContainer.insertBefore(stageDiv, inputGroup);
    }

    addStageInputGroup() {
        const inputGroupDiv = document.createElement('div');
        inputGroupDiv.className = 'input-group mt-3';
        inputGroupDiv.innerHTML = `
            <input type="text" id="newStageInputAdd" class="form-control" placeholder="Enter other project stage">
            <button type="button" class="btn btn-outline-primary" id="addStageBtnAdd">
                <i class="bi bi-plus me-1"></i>Add Stage
            </button>
        `;

        this.elements.stagesContainer.appendChild(inputGroupDiv);
        
        // Update references
        this.elements.newStageInput = document.getElementById('newStageInputAdd');
        this.elements.addStageBtn = document.getElementById('addStageBtnAdd');
        
        // Reattach event listeners
        this.elements.addStageBtn.addEventListener('click', () => this.addNewStage());
        this.elements.newStageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.addNewStage();
            }
        });
    }

    addNewStage() {
        const stageName = this.elements.newStageInput.value.trim();
        
        if (!stageName) {
            this.showErrors(['Please enter a stage name']);
            return;
        }

        // Check if stage already exists
        const existingStages = Array.from(this.elements.stagesContainer.querySelectorAll('.form-check-label'))
            .map(label => label.textContent.trim());
        
        if (existingStages.includes(stageName)) {
            this.showErrors(['This stage already exists']);
            return;
        }

        this.createStageElement(stageName, false);
        this.elements.newStageInput.value = '';
        this.elements.newStageInput.focus();
        this.hideErrors();
    }

    handleDragOver(e) {
        e.preventDefault();
        this.elements.dropArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.elements.dropArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.elements.dropArea.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
        // Reset input so same file can be selected again
        e.target.value = '';
    }

    processFiles(files) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/tiff'];
        const maxSize = 5 * 1024 * 1024; // 5MB
        const fileErrors = [];

        files.forEach(file => {
            if (!allowedTypes.includes(file.type)) {
                fileErrors.push(`Invalid file type: ${file.name}. Only JPEG, PNG, GIF, and TIFF are allowed.`);
                return;
            }

            if (file.size > maxSize) {
                fileErrors.push(`File too large: ${file.name}. Maximum size is 5MB.`);
                return;
            }

            // Add to selected files
            const fileIndex = this.selectedFiles.length;
            this.selectedFiles.push(file);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                this.createImagePreview(e.target.result, file.name, fileIndex);
            };
            reader.readAsDataURL(file);
        });

        // Show file errors if any
        if (fileErrors.length > 0) {
            this.showErrors(fileErrors);
        }
    }

    createImagePreview(src, fileName, fileIndex) {
        const { previewContainer } = this.elements;
        
        if (!previewContainer) {
            console.error('Preview container not found when creating preview');
            return;
        }
        
        const wrapper = document.createElement('div');
        wrapper.className = 'position-relative d-inline-block m-2';
        wrapper.setAttribute('data-file-index', fileIndex);
        wrapper.style.cssText = 'width: 120px; height: 120px;';
        
        const img = document.createElement('img');
        img.src = src;
        img.className = 'img-thumbnail';
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 8px;';
        img.title = fileName;
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '<i class="bi bi-x"></i>';
        removeBtn.className = 'btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle';
        removeBtn.style.cssText = 'width: 30px; height: 30px; font-size: 16px; line-height: 1; transform: translate(50%, -50%);';
        removeBtn.setAttribute('type', 'button');
        removeBtn.setAttribute('title', 'Remove image');
        
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const fileIndex = parseInt(wrapper.getAttribute('data-file-index'));
            this.selectedFiles.splice(fileIndex, 1);
            wrapper.remove();
            this.updateFileIndices();
            console.log(`Image removed. Remaining files: ${this.selectedFiles.length}`);
        });
        
        wrapper.appendChild(img);
        wrapper.appendChild(removeBtn);
        previewContainer.appendChild(wrapper);
        
        console.log('Add project modal image preview created for:', fileName);
    }

    updateFileIndices() {
        const previews = this.elements.previewContainer.querySelectorAll('[data-file-index]');
        previews.forEach((preview, index) => {
            preview.setAttribute('data-file-index', index);
        });
    }

  async loadCategories() {
    try {
        console.log('Attempting to load categories...');
        const response = await fetch('http://localhost/UswagLigaya/php-handlers/brgy-project-admin/get-categories.php');
        
        // Check if the response is ok
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Non-JSON response received:', text);
            throw new Error('Server returned non-JSON response');
        }
        
        const data = await response.json();
        console.log('Categories response:', data);
        
        if (data.success) {
            this.populateCategories(data.categories);
            console.log('Categories loaded successfully');
        } else {
            console.error('Failed to load categories:', data.message);
            // Show a user-friendly error
            this.showCategoryError(data.message || 'Failed to load categories');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        this.showCategoryError('Unable to load categories. Please check your connection and try again.');
    }
}

showCategoryError(message) {
    const select = this.elements.categorySelect;
    select.innerHTML = `<option value="">Error loading categories - ${message}</option>`;
}

    populateCategories(categories) {
        const select = this.elements.categorySelect;
        
        // Clear existing options except the first one
        select.innerHTML = '<option value="">Select category...</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.category_id;
            option.textContent = category.category_name;
            select.appendChild(option);
        });
    }

    getSelectedStages() {
        const stages = [];
        const stageElements = this.elements.stagesContainer.querySelectorAll('.stage-edit-item');
        
        stageElements.forEach(element => {
            const checkbox = element.querySelector('input[type="checkbox"]');
            const label = element.querySelector('label');
            
            if (checkbox && checkbox.checked && label) {
                stages.push(label.textContent.trim());
            }
        });
        
        return stages;
    }

// Replace your validateForm method with this enhanced debugging version

validateForm() {
    const errors = [];
    
    if (!this.elements.projectNameInput.value.trim()) {
        errors.push('Project name is required');
    }
    
    if (!this.elements.categorySelect.value) {
        errors.push('Category is required');
    }
    
    if (!this.elements.descriptionInput.value.trim()) {
        errors.push('Description is required');
    }
    
    if (!this.elements.locationInput.value.trim()) {
        errors.push('Location is required');
    }
    
    if (!this.elements.startDateInput.value) {
        errors.push('Start date is required');
    }
    
    if (!this.elements.completionDateInput.value) {
        errors.push('Expected completion date is required');
    }
    
    if (!this.elements.responsiblePersonInput.value.trim()) {
        errors.push('Responsible person is required');
    }
    
    // Enhanced date validation with detailed debugging
    if (this.elements.startDateInput.value && this.elements.completionDateInput.value) {
        console.log('=== ENHANCED DATE VALIDATION DEBUG ===');
        
        // Check the actual DOM elements
        console.log('Start date input element:', this.elements.startDateInput);
        console.log('Completion date input element:', this.elements.completionDateInput);
        
        // Get raw values
        const startDateRaw = this.elements.startDateInput.value;
        const endDateRaw = this.elements.completionDateInput.value;
        
        console.log('Raw start date value:', startDateRaw);
        console.log('Raw end date value:', endDateRaw);
        console.log('Raw values are equal?', startDateRaw === endDateRaw);
        
        // Check if we're getting the right elements
        console.log('Start date input ID:', this.elements.startDateInput.id);
        console.log('End date input ID:', this.elements.completionDateInput.id);
        
        // Let's manually query the date inputs to verify
        const allDateInputs = document.querySelectorAll('#addProjectModal input[type="date"]');
        console.log('All date inputs found:', allDateInputs);
        console.log('First date input value:', allDateInputs[0]?.value);
        console.log('Second date input value:', allDateInputs[1]?.value);
        
        // Create date objects
        const startDate = new Date(startDateRaw);
        const endDate = new Date(endDateRaw);
        
        console.log('Start date object:', startDate);
        console.log('End date object:', endDate);
        console.log('Start date ISO:', startDate.toISOString());
        console.log('End date ISO:', endDate.toISOString());
        
        // Check if dates are valid
        console.log('Start date valid?', !isNaN(startDate.getTime()));
        console.log('End date valid?', !isNaN(endDate.getTime()));
        
        // Compare dates
        console.log('Start date time:', startDate.getTime());
        console.log('End date time:', endDate.getTime());
        console.log('Time difference (ms):', endDate.getTime() - startDate.getTime());
        console.log('Time difference (days):', (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Validation logic
        if (endDate < startDate) {
            console.log('ERROR: Completion date is before start date');
            errors.push('Expected completion date cannot be before start date');
        } else {
            console.log('SUCCESS: Date validation passed');
        }
    }
    
    // Validate budget
    if (this.elements.budgetInput.value && (isNaN(this.elements.budgetInput.value) || parseFloat(this.elements.budgetInput.value) < 0)) {
        errors.push('Budget must be a valid positive number');
    }
    
    return errors;
}
    async handleSubmit() {
    const errors = this.validateForm();
    
    if (errors.length > 0) {
        this.showErrors(errors);
        return;
    }

    // Hide any existing errors
    this.hideErrors();

    // Disable submit button
    this.elements.createBtn.disabled = true;
    this.elements.createBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating...';

    try {
        const formData = new FormData();
        
        // Add form fields
        formData.append('project_name', this.elements.projectNameInput.value.trim());
        formData.append('category', this.elements.categorySelect.value);
        formData.append('description', this.elements.descriptionInput.value.trim());
        formData.append('location', this.elements.locationInput.value.trim());
        formData.append('start_date', this.elements.startDateInput.value);
        formData.append('expected_completion', this.elements.completionDateInput.value);
        formData.append('initial_budget', this.elements.budgetInput.value || '');
        formData.append('funding_source', this.elements.fundingSourceInput.value.trim());
        formData.append('responsible_person', this.elements.responsiblePersonInput.value.trim());
        
        // Add selected stages
        const selectedStages = this.getSelectedStages();
        selectedStages.forEach((stage, index) => {
            formData.append(`project_stages[${index}]`, stage);
        });
        
        // Add images
        this.selectedFiles.forEach((file, index) => {
            formData.append(`project_images[${index}]`, file);
        });

        // Fixed URL - removed the duplicated path segment
        const response = await fetch('http://localhost/UswagLigaya/php-handlers/brgy-project-admin/add-project.php', {
            method: 'POST',
            body: formData
        });

        // Check if response is ok before parsing JSON
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            // Create success message
            const successContainer = document.createElement('div');
            successContainer.className = 'alert alert-success mb-3';
            successContainer.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="bi bi-check-circle-fill me-2"></i>
                    <strong>Project created successfully!</strong>
                </div>
            `;
            
            // Show success message briefly
            const modalBody = this.elements.modal.querySelector('.modal-body');
            if (modalBody) {
                modalBody.insertBefore(successContainer, modalBody.firstChild);
                modalBody.scrollTop = 0;
            }
            
            // Wait a moment then close modal and refresh
            setTimeout(() => {
                this.resetForm();
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(this.elements.modal);
                if (modal) {
                    modal.hide();
                }
                
                // Refresh page or update project list
                if (typeof refreshProjectList === 'function') {
                    refreshProjectList();
                } else {
                    location.reload();
                }
            }, 1500);
        } else {
            this.showErrors([data.message || 'Error creating project']);
        }
    } catch (error) {
        console.error('Error submitting form:', error);
        
        // More specific error handling
        if (error.name === 'SyntaxError') {
            this.showErrors(['Server returned an invalid response. Please check if the server is running correctly.']);
        } else if (error.message.includes('HTTP error!')) {
            this.showErrors(['Server error occurred. Please try again or contact support.']);
        } else {
            this.showErrors(['An error occurred while creating the project. Please try again.']);
        }
    } finally {
        // Re-enable submit button
        this.elements.createBtn.disabled = false;
        this.elements.createBtn.innerHTML = 'Create Project';
    }
}

    resetForm() {
        // Reset all form fields
        this.elements.projectNameInput.value = '';
        this.elements.categorySelect.value = '';
        this.elements.descriptionInput.value = '';
        this.elements.locationInput.value = '';
        this.elements.startDateInput.value = '';
        this.elements.completionDateInput.value = '';
        this.elements.budgetInput.value = '';
        this.elements.fundingSourceInput.value = '';
        this.elements.responsiblePersonInput.value = '';
        
        // Reset stages
        this.initializeDefaultStages();
        
        // Clear selected files and previews
        this.selectedFiles = [];
        this.elements.previewContainer.innerHTML = '';
        this.elements.fileInput.value = '';
        
        // Reset button state
        this.elements.createBtn.disabled = false;
        this.elements.createBtn.innerHTML = 'Create Project';
        
        // Hide errors and remove any success messages
        this.hideErrors();
        const successMessages = this.elements.modal.querySelectorAll('.alert-success');
        successMessages.forEach(msg => msg.remove());
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new AddProjectModal();
});

// Add CSS for drag and drop styling and error display
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
    
    .upload-box.dragover {
        border-color: #0d6efd;
        background-color: #e3f2fd;
    }
    
    .remove-stage-btn {
        opacity: 0.6;
        transition: opacity 0.2s ease;
    }
    
    .stage-edit-item:hover .remove-stage-btn {
        opacity: 1;
    }
    
    .form-check {
        display: flex;
        align-items: center;
    }
    
    .form-check-label {
        flex: 1;
        margin-right: 8px;
    }
    
    #addProjectModalErrors {
        animation: slideDown 0.3s ease-out;
    }
    
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .alert-success {
        animation: slideDown 0.3s ease-out;
    }
`;
document.head.appendChild(style);
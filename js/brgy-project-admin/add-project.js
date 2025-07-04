// Add Project JavaScript
$(document).ready(function() {
    // Load categories on page load
    loadCategories();
    
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
    // Handle Add Project Button Click (not form submit)
    $('#addProjectModal .btn-primary').on('click', function(e) {
        e.preventDefault();
        
        // Get form data using the existing form structure
        const formData = {
            project_name: $('#addProjectModal input[placeholder="Enter project name"]').val().trim(),
            category: $('#addProjectModal select').first().val(), // Changed from category_id to category
            description: $('#addProjectModal textarea[placeholder="Project description..."]').val().trim(),
            start_date: $('#addProjectModal input[type="date"]').first().val(),
            expected_completion: $('#addProjectModal input[type="date"]').last().val(),
            initial_budget: $('#addProjectModal input[placeholder="0.00"]').val(),
            funding_source: $('#addProjectModal input[placeholder="Source of funding"]').val().trim(),
            responsible_person: $('#addProjectModal input[placeholder="Enter responsible person"]').val().trim()
        };
        
        console.log('Form data:', formData); // Debug log
        
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
            url: 'http://localhost/UswagLigaya/php-handlers/brgy-project-admin/add-project.php', // Absolute path from domain root
            method: 'POST',
            data: formData,
            dataType: 'json',
            success: function(response) {
                console.log('Success response:', response); // Debug log
                if (response.success) {
                    // Show success message
                    showAlert('success', 'Project created successfully!');
                    
                    // Reset form
                    $('#addProjectModal form')[0].reset();
                    
                    // Close modal
                    $('#addProjectModal').modal('hide');
                    
                    // Refresh project list (you can implement this based on your needs)
                    setTimeout(function() {
                        location.reload();
                    }, 1500);
                } else {
                    showAlert('error', response.message || 'Failed to create project. Please try again.');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', xhr.responseText); // Better error logging
                showAlert('error', 'An error occurred while creating the project. Please try again.');
            },
            complete: function() {
                // Reset button state
                submitBtn.prop('disabled', false).text(originalText);
            }
        });
    });
    
    // Form validation function
    function validateProjectForm(data) {
        const errors = [];
        
        if (!data.project_name) {
            errors.push('Project name is required.');
        }
        
        if (!data.category || data.category === 'Select category...') {
            errors.push('Category is required.');
        }
        
        if (!data.description) {
            errors.push('Description is required.');
        }
        
        if (!data.start_date) {
            errors.push('Start date is required.');
        }
        
        if (!data.expected_completion) {
            errors.push('Expected completion date is required.');
        }
        
        if (!data.responsible_person) {
            errors.push('Responsible person is required.');
        }
        
        // Validate date logic
        if (data.start_date && data.expected_completion) {
            const startDate = new Date(data.start_date);
            const endDate = new Date(data.expected_completion);
            
            if (startDate >= endDate) {
                errors.push('Expected completion date must be after start date.');
            }
        }
        
        // Validate budget if provided
        if (data.initial_budget && (isNaN(data.initial_budget) || parseFloat(data.initial_budget) < 0)) {
            errors.push('Initial budget must be a valid positive number.');
        }
        
        if (errors.length > 0) {
            showAlert('error', errors.join('<br>'));
            return false;
        }
        
        return true;
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
        $('.alert').remove();
        
        // Add new alert to modal body (better positioning)
        $('#addProjectModal .modal-body').prepend(alertHtml);
        
        // Auto-dismiss after 5 seconds
        setTimeout(function() {
            $('.alert').fadeOut();
        }, 5000);
    }
    
    // Reset form when modal is closed
    $('#addProjectModal').on('hidden.bs.modal', function() {
        $('#addProjectModal form')[0].reset();
        $('.alert').remove();
    });
});
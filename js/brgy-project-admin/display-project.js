// Fixed display-project.js - Modal backdrop and cleanup fixes

// Wait for both DOM and jQuery to be ready
function initializeProjectDisplay() {
    // Check if jQuery is available
    if (typeof $ === 'undefined') {
        console.error('jQuery is not loaded. Please include jQuery before this script.');
        return;
    }
    
    // Load projects when page loads
    loadProjects();
    
    // Initialize search and filter functionality
    initializeFilters();
    
    // Load categories for filter dropdown
    loadCategoriesForFilter();
    
    // Function to load projects from database
    function loadProjects(search = '', status = '', category = '') {
        $.ajax({
            url: '../../php-handlers/brgy-project-admin/get-projects.php',
            method: 'GET',
            data: {
                search: search,
                status: status,
                category: category
            },
            dataType: 'json',
            success: function(response) {
                console.log('Projects loaded:', response);
                if (response.success) {
                    displayProjects(response.projects);
                } else {
                    console.error('Failed to load projects:', response.message);
                    showAlert('error', response.message || 'Failed to load projects');
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', xhr.responseText);
                showAlert('error', 'Failed to load projects. Please try again.');
            }
        });
    }
    
    // Function to load categories for filter dropdown
    function loadCategoriesForFilter() {
        $.ajax({
            url: '../../php-handlers/brgy-project-admin/get-categories.php',
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    const categorySelect = $('select[aria-label="Filter by category"]');
                    if (categorySelect.length) {
                        categorySelect.empty();
                        categorySelect.append('<option value="">All Categories</option>');
                        
                        response.categories.forEach(function(category) {
                            categorySelect.append(
                                `<option value="${category.category_id}">${category.category_name}</option>`
                            );
                        });
                    }
                }
            },
            error: function() {
                console.log('Failed to load categories for filter');
            }
        });
    }
    
    // Function to display projects in the grid
    function displayProjects(projects) {
        // Try multiple selectors to find the projects container
        let projectsContainer = $('#projects-container .row').first();
        
        if (!projectsContainer.length) {
            projectsContainer = $('.projects-grid .row').first();
        }
        
        if (!projectsContainer.length) {
            projectsContainer = $('.container.mx-3 .row').first();
        }
        
        if (!projectsContainer.length) {
            projectsContainer = $('.main-content .row').first();
        }
        
        if (!projectsContainer.length) {
            projectsContainer = $('.row').first();
        }
        
        if (!projectsContainer.length) {
            console.error('No projects container found. Available elements:', $('.row').length);
            // Create a container if none exists
            if ($('.container').length) {
                $('.container').first().append('<div class="row" id="projects-container"></div>');
                projectsContainer = $('#projects-container');
            } else {
                console.error('No container found to display projects');
                return;
            }
        }
        
        console.log('Using projects container:', projectsContainer);
        
        // Clear existing project cards only (preserve other content like search bars)
        projectsContainer.find('.col-lg-6, .col-xl-4, .col-md-6, .col-sm-12').filter(':has(.project-card)').remove();
        projectsContainer.find('.no-projects-message').remove();
        
        if (projects.length === 0) {
            projectsContainer.append(`
                <div class="col-12 no-projects-message">
                    <div class="text-center py-5">
                        <i class="bi bi-folder-x display-1 text-muted"></i>
                        <h4 class="mt-3 text-muted">No projects found</h4>
                        <p class="text-muted">No projects match your current filters.</p>
                    </div>
                </div>
            `);
            return;
        }
        
        // Generate project cards
        projects.forEach(function(project) {
            const projectCard = createProjectCard(project);
            projectsContainer.append(projectCard);
        });
        
        console.log('Projects displayed:', projects.length);
    }
    
    // Function to create individual project card
    function createProjectCard(project) {
        const truncatedDescription = project.description && project.description.length > 120 ? 
            project.description.substring(0, 120) + '...' : 
            (project.description || 'No description available');
        
        const remainingText = project.remaining_days !== undefined ? 
            (project.remaining_days > 0 ? `${project.remaining_days} days` : 'Overdue') : 
            'N/A';
        
        const remainingClass = project.remaining_days !== undefined ? 
            (project.remaining_days > 0 ? 'text-warning' : 'text-danger') : 
            'text-muted';
        
        // Handle progress percentage
        const progressPercentage = project.progress_percentage || 0;
        
        // Handle budget formatting
        const formattedBudget = project.initial_budget ? 
            formatCurrency(project.initial_budget) : 
            'N/A';
        
        // Handle status
        const statusClass = getStatusClass(project.status);
        
        return `
            <div class="col-lg-6 col-xl-4 mb-4">
                <div class="card project-card border-0 shadow h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h5 class="card-title mb-0">${project.project_name || 'Untitled Project'}</h5>
                            <span class="status-badge  ${statusClass}">${project.status || 'Unknown'}</span>
                        </div>
                        <p class="card-text text-muted mb-3">${truncatedDescription}</p>

                        <div class="mb-3">
                            <div class="d-flex justify-content-between mb-1">
                                <small class="text-muted">Progress</small>
                                <small class="text-muted">${progressPercentage}%</small>
                            </div>
                            <div class="progress progress-indicator">
                                <div class="progress-bar bg-info" style="width: ${progressPercentage}%"></div>
                            </div>
                        </div>

                        <div class="row text-center mb-3">
                            <div class="col-6">
                                <div class="text-primary fw-bold">${formattedBudget}</div>
                                <small class="text-muted">Budget</small>
                            </div>
                            <div class="col-6">
                                <div class="${remainingClass} fw-bold">${remainingText}</div>
                                <small class="text-muted">Remaining</small>
                            </div>
                        </div>

                        <div class="d-flex gap-2">
                            <button class="btn btn-outline-primary btn-sm flex-fill view-project-btn" 
                                    data-project-id="${project.project_id}">
                                <i class="bi bi-eye me-1"></i>View
                            </button>
                            <button class="btn btn-primary btn-sm flex-fill update-project-btn" 
                                    data-project-id="${project.project_id}">
                                <i class="bi bi-pencil-square me-1"></i>Update
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Get status class for badge styling
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
    
    // Initialize search and filter functionality
    function initializeFilters() {
        // Search functionality with better selectors
        let searchInput = $('#nameSearch');
        if (!searchInput.length) {
            searchInput = $('input[placeholder*="Search"], input[type="search"]').first();
        }
        
        if (searchInput.length) {
            searchInput.on('input', function() {
                const searchTerm = $(this).val().trim();
                const status = $('select[aria-label="Filter by status"]').val() || '';
                const category = $('select[aria-label="Filter by category"]').val() || '';
                
                // Debounce search to avoid too many requests
                clearTimeout(window.searchTimeout);
                window.searchTimeout = setTimeout(function() {
                    loadProjects(searchTerm, status, category);
                }, 300);
            });
        }
        
        // Status filter
        const statusFilter = $('select[aria-label="Filter by status"]');
        if (statusFilter.length) {
            statusFilter.on('change', function() {
                const status = $(this).val();
                const search = searchInput.val() ? searchInput.val().trim() : '';
                const category = $('select[aria-label="Filter by category"]').val() || '';
                
                loadProjects(search, status, category);
            });
        }
        
        // Category filter
        const categoryFilter = $('select[aria-label="Filter by category"]');
        if (categoryFilter.length) {
            categoryFilter.on('change', function() {
                const category = $(this).val();
                const search = searchInput.val() ? searchInput.val().trim() : '';
                const status = $('select[aria-label="Filter by status"]').val() || '';
                
                loadProjects(search, status, category);
            });
        }
    }
    
    // FIXED: Proper modal cleanup and backdrop handling
    function cleanupModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            // Remove any existing modal instances
            const existingInstance = bootstrap.Modal.getInstance(modal);
            if (existingInstance) {
                existingInstance.dispose();
            }
            
            // Remove modal-related classes from body
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            
            // Remove any leftover backdrops
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
            
            // Reset modal state
            modal.classList.remove('show');
            modal.style.display = 'none';
            modal.removeAttribute('aria-modal');
            modal.removeAttribute('role');
            modal.setAttribute('aria-hidden', 'true');
        }
    }
    
    // FIXED: Better modal show function with proper cleanup
    function showModal(modalId, loadFunction, projectId) {
        // Clean up any existing modals first
        cleanupModal('projectDetailModal');
        cleanupModal('updateProjectModal');
        
        const modal = document.getElementById(modalId);
        if (!modal) {
            console.error(`Modal ${modalId} not found`);
            return;
        }
        
        // Load project data if function is available
        if (loadFunction && typeof window[loadFunction] === 'function') {
            window[loadFunction](projectId);
        } else {
            console.warn(`${loadFunction} function not available`);
        }
        
        // Show modal with proper error handling
        try {
            const bsModal = new bootstrap.Modal(modal, {
                backdrop: true,
                keyboard: true,
                focus: true
            });
            
            // Add event listeners for proper cleanup
            modal.addEventListener('hidden.bs.modal', function() {
                cleanupModal(modalId);
            }, { once: true });
            
            bsModal.show();
        } catch (error) {
            console.error('Error showing modal:', error);
            cleanupModal(modalId);
        }
    }
    
    // FIXED: Handle view project button clicks with proper modal handling
    $(document).on('click', '.view-project-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const projectId = $(this).data('project-id');
        console.log('View project:', projectId);
        
        showModal('projectDetailModal', 'loadProjectDetails', projectId);
    });

    // FIXED: Handle update project button clicks with proper modal handling
    $(document).on('click', '.update-project-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const projectId = $(this).data('project-id');
        console.log('Update project:', projectId);
        
        showModal('updateProjectModal', 'loadProjectForUpdate', projectId);
    });
    
    // FIXED: Add global cleanup when any modal is closed
    $(document).on('hidden.bs.modal', '.modal', function(e) {
        const modalId = $(this).attr('id');
        if (modalId) {
            cleanupModal(modalId);
        }
    });
    
    // FIXED: Emergency cleanup function in case of stuck modals
    window.emergencyModalCleanup = function() {
        // Remove all modal backdrops
        $('.modal-backdrop').remove();
        
        // Reset body styles
        $('body').removeClass('modal-open');
        $('body').css({
            'overflow': '',
            'padding-right': ''
        });
        
        // Hide all modals
        $('.modal').hide().removeClass('show');
        $('.modal').attr('aria-hidden', 'true');
        $('.modal').removeAttr('aria-modal role');
        
        // Dispose all modal instances
        $('.modal').each(function() {
            const instance = bootstrap.Modal.getInstance(this);
            if (instance) {
                instance.dispose();
            }
        });
        
        console.log('Emergency modal cleanup completed');
    };
    
    // Alert function
    function showAlert(type, message, container = null) {
        const alertClass = type === 'success' ? 'alert-success' : 'alert-danger';
        const alertIcon = type === 'success' ? 'bi-check-circle' : 'bi-exclamation-triangle';
        
        const alertHtml = `
            <div class="alert ${alertClass} alert-dismissible fade show" role="alert">
                <i class="bi ${alertIcon} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        // Find the target container
        let targetContainer;
        if (container) {
            targetContainer = $(container).first();
        } else {
            // Try different container selectors
            targetContainer = $('.main-content').first();
            if (!targetContainer.length) {
                targetContainer = $('.container.mx-3').first();
            }
            if (!targetContainer.length) {
                targetContainer = $('.container').first();
            }
            if (!targetContainer.length) {
                targetContainer = $('body');
            }
        }
        
        // Remove existing alerts from the specific container
        targetContainer.find('.alert').remove();
        
        // Add new alert at the top of the specified container
        targetContainer.prepend(alertHtml);
        
        // Auto-dismiss after 5 seconds
        setTimeout(function() {
            targetContainer.find('.alert').fadeOut();
        }, 5000);
    }
    
    // Utility function to format currency
    function formatCurrency(amount) {
        if (!amount || amount === 0) return 'N/A';
        return '₱' + Number(amount).toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    // Function to refresh projects (can be called from other parts of the application)
    window.refreshProjects = function() {
        const searchInput = $('#nameSearch').length ? $('#nameSearch') : $('input[placeholder*="Search"], input[type="search"]').first();
        const search = searchInput.length ? searchInput.val().trim() : '';
        const status = $('select[aria-label="Filter by status"]').val() || '';
        const category = $('select[aria-label="Filter by category"]').val() || '';
        
        loadProjects(search, status, category);
    };
    
    // Expose functions globally
    window.showAlert = showAlert;
    window.loadProjects = loadProjects;
    window.cleanupModal = cleanupModal;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for jQuery to load if it's loading asynchronously
    setTimeout(function() {
        initializeProjectDisplay();
    }, 100);
});

// Also try to initialize when jQuery is ready (if it loads later)
if (typeof $ !== 'undefined') {
    $(document).ready(function() {
        initializeProjectDisplay();
    });
} else {
    // Fallback: check periodically if jQuery becomes available
    let jqueryCheckInterval = setInterval(function() {
        if (typeof $ !== 'undefined') {
            clearInterval(jqueryCheckInterval);
            initializeProjectDisplay();
        }
    }, 100);
    
    // Stop checking after 10 seconds
    setTimeout(function() {
        clearInterval(jqueryCheckInterval);
    }, 10000);
}
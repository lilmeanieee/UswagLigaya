// Enhanced display-project.js - Improved search and filter functionalities

// Wait for both DOM and jQuery to be ready
function initializeProjectDisplay() {
    // Check if jQuery is available
    if (typeof $ === 'undefined') {
        console.error('jQuery is not loaded. Please include jQuery before this script.');
        return;
    }
    
    // Initialize modal handlers first
    initializeModalHandlers();
    
    // Load projects when page loads
    loadProjects();
    
    // Initialize search and filter functionality
    initializeFilters();
    
    // Load categories for filter dropdown
    loadCategoriesForFilter();
    
    // Function to load projects from database
    function loadProjects(search = '', status = '', category = '') {
        // Show loading indicator
        showLoadingIndicator(true);
        
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
                showLoadingIndicator(false);
                
                if (response.success) {
                    displayProjects(response.projects);
                    updateResultsCount(response.projects.length, search, status, category);
                } else {
                    console.error('Failed to load projects:', response.message);
                    showAlert('error', response.message || 'Failed to load projects');
                    displayProjects([]); // Show empty state
                }
            },
            error: function(xhr, status, error) {
                console.error('AJAX Error:', xhr.responseText);
                showLoadingIndicator(false);
                showAlert('error', 'Failed to load projects. Please try again.');
                displayProjects([]); // Show empty state
            }
        });
    }
    
    // Enhanced function to load categories for filter dropdown
    function loadCategoriesForFilter() {
        $.ajax({
            url: '../../php-handlers/brgy-project-admin/get-categories.php',
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success && response.categories) {
                    populateCategoryFilter(response.categories);
                } else {
                    console.warn('No categories returned or request failed');
                }
            },
            error: function(xhr, status, error) {
                console.error('Failed to load categories:', error);
                // Still populate with default option
                populateCategoryFilter([]);
            }
        });
    }
    
    // Helper function to populate category filter
    function populateCategoryFilter(categories) {
        const categorySelectors = [
            'select[aria-label="Filter by category"]',
            '#categoryFilter',
            '.category-filter',
            'select[name="category"]'
        ];
        
        let categorySelect = null;
        for (let selector of categorySelectors) {
            categorySelect = $(selector);
            if (categorySelect.length) break;
        }
        
        if (categorySelect && categorySelect.length) {
            const currentValue = categorySelect.val();
            categorySelect.empty();
            categorySelect.append('<option value="">All Categories</option>');
            
            categories.forEach(function(category) {
                const optionValue = category.category_id || category.id || category.value;
                const optionText = category.category_name || category.name || category.text || category;
                
                categorySelect.append(
                    `<option value="${optionValue}">${optionText}</option>`
                );
            });
            
            // Restore previous selection if it exists
            if (currentValue) {
                categorySelect.val(currentValue);
            }
            
            console.log('Category filter populated with', categories.length, 'categories');
        } else {
            console.warn('Category filter element not found. Tried selectors:', categorySelectors);
        }
    }
    
    // Function to display projects in the grid
    function displayProjects(projects) {
        // Try multiple selectors to find the projects container
        let projectsContainer = findProjectsContainer();
        
        if (!projectsContainer || !projectsContainer.length) {
            console.error('No projects container found');
            return;
        }
        
        console.log('Using projects container:', projectsContainer[0]);
        
        // Clear existing project cards only (preserve other content like search bars)
        clearExistingProjects(projectsContainer);
        
        if (projects.length === 0) {
            showEmptyState(projectsContainer);
            return;
        }
        
        // Generate project cards
        projects.forEach(function(project) {
            const projectCard = createProjectCard(project);
            projectsContainer.append(projectCard);
        });
        
        console.log('Projects displayed:', projects.length);
    }
    
    // Helper function to find projects container with multiple fallbacks
    function findProjectsContainer() {
        const containerSelectors = [
            '#projects-container .row',
            '.projects-grid .row',
            '.container.mx-3 .row',
            '.main-content .row',
            '.projects-container',
            '.row'
        ];
        
        for (let selector of containerSelectors) {
            const container = $(selector).first();
            if (container.length) {
                return container;
            }
        }
        
        // Create a container if none exists
        if ($('.container').length) {
            $('.container').first().append('<div class="row" id="projects-container"></div>');
            return $('#projects-container');
        }
        
        return null;
    }
    
    // Helper function to clear existing projects
    function clearExistingProjects(container) {
        container.find('.col-lg-6, .col-xl-4, .col-md-6, .col-sm-12, .col-12')
            .filter(':has(.project-card), .no-projects-message, .loading-indicator')
            .remove();
    }
    
    // Helper function to show empty state
    function showEmptyState(container) {
        container.append(`
            <div class="col-12 no-projects-message">
                <div class="text-center py-5">
                    <i class="bi bi-folder-x display-1 text-muted"></i>
                    <h4 class="mt-3 text-muted">No projects found</h4>
                    <p class="text-muted">No projects match your current filters. Try adjusting your search criteria.</p>
                    <button class="btn btn-outline-secondary mt-2" onclick="clearAllFilters()">
                        <i class="bi bi-x-circle me-1"></i>Clear Filters
                    </button>
                </div>
            </div>
        `);
    }
    
    // Function to show/hide loading indicator
    function showLoadingIndicator(show) {
        const container = findProjectsContainer();
        if (!container) return;
        
        if (show) {
            container.find('.loading-indicator').remove();
            container.prepend(`
                <div class="col-12 loading-indicator">
                    <div class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2 text-muted">Loading projects...</p>
                    </div>
                </div>
            `);
        } else {
            container.find('.loading-indicator').remove();
        }
    }
    
    // Function to update results count
    function updateResultsCount(count, search, status, category) {
        const resultsContainer = $('.results-info, .search-results-info, #results-count');
        
        let filtersText = [];
        if (search) filtersText.push(`search: "${search}"`);
        if (status) filtersText.push(`status: "${status}"`);
        if (category) {
            const categoryName = $(`select[aria-label="Filter by category"] option[value="${category}"]`).text();
            filtersText.push(`category: "${categoryName}"`);
        }
        
        const filtersInfo = filtersText.length > 0 ? ` (filtered by ${filtersText.join(', ')})` : '';
        const resultsText = `Showing ${count} project${count !== 1 ? 's' : ''}${filtersInfo}`;
        
        if (resultsContainer.length) {
            resultsContainer.html(`<small class="text-muted">${resultsText}</small>`);
        } else {
            // Create results info if it doesn't exist
            const container = findProjectsContainer();
            if (container) {
                container.before(`<div class="results-info mb-3"><small class="text-muted">${resultsText}</small></div>`);
            }
        }
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
                            <span class="status-badge ${statusClass}">${project.status || 'Unknown'}</span>
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
            case 'Not Started':
                return 'bg-secondary';
            case 'Ongoing':
                return 'bg-primary';
            case 'Delayed':
                return 'bg-warning';
            case 'On Hold':
                return 'bg-info';
            case 'Completed':
                return 'bg-success';
            case 'Cancelled':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    }
    
    // Enhanced search and filter functionality
    function initializeFilters() {
        // Search functionality with multiple selector attempts
        const searchSelectors = [
            '#nameSearch',
            '#projectSearch',
            'input[placeholder*="Search"]',
            'input[type="search"]',
            '.search-input',
            'input[name="search"]'
        ];
        
        let searchInput = null;
        for (let selector of searchSelectors) {
            searchInput = $(selector);
            if (searchInput.length) {
                console.log('Found search input with selector:', selector);
                break;
            }
        }
        
        if (searchInput && searchInput.length) {
            // Remove any existing event handlers to prevent duplicates
            searchInput.off('input keyup paste');
            
            searchInput.on('input keyup paste', function() {
                const searchTerm = $(this).val().trim();
                const status = getCurrentStatusFilter();
                const category = getCurrentCategoryFilter();
                
                console.log('Search triggered:', { searchTerm, status, category });
                
                // Debounce search to avoid too many requests
                clearTimeout(window.searchTimeout);
                window.searchTimeout = setTimeout(function() {
                    loadProjects(searchTerm, status, category);
                }, 300);
            });
            
            console.log('Search functionality initialized');
        } else {
            console.warn('Search input not found. Tried selectors:', searchSelectors);
        }
        
        // Status filter with multiple selector attempts
        const statusSelectors = [
            'select[aria-label="Filter by status"]',
            '#statusFilter',
            '.status-filter',
            'select[name="status"]'
        ];
        
        let statusFilter = null;
        for (let selector of statusSelectors) {
            statusFilter = $(selector);
            if (statusFilter.length) {
                console.log('Found status filter with selector:', selector);
                break;
            }
        }
        
        if (statusFilter && statusFilter.length) {
            statusFilter.off('change').on('change', function() {
                const status = $(this).val();
                const search = getCurrentSearchTerm();
                const category = getCurrentCategoryFilter();
                
                console.log('Status filter changed:', { status, search, category });
                loadProjects(search, status, category);
            });
            
            console.log('Status filter functionality initialized');
        } else {
            console.warn('Status filter not found. Tried selectors:', statusSelectors);
        }
        
        // Category filter with multiple selector attempts
        const categorySelectors = [
            'select[aria-label="Filter by category"]',
            '#categoryFilter',
            '.category-filter',
            'select[name="category"]'
        ];
        
        let categoryFilter = null;
        for (let selector of categorySelectors) {
            categoryFilter = $(selector);
            if (categoryFilter.length) {
                console.log('Found category filter with selector:', selector);
                break;
            }
        }
        
        if (categoryFilter && categoryFilter.length) {
            categoryFilter.off('change').on('change', function() {
                const category = $(this).val();
                const search = getCurrentSearchTerm();
                const status = getCurrentStatusFilter();
                
                console.log('Category filter changed:', { category, search, status });
                loadProjects(search, status, category);
            });
            
            console.log('Category filter functionality initialized');
        } else {
            console.warn('Category filter not found. Tried selectors:', categorySelectors);
        }
    }
    
    // Helper functions to get current filter values
    function getCurrentSearchTerm() {
        const searchInput = $('#nameSearch, #projectSearch, input[placeholder*="Search"], input[type="search"]').first();
        return searchInput.length ? searchInput.val().trim() : '';
    }
    
    function getCurrentStatusFilter() {
        const statusFilter = $('select[aria-label="Filter by status"], #statusFilter, .status-filter').first();
        return statusFilter.length ? statusFilter.val() || '' : '';
    }
    
    function getCurrentCategoryFilter() {
        const categoryFilter = $('select[aria-label="Filter by category"], #categoryFilter, .category-filter').first();
        return categoryFilter.length ? categoryFilter.val() || '' : '';
    }
    
    // Function to clear all filters
    window.clearAllFilters = function() {
        // Clear search
        const searchInput = $('#nameSearch, #projectSearch, input[placeholder*="Search"], input[type="search"]').first();
        if (searchInput.length) {
            searchInput.val('');
        }
        
        // Reset status filter
        const statusFilter = $('select[aria-label="Filter by status"], #statusFilter, .status-filter').first();
        if (statusFilter.length) {
            statusFilter.val('');
        }
        
        // Reset category filter
        const categoryFilter = $('select[aria-label="Filter by category"], #categoryFilter, .category-filter').first();
        if (categoryFilter.length) {
            categoryFilter.val('');
        }
        
        // Reload projects
        loadProjects();
        
        console.log('All filters cleared');
    };
    
    // Modal handling functions (existing code)
    function cleanupModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal || !document.body.contains(modal)) return;

        try {
            const instance = bootstrap.Modal.getInstance(modal);
            if (instance) {
                instance.dispose();
            }

            setTimeout(() => {
                modal.classList.remove('show', 'fade');
                modal.style.display = 'none';
                modal.removeAttribute('aria-modal');
                modal.removeAttribute('role');
                modal.setAttribute('aria-hidden', 'true');

                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';

                document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

                if (!modal.classList.contains('fade')) {
                    modal.classList.add('fade');
                }
            }, 300);
        } catch (error) {
            console.error('Error during modal cleanup:', error);
            forceModalCleanup(modalId);
        }
    }

    function forceModalCleanup(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.className = 'modal fade';
        modal.style.cssText = '';
        modal.setAttribute('aria-hidden', 'true');
        modal.removeAttribute('aria-modal');
        modal.removeAttribute('role');
        
        document.body.className = document.body.className.replace(/modal-open/g, '');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
    }

    function showModal(modalId, loadFunction, projectId) {
        setTimeout(() => {
            const modal = document.getElementById(modalId);
            if (!modal) {
                console.error(`Modal ${modalId} not found`);
                return;
            }
            
            if (!validateModalStructure(modal)) {
                console.error(`Modal ${modalId} has invalid structure`);
                return;
            }
            
            if (loadFunction && typeof window[loadFunction] === 'function') {
                try {
                    window[loadFunction](projectId);
                } catch (error) {
                    console.error(`Error loading project data: ${error}`);
                }
            }
            
            try {
                modal.classList.add('fade');
                modal.setAttribute('aria-hidden', 'true');
                
                const bsModal = new bootstrap.Modal(modal, {
                    backdrop: true,
                    keyboard: true,
                    focus: true
                });
                
                // Add cleanup listener
                const cleanupListener = () => {
                    cleanupModal(modalId);
                    modal.removeEventListener('hidden.bs.modal', cleanupListener);
                };
                
                modal.addEventListener('hidden.bs.modal', cleanupListener);
                
                // Show the modal
                bsModal.show();
                
            } catch (error) {
                console.error('Error showing modal:', error);
                forceModalCleanup(modalId);
            }
        }, 150);
    }

    function validateModalStructure(modal) {
        if (!modal) return false;
        
        const modalDialog = modal.querySelector('.modal-dialog');
        const modalContent = modal.querySelector('.modal-content');
        
        if (!modalDialog || !modalContent) {
            console.error('Modal missing required dialog or content elements');
            return false;
        }
        
        if (!modal.classList.contains('modal')) {
            modal.classList.add('modal');
        }
        
        if (!modal.classList.contains('fade')) {
            modal.classList.add('fade');
        }
        
        return true;
    }

    function initializeModalHandlers() {
        $(document).off('click', '.view-project-btn').on('click', '.view-project-btn', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const projectId = $(this).data('project-id');
            if (!projectId) {
                console.error('No project ID found');
                return;
            }
            
            console.log('View project:', projectId);
            showModal('projectDetailModal', 'loadProjectDetails', projectId);
        });

        $(document).off('click', '.update-project-btn').on('click', '.update-project-btn', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const projectId = $(this).data('project-id');
            if (!projectId) {
                console.error('No project ID found');
                return;
            }
            
            console.log('Update project:', projectId);
            showModal('updateProjectModal', 'loadProjectForUpdate', projectId);
        });
        
        $(document).off('hidden.bs.modal', '.modal').on('hidden.bs.modal', '.modal', function(e) {
            const modalId = $(this).attr('id');
            if (modalId) {
                setTimeout(() => cleanupModal(modalId), 100);
            }
        });
    }

    window.emergencyModalCleanup = function() {
        console.log('Running emergency modal cleanup...');
        
        try {
            $('.modal').each(function() {
                const instance = bootstrap.Modal.getInstance(this);
                if (instance) {
                    try {
                        instance.dispose();
                    } catch (e) {
                        console.warn('Error disposing modal instance:', e);
                    }
                }
            });
            
            $('.modal-backdrop').remove();
            $('.modal').removeClass('show').hide();
            $('.modal').attr('aria-hidden', 'true').removeAttr('aria-modal role');
            
            $('body').removeClass('modal-open');
            $('body').css({
                'overflow': '',
                'padding-right': '',
                'margin-right': ''
            });
            
            $('.modal').addClass('fade');
            
            console.log('Emergency modal cleanup completed');
            
        } catch (error) {
            console.error('Error during emergency cleanup:', error);
            
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            document.body.classList.remove('modal-open');
            document.body.style.cssText = '';
        }
    };

    window.addEventListener('resize', function() {
        const openModals = document.querySelectorAll('.modal.show');
        if (openModals.length > 0) {
            setTimeout(() => {
                const backdrops = document.querySelectorAll('.modal-backdrop');
                if (backdrops.length > 1) {
                    for (let i = 1; i < backdrops.length; i++) {
                        backdrops[i].remove();
                    }
                }
            }, 100);
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && e.ctrlKey && e.shiftKey) {
            window.emergencyModalCleanup();
        }
    });

    window.cleanupModal = cleanupModal;
    window.showModal = showModal;
    window.validateModalStructure = validateModalStructure;
    window.forceModalCleanup = forceModalCleanup;
    
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
        
        let targetContainer;
        if (container) {
            targetContainer = $(container).first();
        } else {
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
        
        targetContainer.find('.alert').remove();
        targetContainer.prepend(alertHtml);
        
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
    
    // Function to refresh projects
    window.refreshProjects = function() {
        const search = getCurrentSearchTerm();
        const status = getCurrentStatusFilter();
        const category = getCurrentCategoryFilter();
        
        loadProjects(search, status, category);
    };
    
    // Expose functions globally
    window.showAlert = showAlert;
    window.loadProjects = loadProjects;
    window.cleanupModal = cleanupModal;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
        initializeProjectDisplay();
    }, 100);
});

// Also try to initialize when jQuery is ready
if (typeof $ !== 'undefined') {
    $(document).ready(function() {
        initializeProjectDisplay();
    });
} else {
    let jqueryCheckInterval = setInterval(function() {
        if (typeof $ !== 'undefined') {
            clearInterval(jqueryCheckInterval);
            initializeProjectDisplay();
        }
    }, 100);
    
    setTimeout(function() {
        clearInterval(jqueryCheckInterval);
    }, 10000);
}

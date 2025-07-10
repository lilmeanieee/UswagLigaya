document.addEventListener("DOMContentLoaded", function () {
    fetch('/UswagLigaya/php-handlers/brgy-project-res/get-project.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderProjectCards(data.data);
                initializeProjectModal(data.data);
            } else {
                console.error("Failed to load projects:", data.message);
            }
        })
        .catch(error => console.error("AJAX error:", error));
});

function renderProjectCards(projectsData) {
    const container = document.getElementById('card-view');
    container.innerHTML = "";

    Object.values(projectsData).forEach(project => {
        const progress = parseInt(project.progress_percentage) || 0;
        const defaultImage = "asset/img/neighborhood-illustration.png";
        
        // Use the formatted image URL from PHP instead of constructing it here
        const imagePath = (project.images && project.images.length > 0)
            ? project.images[0].image_url
            : defaultImage;

        const statusBadgeClass = getStatusBadgeClass(project.status);
        const progressBarClass = getProgressBarClass(progress);

        const card = document.createElement("div");
        card.className = "col-md-4 mb-4";
        card.innerHTML = `
            <div class="card project-card">
                <img src="${imagePath}" class="card-img-top" alt="${project.project_name}" onerror="this.src='${defaultImage}'">
                <div class="card-body">
                    <h5 class="card-title">${project.project_name}</h5>
                    <p class="card-text">${project.description}</p>
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <span class="badge ${statusBadgeClass}">${project.status}</span>
                        <small class="text-muted">${formatDate(project.start_date)} - ${formatDate(project.expected_completion)}</small>
                    </div>
                    <div class="progress mb-3">
                        <div class="progress-bar ${progressBarClass}" role="progressbar" style="width: ${progress}%;" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">${progress}%</div>
                    </div>
                    <div class="d-flex justify-content-between">
                        <button class="btn btn-outline-primary view-details-btn" data-project-id="${project.project_id}">
                            View Details
                        </button>
                    </div>
                </div>
            </div>`;
        container.appendChild(card);
    });
}

// Updated section of the initializeProjectModal function
function initializeProjectModal(projectsData) {
    document.addEventListener("click", function (e) {
        if (e.target.classList.contains("view-details-btn")) {
            const projectId = e.target.getAttribute("data-project-id");
            const project = projectsData[projectId];

            if (!project) return;

            // Title, Description, Dates
            document.getElementById('details-title').innerText = project.project_name;
            document.getElementById('details-description').innerText = project.description;
            document.getElementById('details-start-date').innerText = formatDate(project.start_date);
            document.getElementById('details-end-date').innerText = formatDate(project.expected_completion);

            // Status and Progress
            const progress = parseInt(project.progress_percentage) || 0;
            const progressBar = document.getElementById('details-progress-bar');
            const progressText = document.getElementById('details-progress-text');
            progressBar.style.width = `${progress}%`;
            progressBar.className = `progress-bar ${getProgressBarClass(progress)}`;
            progressBar.innerText = `${progress}%`;
            progressText.innerText = `${progress}% Complete`;
            document.getElementById('details-status').innerText = project.status;

            // Timeline Section - Update individual elements with database information
            const locationElement = document.getElementById('details-location');
            const budgetElement = document.getElementById('details-budget');
            const fundingSourceElement = document.getElementById('details-funding-source');
            const responsiblePersonElement = document.getElementById('details-responsible-person');

            if (locationElement) {
                locationElement.innerText = project.location || 'Not specified';
            }

            if (budgetElement) {
                budgetElement.innerText = project.initial_budget ? 
                    '₱' + Number(project.initial_budget).toLocaleString() : 'Not specified';
            }

            if (fundingSourceElement) {
                fundingSourceElement.innerText = project.funding_source || 'Not specified';
            }

            if (responsiblePersonElement) {
                responsiblePersonElement.innerText = project.responsible_person || 'Not specified';
            }

            // Keep the existing timeline container logic for additional project information
            const timelineContainer = document.getElementById('details-timeline');
            if (timelineContainer) {
                timelineContainer.innerHTML = `
                    <div class="timeline-info">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="info-item mb-3">
                                    <strong>Category:</strong>
                                    <span class="ms-2">${project.category_name || 'Not specified'}</span>
                                </div>
                                <div class="info-item mb-3">
                                    <strong>Created:</strong>
                                    <span class="ms-2">${project.created_at_formatted || 'Not specified'}</span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="info-item mb-3">
                                    <strong>Remaining Days:</strong>
                                    <span class="ms-2">${formatRemainingDays(project.remaining_days)}</span>
                                </div>
                                <div class="info-item mb-3">
                                    <strong>Last Updated:</strong>
                                    <span class="ms-2">${project.updated_at ? formatDate(project.updated_at) : 'Not specified'}</span>
                                </div>
                            </div>
                        </div>
                    </div>`;
            }

            // Images - Use the formatted image URLs from PHP
            const carousel = document.getElementById('details-carousel-inner');
            const defaultImage = "asset/img/neighborhood-illustration.png";
            carousel.innerHTML = "";

            if (project.images && project.images.length > 0) {
                project.images.forEach((img, idx) => {
                    const imagePath = img.image_url;
                    carousel.innerHTML += `
                        <div class="carousel-item${idx === 0 ? ' active' : ''}">
                            <img src="${imagePath}" class="d-block w-100" alt="Project Image ${idx + 1}" onerror="this.src='${defaultImage}'">
                        </div>`;
                });
            } else {
                carousel.innerHTML = `
                    <div class="carousel-item active">
                        <img src="${defaultImage}" class="d-block w-100" alt="Default Image">
                    </div>`;
            }

            // Enhanced Project Stages
            const stageContainer = document.getElementById('details-notes');
            stageContainer.innerHTML = `<ul class="timeline">`;
            if (project.stages && project.stages.length > 0) {
                project.stages.forEach(stage => {
                    const startDate = formatStageDate(stage.start_date);
                    const endDate = formatStageDate(stage.end_date);
                    const dateRange = `${startDate} - ${endDate}`;
                    
                    stageContainer.innerHTML += `
                        <li class="timeline-item">
                            <div class="timeline-dot"></div>
                            <div class="timeline-content">
                                <h5 class="stage-title mb-2">${stage.stage_name}</h5>
                                <p class="timeline-date mb-1">${dateRange}</p>
                                <p class="stage-status mb-0"><em>Status: ${stage.status}</em></p>
                            </div>
                        </li>`;
                });
            } else {
                stageContainer.innerHTML += `
                    <li class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <h5 class="stage-title mb-2">No stages defined</h5>
                            <p class="timeline-date mb-1">To Be Announced</p>
                        </div>
                    </li>`;
            }
            stageContainer.innerHTML += `</ul>`;

            // Show modal
            new bootstrap.Modal(document.getElementById('projectDetailsModal')).show();
        }
    });

    // Rename "Progress Notes" to "Project Stages"
    const stageHeader = document.querySelector('#details-notes').previousElementSibling;
    if (stageHeader) stageHeader.textContent = "Project Stages";
}

// Helper function to format remaining days
function formatRemainingDays(remainingDays) {
    if (remainingDays === null || remainingDays === undefined) {
        return 'Not specified';
    }
    
    if (remainingDays < 0) {
        return `${Math.abs(remainingDays)} days overdue`;
    } else if (remainingDays === 0) {
        return 'Due today';
    } else {
        return `${remainingDays} days remaining`;
    }
}

function getStatusBadgeClass(status) {
    switch (status.toLowerCase()) {
        case 'not started':
            return 'badge bg-secondary'; // Gray
        case 'ongoing':
            return 'badge bg-info'; // Blue
        case 'delayed':
            return 'badge bg-warning'; // Yellow/Orange
        case 'on hold':
            return 'badge bg-dark'; // Dark gray/black
        case 'completed':
            return 'badge bg-success'; // Green
        case 'cancelled':
            return 'badge bg-danger'; // Red
        default:
            return 'badge bg-secondary'; // Fallback style
    }
}


function getProgressBarClass(progress) {
    if (progress === 100) return 'bg-success';
    if (progress >= 75) return 'progress-75-100';
    if (progress >= 50) return 'progress-50-75';
    if (progress >= 25) return 'progress-25-50';
    if (progress > 0) return 'progress-0-25';
    return 'bg-secondary';
}

function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function formatStageDate(dateStr) {
    if (!dateStr || dateStr === '0000-00-00' || dateStr === '0000-00-00 00:00:00') {
        return "To Be Announced";
    }
    
    const date = new Date(dateStr);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return "To Be Announced";
    }
    
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}
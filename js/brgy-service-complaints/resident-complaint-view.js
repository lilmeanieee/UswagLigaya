// This script handles fetching and displaying a user's complaints in a table,
// as well as displaying detailed information in a modal, including image previews.

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const tableBody = document.querySelector('.document-section .table tbody');
    const statusModal = document.getElementById('statusModal');
    const attachmentList = document.getElementById('attachmentList');

    // Function to fetch and display complaints in the main table
    async function fetchComplaints() {
        try {
            // Using a relative path to the PHP handler
            const response = await fetch('../php-handlers/complaints-and-feedback/fetch-complaints.php');
            
            if (!response.ok) {
                // Throw an error if the response is not successful
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const complaints = await response.json();
            
            // Clear the existing table rows to prevent duplicates on reload
            tableBody.innerHTML = '';

            if (complaints.length > 0) {
                // Populate the table with fetched complaints
                complaints.forEach(complaint => {
                    const statusBadgeClass = getStatusBadgeClass(complaint.current_status);
                    const formattedComplaintId = `REQ-ID ${String(complaint.complaint_id).padStart(6, '0')}`;
                    
                    const row = `
                        <tr data-bs-toggle="modal" data-bs-target="#statusModal" data-complaint-id="${complaint.complaint_id}" style="cursor: pointer;">
                            <td>${formattedComplaintId}</td>
                            <td>${complaint.category}</td>
                            <td>${complaint.subject}</td>
                            <td><span class="badge ${statusBadgeClass}">${complaint.current_status}</span></td>
                            <td>${formatDate(complaint.submission_timestamp)}</td>
                        </tr>
                    `;
                    tableBody.insertAdjacentHTML('beforeend', row);
                });
            } else {
                // Display a message if no complaints are found
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No complaints submitted yet.</td></tr>';
            }
        } catch (error) {
            console.error('Error fetching complaints:', error);
            // Show an error message to the user
            tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Failed to load complaints. Please try again.</td></tr>`;
        }
    }

    // Function to fetch the full details of a single complaint for the modal
    async function fetchComplaintDetails(complaintId) {
        // Clear previous data while loading new content
        clearModalContent();
        
        try {
            // Fetch complaint details from the server
            const response = await fetch(`../php-handlers/complaints-and-feedback/fetch-single-complaint.php?complaint_id=${complaintId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const complaint = await response.json();
            
            // Populate modal with fetched data
            document.getElementById('complaintStatusBadge').textContent = complaint.current_status;
            document.getElementById('complaintStatusBadge').className = `badge rounded-pill ms-2 ${getStatusBadgeClass(complaint.current_status)}`;
            document.getElementById('submissionType').textContent = complaint.category;
            document.getElementById('submissionDate').textContent = formatDate(complaint.submission_timestamp);
            document.getElementById('complaintSubject').textContent = complaint.subject;
            document.getElementById('complaintDescription').textContent = complaint.description;

            // Display a success message or placeholder for now
            const timelineElement = document.getElementById('complaintTimeline');
            timelineElement.innerHTML = `
                <div class="timeline-item">
                    <p>
                        <span class="fw-bold">${formatDate(complaint.submission_timestamp)}</span><br>
                        <span class="ms-3">Complaint Submitted</span>
                    </p>
                </div>
            `;
            // Add a placeholder for admin response to simulate the process
            if (complaint.current_status !== 'Pending') {
                timelineElement.innerHTML += `
                    <div class="timeline-item">
                        <p>
                            <span class="fw-bold">${formatDate(complaint.submission_timestamp)}</span><br>
                            <span class="ms-3">Complaint ${complaint.current_status} by Admin</span>
                        </p>
                    </div>
                `;
            }

            // Call the new function to handle and display attachments
            if (complaint.attachments && complaint.attachments.length > 0) {
                displayAttachments(complaint.attachments);
            } else {
                attachmentList.innerHTML = '<p class="text-muted fst-italic">No attachments for this complaint.</p>';
            }

        } catch (error) {
            console.error('Error fetching complaint details:', error);
            const errorMessage = 'Error loading details.';
            document.getElementById('complaintStatusBadge').textContent = 'Error';
            document.getElementById('submissionType').textContent = errorMessage;
            document.getElementById('submissionDate').textContent = errorMessage;
            document.getElementById('complaintSubject').textContent = errorMessage;
            document.getElementById('complaintDescription').textContent = errorMessage;
            document.getElementById('complaintTimeline').innerHTML = `<p class="text-danger">${errorMessage}</p>`;
        }
    }

    // New function to handle and display attachments with image previews
    function displayAttachments(attachments) {
        attachmentList.innerHTML = ''; // Clear previous attachments
        attachments.forEach(attachment => {
            const fileExtension = attachment.fileName.split('.').pop().toLowerCase();
            const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
            
            if (isImage) {
                // Display a clickable image thumbnail
                const imgElement = `
                    <a href="../php-handlers/complaints-and-feedback/get-attachment.php?attachment_id=${attachment.id}" target="_blank" class="d-inline-block me-2 mb-2">
                        <img src="../php-handlers/complaints-and-feedback/get-attachment.php?attachment_id=${attachment.id}" class="img-thumbnail" style="max-width: 100px; max-height: 100px; object-fit: cover;" alt="Attachment Preview">
                    </a>
                `;
                attachmentList.insertAdjacentHTML('beforeend', imgElement);
            } else {
                // Display a clickable link for other file types
                const fileElement = `
                    <div class="d-flex align-items-center mb-2">
                        <i class="fas fa-file-alt me-2 text-muted"></i>
                        <a href="../php-handlers/complaints-and-feedback/get-attachment.php?attachment_id=${attachment.id}" target="_blank">${attachment.fileName}</a>
                    </div>
                `;
                attachmentList.insertAdjacentHTML('beforeend', fileElement);
            }
        });
    }

    // Helper function to clear modal content while a new complaint loads
    function clearModalContent() {
        const modalElements = ['submissionType', 'submissionDate', 'complaintSubject', 'complaintDescription'];
        modalElements.forEach(id => document.getElementById(id).textContent = '');
        document.getElementById('complaintStatusBadge').textContent = 'Loading...';
        document.getElementById('complaintStatusBadge').className = 'badge rounded-pill ms-2 bg-secondary';
        document.getElementById('complaintTimeline').innerHTML = '<p class="text-center text-muted">Loading timeline...</p>';
        attachmentList.innerHTML = '<p class="text-center text-muted">Loading attachments...</p>';
    }

    // Helper function to get the correct Bootstrap badge class for the status
    function getStatusBadgeClass(status) {
        switch (status) {
            case 'Pending':
                return 'bg-warning';
            case 'Approved':
            case 'Completed':
                return 'bg-success';
            case 'Rejected':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    }

    // Helper function to format the date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }
    
    // Add an event listener to populate the modal with data when it is shown
    statusModal.addEventListener('show.bs.modal', function(event) {
        const button = event.relatedTarget;
        const complaintId = button.getAttribute('data-complaint-id');
        
        // Fetch the full details and populate the modal
        fetchComplaintDetails(complaintId);
    });

    // Initial call to fetch complaints when the page loads
    fetchComplaints();
});

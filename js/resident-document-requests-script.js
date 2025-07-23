// Function to fetch and display document requests
async function fetchAndDisplayDocumentRequests() {
    const tableBody = document.querySelector('.table tbody');

    if (!tableBody) {
        console.error('Table body not found');
        return;
    }

    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Loading document requests...</td></tr>';

    try {
        console.log('Fetching document requests...');
        const response = await fetch('../../php-handlers/fetch-resident-document-requests.php'); 
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();
        console.log('Raw response:', responseText);
        
        // Check if the response starts with HTML (error page)
        if (responseText.trim().startsWith('<')) {
            console.error('Received HTML instead of JSON:', responseText);
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Server error occurred. Please check the console for details.</td></tr>`;
            return;
        }

        let data;
        try {
            data = JSON.parse(responseText);
            console.log('Parsed data:', data);
        } catch (parseError) {
            console.error('JSON parsing error:', parseError);
            console.error('Response text:', responseText);
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Invalid response format from server.</td></tr>`;
            return;
        }

        if (data.error) {
            // Show debug info if available (for development)
            if (data.debug) {
                console.error("Server debug info:", data.debug);
            }
            
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">${escapeHtml(data.error)}</td></tr>`;
            console.error("Server error:", data.error);
            return;
        }

        // Handle both regular and debug response formats
        const actualData = data.data || data;
        console.log('Actual data to display:', actualData);
        
        tableBody.innerHTML = '';

        if (!actualData || actualData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No document requests found. <a href="request-document.html" class="text-decoration-none">Create your first request</a></td></tr>';
            return;
        }

        actualData.forEach((request, index) => {
            console.log(`Processing request ${index}:`, request);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(request.request_id)}</td>
                <td>${escapeHtml(request.document_type)}</td>
                <td>${escapeHtml(request.request_date)}</td>
                <td><span class="badge ${escapeHtml(request.status_badge_class)}">${escapeHtml(request.status)}</span></td>
            `;
            tableBody.appendChild(row);
        });

        console.log('Successfully displayed', actualData.length, 'document requests');

    } catch (error) {
        console.error('Error fetching document requests:', error);
        console.error('Error stack:', error.stack);
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Failed to load document requests. Please try again later.</td></tr>`;
    }
}

// Helper function to escape HTML to prevent XSS
function escapeHtml(text) {
    if (typeof text !== 'string') {
        console.warn('escapeHtml received non-string value:', text, 'Type:', typeof text);
        return '';
    }
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, fetching document requests...');
    fetchAndDisplayDocumentRequests();
});
// Debug version with enhanced error handling and response inspection
document.addEventListener('DOMContentLoaded', () => {
    const complaintForm = document.getElementById('complaintForm');
    const complainantNameField = document.getElementById('complainantName');
    const residentIdField = document.getElementById('residentId');
    const submitComplaintModal = document.getElementById('submitComplaintModal');

    // Function to fetch the user's name and pre-fill the input field
    const fetchUserName = async () => {
        try {
            console.log('Fetching user name...');

            // Try multiple possible paths for the get-user-name.php file
            const possiblePaths = [
                '../php-handlers/complaints-and-feedback/get-user-name.php',
                './php-handlers/complaints-and-feedback/get-user-name.php',
                'php-handlers/complaints-and-feedback/get-user-name.php'
            ];

            let response = null;
            let workingPath = null;

            for (const path of possiblePaths) {
                try {
                    response = await fetch(path);
                    if (response.ok) {
                        workingPath = path;
                        break;
                    }
                } catch (pathError) {
                    console.log(`Path ${path} failed:`, pathError.message);
                    continue;
                }
            }

            if (!response || !response.ok) {
                throw new Error(`All paths failed. Last status: ${response ? response.status : 'No response'}`);
            }

            console.log(`Successfully connected using path: ${workingPath}`);
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            // Get the raw response text first for debugging
            const responseText = await response.text();
            console.log('Raw response:', responseText);

            // Check if response is empty
            if (!responseText.trim()) {
                throw new Error('Server returned empty response');
            }

            // Try to parse JSON
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('JSON Parse Error:', jsonError);
                console.error('Response was not valid JSON:', responseText);
                throw new Error(`Server returned invalid JSON. Response: ${responseText.substring(0, 200)}...`);
            }

            console.log('Parsed JSON response:', result);

            if (result.status === 'success' && result.name && result.residentId) {
                complainantNameField.value = result.name;
                residentIdField.value = result.residentId;
                console.log('User info loaded successfully');
            } else if (result.status === 'error') {
                console.warn('Server returned error:', result.message);
                complainantNameField.value = 'Please log in';
                residentIdField.value = '';
                alert(`Login issue: ${result.message}`);
            } else {
                console.error('Invalid response format:', result);
                complainantNameField.value = 'Error loading name';
                residentIdField.value = '';
                alert('Invalid server response format');
            }
        } catch (error) {
            console.error('Error fetching user name:', error);
            complainantNameField.value = 'Error loading name';
            residentIdField.value = '';

            // Show user-friendly error
            alert(`Failed to load user information: ${error.message}`);
        }
    };

    // Listen for the modal to be shown to trigger the name fetch
    submitComplaintModal.addEventListener('show.bs.modal', fetchUserName);

    // Form validation function
    const validateForm = () => {
        const required = ['residentId', 'incidentDate', 'incidentLocation', 'complaintCategory', 'complaintSubject', 'complaintDescription'];
        const missing = [];

        for (const field of required) {
            const element = document.getElementById(field);
            // Check if the element exists and if its value is not empty
            if (!element || !element.value || element.value.trim() === '') {
                missing.push(field);
            }
        }

        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }

        if (!document.getElementById('residentId').value || document.getElementById('residentId').value === '0') {
            throw new Error('Please make sure you are logged in properly');
        }

        return true;
    };

    // Add an event listener for the form submission
    complaintForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        try {
            // Validate form data by checking the elements directly
            validateForm();

            // Create a FormData object from the form AFTER validation
            const formData = new FormData(complaintForm);

            // Log form data for debugging
            console.log('Form data being sent:');
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(key, `File: ${value.name} (${value.size} bytes)`);
                } else {
                    console.log(key, value);
                }
            }

            // Show loading state
            const submitButton = complaintForm.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            submitButton.textContent = 'Submitting...';
            submitButton.disabled = true;

            // Try multiple possible paths for the submit-complaint.php file
            const possiblePaths = [
                '../php-handlers/complaints-and-feedback/submit-complaint.php',
                './php-handlers/complaints-and-feedback/submit-complaint.php',
                'php-handlers/complaints-and-feedback/submit-complaint.php'
            ];

            let response = null;
            let workingPath = null;

            for (const path of possiblePaths) {
                try {
                    response = await fetch(path, {
                        method: 'POST',
                        body: formData,
                    });

                    if (response.ok || response.status === 400 || response.status === 500) {
                        // Even error responses are valid if they return JSON
                        workingPath = path;
                        break;
                    }
                } catch (pathError) {
                    console.log(`Path ${path} failed:`, pathError.message);
                    continue;
                }
            }

            if (!response) {
                throw new Error('Could not connect to server. Please check your file paths.');
            }

            console.log('Response status:', response.status);
            console.log(`Successfully connected using path: ${workingPath}`);

            // Get raw response text for debugging
            const responseText = await response.text();
            console.log('Raw response from submit:', responseText);

            // Parse JSON
            let result;
            try {
                result = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('JSON Parse Error on submit:', jsonError);
                throw new Error(`Server returned invalid JSON: ${responseText.substring(0, 200)}...`);
            }

            console.log('Server response:', result);

            // Reset button state
            submitButton.textContent = originalText;
            submitButton.disabled = false;

            if (result.status === 'success') {
                // Success
                alert(result.message || 'Complaint submitted successfully!');
                complaintForm.reset();

                // Reset hidden fields
                residentIdField.value = '';
                complainantNameField.value = '[User\'s Name]';

                // Hide modal using Bootstrap 5 syntax
                const modalInstance = bootstrap.Modal.getInstance(submitComplaintModal);
                if (modalInstance) {
                    modalInstance.hide();
                }

                // Optionally reload the complaints table
                if (typeof loadUserComplaints === 'function') {
                    loadUserComplaints();
                }

            } else {
                // Server returned an error
                throw new Error(result.message || 'Unknown server error occurred');
            }

        } catch (error) {
            console.error('Submission error:', error);

            // Reset button state
            const submitButton = complaintForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.textContent = 'Submit';
                submitButton.disabled = false;
            }

            // Show user-friendly error
            alert(`Error: ${error.message}`);
        }
    });

    // Optional: Add real-time validation
    const requiredFields = complaintForm.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', () => {
            if (field.value.trim() === '') {
                field.classList.add('is-invalid');
            } else {
                field.classList.remove('is-invalid');
                field.classList.add('is-valid');
            }
        });
    });
});
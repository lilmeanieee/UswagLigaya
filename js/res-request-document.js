document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("documentRequestForm");
    const dropdown = document.getElementById("documentType");
    const customFieldsContainer = document.getElementById("customFieldsContainer");
    const templatesMap = {};

    const purposeSelect = document.getElementById("purposeSelect");
    const fileInput = document.getElementById("fileInput");
    const supportingDocsContainer = document.getElementById("supportingDocsContainer");

    // Function to format labels (from custom_field to Custom Field)
    function formatLabel(label) {
        return label
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Handles the requirement for supporting documents based on purpose
    purposeSelect.addEventListener("change", () => {
        if (purposeSelect.value === "Family Member" || purposeSelect.value === "Neighbor") {
            fileInput.setAttribute("required", "true");
            supportingDocsContainer.querySelector('label span').style.display = 'inline';
        } else {
            fileInput.removeAttribute("required");
            supportingDocsContainer.querySelector('label span').style.display = 'none';
        }
    });

    // Fetch Resident ID
    fetch("../../php-handlers/get-resident-name.php")
        .then(res => res.json())
        .then(data => {
            if (data.residentId) {
                localStorage.setItem('residentId', data.residentId);
            } else {
                console.error("Failed to load resident ID:", data.error);
            }
        })
        .catch(err => {
            console.error("Error fetching resident ID:", err);
        });

    // Load Document Templates into Dropdown
    fetch("../../php-handlers/get-templates.php")
        .then(res => res.json())
        .then(templates => {
            dropdown.innerHTML = '<option value="" disabled selected>Choose a document type</option>';
            templates.forEach(template => {
                templatesMap[template.id] = template;
                const option = document.createElement("option");
                option.value = template.id; // VALUE: template ID
                option.textContent = template.name; // TEXT: template name
                dropdown.appendChild(option);
            });
        })
        .catch(err => {
            console.error("Error loading templates:", err);
        });

    // Show/Hide custom fields based on selected document and generate them
    dropdown.addEventListener("change", (e) => {
        const selected = templatesMap[e.target.value];
        customFieldsContainer.innerHTML = ''; // Clear previous fields

        if (selected && selected.customFields && selected.customFields.length > 0) {
            customFieldsContainer.style.display = "block";
            selected.customFields.forEach(field => {
                const isRequired = field.is_required ? 'required' : '';
                const fieldLabel = formatLabel(field.field_key); // Use the formatLabel function here
                const fieldHTML = `
                    <div class="mb-3 custom-field" data-key="${field.field_key}">
                        <label class="form-label">${fieldLabel}</label>
                        <input type="text" class="form-control" name="custom-field-${field.field_key}" ${isRequired}>
                    </div>
                `;
                customFieldsContainer.innerHTML += fieldHTML;
            });
        } else {
            customFieldsContainer.style.display = "none";
        }s
    });

    // Handle Form Submission
    form.addEventListener("submit", function (e) {
        e.preventDefault();

        const formData = new FormData(form);
        const residentId = localStorage.getItem('residentId') || '';
        formData.append("residentId", residentId);

        // Collect dynamic custom fields into JSON
        const customFields = {};
        customFieldsContainer.querySelectorAll('.custom-field input').forEach(input => {
            const key = input.closest('.custom-field').dataset.key;
            if (key) customFields[key] = input.value;
        });

        formData.append("custom_fields", JSON.stringify(customFields));

        // Get reCAPTCHA response
        const recaptchaResponse = grecaptcha.getResponse();
        if (!recaptchaResponse) {
            alert("Please complete the reCAPTCHA to submit your request.");
            return;
        }
        formData.append("g-recaptcha-response", recaptchaResponse);

        fetch("../../php-handlers/submit-document-request.php ", {
                method: "POST",
                body: formData
            })
            .then(async res => {
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    if (json.success) {
                        alert("Document request submitted successfully!");
                        setTimeout(() => {
                            window.location.href = "document-request.html";
                        }, 1000);
                    } else {
                        alert("Error: " + json.error);
                        grecaptcha.reset(); // Reset reCAPTCHA on error
                    }
                } catch {
                    console.error("Response was not valid JSON:\\n", text);
                    alert("Invalid response received.");
                    grecaptcha.reset(); // Reset reCAPTCHA on error
                }
            })
            .catch(err => {
                console.error("Submission error:", err);
                alert("Failed to submit request. Please try again.");
                grecaptcha.reset(); // Reset reCAPTCHA on error
            });
    });
});
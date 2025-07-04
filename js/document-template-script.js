// scripts.js

let documentTypes = [];

window.openEditModal = function (docId) {
    console.log("Opening modal for doc ID:", docId);

    const doc = documentTypes.find(d => parseInt(d.id) === parseInt(docId));
    console.log("Document found:", doc);
    console.log("Trying to find doc with ID:", docId);
    console.log("Current documentTypes array:", documentTypes);

    if (!doc) {
        console.warn("No document found with ID:", docId);
        return;
    }

    document.getElementById('editDocumentId').value = doc.id;
    document.getElementById('editDocumentName').value = doc.name;
    document.getElementById('editDocumentDescription').value = doc.description;
    document.getElementById('editDocumentFee').value = doc.fee;
    document.getElementById('editDocumentTemplate').textContent = doc.file_name || "No file uploaded.";support

    const customFieldsContainer = document.getElementById('editAdditionalFields');
    customFieldsContainer.innerHTML = '';

    const defaultFields = ['Full Name', 'Address', 'Birthdate'];
    const customFields = (doc.customFields || []).filter(field => !defaultFields.includes(field.label));

    customFields.forEach(field => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'custom-field';
        fieldDiv.innerHTML = `
            <input type="text" class="form-control me-2" placeholder="Field Name" value="${field.label}" required>
            <div class="form-check form-switch me-2">
                <input class="form-check-input" type="checkbox" role="switch" ${field.is_required ? 'checked' : ''}>
                <label class="form-check-label">Required</label>
            </div>
            <button type="button" class="btn btn-outline-danger btn-sm remove-field">
                <i class="bi bi-x"></i>
            </button>
        `;
        customFieldsContainer.appendChild(fieldDiv);

        // Add remove button functionality
        fieldDiv.querySelector('.remove-field').addEventListener('click', function () {
            customFieldsContainer.removeChild(fieldDiv);
        });
    });

    const modalEl = document.getElementById('editDocumentModal');
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
};


document.addEventListener('DOMContentLoaded', function () {
    //I removed the documentTypes array to the global scope to avoid re-declaring it in the fetch function

    // Sample document types data (this would typically come from a database)
    function fetchDocumentTemplates() {
        fetch('/UswagLigaya/php-handlers/get-templates.php')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    documentTypes = data.filter(template => !template.is_archived).map(d => ({ ...d, id: parseInt(d.id) }));;
                    populateTable();
                } else {
                    showAlert('danger', 'Failed to load templates from server.');
                    console.error("Server response error:", data);
                }
            })
            .catch(err => {
                console.error('Fetch error:', err);
                showAlert('danger', 'Failed to fetch templates.');
            });
    }


    // Initialize the table
    fetchDocumentTemplates();

    // Add Document Type Event Listeners
    document.getElementById('addFieldBtn').addEventListener('click', addCustomField);
    document.getElementById('saveDocumentBtn').addEventListener('click', saveDocumentType);

    // Edit Document Type Event Listeners
    document.getElementById('editAddFieldBtn').addEventListener('click', function () {
        addCustomField('edit');
    });

    document.getElementById('updateDocumentBtn').addEventListener('click', updateDocumentType);


    // Delete Document Type Event Listeners
    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteDocumentType);

    // Populate the table with document types
    function populateTable() {
        const tableBody = document.querySelector('#documentTypesTable tbody');
        tableBody.innerHTML = '';

        //04/19/2024 debugging start
        console.log("Document types now:", documentTypes);
        //04/19/2024 debugging end

        documentTypes.forEach(doc => {
            const row = document.createElement('tr');

            // Create required fields badges
            const fieldBadges = (doc.customFields || []).map(field => {
                return `<span class="badge me-1 ${field.is_required ? 'bg-primary' : 'bg-secondary'}">
                            ${field.label} <small>(${field.is_required ? 'Required' : 'Optional'})</small>
                        </span>`;
            }).join('');

            row.innerHTML = `
                <td><strong>${doc.name}</strong></td>
                <td>${doc.description}</td>
                <td>${doc.fee === 0 ? '<span class="text-success">Free</span>' : '₱' + doc.fee.toFixed(2)}</td>
                <td>${fieldBadges}</td>
                <td>
                    <div class="action-icons">
                        <button class="btn btn-sm btn-outline-primary edit-btn" data-id="${doc.id}">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${doc.id}">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const docId = parseInt(this.dataset.id);
                console.log("Edit clicked for ID:", docId); // <--- Add this                
                //04/19/2024 debugging
                console.log("openEditModal is:", typeof openEditModal);
                const doc = documentTypes.find(d => d.id === docId);
                openEditModal(docId);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const docId = parseInt(this.dataset.id);
                console.log("Delete clicked for:", docId);
                openDeleteModal(docId);
            });
        });
    }

    // Add a custom field to the form
    function addCustomField(mode = 'add') {
        const container = mode === 'edit' ? document.getElementById('editAdditionalFields') : document.getElementById('additionalFields');
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'custom-field';

        fieldDiv.innerHTML = `
            <input type="text" class="form-control me-2" placeholder="Field Name" required>
            <div class="form-check form-switch me-2">
                <input class="form-check-input" type="checkbox" role="switch" checked>
                <label class="form-check-label">Required</label>
            </div>
            <button type="button" class="btn btn-outline-danger btn-sm remove-field">
                <i class="bi bi-x"></i>
            </button>
        `;

        container.appendChild(fieldDiv);

        // Add event listener to remove button
        fieldDiv.querySelector('.remove-field').addEventListener('click', function () {
            container.removeChild(fieldDiv);
        });
    }

    // Save new document type
    function saveDocumentType() {
        const name = document.getElementById('documentName').value.trim();
        const description = document.getElementById('documentDescription').value.trim();
        const fee = parseFloat(document.getElementById('documentFee').value);
        const fileInput = document.getElementById('addTemplateFile');
    
        if (!name) {
            alert('Document name is required');
            return;
        }
            
                // Build custom fields array
            const customFields = [];
            document.querySelectorAll('#editAdditionalFields .custom-field').forEach(field => {
            const labelInput = field.querySelector('input[type="text"]');
            const requiredSwitch = field.querySelector('input[type="checkbox"]');
            const label = labelInput.value.trim();

            if (label) {
                const field_key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                customFields.push({
                    field_key: field_key,
                    label: label,
                    is_required: requiredSwitch.checked
                });
            }
        });

    
        // Prepare FormData
        const formData = new FormData();
        formData.append("name", name);
        formData.append("description", description);
        formData.append("fee", fee);
        formData.append("fields", JSON.stringify(customFields));
        if (fileInput.files[0]) {
            formData.append("template_file", fileInput.files[0]);
        }
    
        fetch('/UswagLigaya/php-handlers/add-template.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(response => {
            if (response.success) {
                showAlert('success', `Document type "${name}" has been saved successfully.`);
                const modal = bootstrap.Modal.getInstance(document.getElementById('addDocumentModal'));
                modal.hide();
                document.getElementById('addDocumentForm').reset();
                document.getElementById('additionalFields').innerHTML = '';
                fetchDocumentTemplates(); // Refresh table
            } else {
                showAlert('danger', response.error || 'Something went wrong.');
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            showAlert('danger', 'Failed to communicate with the server.');
        });
    }




    // Update document type
    function updateDocumentType() {
        const id = parseInt(document.getElementById('editDocumentId').value);
        const name = document.getElementById('editDocumentName').value.trim();
        const description = document.getElementById('editDocumentDescription').value.trim();
        const fee = parseFloat(document.getElementById('editDocumentFee').value);
        const template = document.getElementById('editDocumentTemplate').value.trim();

        if (!name) {
            alert('Document name is required');
            return;
        }

        // Build updated fields array
        const updatedFields = [];
        document.querySelectorAll('#editAdditionalFields .custom-field').forEach(field => {
            const labelInput = field.querySelector('input[type="text"]');
            const requiredSwitch = field.querySelector('input[type="checkbox"]');
            const label = labelInput.value.trim();

            if (label) {
                const field_key = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                updatedFields.push({
                    field_key: field_key,
                    label: label,
                    is_required: requiredSwitch.checked
                });
            }
        });

        const payload = {
            id,
            name,
            description,
            fee,
            template_text: template,
            fields: updatedFields
        };
         

    fetch('/UswagLigaya/php-handlers/add-template.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          .then(res => res.text()) // <- get raw response first
          .then(text => {
            console.log("Raw response from PHP:", text);
            const json = JSON.parse(text); // manually parse
            if (json.success) {
              showAlert('success', 'Updated successfully!');
              fetchDocumentTemplates();
              bootstrap.Modal.getInstance(document.getElementById('editDocumentModal')).hide();
            } else {
              showAlert('danger', json.error || 'Something went wrong.');
            }
          })
          .catch(err => {
            console.error("Update error:", err);
            showAlert('danger', 'Failed to update template.');
          });
     }     


    // Open delete confirmation modal
    function openDeleteModal(docId) {
        const doc = documentTypes.find(d => d.id === docId);
        if (!doc) return;

        // Set document name in modal

        console.log("Opening delete modal for:", doc.name);
        console.log("Modal element found:", document.getElementById('deleteConfirmModal'));

        document.getElementById('deleteDocumentName').textContent = doc.name;

        // Store document ID for deletion
        document.getElementById('confirmDeleteBtn').dataset.id = docId;

        // Show modal

        const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
        modal.show();
    }

    // Delete document type
    function deleteDocumentType() {
        const docId = parseInt(this.dataset.id);
        const docIndex = documentTypes.findIndex(d => d.id === docId);

        if (docIndex === -1) return;

        // Store name for success message
        const docName = documentTypes[docIndex].name;

        // Remove document from array
        documentTypes.splice(docIndex, 1);

        // Refresh table
        populateTable();

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
        modal.hide();

        // Show success message
        showAlert('danger', `Document type "${docName}" has been deleted.`);
        const doc = documentTypes.find(d => d.id === docId);
        if (!doc) return;
    
        // Send archive request
        fetch('/UswagLigaya/php-handlers/update-template.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: docId, is_archived: true })
        })
        .then(res => res.json())
        .then(response => {
            if (response.success) {
                showAlert('danger', `Document type "${doc.name}" has been archived.`);
                fetchDocumentTemplates(); // ✅ Refresh table
                bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal')).hide();
            } else {
                showAlert('danger', response.error || 'Failed to archive document.');
            }
        })
        .catch(error => {
            console.error('Archive error:', error);
            showAlert('danger', 'Failed to contact server.');
        });
    }

    // Show alert message
    function showAlert(type, message) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.setAttribute('role', 'alert');

        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        // Insert at the top of the container
        const container = document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }, 3000);
    }
});

///resets add modal
document.querySelector('#addDocumentModal .btn-secondary').addEventListener('click', function () {
    const form = document.getElementById('addDocumentForm');
    form.reset(); // Reset all form fields

    // Hide and clear preview
    const preview = document.getElementById('filePreview');
    const viewer = document.getElementById('fileViewer');

    if (preview) {
        preview.classList.add('d-none');
    }

    if (viewer) {
        viewer.innerHTML = '<em>No preview available.</em>';
    }

    // Optional: clear file input manually if needed
    document.getElementById('addTemplateFile').value = '';
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("documentRequestForm");
  const dropdown = document.getElementById("documentType");
  const customFieldsContainer = document.getElementById("customFieldsContainer");
  const templatesMap = {};

  const purposeSelect = document.getElementById("purposeSelect");
  const otherPurposeContainer = document.getElementById("otherPurposeContainer");
  const otherPurposeText = document.getElementById("otherPurposeText");

  // New element: Reference to the entire custom fields section
  const customFieldsSection = document.getElementById("customFieldsSection");

  // Function to format labels (from custom_fields to Custom Fields)
  function formatLabel(label) {
    return label
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  purposeSelect.addEventListener("change", () => {
    if (purposeSelect.value === "Other") {
      otherPurposeContainer.style.display = "block";
      otherPurposeText.setAttribute("required", "true");
    } else {
      otherPurposeContainer.style.display = "none";
      otherPurposeText.removeAttribute("required");
      otherPurposeText.value = "";
    }
  });

  // Fetch Resident ID (assuming full name input is removed, residentId still needed)
  // This block assumes get-resident-name.php now returns residentId or you have another way to get it
  fetch("../../php-handlers/get-resident-name.php") // You might rename this handler to get-resident-info.php if it only returns ID now
    .then(res => res.json())
    .then(data => {
      // Check if residentId exists, as fullNameInput is removed
      if (data.residentId) {
        localStorage.setItem('residentId', data.residentId); // Save for form submission
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
        option.value = template.id; // VALUE: template ID (important for backend)
        option.textContent = template.name; // TEXT: template name (display to user)
        dropdown.appendChild(option);
      });
    })
    .catch(err => {
      console.error("Error loading templates:", err);
    });

  // Generate Custom Fields When Template is Selected
  dropdown.addEventListener("change", (e) => {
    const selected = templatesMap[e.target.value];
    customFieldsContainer.innerHTML = ""; // Clear previous custom fields

    // Show/Hide the entire custom fields section based on selection
    if (selected && selected.customFields && selected.customFields.length > 0) {
      customFieldsSection.style.display = "block"; // Show if there are custom fields
    } else {
      customFieldsSection.style.display = "none"; // Hide if no custom fields or no selection
    }

    selected?.customFields?.forEach(field => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("mb-3", "custom-field");

      const label = document.createElement("label");
      label.classList.add("form-label");
      label.textContent = formatLabel(field.label); // Apply formatting here
      if (field.is_required) label.textContent += " *";

      const input = document.createElement("input");
      input.type = "text";
      input.classList.add("form-control");
      input.dataset.key = field.field_key;
      if (field.is_required) input.required = true;

      wrapper.appendChild(label);
      wrapper.appendChild(input);

      customFieldsContainer.appendChild(wrapper);
    });
  });

  // Handle Form Submission
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(form);

    let finalPurpose = "";
    if (purposeSelect.value === "Other") {
      finalPurpose = otherPurposeText.value.trim();
    } else {
      finalPurpose = purposeSelect.value;
    }
    formData.append("purpose", finalPurpose);

    // Collect custom fields into JSON
    const customFields = {};
    document.querySelectorAll('.custom-field input').forEach(input => {
      const key = input.dataset.key;
      if (key) customFields[key] = input.value;
    });
    formData.append("custom_fields", JSON.stringify(customFields));

    // Attach residentId into FormData
    const residentId = localStorage.getItem('residentId') || '';
    formData.append("residentId", residentId);

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
              window.location.href = "/UswagLigaya/residents/document-request/document-request.html";
            }, 1000);
          } else {
            alert("Error: " + json.error);
          }
        } catch {
          console.error("Response was not valid JSON:\n", text);
          alert("Invalid response received.");
        }
      })
      .catch(err => {
        console.error("Submission error:", err);
        alert("Failed to submit request. Please try again.");
      });
  });
});
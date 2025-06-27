document.addEventListener('DOMContentLoaded', () => {
  const templateSelect = document.getElementById("certificateType");
  const templateContent = document.getElementById("certificate-content");
  let templates = [];

  // Fetch templates from backend
  fetch('/UswagLigaya/php-handlers/get-templates.php')
    .then(res => res.json())
    .then(data => {
      templates = data;

      // Populate the dropdown
      templates.forEach(t => {
        const option = document.createElement("option");
        option.value = t.id;
        option.textContent = t.name;
        templateSelect.appendChild(option);
      });

      // Load first template by default
      if (templates.length > 0) {
        templateSelect.value = templates[0].id;
        loadCertificate(templates[0].template, templates[0].name);
      }
    })      
    .catch(err => {
      console.error("Failed to load templates:", err);
    });

  // Load certificate when selection changes
  templateSelect.addEventListener('change', () => {
    const selected = parseInt(templateSelect.value);
    const selectedTemplate = templates.find(t => t.id === selected);
    if (selectedTemplate) {
      loadCertificate(selectedTemplate.template, selectedTemplate.name);
    }
  });
  

  // Inject template into editable content area
  function loadCertificate(html, title = "") {
  templateContent.innerHTML = `
    <h3 class="text-center mb-4">${title}</h3>
    ${html}
  `;
}

  
});

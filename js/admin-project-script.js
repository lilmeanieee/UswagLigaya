// for adding image upload functionality with drag-and-drop support
// adding image preview function
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('imagePreviewContainer');

dropArea.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('dragover');
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (event) {
                const wrapper = document.createElement('div');
                wrapper.classList.add('preview-image-wrapper');

                const img = document.createElement('img');
                img.src = event.target.result;

                const removeBtn = document.createElement('button');
                removeBtn.textContent = '✕';
                removeBtn.classList.add('remove-btn');
                removeBtn.onclick = () => wrapper.remove();

                wrapper.appendChild(img);
                wrapper.appendChild(removeBtn);
                previewContainer.appendChild(wrapper);
            };
            reader.readAsDataURL(file);
        }
    });
}
// view proj details
// making uploded image to preview/show large image in modal
document.querySelectorAll('.preview-thumb').forEach(img => {
    img.addEventListener('click', () => {
        document.getElementById('largePreviewImage').src = img.getAttribute('data-img-src');
    });
});
// Close modal when clicking outside the image
// This ensures that clicking on the modal background closes the modal
document.addEventListener('DOMContentLoaded', function () {
    const modal = document.getElementById('imagePreviewModal');
    const image = document.getElementById('largePreviewImage');

    modal.addEventListener('click', function (e) {
        // If the click target is NOT the image or its children, close modal
        if (!image.contains(e.target)) {
            const bsModal = bootstrap.Modal.getInstance(modal);
            bsModal.hide();
        }
    });
});

// for project stages adding new stage dynamically

// Enable drag-and-drop
Sortable.create(document.getElementById("sortableStages"), {
    animation: 150,
    handle: ".stage-edit-item ", // makes it easier to drag by label
    ghostClass: "sortable-ghost"
});

// Updating Proj Modal: Add new stage dynamically 
document.getElementById("addStageBtnUpdate").addEventListener("click", function () {
    const input = document.getElementById("newStageInputUpdate");
    const stageName = input.value.trim();
    if (stageName === "") return;

    const html = `
        <div class="stage-edit-item mb-3 d-flex align-items-center justify-content-between bg-light p-2 rounded">
            <div class="d-flex align-items-center gap-3">
                <span class="fw-semibold stage-label">${stageName}</span>
            </div>
            <div class="d-flex align-items-center gap-2">
                <select class="form-select select-status w-auto" style="min-width: 150px;">
                    <option selected>Not Started</option>
                    <option>In Progress</option>
                    <option>Completed</option>
                </select>
                <button type="button" class="btn-close btn-sm remove-stage-btn" aria-label="Remove"></button>
            </div>
        </div>
    `;

    document.getElementById("sortableStages").insertAdjacentHTML("beforeend", html);
    input.value = "";
});


// Adding Proj MOdal: Add new stage dynamically 
document.getElementById("addStageBtnAdd").addEventListener("click", function () {
    const input = document.getElementById("newStageInputAdd");
    const stageName = input.value.trim();

    if (stageName !== "") {
        const container = document.getElementById("projectStagesContainerAdd");

        const stageItem = document.createElement("div");
        stageItem.className = "stage-edit-item mb-3 d-flex justify-content-between align-items-center";

        stageItem.innerHTML = `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" checked>
                <label class="form-check-label">${stageName}</label>
            </div>
            <button type="button" class="btn-close btn-sm remove-stage-btn" aria-label="Remove"></button>
        `;

        container.insertBefore(stageItem, container.lastElementChild); // Insert before input group
        input.value = ""; // Clear input
    }
});

// Remove stage functionality for both Add and Update Modals
document.addEventListener("click", function (e) {
    if (e.target.classList.contains("remove-stage-btn")) {
        const stageItem = e.target.closest(".stage-edit-item");
        if (stageItem) stageItem.remove();
    }
});

// For dynamically changing the color of select options based on their value
document.addEventListener("DOMContentLoaded", function () {
        const selects = document.querySelectorAll('.select-status');

        function updateSelectColor(select) {
            select.classList.remove('not-started', 'in-progress', 'completed');
            switch (select.value) {
                case "Not Started":
                    select.classList.add('not-started');
                    break;
                case "In Progress":
                    select.classList.add('in-progress');
                    break;
                case "Completed":
                    select.classList.add('completed');
                    break;
            }
        }

        selects.forEach(select => {
            updateSelectColor(select);
            select.addEventListener('change', () => updateSelectColor(select));
        });
    });

    document.querySelectorAll('.select-status').forEach(select => {
    select.addEventListener('change', function () {
        const container = this.closest('.d-flex.align-items-center');
        const dateSpan = container.querySelector('.completion-date');
        const dateText = container.querySelector('.date-text');

        if (this.value === 'Completed') {
            const now = new Date();
            const formattedDate = now.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            dateText.textContent = formattedDate;
            dateSpan.classList.remove('d-none');
        } else {
            dateText.textContent = '';
            dateSpan.classList.add('d-none');
        }
    });
});

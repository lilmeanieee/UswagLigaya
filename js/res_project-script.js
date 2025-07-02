const projects = {
    1: {
        title: "Road Repair - Main Street",
        description: "Fixing potholes and resurfacing the main street from the barangay hall to the elementary school.",
        startDate: "Mar 15, 2025",
        endDate: "May 30, 2025",
        status: "In Progress",
        progress: 35,
        progressBarClass: "bg-info",
        images: [
            "asset/img/neighborhood-illustration.png",
            "asset/img/neighborhood-illustration.png"
        ],
        notes: [
            { date: "Mar 15, 2025", text: "Pothole assessment and initial cleaning." },
            { date: "Apr 5, 2025", text: "50% of road resurfacing completed." }
        ]
    },
    2: {
        title: "Community Garden Expansion",
        description: "Expanding the community garden by adding 20 more plots and improving the irrigation system.",
        startDate: "Feb 10, 2025",
        endDate: "Apr 15, 2025",
        status: "Completed",
        progress: 100,
        progressBarClass: "bg-success",
        images: [
            "asset/img/neighborhood-illustration.png",
            "asset/img/neighborhood-illustration.png"
        ],
        notes: [
            { date: "Feb 10, 2025", text: "Land cleared and soil prepared for new plots." },
            { date: "Mar 1, 2025", text: "Installed new irrigation system and planted first crops." },
            { date: "Apr 10, 2025", text: "All plots are now ready and assigned to community members." }
        ]
    },
    3: {
        title: "Barangay Hall Renovation",
        description: "Renovating the barangay hall including roof repairs, repainting, and upgrading the meeting room.",
        startDate: "Apr 1, 2025",
        endDate: "Jun 30, 2025",
        status: "Not Started",
        progress: 0,
        progressBarClass: "bg-secondary",
        images: [
            "asset/img/neighborhood-illustration.png"
        ],
        notes: []
    },
    4: {
        title: "Drainage System Improvement",
        description: "Upgrading the drainage system in flood-prone areas to prevent flooding during rainy season.",
        startDate: "Jan 20, 2025",
        endDate: "Mar 10, 2025",
        status: "On Hold",
        progress: 60,
        progressBarClass: "bg-warning",
        images: [
           "asset/img/neighborhood-illustration.png"
        ],
        notes: [
            { date: "Jan 22, 2025", text: "Initial excavation completed in Zone A." },
            { date: "Feb 15, 2025", text: "Pipes laid out in Zone B, work paused due to weather." }
        ]
    }
};

document.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const projectId = btn.getAttribute('data-project-id');
        const data = projects[projectId];

        document.getElementById('details-title').innerText = data.title;
        document.getElementById('details-description').innerText = data.description;
        document.getElementById('details-start-date').innerText = data.startDate;
        document.getElementById('details-end-date').innerText = data.endDate;
        document.getElementById('details-status').innerText = data.status;
        document.getElementById('details-progress-bar').style.width = data.progress + '%';
        document.getElementById('details-progress-bar').innerText = data.progress + '%';
        document.getElementById('details-progress-bar').className = `progress-bar ${data.progressBarClass}`;
        document.getElementById('details-progress-text').innerText = data.progress + '% Complete';

        // Load carousel images
        const carouselInner = document.getElementById('details-carousel-inner');
        carouselInner.innerHTML = "";
        data.images.forEach((img, idx) => {
            const div = document.createElement('div');
            div.className = `carousel-item${idx === 0 ? ' active' : ''}`;
            div.innerHTML = `<img src="${img}" class="d-block w-100" alt="Project Image ${idx + 1}">`;
            carouselInner.appendChild(div);
        });

        // Load notes
        const notesContainer = document.getElementById('details-notes');
        notesContainer.innerHTML = `<ul class="timeline">` +
            data.notes.map(note => `
                    <li class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <span class="timeline-date">${note.date}</span>
                            <p>${note.text}</p>
                        </div>
                    </li>`).join("") +
            `</ul>`;

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('projectDetailsModal'));
        modal.show();
    });
});



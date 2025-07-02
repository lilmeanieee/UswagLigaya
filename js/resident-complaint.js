// demo of displaying track status of a complaint
document.getElementById("trackForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const refNum = document.getElementById("referenceNumber").value.trim();

    // Mock Data
    const mockData = {
        "123": {
            complaintId: "C-2025-001",
            submissionType: "Complaint",
            subject: "Garbage not collected",
            description: "Garbage has not been collected for 3 days.",
            date: "2025-06-20",
            timeline: "Under Review - Estimated Response: 2 days"
        }
    };

    const data = mockData[refNum];

    const trackModalEl = document.getElementById('trackModal');
    const trackModal = bootstrap.Modal.getInstance(trackModalEl);
    trackModal.hide();

    if (data) {
        // Populate status modal
        document.getElementById("complaintId").textContent = data.complaintId;
        document.getElementById("submissionType").textContent = data.submissionType;
        document.getElementById("subject").textContent = data.subject;
        document.getElementById("description").textContent = data.description;
        document.getElementById("date").textContent = data.date;
        document.getElementById("timeline").textContent = data.timeline;

        // Show status modal
        const statusModal = new bootstrap.Modal(document.getElementById('statusModal'));
        statusModal.show();
    } else {
        alert("No record found for Reference Number: " + refNum);
    }
});
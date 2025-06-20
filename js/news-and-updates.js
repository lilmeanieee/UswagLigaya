document.addEventListener("DOMContentLoaded", function () {
    fetch("/handlers_php/fetch-announcement.php") // Make sure the path is correct
        .then(response => response.json())
        .then(data => {
            const announcementsList = document.getElementById("announcementsList");
            announcementsList.innerHTML = ""; // Clear existing content

            data.forEach(announcement => {
                const statusClass = announcement.status === "Active" ? "text-success" : "text-danger";

                announcementsList.innerHTML += `
                    <div class="list-group-item d-flex align-items-center p-3">
                        <img src="../../asset/img/sample.png" alt="Announcement Image" class="rounded me-3" width="100" height="100">
                        <div class="flex-grow-1">
                            <h5 class="mb-1">${announcement.title}</h5>
                            <small class="text-muted">Published: ${announcement.published_date} | 
                                <span class="${statusClass}">${announcement.status}</span>
                            </small>
                        </div>
                        <div>
                            <button class="btn btn-sm btn-warning me-2">View</button>
                            <button class="btn btn-sm btn-danger">Edit</button>
                        </div>
                    </div>
                `;
            });
        })
        .catch(error => console.error("Error fetching announcements:", error));
});

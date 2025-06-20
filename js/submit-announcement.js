document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("announcementForm").addEventListener("submit", function (e) {
        e.preventDefault(); // Prevent default form submission

        let formData = new FormData(this);

        fetch("/handlers_php/submit_announcement.php", {
            method: "POST",
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            let toastMessage = document.getElementById("toastMessage");
            let toastText = document.getElementById("toastText");

            if (data.success) {
                toastMessage.classList.remove("bg-danger");
                toastMessage.classList.add("bg-success");
                toastText.textContent = "Announcement posted successfully!";
                document.getElementById("announcementForm").reset();
            } else {
                toastMessage.classList.remove("bg-success");
                toastMessage.classList.add("bg-danger");
                toastText.textContent = "Posting Announcement Error. Please check your input data and try again.";
            }

            let toast = new bootstrap.Toast(toastMessage);
            toast.show();
        })
        .catch(error => {
            console.error("Fetch Error:", error);
            
            let toastMessage = document.getElementById("toastMessage");
            let toastText = document.getElementById("toastText");

            toastMessage.classList.remove("bg-success");
            toastMessage.classList.add("bg-danger");
            toastText.textContent = "An unexpected error occurred. Please try again.";

            let toast = new bootstrap.Toast(toastMessage);
            toast.show();
        });
    });
});

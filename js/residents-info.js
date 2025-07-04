document.addEventListener("DOMContentLoaded", function () {
    fetchResidents();
});

// Function to add a new resident dynamically in alphabetical order
window.addNewResident = function(residentData) {
    let tableBody = document.getElementById("residentTableBody");
    if (!tableBody) {
        console.error("residentTableBody not found!");
        return;
    }

    // Validate last_name to avoid trim error
    if (!residentData.last_name || typeof residentData.last_name !== "string") {
        console.warn("Skipping resident due to missing last_name:", residentData);
        return;
    }

    let newRow = document.createElement("tr");
    newRow.innerHTML = 
        `<td>${residentData.last_name || ""}</td>
        <td>${residentData.first_name || ""}</td>
        <td>${residentData.middle_name || ""}</td>
        <td>${residentData.gender || ""}</td>
        <td>${residentData.address || ""}</td>
        <td>${residentData.mobile_no || ""}</td>
        <td>${residentData.status || ""}</td>
        <td>
            <button class="btn btn-info">View</button>
            <button class="btn btn-primary">Edit</button>
        </td>`;

    // Insert newRow in the correct sorted position
    let rows = Array.from(tableBody.getElementsByTagName("tr"));
    let inserted = false;

    const newLastName = residentData.last_name.trim().toLowerCase();

    for (let row of rows) {
        const rowLastName = row.cells[0].textContent.trim().toLowerCase();

        if (newLastName < rowLastName) {
            tableBody.insertBefore(newRow, row);
            inserted = true;
            break;
        }
    }

    if (!inserted) {
        tableBody.appendChild(newRow);
    }
};
      

document.addEventListener("DOMContentLoaded", function () {
    fetchResidents();
});

// Dynamically add a new resident (sorted alphabetically)
function renderResidents(residents) {
    const tableBody = document.getElementById("residentTableBody");
    tableBody.innerHTML = ""; // Clear table first

    residents.forEach((r) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${r.residentCode || ""}</td>
            <td>${r.lastName || ""}</td>
            <td>${r.firstName || ""}</td>
            <td>${r.middleName || ""}</td>
            <td>${r.sex || ""}</td>
            <td>${r.address || ""}</td>
            <td>${r.status || "Active"}</td>
            <td>
                <button class="btn btn-sm btn-info">View</button>
                <button class="btn btn-sm btn-primary">Edit</button>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Fetch and refresh the full list of residents
function fetchResidents() {
    $.ajax({
        url: "/UswagLigaya/php-handlers/fetch-residents.php",
        method: "GET",
        dataType: "json",
        success: function (data) {
            const table = document.getElementById("residentTableBody");
            table.innerHTML = ""; // clear

            const residents = data.residents || [];

            residents.sort((a, b) => {
                const compare = (x, y) => x.toLowerCase().localeCompare(y.toLowerCase());
                return compare(a.lastName, b.lastName); // or a.residentCode, depending on your default sort
            });
            
            // Then use residents variable for rendering
            renderResidents(residents);
            data.residents.forEach(addNewResident);
        },
        error: function (xhr) {
            console.error("❌ Fetch error:", xhr.responseText);
        }
    });
}

// Global function to allow refreshing manually
window.refreshResidents = fetchResidents;

window.addEventListener("storage", (event) => {
    if (event.key === "newResidentAdded") {
        const newResidents = JSON.parse(event.newValue);
        if (Array.isArray(newResidents)) {
            renderResidents(newResidents, true); // append only
            localStorage.removeItem("newResidentAdded");
        }
    }
});

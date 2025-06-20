fetch('/php-handlers/fetch-archive.php', {
    method: 'GET'
})
.then(response => {
    // Check if the response is okay (status code 200)
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json(); // Parse JSON if response is okay
})
.then(data => {
    const tableBody = document.querySelector('#archive-table tbody');
    tableBody.innerHTML = ''; // Clear previous content

    if (data.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6">No archived announcements found.</td>';
        tableBody.appendChild(row);
    } else {
        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.title || 'No title'}</td>
                <td>${item.category}</td>
                <td>${item.date_posted || 'Unknown'}</td>
                <td>${item.date_archive}</td>
                <td>${item.status}</td>
            `;
            tableBody.appendChild(row);
        });
    }
})
.catch(error => {
    console.error('Error fetching archived announcements:', error);
    alert('Failed to load archived announcements.');
});
function displayArchivedAnnouncements(announcements) {
    const tbody = document.querySelector('#archive-table tbody');
    tbody.innerHTML = '';
    
    if (announcements.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No archived announcements found</td></tr>';
        return;
    }

    announcements.forEach(announcement => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${announcement.id}</td>
            <td>${announcement.title || 'No title'}</td>
            <td>${announcement.category}</td>
            <td>${announcement.created_at || 'Unknown'}</td>
            <td>${announcement.date_archive}</td>
            <td>${announcement.status}</td>
        `;
        tbody.appendChild(row);
    });
}

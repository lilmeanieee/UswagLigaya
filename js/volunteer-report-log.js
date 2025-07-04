// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get references to HTML elements
    const eventFilter = document.getElementById('event-filter');
    const searchInput = document.getElementById('search-input');
    const participantsTable = document.getElementById('participants-table').getElementsByTagName('tbody')[0];
    
    // Populate the event filter dropdown
    function populateEventFilter() {
        // Add "All Events" option
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.textContent = 'All Events';
        eventFilter.appendChild(allOption);
        
        // Fetch events from PHP
        fetch('get_events.php')
            .then(response => response.json())
            .then(events => {
                events.forEach(event => {
                    const option = document.createElement('option');
                    option.value = event.volunteer_announcement_id;
                    option.textContent = event.volunteer_announcement_title;
                    eventFilter.appendChild(option);
                });
            })
            .catch(error => console.error('Error fetching events:', error));
    }
    
    // Load participants data
    function loadParticipants(eventId = 'all', searchTerm = '') {
        // Clear existing table rows
        participantsTable.innerHTML = '';
        
        // Show loading indicator
        const loadingRow = participantsTable.insertRow();
        const loadingCell = loadingRow.insertCell();
        loadingCell.colSpan = 6;
        loadingCell.textContent = 'Loading...';
        
        // Fetch participants data
        fetch(`/UswagLigaya/php-handlers/volunteer-report-log.php?ajax=true&event_id=${eventId}`)
            .then(response => response.json())
            .then(participants => {
                // Clear loading indicator
                participantsTable.innerHTML = '';
                
                // Filter participants by search term if provided
                let filteredParticipants = participants;
                if (searchTerm) {
                    const searchLower = searchTerm.toLowerCase();
                    filteredParticipants = participants.filter(p => 
                        p.first_name.toLowerCase().includes(searchLower) || 
                        p.last_name.toLowerCase().includes(searchLower) || 
                        p.volunteer_announcement_title.toLowerCase().includes(searchLower)
                    );
                }
                
                // Display participants
                if (filteredParticipants.length > 0) {
                    filteredParticipants.forEach(participant => {
                        const row = participantsTable.insertRow();
                        
                        // Format the date
                        const eventDate = new Date(participant.event_date);
                        const formattedEventDate = eventDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        
                        const applicationDate = new Date(participant.application_date);
                        const formattedApplicationDate = applicationDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        
                        // Add cells
                        row.insertCell(0).textContent = participant.first_name + ' ' + participant.last_name;
                        row.insertCell(1).textContent = participant.volunteer_announcement_title;
                        row.insertCell(2).textContent = formattedEventDate;
                        row.insertCell(3).textContent = participant.earned_credit_points;
                        
                        // Set the attendance status with appropriate styling
                        const attendanceCell = row.insertCell(4);
                        if (participant.attendance === 'Participated') {
                            attendanceCell.innerHTML = '<span class="badge bg-success">Participated</span>';
                        } else if (participant.attendance === 'Did Not Participate') {
                            attendanceCell.innerHTML = '<span class="badge bg-danger">Did Not Participate</span>';
                        } else {
                            attendanceCell.innerHTML = '<span class="badge bg-warning text-dark">Pending</span>';
                        }
                        
                        row.insertCell(5).textContent = formattedApplicationDate;
                    });
                } else {
                    // No participants found
                    const row = participantsTable.insertRow();
                    const cell = row.insertCell();
                    cell.colSpan = 6;
                    cell.textContent = 'No participants found';
                    cell.className = 'text-center';
                }
            })
            .catch(error => {
                console.error('Error fetching participants:', error);
                participantsTable.innerHTML = '';
                const row = participantsTable.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 6;
                cell.textContent = 'Error loading participants data';
                cell.className = 'text-center text-danger';
            });
    }
    
    // Event handlers
    eventFilter.addEventListener('change', function() {
        loadParticipants(this.value, searchInput.value);
    });
    
    searchInput.addEventListener('input', function() {
        loadParticipants(eventFilter.value, this.value);
    });
    
    // Initial load
    // If we're using the PHP approach, this might not be needed
    // as the PHP would have already populated the table
    loadParticipants();
});

// Function to populate the table with PHP data if available
function populateTableWithPhpData(participants) {
    if (!participants || participants.length === 0) {
        return;
    }
    
    const participantsTable = document.getElementById('participants-table').getElementsByTagName('tbody')[0];
    participants.forEach(participant => {
        const row = participantsTable.insertRow();
        
        // Format the date
        const eventDate = new Date(participant.event_date);
        const formattedEventDate = eventDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const applicationDate = new Date(participant.application_date);
        const formattedApplicationDate = applicationDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Add cells
        row.insertCell(0).textContent = participant.first_name + ' ' + participant.last_name;
        row.insertCell(1).textContent = participant.volunteer_announcement_title;
        row.insertCell(2).textContent = formattedEventDate;
        row.insertCell(3).textContent = participant.earned_credit_points;
        
        // Set the attendance status with appropriate styling
        const attendanceCell = row.insertCell(4);
        if (participant.attendance === 'Participated') {
            attendanceCell.innerHTML = '<span class="badge bg-success">Participated</span>';
        } else if (participant.attendance === 'Did Not Participate') {
            attendanceCell.innerHTML = '<span class="badge bg-danger">Did Not Participate</span>';
        } else {
            attendanceCell.innerHTML = '<span class="badge bg-warning text-dark">Pending</span>';
        }
        
        row.insertCell(5).textContent = formattedApplicationDate;
    });
}
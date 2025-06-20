//event location's script for a category choices or input
document.getElementById('volunteerLocationCategory').addEventListener('change', function () {
    var otherCategoryInput = document.getElementById('volunteerLocationInputOption');
    if (this.value === 'other') {
        otherCategoryInput.style.display = 'block';
        otherCategoryInput.focus();
    } else {
        otherCategoryInput.style.display = 'none';
    }
});

document.getElementById('upEventLocationCategory').addEventListener('change', function () {
    var upEvent = document.getElementById('upEventLocationInputOption');
    if (this.value === 'other') {
        upEvent.style.display = 'block';
        upEvent.focus();
    } else {
        upEvent.style.display = 'none';
    }
});
// end of event location's script



document.getElementById('announcementCategory').addEventListener('change', function () {
    const selectedCategory = this.value;
    const upcomingEventForm = document.getElementById('upcomingEventForm');
    const newsUpdateForm = document.getElementById('newsUpdateForm');
    const Barangay_Volunteer_DriveForm = document.getElementById('Barangay_Volunteer_DriveForm');

    // Hide all categ form
    upcomingEventForm.style.display = 'none';
    newsUpdateForm.style.display = 'none';
    Barangay_Volunteer_DriveForm.style.display = 'none';

    // Show selected categ form
    if (selectedCategory === 'Upcoming Event') {
        upcomingEventForm.style.display = 'block';
    } else if (selectedCategory === 'News and Update') {
        newsUpdateForm.style.display = 'block';
    } else if (selectedCategory === 'Barangay Volunteer Drive') {
        Barangay_Volunteer_DriveForm.style.display = 'block';
    }
});


//get and fetch POST ANNOUNCEMENT
document.getElementById('postAnnouncementBtn').addEventListener('click', function () {
    console.log('Post Announcement button clicked'); // Debugging line

    if (!validateForm()) {
        return; // Stop if validation fails
    }

    const form = document.getElementById('announcementForm');
    const editIndex = form.dataset.editIndex;

    const type = document.getElementById('announcementCategory').value;
    
    if (type === 'Upcoming Event') {
        // Validate the location fields before submitting
        const locationCategory = document.getElementById('upEventLocationCategory').value;
        const locationInput = document.getElementById('upEventLocationInputOption').value;
        
        if (locationCategory === 'other' && !locationInput.trim()) {
            alert('Please specify a location when selecting "Other".');
            document.getElementById('upEventLocationInputOption').focus();
            return; // Stop execution if validation fails
        }
        
        const formData = new FormData();
        formData.append('announcementCategory', document.getElementById('announcementCategory').value);
        formData.append('target_audience', document.getElementById('target_audience').value);
        formData.append('upEvent_title', document.getElementById('upcoming_event_title').value);
        formData.append('upEvent_details', document.getElementById('upcoming_event_details').value);
        
        // Check if a file is selected before appending
        const fileInput = document.getElementById('upcoming_event_file');
        if (fileInput.files.length > 0) {
            formData.append('upEvent_file', fileInput.files[0]);
        }
        
        formData.append('upEventLocationCategory', locationCategory);
        formData.append('upEventLocationInputOption', locationInput);
        formData.append('date', document.getElementById('upcoming_event_date').value);
        formData.append('time_start', document.getElementById('upcoming_event_timeStart').value);
        formData.append('time_end', document.getElementById('upcoming_event_timeEnd').value);

        console.log('Form data prepared, sending fetch request...'); // Add this for debugging
         
        fetch('/php-handlers/insert-upcoming-event-announcement.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.text())
        .then(response => {
            alert('Upcoming Event successfully submitted!');    

            announcementsFromDB.push({
                type: 'Upcoming Event',
                title: document.getElementById('upcoming_event_title').value,
                details: document.getElementById('upcoming_event_details').value,
                date: document.getElementById('upcoming_event_date').value
            });
            renderAnnouncements(document.getElementById('categoryFilter').value);
            
             // Close the modal
            const modalElement = document.getElementById('announcementModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.hide();
            }
            resetAnnouncementForm();
        
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Something went wrong.');
        });
    



    } else if (type === 'News and Update') {
        const formData = new FormData();
        formData.append('announcementCategory', document.getElementById('announcementCategory').value);
        formData.append('categoryNewsUpdate', document.getElementById('categoryNewsUpdate').value);
        formData.append('news_title', document.getElementById('newsTitle').value);
        formData.append('news_source', document.getElementById('newsSource').value);
        formData.append('news_details', document.getElementById('newsDetails').value);
        formData.append('news_file', document.getElementById('newsImage').files[0]);
        

        fetch('/php-handlers/insert-news-update-announcement.php', {
            method: 'POST',
            body: formData
       })
        .then(res => res.text())
        .then(response => {
            alert('Volunteer Drive successfully submitted!');
            console.log(response);

             // Close the modal
            const modalElement = document.getElementById('announcementModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);

            announcementsFromDB.push({
                type: 'News and Update',
                title: document.getElementById('newsTitle').value,
                details: document.getElementById('newsDetails').value,
                date: ''
            });

            renderAnnouncements(document.getElementById('categoryFilter').value);

            if (modalInstance) {
                modalInstance.hide();
            }
            resetAnnouncementForm();
        
        })

        .catch(error => {
            console.error('Error:', error);
            alert('Something went wrong.');
        });

    } else if (type === 'Barangay Volunteer Drive') {
        const formData = new FormData();
        formData.append('announcementCategory', document.getElementById('announcementCategory').value);
        formData.append('title', document.getElementById('volunteerTitle').value);
        formData.append('details', document.getElementById('volunteerDetails').value);
        formData.append('file', document.getElementById('volunteerFile').files[0]);
        formData.append('numberOfParticipants', document.getElementById('numberOfParticipants').value);
        formData.append('volunteerLocationCategory', document.getElementById('volunteerLocationCategory').value);
        formData.append('volunteerLocationInputOption', document.getElementById('volunteerLocationInputOption').value);
        formData.append('date', document.getElementById('volunteerDate').value);
        formData.append('applicationStart', document.getElementById('applicationStart').value); // newly added
        formData.append('deadline', document.getElementById('applicationDeadline').value);
        formData.append('time_start', document.getElementById('volunteer_TimeStart').value);
        formData.append('time_end', document.getElementById('volunteer_TimeEnd').value);
        formData.append('credit_points', document.getElementById('creditPoints').value); // updated ID
    
        fetch('/php-handlers/insert-volunteer-drive-announcement.php', {
            method: 'POST',
            body: formData
        })
        .then(res => res.text())
        .then(response => {
            alert('Volunteer Drive successfully submitted!');
            console.log(response);
    
            const modalElement = document.getElementById('announcementModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
    
            announcementsFromDB.push({
                type: 'Barangay Volunteer Drive',
                title: document.getElementById('volunteerTitle').value,
                details: document.getElementById('volunteerDetails').value,
                date: document.getElementById('volunteerDate').value
            });
    
            renderAnnouncements(document.getElementById('categoryFilter').value);
            if (modalInstance) {
                modalInstance.hide();
            }
            resetAnnouncementForm();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Something went wrong.');
        });
    }


    

    if (editIndex !== undefined && editIndex !== '') {
        form.removeAttribute('data-edit-index');
    } 


    renderAnnouncements(document.getElementById('categoryFilter').value);
    const modal = bootstrap.Modal.getInstance(document.getElementById('announcementModal'));
    modal.hide();
});

/*  possible na ito nalang na method ang iedit(?), which is yung iconnect nyo sa databese, I think?
    basta kamo na bahala mag modify since idunno man ano laman database nyo
*/

//displaying the announcements itooo
let announcementsFromDB = [];

fetch('/php-handlers/get-announcement.php') 
    .then(res => res.json())
    .then(data => {
        announcementsFromDB = data;
        renderAnnouncements(); // render all by default
    })
    .catch(err => {
        console.error('Failed to fetch announcements:', err);
        document.getElementById('announcementList').innerHTML = '<p class="text-danger">Failed to load announcements.</p>';
    });


    function renderAnnouncements(category = 'all') {
        const container = document.getElementById('announcementList');
        container.innerHTML = '';
    
        const filtered = category === 'all'
            ? announcementsFromDB
            : announcementsFromDB.filter(a => a.type === category);
    
        if (filtered.length === 0) {
            container.innerHTML = '<p class="text-muted">No announcements in this category.</p>';
            return;
        }

        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

    
        filtered.forEach((announcement, index) => {
            const card = document.createElement('div');
            card.className = 'card mb-3';
    
            card.innerHTML = `
            <div class="card-body d-flex justify-content-between align-items-start">
                <div>
                    <h5 class="card-title">${announcement.title}</h5>
                    <p class="card-text">${announcement.details}</p>
                    ${announcement.date ? `<p class="card-text"><small class="text-muted">Event Date: ${announcement.date}</small></p>` : ''}
                    ${announcement.type === 'Barangay Volunteer Drive' && announcement.remaining_participants != null ? `
                    <p class="card-text"><small class="text-muted">Remaining Participants: ${announcement.remaining_participants}</small></p>
                    ` : ''}
                    <span class="badge bg-secondary">${formatType(announcement.type)}</span>
                </div>
                <div class="d-flex gap-2 align-items-center">
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${announcement.id}" data-type="${announcement.type}">Edit</button>
                    <button class="btn btn-sm btn-danger archive-btn" data-id="${announcement.id}" data-type="${announcement.type}">Archive</button>
                </div>

            </div>
            `;


    
            container.appendChild(card);
        });
    }

    document.querySelector('.modal-header .btn-close').addEventListener('click', function() {
        resetAnnouncementForm();
    });
    
    document.querySelector('.modal-footer .btn-secondary').addEventListener('click', function() {
        resetAnnouncementForm();
    });
    
    // You can also handle the Bootstrap modal hidden event to ensure it resets even if closed by clicking outside
    document.getElementById('announcementModal').addEventListener('hidden.bs.modal', function() {
        resetAnnouncementForm();
    });


    
    //this is for edit btn
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('edit-btn')) {
            const announcementId = e.target.dataset.id;

            const announcement = announcementsFromDB.find(a => a.id == announcementId);
    
            // Get the modal element
            const modalElement = document.getElementById('announcementModal');
            const modal = new bootstrap.Modal(modalElement);
            
            const modalTitle = modalElement.querySelector('.modal-header .modal-title');
            if (modalTitle) {
                modalTitle.textContent = 'Edit Announcement';
            }
            

            // Change the footer button to "Apply Changes"
            const postButton = modalElement.querySelector('.modal-footer .btn-primary');
            postButton.textContent = 'Apply Changes';
            postButton.id = 'updateAnnouncementBtn';

            if (!announcement) {
                console.error('Announcement not found with ID:', announcementId);
                return;
            }
            
            // Add a function to reset the button and title when modal is closed
                document.getElementById('announcementModal').addEventListener('hidden.bs.modal', function() {
                    const postButton = this.querySelector('.modal-footer .btn-primary');
                    postButton.textContent = 'Post Announcement';
                    postButton.id = 'postAnnouncementBtn';
                    
                    // Reset the modal title
                    const modalTitle = this.querySelector('.modal-header .modal-title');
                    if (modalTitle) {
                        modalTitle.textContent = 'Create Announcement';
                    }
                    
                    resetAnnouncementForm();
                });


            // Select the form based on category
            const categorySelect = document.getElementById('announcementCategory');
            if (categorySelect) {
                categorySelect.value = announcement.type;
                categorySelect.dispatchEvent(new Event('change'));
            
                setTimeout(() => {
            // Populate fields based on category
            if (announcement.type === 'Upcoming Event') {
                console.log("Populating Upcoming Event fields:", announcement);
                const targetAudience = document.getElementById('target_audience');
                if (targetAudience) targetAudience.value = announcement.target_audience || '';
                
                const eventTitle = document.getElementById('upcoming_event_title');
                if (eventTitle) eventTitle.value = announcement.title || '';
                
                const eventDetails = document.getElementById('upcoming_event_details');
                if (eventDetails) eventDetails.value = announcement.details || '';
                
                const eventLocation = document.getElementById('upEventLocationCategory');
                if (eventLocation) eventLocation.value = announcement.upEventLocationCategory || '';
                
                const eventLocationOption = document.getElementById('upEventLocationInputOption');
                if (eventLocationOption) eventLocationOption.value = announcement.upEventLocationInputOption || '';
                
                const eventDate = document.getElementById('upcoming_event_date');
                if (eventDate) eventDate.value = announcement.date || '';
                
                const eventTimeStart = document.getElementById('upcoming_event_timeStart');
                if (eventTimeStart) eventTimeStart.value = announcement.time_start || '';
                
                const eventTimeEnd = document.getElementById('upcoming_event_timeEnd');
                if (eventTimeEnd) eventTimeEnd.value = announcement.time_end || '';
                
                console.log("Fields populated:", {
                    target_audience: targetAudience ? targetAudience.value : 'element not found',
                    title: eventTitle ? eventTitle.value : 'element not found',
                });

                debugFormElements('Upcoming Event');
            
            } else if (announcement.type === 'News and Update') {
                document.getElementById('categoryNewsUpdate').value = announcement.category || '';
                document.getElementById('newsTitle').value = announcement.title || '';
                document.getElementById('newsSource').value = announcement.source || '';
                document.getElementById('newsDetails').value = announcement.details || '';
            } else if (announcement.type === 'Barangay Volunteer Drive') {
                document.getElementById('volunteerTitle').value = announcement.title || '';
                document.getElementById('volunteerDetails').value = announcement.details || '';
                document.getElementById('numberOfParticipants').value = announcement.numberOfParticipants
                document.getElementById('volunteerLocationCategory').value = announcement.volunteerLocationCategory || '';
                document.getElementById('volunteerLocationInputOption').value = announcement.volunteerLocationInputOption || '';
                
                document.getElementById('volunteerDate').value = announcement.date || '';
                document.getElementById('applicationDeadline').value = announcement.deadline || '';
                document.getElementById('volunteer_TimeStart').value = announcement.time_start || '';
                document.getElementById('volunteer_TimeEnd').value = announcement.time_end || '';
                document.getElementById('creditPoints').value = announcement.creditPoints || '';
            
            }  }, 300);
        }  // Delay to ensure the form is displayed before populating fields
            
            document.getElementById('announcementForm').dataset.announcementId = announcement.id;
    
            // Show modal
            modal.show();
            
            // Add event listener for the Apply Changes button
            document.getElementById('updateAnnouncementBtn').addEventListener('click', function () {
                if (!validateForm()) {
                    return; // Stop if validation fails
                }
            
                const formData = new FormData();
                const announcementId = document.getElementById('announcementForm').dataset.announcementId;
              
            
                if (announcement.type === 'Upcoming Event') {
                    formData.append('upEvent_announcement_id', announcementId);
                    formData.append('announcementCategory', document.getElementById('announcementCategory').value);
                    formData.append('target_audience', document.getElementById('target_audience').value);
                    formData.append('upEvent_title', document.getElementById('upcoming_event_title').value);
                    formData.append('upEvent_details', document.getElementById('upcoming_event_details').value);
                    formData.append('upEventLocationCategory', document.getElementById('upEventLocationCategory').value);
                    
                    // Add the optional 'other' location input if available
                    const otherLocationInput = document.getElementById('otherLocationInput');
                    if (otherLocationInput) {
                        formData.append('upEventLocationInputOption', otherLocationInput.value);
                    }
                    
                    formData.append('date', document.getElementById('upcoming_event_date').value);
                    formData.append('time_start', document.getElementById('upcoming_event_timeStart').value);
                    formData.append('time_end', document.getElementById('upcoming_event_timeEnd').value);

                    const fileInput = document.getElementById('upcoming_event_file');
                    if (fileInput && fileInput.files.length > 0) {
                        formData.append('upEvent_file', fileInput.files[0]);
                    }


                    fetch('/php-handlers/update-upcoming-event-announcement.php', {
                        method: 'POST',
                        body: formData  
                    })
                    .then(response => {
                        // Check if it's JSON, fallback to text for error messages
                        const contentType = response.headers.get("content-type");
                        if (contentType && contentType.includes("application/json")) {
                            return response.json();
                        }
                        return response.text().then(text => ({ success: false, message: text }));
                    })
                    .then(data => {
                        if (data.success || data === 'Update successful') {
                            // Refresh the announcements list
                            fetch('/php-handlers/get-announcement.php') 
                                .then(res => res.json())
                                .then(announcements => {
                                    announcementsFromDB = announcements;
                                    renderAnnouncements();
                                })
                                .catch(err => {
                                    console.error('Failed to fetch announcements:', err);
                                });
            
                            const modalInstance = bootstrap.Modal.getInstance(modalElement);
                            modalInstance.hide();
                            resetAnnouncementForm();
            
                            postButton.textContent = 'Post Announcement';
                            postButton.id = 'postAnnouncementBtn';
            
                            alert('Announcement updated successfully!');
                        } else {
                            alert('Error updating announcement: ' + (data.message || data));
                        }
                    })
                    .catch(error => {
                        console.error('Error during update:', error);
                        alert('An unexpected error occurred.');
                    });
                
            
            
            } else if (announcement.type === 'News and Update') {
                    formData.append('type', 'News and Update');
                    formData.append('news_update_id', announcementId);
                    formData.append('category', document.getElementById('categoryNewsUpdate').value);
                    formData.append('title', document.getElementById('newsTitle').value);
                    formData.append('source', document.getElementById('newsSource').value);
                    formData.append('details', document.getElementById('newsDetails').value);
                    
                    const fileInput = document.getElementById('newsImage');
                    if (fileInput.files.length > 0) {
                        formData.append('file', fileInput.files[0]);
                    }

                    fetch('/php-handlers/update-news-update-announcement.php', {
                        method: 'POST',
                        body: formData  
                    })
                    .then(response => {
                        // Check if it's JSON, fallback to text for error messages
                        const contentType = response.headers.get("content-type");
                        if (contentType && contentType.includes("application/json")) {
                            return response.json();
                        }
                        return response.text().then(text => ({ success: false, message: text }));
                    })
                    .then(data => {
                        if (data.success || data === 'Update successful') {
                            // Refresh the announcements list
                            fetch('/php-handlers/get-announcement.php') 
                                .then(res => res.json())
                                .then(announcements => {
                                    announcementsFromDB = announcements;
                                    renderAnnouncements();
                                })
                                .catch(err => {
                                    console.error('Failed to fetch announcements:', err);
                                });
            
                            const modalInstance = bootstrap.Modal.getInstance(modalElement);
                            modalInstance.hide();
                            resetAnnouncementForm();
            
                            postButton.textContent = 'Post Announcement';
                            postButton.id = 'postAnnouncementBtn';
            
                            alert('Announcement updated successfully!');
                        } else {
                            alert('Error updating announcement: ' + (data.message || data));
                        }
                    })
                    .catch(error => {
                        console.error('Error during update:', error);
                        alert('An unexpected error occurred.');
                    });


                } else if (announcement.type === 'Barangay Volunteer Drive') {
                    formData.append('volunteer_announcement_id', announcementId);
                    formData.append('type', 'Barangay Volunteer Drive');
                    formData.append('title', document.getElementById('volunteerTitle').value);
                    formData.append('details', document.getElementById('volunteerDetails').value);
                    formData.append('numberOfParticipants', document.getElementById('numberOfParticipants').value);
                    formData.append('volunteerLocationCategory', document.getElementById('volunteerLocationCategory').value);
                    formData.append('volunteerLocationInputOption', document.getElementById('volunteerLocationInputOption').value);
                    formData.append('date', document.getElementById('volunteerDate').value);
                    formData.append('applicationDeadline', document.getElementById('applicationDeadline').value);
                    formData.append('volunteer_TimeStart', document.getElementById('volunteer_TimeStart').value);
                    formData.append('volunteer_TimeEnd', document.getElementById('volunteer_TimeEnd').value);
                    formData.append('experiencePts', document.getElementById('experiencePts').value);
                    formData.append('redeemablePts', document.getElementById('redeemablePts').value);

                    const fileInput = document.getElementById('volunteerFile');
                    if (fileInput.files.length > 0) {
                        formData.append('file', fileInput.files[0]);
                    }

                    fetch('/php-handlers/update-volunteer-drive-announcement.php', {
                        method: 'POST',
                        body: formData  
                    })
                    .then(response => {
                        // Check if it's JSON, fallback to text for error messages
                        const contentType = response.headers.get("content-type");
                        if (contentType && contentType.includes("application/json")) {
                            return response.json();
                        }
                        return response.text().then(text => ({ success: false, message: text }));
                    })
                    .then(data => {
                        if (data.success || data === 'Update successful') {
                            // Refresh the announcements list
                            fetch('/php-handlers/get-announcement.php') 
                                .then(res => res.json())
                                .then(announcements => {
                                    announcementsFromDB = announcements;
                                    renderAnnouncements();
                                })
                                .catch(err => {
                                    console.error('Failed to fetch announcements:', err);
                                });
            
                            const modalInstance = bootstrap.Modal.getInstance(modalElement);
                            modalInstance.hide();
                            resetAnnouncementForm();
            
                            postButton.textContent = 'Post Announcement';
                            postButton.id = 'postAnnouncementBtn';
            
                            alert('Announcement updated successfully!');
                        } else {
                            alert('Error updating announcement: ' + (data.message || data));
                        }
                    })
                    .catch(error => {
                        console.error('Error during update:', error);
                        alert('An unexpected error occurred.');
                    });

                }
                
            }, { once: true }); // Use once:true to prevent multiple listeners
        }
    });
    
    // Add a function to reset the button when modal is closed
    document.getElementById('announcementModal').addEventListener('hidden.bs.modal', function() {
        const postButton = this.querySelector('.modal-footer .btn-primary');
        postButton.textContent = 'Post Announcement';
        postButton.id = 'postAnnouncementBtn';
        resetAnnouncementForm();
    });


function formatType(type) {
    switch (type) {
        case 'Upcoming Event': return 'Upcoming Event';
        case 'News and Update': return 'News and Update';
        case 'Barangay Volunteer Drive': return 'Barangay Volunteer Drive';
        default: return '';
    }
}

document.getElementById('categoryFilter').addEventListener('change', function () {
    renderAnnouncements(this.value);
});


function resetAnnouncementForm() {
    const form = document.getElementById('announcementForm');
    form.reset();

    document.getElementById('announcementCategory').value = ''; // Or the value of your default option
    
    // Also hide all announcement form sections since none should be visible after reset
    document.querySelectorAll('.announcementFields').forEach(field => {
        field.style.display = 'none';
    });
    // Hide all dynamic location inputs
    document.getElementById('volunteerLocationInputOption').style.display = 'none';
    document.getElementById('upEventLocationInputOption').style.display = 'none';

    // Clear text in optional location inputs
    document.getElementById('numberOfParticipants').value = '';
    document.getElementById('volunteerLocationInputOption').value = '';
    document.getElementById('upEventLocationInputOption').value = '';


    // Clear file inputs manually (file inputs can't be reset by .reset() in some browsers)
    document.getElementById('volunteerFile').value = '';
    document.getElementById('newsImage').value = '';
    document.getElementById('upcoming_event_file').value = '';

    // Clear data-edit-index (for editing mode)
    form.removeAttribute('data-edit-index');
}

function validateForm() {
    const type = document.getElementById('announcementCategory').value;
    
    if (type === 'Upcoming Event') {
        // Check only Upcoming Event fields
        var targetAudience = document.getElementById("target_audience").value;
        var upcomingEventTitle = document.getElementById("upcoming_event_title").value.trim();
        var upcomingEventDetails = document.getElementById("upcoming_event_details").value.trim();
        var upcomingEventLocation = document.getElementById("upEventLocationCategory").value;
        var upcomingEventDate = document.getElementById("upcoming_event_date").value;
        var upcomingEventTimeStart = document.getElementById("upcoming_event_timeStart").value;
        
        if (!targetAudience || targetAudience === "Select target audience") {
            alert("Please select a target audience for the Upcoming Event.");
            return false;
        }
        if (!upcomingEventTitle) {
            alert("Please enter the title for the Upcoming Event.");
            return false;
        }
        if (!upcomingEventDetails) {
            alert("Please enter the details for the Upcoming Event.");
            return false;
        }
        if (!upcomingEventLocation || upcomingEventLocation === "") {
            alert("Please select the location for the Upcoming Event.");
            return false;
        }
        if (!upcomingEventDate) {
            alert("Please select the event date for the Upcoming Event.");
            return false;
        }
        if (!upcomingEventTimeStart) {
            alert("Please select the start time for the Upcoming Event.");
            return false;
        }
    } 
    else if (type === 'News and Update') {
        // Check only News and Update fields
        var categoryNewsUpdate = document.getElementById("categoryNewsUpdate").value;
        var newsTitle = document.getElementById("newsTitle").value.trim();
        var newsSource = document.getElementById("newsSource").value.trim();
        var newsDetails = document.getElementById("newsDetails").value.trim();
        
        if (!categoryNewsUpdate || categoryNewsUpdate === "Select announcement type") {
            alert("Please select a category for News and Update.");
            return false;
        }
        if (!newsTitle) {
            alert("Please enter the title for the News and Update.");
            return false;
        }
        if (!newsSource) {
            alert("Please enter the source for the News and Update.");
            return false;
        }
        if (!newsDetails) {
            alert("Please enter the details for the News and Update.");
            return false;
        }
    } 
    else if (type === 'Barangay Volunteer Drive') {
        // Check only Barangay Volunteer Drive fields
        var volunteerTitle = document.getElementById("volunteerTitle").value.trim();
        var volunteerDetails = document.getElementById("volunteerDetails").value.trim();
        var numberOfParticipants = document.getElementById("numberOfParticipants").value;
        var volunteerLocation = document.getElementById("volunteerLocationCategory").value;
        var volunteerDate = document.getElementById("volunteerDate").value;
        var applicationDeadline = document.getElementById("applicationDeadline").value;
        var volunteerTimeStart = document.getElementById("volunteer_TimeStart").value;
        var creditPoints = document.getElementById("creditPoints").value.trim();
        
        
        if (!volunteerTitle) {
            alert("Please enter the title for the Barangay Volunteer Drive.");
            return false;
        }
        if (!volunteerDetails) {
            alert("Please enter the details for the Barangay Volunteer Drive.");
            return false;
        }
        if (!volunteerLocation || volunteerLocation === "") {
            alert("Please select the location for the Barangay Volunteer Drive.");
            return false;
        }
        if (!volunteerDate) {
            alert("Please select the volunteer date for the Barangay Volunteer Drive.");
            return false;
        }
        if (!applicationDeadline) {
            alert("Please select the application deadline for the Barangay Volunteer Drive.");
            return false;
        }
        if (!volunteerTimeStart) {
            alert("Please select the start time for the Barangay Volunteer Drive.");
            return false;
        }
      
        if (!creditPoints) {
            alert("Please enter the credit points for the Barangay Volunteer Drive.");
            return false;
        }
        if(!numberOfParticipants){
            alert("Please enter the number of participants for the Barangay Volunteer Drive.");
            return false;
        }
    }
    
    // Everything is valid
    return true;
}
function debugFormElements(announcementType) {
    console.log(`Debugging ${announcementType} form elements:`);
    if (announcementType === 'Upcoming Event') {
        const elements = [
            'target_audience', 
            'upcoming_event_title', 
            'upcoming_event_details',
            'upEventLocationCategory',
            'upEventLocationInputOption',
            'upcoming_event_date',
            'upcoming_event_timeStart',
            'upcoming_event_timeEnd'
        ];
        
        elements.forEach(id => {
            const el = document.getElementById(id);
            console.log(`${id}: ${el ? 'exists' : 'NOT FOUND'}, value: ${el ? el.value : 'N/A'}`);
        });
    }
    // Add similar blocks for other announcement types
}

document.addEventListener('click', function (e) {
    if (e.target.classList.contains('archive-btn')) {
        const id = e.target.dataset.id;
        const type = e.target.dataset.type;
        
        if (confirm('Are you sure you want to archive this announcement?')) {
            fetch('/php-handlers/archive-announcement.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({ id, type })
            })
            .then(res => res.json())
            .then(response => {
                console.log('Archive response:', response);
                if (response.status === 'success') {
                    alert(response.message || 'Announcement archived.');
            
                    // Instantly remove from DOM
                    const announcementCard = e.target.closest('.card');
                    if (announcementCard) announcementCard.remove();
            
                    // Optional re-fetch
                    fetch('/php-handlers/get-announcement.php')
                        .then(res => res.json())
                        .then(data => {
                            announcementsFromDB = data;
                            const selectedFilter = document.getElementById('categoryFilter').value;
                            renderAnnouncements(selectedFilter);
                        })
                        .catch(err => {
                            console.error('Failed to refresh announcements:', err);
                        });
                } else {
                    alert('Failed to archive: ' + response.message);
                }
            })
            .catch(err => {
                console.error('Archive failed:', err);
                alert('Failed to archive.');
            });
            
        }
    }
});
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('archive-announcement-btn')) {
        console.log('Archive announcement button clicked');
        // Directly redirect to the archive announcement page
        window.location.href = '/html/archive-announcement.html';
    }
});


// Initialize with all
renderAnnouncements();

function resetAnnouncementModal() {
    // Reset select dropdowns
    document.getElementById('announcementCategory').selectedIndex = 0;

    // Hide all specific announcement forms
    document.querySelectorAll('.announcementFields').forEach(form => {
        form.style.display = 'none';
    });

    // Clear all inputs and textareas inside the modal
    document.querySelectorAll('#announcementModal input, #announcementModal textarea, #announcementModal select').forEach(field => {
        if (field.type === 'checkbox' || field.type === 'radio') {
            field.checked = false;
        } else {
            field.value = '';
        }
    });

    // Reset display text
    const selectedList = document.getElementById('selectedList');
    if (selectedList) selectedList.textContent = 'None';
}

// Run reset when modal is hidden (either close button or clicking outside)
document.getElementById('announcementModal').addEventListener('hidden.bs.modal', function () {
    const selectedFilter = document.getElementById('categoryFilter').value;
renderAnnouncements(selectedFilter);
});
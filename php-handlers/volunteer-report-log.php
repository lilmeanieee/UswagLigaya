<?php
include 'connect.php';

// Function to get all volunteer events for the filter dropdown
function getVolunteerEvents($conn) {
    $sql = "SELECT volunteer_announcement_id, volunteer_announcement_title, date 
            FROM tbl_volunteer_drive_announcement 
            WHERE status = 'ACTIVE' 
            ORDER BY date DESC";
    
    $result = $conn->query($sql);
    $events = array();
    
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $events[] = $row;
        }
    }
    
    return $events;
}

// Function to get participants who have been evaluated
function getEvaluatedParticipants($conn, $eventId = null) {
    $sql = "SELECT 
                hm.first_name, 
                hm.last_name, 
                vda.volunteer_announcement_title, 
                vda.date as event_date, 
                vp.attendance, 
                vp.joined_at as application_date,
                CASE 
                    WHEN vp.attendance = 'Participated' THEN vda.credit_points 
                    ELSE 0 
                END as earned_credit_points
            FROM 
                tbl_volunteer_participation vp
            JOIN 
                tbl_household_members hm ON vp.resident_id = hm.resident_id
            JOIN 
                tbl_volunteer_drive_announcement vda ON vp.volunteer_announcement_id = vda.volunteer_announcement_id
            WHERE 
                vp.isEvaluated = 'Yes'";
    
    // If event ID is provided, filter by that event
    if ($eventId && $eventId != 'all') {
        $sql .= " AND vp.volunteer_announcement_id = " . $conn->real_escape_string($eventId);
    }
    
    $sql .= " ORDER BY vp.joined_at DESC";
    
    $result = $conn->query($sql);
    $participants = array();
    
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $participants[] = $row;
        }
    }
    
    return $participants;
}

// Get all events for dropdown
$events = getVolunteerEvents($conn);

// Handle AJAX request for filtered data
if (isset($_GET['ajax']) && $_GET['ajax'] == 'true') {
    $eventId = isset($_GET['event_id']) ? $_GET['event_id'] : 'all';
    $participants = getEvaluatedParticipants($conn, $eventId);
    header('Content-Type: application/json');
    echo json_encode($participants);
    exit;
}

// Initial data load
$participants = getEvaluatedParticipants($conn);

// Close connection
$conn->close();
?>

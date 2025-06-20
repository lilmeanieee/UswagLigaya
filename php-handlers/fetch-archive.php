<?php
require 'connect.php';

$results = [];

$sql = "
    SELECT 
        upEvent_announcement_id AS id, 
        upEvent_title AS title, 
        'Upcoming Event' AS category, 
        created_at AS date_posted,  /* Changed this line */
        date_archive, 
        status
    FROM tbl_upcoming_event_announcement
    WHERE status = 'inactive'

    UNION

    SELECT 
        news_update_announcement_id AS id, 
        news_update_title AS title, 
        'News Update' AS category, 
        created_at AS date_posted,  /* Changed this line */
        date_archive, 
        status
    FROM tbl_news_update_announcement
    WHERE status = 'inactive'

    UNION

    SELECT 
        volunteer_announcement_id AS id, 
        volunteer_announcement_title AS title, 
        'Volunteer Drive' AS category, 
        created_at AS date_posted,  /* Changed this line */
        date_archive, 
        status
    FROM tbl_volunteer_drive_announcement
    WHERE status = 'inactive'

    ORDER BY date_archive DESC
";

$query = $conn->query($sql);

if ($query) {
    while ($row = $query->fetch_assoc()) {
        $results[] = $row;
    }
    echo json_encode($results);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to retrieve data.']);
}

$conn->close();
?>
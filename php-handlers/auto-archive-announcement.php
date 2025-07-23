<?php
require_once(__DIR__ . '/connect.php'); 

date_default_timezone_set('Asia/Manila');
$today = date('Y-m-d');

try {
    // Auto-archive past Volunteer Drive Announcements
    $stmt1 = $pdo->prepare("UPDATE tbl_volunteer_drive_announcement 
                            SET status = 'inactive' 
                            WHERE status = 'active' AND date < ?");
    $stmt1->execute([$today]);

    // Auto-archive past Upcoming Event Announcements
    $stmt2 = $pdo->prepare("UPDATE tbl_upcoming_event_announcement 
                            SET status = 'inactive' 
                            WHERE status = 'active' AND event_date < ?");
    $stmt2->execute([$today]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Expired announcements set to inactive.'
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Archiving failed: ' . $e->getMessage()
    ]);
}

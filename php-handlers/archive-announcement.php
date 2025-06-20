<?php
require 'connect.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id'], $_POST['type'])) {
    $id = $_POST['id'];
    $type = $_POST['type'];

    $tableMap = [
        'Upcoming Event' => ['table' => 'tbl_upcoming_event_announcement', 'id_col' => 'upEvent_announcement_id'],
        'News and Update' => ['table' => 'tbl_news_update_announcement', 'id_col' => 'news_update_announcement_id'],
        'Barangay Volunteer Drive' => ['table' => 'tbl_volunteer_drive_announcement', 'id_col' => 'volunteer_announcement_id']
    ];

    if (!array_key_exists($type, $tableMap)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid announcement type.']);
        exit;
    }

    $table = $tableMap[$type]['table'];
    $idColumn = $tableMap[$type]['id_col'];

    $query = "UPDATE $table SET status = 'inactive', date_archive = NOW() WHERE $idColumn = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Announcement archived successfully.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Database error.']);
    }

    $stmt->close();
    $conn->close();
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request.']);
}

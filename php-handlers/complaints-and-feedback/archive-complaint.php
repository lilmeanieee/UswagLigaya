<?php
// This script archives a complaint by changing its status.
// Place this file at: php-handlers/complaints-and-feedback/archive-complaint.php

session_start();
header('Content-Type: application/json');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

include '../../php-handlers/connect.php';

if (!isset($conn) || !$conn) {
    http_response_code(500);
    echo json_encode(['message' => 'Database connection failed.']);
    exit;
}

// Get user ID from session and complaint ID from POST request
$user_id = $_SESSION['user_id'] ?? null;
$complaint_id = $_POST['complaintId'] ?? null;

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized: User not logged in.']);
    exit;
}

if (!$complaint_id) {
    http_response_code(400);
    echo json_encode(['message' => 'Bad Request: Complaint ID is missing.']);
    exit;
}

try {
    // Prepare SQL statement to update the complaint status to 'Archived'
    $status = 'Archived';
    $stmt = $conn->prepare("UPDATE tbl_complaints SET current_status = ? WHERE complaint_id = ? AND user_id = ?");
    $stmt->bind_param("sii", $status, $complaint_id, $user_id);
    $stmt->execute();

    if ($stmt->affected_rows > 0) {
        echo json_encode(['status' => 'success', 'message' => 'Complaint archived successfully.']);
    } else {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Complaint not found or already archived.']);
    }
    $stmt->close();

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server error: ' . $e->getMessage()]);
}
?>

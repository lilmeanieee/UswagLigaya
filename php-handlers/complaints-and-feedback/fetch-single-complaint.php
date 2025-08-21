<?php
// Place this file at: php-handlers/complaints-and-feedback/fetch-single-complaint.php

session_start();
header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Use a dynamic path to connect.php
require_once __DIR__ . '/../connect.php';

if (!isset($conn) || !$conn) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed.']);
    exit;
}

$user_id = $_SESSION['user_id'] ?? null;
$complaint_id = $_GET['complaint_id'] ?? null;

if (!$user_id) {
    http_response_code(401);
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized: User not logged in.']);
    exit;
}

if (!$complaint_id) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Bad Request: Complaint ID is missing.']);
    exit;
}

try {
    // Corrected SELECT statement: Removed 'complainant_name'
    $stmt = $conn->prepare("SELECT complaint_id, incident_date, incident_location, category AS complaint_category, subject AS complaint_subject, description AS complaint_description, desired_outcome, current_status AS status, submission_timestamp AS submission_date FROM tbl_complaints WHERE complaint_id = ? AND user_id = ?");
    $stmt->bind_param("ii", $complaint_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $complaint = $result->fetch_assoc();
    $stmt->close();

    if ($complaint) {
        $attachments = [];
        $stmt_attach = $conn->prepare("SELECT file_name, file_type, TO_BASE64(file_data) AS file_data FROM tbl_complaint_attachments WHERE complaint_id = ?");
        $stmt_attach->bind_param("i", $complaint_id);
        $stmt_attach->execute();
        $result_attach = $stmt_attach->get_result();

        while ($row_attach = $result_attach->fetch_assoc()) {
            $attachments[] = [
                'fileName' => $row_attach['file_name'],
                'fileType' => $row_attach['file_type'],
                'fileData' => $row_attach['file_data']
            ];
        }
        $stmt_attach->close();
        
        $complaint['attachments'] = $attachments;

        echo json_encode(['status' => 'success', 'data' => $complaint]);
    } else {
        http_response_code(404);
        echo json_encode(['status' => 'error', 'message' => 'Complaint not found or you do not have permission to view it.']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Database query error: ' . $e->getMessage()]);
} finally {
    if (isset($conn) && $conn) {
        $conn->close();
    }
}
?>
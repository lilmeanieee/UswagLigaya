<?php
// Place this file at: php-handlers/complaints-and-feedback/submit-complaint.php

// Error reporting and headers for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

// Include database connection. The paths are designed for flexibility.
$possiblePaths = [
    '../connect.php',
    '../../connect.php',
    '../../../connect.php'
];

$connected = false;
foreach ($possiblePaths as $path) {
    if (file_exists($path)) {
        require_once $path;
        $connected = true;
        break;
    }
}

if (!$connected) {
    error_log("Database connection file not found");
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

// Start a session to access user data
session_start();

try {
    // Check if the request method is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception("Invalid request method: " . $_SERVER['REQUEST_METHOD']);
    }

    // Get user ID from session
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        throw new Exception("Unauthorized: User not logged in.");
    }

    // Get complaint form data from POST request
    $incidentDate = $_POST['incidentDate'] ?? null;
    $incidentLocation = $_POST['incidentLocation'] ?? null;
    $complaintCategory = $_POST['complaintCategory'] ?? null;
    $complaintSubject = $_POST['complaintSubject'] ?? null;
    $complaintDescription = $_POST['complaintDescription'] ?? null;
    $desiredOutcome = $_POST['desiredOutcome'] ?? null;
    $complainantName = $_POST['complainantName'] ?? 'Anonymous';

    if (!$incidentDate || !$incidentLocation || !$complaintCategory || !$complaintSubject || !$complaintDescription) {
        throw new Exception("Missing required fields.");
    }

    $currentStatus = 'Pending';
    $submissionTimestamp = date('Y-m-d H:i:s');

    // Insert complaint into tbl_complaints with correct column names
    $stmt = $conn->prepare("INSERT INTO tbl_complaints (user_id, incident_date, incident_location, category, subject, description, desired_outcome, current_status, submission_timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("issssssss", $userId, $incidentDate, $incidentLocation, $complaintCategory, $complaintSubject, $complaintDescription, $desiredOutcome, $currentStatus, $submissionTimestamp);

    if (!$stmt->execute()) {
        throw new Exception("Failed to insert complaint: " . $stmt->error);
    }

    $complaintId = $stmt->insert_id;
    $stmt->close();

    // Handle file uploads and insert into tbl_complaint_attachments
    $filesProcessed = 0;
    if (!empty($_FILES['attachments']['name'][0])) {
        // Use the correct column names for the BLOB data
        $stmt_attach = $conn->prepare("INSERT INTO tbl_complaint_attachments (complaint_id, file_name, file_type, file_data) VALUES (?, ?, ?, ?)");
        $stmt_attach->bind_param("isss", $complaintId, $fileName, $fileType, $fileData);

        foreach ($_FILES['attachments']['name'] as $key => $name) {
            if ($_FILES['attachments']['error'][$key] !== UPLOAD_ERR_OK) {
                continue;
            }
            
            $fileName = $_FILES['attachments']['name'][$key];
            $fileType = $_FILES['attachments']['type'][$key];
            $tmpPath = $_FILES['attachments']['tmp_name'][$key];
            
            $fileData = file_get_contents($tmpPath);

            if ($fileData === false) {
                error_log("Failed to read file: $fileName");
                continue;
            }

            if (!$stmt_attach->execute()) {
                error_log("Failed to insert attachment $fileName: " . $stmt_attach->error);
                continue;
            }
            
            $filesProcessed++;
        }
        $stmt_attach->close();
    }

    $message = "Complaint submitted successfully!";
    if ($filesProcessed > 0) {
        $message .= " ($filesProcessed file(s) uploaded)";
    }

    echo json_encode([
        "status" => "success", 
        "message" => $message, 
        "complaintId" => $complaintId,
        "filesProcessed" => $filesProcessed
    ]);

} catch (Exception $e) {
    http_response_code(400); // Set response code to a more specific error
    echo json_encode(["status" => "error", "message" => "Submission failed: " . $e->getMessage()]);
} finally {
    if (isset($conn) && $conn) {
        $conn->close();
    }
}
?>
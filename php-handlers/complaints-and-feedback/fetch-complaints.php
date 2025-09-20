<?php
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

// Get the user ID from the session
$user_id = $_SESSION['user_id'] ?? null;

// Validate user ID
if (!$user_id) {
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized: User not logged in.']);
    exit;
}

try {
    // Prepare SQL statement to fetch complaints for the logged-in user
    // Now using the correct column names from the provided database schema image
    $stmt = $conn->prepare("SELECT complaint_id, category, subject, current_status, submission_timestamp FROM tbl_complaints WHERE user_id = ? ORDER BY submission_timestamp DESC");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $complaints = [];
    while ($row = $result->fetch_assoc()) {
        $complaints[] = $row;
    }

    echo json_encode($complaints);

    $stmt->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
}

if (isset($conn) && $conn) {
    $conn->close();
}
?>

<?php
// Enable error reporting for debugging (disable in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set content type to JSON at the start
header('Content-Type: application/json');

try {
    require_once 'connect.php';
    
    // Start session if not already started
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    // Debug: Check if connection exists
    if (!isset($conn)) {
        throw new Exception('Database connection not established');
    }

    $loggedInUserId = isset($_SESSION['resident_id']) ? $_SESSION['resident_id'] : null;

    // Debug: Log the session data and user ID
    error_log("Full session data: " . json_encode($_SESSION));
    error_log("Logged in user ID: " . ($loggedInUserId ?? 'NULL'));

    // If no user ID is found, return an error
    if (!$loggedInUserId) {
        echo json_encode(["error" => "User not logged in. Please log in to view your document requests."]);
        exit();
    }

    // Additional debug: Check what's actually in the database
    $debugQuery = "SELECT resident_id, COUNT(*) as count FROM tbl_document_requests GROUP BY resident_id";
    $debugResult = $conn->query($debugQuery);
    error_log("All resident_ids in tbl_document_requests:");
    while ($debugRow = $debugResult->fetch_assoc()) {
        error_log("resident_id: " . $debugRow['resident_id'] . " (type: " . gettype($debugRow['resident_id']) . "), count: " . $debugRow['count']);
    }
    
    // Check if our specific user has any records
    $userCheckQuery = "SELECT COUNT(*) as count FROM tbl_document_requests WHERE resident_id = ?";
    $userCheckStmt = $conn->prepare($userCheckQuery);
    $userCheckStmt->bind_param("i", $loggedInUserId);
    $userCheckStmt->execute();
    $userCheckResult = $userCheckStmt->get_result()->fetch_assoc();
    error_log("Records for user ID " . $loggedInUserId . ": " . $userCheckResult['count']);

    $data = [];

    // First, let's check if the tables exist and have data
    $checkTablesQuery = "SHOW TABLES LIKE 'tbl_document_requests'";
    $tableCheck = $conn->query($checkTablesQuery);
    if ($tableCheck->num_rows === 0) {
        throw new Exception('Table tbl_document_requests does not exist');
    }

    $checkTablesQuery2 = "SHOW TABLES LIKE 'tbl_document_templates'";
    $tableCheck2 = $conn->query($checkTablesQuery2);
    if ($tableCheck2->num_rows === 0) {
        throw new Exception('Table tbl_document_templates does not exist');
    }

    // Modified query to handle potential column name differences
    // using the correct table name: tbl_document_requests
    $sql = "SELECT dr.id, dr.created_at, dr.status, dr.resident_id, dr.template_id,
                   COALESCE(dt.name, 'Unknown Document') AS document_type_name
            FROM tbl_document_requests dr
            LEFT JOIN tbl_document_templates dt ON dr.template_id = dt.id
            WHERE dr.resident_id = ? 
            ORDER BY dr.created_at DESC";

    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        error_log("MySQL prepare error: " . $conn->error);
        throw new Exception('Failed to prepare database statement: ' . $conn->error);
    }

    // Bind the user ID parameter
    $stmt->bind_param("i", $loggedInUserId);

    // Execute the query
    if (!$stmt->execute()) {
        error_log("MySQL execute error: " . $stmt->error);
        throw new Exception('Failed to execute database query: ' . $stmt->error);
    }

    $result = $stmt->get_result();

    // Debug: Log the number of rows found
    error_log("Number of rows found: " . $result->num_rows);

    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            // Debug: Log each row
            error_log("Row data: " . json_encode($row));

            // Format the request ID as REQ-XXXXXX
            $requestIdFormatted = "REQ-" . str_pad($row['id'], 6, '0', STR_PAD_LEFT);

            // Format the date - handle potential null dates
            $requestDate = $row['created_at'] ? date("M d, Y", strtotime($row['created_at'])) : 'N/A';

            // Determine badge class based on status
            $badgeClass = '';
            switch (strtolower($row['status'] ?? '')) {
                case 'pending':
                    $badgeClass = 'bg-warning';
                    break;
                case 'completed':
                    $badgeClass = 'bg-success';
                    break;
                case 'approved':
                    $badgeClass = 'bg-info';
                    break;
                case 'rejected':
                    $badgeClass = 'bg-danger';
                    break;
                default:
                    $badgeClass = 'bg-secondary';
                    break;
            }

            $data[] = [
                "request_id" => $requestIdFormatted,
                "document_type" => $row['document_type_name'] ?? 'Unknown Document',
                "request_date" => $requestDate,
                "status" => ucfirst($row['status'] ?? 'unknown'),
                "status_badge_class" => $badgeClass
            ];
        }
    }

    // Close statement and connection
    $stmt->close();
    $conn->close();

    // Debug: Log the final data
    error_log("Final data to return: " . json_encode($data));

    // Return data as JSON
    echo json_encode($data);

} catch (Exception $e) {
    // Log the detailed error for debugging
    error_log("Document requests fetch error: " . $e->getMessage());
    error_log("Stack trace: " . $e->getTraceAsString());
    
    // Return user-friendly error message with debug info (remove debug info in production)
    echo json_encode([
        "error" => "Unable to load document requests at this time. Please try again later.",
        "debug" => $e->getMessage() // Remove this line in production
    ]);
}
?>
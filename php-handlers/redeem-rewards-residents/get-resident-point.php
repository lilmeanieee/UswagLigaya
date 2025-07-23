<?php
session_start(); 

header('Content-Type: application/json');
include_once '../connect.php';

// Debug: Check session data
error_log("Session data: " . print_r($_SESSION, true));
error_log("Session ID: " . session_id());

$resident_id = $_SESSION['resident_id'] ?? null;

// More detailed error response
if (!$resident_id) {
    echo json_encode([
        'success' => false,
        'message' => 'resident_id is required',
        'debug' => [
            'session_id' => session_id(),
            'session_data' => $_SESSION,
            'resident_id_exists' => isset($_SESSION['resident_id']),
            'resident_id_value' => $resident_id
        ]
    ]);
    exit;
}

// Sample query to get points
$sql = "SELECT credit_points, redeemable_points FROM tbl_resident_participation_stats WHERE resident_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $resident_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'No matching resident found',
        'resident_id' => $resident_id
    ]);
    exit;
}

$row = $result->fetch_assoc();
echo json_encode([
    'success' => true,
    'credit_points' => $row['credit_points'],
    'redeemable_points' => $row['redeemable_points'],
    'resident_id' => $resident_id
]);
?>
<?php
session_start();
header('Content-Type: application/json');
include '../connect.php';

// Check if resident_id is provided via POST, GET, or session
$resident_id = null;

if (isset($_POST['resident_id'])) {
    $resident_id = $_POST['resident_id'];
} elseif (isset($_GET['resident_id'])) {
    $resident_id = $_GET['resident_id'];
} elseif (isset($_SESSION['resident_id'])) {
    $resident_id = $_SESSION['resident_id'];
}

if (!$resident_id) {
    echo json_encode(['error' => 'Resident ID is required']);
    exit;
}

try {
    $stmt = $conn->prepare("
        SELECT 
            m.resident_code, 
            m.first_name, 
            m.middle_name, 
            m.last_name,
            COALESCE(s.credit_points, 0) AS credit_points,
            COALESCE(s.redeemable_points, 0) AS redeemable_points,
            COALESCE(s.total_participated, 0) AS total_participated
        FROM tbl_household_members m
        LEFT JOIN tbl_resident_participation_stats s ON m.resident_id = s.resident_id
        WHERE m.resident_id = ?
    ");

    $stmt->bind_param("i", $resident_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $resident = $result->fetch_assoc();
        
        // Build a clean display name
        $resident['name'] = trim("{$resident['last_name']}, {$resident['first_name']} {$resident['middle_name']}");

        // Formatted fields
        $resident['creditPointsFormatted'] = number_format($resident['credit_points']) . " pts";
        $resident['redeemablePointsFormatted'] = number_format($resident['redeemable_points']) . " pts";
        $resident['totalParticipatedFormatted'] = number_format($resident['total_participated']) . "";

        echo json_encode([
            'success' => true,
            'resident' => $resident
        ]);
    } else {
        echo json_encode(['error' => 'Resident not found']);
    }
} catch (Exception $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>
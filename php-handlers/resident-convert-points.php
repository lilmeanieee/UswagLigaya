<?php
session_start();
require_once 'connect.php'; // adjust path if needed

header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

$resident_id = $_POST['resident_id'] ?? null;
$creditPoints = $_POST['creditPoints'] ?? null;

if (!$resident_id || !$creditPoints) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Missing resident ID or credit points'
    ]);
    exit;
}

// No need for $conn->beginTransaction(); <--- REMOVE THIS!

// Fetch current points
$query = "SELECT credit_points, redeemable_points FROM tbl_resident_participation_stats WHERE resident_id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $resident_id);
$stmt->execute();
$result = $stmt->get_result();
$resident = $result->fetch_assoc();

if (!$resident) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Resident not found'
    ]);
    exit;
}

$newCreditPoints = $resident['credit_points'] - $creditPoints;

// Fetch latest conversion rate from settings
$settingsQuery = "SELECT credit_points, redeemable_points FROM tbl_conversion_settings ORDER BY conversion_id DESC LIMIT 1";
$settingsResult = $conn->query($settingsQuery);
$settings = $settingsResult->fetch_assoc();

$redeemablePointsEarned = ($creditPoints * $settings['redeemable_points']) / $settings['credit_points'];
$newRedeemablePoints = $resident['redeemable_points'] + $redeemablePointsEarned;

// Update the resident's points
$updateQuery = "UPDATE tbl_resident_participation_stats SET credit_points = ?, redeemable_points = ? WHERE resident_id = ?";
$updateStmt = $conn->prepare($updateQuery);
$updateStmt->bind_param("ddi", $newCreditPoints, $newRedeemablePoints, $resident_id);

if ($updateStmt->execute()) {
    echo json_encode([
        'status' => 'success',
        'new_credit_points' => $newCreditPoints,
        'new_redeemable_points' => $newRedeemablePoints
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to update database'
    ]);
}

$conn->close();
?>

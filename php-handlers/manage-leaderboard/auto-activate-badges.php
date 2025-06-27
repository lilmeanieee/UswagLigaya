<?php
require_once(__DIR__ . '/../connect.php');

date_default_timezone_set('Asia/Manila');
$today = date('Y-m-d');

try {
    // Activate badges that are not active, not archived, and whose activation_date is today or earlier
    $stmt = $pdo->prepare("
        UPDATE tbl_badges 
        SET is_active = 1 
        WHERE is_active = 0 
          AND is_archived = 0
          AND activation_date IS NOT NULL
          AND activation_date <= ?
    ");
    $stmt->execute([$today]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Auto-activation complete.',
        'updatedRows' => $stmt->rowCount()
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Activation failed: ' . $e->getMessage()
    ]);
}

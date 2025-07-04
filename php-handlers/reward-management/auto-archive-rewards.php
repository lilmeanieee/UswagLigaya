<?php
require_once(__DIR__ . '/../connect.php');
date_default_timezone_set('Asia/Manila');
$today = date('Y-m-d');

try {
    $stmt = $pdo->prepare("
        UPDATE tbl_rewards
        SET is_archived = 1, is_active = 0
        WHERE is_active = 1  
          AND expiration_date IS NOT NULL 
          AND expiration_date <= ?
    ");
    $stmt->execute([$today]);

    echo json_encode([
        'status' => 'success',
        'message' => 'Auto-expiration complete.',
        'updatedRows' => $stmt->rowCount()
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Auto-expiration failed: ' . $e->getMessage()
    ]);
}

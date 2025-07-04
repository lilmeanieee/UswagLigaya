<?php
// assign-manual-badges.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../connect.php';

// Parse JSON input
$input = json_decode(file_get_contents("php://input"), true);

if (!isset($input['resident_id'], $input['badge_ids']) || !is_array($input['badge_ids'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid input data.']);
    exit;
}

$resident_id = (int) $input['resident_id'];
$badge_ids = $input['badge_ids'];
$remarks = isset($input['remarks']) ? trim($input['remarks']) : null;

try {
    $pdo->beginTransaction();

    $sql = "INSERT INTO tbl_resident_badges (resident_id, badge_id, awarded_at, remarks, source)
            VALUES (:resident_id, :badge_id, NOW(), :remarks, 'manual')
            ON DUPLICATE KEY UPDATE awarded_at = NOW(), remarks = :remarks_update";

    $stmt = $pdo->prepare($sql);

    foreach ($badge_ids as $badge_id) {
        $stmt->execute([
            ':resident_id' => $resident_id,
            ':badge_id' => $badge_id,
            ':remarks' => $remarks,
            ':remarks_update' => $remarks
        ]);
    }

    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Badges assigned successfully.']);
} catch (PDOException $e) {
    $pdo->rollBack();
    error_log('Error assigning badges: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error while assigning badges.']);
}

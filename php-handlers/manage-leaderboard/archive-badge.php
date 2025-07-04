<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../connect.php'; // Adjust if path is different

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['badge_id'])) {
        echo json_encode(["success" => false, "message" => "Missing badge_id."]);
        exit;
    }

    $badge_id = intval($data['badge_id']);

    $sql = "UPDATE tbl_badges 
            SET is_archived = 1, is_active = 0, activation_date = NULL 
            WHERE badge_id = ?";

    $stmt = $conn->prepare($sql);
    if ($stmt) {
        $stmt->bind_param("i", $badge_id);
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Badge archived successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to archive badge."]);
        }
        $stmt->close();
    } else {
        echo json_encode(["success" => false, "message" => "Database error."]);
    }

    $conn->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
}
?>

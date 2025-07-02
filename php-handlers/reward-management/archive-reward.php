<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../connect.php'; 

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['reward_id'])) {
        echo json_encode(["success" => false, "message" => "Missing reward_id."]);
        exit;
    }

    $reward_id = intval($data['reward_id']);

    $sql = "UPDATE tbl_rewards
            SET is_archived = 1, is_active = 0, activation_date = NULL 
            WHERE reward_id = ?";

    $stmt = $conn->prepare($sql);
    if ($stmt) {
        $stmt->bind_param("i", $reward_id);
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Rewward archived successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to archive reward."]);
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

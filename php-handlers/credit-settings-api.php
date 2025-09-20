<?php
header('Content-Type: application/json');

// Include the existing database connection file
require_once 'connect.php';

$response = ["success" => false, "message" => "Invalid request."];

if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['action'])) {
    $action = $_POST['action'];

    if ($action === "get") {
        try {
            $stmt = $pdo->prepare("SELECT setting_value FROM tbl_global_settings WHERE setting_key = 'credit_deduction_rate'");
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($result) {
                $response = ["success" => true, "credit_points" => $result['setting_value']];
            } else {
                // If setting doesn't exist, return a default value
                $response = ["success" => true, "credit_points" => "20", "message" => "Setting not found, returning default."];
            }
        } catch (PDOException $e) {
            $response = ["success" => false, "message" => "Database error: " . $e->getMessage()];
        }
    } elseif ($action === "update" && isset($_POST['credit_points'])) {
        $creditPoints = $_POST['credit_points'];

        if (!is_numeric($creditPoints) || $creditPoints < 0) {
            $response = ["success" => false, "message" => "Invalid credit point value. Must be a non-negative number."];
        } else {
            try {
                $stmt = $pdo->prepare("INSERT INTO tbl_global_settings (setting_key, setting_value) VALUES ('credit_deduction_rate', ?) ON DUPLICATE KEY UPDATE setting_value = ?");
                $stmt->execute([$creditPoints, $creditPoints]);

                $response = ["success" => true, "message" => "Credit points updated successfully."];
            } catch (PDOException $e) {
                $response = ["success" => false, "message" => "Database error: " . $e->getMessage()];
            }
        }
    }
}

echo json_encode($response);
?>

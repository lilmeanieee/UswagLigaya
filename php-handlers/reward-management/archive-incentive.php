<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../connect.php';

try {
    // Check if the request method is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['id']) || empty($input['id'])) {
        throw new Exception('Incentive ID is required');
    }

    $id = intval($input['id']);
    
    if ($id <= 0) {
        throw new Exception('Invalid incentive ID');
    }

    // Check if incentive exists - using correct table name tbl_rewards
    $check_sql = "SELECT reward_id, reward_name, is_active FROM tbl_rewards WHERE reward_id = :id";
    $check_stmt = $conn->prepare($check_sql);
    $check_stmt->bindParam(':id', $id);
    $check_stmt->execute();
    
    if ($check_stmt->rowCount() === 0) {
        throw new Exception('Incentive not found');
    }
    
    $incentive = $check_stmt->fetch(PDO::FETCH_ASSOC);

    // Check if already archived
    if ($incentive['is_active'] == 0) {
        throw new Exception('Incentive is already archived');
    }

    // Archive the incentive by setting is_active = 0 and adding is_archived flag if exists
    $sql = "UPDATE tbl_rewards SET 
            is_active = 0, 
            updated_at = NOW(),
            activation_date = NULL
            WHERE reward_id = :id";
    
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':id', $id);

    if ($stmt->execute()) {
        // Check if any rows were affected
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true,
                'message' => 'Incentive archived successfully'
            ]);
        } else {
            throw new Exception('No changes made to the incentive');
        }
    } else {
        throw new Exception('Failed to archive incentive in database');
    }

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    // Close connection
    if (isset($conn)) {
        $conn = null;
    }
}
?>
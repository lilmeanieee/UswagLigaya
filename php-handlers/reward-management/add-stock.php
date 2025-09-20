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
    
    // Validate required fields
    if (!isset($input['id']) || !isset($input['quantity_to_add'])) {
        throw new Exception('Reward ID and quantity to add are required');
    }

    $reward_id = intval($input['id']);
    $quantity_to_add = intval($input['quantity_to_add']);

    if ($quantity_to_add <= 0) {
        throw new Exception('Quantity to add must be greater than 0');
    }

    // First, get the current reward details
    $select_sql = "SELECT reward_id, reward_name, reward_type, quantity, event_date, status 
                   FROM tbl_rewards 
                   WHERE reward_id = ? AND is_active = 1";
    
    $select_stmt = mysqli_prepare($conn, $select_sql);
    if (!$select_stmt) {
        throw new Exception('Failed to prepare select statement: ' . mysqli_error($conn));
    }

    mysqli_stmt_bind_param($select_stmt, "i", $reward_id);
    mysqli_stmt_execute($select_stmt);
    $result = mysqli_stmt_get_result($select_stmt);
    $reward = mysqli_fetch_assoc($result);

    if (!$reward) {
        throw new Exception('Reward not found or inactive');
    }

    // Check if item has event date and validate
    if ($reward['event_date'] && ($reward['reward_type'] === 'Priority Stab' || $reward['reward_type'] === 'Event Ticket')) {
        $event_date = new DateTime($reward['event_date']);
        $current_date = new DateTime();
        $current_date->setTime(0, 0, 0); // Reset time to beginning of day
        
        if ($event_date <= $current_date) {
            throw new Exception('Cannot add stock to expired items. The service/event date has passed.');
        }
    }

    // Calculate new quantity
    $new_quantity = $reward['quantity'] + $quantity_to_add;
    
    // Determine new status
    $new_status = 'active';
    if ($reward['event_date'] && ($reward['reward_type'] === 'Priority Stab' || $reward['reward_type'] === 'Event Ticket')) {
        $event_date = new DateTime($reward['event_date']);
        $current_date = new DateTime();
        $current_date->setTime(0, 0, 0);
        
        if ($event_date <= $current_date) {
            $new_status = 'expired';
        }
    }

    // Update the quantity and status
    $update_sql = "UPDATE tbl_rewards 
                   SET quantity = ?, status = ?, updated_at = NOW()
                   WHERE reward_id = ? AND is_active = 1";
    
    $update_stmt = mysqli_prepare($conn, $update_sql);
    if (!$update_stmt) {
        throw new Exception('Failed to prepare update statement: ' . mysqli_error($conn));
    }

    mysqli_stmt_bind_param($update_stmt, "isi", $new_quantity, $new_status, $reward_id);
    $update_result = mysqli_stmt_execute($update_stmt);

    if (!$update_result) {
        throw new Exception('Failed to update stock: ' . mysqli_stmt_error($update_stmt));
    }

    // Log the stock addition (you can create a stock_logs table for this)
    $log_sql = "INSERT INTO tbl_stock_logs (reward_id, action_type, quantity_changed, old_quantity, new_quantity, created_at) 
                VALUES (?, 'stock_added', ?, ?, ?, NOW())";
    
    $log_stmt = mysqli_prepare($conn, $log_sql);
    if ($log_stmt) {
        mysqli_stmt_bind_param($log_stmt, "iiii", $reward_id, $quantity_to_add, $reward['quantity'], $new_quantity);
        mysqli_stmt_execute($log_stmt);
        mysqli_stmt_close($log_stmt);
    }

    echo json_encode([
        'success' => true,
        'message' => "Successfully added {$quantity_to_add} {$reward['reward_name']} to stock",
        'reward_name' => $reward['reward_name'],
        'old_quantity' => $reward['quantity'],
        'new_quantity' => $new_quantity,
        'quantity_added' => $quantity_to_add,
        'new_status' => $new_status
    ]);

    // Close statements
    mysqli_stmt_close($select_stmt);
    mysqli_stmt_close($update_stmt);

} catch (Exception $e) {
    error_log('Error in add-stock.php: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    // Close connection
    if (isset($conn)) {
        mysqli_close($conn);
    }
}
?>
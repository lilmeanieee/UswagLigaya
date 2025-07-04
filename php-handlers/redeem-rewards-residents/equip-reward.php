<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Only POST requests allowed']);
    exit;
}

include_once '../connect.php';
session_start();

try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['reward_id'])) {
        throw new Exception('Missing required parameters');
    }
    
    $reward_id = (int)$input['reward_id'];
    
    // Get resident_id from session
    if (!isset($_SESSION['resident_id'])) {
        throw new Exception('Resident authentication required');
    }
    
    $resident_id = (int)$_SESSION['resident_id'];
    
    // Start database transaction
    $pdo->beginTransaction();
    
    // Step 1: Validate that the reward belongs to the resident and get reward details
    $stmt = $pdo->prepare("
        SELECT r.reward_type, r.reward_name, rr.is_equipped
        FROM tbl_rewards r
        JOIN tbl_res_redeemed_rewards rr ON r.reward_id = rr.reward_id
        WHERE rr.resident_id = ? AND rr.reward_id = ?
    ");
    $stmt->execute([$resident_id, $reward_id]);
    $reward_details = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$reward_details) {
        throw new Exception('Reward not found or not owned by resident');
    }
    
    $reward_type = $reward_details['reward_type'];
    $reward_name = $reward_details['reward_name'];
    $current_equipped_status = $reward_details['is_equipped'];
    
    // Step 2: Verify reward type supports equipment changes
    if (!in_array($reward_type, ['frame', 'title'])) {
        throw new Exception('This reward type does not support equipment changes');
    }
    
    // Step 3: If already equipped, unequip it. If not equipped, equip it and unequip others of same type
    if ($current_equipped_status == 1) {
        // Unequip the current reward
        $stmt = $pdo->prepare("
            UPDATE tbl_res_redeemed_rewards 
            SET is_equipped = 0, updated_at = NOW()
            WHERE resident_id = ? AND reward_id = ?
        ");
        $stmt->execute([$resident_id, $reward_id]);
        
        $new_status = 0;
        $action = 'unequipped';
        
    } else {
        // First, unequip all rewards of the same type
        $stmt = $pdo->prepare("
            UPDATE tbl_res_redeemed_rewards rr
            JOIN tbl_rewards r ON rr.reward_id = r.reward_id
            SET rr.is_equipped = 0, rr.updated_at = NOW()
            WHERE rr.resident_id = ? 
            AND r.reward_type = ?
            AND rr.is_equipped = 1
        ");
        $stmt->execute([$resident_id, $reward_type]);
        
        // Then equip the selected reward
        $stmt = $pdo->prepare("
            UPDATE tbl_res_redeemed_rewards 
            SET is_equipped = 1, updated_at = NOW()
            WHERE resident_id = ? AND reward_id = ?
        ");
        $stmt->execute([$resident_id, $reward_id]);
        
        $new_status = 1;
        $action = 'equipped';
    }
    
    // Step 4: Optional - Log the equipment change
    $stmt = $pdo->prepare("
        INSERT INTO tbl_reward_equipment_log 
        (resident_id, reward_id, action, created_at) 
        VALUES (?, ?, ?, NOW())
    ");
    $stmt->execute([$resident_id, $reward_id, $action]);
    
    // Commit transaction
    $pdo->commit();
    
    // Step 5: Get updated equipped rewards for the resident
    $stmt = $pdo->prepare("
        SELECT r.reward_id, r.reward_name, r.reward_type, r.image_url
        FROM tbl_res_redeemed_rewards rr
        JOIN tbl_rewards r ON rr.reward_id = r.reward_id
        WHERE rr.resident_id = ? AND rr.is_equipped = 1
    ");
    $stmt->execute([$resident_id]);
    $equipped_rewards = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Separate by type for frontend
    $equipped_data = [
        'trophies' => [],
        'frame' => null,
        'title' => null
    ];
    
    foreach ($equipped_rewards as $reward) {
        if ($reward['reward_type'] == 'trophy') {
            $equipped_data['trophies'][] = $reward;
        } else if ($reward['reward_type'] == 'frame') {
            $equipped_data['frame'] = $reward;
        } else if ($reward['reward_type'] == 'title') {
            $equipped_data['title'] = $reward;
        }
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => ucfirst($reward_type) . ' ' . $action . ' successfully',
        'reward_name' => $reward_name,
        'reward_type' => $reward_type,
        'action' => $action,
        'is_equipped' => $new_status == 1,
        'equipped_rewards' => $equipped_data
    ]);
    
} catch (PDOException $e) {
    // Rollback transaction on database error
    if (isset($pdo)) {
        $pdo->rollback();
    }
    
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    // Rollback transaction on any other error
    if (isset($pdo)) {
        $pdo->rollback();
    }
    
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
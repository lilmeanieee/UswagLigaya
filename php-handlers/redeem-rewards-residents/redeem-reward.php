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
    
    // Step 1: Get resident's current points
    $stmt = $pdo->prepare("
        SELECT redeemable_points 
        FROM tbl_resident_participation_stats 
        WHERE resident_id = ?
    ");
    $stmt->execute([$resident_id]);
    $resident_stats = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$resident_stats) {
        throw new Exception('Resident stats not found');
    }
    
    $current_redeemable_points = (int)$resident_stats['redeemable_points'];
    
    // Step 2: Get reward details
    $stmt = $pdo->prepare("
        SELECT reward_id, reward_name, reward_type, points_required, description
        FROM tbl_rewards 
        WHERE reward_id = ? AND is_active = 1 AND is_archived = 0
    ");
    $stmt->execute([$reward_id]);
    $reward = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$reward) {
        throw new Exception('Reward not found or inactive');
    }
    
    $points_required = (int)$reward['points_required'];
    $reward_type = $reward['reward_type'];
    $reward_name = $reward['reward_name'];
    
    // Step 3: Point validation
    if ($current_redeemable_points < $points_required) {
        throw new Exception('Insufficient redeemable points');
    }
    
    // Step 4: Check if reward was already redeemed by this resident
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count
        FROM tbl_res_redeemed_rewards 
        WHERE resident_id = ? AND reward_id = ?
    ");
    $stmt->execute([$resident_id, $reward_id]);
    $already_redeemed = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    
    if ($already_redeemed > 0) {
        throw new Exception('Reward already redeemed');
    }
    
    // Step 5: Check if there's already an equipped reward of same type (for frames and titles)
    $equipped_check = ['count' => 0];
    $current_equipped = null;
    $needs_confirmation = false;
    
    if ($reward_type == 'frame' || $reward_type == 'title') {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM tbl_res_redeemed_rewards rr
            JOIN tbl_rewards r ON rr.reward_id = r.reward_id
            WHERE rr.resident_id = ? 
            AND r.reward_type = ? 
            AND rr.is_equipped = 1
        ");
        $stmt->execute([$resident_id, $reward_type]);
        $equipped_check = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($equipped_check['count'] > 0) {
            $needs_confirmation = true;
            
            // Get currently equipped item details
            $stmt = $pdo->prepare("
                SELECT r.reward_name, r.reward_type 
                FROM tbl_res_redeemed_rewards rr
                JOIN tbl_rewards r ON rr.reward_id = r.reward_id
                WHERE rr.resident_id = ? 
                AND r.reward_type = ? 
                AND rr.is_equipped = 1
            ");
            $stmt->execute([$resident_id, $reward_type]);
            $current_equipped = $stmt->fetch(PDO::FETCH_ASSOC);
        }
    }
    
    // Step 6: Determine initial equipment status
    $is_equipped = 0;
    if ($reward_type == 'trophy') {
        $is_equipped = 1; // Trophies are always equipped
    } else if ($reward_type == 'frame' || $reward_type == 'title') {
        $is_equipped = ($equipped_check['count'] == 0) ? 1 : 0; // Auto-equip if none equipped
    }
    
    // Step 7: Deduct points from resident
    $new_redeemable_points = $current_redeemable_points - $points_required;
    $stmt = $pdo->prepare("
        UPDATE tbl_resident_participation_stats 
        SET redeemable_points = ? 
        WHERE resident_id = ?
    ");
    $stmt->execute([$new_redeemable_points, $resident_id]);
    
    // Step 8: Record the redemption
    $stmt = $pdo->prepare("
        INSERT INTO tbl_res_redeemed_rewards 
        (resident_id, reward_id, points_used, redeemed_at, is_equipped, created_at, updated_at) 
        VALUES (?, ?, ?, NOW(), ?, NOW(), NOW())
    ");
    $stmt->execute([$resident_id, $reward_id, $points_required, $is_equipped]);
    
    // Step 9: If it's a frame or title and there was already one equipped, unequip the old one
    if (($reward_type == 'frame' || $reward_type == 'title') && $equipped_check['count'] > 0 && $is_equipped == 1) {
        $stmt = $pdo->prepare("
            UPDATE tbl_res_redeemed_rewards rr
            JOIN tbl_rewards r ON rr.reward_id = r.reward_id
            SET rr.is_equipped = 0, rr.updated_at = NOW()
            WHERE rr.resident_id = ? 
            AND r.reward_type = ? 
            AND rr.reward_id != ?
            AND rr.is_equipped = 1
        ");
        $stmt->execute([$resident_id, $reward_type, $reward_id]);
    }
    
    // Commit transaction
    $pdo->commit();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Reward redeemed successfully',
        'needs_confirmation' => $needs_confirmation,
        'auto_equipped' => $is_equipped == 1,
        'current_equipped' => $current_equipped,
        'new_reward' => [
            'reward_id' => $reward_id,
            'reward_name' => $reward_name,
            'reward_type' => $reward_type
        ],
        'reward_name' => $reward_name,
        'reward_type' => $reward_type,
        'points_used' => $points_required,
        'new_redeemable_points' => $new_redeemable_points,
        'is_equipped' => $is_equipped == 1
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
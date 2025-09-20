<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../connect.php';
session_start();

try {
    // Check if resident is authenticated
    if (!isset($_SESSION['resident_id'])) {
        throw new Exception('Resident authentication required');
    }
    
    $resident_id = (int)$_SESSION['resident_id'];
    $reward_id = $_GET['reward_id'] ?? null;
    
    if (!$reward_id) {
        throw new Exception('Reward ID is required');
    }
    
    $reward_id = (int)$reward_id;
    
    // Get redemption details including resident information
    $stmt = $pdo->prepare("
        SELECT 
            rr.id as redemption_id,
            rr.reward_id,
            rr.points_used,
            rr.redeemed_at,
            rr.is_equipped,
            r.reward_name,
            r.reward_type,
            r.description,
            r.points_required,
            res.first_name,
            res.last_name,
            res.resident_id as resident_number,
            res.barangay_id_number,
            stats.redeemable_points as current_balance
        FROM tbl_res_redeemed_rewards rr
        INNER JOIN tbl_rewards r ON rr.reward_id = r.reward_id
        INNER JOIN tbl_resident res ON rr.resident_id = res.resident_id
        LEFT JOIN tbl_resident_participation_stats stats ON rr.resident_id = stats.resident_id
        WHERE rr.resident_id = :resident_id 
            AND rr.reward_id = :reward_id
        ORDER BY rr.redeemed_at DESC
        LIMIT 1
    ");
    
    $stmt->bindParam(':resident_id', $resident_id, PDO::PARAM_INT);
    $stmt->bindParam(':reward_id', $reward_id, PDO::PARAM_INT);
    $stmt->execute();
    
    $redemption = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$redemption) {
        throw new Exception('Redemption record not found');
    }
    
    // Generate receipt number if not exists
    $receipt_number = 'RCP-' . date('Ymd', strtotime($redemption['redeemed_at'])) . '-' . 
                     str_pad($redemption['redemption_id'], 6, '0', STR_PAD_LEFT);
    
    // Calculate previous balance
    $previous_balance = $redemption['current_balance'] + $redemption['points_used'];
    
    // Format the redemption data for receipt
    $formatted_redemption = [
        'redemption_id' => $redemption['redemption_id'],
        'receipt_number' => $receipt_number,
        'reward_id' => $redemption['reward_id'],
        'reward_name' => $redemption['reward_name'],
        'reward_type' => ucfirst($redemption['reward_type']),
        'description' => $redemption['description'],
        'points_used' => $redemption['points_used'],
        'points_required' => $redemption['points_required'],
        'redeemed_at' => $redemption['redeemed_at'],
        'formatted_date' => date('F j, Y g:i A', strtotime($redemption['redeemed_at'])),
        'is_equipped' => $redemption['is_equipped'],
        'auto_equipped' => $redemption['is_equipped'] == 1,
        'resident_name' => trim($redemption['first_name'] . ' ' . $redemption['last_name']),
        'resident_id' => $redemption['resident_number'],
        'barangay_id_number' => $redemption['barangay_id_number'],
        'previous_balance' => $previous_balance,
        'new_redeemable_points' => $redemption['current_balance'],
        'transaction_type' => 'REWARD_REDEMPTION'
    ];
    
    echo json_encode([
        'success' => true,
        'redemption' => $formatted_redemption,
        'message' => 'Redemption details retrieved successfully'
    ]);
    
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
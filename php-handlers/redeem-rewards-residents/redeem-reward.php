<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Only POST requests allowed']);
    exit;
}

include_once '../connect.php';
try {
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['reward_id']) || !isset($input['user_id'])) {
        throw new Exception('Missing required parameters');
    }
    
    $reward_id = (int)$input['reward_id'];
    $user_id = (int)$input['user_id'];
    
    // Create PDO connection
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Start transaction
    $pdo->beginTransaction();
    
    // Get reward details
    $stmt = $pdo->prepare("SELECT points_required, reward_name FROM tbl_rewards WHERE reward_id = :reward_id AND status = 'Active'");
    $stmt->bindParam(':reward_id', $reward_id, PDO::PARAM_INT);
    $stmt->execute();
    $reward = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$reward) {
        throw new Exception('Reward not found or inactive');
    }
    
    // Get user's current points (you'll need to create a users table or modify this query)
    $stmt = $pdo->prepare("SELECT points_balance FROM users WHERE user_id = :user_id");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        throw new Exception('User not found');
    }
    
    if ($user['points_balance'] < $reward['points_required']) {
        throw new Exception('Insufficient points');
    }
    
    // Check if reward was already redeemed by this user (if you want to prevent duplicate redemptions)
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM user_rewards WHERE user_id = :user_id AND reward_id = :reward_id");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':reward_id', $reward_id, PDO::PARAM_INT);
    $stmt->execute();
    $already_redeemed = $stmt->fetchColumn();
    
    if ($already_redeemed > 0) {
        throw new Exception('Reward already redeemed');
    }
    
    // Deduct points from user
    $new_balance = $user['points_balance'] - $reward['points_required'];
    $stmt = $pdo->prepare("UPDATE users SET points_balance = :new_balance WHERE user_id = :user_id");
    $stmt->bindParam(':new_balance', $new_balance, PDO::PARAM_INT);
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->execute();
    
    // Record the redemption (you'll need to create this table)
    $stmt = $pdo->prepare("
        INSERT INTO user_rewards (user_id, reward_id, points_used, redeemed_at) 
        VALUES (:user_id, :reward_id, :points_used, NOW())
    ");
    $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
    $stmt->bindParam(':reward_id', $reward_id, PDO::PARAM_INT);
    $stmt->bindParam(':points_used', $reward['points_required'], PDO::PARAM_INT);
    $stmt->execute();
    
    // Commit transaction
    $pdo->commit();
    
    // Return success response
    echo json_encode([
        'success' => true,
        'message' => 'Reward redeemed successfully',
        'reward_name' => $reward['reward_name'],
        'points_used' => $reward['points_required'],
        'new_points_balance' => $new_balance
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
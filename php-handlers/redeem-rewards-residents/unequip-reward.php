<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Only POST requests allowed']);
    exit;
}

include_once '../connect.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['reward_id']) || !isset($input['resident_id'])) {
        throw new Exception('Missing required parameters');
    }
    
    $reward_id = (int)$input['reward_id'];
    $resident_id = (int)$input['resident_id'];
    
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Unequip the reward
    $stmt = $pdo->prepare("UPDATE tbl_res_redeemed_rewards SET is_equipped = 0, updated_at = NOW() WHERE resident_id = :resident_id AND reward_id = :reward_id AND is_equipped = 1");
    $stmt->bindParam(':resident_id', $resident_id, PDO::PARAM_INT);
    $stmt->bindParam(':reward_id', $reward_id, PDO::PARAM_INT);
    $stmt->execute();
    
    if ($stmt->rowCount() === 0) {
        throw new Exception('Reward is not currently equipped or not found');
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Reward unequipped successfully!'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
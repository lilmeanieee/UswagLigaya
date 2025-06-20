<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../connect.php';

try {
    
    
    // Get the tab parameter
    $tab = $_GET['tab'] ?? 'available';
    
    if ($tab === 'available') {
        // Fetch available rewards
        $stmt = $pdo->prepare("
            SELECT 
                reward_id,
                reward_name,
                reward_type,
                description,
                points_required,
                image_url,
                status,
                created_at
            FROM tbl_rewards 
            WHERE status = 'Active' 
            ORDER BY points_required ASC
        ");
        $stmt->execute();
        $rewards = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
    } else if ($tab === 'redeemed') {
        // Fetch redeemed rewards for the current user
        // You'll need to modify this query based on your user session/authentication system
        $user_id = $_SESSION['user_id'] ?? 1; // Replace with actual user ID from session
        
        $stmt = $pdo->prepare("
            SELECT 
                r.reward_id,
                r.reward_name,
                r.reward_type,
                r.description,
                r.points_required,
                r.image_url,
                ur.redeemed_at
            FROM tbl_rewards r
            INNER JOIN user_rewards ur ON r.reward_id = ur.reward_id
            WHERE ur.user_id = :user_id
            ORDER BY ur.redeemed_at DESC
        ");
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->execute();
        $rewards = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'rewards' => $rewards,
        'count' => count($rewards)
    ]);
    
} catch (PDOException $e) {
    // Return error response
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $e->getMessage(),
        'rewards' => []
    ]);
} catch (Exception $e) {
    // Return generic error response
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred: ' . $e->getMessage(),
        'rewards' => []
    ]);
}
?>
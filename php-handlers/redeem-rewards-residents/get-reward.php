<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../connect.php';
session_start();

try {
    // Get the tab parameter
    $tab = $_GET['tab'] ?? 'goods';
    $types = $_GET['types'] ?? '';
    
    // Log for debugging
    error_log("Tab: $tab, Types: $types");
    
    if ($tab === 'redeemed') {
        // Fetch redeemed rewards for the current user
        $resident_id = $_SESSION['resident_id'] ?? null;
        
        if (!$resident_id) {
            throw new Exception('Resident authentication required');
        }
        
        $stmt = $pdo->prepare("
            SELECT 
                r.reward_id,
                r.reward_name,
                r.reward_type,
                r.description,
                r.points_required,
                r.image_url,
                rr.redeemed_at,
                rr.is_equipped,
                rr.points_used
            FROM tbl_rewards r
            INNER JOIN tbl_res_redeemed_rewards rr ON r.reward_id = rr.reward_id
            WHERE rr.resident_id = :resident_id
            ORDER BY rr.redeemed_at DESC
        ");
        $stmt->bindParam(':resident_id', $resident_id, PDO::PARAM_INT);
        $stmt->execute();
        $rewards = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
    } else {
        // Fetch available rewards based on type filter
        $sql = "
            SELECT 
                reward_id,
                reward_name,
                reward_type,
                description,
                points_required,
                image_url,
                created_at
            FROM tbl_rewards 
            WHERE is_archived = 0 
                AND is_active = 1
                AND (activation_date IS NULL OR activation_date <= NOW())
                AND (expiration_date IS NULL OR expiration_date >= NOW())
        ";
        
        $params = [];
        
        // Add type filter if provided
        if (!empty($types)) {
            $typeArray = explode(',', $types);
            $typePlaceholders = str_repeat('?,', count($typeArray) - 1) . '?';
            $sql .= " AND reward_type IN ($typePlaceholders)";
            $params = $typeArray;
        }
        
        $sql .= " ORDER BY points_required ASC";
        
        // Log the final SQL for debugging
        error_log("SQL: $sql");
        error_log("Params: " . implode(', ', $params));
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        $rewards = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Log results for debugging
        error_log("Found " . count($rewards) . " rewards");
        if (count($rewards) > 0) {
            error_log("Sample reward types: " . implode(', ', array_unique(array_column($rewards, 'reward_type'))));
        }
    }
    
    // Return success response
    echo json_encode([
        'success' => true,
        'rewards' => $rewards,
        'count' => count($rewards),
        'tab' => $tab,
        'types_filter' => $types,
        'debug' => [
            'sql_executed' => isset($sql) ? $sql : 'N/A',
            'params' => $params ?? [],
            'reward_types_found' => array_unique(array_column($rewards, 'reward_type'))
        ]
    ]);
    
} catch (PDOException $e) {
    // Return error response
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed: ' . $e->getMessage(),
        'rewards' => [],
        'debug' => [
            'error_type' => 'PDOException',
            'error_message' => $e->getMessage()
        ]
    ]);
} catch (Exception $e) {
    // Return generic error response
    echo json_encode([
        'success' => false,
        'message' => 'An error occurred: ' . $e->getMessage(),
        'rewards' => [],
        'debug' => [
            'error_type' => 'Exception',
            'error_message' => $e->getMessage()
        ]
    ]);
}
?>
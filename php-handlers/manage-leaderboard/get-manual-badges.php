<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../connect.php'; // Adjust path if needed

try {
    // Check if resident_id is provided
    $resident_id = isset($_GET['resident_id']) ? (int)$_GET['resident_id'] : null;
    
    if (!$resident_id) {
        throw new Exception('Resident ID is required');
    }

    // SQL query to get badge data with awarded status for the specific resident
    $sql = "SELECT 
                b.badge_id,
                b.badge_name,
                b.badge_description,
                b.badge_icon,
                b.created_at,
                CASE 
                    WHEN rb.resident_id IS NOT NULL THEN 1 
                    ELSE 0 
                END as is_awarded
            FROM tbl_badges b
            LEFT JOIN tbl_resident_badges rb ON b.badge_id = rb.badge_id AND rb.resident_id = :resident_id
            WHERE b.constraint_type = 'manual' 
              AND b.is_active = 1 
              AND b.is_archived = 0
            ORDER BY b.badge_name ASC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':resident_id' => $resident_id]);
    $badges = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Append full icon URL and convert is_awarded to boolean
    $baseUrl = '/UswagLigaya/uploads/badge/'; 
    foreach ($badges as &$badge) {
        $badge['badge_icon_url'] = $baseUrl . $badge['badge_icon'];
        $badge['is_awarded'] = (bool)$badge['is_awarded'];
    }

    echo json_encode($badges);
} catch (PDOException $e) {
    error_log("Database error in get-manual-badges.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => 'Failed to fetch badges from database'
    ]);
} catch (Exception $e) {
    error_log("General error in get-manual-badges.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage()
    ]);
}
?>
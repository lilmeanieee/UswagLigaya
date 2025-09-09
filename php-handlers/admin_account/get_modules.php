<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Include database connection
include_once '../../php-handlers/connect.php';

try {
    // Prepare and execute query to get all active system modules
    $stmt = $pdo->prepare("SELECT module_id, module_code, module_name, module_description, is_active FROM tbl_system_modules WHERE is_active = 1 ORDER BY module_name");
    $stmt->execute();
    
    $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Return success response
    echo json_encode([
        'success' => true,
        'modules' => $modules
    ]);
    
} catch (PDOException $e) {
    // Return error response
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
    
} catch (Exception $e) {
    // Return general error response
    echo json_encode([
        'success' => false,
        'error' => 'Error: ' . $e->getMessage()
    ]);
}
?>
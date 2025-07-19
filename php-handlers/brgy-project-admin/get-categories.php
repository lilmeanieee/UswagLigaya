<?php
// get-categories.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors in output, but log them

try {
    // Check if the database connection file exists
    $connect_file = '../../php-handlers/connect.php';
    if (!file_exists($connect_file)) {
        throw new Exception("Database connection file not found: $connect_file");
    }
    
    include_once $connect_file;
    
    // Check if PDO connection exists
    if (!isset($pdo)) {
        throw new Exception("Database connection not established");
    }
    
    // Test the connection
    if (!$pdo) {
        throw new Exception("PDO connection is null");
    }
    
    // Check if the table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'tbl_project_categories'");
    if ($tableCheck->rowCount() == 0) {
        throw new Exception("Table 'tbl_project_categories' does not exist");
    }
    
    // Execute the main query
    $sql = "SELECT category_id, category_name FROM tbl_project_categories ORDER BY category_name";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Log the result for debugging
    error_log("Categories loaded: " . count($categories) . " categories found");
    
    echo json_encode([
        'success' => true,
        'categories' => $categories,
        'count' => count($categories)
    ]);
    
} catch (PDOException $e) {
    error_log("Database error in get-categories.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage(),
        'error_code' => $e->getCode()
    ]);
} catch (Exception $e) {
    error_log("General error in get-categories.php: " . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
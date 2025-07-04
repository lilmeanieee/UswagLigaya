<?php
// get-categories.php
header('Content-Type: application/json');
include_once '../../php-handlers/connect.php';

try {
    $sql = "SELECT category_id, category_name FROM tbl_category ORDER BY category_name";
    $stmt = $pdo->prepare($sql);
    $stmt->execute();
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'categories' => $categories
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to load categories'
    ]);
}
?>
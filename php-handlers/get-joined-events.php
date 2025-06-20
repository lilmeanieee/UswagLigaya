<?php
header('Content-Type: application/json');
ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    require_once('connect.php');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['error' => 'Invalid request method']);
        exit;
    }

    $residentId = $_POST['resident_id'] ?? null;

    if (!$residentId) {
        echo json_encode([]);
        exit;
    }

    // Get all volunteer events the resident has joined
    $stmt = $pdo->prepare("
        SELECT volunteer_announcement_id 
        FROM tbl_volunteer_participation
        WHERE resident_id = :resident_id
    ");
    $stmt->execute(['resident_id' => $residentId]);
    
    $joinedEvents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format response as a simple array of IDs
    $result = [];
    foreach ($joinedEvents as $event) {
        $result[] = $event['volunteer_announcement_id'];
    }
    
    echo json_encode($result);

} catch (PDOException $e) {
    error_log("Error in get-joined-events.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
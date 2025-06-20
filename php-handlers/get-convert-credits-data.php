<?php
session_start();
include 'connect.php'; // Adjust path as needed

header('Content-Type: application/json');

// First try to get resident_id from POST, then from SESSION
$resident_id = $_POST['resident_id'] ?? $_SESSION['resident_id'] ?? null;

if (!$resident_id) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Resident ID not provided'
    ]);
    exit;
}

try {
    // Check if we have a mysqli connection
    if (isset($conn) && $conn instanceof mysqli) {
        // Using MySQLi style
        
        // Query for resident points
        $statsQuery = "SELECT credit_points, redeemable_points FROM tbl_resident_participation_stats WHERE resident_id = ?";
        $statsStmt = $conn->prepare($statsQuery);
        $statsStmt->bind_param("i", $resident_id);
        $statsStmt->execute();
        $statsResult = $statsStmt->get_result();
        $resident = $statsResult->fetch_assoc();
        $statsStmt->close();
        
        if (!$resident) {
            throw new Exception("Resident stats not found");
        }
        
        // Get latest conversion settings
        $convQuery = "SELECT credit_points, redeemable_points, minimum_points_required FROM tbl_conversion_settings ORDER BY effective_date DESC LIMIT 1";
        $convStmt = $conn->prepare($convQuery);
        $convStmt->execute();
        $convResult = $convStmt->get_result();
        $conversion = $convResult->fetch_assoc();
        $convStmt->close();
        
        if (!$conversion) {
            throw new Exception("Conversion settings not found");
        }
        
        echo json_encode([
            'status' => 'success',
            'credit_points' => (int)$resident['credit_points'],
            'redeemable_points' => (int)$resident['redeemable_points'],
            'minimum_points_required' => (float)$conversion['minimum_points_required'],
            'credit_points_rate' => (float)$conversion['credit_points'],
            'redeemable_points_rate' => (float)$conversion['redeemable_points']
        ]);
    } else {
        // Assuming PDO connection as fallback
        // Query for resident points
        $statsQuery = "SELECT credit_points, redeemable_points FROM tbl_resident_participation_stats WHERE resident_id = ?";
        $statsStmt = $conn->prepare($statsQuery);
        $statsStmt->execute([$resident_id]);
        $resident = $statsStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$resident) {
            throw new Exception("Resident stats not found");
        }
        
        // Get latest conversion settings
        $convQuery = "SELECT credit_points, redeemable_points, minimum_points_required FROM tbl_conversion_settings ORDER BY effective_date DESC LIMIT 1";
        $convStmt = $conn->prepare($convQuery);
        $convStmt->execute();
        $conversion = $convStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$conversion) {
            throw new Exception("Conversion settings not found");
        }
        
        echo json_encode([
            'status' => 'success',
            'credit_points' => (int)$resident['credit_points'],
            'redeemable_points' => (int)$resident['redeemable_points'],
            'minimum_points_required' => (float)$conversion['minimum_points_required'],
            'credit_points_rate' => (float)$conversion['credit_points'],
            'redeemable_points_rate' => (float)$conversion['redeemable_points']
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
?>
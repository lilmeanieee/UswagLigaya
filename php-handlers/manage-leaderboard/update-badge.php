<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../connect.php'; 

try {
   
    // Check if request method is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method is allowed');
    }
    
    // Validate required fields
    if (!isset($_POST['badgeId']) || empty($_POST['badgeId'])) {
        throw new Exception('Badge ID is required for updating');
    }
    
    if (!isset($_POST['badgeName']) || empty(trim($_POST['badgeName']))) {
        throw new Exception('Badge name is required');
    }
    
    if (!isset($_POST['constraintType']) || empty($_POST['constraintType'])) {
        throw new Exception('Constraint type is required');
    }
    
    // Get form data
    $badgeId = intval($_POST['badgeId']);
    $badgeName = trim($_POST['badgeName']);
    $badgeDescription = isset($_POST['badgeDescription']) ? trim($_POST['badgeDescription']) : '';
    $constraintType = $_POST['constraintType'];
    $isActive = isset($_POST['isActive']) ? (bool)$_POST['isActive'] : true;
    $activationDate = isset($_POST['activationDate']) && !empty($_POST['activationDate']) ? $_POST['activationDate'] : null;
    $expirationDate = isset($_POST['expirationDate']) && !empty($_POST['expirationDate']) ? $_POST['expirationDate'] : null;
    
    // Validate constraint type
    $validConstraintTypes = ['points', 'events', 'ranking', 'manual'];
    if (!in_array($constraintType, $validConstraintTypes)) {
        throw new Exception('Invalid constraint type');
    }
    
    // Initialize constraint-specific fields
    $pointsThreshold = null;
    $eventsCount = null;
    $rankingPosition = null;
    $rankingType = null;
    
    // Validate and set constraint-specific data
    switch ($constraintType) {
        case 'points':
            if (!isset($_POST['pointsThreshold']) || empty($_POST['pointsThreshold']) || intval($_POST['pointsThreshold']) <= 0) {
                throw new Exception('Valid points threshold is required for points constraint');
            }
            $pointsThreshold = intval($_POST['pointsThreshold']);
            break;
            
        case 'events':
            if (!isset($_POST['eventsCount']) || empty($_POST['eventsCount']) || intval($_POST['eventsCount']) <= 0) {
                throw new Exception('Valid events count is required for events constraint');
            }
            $eventsCount = intval($_POST['eventsCount']);
            break;
            
        case 'ranking':
            if (!isset($_POST['rankingPosition']) || empty($_POST['rankingPosition']) || intval($_POST['rankingPosition']) <= 0) {
                throw new Exception('Valid ranking position is required for ranking constraint');
            }
            $rankingPosition = intval($_POST['rankingPosition']);
            $rankingType = isset($_POST['rankingType']) && !empty($_POST['rankingType']) ? $_POST['rankingType'] : 'overall';
            
            // Validate ranking type
            $validRankingTypes = ['overall', 'monthly', 'event'];
            if (!in_array($rankingType, $validRankingTypes)) {
                throw new Exception('Invalid ranking type');
            }
            break;
            
        case 'manual':
            // No additional validation needed for manual constraint
            break;
    }
    
    // Validate dates
    if ($activationDate && !DateTime::createFromFormat('Y-m-d', $activationDate)) {
        throw new Exception('Invalid activation date format');
    }
    
    if ($expirationDate && !DateTime::createFromFormat('Y-m-d', $expirationDate)) {
        throw new Exception('Invalid expiration date format');
    }
    
    // Check if expiration date is after activation date (if both are set)
    if ($activationDate && $expirationDate) {
        $activationDateTime = new DateTime($activationDate);
        $expirationDateTime = new DateTime($expirationDate);
        
        if ($expirationDateTime <= $activationDateTime) {
            throw new Exception('Expiration date must be after activation date');
        }
    }
    
    // Check if badge exists
    $checkStmt = $pdo->prepare("SELECT badge_id, badge_icon FROM tbl_badges WHERE badge_id = ?");
    $checkStmt->execute([$badgeId]);
    $existingBadge = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$existingBadge) {
        throw new Exception('Badge not found');
    }
    
    // Handle file upload for badge icon
    $badgeIcon = $existingBadge['badge_icon']; // Keep existing icon by default
    $uploadPath = '../../uploads/badge/'; // Adjust path as needed
    
    // Create upload directory if it doesn't exist
    if (!file_exists($uploadPath)) {
        mkdir($uploadPath, 0755, true);
    }
    
    if (isset($_FILES['badgeIcon']) && $_FILES['badgeIcon']['error'] === UPLOAD_ERR_OK) {
        $uploadedFile = $_FILES['badgeIcon'];
        
        // Validate file type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $fileType = $uploadedFile['type'];
        
        if (!in_array($fileType, $allowedTypes)) {
            throw new Exception('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
        }
        
        // Validate file size (max 5MB)
        $maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if ($uploadedFile['size'] > $maxSize) {
            throw new Exception('File size exceeds 5MB limit');
        }
        
        // Generate unique filename
        $fileExtension = pathinfo($uploadedFile['name'], PATHINFO_EXTENSION);
        $fileName = 'badge_' . $badgeId . '_' . time() . '.' . $fileExtension;
        $targetPath = $uploadPath . $fileName;
        
        // Move uploaded file
        if (move_uploaded_file($uploadedFile['tmp_name'], $targetPath)) {
            // Delete old icon file if it exists and is different
            if ($existingBadge['badge_icon'] && file_exists($uploadPath . basename($existingBadge['badge_icon']))) {
                unlink($uploadPath . basename($existingBadge['badge_icon']));
            }
            $badgeIcon = $fileName;
        } else {
            throw new Exception('Failed to upload badge icon');
        }
    } elseif (isset($_POST['useDefault']) && $_POST['useDefault'] === 'true') {
        // Delete existing icon file if using default
        if ($existingBadge['badge_icon'] && file_exists($uploadPath . basename($existingBadge['badge_icon']))) {
            unlink($uploadPath . basename($existingBadge['badge_icon']));
        }
        $badgeIcon = null;
    }
    
    // Prepare SQL statement for updating badge
    $sql = "UPDATE tbl_badges SET 
            badge_name = ?, 
            badge_description = ?, 
            badge_icon = ?, 
            constraint_type = ?, 
            points_threshold = ?, 
            events_count = ?, 
            ranking_position = ?, 
            ranking_type = ?, 
            is_active = ?, 
            activation_date = ?, 
            expiration_date = ?,
            updated_at = CURRENT_TIMESTAMP
            WHERE badge_id = ?";
    
    $stmt = $pdo->prepare($sql);
    
    // Execute the statement
    $result = $stmt->execute([
        $badgeName,
        $badgeDescription,
        $badgeIcon,
        $constraintType,
        $pointsThreshold,
        $eventsCount,
        $rankingPosition,
        $rankingType,
        $isActive ? 1 : 0,
        $activationDate,
        $expirationDate,
        $badgeId
    ]);
    
    if ($result) {
        // Return success response
        echo json_encode([
            'success' => true,
            'message' => 'Badge updated successfully',
            'badgeId' => $badgeId
        ]);
    } else {
        throw new Exception('Failed to update badge in database');
    }
    
} catch (PDOException $e) {
    // Database error
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    // General error
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
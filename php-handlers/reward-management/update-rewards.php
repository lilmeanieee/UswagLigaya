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
    if (!isset($_POST['rewardId']) || empty($_POST['rewardId'])) {
        throw new Exception('Reward ID is required for updating');
    }
    
    if (!isset($_POST['rewardName']) || empty(trim($_POST['rewardName']))) {
        throw new Exception('Reward name is required');
    }
    
    if (!isset($_POST['constraintType']) || empty($_POST['constraintType'])) {
        throw new Exception('Constraint type is required');
    }
    
    // Get form data
    $rewardId = intval($_POST['rewardId']);
    $rewardName = trim($_POST['rewardName']);
    $rewardDescription = isset($_POST['rewardDescription']) ? trim($_POST['rewardDescription']) : '';
    $isActive = isset($_POST['isActive']) ? (bool)$_POST['isActive'] : true;
    $activationDate = isset($_POST['activationDate']) && !empty($_POST['activationDate']) ? $_POST['activationDate'] : null;
    $expirationDate = isset($_POST['expirationDate']) && !empty($_POST['expirationDate']) ? $_POST['expirationDate'] : null;
    
    
    
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
    
    // Check if reward exists
    $checkStmt = $pdo->prepare("SELECT reward_id, image_url FROM tbl_rewards WHERE reward_id = ?");
    $checkStmt->execute([$rewardId]);
    $existingReward = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$existingReward) {
        throw new Exception('Reward not found');
    }
    
    // Handle file upload for reward icon
    $RewardIcon = $existingReward['image_url']; // Keep existing icon by default
    $uploadPath = '../../uploads/rewards/'; // Adjust path as needed
    
    // Create upload directory if it doesn't exist
    if (!file_exists($uploadPath)) {
        mkdir($uploadPath, 0755, true);
    }
    
    if (isset($_FILES['rewadIcon']) && $_FILES['rewardIcon']['error'] === UPLOAD_ERR_OK) {
        $uploadedFile = $_FILES['rewardIcon'];
        
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
        $fileName = 'reward' . $rewardId . '_' . time() . '.' . $fileExtension;
        $targetPath = $uploadPath . $fileName;
        
        // Move uploaded file
        if (move_uploaded_file($uploadedFile['tmp_name'], $targetPath)) {
            // Delete old icon file if it exists and is different
            if ($existingReward['image_url'] && file_exists($uploadPath . basename($existingReward['image_url']))) {
                unlink($uploadPath . basename($existingReward['image_url']));
            }
            $rewardIcon = $fileName;
        } else {
            throw new Exception('Failed to upload reward icon');
        }
    } elseif (isset($_POST['useDefault']) && $_POST['useDefault'] === 'true') {
        // Delete existing icon file if using default
        if ($existingReward['image_url'] && file_exists($uploadPath . basename($existingReward['image_url']))) {
            unlink($uploadPath . basename($existingReward['image_url']));
        }
        $rewardIcon = null;
    }
    
    // Prepare SQL statement for updating reward
    $sql = "UPDATE tbl_rewards SET 
            reward_name = ?, 
            description = ?, 
            image_url = ?, 
            is_active = ?, 
            activation_date = ?, 
            expiration_date = ?,
            updated_at = CURRENT_TIMESTAMP
            WHERE reward_id = ?";
    
    $stmt = $pdo->prepare($sql);
    
    // Execute the statement
    $result = $stmt->execute([
        $rewardName,
        $rewardDescription,
        $rewardIcon,
        $isActive ? 1 : 0,
        $activationDate,
        $expirationDate,
        $rewardId
    ]);
    
    if ($result) {
        // Return success response
        echo json_encode([
            'success' => true,
            'message' => 'Reward updated successfully',
            'rewardId' => $rewardId
        ]);
    } else {
        throw new Exception('Failed to update reward in database');
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
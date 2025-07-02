<?php
header('Content-Type: text/plain');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../connect.php';
date_default_timezone_set('Asia/Manila');

try {
    if (!$conn) {
        throw new Exception("Database connection failed.");
    }
    // Required fields validation
    $requiredFields = ['rewardName', 'rewardType', 'rewardDescription', 'rewardPoints'];
    foreach ($requiredFields as $field) {
        if (empty(trim($_POST[$field] ?? ''))) {
            throw new Exception("Missing required field: $field");
        }
    }

    // Image validation
    if (!isset($_FILES['rewardImage']) || $_FILES['rewardImage']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception("Image upload failed or not provided");
    }

    // Extract and sanitize form data
    $rewardName = trim($_POST['rewardName']);
    $rewardType = trim($_POST['rewardType']);
    $rewardDescription = trim($_POST['rewardDescription']);
    $rewardPoints = (int) $_POST['rewardPoints'];

    // Reward type and point validation
    $allowedTypes = ['trophy', 'frame', 'title'];
    if (!in_array($rewardType, $allowedTypes)) {
        throw new Exception("Invalid reward type");
    }

    if ($rewardPoints <= 0) {
        throw new Exception("Points must be greater than zero");
    }

    // File upload handling
    $uploadDir = '../../uploads/rewards/';
    if (!file_exists($uploadDir) && !mkdir($uploadDir, 0755, true)) {
        throw new Exception("Failed to create upload directory");
    }

    $file = $_FILES['rewardImage'];
    $fileName = $file['name'];
    $fileTmpName = $file['tmp_name'];
    $fileSize = $file['size'];
    $fileExt = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!in_array($fileExt, $allowedExtensions)) {
        throw new Exception("Invalid file type. Allowed: JPG, JPEG, PNG, GIF, WEBP");
    }

    if ($fileSize > 5 * 1024 * 1024) {
        throw new Exception("File too large. Max allowed is 5MB");
    }

    // Process other fields
    $isActive = isset($_POST['isActive']) ? (int)$_POST['isActive'] : 0;
    $activationDate = !empty($_POST['activationDate']) ? $_POST['activationDate'] : null;
    $expirationDate = !empty($_POST['expirationDate']) ? $_POST['expirationDate'] : null;

    // Validate dates if provided
    if ($activationDate && !DateTime::createFromFormat('Y-m-d', $activationDate)) {
        echo json_encode(['success' => false, 'error' => 'Invalid activation date format']);
        exit;
    }

    if ($expirationDate && !DateTime::createFromFormat('Y-m-d', $expirationDate)) {
        echo json_encode(['success' => false, 'error' => 'Invalid expiration date format']);
        exit;
    }


    // Unique filename
    $newFileName = uniqid('reward_', true) . '.' . $fileExt;
    $uploadPath = $uploadDir . $newFileName;

    if (!move_uploaded_file($fileTmpName, $uploadPath)) {
        throw new Exception("Failed to upload image");
    }

    // Insert into database - MySQLi VERSION
    $sql = "INSERT INTO tbl_rewards 
        (reward_name, reward_type, description, points_required, image_url, created_at, is_active, activation_date, expiration_date)
        VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);
    
    // Prepare values
    $createdAt = date('Y-m-d H:i:s');
    
    // MySQLi uses bind_param() with type string
    // s = string, si = integer, d = double, b = blob
$stmt->bind_param("sssississ", 
    $rewardName,         // s
    $rewardType,         // s
    $rewardDescription,  // s
    $rewardPoints,       // i
    $newFileName,        // s
    $createdAt,          // s
    $isActive,           // i
    $activationDate,     // s
    $expirationDate      // s
);


    if ($stmt->execute()) {
        echo "Reward added successfully! Image saved as: $newFileName";
    } else {
        if (file_exists($uploadPath)) {
            unlink($uploadPath);
        }
        throw new Exception("Failed to save reward to database");
    }

} catch (Exception $e) {
    http_response_code(400);
    echo "Caught Exception at: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo "Error: " . $e->getMessage();
} finally {
    // Close connection
    if (isset($conn)) {
        $conn = null;
    }
}
?>
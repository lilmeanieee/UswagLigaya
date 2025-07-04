<?php
// Set content type to JSON
header('Content-Type: application/json');

// Include database connection
require_once '../connect.php';

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

// Validate required fields
if (empty($_POST['badgeName']) || empty($_POST['constraintType'])) {
    echo json_encode(['success' => false, 'error' => 'Badge name and constraint type are required']);
    exit;
}

// Extract and sanitize posted data
$badgeName = trim($_POST['badgeName']);
$badgeDescription = trim($_POST['badgeDescription']);
$constraintType = $_POST['constraintType'];

// Validate and process constraint-specific data
$pointsThreshold = null;
$eventsCount = null;
$rankingPosition = null;
$rankingType = null;

switch ($constraintType) {
    case 'points':
        if (empty($_POST['pointsThreshold']) || !is_numeric($_POST['pointsThreshold'])) {
            echo json_encode(['success' => false, 'error' => 'Valid points threshold is required']);
            exit;
        }
        $pointsThreshold = (int)$_POST['pointsThreshold'];
        break;
        
    case 'events':
        if (empty($_POST['eventsCount']) || !is_numeric($_POST['eventsCount'])) {
            echo json_encode(['success' => false, 'error' => 'Valid events count is required']);
            exit;
        }
        $eventsCount = (int)$_POST['eventsCount'];
        break;
        
    case 'ranking':
        if (empty($_POST['rankingPosition']) || !is_numeric($_POST['rankingPosition'])) {
            echo json_encode(['success' => false, 'error' => 'Valid ranking position is required']);
            exit;
        }
        $rankingPosition = (int)$_POST['rankingPosition'];
        $rankingType = !empty($_POST['rankingType']) ? $_POST['rankingType'] : 'overall';
        break;
        
    case 'manual':
        // No additional validation needed for manual
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Invalid constraint type']);
        exit;
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

// Ensure folders exist
$uploadBase = '../../uploads/';
$uploadDir = $uploadBase . 'badge/';

if (!file_exists($uploadBase)) {
    if (!mkdir($uploadBase, 0755, true)) {
        echo json_encode(['success' => false, 'error' => 'Failed to create uploads directory']);
        exit;
    }
}

if (!file_exists($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        echo json_encode(['success' => false, 'error' => 'Failed to create badge directory']);
        exit;
    }
}

$badgeIcon = null;

// Handle file upload
if (isset($_FILES['badgeIcon']) && $_FILES['badgeIcon']['error'] === UPLOAD_ERR_OK) {
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $fileType = $_FILES['badgeIcon']['type'];
    
    if (!in_array($fileType, $allowedTypes)) {
        echo json_encode(['success' => false, 'error' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed']);
        exit;
    }
    
    $maxSize = 5 * 1024 * 1024; // 5MB
    if ($_FILES['badgeIcon']['size'] > $maxSize) {
        echo json_encode(['success' => false, 'error' => 'File size too large. Maximum 5MB allowed']);
        exit;
    }
    
    $originalName = basename($_FILES['badgeIcon']['name']);
    $extension = pathinfo($originalName, PATHINFO_EXTENSION);
    $filenameOnly = pathinfo($originalName, PATHINFO_FILENAME);
    
    // Sanitize filename
    $filenameOnly = preg_replace('/[^a-zA-Z0-9_-]/', '_', $filenameOnly);
    
    $finalName = $filenameOnly . '.' . $extension;
    $targetPath = $uploadDir . $finalName;
    $counter = 1;

    // Check for duplicates and rename
    while (file_exists($targetPath)) {
        $finalName = $filenameOnly . '_' . $counter . '.' . $extension;
        $targetPath = $uploadDir . $finalName;
        $counter++;
    }

    if (move_uploaded_file($_FILES['badgeIcon']['tmp_name'], $targetPath)) {
        $badgeIcon = $finalName;
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to upload icon']);
        exit;
    }
} elseif (isset($_POST['useDefault']) && $_POST['useDefault'] === 'true') {
    $badgeIcon = 'default.png';
}

// Debug logging
error_log("Badge data: " . print_r([
    'badgeName' => $badgeName,
    'badgeDescription' => $badgeDescription,
    'badgeIcon' => $badgeIcon,
    'constraintType' => $constraintType,
    'pointsThreshold' => $pointsThreshold,
    'eventsCount' => $eventsCount,
    'rankingPosition' => $rankingPosition,
    'rankingType' => $rankingType,
    'isActive' => $isActive,
    'activationDate' => $activationDate,
    'expirationDate' => $expirationDate
], true));

// Prepare SQL statement
$sql = "INSERT INTO tbl_badges 
    (badge_name, badge_description, badge_icon, constraint_type, points_threshold, events_count, ranking_position, ranking_type, is_active, activation_date, expiration_date) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode(['success' => false, 'error' => 'Database prepare failed: ' . $conn->error]);
    exit;
}

// Bind parameters
$stmt->bind_param(
    "ssssiiisiss", 
    $badgeName,
    $badgeDescription,
    $badgeIcon,
    $constraintType,
    $pointsThreshold,
    $eventsCount,
    $rankingPosition,
    $rankingType,
    $isActive,
    $activationDate,
    $expirationDate
);

// Execute statement
if ($stmt->execute()) {
    echo json_encode([
        'success' => true, 
        'message' => 'Badge added successfully',
        'badge_id' => $conn->insert_id
    ]);
} else {
    error_log("Database error: " . $stmt->error);
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
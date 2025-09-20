<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../connect.php';

try {
    // Check if the request method is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Invalid request method');
    }

    // Validate required fields
    $required_fields = ['name', 'category', 'quantity', 'unit', 'points_required'];
    foreach ($required_fields as $field) {
        if (!isset($_POST[$field]) || empty(trim($_POST[$field]))) {
            throw new Exception("Field '$field' is required");
        }
    }

    // Sanitize input data
    $reward_name = trim($_POST['name']);
    $reward_type = trim($_POST['category']); // Using category input as reward_type
    $quantity = intval($_POST['quantity']);
    $unit = trim($_POST['unit']);
    $points_required = intval($_POST['points_required']);
    $description = isset($_POST['description']) ? trim($_POST['description']) : '';
    $event_date = isset($_POST['event_date']) ? trim($_POST['event_date']) : null;
    $event_time = isset($_POST['event_time']) ? trim($_POST['event_time']) : null;
    $low_stock_threshold = isset($_POST['low_stock_threshold']) ? intval($_POST['low_stock_threshold']) : 5;

    // Validate data types and ranges
    if ($quantity < 0) {
        throw new Exception('Quantity must be a positive number');
    }

    if ($points_required < 1) {
        throw new Exception('Points required must be greater than 0');
    }

    // Validate event date for Priority Stab and Event Ticket
    if (($reward_type === 'Priority Stab' || $reward_type === 'Event Ticket')) {
        if (empty($event_date)) {
            $dateType = ($reward_type === 'Priority Stab') ? 'Service' : 'Event';
            throw new Exception($dateType . ' date is required for ' . $reward_type);
        }

        // Validate that the date is in the future
        $eventDateTime = new DateTime($event_date);
        $currentDate = new DateTime();
        $currentDate->setTime(0, 0, 0); // Reset time to beginning of day
        
        if ($eventDateTime <= $currentDate) {
            throw new Exception('Event/Service date must be in the future');
        }
    } else {
        // For 'Goods', event_date should be null
        $event_date = null;
        $event_time = null;
    }

    // Determine initial item_status (changed from status to item_status)
    $item_status = 'active';
    if ($quantity === 0) {
        $item_status = 'active'; // Even if quantity is 0, set as active but will show as out of stock in frontend
    }

    // Handle file upload - make it truly optional
    $image_url = '../../asset/img/default.png'; // Default image path
    
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK && !empty($_FILES['image']['tmp_name'])) {
        // Validate file type
        $allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        $file_type = $_FILES['image']['type'];
        
        if (!in_array($file_type, $allowed_types)) {
            throw new Exception('Invalid file type. Only JPEG, PNG, and GIF files are allowed.');
        }

        // Validate file size (max 5MB)
        $max_size = 5 * 1024 * 1024; // 5MB in bytes
        if ($_FILES['image']['size'] > $max_size) {
            throw new Exception('File size too large. Maximum size is 5MB.');
        }

        // Create upload directory if it doesn't exist
        $upload_dir = '../../uploads/incentives/';
        if (!is_dir($upload_dir)) {
            if (!mkdir($upload_dir, 0755, true)) {
                throw new Exception('Failed to create upload directory');
            }
        }

        // Generate unique filename
        $file_extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $filename = 'reward_' . time() . '_' . uniqid() . '.' . $file_extension;
        $target_path = $upload_dir . $filename;

        // Move uploaded file
        if (move_uploaded_file($_FILES['image']['tmp_name'], $target_path)) {
            $image_url = $target_path;
        } else {
            // If upload fails, keep the default image instead of throwing an error
            error_log('Failed to upload image, using default image instead');
        }
    }

    // Updated SQL query to use item_status instead of status
    $sql = "INSERT INTO tbl_rewards (reward_name, reward_type, description, points_required, image_url, quantity, unit, event_date, event_time, low_stock_threshold, item_status, created_at, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 1)";
    
    $stmt = mysqli_prepare($conn, $sql);
    if (!$stmt) {
        throw new Exception('Failed to prepare SQL statement: ' . mysqli_error($conn));
    }
    
    // Bind parameters (s=string, i=integer) - updated to use item_status
    mysqli_stmt_bind_param($stmt, "sssissssiis", 
        $reward_name,
        $reward_type,
        $description,
        $points_required,
        $image_url,
        $quantity,
        $unit,
        $event_date,
        $event_time,
        $low_stock_threshold,
        $item_status // Changed from $status to $item_status
    );
    
    $result = mysqli_stmt_execute($stmt);

    if ($result) {
        // Use mysqli_insert_id for MySQLi connections
        $reward_id = mysqli_insert_id($conn);
        
        echo json_encode([
            'success' => true,
            'message' => 'Incentive added successfully',
            'reward_id' => $reward_id,
            'image_url' => $image_url,
            'item_status' => $item_status // Changed from status to item_status
        ]);
    } else {
        throw new Exception('Failed to insert reward into database: ' . mysqli_stmt_error($stmt));
    }

    // Close statement
    mysqli_stmt_close($stmt);

} catch (Exception $e) {
    error_log('Error in add-incentive.php: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
} finally {
    // Close connection
    if (isset($conn)) {
        mysqli_close($conn);
    }
}
?>
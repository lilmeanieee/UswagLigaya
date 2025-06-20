<?php
// Show PHP errors (for debugging)
file_put_contents("debug_post.log", print_r($_POST, true));
file_put_contents("debug_files.log", print_r($_FILES, true));
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);


// Function to get or insert category
function getOrInsertCategory($pdo, $category) {
    // Check if category exists
    $stmt = $pdo->prepare("SELECT category_id FROM tbl_announcement_category WHERE category_name = ?");
    $stmt->execute([$category]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    // If category exists, return the category_id
    if ($result) {
        return $result['category_id'];
    }

    // Insert new category if not found
    $stmt = $pdo->prepare("INSERT INTO tbl_announcement_category (category_name) VALUES (?)");
    $stmt->execute([$category]);

    // Return the newly inserted category_id
    return $pdo->lastInsertId();
}

// Function to get or insert target audience
function getOrInsertTargetAudience($pdo, $targetAudience) {
    // Check if target audience exists
    $stmt = $pdo->prepare("SELECT target_audience_id FROM tbl_target_audience WHERE target_audience_name = ?");
    $stmt->execute([$targetAudience]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    // If target audience exists, return the target_audience_id
    if ($result) {
        return $result['target_audience_id'];
    }

    // Insert new target audience if not found
    $stmt = $pdo->prepare("INSERT INTO tbl_target_audience (target_audience_name) VALUES (?)");
    $stmt->execute([$targetAudience]);

    // Return the newly inserted target_audience_id
    return $pdo->lastInsertId();
}

// Check if the request is POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Debug: Check what's coming in the POST request
    error_log("POST data: " . print_r($_POST, true));
    
    // Get form values
    $categoryType = $_POST['announcementCategory'] ?? '';
    $targetAudience = $_POST['target_audience'] ?? '';
    $title = $_POST['upEvent_title'] ?? '';
    $details = $_POST['upEvent_details'] ?? '';
    
    // Handle location with "other" option
    $locationCategory = $_POST['upEventLocationCategory'] ?? '';
    $locationInput = $_POST['upEventLocationInputOption'] ?? '';

    // Validate that the custom location field is filled when "other" is selected
    if ($locationCategory === 'other' && empty($locationInput)) {
        // Return an error and stop execution
        http_response_code(400); // Bad request
        echo 'Please specify a location when selecting "Other".';
        exit; // Stop further processing
    }

    // If location is "other", use the custom input text instead
    if ($locationCategory === 'other') {
        $location = $locationInput;
    } else {
        $location = $locationCategory;
    }
    
    $date = $_POST['date'] ?? '';
    $time_start = $_POST['time_start'] ?? '';
    $time_end = $_POST['time_end'] ?? '';

    // Handle uploaded file
    $file = $_FILES['upEvent_file'] ?? null;
    $fileName = '';
    if ($file && $file['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../uploads/upcoming_events/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $fileName = time() . '_' . basename($file['name']);
        $filePath = $uploadDir . $fileName;
        move_uploaded_file($file['tmp_name'], $filePath);

        // Extract file extension and save as file_type
        $fileType = pathinfo($file['name'], PATHINFO_EXTENSION);
    }

    try {
        // Create database connection
        require_once("connect.php");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Begin transaction for data consistency
        $pdo->beginTransaction();
        
        // Get or insert the category and get its ID
        $categoryId = getOrInsertCategory($pdo, $categoryType);

        // Get or insert the target audience and get its ID
        $targetAudienceId = getOrInsertTargetAudience($pdo, $targetAudience);

        // Insert the upcoming event announcement into the table
        $stmt = $pdo->prepare("INSERT INTO tbl_upcoming_event_announcement 
        (category_id, target_audience_id, upEvent_title, upEvent_details, file_name, file_type, upEvent_location, event_date, upEvent_timeStart, upEvent_timeEnd)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $categoryId,
            $targetAudienceId,
            $title,
            $details,
            $fileName,
            $fileType,  // Add the file type here
            $location,
            $date,
            $time_start,
            $time_end
        ]);
        
        // Commit the transaction
        $pdo->commit();

        echo 'Success';
    } catch (PDOException $e) {
        // Roll back if there was an error
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        
        http_response_code(500);
        echo 'Database error: ' . $e->getMessage();
        error_log('Database error: ' . $e->getMessage());
    }
} else {
    http_response_code(405);
    echo 'Invalid request method';
}

<?php
session_start();
header('Content-Type: application/json');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require_once 'connect.php';

// Get type and ID
$type = $_POST['type'] ?? '';
$id = $_POST['id'] ?? ''; // Use this instead of generic 'announcement_id'

// Map types to tables and their ID columns
$tableMap = [
    'Upcoming Event' => ['table' => 'tbl_upcoming_event_announcement', 'id_column' => 'upcoming_event_id'],
    'News and Update' => ['table' => 'tbl_news_update_announcement', 'id_column' => 'news_update_id'],
    'Barangay Volunteer Drive' => ['table' => 'tbl_volunteer_drive', 'id_column' => 'volunteer_drive_id']
];

// Make sure we have a valid type
if (!isset($tableMap[$type])) {
    echo json_encode(['success' => false, 'message' => 'Invalid announcement type']);
    exit;
}

$table = $tableMap[$type]['table'];
$idColumn = $tableMap[$type]['id_column'];

// Function to get or insert category from tbl_announcement_category
function getOrInsertAnnouncementCategory($conn, $category) {
    $stmt = $conn->prepare("SELECT category_id FROM tbl_announcement_category WHERE category_name = ?");
    $stmt->bind_param("s", $category);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result->fetch_assoc();

    if ($data) {
        return $data['category_id'];
    }

    $stmt = $conn->prepare("INSERT INTO tbl_announcement_category (category_name) VALUES (?)");
    $stmt->bind_param("s", $category);
    $stmt->execute();
    return $conn->insert_id;
}

// Function to get or insert category from tbl_news_update_category
function getOrInsertNewsUpdateCategory($conn, $category) {
    $stmt = $conn->prepare("SELECT news_update_category_id FROM tbl_news_update_category WHERE news_update_category_name = ?");
    $stmt->bind_param("s", $category);
    $stmt->execute();
    $result = $stmt->get_result();
    $data = $result->fetch_assoc();

    if ($data) {
        return $data['news_update_category_id'];
    }

    $stmt = $conn->prepare("INSERT INTO tbl_news_update_category (news_update_category_name) VALUES (?)");
    $stmt->bind_param("s", $category);
    $stmt->execute();
    return $conn->insert_id;
}

        try {
            $updateFields = [];
            $params = [];
            $types = "";

            // Handle different fields based on announcement type
            switch ($type) {
                case 'Upcoming Event':
                    // Event-specific fields
                    if (isset($_POST['event_title'])) {
                        $updateFields[] = "upEvent_title = ?";  // Change to upEvent_title
                        $params[] = $_POST['event_title'];
                        $types .= "s";
                    }
                    
                    if (isset($_POST['event_details'])) {
                        $updateFields[] = "upEvent_details = ?";  // Change to upEvent_details
                        $params[] = $_POST['event_details'];
                        $types .= "s";
                    }
                    
                    // Fix field names for location and times
                    if (isset($_POST['location'])) {
                        $updateFields[] = "upEvent_location = ?";  // Change to upEvent_location
                        $params[] = $_POST['location'];
                        $types .= "s";
                    }
                    
                    if (isset($_POST['event_date'])) {
                        $updateFields[] = "event_date = ?";  // This seems correct
                        $params[] = $_POST['event_date'];
                        $types .= "s";
                    }
                    
                    if (isset($_POST['time_start'])) {
                        $updateFields[] = "upEvent_timeStart = ?";  // Change to upEvent_timeStart
                        $params[] = $_POST['time_start'];
                        $types .= "s";
                    }
                    
                    if (isset($_POST['time_end'])) {
                        $updateFields[] = "upEvent_timeEnd = ?";  // Change to upEvent_timeEnd
                        $params[] = $_POST['time_end'];
                        $types .= "s";
                    }
                    
                    // Handle target audience
                    if (isset($_POST['target_audience']) && !empty($_POST['target_audience'])) {
                        // Function to get or insert target audience
                        function getOrInsertTargetAudience($conn, $targetAudience) {
                            $stmt = $conn->prepare("SELECT target_audience_id FROM tbl_target_audience WHERE target_audience_name = ?");
                            $stmt->bind_param("s", $targetAudience);
                            $stmt->execute(); 
                            $result = $stmt->get_result();
                            $data = $result->fetch_assoc();

                            if ($data) {
                                return $data['target_audience_id'];
                            }

                            $stmt = $conn->prepare("INSERT INTO tbl_target_audience (target_audience_name) VALUES (?)");
                            $stmt->bind_param("s", $targetAudience);
                            $stmt->execute();
                            return $conn->insert_id;
                        }
                        
                        $targetAudienceId = getOrInsertTargetAudience($conn, $_POST['target_audience']);
                        $updateFields[] = "target_audience_id = ?";
                        $params[] = $targetAudienceId;
                        $types .= "i";
                    }
                    
                    
                    
                    // Handle category
                    if (isset($_POST['announcementCategory']) && !empty($_POST['announcementCategory'])) {
                        $categoryId = getOrInsertAnnouncementCategory($conn, $_POST['announcementCategory']);
                        $updateFields[] = "category_id = ?";
                        $params[] = $categoryId;
                        $types .= "i";
                    }
                    
              
                    // File upload
                if (isset($_FILES['event_file']) && $_FILES['event_file']['error'] === UPLOAD_ERR_OK) {
                    $uploadDir = '../uploads/upcoming_events/';  // Match the path in insert file
                    if (!is_dir($uploadDir)) {
                        mkdir($uploadDir, 0777, true);
                    }
                    
                    $fileName = time() . '_' . basename($_FILES['event_file']['name']);
                    $filePath = $uploadDir . $fileName;
                    $fileType = pathinfo($_FILES['event_file']['name'], PATHINFO_EXTENSION);
                    
                    // Get old file to delete it
                    $stmt = $conn->prepare("SELECT file_name FROM $table WHERE $idColumn = ?");
                    $stmt->bind_param("i", $id);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $oldFile = $result->fetch_assoc()['file_name'] ?? null;
                    
                    if (move_uploaded_file($_FILES['event_file']['tmp_name'], $filePath)) {
                        $updateFields[] = "file_name = ?";
                        $params[] = $fileName;
                        $types .= "s";
                        
                        $updateFields[] = "file_type = ?";
                        $params[] = $fileType;
                        $types .= "s";
                        
                        // Delete old file if it exists
                        if ($oldFile) {
                            $oldFilePath = $uploadDir . $oldFile;
                            if (file_exists($oldFilePath)) {
                                unlink($oldFilePath);
                            }
                        }
                    }
                }   
                    break;
            
        case 'News and Update':
            // News-specific fields
            if (isset($_POST['news_title'])) {
                $updateFields[] = "news_update_title = ?";
                $params[] = $_POST['news_title'];
                $types .= "s";
            }
            
            if (isset($_POST['news_source'])) {
                $updateFields[] = "news_source = ?";
                $params[] = $_POST['news_source'];
                $types .= "s";
            }
            
            if (isset($_POST['news_details'])) {
                $updateFields[] = "news_update_details = ?";
                $params[] = $_POST['news_details'];
                $types .= "s";
            }
            
            // Handle categories
            if (isset($_POST['announcementCategory']) && !empty($_POST['announcementCategory'])) {
                $categoryId = getOrInsertAnnouncementCategory($conn, $_POST['announcementCategory']);
                $updateFields[] = "category_id = ?";
                $params[] = $categoryId;
                $types .= "i";
            }
            
            if (isset($_POST['categoryNewsUpdate']) && !empty($_POST['categoryNewsUpdate'])) {
                $newsUpdateCategoryId = getOrInsertNewsUpdateCategory($conn, $_POST['categoryNewsUpdate']);
                $updateFields[] = "news_update_category_id = ?";
                $params[] = $newsUpdateCategoryId;
                $types .= "i";
            }
            
            // File upload
            if (isset($_FILES['news_file']) && $_FILES['news_file']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = '../uploads/news_updates/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                $fileName = time() . '_' . basename($_FILES['news_file']['name']);
                $filePath = $uploadDir . $fileName;
                $fileType = pathinfo($_FILES['news_file']['name'], PATHINFO_EXTENSION);
                
                // Get old file to delete it
                $stmt = $conn->prepare("SELECT file_name FROM $table WHERE $idColumn = ?");
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $result = $stmt->get_result();
                $oldFile = $result->fetch_assoc()['file_name'] ?? null;
                
                if (move_uploaded_file($_FILES['news_file']['tmp_name'], $filePath)) {
                    $updateFields[] = "file_name = ?";
                    $params[] = $fileName;
                    $types .= "s";
                    
                    $updateFields[] = "file_type = ?";
                    $params[] = $fileType;
                    $types .= "s";
                    
                    // Delete old file if it exists
                    if ($oldFile) {
                        $oldFilePath = $uploadDir . $oldFile;
                        if (file_exists($oldFilePath)) {
                            unlink($oldFilePath);
                        }
                    }
                }
            }
            break;
            
        case 'Barangay Volunteer Drive':
            // Volunteer-specific fields
            if (isset($_POST['volunteer_title'])) {
                $updateFields[] = "volunteer_title = ?";
                $params[] = $_POST['volunteer_title'];
                $types .= "s";
            }
            
            if (isset($_POST['volunteer_details'])) {
                $updateFields[] = "volunteer_details = ?";
                $params[] = $_POST['volunteer_details'];
                $types .= "s";
            }
            
            foreach (['location', 'volunteer_date', 'deadline', 'time_start', 'time_end', 'exp_points', 'redeem_points', 'eligibility'] as $field) {
                if (isset($_POST[$field])) {
                    $updateFields[] = "$field = ?";
                    $params[] = $_POST[$field];
                    $types .= "s";
                }
            }
            
            // Handle category
            if (isset($_POST['announcementCategory']) && !empty($_POST['announcementCategory'])) {
                $categoryId = getOrInsertAnnouncementCategory($conn, $_POST['announcementCategory']);
                $updateFields[] = "category_id = ?";
                $params[] = $categoryId;
                $types .= "i";
            }
            
            // File upload
            if (isset($_FILES['volunteer_file']) && $_FILES['volunteer_file']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = '../uploads/volunteer_drives/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }
                
                $fileName = time() . '_' . basename($_FILES['volunteer_file']['name']);
                $filePath = $uploadDir . $fileName;
                $fileType = pathinfo($_FILES['volunteer_file']['name'], PATHINFO_EXTENSION);
                
                // Get old file to delete it
                $stmt = $conn->prepare("SELECT file_name FROM $table WHERE $idColumn = ?");
                $stmt->bind_param("i", $id);
                $stmt->execute();
                $result = $stmt->get_result();
                $oldFile = $result->fetch_assoc()['file_name'] ?? null;
                
                if (move_uploaded_file($_FILES['volunteer_file']['tmp_name'], $filePath)) {
                    $updateFields[] = "file_name = ?";
                    $params[] = $fileName;
                    $types .= "s";
                    
                    $updateFields[] = "file_type = ?";
                    $params[] = $fileType;
                    $types .= "s";
                    
                    // Delete old file if it exists
                    if ($oldFile) {
                        $oldFilePath = $uploadDir . $oldFile;
                        if (file_exists($oldFilePath)) {
                            unlink($oldFilePath);
                        }
                    }
                }
            }
            break;
    }
    
    // Add updated timestamp
    $updateFields[] = "updated_at = NOW()";
    
    if (empty($updateFields)) {
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        exit;
    }
    
    $sql = "UPDATE $table SET " . implode(", ", $updateFields) . " WHERE $idColumn = ?";
    $params[] = $id;
    $types .= "i";
    
    // Execute update
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'Prepare failed: ' . $conn->error]);
        exit;
    }
    
    $stmt->bind_param($types, ...$params);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => $stmt->affected_rows > 0 
                ? $type . ' announcement updated successfully' 
                : 'No changes made to ' . $type
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Execute failed: ' . $stmt->error]);
    }
    
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}

$conn->close();
?>
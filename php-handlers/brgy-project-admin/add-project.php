<?php
// add-project.php
session_start();
header('Content-Type: application/json');

// Add error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

include_once '../../php-handlers/connect.php';

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Log incoming data for debugging
error_log("POST data: " . print_r($_POST, true));
error_log("FILES data: " . print_r($_FILES, true));

$project_name = trim($_POST['project_name'] ?? '');
$category = $_POST['category'] ?? '';
$description = trim($_POST['description'] ?? '');
$location = trim($_POST['location'] ?? '');
$start_date = $_POST['start_date'] ?? '';
$expected_completion = $_POST['expected_completion'] ?? '';
$initial_budget = $_POST['initial_budget'] ?? null;
$funding_source = trim($_POST['funding_source'] ?? '');
$responsible_person = trim($_POST['responsible_person'] ?? '');
$project_stages = $_POST['project_stages'] ?? [];

// Validate required fields
$errors = [];

if (empty($project_name)) {
    $errors[] = 'Project name is required';
}

if (empty($category) || $category === 'Select category...') {
    $errors[] = 'Category is required';
}

if (empty($description)) {
    $errors[] = 'Description is required';
}

if (empty($location)) {
    $errors[] = 'Location is required';
}

if (empty($start_date)) {
    $errors[] = 'Start date is required';
}

if (empty($expected_completion)) {
    $errors[] = 'Expected completion date is required';
}

if (empty($responsible_person)) {
    $errors[] = 'Responsible person is required';
}

// Validate date format and logic
if (!empty($start_date) && !empty($expected_completion)) {
    $start_date_obj = DateTime::createFromFormat('Y-m-d', $start_date);
    $end_date_obj = DateTime::createFromFormat('Y-m-d', $expected_completion);
    
    if (!$start_date_obj || !$end_date_obj) {
        $errors[] = 'Invalid date format';
    } elseif ($start_date_obj >= $end_date_obj) {
        $errors[] = 'Expected completion date must be after start date';
    }
}

// Validate budget if provided
if (!empty($initial_budget)) {
    if (!is_numeric($initial_budget) || floatval($initial_budget) < 0) {
        $errors[] = 'Initial budget must be a valid positive number';
    }
}

// Check if there are validation errors
if (!empty($errors)) {
    echo json_encode([
        'success' => false, 
        'message' => implode(', ', $errors)
    ]);
    exit;
}

try {
    // Check if PDO connection exists
    if (!isset($pdo)) {
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }
    
    // Start transaction
    $pdo->beginTransaction();
    
    // Map category names to IDs
    $category_id = null;
    switch (strtolower($category)) {
        case 'infrastructure':
            $category_id = 1;
            break;
        case 'public service':
            $category_id = 2;
            break;
        case 'health & wellness':
            $category_id = 3;
            break;
        case 'education':
            $category_id = 4;
            break;
        default:
            // If it's already a number, use it as is
            if (is_numeric($category)) {
                $category_id = intval($category);
            } else {
                throw new Exception('Invalid category selected');
            }
    }
    
    // Create project directory for images
    $project_dir = '../../uploads/brgy_projects/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $project_name);
    if (!is_dir($project_dir)) {
        if (!mkdir($project_dir, 0755, true)) {
            throw new Exception('Failed to create project directory');
        }
    }
    
    // Handle image uploads
    $uploaded_images = [];
    if (isset($_FILES['project_images']) && !empty($_FILES['project_images']['name'][0])) {
        $files = $_FILES['project_images'];
        $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'tiff'];
        
        for ($i = 0; $i < count($files['name']); $i++) {
            if ($files['error'][$i] === UPLOAD_ERR_OK) {
                $file_name = $files['name'][$i];
                $file_tmp = $files['tmp_name'][$i];
                $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
                
                // Validate file extension
                if (!in_array($file_ext, $allowed_extensions)) {
                    throw new Exception("Invalid file type: {$file_name}");
                }
                
                // Generate unique filename
                $unique_name = uniqid() . '_' . time() . '.' . $file_ext;
                $file_path = $project_dir . '/' . $unique_name;
                
                // Move uploaded file
                if (move_uploaded_file($file_tmp, $file_path)) {
                    $uploaded_images[] = $unique_name;
                } else {
                    throw new Exception("Failed to upload image: {$file_name}");
                }
            }
        }
    }
    
    // Convert uploaded images array to JSON string for database storage
    $project_images_json = !empty($uploaded_images) ? json_encode($uploaded_images) : null;
    
    // Prepare insert statement for project (without project_image)
$sql = "INSERT INTO tbl_projects (
    project_name, 
    category_id, 
    description, 
    location,
    start_date, 
    expected_completion, 
    initial_budget, 
    funding_source, 
    responsible_person, 
    status, 
    progress_percentage,
    created_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Not Started', 0, NOW())";

$stmt = $pdo->prepare($sql);
$result = $stmt->execute([
    $project_name,
    $category_id,
    $description,
    $location,
    $start_date,
    $expected_completion,
    !empty($initial_budget) ? floatval($initial_budget) : null,
    $funding_source,
    $responsible_person
]);

if (!$result) {
    throw new Exception('Failed to create project');
}

$project_id = $pdo->lastInsertId();

// Store images in tbl_project_images
if (!empty($uploaded_images)) {
    $image_insert_sql = "INSERT INTO tbl_project_images (project_id, image_filename, file_size) VALUES (?, ?, ?)";
    $image_stmt = $pdo->prepare($image_insert_sql);

    foreach ($uploaded_images as $filename) {
        $file_path = $project_dir . '/' . $filename;
        $relative_path = 'uploads/brgy_projects/' . basename($project_dir) . '/' . $filename;
        $file_size = file_exists($file_path) ? filesize($file_path) : 0;

        $image_result = $image_stmt->execute([
            $project_id,
            $relative_path,
            $file_size
        ]);

        if (!$image_result) {
            throw new Exception('Failed to insert image record: ' . $filename);
        }
    }
}

    
    // Execute the statement
    $result = $stmt->execute([
        $project_name,
        $category_id,
        $description,
        $location,
        $start_date,
        $expected_completion,
        !empty($initial_budget) ? floatval($initial_budget) : null,
        $funding_source,
        $responsible_person,
        $project_images_json
    ]);
    
    if (!$result) {
        throw new Exception('Failed to create project');
    }
    
    $project_id = $pdo->lastInsertId();
    
    // Insert project stages
    if (!empty($project_stages) && is_array($project_stages)) {
        $stage_sql = "INSERT INTO tbl_project_stages (
            project_id, 
            stage_name, 
            start_date, 
            end_date, 
            status, 
            created_at
        ) VALUES (?, ?, ?, ?, ?, NOW())";
        
        $stage_stmt = $pdo->prepare($stage_sql);
        
        // Get current date for comparison
        $current_date = date('Y-m-d');
        
        foreach ($project_stages as $index => $stage_name) {
            $stage_name = trim($stage_name);
            if (!empty($stage_name)) {
                if ($index === 0) {
                    // First stage gets the project's start_date
                    $stage_start_date = $start_date;
                    $stage_end_date = '0000-00-00';
                    
                    // Check if start date is today or in the past
                    if ($start_date <= $current_date) {
                        $stage_status = 'In Progress';
                    } else {
                        $stage_status = 'Not Started';
                    }
                } else {
                    // Other stages get default values
                    $stage_start_date = '0000-00-00';
                    $stage_end_date = '0000-00-00';
                    $stage_status = 'Not Started';
                }
                
                $stage_result = $stage_stmt->execute([
                    $project_id,
                    $stage_name,
                    $stage_start_date,
                    $stage_end_date,
                    $stage_status
                ]);
                
                if (!$stage_result) {
                    throw new Exception('Failed to create project stage: ' . $stage_name);
                }
            }
        }
    }
    
    // Commit transaction
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Project created successfully with all details',
        'project_id' => $project_id,
        'uploaded_images' => $uploaded_images
    ]);
    
} catch (PDOException $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Clean up uploaded files on error
    if (!empty($uploaded_images)) {
        foreach ($uploaded_images as $image) {
            $file_path = $project_dir . '/' . $image;
            if (file_exists($file_path)) {
                unlink($file_path);
            }
        }
    }
    
    // Log the error for debugging
    error_log("Database error in add-project.php: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Clean up uploaded files on error
    if (!empty($uploaded_images)) {
        foreach ($uploaded_images as $image) {
            $file_path = $project_dir . '/' . $image;
            if (file_exists($file_path)) {
                unlink($file_path);
            }
        }
    }
    
    // Log the error for debugging
    error_log("General error in add-project.php: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'An unexpected error occurred: ' . $e->getMessage()
    ]);
}
?>
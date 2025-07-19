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
    
    // Determine project status based on start date
    $current_date = date('Y-m-d');
    $project_status = ($start_date <= $current_date) ? 'Ongoing' : 'Not Started';
    
    // Create project directory for images - FIXED: Use consistent naming
    $project_name_sanitized = preg_replace('/[^a-zA-Z0-9_-]/', '_', $project_name);
    $project_dir = '../../uploads/brgy_projects/' . $project_name_sanitized;
    
    // Ensure the base uploads directory exists
    $base_upload_dir = '../../uploads/brgy_projects';
    if (!is_dir($base_upload_dir)) {
        if (!mkdir($base_upload_dir, 0755, true)) {
            throw new Exception('Failed to create base upload directory');
        }
    }
    
    if (!is_dir($project_dir)) {
        if (!mkdir($project_dir, 0755, true)) {
            throw new Exception('Failed to create project directory');
        }
    }
    
    // Handle image uploads
    $uploaded_images = [];
    $uploaded_image_info = []; // Store additional info for debugging
    
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
                    
                    // Store additional info for debugging
                    $uploaded_image_info[] = [
                        'original_name' => $file_name,
                        'unique_name' => $unique_name,
                        'file_path' => $file_path,
                        'file_size' => filesize($file_path)
                    ];
                } else {
                    throw new Exception("Failed to upload image: {$file_name}");
                }
            }
        }
    }
    
    // Insert project into main table with determined status
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
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())";

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
        $responsible_person,
        $project_status
    ]);

    if (!$result) {
        throw new Exception('Failed to create project');
    }

    $project_id = $pdo->lastInsertId();

    // Store images in tbl_project_images - FIXED: Consistent path format
       if (!empty($uploaded_images)) {
        $image_insert_sql = "INSERT INTO tbl_project_images (project_id, image_filename, file_size) VALUES (?, ?, ?)";
        $image_stmt = $pdo->prepare($image_insert_sql);

        foreach ($uploaded_image_info as $image_info) {
            // FIXED: Store only the filename (consistent with update-project.php)
            $image_result = $image_stmt->execute([
                $project_id,
                $image_info['unique_name'], // Store only filename, not full path
                $image_info['file_size']
            ]);

            if (!$image_result) {
                throw new Exception('Failed to insert image record: ' . $image_info['unique_name']);
            }
            
            // Log the stored filename for debugging
            error_log("Stored image filename in database: " . $image_info['unique_name']);
        }
    }

        
    // Insert project stages with stage_order - MODIFIED to include stage_order
    if (!empty($project_stages) && is_array($project_stages)) {
        $stage_sql = "INSERT INTO tbl_project_stages (
            project_id, 
            stage_order,
            stage_name, 
            start_date, 
            end_date, 
            status, 
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())";
        
        $stage_stmt = $pdo->prepare($stage_sql);
        
        foreach ($project_stages as $index => $stage_name) {
            $stage_name = trim($stage_name);
            if (!empty($stage_name)) {
                $stage_order = ($index + 1) * 10;
                
                if ($index === 0) {
                    // First stage logic based on project start date
                    if ($start_date <= $current_date) {
                        // Project starts today or in the past - first stage is Ongoing
                        $stage_start_date = $start_date; // Use project's start date
                        $stage_status = 'Ongoing';
                    } else {
                        // Project starts in the future - first stage is Not Started
                        $stage_start_date = '0000-00-00';
                        $stage_status = 'Not Started';
                    }
                    $stage_end_date = '0000-00-00';
                } else {
                    // Other stages remain Not Started regardless
                    $stage_start_date = '0000-00-00';
                    $stage_end_date = '0000-00-00';
                    $stage_status = 'Not Started';
                }
                
                $stage_result = $stage_stmt->execute([
                    $project_id,
                    $stage_order, // NEW: Include stage order
                    $stage_name,
                    $stage_start_date,
                    $stage_end_date,
                    $stage_status
                ]);
                
                if (!$stage_result) {
                    throw new Exception('Failed to create project stage: ' . $stage_name);
                }
                
                // Log the stage order for debugging
                error_log("Created stage '{$stage_name}' with order: {$stage_order}");
            }
        }
    }
    
    // Commit transaction
    $pdo->commit();
    
    // ADDED: Retrieve the created project with images to verify storage
    $verify_sql = "SELECT pi.image_filename FROM tbl_project_images pi WHERE pi.project_id = ?";
    $verify_stmt = $pdo->prepare($verify_sql);
    $verify_stmt->execute([$project_id]);
    $stored_images = $verify_stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // ADDED: Retrieve created stages with their orders for verification
    $verify_stages_sql = "SELECT stage_name, stage_order FROM tbl_project_stages WHERE project_id = ? ORDER BY stage_order";
    $verify_stages_stmt = $pdo->prepare($verify_stages_sql);
    $verify_stages_stmt->execute([$project_id]);
    $created_stages = $verify_stages_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => 'Project created successfully with all details',
        'project_id' => $project_id,
        'project_status' => $project_status,
        'uploaded_images' => $uploaded_images,
        'created_stages' => $created_stages // NEW: Include created stages info
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
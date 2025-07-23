<?php
// update-project.php
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

// Get form data
$project_id = $_POST['project_id'] ?? '';
$project_name = trim($_POST['project_name'] ?? '');
$category = $_POST['category'] ?? '';
$description = trim($_POST['description'] ?? '');
$location = trim($_POST['location'] ?? '');
$status = $_POST['status'] ?? 'Not Started';
$start_date = $_POST['start_date'] ?? '';
$expected_completion = $_POST['expected_completion'] ?? '';
$initial_budget = $_POST['initial_budget'] ?? null;
$progress_percentage = $_POST['progress_percentage'] ?? 0;
$funding_source = trim($_POST['funding_source'] ?? '');
$responsible_person = trim($_POST['responsible_person'] ?? '');
$removed_images = $_POST['removed_images'] ?? '';

// Stage data
$stage_ids = $_POST['stage_ids'] ?? [];
$stage_names = $_POST['stage_names'] ?? [];
$stage_status = $_POST['stage_status'] ?? [];
$stage_start_dates = $_POST['stage_start_dates'] ?? [];
$stage_end_dates = $_POST['stage_end_dates'] ?? [];

// Validate required fields
$errors = [];

if (empty($project_id) || !is_numeric($project_id)) {
    $errors[] = 'Valid project ID is required';
}

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

// Validate progress percentage
if (!is_numeric($progress_percentage) || floatval($progress_percentage) < 0 || floatval($progress_percentage) > 100) {
    $errors[] = 'Progress percentage must be between 0 and 100';
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
    
    // Get current project data
    $current_project_sql = "SELECT project_name, project_image FROM tbl_projects WHERE project_id = ?";
    $current_project_stmt = $pdo->prepare($current_project_sql);
    $current_project_stmt->execute([$project_id]);
    $current_project = $current_project_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$current_project) {
        throw new Exception('Project not found');
    }
    
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
    
    // Handle image management
    $current_images = [];
    if (!empty($current_project['project_image'])) {
        $decoded_images = json_decode($current_project['project_image'], true);
        if (is_array($decoded_images)) {
            $current_images = $decoded_images;
        }
    }
    
    // Remove deleted images
    $images_to_remove = [];
    if (!empty($removed_images)) {
        $images_to_remove = explode(',', $removed_images);
        $current_images = array_diff($current_images, $images_to_remove);
    }
    
    // Create project directory for new images
    $project_dir = '../../uploads/brgy_projects/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $project_name);
    if (!is_dir($project_dir)) {
        if (!mkdir($project_dir, 0755, true)) {
            throw new Exception('Failed to create project directory');
        }
    }
    
    // Handle new image uploads
    $new_uploaded_images = [];
    if (isset($_FILES['new_images']) && !empty($_FILES['new_images']['name'][0])) {
        $files = $_FILES['new_images'];
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
                    $new_uploaded_images[] = $unique_name;
                } else {
                    throw new Exception("Failed to upload image: {$file_name}");
                }
            }
        }
    }
    
    // Combine current images with new images
    $all_images = array_merge($current_images, $new_uploaded_images);
    $project_images_json = !empty($all_images) ? json_encode(array_values($all_images)) : null;
    
    // Update project
    $update_sql = "UPDATE tbl_projects SET 
                   project_name = ?, 
                   category_id = ?, 
                   description = ?, 
                   location = ?,
                   status = ?, 
                   start_date = ?, 
                   expected_completion = ?, 
                   initial_budget = ?, 
                   progress_percentage = ?,
                   funding_source = ?, 
                   responsible_person = ?, 
                   project_image = ?,
                   updated_at = NOW()
                   WHERE project_id = ?";

    $update_stmt = $pdo->prepare($update_sql);
    
    $result = $update_stmt->execute([
        $project_name,
        $category_id,
        $description,
        $location,
        $status,
        $start_date,
        $expected_completion,
        !empty($initial_budget) ? floatval($initial_budget) : null,
        floatval($progress_percentage),
        $funding_source,
        $responsible_person,
        $project_images_json,
        $project_id
    ]);
    
    if (!$result) {
        throw new Exception('Failed to update project');
    }
    
    // Handle project stages
    if (!empty($stage_names) && is_array($stage_names)) {
        // Process existing and new stages
        for ($i = 0; $i < count($stage_names); $i++) {
            $stage_name = trim($stage_names[$i]);
            if (empty($stage_name)) continue;
            
            $stage_id = !empty($stage_ids[$i]) ? $stage_ids[$i] : null;
            $stage_stat = $stage_status[$i] ?? 'Not Started';
            $stage_start = !empty($stage_start_dates[$i]) ? $stage_start_dates[$i] : '0000-00-00';
            $stage_end = !empty($stage_end_dates[$i]) ? $stage_end_dates[$i] : '0000-00-00';
            
            if ($stage_id && is_numeric($stage_id)) {
                // Update existing stage
                $update_stage_sql = "UPDATE tbl_project_stages SET 
                                   stage_name = ?, 
                                   status = ?, 
                                   start_date = ?, 
                                   end_date = ?, 
                                   updated_at = NOW()
                                   WHERE stage_id = ? AND project_id = ?";
                
                $update_stage_stmt = $pdo->prepare($update_stage_sql);
                $update_stage_stmt->execute([
                    $stage_name,
                    $stage_stat,
                    $stage_start,
                    $stage_end,
                    $stage_id,
                    $project_id
                ]);
            } else {
                // Insert new stage
                $insert_stage_sql = "INSERT INTO tbl_project_stages (
                                   project_id, 
                                   stage_name, 
                                   status, 
                                   start_date, 
                                   end_date, 
                                   created_at
                                   ) VALUES (?, ?, ?, ?, ?, NOW())";
                
                $insert_stage_stmt = $pdo->prepare($insert_stage_sql);
                $insert_stage_stmt->execute([
                    $project_id,
                    $stage_name,
                    $stage_stat,
                    $stage_start,
                    $stage_end
                ]);
            }
        }
        
        // Remove stages that are no longer in the form
        $current_stage_ids = array_filter($stage_ids, function($id) { return !empty($id) && is_numeric($id); });
        
        if (!empty($current_stage_ids)) {
            $placeholders = str_repeat('?,', count($current_stage_ids) - 1) . '?';
            $delete_stages_sql = "DELETE FROM tbl_project_stages WHERE project_id = ? AND stage_id NOT IN ($placeholders)";
            $delete_stages_stmt = $pdo->prepare($delete_stages_sql);
            $delete_stages_stmt->execute(array_merge([$project_id], $current_stage_ids));
        } else {
            // If no current stages, delete all stages for this project
            $delete_all_stages_sql = "DELETE FROM tbl_project_stages WHERE project_id = ?";
            $delete_all_stages_stmt = $pdo->prepare($delete_all_stages_sql);
            $delete_all_stages_stmt->execute([$project_id]);
        }
    }
    
    // Delete removed image files from filesystem
    if (!empty($images_to_remove)) {
        $old_project_dir = '../../uploads/brgy_projects/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $current_project['project_name']);
        foreach ($images_to_remove as $image) {
            $image_path = $old_project_dir . '/' . $image;
            if (file_exists($image_path)) {
                unlink($image_path);
            }
        }
    }
    
    // Commit transaction
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'message' => 'Project updated successfully',
        'project_id' => $project_id,
        'new_images' => $new_uploaded_images,
        'removed_images' => $images_to_remove
    ]);
    
} catch (PDOException $e) {
    // Rollback transaction on error
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    
    // Clean up uploaded files on error
    if (!empty($new_uploaded_images)) {
        foreach ($new_uploaded_images as $image) {
            $file_path = $project_dir . '/' . $image;
            if (file_exists($file_path)) {
                unlink($file_path);
            }
        }
    }
    
    // Log the error for debugging
    error_log("Database error in update-project.php: " . $e->getMessage());
    
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
    if (!empty($new_uploaded_images)) {
        foreach ($new_uploaded_images as $image) {
            $file_path = $project_dir . '/' . $image;
            if (file_exists($file_path)) {
                unlink($file_path);
            }
        }
    }
    
    // Log the error for debugging
    error_log("General error in update-project.php: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'An unexpected error occurred: ' . $e->getMessage()
    ]);
}
?>
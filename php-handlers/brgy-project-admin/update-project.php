<?php
// update-project.php
session_start();
header('Content-Type: application/json');

// Add error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

include_once '../../php-handlers/connect.php';
date_default_timezone_set('Asia/Manila');
$current_date = date('Y-m-d');

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
$status = $_POST['status'] ?? '';
$start_date = $_POST['start_date'] ?? '';
$expected_completion = $_POST['expected_completion'] ?? '';
$initial_budget = $_POST['initial_budget'] ?? null;
$progress_percentage = $_POST['progress_percentage'] ?? 0;
$funding_source = trim($_POST['funding_source'] ?? '');
$responsible_person = trim($_POST['responsible_person'] ?? '');
$removed_images = $_POST['removed_images'] ?? '';
$cancelled_reason = '';

error_log("Received progress_percentage from frontend: " . var_export($progress_percentage, true));

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

if ($status === 'Cancelled' && isset($_POST['cancelled_reason'])) {
    $cancelled_reason = trim($_POST['cancelled_reason']);
} else {
    $cancelled_reason = ''; // reset if not cancelled
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
    $current_project_sql = "SELECT project_name FROM tbl_projects WHERE project_id = ?";
    $current_project_stmt = $pdo->prepare($current_project_sql);
    $current_project_stmt->execute([$project_id]);
    $current_project = $current_project_stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$current_project) {
        throw new Exception('Project not found');
    }
    
    // Check if project name has changed
    $project_name_changed = ($current_project['project_name'] !== $project_name);
    $old_project_dir = '../../uploads/brgy_projects/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $current_project['project_name']);
    $new_project_dir = '../../uploads/brgy_projects/' . preg_replace('/[^a-zA-Z0-9_-]/', '_', $project_name);
    
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
    $current_images_sql = "SELECT image_id, image_filename FROM tbl_project_images WHERE project_id = ?";
    $current_images_stmt = $pdo->prepare($current_images_sql);
    $current_images_stmt->execute([$project_id]);
    $current_images_records = $current_images_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Build array of current images
    foreach ($current_images_records as $record) {
        $current_images[$record['image_id']] = $record['image_filename'];
    }
    
    // Remove deleted images
    $images_to_remove = [];
    if (!empty($removed_images)) {
        $image_ids_to_remove = explode(',', $removed_images);
        
        // Delete from database first
        foreach ($image_ids_to_remove as $image_id) {
            if (is_numeric($image_id) && isset($current_images[$image_id])) {
                $images_to_remove[] = $current_images[$image_id];
                
                // Delete from database
                $delete_image_sql = "DELETE FROM tbl_project_images WHERE image_id = ? AND project_id = ?";
                $delete_image_stmt = $pdo->prepare($delete_image_sql);
                $delete_image_stmt->execute([$image_id, $project_id]);
            }
        }
    }
    
    // Handle project folder renaming if project name changed
    if ($project_name_changed && is_dir($old_project_dir)) {
        // Create new directory if it doesn't exist
        if (!is_dir($new_project_dir)) {
            if (!mkdir($new_project_dir, 0755, true)) {
                throw new Exception('Failed to create new project directory');
            }
        }
        
        // Move all files from old directory to new directory
        $files = glob($old_project_dir . '/*');
        foreach ($files as $file) {
            $filename = basename($file);
            $new_file_path = $new_project_dir . '/' . $filename;
            
            if (!rename($file, $new_file_path)) {
                throw new Exception('Failed to move file: ' . $filename);
            }
        }
        
        // Remove old directory if empty
        if (is_dir($old_project_dir) && count(glob($old_project_dir . '/*')) === 0) {
            rmdir($old_project_dir);
        }
    }
    
    // Create project directory for new images (use new project name)
    $project_dir = $new_project_dir;
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
                $file_size = $files['size'][$i];
                
                // Validate file extension
                if (!in_array($file_ext, $allowed_extensions)) {
                    throw new Exception("Invalid file type: {$file_name}");
                }
                
                // Generate unique filename
                $unique_name = uniqid() . '_' . time() . '.' . $file_ext;
                $file_path = $project_dir . '/' . $unique_name;
                
                // Move uploaded file
                if (move_uploaded_file($file_tmp, $file_path)) {
                    // Insert image record into database
                    $insert_image_sql = "INSERT INTO tbl_project_images (project_id, image_filename, file_size) VALUES (?, ?, ?)";
                    $insert_image_stmt = $pdo->prepare($insert_image_sql);
                    $insert_image_stmt->execute([$project_id, $unique_name, $file_size]);
                    
                    $new_uploaded_images[] = [
                        'image_id' => $pdo->lastInsertId(),
                        'filename' => $unique_name,
                        'file_size' => $file_size
                    ];
                } else {
                    throw new Exception("Failed to upload image: {$file_name}");
                }
            }
        }
    }

    // ENHANCED: Server-side progress calculation function
    function calculateServerSideProgress($new_stage_status, $existing_stage_status) {
        $all_statuses = array_merge($new_stage_status, $existing_stage_status);
        $total_stages = count($all_statuses);
        
        if ($total_stages === 0) {
            return 0;
        }
        
        $completed_stages = 0;
        foreach ($all_statuses as $status) {
            if ($status === 'Completed') {
                $completed_stages++;
            }
        }
        
        return round(($completed_stages / $total_stages) * 100);
    }

    // Stage calculation function
    function calculateStageDates($old_status, $new_status, $old_start, $old_end, $current_date) {
        $result = [
            'start' => $old_start,
            'end' => $old_end
        ];
        
        // Handle new stages (no old status)
        if (empty($old_status)) {
            switch ($new_status) {
                case 'Not Started':
                case 'On Hold':
                case 'Delayed':
                    $result['start'] = '0000-00-00';
                    $result['end'] = '0000-00-00';
                    break;
                case 'Ongoing':
                    $result['start'] = $current_date;
                    $result['end'] = '0000-00-00';
                    break;
                case 'Completed':
                    $result['start'] = $current_date;
                    $result['end'] = $current_date;
                    break;
            }
            return $result;
        }
        
        // Handle status transitions for existing stages
        switch ($old_status) {
            case 'Not Started':
                switch ($new_status) {
                    case 'Ongoing':
                        $result['start'] = $current_date;
                        $result['end'] = '0000-00-00';
                        break;
                    case 'Completed':
                        $result['start'] = $current_date;
                        $result['end'] = $current_date;
                        break;
                    case 'On Hold':
                    case 'Delayed':
                        $result['start'] = '0000-00-00';
                        $result['end'] = '0000-00-00';
                        break;
                }
                break;
                
            case 'Ongoing':
                switch ($new_status) {
                    case 'Completed':
                        $result['end'] = $current_date;
                        break;
                    case 'On Hold':
                    case 'Delayed':
                        $result['end'] = '0000-00-00';
                        break;
                }
                break;
                
            case 'On Hold':
            case 'Delayed':
                switch ($new_status) {
                    case 'Ongoing':
                        if ($old_start === '0000-00-00') {
                            $result['start'] = $current_date;
                        }
                        $result['end'] = '0000-00-00';
                        break;
                    case 'Completed':
                        if ($old_start === '0000-00-00') {
                            $result['start'] = $current_date;
                        }
                        $result['end'] = $current_date;
                        break;
                }
                break;
        }
        
        return $result;
    }

    // Handle project stages
    try {
        $current_date = date('Y-m-d');
        
        // Get the stage data from the form
        $existing_stage_ids = isset($_POST['existing_stage_ids']) ? $_POST['existing_stage_ids'] : [];
        $existing_stage_names = isset($_POST['existing_stage_names']) ? $_POST['existing_stage_names'] : [];
        $existing_stage_status = isset($_POST['existing_stage_status']) ? $_POST['existing_stage_status'] : [];
        $existing_stage_order = isset($_POST['existing_stage_order']) ? $_POST['existing_stage_order'] : [];
        
        $new_stage_names = isset($_POST['new_stage_names']) ? $_POST['new_stage_names'] : [];
        $new_stage_status = isset($_POST['new_stage_status']) ? $_POST['new_stage_status'] : [];
        $new_stage_order = isset($_POST['new_stage_order']) ? $_POST['new_stage_order'] : [];
        
        error_log("Existing stages: " . print_r($existing_stage_ids, true));
        error_log("New stages: " . print_r($new_stage_names, true));
        
        // ENHANCED: Calculate server-side progress as fallback
        $server_calculated_progress = calculateServerSideProgress($new_stage_status, $existing_stage_status);
        
        // Use frontend-calculated progress if valid, otherwise use server calculation
        if (!is_numeric($progress_percentage) || $progress_percentage < 0 || $progress_percentage > 100) {
            $progress_percentage = $server_calculated_progress;
            error_log("Using server-calculated progress: {$progress_percentage}% (frontend value was invalid)");
        } else {
            error_log("Using frontend-calculated progress: {$progress_percentage}%");
            error_log("Server would have calculated: {$server_calculated_progress}%");
        }
        
        // Process existing stages (updates)
        if (!empty($existing_stage_ids) && is_array($existing_stage_ids)) {
            for ($i = 0; $i < count($existing_stage_ids); $i++) {
                if (!isset($existing_stage_names[$i]) || empty(trim($existing_stage_names[$i]))) {
                    continue;
                }
                
                $stage_id = intval($existing_stage_ids[$i]);
                $stage_name = trim($existing_stage_names[$i]);
                $stage_status = isset($existing_stage_status[$i]) ? $existing_stage_status[$i] : 'Not Started';
                $stage_order = isset($existing_stage_order[$i]) ? intval($existing_stage_order[$i]) : $i + 1;
                
                // Get current stage data
                $current_stage_sql = "SELECT status, start_date, end_date FROM tbl_project_stages WHERE stage_id = ? AND project_id = ?";
                $current_stage_stmt = $pdo->prepare($current_stage_sql);
                $current_stage_stmt->execute([$stage_id, $project_id]);
                $current_stage_data = $current_stage_stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($current_stage_data) {
                    $old_status = $current_stage_data['status'];
                    $old_start_date = $current_stage_data['start_date'];
                    $old_end_date = $current_stage_data['end_date'];
                    
                    // Calculate new dates based on status change
                    $new_dates = calculateStageDates($old_status, $stage_status, $old_start_date, $old_end_date, $current_date);
                    
                    // Update existing stage
                    $update_stage_sql = "UPDATE tbl_project_stages SET 
                                       stage_name = ?, 
                                       status = ?, 
                                       start_date = ?, 
                                       end_date = ?, 
                                       stage_order = ?,
                                       updated_at = NOW()
                                       WHERE stage_id = ? AND project_id = ?";
                    
                    $update_stage_stmt = $pdo->prepare($update_stage_sql);
                    $update_result = $update_stage_stmt->execute([
                        $stage_name,
                        $stage_status,
                        $new_dates['start'],
                        $new_dates['end'],
                        $stage_order,
                        $stage_id,
                        $project_id
                    ]);
                    
                    if ($update_result) {
                        error_log("Successfully updated stage: $stage_name (ID: $stage_id)");
                    } else {
                        error_log("Failed to update stage: $stage_name (ID: $stage_id)");
                        error_log("Update error: " . print_r($update_stage_stmt->errorInfo(), true));
                    }
                } else {
                    error_log("Stage not found: ID $stage_id for project $project_id");
                }
            }
            
            // Remove stages that are no longer in the form
            $keep_stage_ids = array_map('intval', $existing_stage_ids);
            $keep_stage_ids = array_filter($keep_stage_ids, function($id) { return $id > 0; });
            
            if (!empty($keep_stage_ids)) {
                $placeholders = str_repeat('?,', count($keep_stage_ids) - 1) . '?';
                $delete_stages_sql = "DELETE FROM tbl_project_stages WHERE project_id = ? AND stage_id NOT IN ($placeholders)";
                $delete_stages_stmt = $pdo->prepare($delete_stages_sql);
                $delete_result = $delete_stages_stmt->execute(array_merge([$project_id], $keep_stage_ids));
                
                if ($delete_result) {
                    error_log("Successfully cleaned up removed stages");
                } else {
                    error_log("Failed to clean up removed stages");
                }
            }
        } else {
            // If no existing stages, remove all stages for this project
            $delete_all_stages_sql = "DELETE FROM tbl_project_stages WHERE project_id = ?";
            $delete_all_stages_stmt = $pdo->prepare($delete_all_stages_sql);
            $delete_all_result = $delete_all_stages_stmt->execute([$project_id]);
            
            if ($delete_all_result) {
                error_log("Removed all existing stages for project $project_id");
            }
        }
        
        // Process new stages (inserts)
        if (!empty($new_stage_names) && is_array($new_stage_names)) {
            for ($i = 0; $i < count($new_stage_names); $i++) {
                if (!isset($new_stage_names[$i]) || empty(trim($new_stage_names[$i]))) {
                    continue;
                }
                
                $stage_name = trim($new_stage_names[$i]);
                $stage_status = isset($new_stage_status[$i]) ? $new_stage_status[$i] : 'Not Started';
                $stage_order = isset($new_stage_order[$i]) ? intval($new_stage_order[$i]) : $i + 1;
                
                // Calculate initial dates for new stage
                $new_dates = calculateStageDates('', $stage_status, '0000-00-00', '0000-00-00', $current_date);
                
                // Insert new stage
                $insert_stage_sql = "INSERT INTO tbl_project_stages (
                                   project_id, 
                                   stage_name, 
                                   status, 
                                   start_date, 
                                   end_date, 
                                   stage_order,
                                   created_at,
                                   updated_at
                                   ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())";
                
                $insert_stage_stmt = $pdo->prepare($insert_stage_sql);
                $insert_result = $insert_stage_stmt->execute([
                    $project_id,
                    $stage_name,
                    $stage_status,
                    $new_dates['start'],
                    $new_dates['end'],
                    $stage_order
                ]);
                
                if ($insert_result) {
                    $new_stage_id = $pdo->lastInsertId();
                    error_log("Successfully inserted new stage: '$stage_name' with ID: $new_stage_id");
                } else {
                    error_log("Failed to insert new stage: '$stage_name'");
                    error_log("Insert error: " . print_r($insert_stage_stmt->errorInfo(), true));
                    throw new Exception("Failed to insert new stage: $stage_name");
                }
            }
        }
        
        error_log("Stage processing completed successfully");
        
    } catch (Exception $e) {
        error_log("Error handling stages: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        throw $e;
    }
    
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
                   `cancelled_reason` = ?,
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
        $cancelled_reason,
        $project_id
    ]);
    
    if (!$result) {
        throw new Exception('Failed to update project');
    }
    
    // Delete removed image files from filesystem
    if (!empty($images_to_remove)) {
        // Use new project directory if name changed, otherwise use old directory
        $images_dir = $project_name_changed ? $new_project_dir : $old_project_dir;
        
        foreach ($images_to_remove as $image_filename) {
            $image_path = $images_dir . '/' . $image_filename;
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
        'calculated_progress' => floatval($progress_percentage), // Return the final progress value
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
        foreach ($new_uploaded_images as $image_data) {
            $file_path = $project_dir . '/' . $image_data['filename'];
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
        foreach ($new_uploaded_images as $image_data) {
            $file_path = $project_dir . '/' . $image_data['filename'];
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
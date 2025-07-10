<?php
session_start();
header('Content-Type: application/json');

// Add error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

include_once '../../php-handlers/connect.php';

// Check if request method is GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get project ID from request
$project_id = $_GET['project_id'] ?? '';

// Validate project ID
if (empty($project_id) || !is_numeric($project_id)) {
    echo json_encode(['success' => false, 'message' => 'Valid project ID is required']);
    exit;
}

try {
    // Check if PDO connection exists
    if (!isset($pdo)) {
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }
    
    // Prepare query to get project details with category name
    $sql = "SELECT p.*, c.category_name 
            FROM tbl_projects p 
            LEFT JOIN tbl_project_categories c ON p.category_id = c.category_id 
            WHERE p.project_id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$project_id]);
    
    $project = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$project) {
        echo json_encode(['success' => false, 'message' => 'Project not found']);
        exit;
    }
    
    // Get project stages
    $stages_sql = "SELECT * FROM tbl_project_stages WHERE project_id = ? ORDER BY stage_id ASC";
    $stages_stmt = $pdo->prepare($stages_sql);
    $stages_stmt->execute([$project_id]);
    $stages = $stages_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get project images from tbl_project_images
    $images_sql = "SELECT image_id, image_filename, file_size, upload_date 
                   FROM tbl_project_images 
                   WHERE project_id = ? 
                   ORDER BY upload_date ASC";
    $images_stmt = $pdo->prepare($images_sql);
    $images_stmt->execute([$project_id]);
    $project_images = $images_stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Format image data with proper URLs - simplified approach like badge system
    $formatted_images = [];
    $baseUrl = '/UswagLigaya/uploads/brgy_projects/'; 
    
    foreach ($project_images as $image) {
        // Create the project folder name (clean version)
        $project_name = $project['project_name'];
        $clean_project_name = preg_replace('/[^a-zA-Z0-9\-_\s]/', '', $project_name);
        $clean_project_name = str_replace(' ', '_', $clean_project_name);
        
        // Create the image URL - simple and direct like your badge system
        $image_url = $baseUrl . $clean_project_name . '/' . $image['image_filename'];
        
        $formatted_images[] = [
            'image_id' => $image['image_id'],
            'filename' => $image['image_filename'],
            'image_url' => $image_url,
            'file_size' => $image['file_size'],
            'upload_date' => $image['upload_date'],
            'upload_date_formatted' => date('M d, Y g:i A', strtotime($image['upload_date']))
        ];
    }
    
    // Calculate remaining days
    $remaining_days = null;
    if ($project['expected_completion']) {
        $completion_date = new DateTime($project['expected_completion']);
        $current_date = new DateTime();
        $interval = $current_date->diff($completion_date);
        
        if ($completion_date < $current_date) {
            $remaining_days = -$interval->days; // Negative for overdue
        } else {
            $remaining_days = $interval->days;
        }
    }
    
    // Add calculated fields to project data
    $project['project_images'] = $formatted_images;
    $project['stages'] = $stages;
    $project['remaining_days'] = $remaining_days;
    
    // Format dates for better display
    $project['start_date_formatted'] = $project['start_date'] ? date('M d, Y', strtotime($project['start_date'])) : null;
    $project['expected_completion_formatted'] = $project['expected_completion'] ? date('M d, Y', strtotime($project['expected_completion'])) : null;
    $project['created_at_formatted'] = $project['created_at'] ? date('M d, Y g:i A', strtotime($project['created_at'])) : null;
    
    // Ensure progress percentage is numeric
    $project['progress_percentage'] = is_numeric($project['progress_percentage']) ? floatval($project['progress_percentage']) : 0;
    
    // Ensure initial budget is numeric
    $project['initial_budget'] = is_numeric($project['initial_budget']) ? floatval($project['initial_budget']) : null;
    
    echo json_encode([
        'success' => true,
        'project' => $project,
        'message' => 'Project details loaded successfully'
    ]);
    
} catch (PDOException $e) {
    // Log the error for debugging
    error_log("Database error in get-project-details.php: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    // Log the error for debugging
    error_log("General error in get-project-details.php: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'An unexpected error occurred: ' . $e->getMessage()
    ]);
}
?>
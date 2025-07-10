<?php
session_start();
header('Content-Type: application/json');

// Add error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once '../../php-handlers/connect.php';

function getProjectsData($pdo) {
    $projects = [];
    
    // Get all projects with category information
    $stmt = $pdo->prepare("
        SELECT 
            p.project_id,
            p.project_name,
            p.category_id,
            p.description,
            p.location,
            p.start_date,
            p.expected_completion,
            p.actual_completion,
            p.responsible_person,
            p.funding_source,
            p.initial_budget,
            p.status,
            p.progress_percentage,
            p.created_at,
            p.updated_at,
            c.category_name
        FROM tbl_projects p
        LEFT JOIN tbl_project_categories c ON p.category_id = c.category_id
        ORDER BY p.created_at DESC
    ");
    
    $stmt->execute();
    $projectsResult = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($projectsResult as $project) {
        $projectId = $project['project_id'];
        
        // Get project images with proper URL formatting
        $imagesStmt = $pdo->prepare("
            SELECT image_id, image_filename, file_size, upload_date 
            FROM tbl_project_images 
            WHERE project_id = ? 
            ORDER BY upload_date ASC
        ");
        $imagesStmt->execute([$projectId]);
        $project_images = $imagesStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Format image data with proper URLs - using the same approach as admin side
        $formatted_images = [];
        $baseUrl = '/UswagLigaya/uploads/brgy_projects/';
        
        foreach ($project_images as $image) {
            // Create the project folder name (clean version)
            $project_name = $project['project_name'];
            $clean_project_name = preg_replace('/[^a-zA-Z0-9\-_\s]/', '', $project_name);
            $clean_project_name = str_replace(' ', '_', $clean_project_name);
            
            // Create the image URL - simple and direct like your admin system
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
        
        // Get project stages
        $stagesStmt = $pdo->prepare("
            SELECT stage_name, start_date, end_date, status, created_at, updated_at
            FROM tbl_project_stages 
            WHERE project_id = ? 
            ORDER BY start_date ASC
        ");
        $stagesStmt->execute([$projectId]);
        $stages = $stagesStmt->fetchAll(PDO::FETCH_ASSOC);
        
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
        
        // Combine all data
        $project['images'] = $formatted_images; // Use formatted images instead of raw data
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
        
        $projects[$projectId] = $project;
    }
    
    return $projects;
}

try {
    // Check if PDO connection exists
    if (!isset($pdo)) {
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }
    
    // Get projects data
    $projectsData = getProjectsData($pdo);
    
    // Return JSON response in your standard format
    echo json_encode([
        'success' => true,
        'data' => $projectsData,
        'message' => 'Projects data retrieved successfully'
    ]);
} catch (Exception $e) {
    // Return error response in your standard format
    echo json_encode([
        'success' => false,
        'data' => null,
        'message' => 'Failed to fetch projects data: ' . $e->getMessage()
    ]);
}
?>
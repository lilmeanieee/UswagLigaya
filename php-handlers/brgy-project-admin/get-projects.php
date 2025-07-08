<?php
// get-projects.php
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

try {
    // Check if PDO connection exists
    if (!isset($pdo)) {
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }
    
    // Get filter parameters
    $search = $_GET['search'] ?? '';
    $status = $_GET['status'] ?? '';
    $category = $_GET['category'] ?? '';
    
    // Build base query
    $sql = "SELECT 
                p.project_id,
                p.project_name,
                p.description,
                p.location,
                p.start_date,
                p.expected_completion,
                p.initial_budget,
                p.funding_source,
                p.responsible_person,
                p.status,
                p.progress_percentage,
                p.project_image,
                p.created_at,
                c.category_name
            FROM tbl_projects p
            LEFT JOIN tbl_project_categories c ON p.category_id = c.category_id
            WHERE 1=1";
    
    $params = [];
    
    // Add search filter
    if (!empty($search)) {
        $sql .= " AND (p.project_name LIKE ? OR p.description LIKE ? OR p.location LIKE ?)";
        $searchParam = '%' . $search . '%';
        $params[] = $searchParam;
        $params[] = $searchParam;
        $params[] = $searchParam;
    }
    
    // Add status filter
    if (!empty($status)) {
        switch (strtolower($status)) {
            case 'pending':
                $sql .= " AND p.status = 'Planning'";
                break;
            case 'ongoing':
                $sql .= " AND p.status IN ('In Progress', 'Ongoing')";
                break;
            case 'completed':
                $sql .= " AND p.status = 'Completed'";
                break;
        }
    }
    
    // Add category filter
    if (!empty($category)) {
        switch (strtolower($category)) {
            case 'infrastructure':
                $sql .= " AND c.category_name = 'Infrastructure'";
                break;
            case 'public-service':
                $sql .= " AND c.category_name = 'Public Service'";
                break;
            case 'health':
                $sql .= " AND c.category_name = 'Health & Wellness'";
                break;
            case 'education':
                $sql .= " AND c.category_name = 'Education'";
                break;
        }
    }
    
    // Order by created date (newest first)
    $sql .= " ORDER BY p.created_at DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Process projects data
    $processedProjects = [];
    foreach ($projects as $project) {
        // Calculate remaining days
        $remainingDays = 0;
        if (!empty($project['expected_completion']) && $project['expected_completion'] !== '0000-00-00') {
            $today = new DateTime();
            $endDate = new DateTime($project['expected_completion']);
            $diff = $today->diff($endDate);
            $remainingDays = $diff->invert ? 0 : $diff->days;
        }
        
        // Parse project images
        $projectImages = [];
        if (!empty($project['project_image'])) {
            $images = json_decode($project['project_image'], true);
            if (is_array($images)) {
                $projectImages = $images;
            }
        }
        
        // Format budget
        $formattedBudget = !empty($project['initial_budget']) ? 
            '₱' . number_format($project['initial_budget'], 0) : 'N/A';
        
        // Determine status class
        $statusClass = '';
        switch (strtolower($project['status'])) {
            case 'planning':
                $statusClass = 'status-pending';
                break;
            case 'in progress':
            case 'ongoing':
                $statusClass = 'status-ongoing';
                break;
            case 'completed':
                $statusClass = 'status-completed';
                break;
            default:
                $statusClass = 'status-pending';
        }
        
        // Format dates
        $startDate = !empty($project['start_date']) && $project['start_date'] !== '0000-00-00' ? 
            date('M d, Y', strtotime($project['start_date'])) : 'N/A';
        $endDate = !empty($project['expected_completion']) && $project['expected_completion'] !== '0000-00-00' ? 
            date('M d, Y', strtotime($project['expected_completion'])) : 'N/A';
        
        $processedProjects[] = [
            'project_id' => $project['project_id'],
            'project_name' => $project['project_name'],
            'description' => $project['description'],
            'location' => $project['location'],
            'start_date' => $startDate,
            'expected_completion' => $endDate,
            'initial_budget' => $project['initial_budget'],
            'formatted_budget' => $formattedBudget,
            'funding_source' => $project['funding_source'],
            'responsible_person' => $project['responsible_person'],
            'status' => $project['status'],
            'status_class' => $statusClass,
            'progress_percentage' => $project['progress_percentage'],
            'remaining_days' => $remainingDays,
            'category_name' => $project['category_name'],
            'project_images' => $projectImages,
            'created_at' => $project['created_at']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'projects' => $processedProjects,
        'total' => count($processedProjects)
    ]);
    
} catch (PDOException $e) {
    // Log the error for debugging
    error_log("Database error in get-projects.php: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    // Log the error for debugging
    error_log("General error in get-projects.php: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'An unexpected error occurred: ' . $e->getMessage()
    ]);
}
?>
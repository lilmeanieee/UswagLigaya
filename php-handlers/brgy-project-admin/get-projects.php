<?php
session_start();
header('Content-Type: application/json');

error_reporting(E_ALL);
ini_set('display_errors', 1);

include_once '../../php-handlers/connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

try {
    if (!isset($pdo)) {
        echo json_encode(['success' => false, 'message' => 'Database connection failed']);
        exit;
    }

    $search = $_GET['search'] ?? '';
    $status = $_GET['status'] ?? '';
    $category = $_GET['category'] ?? '';

    // Base project query
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
                p.created_at,
                c.category_name
            FROM tbl_projects p
            LEFT JOIN tbl_project_categories c ON p.category_id = c.category_id
            WHERE 1=1";

    $params = [];

    if (!empty($search)) {
        $sql .= " AND (p.project_name LIKE ? OR p.description LIKE ? OR p.location LIKE ?)";
        $searchParam = '%' . $search . '%';
        $params = array_fill(0, 3, $searchParam);
    }

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

    $sql .= " ORDER BY p.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $processedProjects = [];

    foreach ($projects as $project) {
        $project_id = $project['project_id'];
        $project_name = $project['project_name'];

        // Fetch related image data from tbl_project_images
        $image_stmt = $pdo->prepare("SELECT image_id, image_filename, file_size, upload_date FROM tbl_project_images WHERE project_id = ? ORDER BY upload_date ASC");
        $image_stmt->execute([$project_id]);
        $images = $image_stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Process images with proper URLs
        $projectImages = [];
        foreach ($images as $image) {
            // Clean project name for folder structure (remove special characters)
            $clean_project_name = preg_replace('/[^a-zA-Z0-9\-_\s]/', '', $project_name);
            $clean_project_name = str_replace(' ', '_', $clean_project_name);
            
            $image_url = "../uploads/brgy_project/" . $clean_project_name . "/" . $image['image_filename'];
            
            $projectImages[] = [
                'image_id' => $image['image_id'],
                'filename' => $image['image_filename'],
                'image_url' => $image_url,
                'file_size' => $image['file_size'],
                'upload_date' => $image['upload_date'],
                'upload_date_formatted' => date('M d, Y g:i A', strtotime($image['upload_date']))
            ];
        }

        // Calculate remaining days
        $remainingDays = 0;
        if (!empty($project['expected_completion']) && $project['expected_completion'] !== '0000-00-00') {
            $today = new DateTime();
            $endDate = new DateTime($project['expected_completion']);
            $diff = $today->diff($endDate);
            $remainingDays = $diff->invert ? 0 : $diff->days;
        }

        // Format budget
        $formattedBudget = !empty($project['initial_budget']) ? 
            '₱' . number_format($project['initial_budget'], 0) : 'N/A';

        // Status class
        $statusClass = match (strtolower($project['status'])) {
            'planning' => 'status-pending',
            'in progress', 'ongoing' => 'status-ongoing',
            'completed' => 'status-completed',
            default => 'status-pending'
        };

        // Format dates
        $startDate = (!empty($project['start_date']) && $project['start_date'] !== '0000-00-00') ?
            date('M d, Y', strtotime($project['start_date'])) : 'N/A';

        $endDate = (!empty($project['expected_completion']) && $project['expected_completion'] !== '0000-00-00') ?
            date('M d, Y', strtotime($project['expected_completion'])) : 'N/A';

        $processedProjects[] = [
            'project_id' => $project_id,
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
    error_log("Database error in get-projects.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    error_log("General error in get-projects.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'An unexpected error occurred: ' . $e->getMessage()]);
}
?>
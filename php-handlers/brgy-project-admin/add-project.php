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

$project_name = trim($_POST['project_name'] ?? '');
$category = $_POST['category'] ?? '';
$description = trim($_POST['description'] ?? '');
$start_date = $_POST['start_date'] ?? '';
$expected_completion = $_POST['expected_completion'] ?? '';
$initial_budget = $_POST['initial_budget'] ?? null;
$funding_source = trim($_POST['funding_source'] ?? '');
$responsible_person = trim($_POST['responsible_person'] ?? '');

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
                echo json_encode(['success' => false, 'message' => 'Invalid category selected']);
                exit;
            }
    }
    
    // Prepare insert statement with category_id instead of category
    $sql = "INSERT INTO tbl_projects (
        project_name, 
        category_id, 
        description, 
        start_date, 
        expected_completion, 
        initial_budget, 
        funding_source, 
        responsible_person, 
        status, 
        progress_percentage,
        created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 0, NOW())";
    
    $stmt = $pdo->prepare($sql);
    
    // Execute the statement
    $result = $stmt->execute([
        $project_name,
        $category_id, // Use category_id instead of category
        $description,
        $start_date,
        $expected_completion,
        !empty($initial_budget) ? floatval($initial_budget) : null,
        $funding_source,
        $responsible_person
    ]);
    
    if ($result) {
        $project_id = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'message' => 'Project created successfully',
            'project_id' => $project_id
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to create project'
        ]);
    }
    
} catch (PDOException $e) {
    // Log the error for debugging
    error_log("Database error in add-project.php: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage() // Show actual error for debugging
    ]);
} catch (Exception $e) {
    // Log the error for debugging
    error_log("General error in add-project.php: " . $e->getMessage());
    
    echo json_encode([
        'success' => false,
        'message' => 'An unexpected error occurred: ' . $e->getMessage() // Show actual error for debugging
    ]);
}
?>
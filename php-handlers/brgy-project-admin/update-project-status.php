<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Add error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Use the same connection file as update-project.php
include_once '../../php-handlers/connect.php';
date_default_timezone_set('Asia/Manila');

try {
    // Check if request method is POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Only POST method is allowed');
    }

    // Check if PDO connection exists (same as update-project.php)
    if (!isset($pdo)) {
        throw new Exception('Database connection failed');
    }

    // Get the projects data from POST
    if (!isset($_POST['projects']) || empty($_POST['projects'])) {
        throw new Exception('No projects data provided');
    }

    $projectsJson = $_POST['projects'];
    $projects = json_decode($projectsJson, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON data provided: ' . json_last_error_msg());
    }

    if (empty($projects) || !is_array($projects)) {
        throw new Exception('No valid projects to update');
    }

    $updatedCount = 0;
    $errors = [];

    // Begin transaction for data integrity
    $pdo->beginTransaction();

    foreach ($projects as $project) {
        // Validate project data
        if (!isset($project['project_id']) || !isset($project['status'])) {
            $errors[] = "Invalid project data: missing project_id or status";
            continue;
        }

        $projectId = intval($project['project_id']);
        $status = trim($project['status']);

        if ($projectId <= 0) {
            $errors[] = "Invalid project ID: {$projectId}";
            continue;
        }

        if (empty($status)) {
            $errors[] = "Empty status for project ID: {$projectId}";
            continue;
        }

        try {
            // Update the project status in database using correct table name
            $stmt = $pdo->prepare("
                UPDATE tbl_projects 
                SET status = ?, 
                    updated_at = NOW() 
                WHERE project_id = ?
            ");
            
            $result = $stmt->execute([$status, $projectId]);

            if ($result && $stmt->rowCount() > 0) {
                $updatedCount++;
                error_log("Successfully updated project ID: {$projectId} to status: {$status}");
            } else {
                $errors[] = "Failed to update project ID: {$projectId} - Project may not exist";
                error_log("Failed to update project ID: {$projectId} - No rows affected");
            }

        } catch (PDOException $e) {
            $errors[] = "Database error updating project ID {$projectId}: " . $e->getMessage();
            error_log("Database error updating project ID {$projectId}: " . $e->getMessage());
        } catch (Exception $e) {
            $errors[] = "Error updating project ID {$projectId}: " . $e->getMessage();
            error_log("Error updating project ID {$projectId}: " . $e->getMessage());
        }
    }

    // Commit transaction if we have updates, rollback if critical errors
    if ($updatedCount > 0) {
        $pdo->commit();
        error_log("Transaction committed: Updated {$updatedCount} projects");
    } else {
        $pdo->rollback();
        error_log("Transaction rolled back: No projects were updated");
    }

    // Prepare response
    $response = [
        'success' => $updatedCount > 0,
        'updated_count' => $updatedCount,
        'total_projects' => count($projects),
        'message' => $updatedCount > 0 ? 
            "Successfully updated {$updatedCount} project(s) status" : 
            'No projects were updated'
    ];

    // Include errors if any, but don't fail the request if some updates succeeded
    if (!empty($errors)) {
        $response['errors'] = $errors;
        $response['error_count'] = count($errors);
        
        if ($updatedCount > 0) {
            $response['message'] .= ". {$updatedCount} succeeded, " . count($errors) . " failed";
        } else {
            $response['message'] .= '. Errors: ' . implode(', ', array_slice($errors, 0, 3));
            if (count($errors) > 3) {
                $response['message'] .= ' and ' . (count($errors) - 3) . ' more...';
            }
        }
    }

    // Log the final result
    error_log("Project Status Update Summary: Updated {$updatedCount}/{" . count($projects) . "} projects. " . 
              (empty($errors) ? 'No errors.' : count($errors) . ' errors occurred.'));

    echo json_encode($response);

} catch (PDOException $e) {
    // Rollback transaction on database error
    if ($pdo->inTransaction()) {
        $pdo->rollback();
    }

    // Log the database error
    error_log("Database error in update-project-status.php: " . $e->getMessage());

    $response = [
        'success' => false,
        'message' => 'Database error occurred while updating project status',
        'error' => $e->getMessage()
    ];

    http_response_code(500);
    echo json_encode($response);

} catch (Exception $e) {
    // Rollback transaction on general error
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollback();
    }

    // Log the general error
    error_log("General error in update-project-status.php: " . $e->getMessage());

    $response = [
        'success' => false,
        'message' => 'Failed to update project status: ' . $e->getMessage(),
        'error' => $e->getMessage()
    ];

    http_response_code(500);
    echo json_encode($response);
}
?>
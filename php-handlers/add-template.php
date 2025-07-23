<?php
include 'connect.php';
header('Content-Type: application/json');

// Debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$input = [];

// Check if content type is JSON
if (strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid JSON input: " . json_last_error_msg()]);
        exit;
    }
} else {
    // If not JSON, assume form-data (for initial add and potential file uploads with updates)
    $input = $_POST;
}

// Determine if this is an update request
$isUpdate = isset($input['action']) && $input['action'] === 'update' && isset($input['id']);

// Use $input for all data access
$name = trim($input['name'] ?? '');
$description = trim($input['description'] ?? '');
$fee = floatval($input['fee'] ?? 0);
$fields = isset($input['fields']) ? (is_string($input['fields']) ? json_decode($input['fields'], true) : $input['fields']) : [];

// Validate essential fields
if (!$name || !$description || !isset($input['fee'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields (name, description, fee)."]);
    exit;
}

// Validate custom fields JSON if it came as a string
if (is_string($fields) && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid JSON in fields: " . json_last_error_msg()]);
    exit;
}

// Handle file upload (only if present in $_FILES, typically for FormData submissions)
$file_name = null;
$file_path = null;
$fileUploaded = false;

if (isset($_FILES['template_file']) && $_FILES['template_file']['error'] === UPLOAD_ERR_OK) {
    $originalName = $_FILES['template_file']['name'];
    $ext = pathinfo($originalName, PATHINFO_EXTENSION);
    if (strtolower($ext) !== 'docx') {
        http_response_code(400);
        echo json_encode(["error" => "Only .docx files are allowed."]);
        exit;
    }
    $uniqueName = uniqid("template_", true) . "." . $ext;
    $uploadPath = "../uploads/document_templates/" . $uniqueName;
    
    // Create directory if it doesn't exist
    if (!is_dir("../uploads/document_templates/")) {
        mkdir("../uploads/document_templates/", 0755, true);
    }
    
    if (!move_uploaded_file($_FILES['template_file']['tmp_name'], $uploadPath)) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to upload template file."]);
        exit;
    }
    $file_name = $originalName;
    $file_path = $uploadPath;
    $fileUploaded = true;
}

mysqli_begin_transaction($conn);

try {
    if ($isUpdate) {
        // UPDATE OPERATION
        $templateId = (int)$input['id']; // Use $input for id

        // Fetch current file info if not uploading a new file, to retain existing
        if (!$fileUploaded) {
            $currentFileQuery = "SELECT file_name, file_path FROM tbl_document_templates WHERE id = ?";
            $stmt = $conn->prepare($currentFileQuery);
            $stmt->bind_param("i", $templateId);
            $stmt->execute();
            $stmt->bind_result($current_file_name, $current_file_path);
            $stmt->fetch();
            $stmt->close();
            $file_name = $current_file_name;
            $file_path = $current_file_path;
        }
        
        // Update template basic info
        $updateQuery = "UPDATE tbl_document_templates 
                       SET name = ?, description = ?, fee = ?, file_name = ?, file_path = ?
                       WHERE id = ? AND is_archived = 0";
        $stmt = $conn->prepare($updateQuery);
        $stmt->bind_param("ssdssi", $name, $description, $fee, $file_name, $file_path, $templateId);
        
        $stmt->execute();
        
        if ($stmt->affected_rows === 0) {
            // Check if template exists but no changes were made, or if it's archived
            $checkExistQuery = "SELECT COUNT(*) FROM tbl_document_templates WHERE id = ?";
            $checkStmt = $conn->prepare($checkExistQuery);
            $checkStmt->bind_param("i", $templateId);
            $checkStmt->execute();
            $checkStmt->bind_result($count);
            $checkStmt->fetch();
            $checkStmt->close();

            if ($count > 0) {
                // Template exists, but no changes detected or it's archived
                throw new Exception("Template found, but no changes were made or it is archived. ID: " . $templateId);
            } else {
                throw new Exception("Template not found for update. ID: " . $templateId);
            }
        }
        
        $stmt->close();
        
        // Delete existing custom fields
        $deleteFieldsQuery = "DELETE FROM tbl_document_template_custom_fields WHERE template_id = ?";
        $stmt = $conn->prepare($deleteFieldsQuery);
        $stmt->bind_param("i", $templateId);
        $stmt->execute();
        $stmt->close();
        
        // Insert updated custom fields
        if (!empty($fields)) {
            $stmtField = $conn->prepare("INSERT INTO tbl_document_template_custom_fields (template_id, field_key, label, is_required) VALUES (?, ?, ?, ?)");
            foreach ($fields as $field) {
                $key = $field['field_key'];
                $label = $field['label'];
                $required = $field['is_required'] ? 1 : 0;
                $stmtField->bind_param("issi", $templateId, $key, $label, $required);
                $stmtField->execute();
            }
            $stmtField->close();
        }
        
        mysqli_commit($conn);
        echo json_encode(["success" => true, "message" => "Template updated successfully", "template_id" => $templateId]);
        
    } else {
        // CREATE OPERATION (original code)
        $insertQuery = "INSERT INTO tbl_document_templates (name, description, fee, file_name, file_path, is_archived, created_at) VALUES (?, ?, ?, ?, ?, 0, NOW())";
        $stmt = $conn->prepare($insertQuery);
        $stmt->bind_param("ssdss", $name, $description, $fee, $file_name, $file_path);
        $stmt->execute();
        $templateId = $stmt->insert_id;
        $stmt->close();
        
        // Insert custom fields
        if (!empty($fields)) {
            $stmtField = $conn->prepare("INSERT INTO tbl_document_template_custom_fields (template_id, field_key, label, is_required) VALUES (?, ?, ?, ?)");
            foreach ($fields as $field) {
                $key = $field['field_key'];
                $label = $field['label'];
                $required = $field['is_required'] ? 1 : 0;
                $stmtField->bind_param("issi", $templateId, $key, $label, $required);
                $stmtField->execute();
            }
            $stmtField->close();
        }
        
        mysqli_commit($conn);
        echo json_encode(["success" => true, "template_id" => $templateId]);
    }
    
} catch (Exception $e) {
    mysqli_rollback($conn);
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

mysqli_close($conn);
?>
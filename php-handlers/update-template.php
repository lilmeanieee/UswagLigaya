<?php
include 'connect.php';

header('Content-Type: application/json');

// Debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Handle archiving only
if (isset($_POST['is_archived']) && $_POST['is_archived']) {
    $id = intval($_POST['id']);
    $archiveQuery = "UPDATE tbl_document_templates SET is_archived = 1 WHERE id = ?";
    $stmt = $conn->prepare($archiveQuery);
    $stmt->bind_param("i", $id);
    echo $stmt->execute() ? json_encode(["success" => true]) : json_encode(["error" => "Failed to archive"]);
    $stmt->close();
    exit;
}

// Validate basic inputs
if (!isset($_POST['id'], $_POST['name'], $_POST['description'], $_POST['fee'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields"]);
    exit;
}

$oldId = intval($_POST['id']);
$name = trim($_POST['name']);
$description = trim($_POST['description']);
$fee = floatval($_POST['fee']);
$fields = isset($_POST['fields']) ? json_decode($_POST['fields'], true) : [];

mysqli_begin_transaction($conn);

try {
    // Archive other templates with the same name
    $archiveQuery = "UPDATE tbl_document_templates SET is_archived = 1 WHERE LOWER(name) = LOWER(?) AND id != ?";
    $stmt = $conn->prepare($archiveQuery);
    $stmt->bind_param("si", $name, $oldId);
    $stmt->execute();

    // Handle file upload (if new file provided)
    $file_name = null;
    $file_path = null;

    if (isset($_FILES['template_file']) && $_FILES['template_file']['error'] === UPLOAD_ERR_OK) {
        $originalName = $_FILES['template_file']['name'];
        $ext = pathinfo($originalName, PATHINFO_EXTENSION);

        if (strtolower($ext) !== 'docx') {
            throw new Exception("Only .docx files are allowed.");
        }

        $uniqueName = uniqid("template_", true) . "." . $ext;
        $uploadPath = "../uploads/document_templates/" . $uniqueName;

        if (!move_uploaded_file($_FILES['template_file']['tmp_name'], $uploadPath)) {
            throw new Exception("Failed to upload template file.");
        }

        $file_name = $originalName;
        $file_path = $uploadPath;
    }

    // Insert new template record
    $insertQuery = "INSERT INTO tbl_document_templates (name, description, fee, file_name, file_path, is_archived) 
                    VALUES (?, ?, ?, ?, ?, 0)";
    $stmt = $conn->prepare($insertQuery);
    $stmt->bind_param("ssdss", $name, $description, $fee, $file_name, $file_path);
    $stmt->execute();
    $newTemplateId = $stmt->insert_id;
    $stmt->close();

    // Insert custom fields
    if (!empty($fields)) {
        $stmtField = $conn->prepare("INSERT INTO tbl_document_template_custom_fields (template_id, field_key, label, is_required) VALUES (?, ?, ?, ?)");
        foreach ($fields as $field) {
            $key = $field['field_key'];
            $label = $field['label'];
            $required = $field['is_required'] ? 1 : 0;
            $stmtField->bind_param("issi", $newTemplateId, $key, $label, $required);
            $stmtField->execute();
        }
        $stmtField->close();
    }

    mysqli_commit($conn);
    echo json_encode(["success" => true, "new_template_id" => $newTemplateId]);

} catch (Exception $e) {
    mysqli_rollback($conn);
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

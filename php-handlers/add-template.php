<?php
include 'connect.php';

header('Content-Type: application/json');

// Debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if (!isset($_POST['name'], $_POST['description'], $_POST['fee'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing required fields."]);
    exit;
}

$name = trim($_POST['name']);
$description = trim($_POST['description']);
$fee = floatval($_POST['fee']);
$fields = isset($_POST['fields']) ? json_decode($_POST['fields'], true) : [];

// Validate field JSON
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid JSON in fields: " . json_last_error_msg()]);
    exit;
}

// Handle file upload
$file_name = null;
$file_path = null;

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

    if (!move_uploaded_file($_FILES['template_file']['tmp_name'], $uploadPath)) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to upload template file."]);
        exit;
    }

    $file_name = $originalName;
    $file_path = $uploadPath;
}

mysqli_begin_transaction($conn);

try {
    // Insert template
    $insertQuery = "INSERT INTO tbl_document_templates (name, description, fee, file_name, file_path, is_archived) 
                    VALUES (?, ?, ?, ?, ?, 0)";
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

} catch (Exception $e) {
    mysqli_rollback($conn);
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}

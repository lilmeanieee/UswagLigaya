<?php
include 'connect.php';
header('Content-Type: application/json');

$id = $_GET['id'] ?? null;

if (!$id) {
    echo json_encode(['error' => 'No ID provided']);
    exit;
}

// Main document request
$stmt = $conn->prepare("SELECT dr.*, dt.name AS document_name FROM tbl_document_requests dr LEFT JOIN tbl_document_templates dt ON dr.template_id = dt.id WHERE dr.id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$request = $stmt->get_result()->fetch_assoc();
$stmt->close();

$fields = [];
$fieldQuery = $conn->query("SELECT field_key, field_value FROM tbl_request_field_values WHERE request_id = $id");
while ($row = $fieldQuery->fetch_assoc()) {
    $fields[] = [
        'label' => $row['field_key'],
        'value' => $row['field_value'],
    ];
}

$attachments = [];
$attachmentQuery = $conn->query("SELECT id, file_name FROM tbl_document_request_attachments WHERE request_id = $id");
while ($row = $attachmentQuery->fetch_assoc()) {
    $attachments[] = $row;
}

echo json_encode([
    'document_name' => $request['document_name'],
    'full_name' => $request['resident_name'],
    'resident_name' => $request['resident_name'],
    'purpose' => $request['purpose'],
    'custom_fields' => $fields,
    'attachments' => $attachments
]);
?>

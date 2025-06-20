<?php
include 'connect.php';

header('Content-Type: application/json');

$templates = [];

$query = "SELECT t.id, t.name, t.description, t.fee, t.file_name, t.file_path,
                 f.field_key, f.label, f.is_required
          FROM tbl_document_templates t
          LEFT JOIN tbl_document_template_custom_fields f ON t.id = f.template_id
          WHERE t.is_archived = 0
          ORDER BY t.id, f.id";

$result = mysqli_query($conn, $query);

if (!$result) {
    echo json_encode(["error" => mysqli_error($conn)]);
    exit;
}

while ($row = mysqli_fetch_assoc($result)) {
    $id = $row['id'];

    if (!isset($templates[$id])) {
        $templates[$id] = [
            "id" => $id,
            "name" => $row['name'],
            "description" => $row['description'],
            "fee" => (float)$row['fee'],
            "file_name" => $row['file_name'],      // ✅ include uploaded file name
            "file_path" => $row['file_path'],      // ✅ include relative file path
            "customFields" => []
        ];
    }

    if (!empty($row['label'])) {
        $templates[$id]["customFields"][] = [
            "field_key" => $row['field_key'],
            "label" => $row['label'],
            "is_required" => (bool)$row['is_required']
        ];
    }
}

echo json_encode(array_values($templates));

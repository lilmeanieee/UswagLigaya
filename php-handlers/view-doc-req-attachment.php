<?php
include 'connect.php';

$id = $_GET['id'] ?? null;

if (!$id) {
    http_response_code(400);
    exit('Missing ID');
}

$stmt = $conn->prepare("SELECT file_name, file_data FROM tbl_document_request_attachments WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();

if (!$row) {
    http_response_code(404);
    exit('Attachment not found');
}

$fileName = $row['file_name'];
$fileData = $row['file_data'];

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->buffer($fileData);

if (!$mimeType) {
    $mimeType = 'application/octet-stream';
}

// Correct headers
header("Content-Type: $mimeType");
header("Content-Disposition: inline; filename=\"" . basename($fileName) . "\"");
header("Content-Length: " . strlen($fileData));

// Important: Clean output buffer
ob_clean();
flush();

echo $fileData;
exit;
?>

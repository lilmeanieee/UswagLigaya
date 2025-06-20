<?php
include 'connect.php';
header('Content-Type: application/json');

$id = $_POST['id'] ?? null;
$status = $_POST['status'] ?? null;

if (!$id || !$status) {
    echo json_encode(["success" => false, "error" => "Missing data"]);
    exit;
}

$stmt = $conn->prepare("UPDATE tbl_document_requests SET status = ? WHERE id = ?");
$stmt->bind_param("si", $status, $id);

if ($stmt->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "error" => $stmt->error]);
}

$stmt->close();
?>

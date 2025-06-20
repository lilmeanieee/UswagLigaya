<?php
header('Content-Type: application/json');
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
include 'connect.php';

// Inputs
$page = isset($_GET['page']) && (int)$_GET['page'] > 0 ? (int)$_GET['page'] : 1;

$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$status = isset($_GET['status']) ? trim($_GET['status']) : '';

$limit = 5;
$offset = ($page - 1) * $limit;

// Build WHERE conditions
$conditions = [];
$params = [];
$paramTypes = '';

if ($search !== '') {
    $conditions[] = "(dr.resident_name LIKE CONCAT('%', ?, '%') OR dt.name LIKE CONCAT('%', ?, '%'))";
    $params[] = $search;
    $params[] = $search;
    $paramTypes .= 'ss';
}

if ($status !== '') {
    $conditions[] = "dr.status = ?";
    $params[] = $status;
    $paramTypes .= 's';
}

$whereClause = '';
if (count($conditions) > 0) {
    $whereClause = 'WHERE ' . implode(' AND ', $conditions);
}

// Count total matching
$countSql = "
    SELECT COUNT(*) AS total
    FROM tbl_document_requests dr
    LEFT JOIN tbl_document_templates dt ON dr.template_id = dt.id
    $whereClause
";

$countStmt = $conn->prepare($countSql);

if (!empty($params)) {
    $countStmt->bind_param($paramTypes, ...$params);
}

$countStmt->execute();
$countResult = $countStmt->get_result();
$totalRow = $countResult->fetch_assoc();
$totalRequests = $totalRow['total'] ?? 0;
$countStmt->close();

// Fetch paginated matching
$sql = "
    SELECT dr.*, dt.name AS document_name
    FROM tbl_document_requests dr
    LEFT JOIN tbl_document_templates dt ON dr.template_id = dt.id
    $whereClause
    ORDER BY dr.created_at DESC
    LIMIT $limit OFFSET $offset
";

$stmt = $conn->prepare($sql);

if (!empty($params)) {
    $stmt->bind_param($paramTypes, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$requests = [];

while ($row = $result->fetch_assoc()) {
    $requests[] = [
        'id' => $row['id'],
        'resident_name' => $row['resident_name'],
        'document_name' => $row['document_name'],
        'purpose' => $row['purpose'],
        'status' => $row['status'],
        'created_at' => $row['created_at']
    ];
}

$stmt->close();

// Output JSON
echo json_encode([
    'requests' => $requests,
    'total' => $totalRequests,
    'page' => $page,
    'limit' => $limit
]);
?>

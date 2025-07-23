<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

include_once '../connect.php'; // Ensure this connects to your DB

$sql = "SELECT * FROM tbl_badges WHERE is_archived = 0 ORDER BY badge_id ASC";
$result = $conn->query($sql);

$badges = [];

while ($row = $result->fetch_assoc()) {
    $constraint = [
        'type' => $row['constraint_type']
    ];

    if ($row['constraint_type'] === 'points') {
        $constraint['details'] = ['threshold' => (int)$row['points_threshold']];
    } elseif ($row['constraint_type'] === 'events') {
        $constraint['details'] = ['count' => (int)$row['events_count']];
    } elseif ($row['constraint_type'] === 'ranking') {
        $constraint['details'] = [
            'position' => (int)$row['ranking_position'],
            'type' => $row['ranking_type']
        ];
    }

    $badgeIconPath = $row['badge_icon'] ? "/UswagLigaya/uploads/badge/" . $row['badge_icon'] : null;

    $badges[] = [
        'id' => (int)$row['badge_id'],
        'name' => $row['badge_name'],
        'description' => $row['badge_description'],
        'iconSrc' => $badgeIconPath,
        'constraint' => $constraint,
        'status' => (bool)$row['is_active'],
        'activationDate' => $row['activation_date'],
        'expiration' => $row['expiration_date']
    ];
}

echo json_encode($badges);
$conn->close();

<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../connect.php';

if (!$conn) {
    die(json_encode(["error" => "Database connection failed."]));
}

$sql = "SELECT * FROM tbl_rewards WHERE is_archived = 0 ORDER BY reward_id ASC";

$result = $conn->query($sql);

$rewards = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $rewards[] = [
            "id" => $row["reward_id"],
            "name" => $row["reward_name"],
            "type" => $row["reward_type"],
            "description" => $row["description"],
            "points" => $row["points_required"],
            "image" => "/UswagLigaya/uploads/rewards/" . $row["image_url"]  // Absolute path from root
        ];
    }
}

echo json_encode($rewards);
$conn->close();
?>
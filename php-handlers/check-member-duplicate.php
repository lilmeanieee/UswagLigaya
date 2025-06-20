<?php
header('Content-Type: application/json');
include 'connect.php';

$data = json_decode(file_get_contents("php://input"), true);
$response = [
    "memberExists" => false,
    "matchingMembers" => []
];

function normalizeDate($date) {
    $dateOnly = explode("T", $date)[0]; // removes time
    return date('Y-m-d', strtotime($dateOnly));
}

if (!empty($data['members']) && is_array($data['members'])) {
    foreach ($data['members'] as $m) {
        if (
            !empty($m['lastName']) && !empty($m['firstName']) &&
            isset($m['middleName'], $m['birthdate'], $m['sex'])
        ) {
            $birthdate = normalizeDate($m['birthdate']);
            $stmt = $conn->prepare("SELECT * FROM tbl_household_members WHERE last_name = ? AND first_name = ? AND middle_name = ? AND birthdate = ? AND sex = ?");
            $stmt->bind_param("sssss", $m['lastName'], $m['firstName'], $m['middleName'], $birthdate, $m['sex']);
            $stmt->execute();
            $res = $stmt->get_result();
            if ($res->num_rows > 0) {
                $response["memberExists"] = true;
                $response["matchingMembers"][] = $m;
            }
        }
    }
}

echo json_encode($response);
?>
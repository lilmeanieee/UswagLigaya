<?php
header('Content-Type: application/json');
include 'connect.php';

$sql = "SELECT 
            resident_id,
            resident_code,
            last_name,
            first_name,
            middle_name,
            sex,
            CONCAT(household_no, ', ', barangay, ', ', city, ', ', province) AS address,
            'Active' AS status
        FROM tbl_household_members
        JOIN tbl_households ON tbl_household_members.household_id = tbl_households.household_id
        ORDER BY resident_id DESC";

$result = $conn->query($sql);
$residents = [];

while ($row = $result->fetch_assoc()) {
    $residents[] = [
        "residentCode" => $row["resident_code"],
        "lastName" => $row["last_name"],
        "firstName" => $row["first_name"],
        "middleName" => $row["middle_name"],
        "sex" => $row["sex"],
        "address" => $row["address"],
        "status" => $row["status"]
    ];
}

echo json_encode(["residents" => $residents]);
?>

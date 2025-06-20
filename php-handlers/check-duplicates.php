<?php
header('Content-Type: application/json');
include 'connect.php';

$data = json_decode(file_get_contents("php://input"), true);
$response = [
    "householdExists" => false,
    "householdData" => null
];

// Validate and extract inputs
if (!empty($data['household'])) {
    $purok = $data['household']['purok'] ?? '';
    $barangay = $data['household']['barangay'] ?? '';
    $householdNo = $data['household']['householdNo'] ?? '';
    $city = $data['household']['city'] ?? '';
    $province = $data['household']['province'] ?? '';

    // Perform JOIN query to get all info
    $stmt = $conn->prepare("
        SELECT h.household_id, h.purok, h.barangay, h.household_no, h.city, h.province,
               e.ethnicity_type AS ethnicity, e.tribe,
               s.status AS socioStatus, s.nhts_no AS nhtsNo,
               ev.water_source AS waterSource, ev.other_water_source AS otherWater, ev.toilet_facility AS toilet
        FROM tbl_households h
        LEFT JOIN tbl_ethnicities e ON h.household_id = e.household_id
        LEFT JOIN tbl_socioeconomic_status s ON h.household_id = s.household_id
        LEFT JOIN tbl_environmental_health ev ON h.household_id = ev.household_id
        WHERE h.purok = ? AND h.barangay = ? AND h.household_no = ? AND h.city = ? AND h.province = ?
    ");

    $stmt->bind_param("sssss", $purok, $barangay, $householdNo, $city, $province);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $response["householdExists"] = true;
        $response["householdData"] = $row;
    }
}

echo json_encode($response);
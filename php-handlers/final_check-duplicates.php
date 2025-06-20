<?php
header('Content-Type: application/json');
include 'connect.php';

$data = json_decode(file_get_contents("php://input"), true);
$response = [
    "householdExists" => false,
    "householdData" => null
];

if (!empty($data['household'])) {
    $purok = $data['household']['purok'] ?? '';
    $barangay = $data['household']['barangay'] ?? '';
    $householdNo = $data['household']['householdNo'] ?? '';
    $city = $data['household']['city'] ?? '';
    $province = $data['household']['province'] ?? '';

    $stmt = $conn->prepare("SELECT * FROM tbl_households WHERE purok = ? AND barangay = ? AND household_no = ? AND city = ? AND province = ?");
    $stmt->bind_param("sssss", $purok, $barangay, $householdNo, $city, $province);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        $household = $result->fetch_assoc();
        $response["householdExists"] = true;
        $response["householdData"] = [
            "household_id" => $household["household_id"],
            "purok" => $household["purok"],
            "barangay" => $household["barangay"],
            "household_no" => $household["household_no"],
            "city" => $household["city"],
            "province" => $household["province"],
            "ethnicity" => $household["ethnicity"],
            "tribe" => $household["tribe"],
            "socioStatus" => $household["socio_status"],
            "nhtsNo" => $household["nhts_no"],
            "waterSource" => $household["water_source"],
            "otherWater" => $household["other_water"],
            "toilet" => $household["toilet"]
        ];
    }
}

echo json_encode($response);
?>
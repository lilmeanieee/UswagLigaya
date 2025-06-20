<?php
ob_start();
include 'connect.php'; 
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

ini_set('display_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        echo json_encode(["success" => false, "error" => "Invalid JSON input."]);
        exit;
    }

    $household = $data['household'];
    $members = $data['members'];

    // Check if household exists
    $stmt = $conn->prepare("SELECT household_id FROM tbl_households WHERE household_no = ? AND purok = ? AND barangay = ? AND city = ? AND province = ?");
    $stmt->bind_param("sssss", $household['householdNo'], $household['purok'], $household['barangay'], $household['city'], $household['province']);
    $stmt->execute();
    $stmt->store_result();
    $stmt->bind_result($householdId);

    if ($stmt->num_rows > 0) {
        $stmt->fetch(); // use existing household ID
    } else {
        // Insert new household
        $stmtInsert = $conn->prepare("INSERT INTO tbl_households (household_no, purok, barangay, city, province) VALUES (?, ?, ?, ?, ?)");
        $stmtInsert->bind_param("sssss", $household['householdNo'], $household['purok'], $household['barangay'], $household['city'], $household['province']);
        $stmtInsert->execute();
        $householdId = $stmtInsert->insert_id;

        // Insert household metadata
        $stmt = $conn->prepare("INSERT INTO tbl_ethnicities (household_id, ethnicity_type, tribe) VALUES (?, ?, ?)");
        $stmt->bind_param("iss", $householdId, $household['ethnicity'], $household['tribe']);
        $stmt->execute();

        $stmt = $conn->prepare("INSERT INTO tbl_socioeconomic_status (household_id, status, nhts_no) VALUES (?, ?, ?)");
        $stmt->bind_param("iss", $householdId, $household['socioStatus'], $household['nhtsNo']);
        $stmt->execute();

        $stmt = $conn->prepare("INSERT INTO tbl_environmental_health (household_id, water_source, other_water_source, toilet_facility) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("isss", $householdId, $household['waterSource'], $household['otherWater'], $household['toilet']);
        $stmt->execute();
    }

    // ✅ Insert members
    $accounts = [];

    foreach ($members as $member) {
        $stmt = $conn->prepare("INSERT INTO tbl_household_members (
            household_id, last_name, first_name, middle_name, suffix, relationship, sex, birthdate, civil_status,
            education, religion, remarks
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("isssssssssss",
            $householdId,
            $member['lastName'],
            $member['firstName'],
            $member['middleName'],
            $member['suffix'],
            $member['relationship'],
            $member['sex'],
            $member['birthdate'],
            $member['civilStatus'],
            $member['education'],
            $member['religion'],
            $member['remarks']
        );
        $stmt->execute();
        $residentId = $stmt->insert_id;

        $stmtInsertStats = $conn->prepare("INSERT INTO tbl_resident_participation_stats (resident_id, credit_points, redeemable_points, no_show_streak, total_participated, total_missed, last_participation_date) VALUES (?, 0, 0, 0, 0, 0, NULL)");
        $stmtInsertStats->bind_param("i", $residentId);
        $stmtInsertStats->execute();

        $codeOnly = str_pad($residentId, 7, '0', STR_PAD_LEFT);
        $residentCode = "RES-$codeOnly";
        $conn->query("UPDATE tbl_household_members SET resident_code = '$residentCode' WHERE resident_id = $residentId");

        $conn->query("INSERT INTO tbl_member_health_info (resident_id, philhealth_id, membership, category, medical_history)
                      VALUES ($residentId, '{$member['philhealthId']}', '{$member['membership']}', '{$member['category']}', '{$member['medicalHistory']}')");

        $usingFp = $member['usingFp'] === 'Y' ? 1 : 0;
        $fpMethod = implode(", ", $member['fpMethods']);
        $conn->query("INSERT INTO tbl_member_wra_info (resident_id, using_fp, fp_method, fp_status)
                      VALUES ($residentId, $usingFp, '$fpMethod', '{$member['fpStatus']}')");

        foreach ($member['quarters'] as $i => $q) {
            $quarter = $i + 1;
            $conn->query("INSERT INTO tbl_age_health_risk_quarterly (resident_id, quarter, age, classification)
                          VALUES ($residentId, $quarter, '{$q['age']}', '{$q['class']}')");
        }

        $email = strtolower("{$member['lastName']}.$codeOnly@ligaya.gov.ph");
        $birth = explode("-", $member['birthdate']);
        $rawPass = "$codeOnly.{$member['lastName']}." . implode("/", array_reverse($birth));
        $hashedPassword = password_hash($rawPass, PASSWORD_DEFAULT);

        $conn->query("INSERT INTO tbl_users (email, password, role) VALUES ('$email', '$hashedPassword', 'resident')");
        $userId = $conn->insert_id;

        // ✅ Update user_id in tbl_household_members
        $conn->query("UPDATE tbl_household_members SET user_id = $userId WHERE resident_id = $residentId");


        $accounts[] = [
            "residentCode" => $residentCode,
            "fullName" => "{$member['firstName']} {$member['lastName']}",
            "email" => $email,
            "password" => $rawPass
        ];
    }

    

    echo json_encode(["success" => true, "accounts" => $accounts]);
    ob_end_flush();
    exit;
} else {
    echo json_encode(["success" => false, "error" => "Invalid request method"]);
    ob_end_flush();
    exit;
}
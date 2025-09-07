<?php
include 'connect.php';
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');
session_start(); // Start the session at the beginning

try {
// FIX: Get residentId from the secure session, NOT from POST data.
$residentId = $_SESSION['resident_id'] ?? null;
$templateId = $_POST['documentType'] ?? null;
$purpose = $_POST['purpose'] ?? null;
 $customFields = json_decode($_POST['custom_fields'] ?? '{}', true);

if (!$residentId || !$templateId || !$purpose) {
 throw new Exception("Missing required fields or user not logged in.");
}

    // reCAPTCHA v2 verification
    if (isset($_POST['g-recaptcha-response'])) {
        $captcha = $_POST['g-recaptcha-response'];
        $secretKey = '6Lc2EsArAAAAAA0CtIHkNp6y_5tK7RgfRIlUBnov';
        $ip = $_SERVER['REMOTE_ADDR'];

        $response = file_get_contents("https://www.google.com/recaptcha/api/siteverify?secret=$secretKey&response=$captcha&remoteip=$ip");
        $jsonResponse = json_decode($response, true);

        if (!$jsonResponse['success']) {
            throw new Exception("reCAPTCHA verification failed. Please try again.");
        }
    } else {
        throw new Exception("reCAPTCHA not completed.");
    }

    // Get resident's full name
    $query = $conn->prepare("SELECT first_name, middle_name, last_name, suffix FROM tbl_household_members WHERE resident_id = ?");
    $query->bind_param("i", $residentId);
    $query->execute();
    $query->bind_result($firstName, $middleName, $lastName, $suffix);
    $query->fetch();
    $query->close();

    if (!$firstName || !$lastName) {
        throw new Exception("Resident profile not found.");
    }

    $residentFullName = trim("$firstName $middleName $lastName $suffix");

    // Insert main request
    $stmt = $conn->prepare("INSERT INTO tbl_document_requests (resident_id, resident_name, template_id, purpose, status) VALUES (?, ?, ?, ?, 'Pending')");
    $stmt->bind_param("isis", $residentId, $residentFullName, $templateId, $purpose);
    if ($stmt->execute()) {
        $requestId = $conn->insert_id;
        $stmt->close();
        
        //added points deduction
        $pointsToDeduct = 10;
        $updatePointsStmt = $conn->prepare("UPDATE tbl_resident_participation_stats SET credit_points = credit_points - ? WHERE resident_id = ?");
        $updatePointsStmt->bind_param("ii", $pointsToDeduct, $residentId);
        $updatePointsStmt->execute();
        $updatePointsStmt->close();
        
    } else {
        throw new Exception("Failed to insert document request: " . $stmt->error);
    }    

    // Save custom field values
    if (!empty($customFields)) {
        $stmt = $conn->prepare("INSERT INTO tbl_request_field_values (request_id, field_key, field_value) VALUES (?, ?, ?)");
        foreach ($customFields as $key => $value) {
            $stmt->bind_param("iss", $requestId, $key, $value);
            $stmt->execute();
        }
        $stmt->close();
    }


    // Handle file upload (save to BLOB)
    if (!empty($_FILES['supportingDocs']['name'][0])) {
        $totalSize = array_sum($_FILES['supportingDocs']['size']);
        $maxSize = 1 * 1024 * 1024; // 1MB total max
    
        if ($totalSize > $maxSize) {
            throw new Exception("Total uploaded file size exceeds 1MB limit.");
        }
    
        $stmt = $conn->prepare("INSERT INTO tbl_document_request_attachments (request_id, file_name, file_data) VALUES (?, ?, ?)");
    
        foreach ($_FILES['supportingDocs']['tmp_name'] as $i => $tmpPath) {
            $fileName = $_FILES['supportingDocs']['name'][$i];
            $fileData = file_get_contents($tmpPath);
    
            if ($fileData === false) {
                throw new Exception("Failed to read uploaded file: " . $fileName);
            }
    
            $stmt->bind_param("iss", $requestId, $fileName, $fileData);
    
            if (!$stmt->execute()) {
                throw new Exception("Failed to insert attachment: " . $stmt->error);
            }
        }
    
        $stmt->close();
    }
    

    echo json_encode(["success" => true]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
?>

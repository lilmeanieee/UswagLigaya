<?php
require_once 'connect.php';
session_start();

function getOrInsertTargetAudience($pdo, $audience) {
    // Check if target audience already exists
    $query = "SELECT target_audience_id FROM tbl_target_audience WHERE target_audience = ?";
    $stmt = $pdo->prepare($query);
    $stmt->execute([$audience]);

    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        return $existing['target_audience_id'];
    }

    // Insert new target audience if not found
    $insertQuery = "INSERT INTO tbl_target_audience (target_audience) VALUES (?)";
    $insertStmt = $pdo->prepare($insertQuery);
    $insertStmt->execute([$audience]);

    return $pdo->lastInsertId();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $_POST['upEvent_announcement_id'];
    $targetAudience = $_POST['target_audience'];
    $title = $_POST['upEvent_title'];
    $details = $_POST['upEvent_details'];
    $locationCategory = $_POST['upEventLocationCategory'];
    $locationInput = $_POST['upEventLocationInputOption'];
    $date = $_POST['date'];
    $timeStart = $_POST['time_start'];
    $timeEnd = $_POST['time_end'];
    $updatedAt = date('Y-m-d H:i:s');

    // Get or insert target audience
    $targetAudienceId = getOrInsertTargetAudience($pdo, $targetAudience);

    // Handle file upload if a new file is provided
    $fileName = null;
    if (isset($_FILES['upEvent_file']) && $_FILES['upEvent_file']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['upEvent_file']['tmp_name'];
        $fileName = $_FILES['upEvent_file']['name'];
        $destination = '../../uploads/' . $fileName;

        if (!move_uploaded_file($fileTmpPath, $destination)) {
            die('File upload failed.');
        }
    }

    $sql = "UPDATE tbl_upcoming_event_announcement 
            SET target_audience_id = ?, upEvent_title = ?, upEvent_details = ?, 
                upEventLocationCategory = ?, upEventLocationInputOption = ?, date = ?, 
                time_start = ?, time_end = ?, updated_at = ?";

    $params = [$targetAudienceId, $title, $details, $locationCategory, $locationInput, $date, $timeStart, $timeEnd, $updatedAt];

    // Add file if uploaded
    if ($fileName) {
        $sql .= ", upEvent_file = ?";
        $params[] = $fileName;
    }

    $sql .= " WHERE upEvent_announcement_id = ?";
    $params[] = $id;

    $stmt = $pdo->prepare($sql);
    if ($stmt->execute($params)) {
        echo "success";
    } else {
        echo "error";
    }
}
?>

<?php
include 'connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $_POST['id'];
    $title = $_POST['title'];
    $details = $_POST['details'];
    $numberOfParticipants = $_POST['numberOfParticipants'];
    $locationCategory = $_POST['volunteerLocationCategory'];
    $locationInput = $_POST['volunteerLocationInputOption'];
    $date = $_POST['date'];
    $deadline = $_POST['deadline'];
    $timeStart = $_POST['time_start'];
    $timeEnd = $_POST['time_end'];
    $expPoints = $_POST['exp_points'];
    $redeemPoints = $_POST['redeem_points'];

    $fileName = null;
    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['file']['tmp_name'];
        $fileName = $_FILES['file']['name'];

        $uploadDir = "../uploads/volunteer_drive/";
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        move_uploaded_file($fileTmpPath, $uploadDir . $fileName);
    }

    $sql = "UPDATE tbl_volunteer_drive_announcement SET 
                title = ?, 
                details = ?, 
                numberOfParticipants = ?, 
                volunteerLocationCategory = ?, 
                volunteerLocationInputOption = ?, 
                date = ?, 
                deadline = ?, 
                time_start = ?, 
                time_end = ?, 
                exp_points = ?, 
                redeem_points = ?, 
                updated_at = NOW()" .
                ($fileName ? ", file = ?" : "") .
            " WHERE volunteer_announcement_id = ?";

    $stmt = $conn->prepare($sql);
    if ($fileName) {
        $stmt->bind_param("ssissssssiisi", $title, $details, $numberOfParticipants, $locationCategory, $locationInput, $date, $deadline, $timeStart, $timeEnd, $expPoints, $redeemPoints, $fileName, $id);
    } else {
        $stmt->bind_param("ssissssssiis", $title, $details, $numberOfParticipants, $locationCategory, $locationInput, $date, $deadline, $timeStart, $timeEnd, $expPoints, $redeemPoints, $id);
    }

    echo $stmt->execute() ? "Volunteer Drive updated successfully." : "Error updating: " . $stmt->error;

    $stmt->close();
    $conn->close();
}

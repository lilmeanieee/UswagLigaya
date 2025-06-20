<?php
include 'connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $id = $_POST['id'];
    $category = $_POST['categoryNewsUpdate'];
    $title = $_POST['news_title'];
    $source = $_POST['news_source'];
    $details = $_POST['news_details'];

    $fileName = null;
    if (isset($_FILES['news_file']) && $_FILES['news_file']['error'] === UPLOAD_ERR_OK) {
        $fileTmpPath = $_FILES['news_file']['tmp_name'];
        $fileName = $_FILES['news_file']['name'];

        $uploadDir = "../uploads/news/";
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        move_uploaded_file($fileTmpPath, $uploadDir . $fileName);
    }

    $sql = "UPDATE tbl_news_update_announcement SET 
                categoryNewsUpdate = ?, 
                news_title = ?, 
                news_source = ?, 
                news_details = ?, 
                updated_at = NOW()" .
                ($fileName ? ", news_file = ?" : "") .
            " WHERE news_update_id = ?";

    $stmt = $conn->prepare($sql);
    if ($fileName) {
        $stmt->bind_param("ssssi", $category, $title, $source, $details, $fileName, $id);
    } else {
        $stmt->bind_param("ssssi", $category, $title, $source, $details, $id);
    }

    echo $stmt->execute() ? "News and Update updated successfully." : "Error updating: " . $stmt->error;

    $stmt->close();
    $conn->close();
}

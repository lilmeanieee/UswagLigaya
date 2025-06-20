<?php

header("Content-Type: application/json"); 
require_once 'connect.php'; 

error_reporting(E_ALL);
ini_set('display_errors', 1);
$response = ["success" => false]; // Default response

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    $response["message"] = "Invalid request method: " . $_SERVER["REQUEST_METHOD"];
    echo json_encode($response);
    exit;
}

// Validate required fields
if (empty($_POST["title"]) || empty($_POST["announcementCategory"]) || empty($_POST["announcementText"])) {
    $response["message"] = "All fields are required.";
    echo json_encode($response);
    exit;
}

$title = trim($_POST["title"]);
$category = trim($_POST["announcementCategory"]);
$content = trim($_POST["announcementText"]);
$image_path = NULL; 

// Secure File Upload Handling
if (!empty($_FILES["announcementImage"]["name"])) {
    $allowed_extensions = ["jpg", "jpeg", "png", "gif", "pdf", "mp4", "mov"];
    $upload_dir = "../uploads/";
    $file_extension = strtolower(pathinfo($_FILES["announcementImage"]["name"], PATHINFO_EXTENSION));

    // Validate file type
    if (!in_array($file_extension, $allowed_extensions)) {
        $response["message"] = "Invalid file type. Allowed types: jpg, png, gif, pdf, mp4, mov.";
        echo json_encode($response);
        exit;
    }

    // Generate unique filename
    $new_filename = uniqid("announcement_", true) . "." . $file_extension;
    $target_file = $upload_dir . $new_filename;

    if (move_uploaded_file($_FILES["announcementImage"]["tmp_name"], $target_file)) {
        $image_path = $target_file;
    } else {
        $response["message"] = "Failed to upload file.";
        echo json_encode($response);
        exit;
    }
}

// Insert data into database
$stmt = $conn->prepare("INSERT INTO tbl_announcements (title, category, content, image_path) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $title, $category, $content, $image_path);

if ($stmt->execute()) {
    $response["success"] = true;
    $response["message"] = "Announcement posted successfully!";
} else {
    $response["message"] = "Database error: " . $stmt->error;
}

$stmt->close();
$conn->close();
echo json_encode($response);
?>
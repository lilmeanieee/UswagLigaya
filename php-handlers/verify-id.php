<?php
session_start();
include 'connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $upload_dir = "../uploads/";

    // Ensure the upload directory exists
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }

    if (isset($_SESSION['signup_data'])) {
        // Retrieve session data
        $signup_data = $_SESSION['signup_data'];

        // File uploads
        $valid_id = basename($_FILES['valid_id']['name']);
        $selfie_id = basename($_FILES['selfie_id']['name']);

        $valid_id_path = $upload_dir . $valid_id;
        $selfie_id_path = $upload_dir . $selfie_id;

        if (move_uploaded_file($_FILES["valid_id"]["tmp_name"], $valid_id_path) &&
            move_uploaded_file($_FILES["selfie_id"]["tmp_name"], $selfie_id_path)) {

            // Insert into pending_verifications table
            $stmt = $conn->prepare("INSERT INTO pending_verifications (first_name, last_name, contact_number, email, password_hash, id_file, selfie_file, status, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())");
            $stmt->bind_param("sssssss", 
                $signup_data['first_name'], 
                $signup_data['last_name'], 
                $signup_data['contact_number'], 
                $signup_data['email'], 
                $signup_data['password'], // Ensure this is the hashed password
                $valid_id_path, 
                $selfie_id_path
            );

            if ($stmt->execute()) {
                // Cleanup session data
                unset($_SESSION['signup_data']);
                header("Location: ../html/home.html"); // Redirect to success page
                exit();
            } else {
                echo "Error: " . $stmt->error;
            }
            $stmt->close();
        } else {
            echo "File upload failed.";
        }
    } else {
        echo "Invalid request.";
    }
    $conn->close();
}
?>

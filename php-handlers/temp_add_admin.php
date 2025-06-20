<?php
include 'connect.php'; // Database connection file

// Define admin account details
$email = "ruwi@gmail.com";
$password = "ruwi123"; // Change this to a secure password
$role = "Admin";
$status = "Active";

// Hash the password
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Check if 'tbl_users' table exists
$table_check = $conn->query("SHOW TABLES LIKE 'tbl_users'");
if ($table_check->num_rows == 0) {
    die("Error: Table 'tbl_users' does not exist. Please create the table first.");
}

// Check if admin account already exists
$stmt = $conn->prepare("SELECT user_id FROM tbl_users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo "Admin account already exists!";
} else {
    // Insert admin into tbl_users table
    $stmt = $conn->prepare("INSERT INTO tbl_users (email, password, role, status, created_at) VALUES (?, ?, ?, ?, NOW())");
    $stmt->bind_param("ssss", $email, $hashed_password, $role, $status);

    if ($stmt->execute()) {
        echo "Admin account created successfully!";
    } else {
        echo "Error: " . $stmt->error;
    }
}

// Close the connection
$stmt->close();
$conn->close();
?>

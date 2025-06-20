<?php
session_start();
include '../php-handlers/connect.php';

// Check for both session and localStorage (via JavaScript check)
if (!isset($_SESSION['user_id'])) {
    header("Location: ../html/login.html");
    exit();
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $current_password = $_POST["current_password"];
    $new_password = $_POST["new_password"];
    $confirm_password = $_POST["confirm_password"];

    if ($new_password !== $confirm_password) {
        $_SESSION['error'] = "New passwords do not match.";
        header("Location: change-password.php");
        exit();
    }

    $user_id = $_SESSION['user_id'];

    $stmt = $conn->prepare("SELECT password FROM tbl_users WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $stmt->bind_result($current_hashed_password);
    $stmt->fetch();
    $stmt->close();

    if (!password_verify($current_password, $current_hashed_password)) {
        $_SESSION['error'] = "Current password is incorrect.";
        header("Location: change-password.php");
        exit();
    }

    $new_hashed_password = password_hash($new_password, PASSWORD_BCRYPT);
    $update = $conn->prepare("UPDATE tbl_users SET password = ?, first_login = 0 WHERE user_id = ?");
    $update->bind_param("si", $new_hashed_password, $user_id);

    if ($update->execute()) {
        $_SESSION['success'] = "Password updated successfully.";
        
        // Make paths consistent with login.js
        if ($_SESSION['role'] == "Admin" || $_SESSION['role'] == "Sub-Admin") {
            // UPDATE path to match login.js
            header("Location: ../admin/dashboard.html");
        } else {
            header("Location: ../html/home.html");
        }
        exit();
    } else {
        $_SESSION['error'] = "Failed to update password.";
        header("Location: change-password.php");
        exit();
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Change Password</title>

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">

    <link rel="stylesheet" href="../css/login-style.css">
</head>
<body>

    <div class="container">
        <form id="changePasswordForm" method="POST" action="">
            <div class=" bg p-4">
                <button type="button" class="btn-close btn-close-white" aria-label="Close"
                    onclick="history.back();"></button>

                <h2 class="text-center mb-3">Change Password</h2>
                <div class="form-floating mb-3 ">
                    <input type="password" class="form-control" id="current_password" placeholder="Enter Current Password"
                         name="current_password" required>
                    <label for="current_password">Current Password</label>
                </div>
                <div class="form-floating mb-3">
                    <input type="password" class="form-control" id="new_password" placeholder="Enter New Password" name="new_password" required >
                    <label for="new_password">New Password</label>
                </div>
                <div class="form-floating mb-3">
                    <input type="password" class="form-control" id="confirm_password" placeholder="Confirm New Password" name="confirm_password" required >
                    <label for="confirm_password">Confirm New Password</label>
                </div>
                
                <button class="btn btn-login" type="submit">Change Password</button>
                
            </div>
        </form>
    </div>
    <?php
    if (isset($_SESSION['error'])) {
        echo "<p style='color:red'>" . $_SESSION['error'] . "</p>";
        unset($_SESSION['error']);
    }
    if (isset($_SESSION['success'])) {
        echo "<p style='color:green'>" . $_SESSION['success'] . "</p>";
        unset($_SESSION['success']);
    }
    ?>

    <script>
        // Added check to ensure localStorage is in sync with session
        document.addEventListener('DOMContentLoaded', function() {
            // Check if user is logged in via localStorage
            const userData = localStorage.getItem('userData');
            if (!userData) {
                window.location.href = '../html/login.html';
            }
        });
        
        document.getElementById("changePasswordForm").addEventListener("submit", function (e) {
            const newPw = document.querySelector("[name='new_password']").value;
            const confirmPw = document.querySelector("[name='confirm_password']").value;

            if (newPw !== confirmPw) {
                e.preventDefault();
                alert("New passwords do not match!");
            }
        });
    </script>
</body>
</html>
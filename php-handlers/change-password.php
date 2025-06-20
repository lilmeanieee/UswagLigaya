session_start();
<?php
include '/php-handlers/connect.php';

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
        header("Location: ../html/change-password.html");
        exit();
    }

    $user_id = $_SESSION['user_id'];

    // Fetch current hashed password from DB
    $stmt = $conn->prepare("SELECT password FROM tbl_users WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $stmt->bind_result($current_hashed_password);
    $stmt->fetch();
    $stmt->close();

    // Verify the current password
    if (!password_verify($current_password, $current_hashed_password)) {
        $_SESSION['error'] = "Current password is incorrect.";
        header("Location: ../html/change-password.html");
        exit();
    }

    // Hash and update new password
    $new_hashed_password = password_hash($new_password, PASSWORD_BCRYPT);
    $update = $pdo->prepare("UPDATE tbl_users SET password = ?, first_login = 0 WHERE resident_id = ?");
    $update->execute([$newPasswordHashed, $_SESSION['users_id']]);


    if ($update->execute()) {
        $_SESSION['success'] = "Password updated successfully.";

        // Redirect based on role
        if ($_SESSION['role'] == "Admin" || $_SESSION['role'] == "Sub-Admin") {
            header("Location: ../html/admin/dashboard.html");
        } else if ($_SESSION['role'] == "Resident") {
            header("Location: ../html/home.html");
        }
        exit();
    } else {
        $_SESSION['error'] = "Failed to update password.";
        header("Location: ../html/change-password.html");
        exit();
    }
}
?>  
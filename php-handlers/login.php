<?php
include 'connect.php';

ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
        exit;
    }

    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    // Step 1: Find user by email
    $stmt = $conn->prepare("SELECT * FROM tbl_users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(['status' => 'error', 'message' => 'Account not found']);
        exit;
    }

    $user = $result->fetch_assoc();

    // Step 2: Verify password
    if (!password_verify($password, $user['password'])) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid password']);
        exit;
    }

    // Initialize user data with basic information
    $userData = [
        'user_id' => $user['user_id'],
        'role' => $user['role'],
        'first_login' => $user['first_login'],
        'first_name' => '',
        'middle_name' => '',
        'last_name' => '',
        'name' => ''
    ];

    // Step 3: For residents, get additional info from household members table
    if ($user['role'] === 'Resident') {
        $residentStmt = $conn->prepare("SELECT * FROM tbl_household_members WHERE user_id = ?");
        $residentStmt->bind_param("i", $user['user_id']);
        $residentStmt->execute();
        $residentResult = $residentStmt->get_result();

        if ($residentResult->num_rows === 0) {
            echo json_encode(['status' => 'error', 'message' => 'Resident profile not found']);
            exit;
        }

        $resident = $residentResult->fetch_assoc();
        
        // Update user data with resident information
        $userData['resident_id'] = $resident['resident_id'];
        $userData['resident_code'] = $resident['resident_code'];
        $userData['first_name'] = $resident['first_name'];
        $userData['middle_name'] = $resident['middle_name'];
        $userData['last_name'] = $resident['last_name'];
        $userData['name'] = $resident['last_name'] . ', ' . $resident['first_name'] . ' ' . $resident['middle_name'];
    } else {
        // For Admin/SubAdmin, try to get info from a separate admin table if exists
        // This is a placeholder - modify according to your database structure
        $adminStmt = $conn->prepare("SELECT * FROM tbl_users WHERE user_id = ?");
        if ($adminStmt) {
            $adminStmt->bind_param("i", $user['user_id']);
            $adminStmt->execute();
            $adminResult = $adminStmt->get_result();
            
            if ($adminResult && $adminResult->num_rows > 0) {
                $admin = $adminResult->fetch_assoc();
                // Update with admin info if available
                $userData['first_name'] = $admin['first_name'] ?? '';
                $userData['last_name'] = $admin['last_name'] ?? '';
                $userData['name'] = ($admin['last_name'] ?? '') . ', ' . ($admin['first_name'] ?? '');
            } else {
                // Use email as identifier if no admin profile exists
                $userData['name'] = $email;
            }
        } else {
            // Use email as identifier if no admin table exists
            $userData['name'] = $email;
        }
    }
    
    // Start the session and store user data
    session_start();
    $_SESSION['user_id'] = $user['user_id'];
    $_SESSION['role'] = $user['role'];
    $_SESSION['first_login'] = $user['first_login'];
    
    // Only store resident_id for actual residents
    if (isset($userData['resident_id'])) {
        $_SESSION['resident_id'] = $userData['resident_id'];
    }

    echo json_encode([
        'status' => 'success',
        'user' => $userData
    ]);

} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Login error: ' . $e->getMessage()]);
}
?>
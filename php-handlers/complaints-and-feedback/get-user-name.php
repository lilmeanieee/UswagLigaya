<?php
// Clean version of get-user-name.php with proper error handling
// Place this file at: php-handlers/complaints-and-feedback/get-user-name.php

// Turn off all error output that could interfere with JSON
ini_set('display_errors', 0);
error_reporting(0);

// Start output buffering to catch any unwanted output
ob_start();

// Set JSON header early
header('Content-Type: application/json');

// Start session if not already started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Function to send JSON response and exit
function sendResponse($data) {
    // Clear any output buffer
    ob_clean();
    echo json_encode($data);
    exit;
}

try {
    // Include database connection - try multiple paths
    $possiblePaths = [
        '../../connect.php',
        '../connect.php',
        '../../../connect.php'
    ];
    
    $conn = null;
    foreach ($possiblePaths as $path) {
        if (file_exists($path)) {
            include $path;
            break;
        }
    }
    
    // Check if database connection was established
    if (!isset($conn) || !$conn) {
        sendResponse([
            "status" => "error",
            "message" => "Database connection failed",
            "name" => "Database Error",
            "residentId" => 0
        ]);
    }
    
    // Check if user is logged in
    // Try different possible session variable names
    $userId = null;
    if (isset($_SESSION['user_id'])) {
        $userId = $_SESSION['user_id'];
    } elseif (isset($_SESSION['id'])) {
        $userId = $_SESSION['id'];
    } elseif (isset($_SESSION['resident_id'])) {
        $userId = $_SESSION['resident_id'];
    }
    
    if (!$userId) {
        sendResponse([
            "status" => "error",
            "message" => "User not logged in",
            "name" => "Please log in",
            "residentId" => 0
        ]);
    }
    
    // Get user information from database
    $query = $conn->prepare("SELECT first_name, middle_name, last_name, suffix FROM tbl_household_members WHERE user_id = ?");
    
    if (!$query) {
        sendResponse([
            "status" => "error",
            "message" => "Database query preparation failed",
            "name" => "Database Error",
            "residentId" => 0
        ]);
    }
    
    $query->bind_param("i", $userId);
    
    if (!$query->execute()) {
        $query->close();
        sendResponse([
            "status" => "error",
            "message" => "Database query execution failed",
            "name" => "Database Error",
            "residentId" => 0
        ]);
    }
    
    $query->bind_result($firstName, $middleName, $lastName, $suffix);
    
    if ($query->fetch()) {
        $fullName = trim("$firstName $middleName $lastName $suffix");
        $query->close();
        
        sendResponse([
            "status" => "success",
            "name" => $fullName,
            "residentId" => $userId,
            "message" => "User data loaded successfully"
        ]);
    } else {
        $query->close();
        sendResponse([
            "status" => "error",
            "message" => "User not found in database",
            "name" => "User Not Found",
            "residentId" => 0
        ]);
    }
    
} catch (Exception $e) {
    sendResponse([
        "status" => "error", 
        "message" => "Server error: " . $e->getMessage(),
        "name" => "Server Error",
        "residentId" => 0
    ]);
} finally {
    if (isset($conn) && $conn) {
        $conn->close();
    }
}

// This should never be reached due to sendResponse() calls above
sendResponse([
    "status" => "error",
    "message" => "Unexpected error occurred",
    "name" => "Unknown Error",
    "residentId" => 0
]);
?>
<?php
include 'connect.php';
session_start(); // to access the logged-in user session

header('Content-Type: application/json');

// Assuming you store `user_id` in $_SESSION['user_id'] after login? Aaah anong progress sa home?
$userId = $_SESSION['user_id'] ?? null;

if (!$userId) {
    echo json_encode(['error' => 'Not logged in.']);
    exit;
}

// Fetch resident name linked to this user_id
$stmt = $conn->prepare("SELECT first_name, middle_name, last_name, suffix FROM tbl_household_members WHERE user_id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$stmt->bind_result($firstName, $middleName, $lastName, $suffix);

if ($stmt->fetch()) {
    // Assemble full name
    $fullName = trim("$firstName $middleName $lastName $suffix");
    echo json_encode(['fullName' => $fullName, 'residentId' => $userId]);
} else {
    echo json_encode(['error' => 'Resident profile not found.']);
}
$stmt->close();
?>

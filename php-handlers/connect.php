<?php
$host = "127.0.0.1";
$user = "u722205397_admin";
$pass = "Ligaya2025";
$db = "u722205397_dbfiles";

// MySQLi connection
$conn = mysqli_connect($host, $user, $pass, $db);

// ✅ Correct PDO connection
try {
    $pdo = new PDO("mysql:host=$host;dbname=$db", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die(json_encode(["error" => "PDO connection failed: " . $e->getMessage()]));
}

// Check MySQLi connection
if (!$conn) {
    die(json_encode(["error" => "MySQLi connection failed: " . mysqli_connect_error()]));
}
?>

<?php
// Simple debug script to check database contents
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'connect.php';
session_start();

echo "<h2>Database Debug Information</h2>";

// Check session
echo "<h3>Session Data:</h3>";
echo "<pre>" . print_r($_SESSION, true) . "</pre>";

// Check tables exist
echo "<h3>Tables Check:</h3>";
$tables = ['tbl_document_requests', 'tbl_document_templates', 'tbl_residents'];
foreach ($tables as $table) {
    $result = $conn->query("SHOW TABLES LIKE '$table'");
    echo "$table: " . ($result->num_rows > 0 ? "EXISTS" : "DOES NOT EXIST") . "<br>";
}

// Check table structure
echo "<h3>Table Structure - tbl_document_requests:</h3>";
$result = $conn->query("DESCRIBE tbl_document_requests");
if ($result) {
    echo "<table border='1'><tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        foreach ($row as $value) {
            echo "<td>" . htmlspecialchars($value) . "</td>";
        }
        echo "</tr>";
    }
    echo "</table>";
}

// Check all data in tbl_document_requests
echo "<h3>All Records in tbl_document_requests:</h3>";
$result = $conn->query("SELECT * FROM tbl_document_requests ORDER BY id DESC LIMIT 10");
if ($result && $result->num_rows > 0) {
    echo "<table border='1'>";
    $first = true;
    while ($row = $result->fetch_assoc()) {
        if ($first) {
            echo "<tr>";
            foreach (array_keys($row) as $key) {
                echo "<th>" . htmlspecialchars($key) . "</th>";
            }
            echo "</tr>";
            $first = false;
        }
        echo "<tr>";
        foreach ($row as $value) {
            echo "<td>" . htmlspecialchars($value ?? 'NULL') . "</td>";
        }
        echo "</tr>";
    }
    echo "</table>";
} else {
    echo "No records found in tbl_document_requests";
}

// Check resident_id distribution
echo "<h3>Resident ID Distribution:</h3>";
$result = $conn->query("SELECT resident_id, COUNT(*) as count FROM tbl_document_requests GROUP BY resident_id");
if ($result && $result->num_rows > 0) {
    echo "<table border='1'><tr><th>Resident ID</th><th>Count</th><th>Type</th></tr>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . htmlspecialchars($row['resident_id']) . "</td>";
        echo "<td>" . htmlspecialchars($row['count']) . "</td>";
        echo "<td>" . gettype($row['resident_id']) . "</td>";
        echo "</tr>";
    }
    echo "</table>";
}

// If session has resident_id, check specific user records
if (isset($_SESSION['resident_id'])) {
    $userId = $_SESSION['resident_id'];
    echo "<h3>Records for Current User (ID: $userId):</h3>";
    
    $stmt = $conn->prepare("SELECT * FROM tbl_document_requests WHERE resident_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        echo "<table border='1'>";
        $first = true;
        while ($row = $result->fetch_assoc()) {
            if ($first) {
                echo "<tr>";
                foreach (array_keys($row) as $key) {
                    echo "<th>" . htmlspecialchars($key) . "</th>";
                }
                echo "</tr>";
                $first = false;
            }
            echo "<tr>";
            foreach ($row as $value) {
                echo "<td>" . htmlspecialchars($value ?? 'NULL') . "</td>";
            }
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "No records found for user ID: $userId";
        
        // Check if the user exists in any related tables
        echo "<br><br>Checking if user exists in other tables:<br>";
        $checkQueries = [
            "tbl_residents" => "SELECT id, resident_name FROM tbl_residents WHERE id = ?",
            "tbl_users" => "SELECT id, username FROM tbl_users WHERE id = ?",
        ];
        
        foreach ($checkQueries as $tableName => $query) {
            $checkResult = $conn->query("SHOW TABLES LIKE '$tableName'");
            if ($checkResult->num_rows > 0) {
                $stmt = $conn->prepare($query);
                if ($stmt) {
                    $stmt->bind_param("i", $userId);
                    $stmt->execute();
                    $userResult = $stmt->get_result();
                    if ($userResult->num_rows > 0) {
                        $userRow = $userResult->fetch_assoc();
                        echo "$tableName: User found - " . print_r($userRow, true) . "<br>";
                    } else {
                        echo "$tableName: User NOT found<br>";
                    }
                } else {
                    echo "$tableName: Query failed<br>";
                }
            } else {
                echo "$tableName: Table does not exist<br>";
            }
        }
    }
}
?>
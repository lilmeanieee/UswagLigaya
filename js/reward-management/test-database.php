<?php
// Test database connection and table structure
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Database Connection Test</h2>";

include_once '../connect.php';

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}
echo "✓ Database connection successful<br><br>";

// Check if table exists
$result = $conn->query("SHOW TABLES LIKE 'tbl_rewards'");
if ($result->num_rows == 0) {
    echo "❌ Table 'tbl_rewards' does not exist!<br>";
    echo "Please create the table first with this SQL:<br><pre>";
    echo "CREATE TABLE tbl_rewards (
    reward_id INT AUTO_INCREMENT PRIMARY KEY,
    reward_name VARCHAR(255) NOT NULL,
    reward_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    points_required INT NOT NULL,
    image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);";
    echo "</pre>";
    die();
}
echo "✓ Table 'tbl_rewards' exists<br><br>";

// Show table structure
echo "<h3>Table Structure:</h3>";
$structure = $conn->query("DESCRIBE tbl_rewards");
echo "<table border='1' cellpadding='5'>";
echo "<tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
while ($row = $structure->fetch_assoc()) {
    echo "<tr>";
    echo "<td>" . $row['Field'] . "</td>";
    echo "<td>" . $row['Type'] . "</td>";
    echo "<td>" . $row['Null'] . "</td>";
    echo "<td>" . $row['Key'] . "</td>";
    echo "<td>" . ($row['Default'] ?? 'NULL') . "</td>";
    echo "<td>" . $row['Extra'] . "</td>";
    echo "</tr>";
}
echo "</table><br>";

// Count existing records
$count = $conn->query("SELECT COUNT(*) as total FROM tbl_rewards");
$total = $count->fetch_assoc()['total'];
echo "Current records in table: <strong>$total</strong><br><br>";

// Test simple insert
echo "<h3>Testing Simple Insert:</h3>";
$testName = "Test Reward " . date('Y-m-d H:i:s');
$testStmt = $conn->prepare("INSERT INTO tbl_rewards (reward_name, reward_type, description, points_required, image_url, status) VALUES (?, ?, ?, ?, ?, ?)");

if (!$testStmt) {
    echo "❌ Prepare failed: " . $conn->error . "<br>";
} else {
    $testType = "trophy";
    $testDesc = "Test description";
    $testPoints = 100;
    $testImage = "test.jpg";
    $testStatus = "Active";
    
    $testStmt->bind_param("sssiss", $testName, $testType, $testDesc, $testPoints, $testImage, $testStatus);
    
    if ($testStmt->execute()) {
        $insertId = $conn->insert_id;
        echo "✓ Test insert successful! ID: $insertId<br>";
        
        // Clean up test record
        $conn->query("DELETE FROM tbl_rewards WHERE reward_id = $insertId");
        echo "✓ Test record cleaned up<br>";
    } else {
        echo "❌ Test insert failed: " . $testStmt->error . "<br>";
    }
    $testStmt->close();
}

echo "<br><strong>Database test complete!</strong>";
$conn->close();
?>
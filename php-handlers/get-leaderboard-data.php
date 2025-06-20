<?php
include 'connect.php'; 

// SQL to get top contributors based on credit points
$sql = "SELECT m.resident_id, m.first_name, m.middle_name, m.last_name, 
               CASE 
                   WHEN m.middle_name IS NULL OR m.middle_name = '' THEN 
                       CONCAT(m.first_name, ' ', m.last_name)
                   ELSE 
                       CONCAT(m.first_name, ' ', m.middle_name, ' ', m.last_name)
               END AS full_name,
               p.credit_points
        FROM tbl_household_members m
        JOIN tbl_resident_participation_stats p ON m.resident_id = p.resident_id
        ORDER BY p.credit_points DESC
        LIMIT 10";

$result = $conn->query($sql);

$leaderboard = [];

if ($result->num_rows > 0) {
    // Output data of each row
    while($row = $result->fetch_assoc()) {
        $leaderboard[] = [
            'resident_id' => $row['resident_id'],
            'first_name' => $row['first_name'],
            'middle_name' => $row['middle_name'],
            'last_name' => $row['last_name'],
            'full_name' => $row['full_name'],
            'credit_points' => $row['credit_points']
        ];
    }
}

// Close connection
$conn->close();

// Return JSON response
header('Content-Type: application/json');
echo json_encode($leaderboard);
?>
<?php
include 'connect.php'; // adjust path to your config file

$today = date("Y-m-d");

$sql = "SELECT volunteer_announcement_id, volunteer_announcement_title 
        FROM tbl_volunteer_drive_announcement 
        WHERE date >= '$today' AND status = 'ACTIVE'
        ORDER BY date ASC";

$result = mysqli_query($conn, $sql);
$events = [];

while ($row = mysqli_fetch_assoc($result)) {
    $events[] = $row;
}

echo json_encode($events);
?>

<?php
include 'connect.php'; // adjust as needed

$eventId = isset($_GET['event_id']) && $_GET['event_id'] !== 'all' ? intval($_GET['event_id']) : null;

$sql = "SELECT 
            vp.participation_id,
            CONCAT(hm.first_name, ' ', hm.last_name) AS name,
            vda.volunteer_announcement_title AS event_title,
            vda.date AS event_date,
            vda.credit_points,
            COALESCE(vp.attendance, 'Pending') AS attendance
        FROM tbl_volunteer_participation vp
        JOIN tbl_household_members hm ON vp.resident_id = hm.resident_id
        JOIN tbl_volunteer_drive_announcement vda ON vp.volunteer_announcement_id = vda.volunteer_announcement_id";

if ($eventId) {
    $sql .= " WHERE vda.volunteer_announcement_id = $eventId";
}

$sql .= " ORDER BY vda.date DESC, name";

$result = mysqli_query($conn, $sql);

$data = [];
while ($row = mysqli_fetch_assoc($result)) {
    $data[] = $row;
}

echo json_encode($data);
?>

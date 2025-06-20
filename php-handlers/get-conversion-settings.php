<?php
include 'connect.php';
header('Content-Type: application/json');

$response = ['success' => false, 'settings' => []];

$query = "SELECT credit_points, redeemable_points, minimum_points_required FROM tbl_conversion_settings ORDER BY conversion_id DESC LIMIT 1";
$result = mysqli_query($conn, $query);

if ($result && mysqli_num_rows($result) > 0) {
    $row = mysqli_fetch_assoc($result);

    $response['success'] = true;
    $response['settings'] = [
        'credit_points' => number_format((float)$row['credit_points'], 2),
        'redeemable_points' => number_format((float)$row['redeemable_points'], 2),
        'minimum_points_required' => $row['minimum_points_required'] !== null
            ? number_format((float)$row['minimum_points_required'], 2)
            : '0.00'
    ];
}

echo json_encode($response);
?>

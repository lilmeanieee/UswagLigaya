<?php
include 'connect.php';

$response = ['success' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $threshold = $_POST['minimum_points_required'];

    if (!is_numeric($threshold)) {
        $response['message'] = "Invalid threshold value.";
        echo json_encode($response);
        exit;
    }

    // Get the latest credit_points and redeemable_points
    $query = "SELECT credit_points, redeemable_points FROM tbl_conversion_settings ORDER BY conversion_id DESC LIMIT 1";
    $result = mysqli_query($conn, $query);
    $row = mysqli_fetch_assoc($result);
    $credit = isset($row['credit_points']) ? $row['credit_points'] : null;
    $redeem = isset($row['redeemable_points']) ? $row['redeemable_points'] : null;

    // Insert a new conversion row
    $stmt = $conn->prepare("INSERT INTO tbl_conversion_settings (credit_points, redeemable_points, minimum_points_required) VALUES (?, ?, ?)");
    $stmt->bind_param("ddd", $credit, $redeem, $threshold);

    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = "Threshold saved successfully.";
    } else {
        $response['message'] = "Error saving threshold: " . $stmt->error;
    }

    $stmt->close();
}

echo json_encode($response);
?>

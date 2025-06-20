<?php
include 'connect.php';

$response = ['success' => false, 'message' => ''];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $credit = $_POST['credit_points'];
    $redeem = $_POST['redeemable_points'];

    if (!is_numeric($credit) || !is_numeric($redeem)) {
        $response['message'] = "Invalid input values.";
        echo json_encode($response);
        exit;
    }

    // Get the latest minimum_points_required
    $query = "SELECT minimum_points_required FROM tbl_conversion_settings ORDER BY conversion_id DESC LIMIT 1";
    $result = mysqli_query($conn, $query);
    $row = mysqli_fetch_assoc($result);
    $min_required = isset($row['minimum_points_required']) ? $row['minimum_points_required'] : null;

    // Insert a new conversion row
    $stmt = $conn->prepare("INSERT INTO tbl_conversion_settings (credit_points, redeemable_points, minimum_points_required) VALUES (?, ?, ?)");
    $stmt->bind_param("ddd", $credit, $redeem, $min_required);

    if ($stmt->execute()) {
        $response['success'] = true;
        $response['message'] = "Conversion rate saved successfully.";
    } else {
        $response['message'] = "Error saving rate: " . $stmt->error;
    }

    $stmt->close();
}

echo json_encode($response);
?>

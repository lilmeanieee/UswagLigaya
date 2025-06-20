<?php
header('Content-Type: application/json');
include 'connect.php';

$data = json_decode(file_get_contents('php://input'), true);

// Check if the data exists
if (!isset($data['participation_data']) || !isset($data['status'])) {
    echo json_encode(['success' => false, 'error' => 'Missing required data']);
    exit;
}

$participationData = $data['participation_data'];
$status = $data['status'];

// Start transaction
$conn->begin_transaction();

try {
    foreach ($participationData as $participant) {
        $participationId = $participant['id'];
        $creditPoints = $participant['creditPoints'];
        
        // 1. Update the participation record with the new status, isEvaluated field, and attendance_time
        $isEvaluated = "Yes"; // Set isEvaluated to "Yes" for both statuses
        $updateSql = "UPDATE tbl_volunteer_participation 
                      SET attendance = ?, 
                          isEvaluated = ?, 
                          attendance_time = NOW() 
                      WHERE participation_id = ?";
        $stmt = $conn->prepare($updateSql);
        $stmt->bind_param("ssi", $status, $isEvaluated, $participationId);
        $stmt->execute();
        
        // 2. Get the resident ID associated with this participation
        $getResidentSql = "SELECT resident_id FROM tbl_volunteer_participation WHERE participation_id = ?";
        $stmt = $conn->prepare($getResidentSql);
        $stmt->bind_param("i", $participationId);
        $stmt->execute();
        $result = $stmt->get_result();
        $residentId = $result->fetch_assoc()['resident_id'];
        
        // 3. Update the resident stats based on the status
        if ($status === 'Participated') {
            // For participants who attended, update credit points and total_participated
            $updateStatsSql = "UPDATE tbl_resident_participation_stats 
                              SET credit_points = credit_points + ?, 
                                  total_participated = total_participated + 1,
                                  no_show_streak = 0,
                                  last_participation_date = CURRENT_DATE()
                              WHERE resident_id = ?";
            $stmt = $conn->prepare($updateStatsSql);
            $stmt->bind_param("ii", $creditPoints, $residentId);
            $stmt->execute();
        } else if ($status === 'Did Not Participated') {
            // For participants who did not attend, update no_show_streak and total_missed
            // Note: credit_points and total_participated remain unchanged
            $updateStatsSql = "UPDATE tbl_resident_participation_stats 
                              SET no_show_streak = no_show_streak + 1,
                                  total_missed = total_missed + 1
                              WHERE resident_id = ?";
            $stmt = $conn->prepare($updateStatsSql);
            $stmt->bind_param("i", $residentId);
            $stmt->execute();
        }
    }
    
    // Commit the transaction
    $conn->commit();
    echo json_encode(['success' => true]);
    
} catch (Exception $e) {
    // Rollback in case of error
    $conn->rollback();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

$conn->close();
?>
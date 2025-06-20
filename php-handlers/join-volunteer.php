<?php
header('Content-Type: application/json');
ob_start();
ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    require_once("connect.php");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['error' => 'Invalid request method']);
        exit;
    }

    $residentId = $_POST['resident_id'] ?? null;
    $announcementId = $_POST['volunteer_announcement_id'] ?? null;
    $checkOnly = $_POST['check_only'] ?? 'false';

    if (!$residentId) {
        echo json_encode(['error' => 'Missing resident ID']);
        exit;
    }

    // Count how many times the resident joined this month
    $checkStmt = $pdo->prepare("
        SELECT COUNT(*) FROM tbl_volunteer_participation
        WHERE resident_id = :resident_id
        AND MONTH(joined_at) = MONTH(CURRENT_DATE())
        AND YEAR(joined_at) = YEAR(CURRENT_DATE())
    ");
    $checkStmt->execute(['resident_id' => $residentId]);
    $joinedThisMonth = $checkStmt->fetchColumn();

    if ($checkOnly === 'true') {
        echo json_encode(['joined_this_month' => $joinedThisMonth]);
        exit;
    }

    if (!$announcementId) {
        echo json_encode(['error' => 'Missing volunteer announcement ID']);
        exit;
    }

    // Check if volunteer announcement exists
    $checkVolunteerStmt = $pdo->prepare("
        SELECT number_of_participants, current_participants 
        FROM tbl_volunteer_drive_announcement 
        WHERE volunteer_announcement_id = :volunteer_announcement_id
    ");
    $checkVolunteerStmt->execute(['volunteer_announcement_id' => $announcementId]);
    $volunteerEvent = $checkVolunteerStmt->fetch(PDO::FETCH_ASSOC);

    if (!$volunteerEvent) {
        echo json_encode(['error' => 'Invalid volunteer announcement ID.']);
        exit;
    }

    // Check if event is already full
    if ($volunteerEvent['current_participants'] >= $volunteerEvent['number_of_participants']) {
        echo json_encode(['error' => 'Sorry, this volunteer event is already full.']);
        exit;
    }

    // Check if already joined this event
    $alreadyJoinedStmt = $pdo->prepare("
        SELECT COUNT(*) FROM tbl_volunteer_participation
        WHERE resident_id = :resident_id
        AND volunteer_announcement_id = :volunteer_announcement_id
    ");
    $alreadyJoinedStmt->execute([
        'resident_id' => $residentId,
        'volunteer_announcement_id' => $announcementId 
    ]);
    $alreadyJoined = $alreadyJoinedStmt->fetchColumn();

    if ($alreadyJoined > 0) {
        echo json_encode(['error' => 'You have already joined this volunteer event.']);
        exit;
    }

    // Check join limit
    if ($joinedThisMonth >= 3) {
        echo json_encode(['error' => 'You have reached your 3 join limit for this month.']);
        exit;
    }

    // ✅ Insert participation AND Update current_participants inside transaction
    $pdo->beginTransaction();

    // Insert participation
    $insertStmt = $pdo->prepare("
        INSERT INTO tbl_volunteer_participation (resident_id, volunteer_announcement_id, joined_at)
        VALUES (:resident_id, :volunteer_announcement_id, NOW())
    ");
    $insertStmt->execute([
        'resident_id' => $residentId,
        'volunteer_announcement_id' => $announcementId
    ]);

    // Increment current_participants
    $updateStmt = $pdo->prepare("
        UPDATE tbl_volunteer_drive_announcement 
        SET current_participants = current_participants + 1 
        WHERE volunteer_announcement_id = :volunteer_announcement_id
    ");
    $updateStmt->execute([
        'volunteer_announcement_id' => $announcementId
    ]);

    $pdo->commit();

    echo json_encode([
        'success' => true, 
        'message' => 'Successfully joined the volunteer event.',
        'joined_this_month' => $joinedThisMonth + 1
    ]);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log("PDO error: " . $e->getMessage());
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
?>

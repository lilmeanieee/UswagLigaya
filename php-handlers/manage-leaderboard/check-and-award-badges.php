<?php
require_once(__DIR__ . '/../connect.php');
date_default_timezone_set('Asia/Manila');

$residentId = $_POST['resident_id'] ?? null;

if (!$residentId) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Missing resident_id']);
    exit;
}

try {
    // Fetch all active, non-archived badges
    $stmt = $pdo->query("SELECT * FROM tbl_badges WHERE is_active = 1 AND is_archived = 0");
    $badges = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $earnedBadges = [];

    foreach ($badges as $badge) {
        $badgeId = $badge['badge_id'];
        $constraintType = $badge['constraint_type'];

        // Skip if already earned
        $check = $pdo->prepare("SELECT 1 FROM tbl_resident_badges WHERE resident_id = ? AND badge_id = ?");
        $check->execute([$residentId, $badgeId]);
        if ($check->rowCount() > 0) continue;

        $qualified = false;

        // Points constraint
        if ($constraintType === 'points') {
            $threshold = (int)$badge['points_threshold'];
            $res = $pdo->prepare("SELECT credit_points FROM tbl_resident_participation_stats WHERE resident_id = ?");
            $res->execute([$residentId]);
            $row = $res->fetch();
            if ($row && $row['credit_points'] >= $threshold) $qualified = true;
        }

        // Events constraint
        elseif ($constraintType === 'events') {
            $required = (int)$badge['events_count'];
            $res = $pdo->prepare("SELECT total_participated FROM tbl_resident_participation_stats WHERE resident_id = ?");
            $res->execute([$residentId]);
            $row = $res->fetch();
            if ($row && $row['total_participated'] >= $required) $qualified = true;
        }

        // Ranking constraint (top N based on credit_points)
        elseif ($constraintType === 'ranking') {
            $position = (int)$badge['ranking_position'];

            // Build dynamic leaderboard and check if resident is in top N
            $leaderboardStmt = $pdo->prepare("
                SELECT m.resident_id
                FROM tbl_household_members m
                JOIN tbl_resident_participation_stats p ON m.resident_id = p.resident_id
                ORDER BY p.credit_points DESC
                LIMIT ?
            ");
            $leaderboardStmt->execute([$position]);
            $topResidents = $leaderboardStmt->fetchAll(PDO::FETCH_COLUMN);

            if (in_array($residentId, $topResidents)) {
                $qualified = true;
            }
        }

        // Award if qualified
        if ($qualified) {
            $insert = $pdo->prepare("
                INSERT INTO tbl_resident_badges (resident_id, badge_id, source, remarks)
                VALUES (?, ?, 'automatic', 'Auto-awarded after participation update')
            ");
            $insert->execute([$residentId, $badgeId]);

            $earnedBadges[] = [
                'badge_id' => $badgeId,
                'name' => $badge['badge_name'],
                'description' => $badge['badge_description'],
                'icon' => $badge['badge_icon']
            ];
        }
    }

    echo json_encode([
        'status' => 'success',
        'earned' => $earnedBadges
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
}

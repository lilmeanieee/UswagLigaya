<?php
header('Content-Type: application/json');
date_default_timezone_set('Asia/Manila');

try {
    require_once('connect.php');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $today = date('Y-m-d');
    $currentDateTime = date('Y-m-d H:i:s');
    
    // Auto-archive expired announcements first
    
    // 1. Auto-archive Volunteer Drive Announcements
    // Check if end time exists, if not use start time
    $stmt = $pdo->prepare("
        UPDATE tbl_volunteer_drive_announcement 
        SET status = 'inactive' 
        WHERE status = 'active' 
        AND (
            (time_end IS NOT NULL AND time_end != '' AND CONCAT(date, ' ', time_end) < ?) 
            OR 
            (time_end IS NULL AND CONCAT(date, ' ', time_start) < ?)
        )
    ");
    $stmt->execute([$currentDateTime, $currentDateTime]);
    
    // 2. Auto-archive Upcoming Event Announcements
    $stmt = $pdo->prepare("
        UPDATE tbl_upcoming_event_announcement 
        SET status = 'inactive' 
        WHERE status = 'active' AND event_date < ?
    ");
    $stmt->execute([$today]);
    
    // Now fetch all active announcements
    $allAnnouncements = [];
    
    // Upcoming Events
    $stmt = $pdo->query("
        SELECT
            ue.upEvent_announcement_id AS id, 
            ue.upEvent_title AS title,
            ue.upEvent_details AS details,
            ue.event_date AS date,
            ue.created_at AS date_posted,
            c.category_name
        FROM tbl_upcoming_event_announcement ue
        JOIN tbl_announcement_category c ON ue.category_id = c.category_id
        WHERE ue.status = 'active'
    ");
    $upcomingEvents = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($upcomingEvents as $event) {
        $event['type'] = 'Upcoming Event';
        $event['category'] = $event['category_name'];
        $event['number_of_participants'] = null;
        unset($event['category_name']);
        $allAnnouncements[] = $event;
    }
    
    // News and Updates
    $stmt = $pdo->query("
        SELECT 
            n.news_update_announcement_id AS id,
            n.news_update_title AS title,
            n.news_update_details AS details,
            '' AS date,
            n.created_at AS date_posted,
            c.category_name
        FROM tbl_news_update_announcement n
        JOIN tbl_announcement_category c ON n.category_id = c.category_id
        WHERE n.status = 'active'
    ");
    $newsUpdates = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($newsUpdates as $news) {
        $news['type'] = 'News and Update';
        $news['category'] = $news['category_name'];
        $news['number_of_participants'] = null;
        unset($news['category_name']);
        $allAnnouncements[] = $news;
    }
    
    // Volunteer Drives
    $stmt = $pdo->query("
        SELECT 
            v.volunteer_announcement_id AS id,
            v.volunteer_announcement_title AS title,
            v.details,
            v.date,
            v.application_start,
            v.application_deadline,
            v.time_start,
            v.time_end,
            v.created_at AS date_posted,
            v.credit_points,
            v.number_of_participants,
            (v.number_of_participants - v.current_participants) AS remaining_participants,
            c.category_name
        FROM tbl_volunteer_drive_announcement v
        JOIN tbl_announcement_category c ON v.category_id = c.category_id
        WHERE v.status = 'active'
    ");
    $volunteerDrives = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($volunteerDrives as $drive) {
        $drive['type'] = 'Barangay Volunteer Drive';
        $drive['category'] = $drive['category_name'];
        unset($drive['category_name']);
        $allAnnouncements[] = $drive;
    }
    
    echo json_encode($allAnnouncements);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
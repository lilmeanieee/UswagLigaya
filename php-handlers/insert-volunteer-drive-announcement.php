<?php
include 'connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $category = $_POST['announcementCategory'];

    // fetch category_id from tbl_announcement_category
    $category_id_stmt = $conn->prepare("SELECT category_id FROM tbl_announcement_category WHERE category_name = ?");
    $category_id_stmt->bind_param("s", $category);
    $category_id_stmt->execute();
    $category_result = $category_id_stmt->get_result();
    if ($category_result->num_rows > 0) {
        $row = $category_result->fetch_assoc();
        $category_id = $row['category_id']; // Store as category_id, not overwriting category
    } else {
        echo "Error: Invalid category";
        exit;
    }
    
    $title = $_POST['title'];
    $details = $_POST['details'];
    $numberOfParticipants = $_POST['numberOfParticipants'];
    $location_category = $_POST['volunteerLocationCategory'];
    $location_input = $_POST['volunteerLocationInputOption'];

    // Determine final location based on category and input
    $location = ($location_category === 'other' && !empty($location_input)) 
        ? $location_input 
        : $location_category;
        
    $event_date = $_POST['date'];
    $application_start = $_POST['applicationStart'];
    $application_deadline = $_POST['deadline'];
    $time_start = $_POST['time_start'];
    $time_end = $_POST['time_end'];
    $credit_points = $_POST['credit_points'];

    // File handling
    $file_name = '';
    $file_type = '';
    $file_path = '';
    
    if(isset($_FILES['file']) && $_FILES['file']['error'] == 0) {
        $file_name = $_FILES['file']['name'];
        $file_tmp = $_FILES['file']['tmp_name'];
        $file_type = $_FILES['file']['type'];
        $upload_dir = '../uploads/';

        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }

        $file_path = $upload_dir . basename($file_name);
        move_uploaded_file($file_tmp, $file_path);
    }

    // Current participants starts at 0
    $current_participants = 0;
    
    // Use proper parameter count and correct variable names in bind_param
    $stmt = $conn->prepare("INSERT INTO tbl_volunteer_drive_announcement 
        (category_id, volunteer_announcement_title, details, file, file_name, file_type, 
        number_of_participants, current_participants, location, date, application_start, 
        application_deadline, time_start, time_end, credit_points, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')");
    
    $stmt->bind_param("isssssiiisssssd", 
        $category_id, 
        $title, 
        $details, 
        $file_path, 
        $file_name, 
        $file_type, 
        $numberOfParticipants, 
        $current_participants, 
        $location, 
        $event_date, 
        $application_start, 
        $application_deadline, 
        $time_start, 
        $time_end, 
        $credit_points
    );

    if ($stmt->execute()) {
        echo "Success";
    } else {
        echo "Error: " . $stmt->error;
    }

    $stmt->close();
    $conn->close();
}
?>
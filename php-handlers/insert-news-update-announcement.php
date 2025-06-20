<?php
// Show PHP errors (for debugging)
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Function to get or insert category from tbl_announcement_category
function getOrInsertAnnouncementCategory($pdo, $category) {
    $stmt = $pdo->prepare("SELECT category_id FROM tbl_announcement_category WHERE category_name = ?");
    $stmt->execute([$category]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        return $result['category_id'];
    }

    $stmt = $pdo->prepare("INSERT INTO tbl_announcement_category (category_name) VALUES (?)");
    $stmt->execute([$category]);
    return $pdo->lastInsertId();
}

// Function to get or insert category from tbl_news_update_category
function getOrInsertNewsUpdateCategory($pdo, $category) {
    $stmt = $pdo->prepare("SELECT news_update_category_id FROM tbl_news_update_category WHERE news_update_category_name = ?");
    $stmt->execute([$category]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($result) {
        return $result['news_update_category_id'];
    }

    $stmt = $pdo->prepare("INSERT INTO tbl_news_update_category (news_update_category_name) VALUES (?)");
    $stmt->execute([$category]);
    return $pdo->lastInsertId();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get form values
    $announcementCategory = $_POST['announcementCategory'] ?? '';
    $newsUpdateCategory = $_POST['categoryNewsUpdate'] ?? '';
    $newsTitle = $_POST['news_title'] ?? '';
    $newsSource = $_POST['news_source'] ?? '';
    $newsDetails = $_POST['news_details'] ?? '';

    // Handle uploaded file
    $file = $_FILES['news_file'] ?? null;
    $fileName = '';
    $fileType = '';

    if ($file && $file['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../uploads/news_updates/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $fileName = time() . '_' . basename($file['name']);
        $filePath = $uploadDir . $fileName;
        move_uploaded_file($file['tmp_name'], $filePath);

        $fileType = pathinfo($file['name'], PATHINFO_EXTENSION);
    }

    try {
        require_once("connect.php");
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $pdo->beginTransaction();

        $categoryId = getOrInsertAnnouncementCategory($pdo, $announcementCategory);
        $newsUpdateCategoryId = getOrInsertNewsUpdateCategory($pdo, $newsUpdateCategory);

        $stmt = $pdo->prepare("INSERT INTO tbl_news_update_announcement 
            (category_id, news_update_category_id, news_update_title, news_source, news_update_details, file_name, file_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $categoryId,
            $newsUpdateCategoryId,
            $newsTitle,
            $newsSource,
            $newsDetails,
            $fileName,
            $fileType
        ]);

        $pdo->commit();
        echo 'Success';
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        http_response_code(500);
        echo 'Database error: ' . $e->getMessage();
        error_log('Database error: ' . $e->getMessage());
    }
} else {
    http_response_code(405);
    echo 'Invalid request method';
}

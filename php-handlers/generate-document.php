<?php
// utoload PHPWord (adjust if you're using composer.phar instead)
require_once __DIR__ . '/../vendor/autoload.php';

use PhpOffice\PhpWord\TemplateProcessor;

//Get Request ID from URL
$requestId = $_GET['request_id'] ?? null;
if (!$requestId || !is_numeric($requestId)) {
    die("Invalid or missing request ID.");
}

//Connect to the Database
$mysqli = new mysqli("localhost", "root", "", "u722205397_dbfiles"); // adjust if needed
if ($mysqli->connect_error) {
    die("Database connection failed: " . $mysqli->connect_error);
}

//Fetch Template File Path
$templatePath = '';
$stmt = $mysqli->prepare("
    SELECT dt.file_path
    FROM tbl_document_requests dr
    JOIN tbl_document_templates dt ON dr.template_id = dt.id
    WHERE dr.id = ?
");
$stmt->bind_param("i", $requestId);
$stmt->execute();
$stmt->bind_result($templatePath);
$stmt->fetch();
$stmt->close();

if (empty($templatePath)) {
    die("No template found for this request.");
}

$fullPath = realpath(__DIR__ . '/../uploads/document_templates/' . basename($templatePath));
if (!file_exists($fullPath)) {
    die("Template file not found: $fullPath");
}


// Fetch Field Values
$fieldValues = [];
$stmt = $mysqli->prepare("SELECT field_key, field_value FROM tbl_request_field_values WHERE request_id = ?");
$stmt->bind_param("i", $requestId);
$stmt->execute();
$result = $stmt->get_result();
while ($row = $result->fetch_assoc()) {
    $fieldValues[$row['field_key']] = $row['field_value'];
}
$stmt->close();
$mysqli->close();

if (strpos(file_get_contents($fullPath), '${current_date}') !== false) {
    $templateProcessor->setValue('current_date', date("F j, Y"));
}

// Load the template
$templateProcessor = new TemplateProcessor($fullPath);

// Replace placeholders from DB
foreach ($fieldValues as $key => $value) {
    $templateProcessor->setValue($key, htmlspecialchars($value));
}

// Inject current_date if used in template (and only then)
$templateProcessor->setValue('current_date', date("F j, Y"));


//Generate Word Document
try {
    // Replace all placeholders
    foreach ($fieldValues as $key => $value) {
        $templateProcessor->setValue($key, htmlspecialchars($value));
    }

    // Prepare filename
    $fileName = 'Request_' . $requestId . '.docx';

    // Force download
    header("Content-Description: File Transfer");
    header('Content-Disposition: attachment; filename="' . $fileName . '"');
    header('Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    header('Content-Transfer-Encoding: binary');
    header('Cache-Control: must-revalidate');
    header('Expires: 0');
    ob_clean();
    flush();

    $templateProcessor->saveAs("php://output");
} catch (Exception $e) {
    die("Error generating document: " . $e->getMessage());
}
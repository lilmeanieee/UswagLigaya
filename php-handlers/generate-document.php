<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
include 'connect.php';

// --- Load PHPWord manually ---
require_once '/lib/PhpOffice/PhpWord/Autoloader.php';
\PhpOffice\PhpWord\Autoloader::register();

use PhpOffice\PhpWord\TemplateProcessor;
use PhpOffice\PhpWord\IOFactory;

// --- Helper function ---
function getDayWithSuffix($day) {
    if (!in_array(($day % 100), [11, 12, 13])) {
        switch ($day % 10) {
            case 1: return $day . 'st';
            case 2: return $day . 'nd';
            case 3: return $day . 'rd';
        }
    }
    return $day . 'th';
}

function getFormattedDate() {
    $day = date('j');
    $month = date('F');
    $year = date('Y');
    return getDayWithSuffix($day) . " day of " . $month . ", " . $year;
}

// Validate request
if (!isset($_GET['request_id'])) {
    die("Request ID is required.");
}

$request_id = intval($_GET['request_id']);

include 'connect.php'; // Your database connection

// Fetch document request and template info
$query = "
SELECT r.*, t.name AS document_name, t.file_path
FROM tbl_document_requests r
JOIN tbl_document_templates t ON r.template_id = t.id
WHERE r.id = ?
";

$stmt = $conn->prepare($query);
$stmt->bind_param('i', $request_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    die("No such document request found.");
}

$request = $result->fetch_assoc();

// Build values array
$values = [
    'name' => $request['resident_name'],
    'formatted_date' => getFormattedDate(),
    'purpose' => $request['purpose'] ?? ''
];

// Fetch and merge custom fields
$queryFields = "SELECT field_key, field_value FROM tbl_request_field_values WHERE request_id = ?";
$stmtFields = $conn->prepare($queryFields);
$stmtFields->bind_param('i', $request_id);
$stmtFields->execute();
$resultFields = $stmtFields->get_result();

while ($field = $resultFields->fetch_assoc()) {
    $values[$field['field_key']] = $field['field_value'];
}

// Load template
$templatePath = $request['file_path']; // Already contains ../uploads/document_templates/...
if (!file_exists($templatePath)) {
    die("Template file not found at: $templatePath");
}

$template = new TemplateProcessor($templatePath);

// Replace placeholders
foreach ($values as $key => $val) {
    $template->setValue($key, htmlspecialchars($val));
}

// Save generated .docx
$cleanName = str_replace(' ', '-', $request['resident_name']);
$cleanDocName = str_replace(' ', '-', $request['document_name']);
$year = date('Y');

$filenameDocx = "{$cleanName}-{$cleanDocName}-{$year}.docx";
$filenameHtml = "{$cleanName}-{$cleanDocName}-{$year}.html";

$generatedDocxPath = "../uploads/generated_documents/" . $filenameDocx;
$generatedHtmlPath = "../uploads/generated_documents/" . $filenameHtml;

// Save Word
$template->saveAs($generatedDocxPath);

// Convert to HTML
$phpWord = IOFactory::load($generatedDocxPath);
$htmlWriter = IOFactory::createWriter($phpWord, 'HTML');
$htmlWriter->save($generatedHtmlPath);

// ✅ Now Redirect Admin to Document Editor
header("Location: /Web-based-Management-System-for-Barangay-Ligaya-with-Gamified-Features/admin/document_request/document-editor.html?file=" . urlencode($filenameHtml));
exit;
?>

<?php
require_once __DIR__ . '/../vendor/autoload.php';

use Dompdf\Dompdf;

// Get request_id
$requestId = $_GET['request_id'] ?? null;
if (!$requestId || !is_numeric($requestId)) {
    die("Invalid request ID.");
}

// Connect to DB
$mysqli = new mysqli("localhost", "root", "", "u722205397_dbfiles");
if ($mysqli->connect_error) {
    die("Database connection failed: " . $mysqli->connect_error);
}

// Get document request info + template name
$stmt = $mysqli->prepare("
    SELECT dr.resident_name, dr.purpose, dr.created_at, dt.name AS document_name
    FROM tbl_document_requests dr
    JOIN tbl_document_templates dt ON dr.template_id = dt.id
    WHERE dr.id = ?
");
$stmt->bind_param("i", $requestId);
$stmt->execute();
$result = $stmt->get_result();
$request = $result->fetch_assoc();
$stmt->close();

// Get field values
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

// Inject current date
$currentDate = date("F j, Y");

// Create printable HTML certificate
$fullName = htmlspecialchars($fieldValues['full_name'] ?? $request['resident_name']);
$purok = htmlspecialchars($fieldValues['purok'] ?? 'N/A');
$purpose = htmlspecialchars($fieldValues['purpose'] ?? $request['purpose']);

$html = <<<HTML
<style>
    body { font-family: Arial, sans-serif; line-height: 1.5; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .signature { margin-top: 80px; text-align: right; }
</style>

<div class="center">
    <h4>Republic of the Philippines</h4>
    <h5>Province of South Cotabato</h5>
    <h5>City of General Santos</h5>
    <h5>Barangay Ligaya</h5>
    <br>
    <strong>OFFICE OF THE BARANGAY CHAIRMAN</strong>
</div>

<br><br>

<div class="center">
    <h3><u>CERTIFICATION</u></h3>
</div>

<p>This is to certify that <strong>$fullName</strong>, of legal age, a resident of <strong>$purok</strong>, Barangay Ligaya, is known to be a law-abiding citizen of this community.</p>

<p>This certification is issued upon the request of the above-named person for the purpose of <strong>$purpose</strong>.</p>

<p>Issued this <strong>$currentDate</strong> at Barangay Ligaya, General Santos City.</p>

<div class="signature">
    __________________________<br>
    Hon. Ronald Tapel<br>
    Barangay Captain
</div>
HTML;

// Load into DomPDF and render
$dompdf = new Dompdf();
$dompdf->loadHtml($html);
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();

// Output as inline PDF (opens in browser)
$dompdf->stream("Document_Print_{$requestId}.pdf", ["Attachment" => false]);
exit;

document.addEventListener('DOMContentLoaded', function() {
  const printOptionsModalElement = document.getElementById('printOptionsModal');
  const downloadDocxBtn = document.getElementById('downloadDocxBtn');
  const printPdfBtn = document.getElementById('printPdfBtn');
  const printOptionsModal = new bootstrap.Modal(printOptionsModalElement);
  let currentRequestId = null;

  tableBody.addEventListener('click', function(event) {
    const button = event.target.closest('.print-button');
    if (button) {
      currentRequestId = button.getAttribute('data-request-id');
      printOptionsModal.show();
    }
  });

  printOptionsModalElement.addEventListener('hidden.bs.modal', function () {
    currentRequestId = null;
  });

  downloadDocxBtn.addEventListener('click', function() {
    if (currentRequestId) {
      window.location.href = `../../php-handlers/generate-document.php?request_id=${currentRequestId}`;
      printOptionsModal.hide();
    }
  });

  printPdfBtn.addEventListener('click', function() {
    if (currentRequestId) {
      window.open(`../../php-handlers/generate-printable-pdf.php?request_id=${currentRequestId}`, '_blank');
      printOptionsModal.hide();
    }
  });
});

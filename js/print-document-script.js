function printCertificate() {
    const originalContent = document.body.innerHTML;
    const certificateContent = document.getElementById('certificate-content').innerHTML;
  
    document.body.innerHTML = `
      <html>
        <head>
          <title>Print Certificate</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 2rem;
              color: #000;
            }
          </style>
        </head>
        <body>
          ${certificateContent}
        </body>
      </html>
    `;
  
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Reload to restore original JavaScript events
  }
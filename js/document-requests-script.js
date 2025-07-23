// GLOBAL VARIABLES
const tableBody = document.querySelector("tbody");
const searchInput = document.getElementById('search');
const statusButtons = document.querySelectorAll('.status-filter button');
let currentPage = 1;
let currentStatus = ''; // '', 'Pending', 'Approved', 'Rejected'

// FUNCTIONS

// Load document requests
function loadRequests(page = 1, search = '', status = '') {
  fetch(`../../php-handlers/fetch-document-requests.php?page=${page}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`)

    .then(response => response.json())
    .then(data => {
      tableBody.innerHTML = "";

      if (data.requests.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center">No document requests found.</td></tr>`;
        renderPagination(0, data.limit, 1, search, status);
        return;
      }

      data.requests.forEach(request => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>REQ - 000${request.id}</td>
          <td>${request.resident_name}</td>
          <td>${request.document_name}</td>
          <td>${formatDate(request.created_at)}</td>
          <td>${request.purpose}</td>
          <td>${renderStatusBadge(request.status)}</td>
          <td>
            <button class="btn btn-sm btn-primary view-btn" data-id="${request.id}" title="View Details"><i class="bi bi-eye"></i></button>
            ${request.status === "Pending" ? `
              <button class="btn btn-sm btn-success approve-btn" data-id="${request.id}" title="Approve Request"><i class="bi bi-check-lg"></i></button>
              <button class="btn btn-sm btn-danger reject-btn" data-id="${request.id}" title="Reject Request"><i class="bi bi-x-lg"></i></button>
            ` : request.status === "Approved" ? `
              <button class="btn btn-sm btn-secondary print-button" data-request-id="${request.id}" title="Print Document"><i class="bi bi-printer"></i></button>
            ` : ""}
          </td>
        `;
        tableBody.appendChild(tr);
      });

      renderPagination(data.total, data.limit, data.page, search, status);
      attachActionListeners();
    })
    .catch(err => {
      console.error('Error loading document requests:', err);
    });
}

// Render pagination
function renderPagination(total, limit, currentPage, search = '', status = '') {
  const totalPages = Math.ceil(total / limit);
  const paginationContainer = document.querySelector(".pagination");

  paginationContainer.innerHTML = "";

  if (totalPages <= 1) return;

  if (currentPage > 1) {
    paginationContainer.innerHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${currentPage - 1}" data-search="${search}" data-status="${status}">Previous</a></li>`;
  }

  for (let i = 1; i <= totalPages; i++) {
    paginationContainer.innerHTML += `
      <li class="page-item ${i === currentPage ? "active" : ""}">
        <a class="page-link" href="#" data-page="${i}" data-search="${search}" data-status="${status}">${i}</a>
      </li>
    `;
  }

  if (currentPage < totalPages) {
    paginationContainer.innerHTML += `<li class="page-item"><a class="page-link" href="#" data-page="${currentPage + 1}" data-search="${search}" data-status="${status}">Next</a></li>`;
  }

  paginationContainer.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const page = parseInt(a.dataset.page);
      const search = document.getElementById('search').value.trim();
      loadRequests(page, search, currentStatus);
    });
  });
}

// Attach action listeners (approve, reject, view)
function attachActionListeners() {
  document.querySelectorAll('.approve-btn').forEach(button => {
    button.addEventListener('click', () => {
      const requestId = button.dataset.id;
      if (confirm("⚠️ You are about to approve this document request. Confirm?")) {
        updateRequestStatus(requestId, 'Approved');
      }
    });
  });

  document.querySelectorAll('.reject-btn').forEach(button => {
    button.addEventListener('click', () => {
      const requestId = button.dataset.id;
      if (confirm("⚠️ You are about to reject this document request. Confirm?")) {
        updateRequestStatus(requestId, 'Rejected');
      }
    });
  });

  document.querySelectorAll('.view-btn').forEach(button => {
    button.addEventListener('click', () => {
      const requestId = button.dataset.id;
      openViewDetailsModal(requestId);
    });
  });

  /*document.querySelectorAll('.print-btn').forEach(button => {
    button.addEventListener('click', () => {
      const requestId = button.dataset.id;
      // Open the PHP generator that outputs the Word doc
      // window.open(`../../php-handlers/generate-document.php?request_id=${requestId}`, '_blank');
      window.open(`../../php-handlers/generate-printable-pdf.php?request_id=${requestId}`, '_blank');
    });
  }); */
}

// Update request status (approve/reject)
function updateRequestStatus(id, status) {
  fetch("../../php-handlers/update-document-status.php", {
    method: "POST",
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `id=${id}&status=${status}`
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert(`Request ${status.toLowerCase()} successfully!`);
      loadRequests(currentPage, searchInput.value.trim(), currentStatus);
    } else {
      alert('Failed to update status.');
    }
  })
  .catch(err => {
    console.error('Error updating status:', err);
  });
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
}

// Render status badge
function renderStatusBadge(status) {
  switch (status) {
    case 'Pending': return `<span class="badge bg-warning">Pending</span>`;
    case 'Approved': return `<span class="badge bg-success">Approved</span>`;
    case 'Rejected': return `<span class="badge bg-danger">Rejected</span>`;
    default: return `<span class="badge bg-secondary">${status}</span>`;
  }
}

// Open modal to view details
function openViewDetailsModal(id) {
  document.getElementById('modalLoadingSpinner').classList.remove('d-none');
  document.getElementById('modalActualContent').classList.add('d-none');

  const viewModal = new bootstrap.Modal(document.getElementById('viewDetailsModal'));
  viewModal.show();

    fetch(`../../php-handlers/get-document-request-details.php?id=${id}`)
    .then(response => response.json())
    .then(data => {
      const actualContent = document.getElementById('modalActualContent');
      let html = `
        <h6><strong>Document:</strong> ${data.document_name}</h6>
        <h6><strong>Requested By:</strong> ${data.resident_name}</h6>
        <h6><strong>Purpose:</strong> ${data.purpose}</h6>
        <hr>
        <h6><strong>Custom Fields:</strong></h6>
        <ul>
      `;

      if (data.custom_fields.length > 0) {
        data.custom_fields.forEach(field => {
          html += `<li><strong>${field.label}:</strong> ${field.value}</li>`;
        });
      } else {
        html += `<li>No custom fields submitted.</li>`;
      }
      html += `</ul><hr>`;

      html += `<h6><strong>Attachments:</strong></h6>`;
      if (data.attachments.length > 0) {
        data.attachments.forEach(attachment => {
          const ext = attachment.file_name.split('.').pop().toLowerCase();
          if (["jpg", "jpeg", "png", "gif"].includes(ext)) {
            html += `<img src="/php-handlers/view-doc-req-attachment.php?id=${attachment.id}" class="img-fluid mb-2" alt="Attachment Image">`;
          } else if (ext === "pdf") {
            html += `<iframe src="/php-handlers/view-doc-req-attachment.php?id=${attachment.id}" width="100%" height="500px" class="mb-2"></iframe>`;
          } else {
            html += `<a href="/php-handlers/view-doc-req-attachment.php?id=${attachment.id}" target="_blank" class="btn btn-sm btn-outline-secondary mb-2">${attachment.file_name}</a><br>`;
          }
        });
      } else {
        html += `<p>No attachments uploaded.</p>`;
      }

      actualContent.innerHTML = html;
      document.getElementById('modalLoadingSpinner').classList.add('d-none');
      document.getElementById('modalActualContent').classList.remove('d-none');
    })
    .catch(error => {
      console.error('Error loading request details:', error);
    });
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
  searchInput.addEventListener('input', () => {
    const search = searchInput.value.trim();
    loadRequests(1, search, currentStatus);
  });

  statusButtons.forEach(button => {
    button.addEventListener('click', () => {
      statusButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      const status = button.textContent.trim();
      currentStatus = status === 'All' ? '' : status;
      loadRequests(1, searchInput.value.trim(), currentStatus);
    });
  });

  loadRequests();
});



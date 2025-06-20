document.getElementById('accountType').addEventListener('change', function () {
    const selected = this.value;
    const commonFields = document.getElementById('commonFields');
    const adminFields = document.getElementById('adminFields');

    // Show common fields
    commonFields.classList.remove('hidden');

    if (selected === 'admin') {
        adminFields.classList.remove('hidden');
    } else {
        adminFields.classList.add('hidden');
    }
});



// Sample account data for demonstration purposes
const sampleAccounts = [
    {
        accID: '32',
      fullname: 'Princess',
      username: 'captain',
      email: 'captain@brgy.com',
      password: '123456',
      position: 'Barangay Captain',
      committee: 'Health & Safety'
    },
    {
        accID: '34',
      fullname: 'Mark',
      username: 'secretary01',
      email: 'secretary@brgy.com',
      password: 'secret',
      position: 'Secretary',
      committee: 'Education'
    }
  ];
  
  function renderTable() {
    const tbody = document.getElementById('accountTableBody');
    tbody.innerHTML = '';
    sampleAccounts.forEach((acc, i) => {
      tbody.innerHTML += `
        <tr>
          <td>${acc.fullname}</td>
          <td>${acc.username}</td>
          <td>${acc.email}</td>
          <td>${acc.password}</td>
          <td>${acc.position}</td>
          <td>${acc.committee}</td>
          <td>
            <button class="btn btn-sm btn-warning me-1" onclick="openEdit(${i})">Edit</button>
            <button class="btn btn-sm btn-danger" onclick="deleteAccount(${i})">Delete</button>
          </td>
        </tr>
      `;
    });
  }
  
  function openEdit(index) {
    const acc = sampleAccounts[index];
    document.getElementById('editAccountID').value = acc.accID;
    document.getElementById('editIndex').value = index;
    document.getElementById('editFullname').value = acc.fullname;
    document.getElementById('editUsername').value = acc.username;
    document.getElementById('editEmail').value = acc.email;
    document.getElementById('editPassword').value = acc.password;
    document.getElementById('editPosition').value = acc.position;
    document.getElementById('editCommittee').value = acc.committee;
  
    const modal = new bootstrap.Modal(document.getElementById('editAccountModal'));
    modal.show();
  }
  
  function deleteAccount(index) {
    if (confirm('Are you sure you want to delete this account?')) {
      sampleAccounts.splice(index, 1);
      renderTable();
    }
  }
  
  document.getElementById('editForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const index = document.getElementById('editIndex').value;
    sampleAccounts[index] = {
        accID: document.getElementById('editAccountID').value,
      fullname: document.getElementById('editFullname').value,
      username: document.getElementById('editUsername').value,
      email: document.getElementById('editEmail').value,
      password: document.getElementById('editPassword').value,
      position: document.getElementById('editPosition').value,
      committee: document.getElementById('editCommittee').value
    };
    bootstrap.Modal.getInstance(document.getElementById('editAccountModal')).hide();
    renderTable();
  });
  
  renderTable();
  
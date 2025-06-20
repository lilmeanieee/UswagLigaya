document.addEventListener('DOMContentLoaded', function() {
    // Handle the edit points buttons
    const editButtons = document.querySelectorAll('.edit-points');
    const editModal = new bootstrap.Modal(document.getElementById('editPointsModal'));
    
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            const points = this.getAttribute('data-points');
            
            document.getElementById('edit-user-id').value = userId;
            document.getElementById('edit-points').value = points;
            
            editModal.show();
        });
    });
    
    // Handle new type selection
    const typeSelect = document.getElementById('type');
    const newTypeContainer = document.querySelector('.new-type-container');
    
    if (typeSelect && newTypeContainer) {
        typeSelect.addEventListener('change', function() {
            if (this.value === 'new_type') {
                newTypeContainer.classList.remove('d-none');
                document.getElementById('new_type').setAttribute('required', 'required');
            } else {
                newTypeContainer.classList.add('d-none');
                document.getElementById('new_type').removeAttribute('required');
            }
        });
    }
});
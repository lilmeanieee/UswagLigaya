document.addEventListener('DOMContentLoaded', () => {

    const creditSettingsModal = document.getElementById('creditSettingsModal');
    const creditDeductionInput = document.getElementById('creditDeductionInput');
    const saveCreditSettingsBtn = document.getElementById('saveCreditSettingsBtn');

    // Function to show a custom alert message (replaces native alert)
    function showCustomAlert(message, type = 'success') {
        const alertContainer = document.createElement('div');
        alertContainer.className = `alert alert-${type} alert-dismissible fade show fixed-bottom m-3`;
        alertContainer.innerHTML = `
            <div>${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(alertContainer);
        setTimeout(() => alertContainer.remove(), 5000);
    }

    // Function to fetch the current credit setting from the database
    function fetchCreditSetting() {
        const formData = new FormData();
        formData.append('action', 'get');

        fetch('../../php-handlers/credit-settings-api.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    creditDeductionInput.value = data.credit_points;
                } else {
                    console.error('Failed to fetch credit settings:', data.message);
                    showCustomAlert('Failed to load credit settings.', 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showCustomAlert('An error occurred while fetching settings.', 'danger');
            });
    }

    // Function to save the new credit setting to the database
    function saveCreditSetting() {
        const newCreditPoints = creditDeductionInput.value;
        if (newCreditPoints < 0) {
            showCustomAlert("Credit points cannot be negative.", 'danger');
            return;
        }

        const formData = new FormData();
        formData.append('action', 'update');
        formData.append('credit_points', newCreditPoints);

        fetch('../../php-handlers/credit-settings-api.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showCustomAlert(data.message, 'success');
                    // Automatically close the modal after a successful save
                    const modal = bootstrap.Modal.getInstance(creditSettingsModal);
                    if (modal) {
                        modal.hide();
                    }
                } else {
                    showCustomAlert('Error saving settings: ' + data.message, 'danger');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showCustomAlert('An unexpected error occurred. Please try again.', 'danger');
            });
    }

    // Event listeners
    if (creditSettingsModal) {
        creditSettingsModal.addEventListener('show.bs.modal', fetchCreditSetting);
    }

    if (saveCreditSettingsBtn) {
        saveCreditSettingsBtn.addEventListener('click', saveCreditSetting);
    }
});

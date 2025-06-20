document.addEventListener('DOMContentLoaded', function () {
    fetchCurrentSettings();

    document.getElementById('conversionForm').addEventListener('submit', function (e) {
        e.preventDefault();
        saveRate();
    });

    document.getElementById('thresholdForm').addEventListener('submit', function (e) {
        e.preventDefault();
        saveThreshold();
    });
});

function saveRate() {
    const creditPoints = document.getElementById('creditInput').value.trim();
    const redeemPoints = document.getElementById('redeemInput').value.trim();

    if (!creditPoints || !redeemPoints || isNaN(creditPoints) || isNaN(redeemPoints)) {
        alert("Please enter valid numeric values for Credit Points and Redeemable Points.");
        return;
    }

    const formData = new FormData();
    formData.append('credit_points', creditPoints);
    formData.append('redeemable_points', redeemPoints);

    fetch('/php-handlers/insert-conversion-rate.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            fetchCurrentSettings();
            document.getElementById('conversionForm').reset();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Something went wrong while saving the conversion rate.");
    });
}

function saveThreshold() {
    const minThreshold = document.getElementById('minThreshold').value.trim();

    if (!minThreshold || isNaN(minThreshold)) {
        alert("Please enter a valid numeric value for Minimum Credit Points Required.");
        return;
    }

    const formData = new FormData();
    formData.append('minimum_points_required', minThreshold);

    fetch('/php-handlers/insert-conversion-threshold.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert(data.message);
            fetchCurrentSettings();
            document.getElementById('thresholdForm').reset();
        } else {
            alert(data.message);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("Something went wrong while saving the threshold.");
    });
}

function fetchCurrentSettings() {
    fetch('/php-handlers/get-conversion-settings.php')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const info = document.createElement('div');
                info.classList.add('alert', 'alert-info', 'mb-4');
                info.innerHTML = `
                    <strong>Current Conversion:</strong> ${data.settings.credit_points} credit = ${data.settings.redeemable_points} redeemable <br>
                    <strong>Minimum Credit Points Required:</strong> ${data.settings.minimum_points_required}
                `;

                const container = document.querySelector('.container.pt-3');
                const existingInfo = container.querySelector('.alert-info');
                if (existingInfo) {
                    container.removeChild(existingInfo);
                }
                container.insertBefore(info, container.firstChild);
            }
        })
        .catch(error => {
            console.error("Error fetching settings:", error);
        });
}

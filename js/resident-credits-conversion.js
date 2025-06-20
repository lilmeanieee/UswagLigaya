// Add this to your JavaScript file or within <script> tags
$(document).ready(function() {
    $('#convertPointsModal').on('show.bs.modal', function() {
        loadConversionData();
    });
    
    // Function to load conversion data
    function loadConversionData() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const residentId = userData.resident_id;
        
        // Debug the resident ID
        console.log("Resident ID:", residentId);
        
        // Don't show an alert, just log to console if not found
        if (!residentId) {
            console.log('Resident ID not found in userData, will try session.');
        }
    
        $.ajax({
            url: '../../php-handlers/get-convert-credits-data.php',
            type: 'POST',
            dataType: 'json',
            data: { resident_id: residentId },
            success: function(data) {
                if (data.status === 'success') {
                    // Update displayed values with data from database
                    $('#modalAvailableCredit').text(data.credit_points);
                    $('#modalRedeemablePoints').text(data.redeemable_points);
                    $('#creditPointsToConvert').attr('max', data.credit_points);
                    $('#creditPointsToConvert').attr('min', data.minimum_points_required);
                    
                    // Set the max value for the input field
                    $('#creditPoints').attr('max', data.credit_points);
                    
                    // Create a conversion rate display info
                    const conversionInfo = `
                        <div class="conversion-info mt-2">
                            <p><strong>Conversion Rate:</strong> ${data.credit_points_rate} credit = ${data.redeemable_points_rate} redeemable</p>
                            <p><strong>Minimum Credit Points Required:</strong> ${data.minimum_points_required}</p>
                        </div>
                    `;
                    
                    // Check if conversion info already exists
                    if ($('.conversion-info').length) {
                        $('.conversion-info').replaceWith(conversionInfo);
                    } else {
                        // Add the conversion info after the credit points input
                        $('#creditPointsToConvert').parent().append(conversionInfo);
                    }
                    
                    // Store conversion rates as data attributes for easy access
                    $('#convertPointsModal').data('creditRate', data.credit_points_rate);
                    $('#convertPointsModal').data('redeemableRate', data.redeemable_points_rate);
                    $('#convertPointsModal').data('minPoints', data.minimum_points_required);
                    
                    // Clear previous values
                    $('#creditPointsToConvert').val(data.minimum_points_required);
                    updateRedeemablePoints();
                } else {
                    console.error('Error loading data:', data.message);
                    alert('Error loading data: ' + data.message);
                }
            },
            error: function(xhr, status, error) {
                console.error('Error fetching resident data:', error);
                console.log('Response Text:', xhr.responseText);
                
                // Try to parse the error response
                try {
                    const errorData = JSON.parse(xhr.responseText);
                    alert('Failed to load conversion data: ' + errorData.message);
                } catch (e) {
                    // If it's not valid JSON, show a generic message
                    alert('Failed to load conversion data. Please try again later.');
                }
            }
        });
    }
    
    // Calculate redeemable points in real-time as user types
    $('#creditPointsToConvert').on('input', function() {
        updateRedeemablePoints();
    });
    
    // Function to update redeemable points display
    function updateRedeemablePoints() {
        let creditPoints = parseInt($('#creditPointsToConvert').val()) || 0;
        let availableCredit = parseInt($('#modalAvailableCredit').text()) || 0;
        
        // Get conversion settings from data attributes
        let minimumPoints = parseInt($('#convertPointsModal').data('minPoints')) || 10;
        let creditRate = parseFloat($('#convertPointsModal').data('creditRate')) || 1;
        let redeemableRate = parseFloat($('#convertPointsModal').data('redeemableRate')) || 0.5;
        
        // Validate input
        if (creditPoints > availableCredit) {
            creditPoints = availableCredit;
            $('#creditPointsToConvert').val(availableCredit);
        }
        
        if (creditPoints < minimumPoints && creditPoints !== 0) {
            // If user enters less than minimum and it's not empty, show warning
            $('#redeemableResult').val('Minimum conversion is ' + minimumPoints + ' points');
            $('.modal-footer .btn-primary').prop('disabled', true);
            return;
        } else {
            $('.modal-footer .btn-primary').prop('disabled', false);
        }
        
        // Calculate redeemable points based on the rate
        let redeemablePoints = 0;
        if (creditPoints >= minimumPoints) {
            redeemablePoints = (creditPoints * redeemableRate) / creditRate;
        }
        
        // Update the result field - ensure it's an integer or fixed decimal
        $('#redeemableResult').val(redeemablePoints.toFixed(1) + ' redeemable points');
    }
    
    // Handle the conversion process
    $('.modal-footer .btn-primary').click(function() {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const residentId = userData.resident_id;
        let creditPoints = parseInt($('#creditPointsToConvert').val()) || 0;
        let minimumPoints = parseInt($('#convertPointsModal').data('minPoints')) || 10;
        
        if (creditPoints < minimumPoints) {
            alert('You must convert at least ' + minimumPoints + ' credit points');
            return;
        }
        
        // Send conversion request to server
        $.ajax({
            url: '../../php-handlers/resident-convert-points.php',
            type: 'POST',
            data: {
                creditPoints: creditPoints,
                resident_id: residentId
            },
            dataType: 'json',
            success: function(response) {
                if (response.status === 'success') {
                    // Update modal values
                    $('#modalAvailableCredit').text(response.new_credit_points);
                    $('#modalRedeemablePoints').text(response.new_redeemable_points);

                    // Update dashboard values
                    $('#creditPoints').text(response.new_credit_points);
                    $('#redeemablePoints').text(response.new_redeemable_points);

                    // Reset form
                    $('#creditPointsToConvert').val(response.new_credit_points);
                    updateRedeemablePoints();

                    // Close modal
                    $('#convertPointsModal').modal('hide');
                    
                } else {
                    alert('Error: ' + response.message);
                }
            },
            error: function(xhr, status, error) {
                console.error('Error converting points:', error);
                console.log('Response Text:', xhr.responseText);
                
                // Try to parse the error response
                try {
                    const errorData = JSON.parse(xhr.responseText);
                    alert('Failed to convert points: ' + errorData.message);
                } catch (e) {
                    // If it's not valid JSON, show a generic message
                    alert('Failed to convert points. Please try again later.');
                }
            }
        });
    });
});
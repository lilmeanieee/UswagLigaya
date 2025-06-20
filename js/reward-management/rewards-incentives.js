// Function to load and display rewards
async function loadRewards() {
    try {
        console.log('Loading rewards...');
        const response = await fetch('php-handlers/reward-management/fetch-reward.php');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const rewards = await response.json();
        console.log('Rewards loaded:', rewards);
        
        // Clear existing rewards display
        const tableBody = document.getElementById('incentivesTable');
        if (tableBody) {
            tableBody.innerHTML = ''; // Clear existing content
            
            if (rewards.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No rewards available.</td></tr>';
                return;
            }
            
            // Display each reward as table rows
            rewards.forEach(reward => {
                const tableRow = createRewardTableRow(reward);
                tableBody.appendChild(tableRow);
            });
        } else {
            console.error('Table body not found! Make sure you have an element with id="incentivesTable"');
        }
        
    } catch (error) {
        console.error('Error loading rewards:', error);
        const tableBody = document.getElementById('incentivesTable');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading rewards. Please try again.</td></tr>';
        }
    }
}

// Function to create a table row for each reward
function createRewardTableRow(reward) {
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
        <td>${reward.id}</td>
        <td>
            <img src="${reward.image}" alt="${reward.name}" 
                 style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMSAzNUwyOSAzNUwyNSAyOEwyMSAzNVoiIGZpbGw9IiM5Q0E2QUYiLz4KPC9zdmc+'" />
        </td>
        <td><strong>${reward.name}</strong></td>
        <td>${reward.description}</td>
        <td><span class="badge bg-primary">${reward.points} points</span></td>
        <td>
            <button class="btn btn-sm btn-outline-primary me-1" onclick="editReward(${reward.id})" title="Edit">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteReward(${reward.id})" title="Delete">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;
    
    return tr;
}

// Your existing form submission code with reload added
document.getElementById('rewardForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    console.log('Form submission started...');

    // Get form values
    const rewardName = document.getElementById('rewardName').value;
    const rewardType = document.getElementById('rewardType').value;
    const rewardDescription = document.getElementById('rewardDescription').value;
    const rewardPoints = document.getElementById('rewardPoints').value;
    const rewardImage = document.getElementById('rewardImage').files[0];

    console.log('Form values:', {
        rewardName,
        rewardType,
        rewardDescription,
        rewardPoints,
        rewardImage: rewardImage ? rewardImage.name : 'No file'
    });

    // Basic validation
    if (!rewardName || !rewardType || !rewardDescription || !rewardPoints || !rewardImage) {
        alert('Please fill in all fields!');
        console.warn('Validation failed: Some fields are empty');
        return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('rewardName', rewardName);
    formData.append('rewardType', rewardType);
    formData.append('rewardDescription', rewardDescription);
    formData.append('rewardPoints', rewardPoints);
    formData.append('rewardImage', rewardImage);

    console.log('FormData created, sending request...');

    try {
        const response = await fetch('php-handlers/reward-management/add-reward.php', {
            method: 'POST',
            body: formData
        });
    
        const resultText = await response.text();
    
        // Check for HTTP errors
        if (!response.ok) {
            console.error(`Server responded with error ${response.status}: ${response.statusText}`);
            console.error('Raw response text:', resultText);
            alert(`Server error: ${response.status} - ${response.statusText}`);
            return;
        }
    
        console.log('Server response:', resultText);
    
        if (resultText.includes('successfully')) {
            alert('Reward added successfully!');
            document.getElementById('rewardForm').reset();
    
            // Close modal if using Bootstrap 5
            const modal = bootstrap.Modal.getInstance(document.getElementById('addRewardModal'));
            if (modal) modal.hide();
            
            // *** RELOAD REWARDS AFTER SUCCESSFUL ADDITION ***
            await loadRewards();
        } else {
            alert('Server response: ' + resultText);
            console.warn('Unexpected server response:', resultText);
        }
    } catch (error) {
        console.error('Error during fetch:', error);
        alert('An error occurred while submitting the form. Please try again later.');
    }
});

// Load rewards when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadRewards();
});






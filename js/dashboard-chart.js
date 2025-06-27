    document.addEventListener('DOMContentLoaded', function () {
        fetch('/UswagLigaya/php-handlers/get-dashboard-data.php')
            .then(response => response.json())
            .then(data => {
                // Update Total Residents Count
                document.getElementById('totalResidentsCount').innerText = data.totalResidents;

                // Gender Distribution Chart
                const genderCtx = document.getElementById('genderDistributionChart').getContext('2d');
                new Chart(genderCtx, {
                    type: 'pie',
                    data: {
                        labels: Object.keys(data.genderDistribution),
                        datasets: [{
                            data: Object.values(data.genderDistribution),
                            backgroundColor: ['#007bff', '#dc3545'], // Blue = Male, Red = Female
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'bottom' },
                            title: { display: true, text: 'Gender Distribution' }
                        }
                    }
                });

                // Age Group Distribution Chart
                const ageCtx = document.getElementById('ageGroupDistributionChart').getContext('2d');
                new Chart(ageCtx, {
                    type: 'pie',
                    data: {
                        labels: Object.keys(data.ageDistribution),
                        datasets: [{
                            data: Object.values(data.ageDistribution),
                            backgroundColor: ['#ffc107', '#28a745', '#6c757d'], // Yellow, Green, Gray
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: { position: 'bottom' },
                            title: { display: true, text: 'Age Group Distribution' }
                        }
                    }
                });

                // Gender by Purok (Bar)
                const puroks = Object.keys(data.genderByPurok);
                const males = puroks.map(p => parseInt(data.genderByPurok[p]?.Male || 0));
                const females = puroks.map(p => parseInt(data.genderByPurok[p]?.Female || 0));
                
                const maxValue = Math.max(...males.concat(females));

                const genderPurokCtx = document.getElementById('genderByPurokChart').getContext('2d');
                new Chart(genderPurokCtx, {
                    type: 'bar',
                    data: {
                        labels: puroks,
                        datasets: [
                            { label: 'Male', data: males, backgroundColor: '#007bff' },
                            { label: 'Female', data: females, backgroundColor: '#dc3545' }
                        ]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: { display: true, text: 'Gender Distribution by Purok' },
                            legend: { position: 'top' }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                suggestedMax: Math.ceil(maxValue + 1),
                                ticks: {
                                    stepSize: 1,
                                    callback: function(value) {
                                        return Number.isInteger(value) ? value : null;
                                    }
                                }
                            }
                        }
                    }
                });

                // Age Group by Purok (Stacked Bar)
                const ageGroups = ['Minor', 'Adult', 'Senior'];
                const groupData = ageGroups.map(group =>
                    puroks.map(p => data.ageGroupByPurok[p]?.[group] || 0)
                );

                const agePurokCtx = document.getElementById('ageGroupByPurokChart').getContext('2d');
                new Chart(agePurokCtx, {
                    type: 'bar',
                    data: {
                        labels: puroks,
                        datasets: ageGroups.map((group, i) => ({
                            label: group,
                            data: groupData[i],
                            backgroundColor: ['#ffc107', '#28a745', '#6c757d'][i]
                        }))
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            title: { display: true, text: 'Age Group Distribution by Purok' },
                            legend: { position: 'top' }
                        },
                        scales: {
                            x: { stacked: true },
                            y: {
                                stacked: true,
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1,
                                    callback: function(value) {
                                        return Number.isInteger(value) ? value : null;
                                    }
                                }
                            }
                        }
                    }
                });
            })
            .catch(error => {
                console.error('Error loading dashboard data:', error);
            });
    });

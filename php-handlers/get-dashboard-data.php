    <?php
    include 'connect.php';
    header('Content-Type: application/json');

    // Fetch Total Residents
    $totalQuery = "SELECT COUNT(*) AS total FROM tbl_household_members";
    $totalResult = $conn->query($totalQuery);
    $totalRow = $totalResult->fetch_assoc();
    $totalResidents = $totalRow['total'];

    // Fetch Gender Distribution
    $genderQuery = "SELECT sex, COUNT(*) AS count FROM tbl_household_members GROUP BY sex";
    $genderResult = $conn->query($genderQuery);
    $genderDistribution = [];
    while ($row = $genderResult->fetch_assoc()) {
        $gender = ($row['sex'] === 'M') ? 'Male' : 'Female';
        $genderDistribution[$gender] = (int)$row['count'];
    }

    // Fetch Age Group Distribution
    $ageQuery = "
    SELECT
        CASE
            WHEN TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) <= 17 THEN 'Minor'
            WHEN TIMESTAMPDIFF(YEAR, birthdate, CURDATE()) <= 59 THEN 'Adult'
            ELSE 'Senior'
        END AS age_group,
        COUNT(*) AS count
    FROM tbl_household_members
    GROUP BY age_group";
    $ageResult = $conn->query($ageQuery);
    $ageDistribution = [];
    while ($row = $ageResult->fetch_assoc()) {
        $ageDistribution[$row['age_group']] = $row['count'];
    }

    // Fetch Gender Distribution by Purok
    $genderPurokQuery = "
    SELECT hh.purok, hm.sex, COUNT(*) AS count
    FROM tbl_household_members hm
    JOIN tbl_households hh ON hm.household_id = hh.household_id
    GROUP BY hh.purok, hm.sex";
    $genderPurokResult = $conn->query($genderPurokQuery);
    $genderByPurok = [];
    while ($row = $genderPurokResult->fetch_assoc()) {
        $gender = ($row['sex'] === 'M') ? 'Male' : 'Female';
        $genderByPurok[$row['purok']][$gender] = (int)$row['count'];
    }

    // Fetch Age Group Distribution by Purok
    $agePurokQuery = "
    SELECT hh.purok,
        CASE
            WHEN TIMESTAMPDIFF(YEAR, hm.birthdate, CURDATE()) <= 17 THEN 'Minor'
            WHEN TIMESTAMPDIFF(YEAR, hm.birthdate, CURDATE()) <= 59 THEN 'Adult'
            ELSE 'Senior'
        END AS age_group,
        COUNT(*) AS count
    FROM tbl_household_members hm
    JOIN tbl_households hh ON hm.household_id = hh.household_id
    GROUP BY hh.purok, age_group";
    $agePurokResult = $conn->query($agePurokQuery);
    $ageGroupByPurok = [];
    while ($row = $agePurokResult->fetch_assoc()) {
        $ageGroupByPurok[$row['purok']][$row['age_group']] = $row['count'];
    }

    // Output JSON
    echo json_encode([
        'totalResidents' => $totalResidents,
        'genderDistribution' => $genderDistribution,
        'ageDistribution' => $ageDistribution,
        'genderByPurok' => $genderByPurok,
        'ageGroupByPurok' => $ageGroupByPurok
    ]);
    ?>

<?php
session_start();

if (isset($_SESSION['resident_id'])) {
    echo json_encode([
        'isLoggedIn' => true,
        'user' => [
            'id' => $_SESSION['resident_id'],
            'name' => $_SESSION['full_name'],
            'experience points' => $_SESSION['xp'],
            'redeemable points' => $_SESSION['redeemable_points']
        ]
    ]);
} else {
    echo json_encode(['isLoggedIn' => false]);
}

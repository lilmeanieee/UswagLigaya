<?php
session_start();

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Store user inputs in session
    $_SESSION['signup_data'] = [
        'first_name' => $_POST['first_name'],
        'last_name' => $_POST['last_name'],
        'contact_number' => $_POST['contact_number'],
        'email' => $_POST['email'],
        'password' => password_hash($_POST['password'], PASSWORD_DEFAULT) // Secure password
    ];
    
    // Redirect to ID verification page
    header("Location: ../html/signup-IDverification.html");
    exit();
}
?>
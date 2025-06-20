<?php
session_start();
// Clear all session variables
$_SESSION = array();

// Destroy the session
session_destroy();

// No need for a response - this is just clearing the session
?>
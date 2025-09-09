<?php
session_start(); // Start session for user tracking

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Include database connection
include_once '../../php-handlers/connect.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'Method not allowed. Only POST requests are accepted.',
        'error_code' => 'METHOD_NOT_ALLOWED'
    ]);
    exit;
}

// Function to validate email format
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Function to validate phone number (Philippine format)
function validatePhoneNumber($phone) {
    // Remove any non-digit characters
    $phone = preg_replace('/\D/', '', $phone);
    // Check if it's 11 digits and starts with 09
    return preg_match('/^09\d{9}$/', $phone);
}

// Function to validate employee ID format
function validateEmployeeId($employeeId) {
    // Allow alphanumeric with dashes/underscores, 3-20 characters
    return preg_match('/^[A-Za-z0-9_-]{3,20}$/', $employeeId);
}

// Function to generate secure temporary password
function generateTempPassword($length = 12) {
    $characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    $password = '';
    for ($i = 0; $i < $length; $i++) {
        $password .= $characters[random_int(0, strlen($characters) - 1)];
    }
    return $password;
}

// Function to handle file upload
function handleProfilePictureUpload($file, $employeeId) {
    $uploadDir = '../../uploads/profile_pictures/';
    
    // Create directory if it doesn't exist
    if (!is_dir($uploadDir)) {
        if (!mkdir($uploadDir, 0755, true)) {
            throw new Exception('Failed to create upload directory');
        }
    }
    
    // Validate file upload
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('File upload failed with error code: ' . $file['error']);
    }
    
    // Get file information
    $fileInfo = pathinfo($file['name']);
    $fileExtension = strtolower($fileInfo['extension'] ?? '');
    
    // Validate file type
    $allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (!in_array($fileExtension, $allowedTypes)) {
        throw new Exception('Invalid file type. Allowed types: ' . implode(', ', $allowedTypes));
    }
    
    // Validate file size (5MB max)
    $maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if ($file['size'] > $maxSize) {
        throw new Exception('File size too large. Maximum allowed size is 5MB.');
    }
    
    // Validate if it's actually an image
    $imageInfo = getimagesize($file['tmp_name']);
    if ($imageInfo === false) {
        throw new Exception('Uploaded file is not a valid image.');
    }
    
    // Generate unique filename
    $fileName = $employeeId . '_' . time() . '_' . uniqid() . '.' . $fileExtension;
    $fullPath = $uploadDir . $fileName;
    
    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
        throw new Exception('Failed to save uploaded file.');
    }
    
    // Return relative path for database storage
    return 'uploads/profile_pictures/' . $fileName;
}

try {
    // Start database transaction
    $pdo->beginTransaction();
    
    // Sanitize and validate input data
    $firstName = trim($_POST['firstName'] ?? '');
    $middleName = trim($_POST['middleName'] ?? '');
    $lastName = trim($_POST['lastName'] ?? '');
    $employeeId = trim($_POST['employeeId'] ?? '');
    $position = trim($_POST['position'] ?? '');
    $contactNumber = trim($_POST['contactNumber'] ?? '');
    $committee = !empty($_POST['committee']) ? (int)$_POST['committee'] : null;
    $email = trim(strtolower($_POST['email'] ?? ''));
    $tempPassword = $_POST['tempPassword'] ?? '';
    $accessRole = trim($_POST['accessRole'] ?? '');
    $modules = $_POST['modules'] ?? '[]';
    $status = trim($_POST['status'] ?? 'Active'); // Default to Active
    
    // Generate temporary password if not provided
    if (empty($tempPassword)) {
        $tempPassword = generateTempPassword();
    }
    
    // Comprehensive validation
    $errors = [];
    
    if (empty($firstName) || strlen($firstName) < 2) {
        $errors[] = 'First name is required and must be at least 2 characters';
    }
    
    if (empty($lastName) || strlen($lastName) < 2) {
        $errors[] = 'Last name is required and must be at least 2 characters';
    }
    
    if (empty($employeeId)) {
        $errors[] = 'Employee ID is required';
    } elseif (!validateEmployeeId($employeeId)) {
        $errors[] = 'Employee ID must be 3-20 characters (letters, numbers, hyphens, underscores only)';
    }
    
    if (empty($position) || strlen($position) < 2) {
        $errors[] = 'Position is required and must be at least 2 characters';
    }
    
    if (empty($contactNumber)) {
        $errors[] = 'Contact number is required';
    } elseif (!validatePhoneNumber($contactNumber)) {
        $errors[] = 'Contact number must be a valid Philippine mobile number (09XXXXXXXXX)';
    }
    
    if (empty($email)) {
        $errors[] = 'Email is required';
    } elseif (!validateEmail($email)) {
        $errors[] = 'Please provide a valid email address';
    }
    
    if (strlen($tempPassword) < 8) {
        $errors[] = 'Temporary password must be at least 8 characters long';
    }
    
    if (!in_array($accessRole, ['Admin', 'Sub-admin'])) {
        $errors[] = 'Access role must be either "Admin" or "Sub-admin"';
    }
    
    if (!in_array($status, ['Active', 'Inactive', 'Suspended'])) {
        $errors[] = 'Status must be "Active", "Inactive", or "Suspended"';
    }
    
    // If there are validation errors, return them
    if (!empty($errors)) {
        throw new Exception('Validation failed: ' . implode(', ', $errors));
    }
    
    // Normalize contact number
    $contactNumber = preg_replace('/\D/', '', $contactNumber);
    
    // Check for existing employee ID
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM tbl_administrators WHERE employee_id = ?");
    $checkStmt->execute([$employeeId]);
    if ($checkStmt->fetchColumn() > 0) {
        throw new Exception('Employee ID "' . $employeeId . '"  ady exists. Please use a different employee ID.');
    }
    
    // Check for existing email
    $checkEmailStmt = $pdo->prepare("SELECT COUNT(*) FROM tbl_users WHERE email = ?");
    $checkEmailStmt->execute([$email]);
    if ($checkEmailStmt->fetchColumn() > 0) {
        throw new Exception('Email "' . $email . '" is already registered. Please use a different email address.');
    }
    
    // Validate committee exists if provided
    if ($committee !== null) {
        $checkCommitteeStmt = $pdo->prepare("SELECT COUNT(*) FROM tbl_committees WHERE committee_id = ?");
        $checkCommitteeStmt->execute([$committee]);
        if ($checkCommitteeStmt->fetchColumn() == 0) {
            throw new Exception('Selected committee does not exist');
        }
    }
    
    // Handle profile picture upload
    $profilePicturePath = null;
    if (isset($_FILES['profilePicture']) && $_FILES['profilePicture']['error'] !== UPLOAD_ERR_NO_FILE) {
        try {
            $profilePicturePath = handleProfilePictureUpload($_FILES['profilePicture'], $employeeId);
        } catch (Exception $e) {
            throw new Exception('Profile picture upload failed: ' . $e->getMessage());
        }
    }
    
    // Hash the temporary password
    $hashedPassword = password_hash($tempPassword, PASSWORD_ARGON2ID);
    
    // Determine user role for tbl_users
    $userRole = ($accessRole === 'Admin') ? 'Admin' : 'Sub-Admin';
    
    // Insert into tbl_users first
    $userStmt = $pdo->prepare("
        INSERT INTO tbl_users (
            email, password, role, status, profile_picture, first_login, created_at
        ) VALUES (?, ?, ?, ?, ?, TRUE, NOW())
    ");
    
    $userStmt->execute([
        $email, 
        $hashedPassword, 
        $userRole, 
        $status, 
        $profilePicturePath
    ]);
    
    $userId = $pdo->lastInsertId();
    
    // Get current user ID for created_by field
    $createdBy = $_SESSION['user_id'] ?? null;
    if (!$createdBy) {
        // If no session, try to get from a system admin account or use a default
        $systemAdminStmt = $pdo->prepare("SELECT user_id FROM tbl_users WHERE role = 'Admin' LIMIT 1");
        $systemAdminStmt->execute();
        $createdBy = $systemAdminStmt->fetchColumn() ?: 1; // Default to 1 if no admin found
    }
    
    // Insert into tbl_administrators
    $adminStmt = $pdo->prepare("
        INSERT INTO tbl_administrators (
            user_id, employee_id, first_name, middle_name, last_name, 
            position, contact_number, access_role, committee_id, 
            created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $adminStmt->execute([
        $userId,
        $employeeId,
        $firstName,
        $middleName ?: null,
        $lastName,
        $position,
        $contactNumber,
        $accessRole,
        $committee,
        $createdBy
    ]);
    
    $adminId = $pdo->lastInsertId();
    
    // Handle module assignments for Sub-admin
    if ($accessRole === 'Sub-admin' && !empty($modules) && $modules !== '[]') {
        $moduleArray = json_decode($modules, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid modules data format');
        }
        
        if (is_array($moduleArray) && !empty($moduleArray)) {
            // Validate and get module IDs from module codes
            $placeholders = str_repeat('?,', count($moduleArray) - 1) . '?';
            $moduleStmt = $pdo->prepare("
                SELECT module_id, module_code 
                FROM tbl_system_modules 
                WHERE module_code IN ($placeholders) AND is_active = 1
            ");
            $moduleStmt->execute($moduleArray);
            $validModules = $moduleStmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (empty($validModules)) {
                throw new Exception('No valid modules found for assignment');
            }
            
            // Insert module assignments
            foreach ($validModules as $module) {
                $moduleAssignStmt = $pdo->prepare("
                    INSERT INTO tbl_admin_modules_access (admin_id, module_id, granted_at) 
                    VALUES (?, ?, NOW())
                ");
                $moduleAssignStmt->execute([$adminId, $module['module_id']]);
            }
            
            $assignedModules = array_column($validModules, 'module_code');
        }
    }
    
    // Commit the transaction
    $pdo->commit();
    
    // Log the successful creation (optional - you can implement logging)
    error_log("Admin account created - ID: {$adminId}, Employee ID: {$employeeId}, Email: {$email}, Created by: {$createdBy}");
    
    // Prepare success response
    $response = [
        'success' => true,
        'message' => 'Administrator account created successfully',
        'data' => [
            'admin_id' => $adminId,
            'user_id' => $userId,
            'employee_id' => $employeeId,
            'full_name' => $firstName . ' ' . $lastName,
            'email' => $email,
            'position' => $position,
            'access_role' => $accessRole,
            'status' => $status,
            'temp_password' => $tempPassword, // Include temp password in response
            'profile_picture' => $profilePicturePath,
            'assigned_modules' => $assignedModules ?? []
        ],
        'timestamp' => date('Y-m-d H:i:s')
    ];
    
    echo json_encode($response);
    
} catch (PDOException $e) {
    // Rollback transaction on database error
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollback();
    }
    
    // Clean up uploaded file if there was an error
    if (isset($profilePictureFilename)) {
        $fullPath = '../../uploads/employees_profilePic/' . $profilePictureFilename;
        if (file_exists($fullPath)) {
            unlink($fullPath);
        }
    }
    
    // Log the database error
    error_log("Database error in create_admin.php: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Database operation failed. Please try again.',
        'error_code' => 'DATABASE_ERROR',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    
} catch (Exception $e) {
    // Rollback transaction on general error
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollback();
    }
    
    // Clean up uploaded file if there was an error
    if (isset($profilePicturePath)) {
        $fullPath = '../../' . $profilePicturePath;
        if (file_exists($fullPath)) {
            unlink($fullPath);
        }
    }
    
    // Log the error
    error_log("Error in create_admin.php: " . $e->getMessage());
    
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'error_code' => 'VALIDATION_ERROR',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
}
?>
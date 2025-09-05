<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

include_once '../../php-handlers/connect.php';

try {
    // Handle different request methods and actions
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? 'get_all';
    
    switch ($method) {
        case 'GET':
            if ($action === 'committees') {
                getCommittees($pdo);
            } elseif ($action === 'modules') {
                getModules($pdo);
            } else {
                getAdministrators($pdo);
            }
            break;
        case 'POST':
            createAdministrator($pdo);
            break;
        case 'PUT':
            updateAdministrator($pdo);
            break;
        case 'DELETE':
            deleteAdministrator($pdo);
            break;
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
}

// Get all administrators with their user information
function getAdministrators($pdo) {
    try {
        $search = $_GET['search'] ?? '';
        $role_filter = $_GET['role'] ?? '';
        $status_filter = $_GET['status'] ?? '';
        
        $sql = "SELECT 
                    a.admin_id,
                    a.employee_id,
                    a.first_name,
                    a.middle_name,
                    a.last_name,
                    a.position,
                    a.committee_id,
                    a.contact_number,
                    a.access_role,
                    a.created_by,
                    a.created_at,
                    a.updated_at,
                    a.last_login,
                    u.user_id,
                    u.email,
                    u.status,
                    u.profile_picture,
                    u.role,
                    u.first_login,
                    c.committee_name
                FROM tbl_administrators a
                LEFT JOIN tbl_users u ON a.user_id = u.user_id
                LEFT JOIN tbl_committees c ON a.committee_id = c.committee_id
                WHERE 1=1";
        
        $params = [];
        
        if (!empty($search)) {
            $sql .= " AND (a.first_name LIKE :search 
                         OR a.last_name LIKE :search 
                         OR a.employee_id LIKE :search
                         OR CONCAT(a.first_name, ' ', IFNULL(a.middle_name, ''), ' ', a.last_name) LIKE :search)";
            $params[':search'] = "%$search%";
        }
        
        if (!empty($role_filter)) {
            $sql .= " AND a.access_role = :role_filter";
            $params[':role_filter'] = $role_filter;
        }
        
        if (!empty($status_filter)) {
            $sql .= " AND u.status = :status_filter";
            $params[':status_filter'] = $status_filter;
        }
        
        $sql .= " ORDER BY a.created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $administrators = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get assigned modules for each admin
        foreach ($administrators as &$admin) {
            $admin['assignedModules'] = getAdminModules($pdo, $admin['admin_id']);
            
            // Format full name
            $admin['fullName'] = trim($admin['first_name'] . ' ' . 
                                   ($admin['middle_name'] ? $admin['middle_name'] . ' ' : '') . 
                                   $admin['last_name']);
        }
        
        echo json_encode([
            'success' => true,
            'data' => $administrators,
            'count' => count($administrators)
        ]);
        
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch administrators: ' . $e->getMessage()]);
    }
}

// Get committees for dropdown
function getCommittees($pdo) {
    try {
        $stmt = $pdo->query("SELECT committee_id, committee_name, description FROM tbl_committees WHERE is_active = 1 ORDER BY committee_name");
        $committees = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'committees' => $committees
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch committees: ' . $e->getMessage()]);
    }
}

// Get system modules for Sub-admin access
function getModules($pdo) {
    try {
        $stmt = $pdo->query("SELECT module_id, module_code, module_name, module_description, is_active FROM tbl_modules ORDER BY module_name");
        $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'modules' => $modules
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to fetch modules: ' . $e->getMessage()]);
    }
}

// Get assigned modules for a specific admin
function getAdminModules($pdo, $admin_id) {
    try {
        $stmt = $pdo->prepare("
            SELECT m.module_code, m.module_name 
            FROM tbl_admin_modules am
            JOIN tbl_modules m ON am.module_id = m.module_id
            WHERE am.admin_id = :admin_id
        ");
        $stmt->execute([':admin_id' => $admin_id]);
        $modules = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return array_column($modules, 'module_code');
    } catch (PDOException $e) {
        return [];
    }
}

// Create new administrator
function createAdministrator($pdo) {
    try {
        // Handle both JSON and multipart form data
        $input = [];
        
        if (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
            $input = json_decode(file_get_contents('php://input'), true);
        } else {
            // Handle form data (including file uploads)
            $input = $_POST;
        }
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid data provided']);
            return;
        }
        
        // Validate required fields
        $required_fields = ['firstName', 'lastName', 'position', 'employeeId', 'contactNumber', 'accessRole'];
        foreach ($required_fields as $field) {
            if (empty($input[$field])) {
                http_response_code(400);
                echo json_encode(['error' => "Field '$field' is required"]);
                return;
            }
        }
        
        // Check for duplicate employee ID
        $check_stmt = $pdo->prepare("SELECT admin_id FROM tbl_administrators WHERE employee_id = :employee_id");
        $check_stmt->execute([':employee_id' => $input['employeeId']]);
        if ($check_stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Employee ID already exists']);
            return;
        }
        
        // Generate email if not provided
        $email = isset($input['email']) ? $input['email'] : 
                strtolower($input['lastName']) . '.' . $input['employeeId'] . '@ligaya.gov.ph';
        
        // Check if email already exists
        $check_email_stmt = $pdo->prepare("SELECT user_id FROM tbl_users WHERE email = :email");
        $check_email_stmt->execute([':email' => $email]);
        if ($check_email_stmt->fetch()) {
            http_response_code(409);
            echo json_encode(['error' => 'Email already exists']);
            return;
        }
        
        // Handle profile picture upload
        $profile_picture = null;
        if (isset($_FILES['profilePicture']) && $_FILES['profilePicture']['error'] === UPLOAD_ERR_OK) {
            $profile_picture = handleProfilePictureUpload($_FILES['profilePicture']);
        }
        
        $pdo->beginTransaction();
        
        // Generate temporary password
        $temp_password = generateTempPassword();
        $hashed_password = password_hash($temp_password, PASSWORD_DEFAULT);
        
        // Insert into tbl_users first
        $user_sql = "INSERT INTO tbl_users (email, password, status, role, first_login, profile_picture, created_at) 
                     VALUES (:email, :password, 'Active', :role, 1, :profile_picture, NOW())";
        $user_stmt = $pdo->prepare($user_sql);
        $user_stmt->execute([
            ':email' => $email,
            ':password' => $hashed_password,
            ':role' => $input['accessRole'],
            ':profile_picture' => $profile_picture
        ]);
        
        $user_id = $pdo->lastInsertId();
        
        // Insert into tbl_administrators
        $admin_sql = "INSERT INTO tbl_administrators (
                        user_id, employee_id, first_name, middle_name, last_name, 
                        position, committee_id, contact_number, access_role, 
                        created_by, created_at, updated_at
                      ) VALUES (
                        :user_id, :employee_id, :first_name, :middle_name, :last_name,
                        :position, :committee_id, :contact_number, :access_role,
                        :created_by, NOW(), NOW()
                      )";
        
        $committee_id = !empty($input['committee']) ? $input['committee'] : null;
        
        $admin_stmt = $pdo->prepare($admin_sql);
        $admin_stmt->execute([
            ':user_id' => $user_id,
            ':employee_id' => $input['employeeId'],
            ':first_name' => $input['firstName'],
            ':middle_name' => $input['middleName'] ?? null,
            ':last_name' => $input['lastName'],
            ':position' => $input['position'],
            ':committee_id' => $committee_id,
            ':contact_number' => $input['contactNumber'],
            ':access_role' => $input['accessRole'],
            ':created_by' => $input['createdBy'] ?? 'System'
        ]);
        
        $admin_id = $pdo->lastInsertId();
        
        // Handle module assignments for Sub-admin
        if ($input['accessRole'] === 'Sub-admin' && isset($input['modules'])) {
            $modules = is_string($input['modules']) ? json_decode($input['modules'], true) : $input['modules'];
            
            if (is_array($modules) && !empty($modules)) {
                foreach ($modules as $module_code) {
                    // Get module_id from module_code
                    $module_stmt = $pdo->prepare("SELECT module_id FROM tbl_modules WHERE module_code = :code");
                    $module_stmt->execute([':code' => $module_code]);
                    $module_row = $module_stmt->fetch();
                    
                    if ($module_row) {
                        $assign_stmt = $pdo->prepare("INSERT INTO tbl_admin_modules (admin_id, module_id, assigned_at) VALUES (:admin_id, :module_id, NOW())");
                        $assign_stmt->execute([
                            ':admin_id' => $admin_id,
                            ':module_id' => $module_row['module_id']
                        ]);
                    }
                }
            }
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Administrator account created successfully',
            'data' => [
                'admin_id' => $admin_id,
                'user_id' => $user_id,
                'employee_id' => $input['employeeId'],
                'email' => $email,
                'temp_password' => $temp_password
            ]
        ]);
        
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create administrator: ' . $e->getMessage()]);
    }
}

// Update administrator information
function updateAdministrator($pdo) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input || !isset($input['admin_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Admin ID is required']);
            return;
        }
        
        $admin_id = $input['admin_id'];
        
        $pdo->beginTransaction();
        
        // Update administrator table
        $update_fields = [];
        $params = [':admin_id' => $admin_id];
        
        $allowed_fields = [
            'first_name' => 'firstName',
            'middle_name' => 'middleName', 
            'last_name' => 'lastName',
            'position' => 'position',
            'committee_id' => 'committee',
            'contact_number' => 'contactNumber',
            'access_role' => 'accessRole'
        ];
        
        foreach ($allowed_fields as $db_field => $input_field) {
            if (isset($input[$input_field])) {
                $update_fields[] = "$db_field = :$db_field";
                $params[":$db_field"] = $input[$input_field] ?: null;
            }
        }
        
        if (!empty($update_fields)) {
            $update_fields[] = "updated_at = NOW()";
            $sql = "UPDATE tbl_administrators SET " . implode(', ', $update_fields) . " WHERE admin_id = :admin_id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }
        
        // Update user status if provided
        if (isset($input['status'])) {
            $user_sql = "UPDATE tbl_users u 
                        JOIN tbl_administrators a ON u.user_id = a.user_id 
                        SET u.status = :status 
                        WHERE a.admin_id = :admin_id";
            $user_stmt = $pdo->prepare($user_sql);
            $user_stmt->execute([
                ':status' => $input['status'],
                ':admin_id' => $admin_id
            ]);
        }
        
        // Update module assignments for Sub-admin
        if (isset($input['modules'])) {
            // Remove existing module assignments
            $delete_modules_stmt = $pdo->prepare("DELETE FROM tbl_admin_modules WHERE admin_id = :admin_id");
            $delete_modules_stmt->execute([':admin_id' => $admin_id]);
            
            // Add new module assignments
            $modules = is_string($input['modules']) ? json_decode($input['modules'], true) : $input['modules'];
            if (is_array($modules) && !empty($modules)) {
                foreach ($modules as $module_code) {
                    $module_stmt = $pdo->prepare("SELECT module_id FROM tbl_modules WHERE module_code = :code");
                    $module_stmt->execute([':code' => $module_code]);
                    $module_row = $module_stmt->fetch();
                    
                    if ($module_row) {
                        $assign_stmt = $pdo->prepare("INSERT INTO tbl_admin_modules (admin_id, module_id, assigned_at) VALUES (:admin_id, :module_id, NOW())");
                        $assign_stmt->execute([
                            ':admin_id' => $admin_id,
                            ':module_id' => $module_row['module_id']
                        ]);
                    }
                }
            }
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Administrator updated successfully'
        ]);
        
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update administrator: ' . $e->getMessage()]);
    }
}

// Delete administrator
function deleteAdministrator($pdo) {
    try {
        $admin_id = $_GET['admin_id'] ?? null;
        
        if (!$admin_id) {
            http_response_code(400);
            echo json_encode(['error' => 'Admin ID is required']);
            return;
        }
        
        // Get user_id and profile_picture before deleting
        $get_info_sql = "SELECT a.user_id, u.profile_picture FROM tbl_administrators a 
                        JOIN tbl_users u ON a.user_id = u.user_id 
                        WHERE a.admin_id = :admin_id";
        $get_info_stmt = $pdo->prepare($get_info_sql);
        $get_info_stmt->execute([':admin_id' => $admin_id]);
        $info = $get_info_stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$info) {
            http_response_code(404);
            echo json_encode(['error' => 'Administrator not found']);
            return;
        }
        
        $pdo->beginTransaction();
        
        // Delete module assignments
        $delete_modules_stmt = $pdo->prepare("DELETE FROM tbl_admin_modules WHERE admin_id = :admin_id");
        $delete_modules_stmt->execute([':admin_id' => $admin_id]);
        
        // Delete from administrators table
        $delete_admin_stmt = $pdo->prepare("DELETE FROM tbl_administrators WHERE admin_id = :admin_id");
        $delete_admin_stmt->execute([':admin_id' => $admin_id]);
        
        // Delete from users table
        $delete_user_stmt = $pdo->prepare("DELETE FROM tbl_users WHERE user_id = :user_id");
        $delete_user_stmt->execute([':user_id' => $info['user_id']]);
        
        // Delete profile picture file if exists
        if ($info['profile_picture'] && file_exists("../uploads/profiles/" . $info['profile_picture'])) {
            unlink("../uploads/profiles/" . $info['profile_picture']);
        }
        
        $pdo->commit();
        
        echo json_encode([
            'success' => true,
            'message' => 'Administrator deleted successfully'
        ]);
        
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete administrator: ' . $e->getMessage()]);
    }
}

// Utility Functions
function generateTempPassword($length = 12) {
    $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%&*';
    $password = '';
    
    // Ensure at least one of each type
    $password .= substr(str_shuffle('ABCDEFGHJKLMNPQRSTUVWXYZ'), 0, 1); // Uppercase
    $password .= substr(str_shuffle('abcdefghijkmnpqrstuvwxyz'), 0, 1); // Lowercase  
    $password .= substr(str_shuffle('23456789'), 0, 1); // Number
    $password .= substr(str_shuffle('@#$%&*'), 0, 1); // Special character
    
    // Fill the rest randomly
    for ($i = 4; $i < $length; $i++) {
        $password .= $characters[random_int(0, strlen($characters) - 1)];
    }
    
    // Shuffle the password
    return str_shuffle($password);
}

function handleProfilePictureUpload($file) {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('File upload error');
    }
    
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime_type = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mime_type, $allowed_types)) {
        throw new Exception('Invalid file type. Only JPG, PNG, and GIF are allowed.');
    }
    
    $max_size = 2 * 1024 * 1024; // 2MB
    if ($file['size'] > $max_size) {
        throw new Exception('File too large. Maximum size is 2MB.');
    }
    
    $upload_dir = '../uploads/profiles/';
    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }
    
    $extension = '';
    switch ($mime_type) {
        case 'image/jpeg': $extension = '.jpg'; break;
        case 'image/png': $extension = '.png'; break;
        case 'image/gif': $extension = '.gif'; break;
    }
    
    $filename = uniqid('admin_') . $extension;
    $filepath = $upload_dir . $filename;
    
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        return $filename;
    }
    
    throw new Exception('Failed to upload file.');
}

// Additional endpoint for password verification (you might want to implement this separately for security)
if (isset($_GET['verify_password'])) {
    $current_password = $_POST['current_password'] ?? '';
    
    // This should be replaced with actual session-based authentication
    // For security, you should verify against the logged-in admin's password
    $demo_password = 'admin123'; // This is just for demonstration
    
    if ($current_password === $demo_password) {
        echo json_encode(['success' => true, 'message' => 'Password verified']);
    } else {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid password']);
    }
    exit;
}
?>
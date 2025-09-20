<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

include_once '../connect.php';

try {
    // First, update expired items based on current date
    $current_date = date('Y-m-d');
    
    // Update status for expired items (Priority Stab and Event Ticket with past dates)
      $update_expired_sql = "UPDATE tbl_rewards 
                      SET item_status = 'expired' 
                      WHERE (reward_type = 'Priority Stab' OR reward_type = 'Event Ticket') 
                      AND event_date < ? 
                      AND item_status != 'archived'
                      AND is_active = 1";

    $update_stmt = mysqli_prepare($conn, $update_expired_sql);
    if ($update_stmt) {
        mysqli_stmt_bind_param($update_stmt, "s", $current_date);
        mysqli_stmt_execute($update_stmt);
        mysqli_stmt_close($update_stmt);
    }
    
    // Update status for out of stock items
    $update_stock_sql = "UPDATE tbl_rewards 
                    SET item_status = 'out_of_stock' 
                    WHERE quantity = 0 
                    AND item_status = 'active'
                    AND is_active = 1";

    $stock_stmt = mysqli_prepare($conn, $update_stock_sql);
    if ($stock_stmt) {
        mysqli_stmt_execute($stock_stmt);
        mysqli_stmt_close($stock_stmt);
    }
    
    // Update status back to active for items that have stock again
    $update_active_sql = "UPDATE tbl_rewards 
                     SET item_status = 'active' 
                     WHERE quantity > 0 
                     AND item_status = 'out_of_stock'
                     AND (event_date IS NULL OR event_date >= ?)
                     AND is_active = 1";
    
    $active_stmt = mysqli_prepare($conn, $update_active_sql);
    if ($active_stmt) {
        mysqli_stmt_bind_param($active_stmt, "s", $current_date);
        mysqli_stmt_execute($active_stmt);
        mysqli_stmt_close($active_stmt);
    }

    // Fetch all active incentives
    $sql = "SELECT reward_id, reward_name, reward_type, description, points_required, 
               image_url, quantity, unit, event_date, event_time, 
               low_stock_threshold, item_status, created_at, updated_at
        FROM tbl_rewards 
        WHERE is_active = 1 
        ORDER BY 
            CASE 
                WHEN item_status = 'expired' THEN 1
                WHEN item_status = 'out_of_stock' THEN 2
                WHEN quantity <= low_stock_threshold THEN 3
                ELSE 4
            END,
            reward_name ASC";
    $result = mysqli_query($conn, $sql);
    
    if (!$result) {
        throw new Exception('Failed to fetch incentives: ' . mysqli_error($conn));
    }

    $incentives = [];
    while ($row = mysqli_fetch_assoc($result)) {
        // Determine current stock status
        $stock_status = 'good';
        if ($row['quantity'] == 0) {
            $stock_status = 'out_of_stock';
        } elseif ($row['quantity'] <= $row['low_stock_threshold']) {
            $stock_status = 'low';
        } elseif ($row['quantity'] <= ($row['low_stock_threshold'] * 2)) {
            $stock_status = 'medium';
        }
        
        // Calculate days until expiration for dated items
        $days_until_expiration = null;
        if ($row['event_date']) {
            $event_date = new DateTime($row['event_date']);
            $current_date_obj = new DateTime();
            $interval = $current_date_obj->diff($event_date);
            $days_until_expiration = $interval->invert ? -$interval->days : $interval->days;
        }
        
        $incentives[] = [
            'reward_id' => $row['reward_id'],
            'id' => $row['reward_id'], // For backward compatibility
            'reward_name' => $row['reward_name'],
            'name' => $row['reward_name'], // For backward compatibility
            'reward_type' => $row['reward_type'],
            'category' => $row['reward_type'], // For backward compatibility
            'description' => $row['description'],
            'points_required' => intval($row['points_required']),
            'image_url' => $row['image_url'],
            'quantity' => intval($row['quantity']),
            'unit' => $row['unit'],
            'event_date' => $row['event_date'],
            'event_time' => $row['event_time'],
            'low_stock_threshold' => intval($row['low_stock_threshold']),
            'item_status' => $row['item_status'], // UPDATED: Use item_status
            'status' => $row['item_status'], // For backward compatibility
            'stock_status' => $stock_status,
            'days_until_expiration' => $days_until_expiration,
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at']
        ];
    }

    // Get summary statistics
    $stats_sql = "SELECT 
                COUNT(*) as total_items,
                SUM(CASE WHEN quantity > 0 AND item_status = 'active' THEN 1 ELSE 0 END) as in_stock_items,
                SUM(CASE WHEN quantity <= low_stock_threshold AND quantity > 0 THEN 1 ELSE 0 END) as low_stock_items,
                SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_items,
                SUM(CASE WHEN item_status = 'expired' THEN 1 ELSE 0 END) as expired_items,
                COUNT(DISTINCT reward_type) as total_categories
              FROM tbl_rewards 
              WHERE is_active = 1";

    $stats_result = mysqli_query($conn, $stats_sql);
    $stats = mysqli_fetch_assoc($stats_result);

    echo json_encode([
        'success' => true,
        'incentives' => $incentives,
        'statistics' => [
            'total_items' => intval($stats['total_items']),
            'in_stock_items' => intval($stats['in_stock_items']),
            'low_stock_items' => intval($stats['low_stock_items']),
            'out_of_stock_items' => intval($stats['out_of_stock_items']),
            'expired_items' => intval($stats['expired_items']),
            'total_categories' => intval($stats['total_categories'])
        ],
        'last_updated' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    error_log('Error in fetch-incentives.php: ' . $e->getMessage());
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'incentives' => [],
        'statistics' => [
            'total_items' => 0,
            'in_stock_items' => 0,
            'low_stock_items' => 0,
            'out_of_stock_items' => 0,
            'expired_items' => 0,
            'total_categories' => 0
        ]
    ]);
} finally {
    // Close connection
    if (isset($conn)) {
        mysqli_close($conn);
    }
}
?>
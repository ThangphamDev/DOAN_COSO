package com.t2kcoffee.service;

import com.t2kcoffee.dto.WebSocketMessage;
import com.t2kcoffee.dto.OrderNotification;
import com.t2kcoffee.entity.CafeOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Set;
import java.util.HashSet;

@Service
public class WebSocketService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    // Store active user sessions
    private final ConcurrentHashMap<String, Set<String>> userSessions = new ConcurrentHashMap<>();
    
    // Store staff sessions for order notifications
    private final Set<String> staffSessions = ConcurrentHashMap.newKeySet();
    
    // Store customer sessions for order updates
    private final ConcurrentHashMap<Integer, Set<String>> customerSessions = new ConcurrentHashMap<>();

    /**
     * Register a user session
     */
    public void registerUserSession(String userId, String sessionId, String userType) {
        System.out.println("[WebSocket] Registering user: " + userId + ", type: " + userType + ", session: " + sessionId);
        
        // Check if user has any staff role
        boolean isStaff = isStaffRole(userType);
        
        if (isStaff || "ADMIN".equalsIgnoreCase(userType)) {
            staffSessions.add(sessionId);
            System.out.println("[WebSocket] Added to staff sessions. Total staff: " + staffSessions.size());
        } else {
            try {
                customerSessions.computeIfAbsent(Integer.parseInt(userId), k -> new HashSet<>()).add(sessionId);
                System.out.println("[WebSocket] Added to customer sessions. Total customers: " + customerSessions.size());
            } catch (NumberFormatException e) {
                System.err.println("[WebSocket] Invalid userId format: " + userId);
            }
        }
        
        userSessions.computeIfAbsent(userId, k -> new HashSet<>()).add(sessionId);
    }

    /**
     * Unregister a user session
     */
    public void unregisterUserSession(String userId, String sessionId, String userType) {
        System.out.println("[WebSocket] Unregistering user: " + userId + ", session: " + sessionId);
        
        boolean isStaff = isStaffRole(userType);
        
        if (isStaff || "ADMIN".equalsIgnoreCase(userType)) {
            staffSessions.remove(sessionId);
            System.out.println("[WebSocket] Removed from staff sessions. Remaining: " + staffSessions.size());
        } else {
            try {
                Set<String> sessions = customerSessions.get(Integer.parseInt(userId));
                if (sessions != null) {
                    sessions.remove(sessionId);
                    if (sessions.isEmpty()) {
                        customerSessions.remove(Integer.parseInt(userId));
                    }
                }
            } catch (NumberFormatException e) {
                System.err.println("[WebSocket] Invalid userId format: " + userId);
            }
        }
        
        Set<String> sessions = userSessions.get(userId);
        if (sessions != null) {
            sessions.remove(sessionId);
            if (sessions.isEmpty()) {
                userSessions.remove(userId);
            }
        }
    }
    
    /**
     * Check if userType contains any staff role (supports comma-separated roles)
     */
    private boolean isStaffRole(String userType) {
        if (userType == null) return false;
        String upperType = userType.toUpperCase();
        return upperType.contains("STAFF_ORDER") || 
               upperType.contains("STAFF_KITCHEN") || 
               upperType.contains("STAFF_MANAGER") ||
               upperType.contains("STAFF"); // Backward compatibility
    }

    /**
     * Send order notification to all staff members
     */
    public void notifyStaffNewOrder(CafeOrder order) {
        System.out.println("[WebSocket] Notifying staff about new order #" + order.getIdOrder());
        System.out.println("[WebSocket] Active staff sessions: " + staffSessions.size());
        
        OrderNotification notification = new OrderNotification(
            "NEW_ORDER", 
            order, 
            "Đơn hàng mới #" + order.getIdOrder() + " từ " + 
            (order.getTable() != null ? "Bàn " + order.getTable().getTableNumber() : "Mang đi"),
            "HIGH"
        );
        
        WebSocketMessage message = new WebSocketMessage("ORDER_NOTIFICATION", notification);
        
        // Broadcast to staff topic - all staff subscribed to this topic will receive
        messagingTemplate.convertAndSend("/topic/staff/orders", message);
        System.out.println("[WebSocket] Broadcast to /topic/staff/orders");
    }

    /**
     * Send order status update to all staff members
     * This notifies staff when order status changes (e.g., from another staff member)
     */
    public void notifyStaffOrderUpdate(CafeOrder order) {
        System.out.println("[WebSocket] Notifying staff about order #" + order.getIdOrder() + " status update: " + order.getStatus());
        System.out.println("[WebSocket] Active staff sessions: " + staffSessions.size());
        
        OrderNotification notification = new OrderNotification(
            "ORDER_UPDATED", 
            order, 
            "Đơn hàng #" + order.getIdOrder() + " đã được cập nhật trạng thái: " + order.getStatus(),
            "MEDIUM"
        );
        
        WebSocketMessage message = new WebSocketMessage("ORDER_UPDATE", notification);
        
        // Broadcast to staff topic - all staff subscribed to this topic will receive
        messagingTemplate.convertAndSend("/topic/staff/orders", message);
        System.out.println("[WebSocket] Broadcast order update to /topic/staff/orders");
    }

    /**
     * Send order status update to customer
     */
    public void notifyCustomerOrderUpdate(CafeOrder order) {
        if (order.getAccount() != null) {
            Integer customerId = order.getAccount().getIdAccount();
            System.out.println("[WebSocket] Notifying customer " + customerId + " about order #" + order.getIdOrder() + " status: " + order.getStatus());
            
            OrderNotification notification = new OrderNotification(
                "ORDER_UPDATED", 
                order, 
                "Đơn hàng #" + order.getIdOrder() + " đã được cập nhật trạng thái: " + order.getStatus()
            );
            
            WebSocketMessage message = new WebSocketMessage("ORDER_UPDATE", notification);
            
            // Broadcast to customer-specific topic
            messagingTemplate.convertAndSend("/topic/customer/" + customerId + "/orders", message);
            System.out.println("[WebSocket] Broadcast to /topic/customer/" + customerId + "/orders");
        }
    }

    /**
     * Send order completion notification to customer
     */
    public void notifyCustomerOrderCompleted(CafeOrder order) {
        if (order.getAccount() != null) {
            Integer customerId = order.getAccount().getIdAccount();
            System.out.println("[WebSocket] Notifying customer " + customerId + " that order #" + order.getIdOrder() + " is completed");
            
            OrderNotification notification = new OrderNotification(
                "ORDER_COMPLETED", 
                order, 
                "Đơn hàng #" + order.getIdOrder() + " đã sẵn sàng!",
                "HIGH"
            );
            
            WebSocketMessage message = new WebSocketMessage("ORDER_COMPLETED", notification);
            
            // Broadcast to customer-specific topic
            messagingTemplate.convertAndSend("/topic/customer/" + customerId + "/orders", message);
            System.out.println("[WebSocket] Broadcast to /topic/customer/" + customerId + "/orders");
        }
    }

    /**
     * Send general notification to all users
     */
    public void broadcastNotification(String message, String type) {
        WebSocketMessage wsMessage = new WebSocketMessage(type, message);
        messagingTemplate.convertAndSend("/topic/notifications", wsMessage);
    }

    /**
     * Send notification to specific user
     */
    public void sendNotificationToUser(String userId, String message, String type) {
        System.out.println("[WebSocket] Sending notification to user: " + userId);
        WebSocketMessage wsMessage = new WebSocketMessage(type, message);
        // Use userId as Principal name for user-specific messages
        messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", wsMessage);
    }

    /**
     * Get active staff count
     */
    public int getActiveStaffCount() {
        return staffSessions.size();
    }

    /**
     * Get active customer count
     */
    public int getActiveCustomerCount() {
        return customerSessions.size();
    }

    /**
     * Check if user is online
     */
    public boolean isUserOnline(String userId) {
        Set<String> sessions = userSessions.get(userId);
        return sessions != null && !sessions.isEmpty();
    }
}

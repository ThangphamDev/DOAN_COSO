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
        if ("STAFF".equalsIgnoreCase(userType) || "ADMIN".equalsIgnoreCase(userType)) {
            staffSessions.add(sessionId);
        } else {
            customerSessions.computeIfAbsent(Integer.parseInt(userId), k -> new HashSet<>()).add(sessionId);
        }
        
        userSessions.computeIfAbsent(userId, k -> new HashSet<>()).add(sessionId);
    }

    /**
     * Unregister a user session
     */
    public void unregisterUserSession(String userId, String sessionId, String userType) {
        if ("STAFF".equalsIgnoreCase(userType) || "ADMIN".equalsIgnoreCase(userType)) {
            staffSessions.remove(sessionId);
        } else {
            Set<String> sessions = customerSessions.get(Integer.parseInt(userId));
            if (sessions != null) {
                sessions.remove(sessionId);
                if (sessions.isEmpty()) {
                    customerSessions.remove(Integer.parseInt(userId));
                }
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
     * Send order notification to all staff members
     */
    public void notifyStaffNewOrder(CafeOrder order) {
        OrderNotification notification = new OrderNotification(
            "NEW_ORDER", 
            order, 
            "Đơn hàng mới #" + order.getIdOrder() + " từ " + 
            (order.getTable() != null ? "Bàn " + order.getTable().getTableNumber() : "Mang đi"),
            "HIGH"
        );
        
        WebSocketMessage message = new WebSocketMessage("ORDER_NOTIFICATION", notification);
        
        // Send to all staff sessions
        for (String sessionId : staffSessions) {
            messagingTemplate.convertAndSendToUser(sessionId, "/queue/notifications", message);
        }
        
        // Also broadcast to staff topic
        messagingTemplate.convertAndSend("/topic/staff/orders", message);
    }

    /**
     * Send order status update to customer
     */
    public void notifyCustomerOrderUpdate(CafeOrder order) {
        if (order.getAccount() != null) {
            Integer customerId = order.getAccount().getIdAccount();
            Set<String> customerSessionIds = customerSessions.get(customerId);
            
            if (customerSessionIds != null && !customerSessionIds.isEmpty()) {
                OrderNotification notification = new OrderNotification(
                    "ORDER_UPDATED", 
                    order, 
                    "Đơn hàng #" + order.getIdOrder() + " đã được cập nhật trạng thái: " + order.getStatus()
                );
                
                WebSocketMessage message = new WebSocketMessage("ORDER_UPDATE", notification);
                
                for (String sessionId : customerSessionIds) {
                    messagingTemplate.convertAndSendToUser(sessionId, "/queue/notifications", message);
                }

                // Also broadcast to a customer-specific topic to avoid Principal dependency
                messagingTemplate.convertAndSend("/topic/customer/" + customerId + "/orders", message);
            }
        }
    }

    /**
     * Send order completion notification to customer
     */
    public void notifyCustomerOrderCompleted(CafeOrder order) {
        if (order.getAccount() != null) {
            Integer customerId = order.getAccount().getIdAccount();
            Set<String> customerSessionIds = customerSessions.get(customerId);
            
            if (customerSessionIds != null && !customerSessionIds.isEmpty()) {
                OrderNotification notification = new OrderNotification(
                    "ORDER_COMPLETED", 
                    order, 
                    "Đơn hàng #" + order.getIdOrder() + " đã sẵn sàng!",
                    "HIGH"
                );
                
                WebSocketMessage message = new WebSocketMessage("ORDER_COMPLETED", notification);
                
                for (String sessionId : customerSessionIds) {
                    messagingTemplate.convertAndSendToUser(sessionId, "/queue/notifications", message);
                }

                // Also broadcast to a customer-specific topic
                messagingTemplate.convertAndSend("/topic/customer/" + customerId + "/orders", message);
            }
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
        Set<String> sessions = userSessions.get(userId);
        if (sessions != null) {
            WebSocketMessage wsMessage = new WebSocketMessage(type, message);
            for (String sessionId : sessions) {
                messagingTemplate.convertAndSendToUser(sessionId, "/queue/notifications", wsMessage);
            }
        }
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

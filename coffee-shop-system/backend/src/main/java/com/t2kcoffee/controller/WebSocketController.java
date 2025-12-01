package com.t2kcoffee.controller;

import com.t2kcoffee.service.WebSocketService;
import com.t2kcoffee.dto.WebSocketMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class WebSocketController {

    @Autowired
    private WebSocketService webSocketService;

    /**
     * Handle user registration for WebSocket
     */
    @MessageMapping("/register")
    public void registerUser(@Payload Map<String, String> registrationData, 
                                       SimpMessageHeaderAccessor headerAccessor) {
        String userId = registrationData.get("userId");
        String userType = registrationData.get("userType");
        String sessionId = headerAccessor.getSessionId();
        
        System.out.println("[WebSocketController] Register request - User: " + userId + ", Type: " + userType + ", Session: " + sessionId);
        
        // Store in session attributes for auto-cleanup on disconnect
        headerAccessor.getSessionAttributes().put("userId", userId);
        headerAccessor.getSessionAttributes().put("userType", userType);
        
        // Register the user session
        webSocketService.registerUserSession(userId, sessionId, userType);
        
        // Send confirmation directly to the user who registered
        WebSocketMessage confirmMsg = new WebSocketMessage("USER_REGISTERED", 
            "User " + userId + " registered as " + userType);
        webSocketService.sendNotificationToUser(userId, confirmMsg.getData().toString(), "USER_REGISTERED");
    }

    /**
     * Handle user disconnection
     */
    @MessageMapping("/disconnect")
    public void handleDisconnect(@Payload Map<String, String> disconnectData,
                               SimpMessageHeaderAccessor headerAccessor) {
        String userId = disconnectData.get("userId");
        String userType = disconnectData.get("userType");
        String sessionId = headerAccessor.getSessionId();
        
        // Unregister the user session
        webSocketService.unregisterUserSession(userId, sessionId, userType);
    }

    /**
     * Handle ping/pong for connection health check
     */
    @MessageMapping("/ping")
    @SendTo("/queue/pong")
    public WebSocketMessage handlePing(@Payload Map<String, String> pingData,
                                     SimpMessageHeaderAccessor headerAccessor) {
        return new WebSocketMessage("PONG", 
            "Server time: " + java.time.LocalDateTime.now().toString());
    }

    /**
     * Handle order status update from staff
     */
    @MessageMapping("/order/status")
    public void handleOrderStatusUpdate(@Payload Map<String, Object> statusUpdate,
                                      SimpMessageHeaderAccessor headerAccessor) {
        // This will be handled by the order service when status is updated
        // The WebSocketService will be called from there
    }

    /**
     * Handle staff ready notification
     */
    @MessageMapping("/staff/ready")
    @SendTo("/topic/staff/status")
    public WebSocketMessage handleStaffReady(@Payload Map<String, String> readyData,
                                           SimpMessageHeaderAccessor headerAccessor) {
        String staffId = readyData.get("staffId");
        String staffName = readyData.get("staffName");
        
        return new WebSocketMessage("STAFF_READY", 
            staffName + " is ready to receive orders");
    }

    /**
     * Handle customer order tracking request
     */
    @MessageMapping("/order/track")
    public void handleOrderTracking(@Payload Map<String, String> trackData,
                                  SimpMessageHeaderAccessor headerAccessor) {
        String orderId = trackData.get("orderId");
        String customerId = trackData.get("customerId");
        
        // Send current order status to customer
        webSocketService.sendNotificationToUser(customerId, 
            "Tracking order #" + orderId, "ORDER_TRACKING");
    }
}

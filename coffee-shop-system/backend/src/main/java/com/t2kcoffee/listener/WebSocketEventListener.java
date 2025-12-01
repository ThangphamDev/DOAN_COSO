package com.t2kcoffee.listener;

import com.t2kcoffee.service.WebSocketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;

/**
 * WebSocket Event Listener to handle connection lifecycle
 * Automatically cleanup sessions when clients disconnect
 */
@Component
public class WebSocketEventListener {

    @Autowired
    private WebSocketService webSocketService;

    /**
     * Handle WebSocket connection events
     */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        System.out.println("[WebSocket] New connection established. Session ID: " + sessionId);
    }

    /**
     * Handle WebSocket disconnection events
     * Automatically cleanup user sessions
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        System.out.println("[WebSocket] Session disconnected: " + sessionId);
        
        // Get session attributes that were set during registration
        Map<String, Object> sessionAttributes = headerAccessor.getSessionAttributes();
        
        if (sessionAttributes != null) {
            String userId = (String) sessionAttributes.get("userId");
            String userType = (String) sessionAttributes.get("userType");
            
            if (userId != null && userType != null) {
                System.out.println("[WebSocket] Auto-cleanup for user: " + userId + ", type: " + userType);
                webSocketService.unregisterUserSession(userId, sessionId, userType);
            }
        }
    }
}

package com.t2kcoffee.controller;

import com.t2kcoffee.service.MoMoPaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/momo")
@CrossOrigin(origins = "*")
public class MoMoPaymentController {
    
    private final MoMoPaymentService moMoPaymentService;
    
    @Autowired
    public MoMoPaymentController(MoMoPaymentService moMoPaymentService) {
        this.moMoPaymentService = moMoPaymentService;
    }
    
    /**
     * Tạo payment request với MoMo
     * POST /api/momo/create
     * Body: { "orderId": 123, "amount": 100000, "orderInfo": "Thanh toan don hang" }
     */
    @PostMapping("/create")
    public ResponseEntity<?> createPayment(@RequestBody Map<String, Object> request) {
        try {
            Integer orderId = Integer.parseInt(request.get("orderId").toString());
            BigDecimal amount = new BigDecimal(request.get("amount").toString());
            String orderInfo = request.get("orderInfo") != null 
                ? request.get("orderInfo").toString() 
                : "Thanh toan don hang #" + orderId;
            
            Map<String, Object> result = moMoPaymentService.createPaymentRequest(orderId, amount, orderInfo);
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(
                Map.of("error", "Failed to create payment: " + e.getMessage()),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
    
    /**
     * Callback từ MoMo (IPN - Instant Payment Notification)
     * POST /api/momo/notify
     */
    @PostMapping("/notify")
    public ResponseEntity<?> handlePaymentNotify(@RequestBody Map<String, String> callbackData) {
        try {
            Map<String, Object> result = moMoPaymentService.handlePaymentCallback(callbackData);
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(
                Map.of("error", "Failed to process callback: " + e.getMessage()),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
    
    /**
     * Return URL từ MoMo (sau khi user thanh toán xong)
     * GET /api/momo/return
     * Chỉ xử lý callback, không tạo HTML - để MoMo tự hiển thị giao diện thành công
     */
    @GetMapping("/return")
    public ResponseEntity<?> handlePaymentReturn(@RequestParam Map<String, String> allParams) {
        try {
            // Log all received parameters for debugging
            System.out.println("DEBUG - MoMo return callback received:");
            for (Map.Entry<String, String> entry : allParams.entrySet()) {
                System.out.println("  " + entry.getKey() + " = " + entry.getValue());
            }
            
            // Convert all request parameters to Map<String, String>
            Map<String, String> callbackData = new java.util.HashMap<>(allParams);
            
            // Xử lý callback (cập nhật payment status trong database)
            Map<String, Object> result = moMoPaymentService.handlePaymentCallback(callbackData);
            
            // Trả về response đơn giản - MoMo sẽ tự hiển thị giao diện thành công
            // Hoặc redirect về MoMo success page nếu có
            return ResponseEntity.ok()
                .header("Content-Type", "application/json; charset=UTF-8")
                .body(Map.of(
                    "status", "ok",
                    "message", "Payment processed successfully",
                    "orderId", result.get("orderId")
                ));
        } catch (Exception e) {
            e.printStackTrace();
            // Trả về lỗi dạng JSON đơn giản
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .header("Content-Type", "application/json; charset=UTF-8")
                .body(Map.of(
                    "status", "error",
                    "message", "Failed to process payment: " + e.getMessage()
                ));
        }
    }
    
    /**
     * Kiểm tra trạng thái thanh toán
     * GET /api/momo/status/{orderId}
     */
    @GetMapping("/status/{orderId}")
    public ResponseEntity<?> checkPaymentStatus(@PathVariable Integer orderId) {
        try {
            Map<String, Object> result = moMoPaymentService.checkPaymentStatus(orderId);
            return new ResponseEntity<>(result, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>(
                Map.of("error", "Failed to check status: " + e.getMessage()),
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
    
}


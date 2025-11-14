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
     * Trả về HTML đẹp để user thấy thông báo thành công trước khi quay về app
     */
    @GetMapping("/return")
    public ResponseEntity<String> handlePaymentReturn(@RequestParam Map<String, String> allParams) {
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

            // Lấy thông tin từ result
            String resultCode = allParams.get("resultCode");
            String orderId = result.get("orderId").toString();
            boolean isSuccess = "0".equals(resultCode);

            // Tạo HTML response đẹp
            String htmlContent = buildSuccessHtml(isSuccess, orderId);

            return ResponseEntity.ok()
                .header("Content-Type", "text/html; charset=UTF-8")
                .body(htmlContent);
        } catch (Exception e) {
            e.printStackTrace();
            // Trả về HTML lỗi đẹp
            String errorHtml = buildErrorHtml(e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .header("Content-Type", "text/html; charset=UTF-8")
                .body(errorHtml);
        }
    }

    /**
     * Tạo HTML success page
     */
    private String buildSuccessHtml(boolean isSuccess, String orderId) {
        String title = isSuccess ? "Thanh toán thành công!" : "Thanh toán thất bại";
        String message = isSuccess
            ? "Đơn hàng #" + orderId + " đã được thanh toán thành công."
            : "Thanh toán không thành công. Vui lòng thử lại.";
        String iconColor = isSuccess ? "#10b981" : "#ef4444";
        String icon = isSuccess ? "✓" : "✗";

        return "<!DOCTYPE html>\n" +
            "<html lang=\"vi\">\n" +
            "<head>\n" +
            "    <meta charset=\"UTF-8\">\n" +
            "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
            "    <title>" + title + "</title>\n" +
            "    <style>\n" +
            "        * { margin: 0; padding: 0; box-sizing: border-box; }\n" +
            "        body {\n" +
            "            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n" +
            "            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n" +
            "            min-height: 100vh;\n" +
            "            display: flex;\n" +
            "            align-items: center;\n" +
            "            justify-content: center;\n" +
            "            padding: 20px;\n" +
            "        }\n" +
            "        .container {\n" +
            "            background: white;\n" +
            "            border-radius: 20px;\n" +
            "            padding: 40px 30px;\n" +
            "            max-width: 400px;\n" +
            "            width: 100%;\n" +
            "            text-align: center;\n" +
            "            box-shadow: 0 20px 60px rgba(0,0,0,0.3);\n" +
            "        }\n" +
            "        .icon {\n" +
            "            width: 80px;\n" +
            "            height: 80px;\n" +
            "            background: " + iconColor + ";\n" +
            "            border-radius: 50%;\n" +
            "            display: flex;\n" +
            "            align-items: center;\n" +
            "            justify-content: center;\n" +
            "            margin: 0 auto 20px;\n" +
            "            font-size: 50px;\n" +
            "            color: white;\n" +
            "            font-weight: bold;\n" +
            "        }\n" +
            "        h1 {\n" +
            "            color: #1f2937;\n" +
            "            font-size: 24px;\n" +
            "            margin-bottom: 12px;\n" +
            "        }\n" +
            "        p {\n" +
            "            color: #6b7280;\n" +
            "            font-size: 16px;\n" +
            "            line-height: 1.6;\n" +
            "            margin-bottom: 30px;\n" +
            "        }\n" +
            "        .note {\n" +
            "            background: #f3f4f6;\n" +
            "            padding: 15px;\n" +
            "            border-radius: 10px;\n" +
            "            color: #4b5563;\n" +
            "            font-size: 14px;\n" +
            "        }\n" +
            "        .loader {\n" +
            "            margin: 20px auto;\n" +
            "            width: 40px;\n" +
            "            height: 40px;\n" +
            "            border: 4px solid #f3f4f6;\n" +
            "            border-top: 4px solid " + iconColor + ";\n" +
            "            border-radius: 50%;\n" +
            "            animation: spin 1s linear infinite;\n" +
            "        }\n" +
            "        @keyframes spin {\n" +
            "            0% { transform: rotate(0deg); }\n" +
            "            100% { transform: rotate(360deg); }\n" +
            "        }\n" +
            "    </style>\n" +
            "</head>\n" +
            "<body>\n" +
            "    <div class=\"container\">\n" +
            "        <div class=\"icon\">" + icon + "</div>\n" +
            "        <h1>" + title + "</h1>\n" +
            "        <p>" + message + "</p>\n" +
            "        <div class=\"note\">\n" +
            "            <strong>Vui lòng quay về ứng dụng</strong><br>\n" +
            "            Trang này sẽ tự động đóng sau giây lát...\n" +
            "        </div>\n" +
            "        <div class=\"loader\"></div>\n" +
            "    </div>\n" +
            "    <script>\n" +
            "        // Tự động đóng sau 2 giây\n" +
            "        setTimeout(function() {\n" +
            "            window.close();\n" +
            "        }, 2000);\n" +
            "    </script>\n" +
            "</body>\n" +
            "</html>";
    }

    /**
     * Tạo HTML error page
     */
    private String buildErrorHtml(String errorMessage) {
        return buildSuccessHtml(false, "N/A");
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


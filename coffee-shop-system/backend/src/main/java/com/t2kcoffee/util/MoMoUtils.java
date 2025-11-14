package com.t2kcoffee.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

public class MoMoUtils {
    
    /**
     * Tạo chữ ký HMAC SHA256 cho MoMo payment request
     */
    public static String createSignature(Map<String, String> params, String secretKey) {
        try {
            // Sắp xếp các tham số theo thứ tự alphabet
            TreeMap<String, String> sortedParams = new TreeMap<>(params);
            
            // Tạo query string
            // Lưu ý: Không filter empty string vì MoMo yêu cầu tính cả empty values vào signature
            String queryString = sortedParams.entrySet().stream()
                .filter(entry -> entry.getValue() != null) // Chỉ filter null, không filter empty
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .collect(Collectors.joining("&"));
            
            // Tạo HMAC SHA256
            Mac hmacSha256 = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(
                secretKey.getBytes(StandardCharsets.UTF_8), 
                "HmacSHA256"
            );
            hmacSha256.init(secretKeySpec);
            byte[] hash = hmacSha256.doFinal(queryString.getBytes(StandardCharsets.UTF_8));
            
            // Convert to hex string
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error creating MoMo signature", e);
        }
    }
    
    /**
     * Tạo requestId duy nhất
     */
    public static String generateRequestId() {
        return "REQ" + System.currentTimeMillis();
    }
    
    /**
     * Tạo orderId từ orderId của hệ thống
     */
    public static String generateOrderId(Integer orderId) {
        return "ORDER" + orderId + "_" + System.currentTimeMillis();
    }
}


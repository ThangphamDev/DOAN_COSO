package com.t2kcoffee.controller;

import com.t2kcoffee.entity.CafeOrder;
import com.t2kcoffee.service.CafeOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activities")
@CrossOrigin(origins = "*")
public class ActivityController {
    
    private final CafeOrderService cafeOrderService;
    
    @Autowired
    public ActivityController(CafeOrderService cafeOrderService) {
        this.cafeOrderService = cafeOrderService;
    }
    
    @GetMapping("/recent")
    public ResponseEntity<List<Map<String, String>>> getRecentActivities() {
        // Tạo danh sách hoạt động trống
        List<Map<String, String>> activities = new ArrayList<>();
        
        try {
            // Lấy 10 đơn hàng gần đây nhất từ service
            List<CafeOrder> recentOrders = cafeOrderService.getRecentOrders(10);
            
            // Nếu không có đơn hàng nào, trả về danh sách trống
            if (recentOrders == null || recentOrders.isEmpty()) {
                return ResponseEntity.ok(activities);
            }
            
            // Định dạng ngày giờ
            SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
            
            // Tạo danh sách hoạt động từ đơn hàng
            for (CafeOrder order : recentOrders) {
                if (order == null || order.getOrderTime() == null) {
                    continue; // Bỏ qua nếu đơn hàng không có thông tin đầy đủ
                }
                
                Map<String, String> activity = new HashMap<>();
                
                // Chuyển đổi Date sang chuỗi ISO timestamp cho frontend
                activity.put("time", dateFormat.format(order.getOrderTime()));
                
                // Xác định loại hoạt động dựa trên trạng thái đơn hàng
                String status = order.getStatus();
                if (status == null) {
                    status = "PENDING";
                }
                
                switch (status) {
                    case "COMPLETED":
                        activity.put("activity", "Thanh toán đơn hàng");
                        break;
                    case "CANCELED":
                        activity.put("activity", "Hủy đơn hàng");
                        break;
                    case "PROCESSING":
                        activity.put("activity", "Xử lý đơn hàng");
                        break;
                    default:
                        activity.put("activity", "Tạo đơn hàng mới");
                        break;
                }
                
                // Thông tin người dùng
                if (order.getAccount() != null) {
                    activity.put("user", order.getAccount().getFullName());
                } else {
                    activity.put("user", "Khách hàng");
                }
                
                // Chi tiết hoạt động
                activity.put("details", "Đơn hàng #" + order.getIdOrder() + 
                         " - " + order.getTotalAmount() + " VND" +
                         (order.getTable() != null ? " - Bàn " + order.getTable().getTableNumber() : ""));
                
                activities.add(activity);
            }
        } catch (Exception e) {
            // Ghi log lỗi nhưng vẫn trả về danh sách trống thay vì dữ liệu mẫu
            System.err.println("Lỗi khi lấy hoạt động gần đây: " + e.getMessage());
        }
        
        // Trả về danh sách hoạt động (có thể trống)
        return ResponseEntity.ok(activities);
    }
} 
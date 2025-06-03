package com.t2kcoffee.controller;

import com.t2kcoffee.entity.CafeOrder;
import com.t2kcoffee.entity.OrderDetail;
import com.t2kcoffee.entity.Product;
import com.t2kcoffee.service.AccountService;
import com.t2kcoffee.service.CafeOrderService;
import com.t2kcoffee.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {
    
    private final AccountService accountService;
    private final ProductService productService;
    private final CafeOrderService cafeOrderService;
    
    @Autowired
    public DashboardController(AccountService accountService, ProductService productService, CafeOrderService cafeOrderService) {
        this.accountService = accountService;
        this.productService = productService;
        this.cafeOrderService = cafeOrderService;
    }
    
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        Map<String, Object> summary = new HashMap<>();
        
        try {
            // Lấy số lượng nhân viên và sản phẩm từ service
            int staffCount = accountService.getAllAccounts().size();
            int productCount = productService.getAllProducts().size();
            
            // Lấy đơn hàng hôm nay và doanh thu hôm nay
            LocalDate today = LocalDate.now();
            Date startOfDay = Date.from(today.atStartOfDay(ZoneId.systemDefault()).toInstant());
            Date endOfDay = Date.from(today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant());
            
            List<CafeOrder> todayOrders = cafeOrderService.getOrdersInDateRange(startOfDay, endOfDay);
            
            // Đảm bảo danh sách đơn hàng không rỗng
            if (todayOrders == null) {
                todayOrders = new ArrayList<>();
            }
            
            // Chỉ tính đơn hàng đã hoàn thành cho doanh thu
            List<CafeOrder> completedOrders = todayOrders.stream()
                    .filter(order -> "COMPLETED".equalsIgnoreCase(order.getStatus()))
                    .collect(Collectors.toList());
            
            // Tính tổng doanh thu hôm nay từ đơn hàng đã hoàn thành
            double todayRevenue = 0;
            for (CafeOrder order : completedOrders) {
                if (order.getTotalAmount() != null) {
                    todayRevenue += order.getTotalAmount().doubleValue();
                }
            }
            
            // Tính số lượng đơn hàng hôm nay
            int todayOrdersCount = todayOrders.size();
            
            // Tìm sản phẩm bán chạy nhất
            Map<String, Integer> productSales = new HashMap<>();
            for (CafeOrder order : todayOrders) {
                if (order.getOrderDetails() != null) {
                    for (OrderDetail detail : order.getOrderDetails()) {
                        if (detail.getProduct() != null && detail.getProduct().getProductName() != null) {
                            String productName = detail.getProduct().getProductName();
                            int quantity = detail.getQuantity();
                            productSales.put(productName, productSales.getOrDefault(productName, 0) + quantity);
                        }
                    }
                }
            }
            
            String bestSeller = "Chưa có dữ liệu";
            if (!productSales.isEmpty()) {
                bestSeller = Collections.max(productSales.entrySet(), Map.Entry.comparingByValue()).getKey();
            }
            
            // Tìm giờ cao điểm
            Map<Integer, Integer> hourlyOrders = new HashMap<>();
            for (CafeOrder order : todayOrders) {
                if (order.getOrderTime() != null) {
                    Calendar calendar = Calendar.getInstance();
                    calendar.setTime(order.getOrderTime());
                    int hour = calendar.get(Calendar.HOUR_OF_DAY);
                    hourlyOrders.put(hour, hourlyOrders.getOrDefault(hour, 0) + 1);
                }
            }
            
            String busiestTime = "Chưa có dữ liệu";
            if (!hourlyOrders.isEmpty()) {
                int busiestHour = Collections.max(hourlyOrders.entrySet(), Map.Entry.comparingByValue()).getKey();
                busiestTime = String.format("%02d:00 - %02d:00", busiestHour, busiestHour + 1);
            }
            
            // Tính giá trị đơn hàng trung bình
            double avgOrderValue = 0;
            if (!completedOrders.isEmpty()) {
                avgOrderValue = todayRevenue / completedOrders.size();
            }
            
            // Tính số lượng khách hàng thân thiết (chỉ tính nếu có dữ liệu)
            int loyalCustomers = 0;
            
            // Thêm dữ liệu vào summary
            summary.put("todayRevenue", (int) todayRevenue);
            summary.put("todayOrders", todayOrdersCount);
            summary.put("staffCount", staffCount);
            summary.put("productCount", productCount);
            summary.put("bestSeller", bestSeller);
            summary.put("busiestTime", busiestTime);
            summary.put("avgOrderValue", (int) avgOrderValue);
            summary.put("loyalCustomers", loyalCustomers);
            
            // Thêm dữ liệu trend (phần trăm tăng/giảm)
            // Vì hiện tại chưa có dữ liệu so sánh, nên mặc định là 0 (không thay đổi)
            Map<String, Object> revenueTrend = new HashMap<>();
            revenueTrend.put("value", 0.0);
            revenueTrend.put("direction", "no-change");
            
            Map<String, Object> ordersTrend = new HashMap<>();
            ordersTrend.put("value", 0.0);
            ordersTrend.put("direction", "no-change");
            
            Map<String, Object> staffTrend = new HashMap<>();
            staffTrend.put("value", 0.0);
            staffTrend.put("direction", "no-change");
            
            Map<String, Object> productTrend = new HashMap<>();
            productTrend.put("value", 0.0);
            productTrend.put("direction", "no-change");
            
            summary.put("revenueTrend", revenueTrend);
            summary.put("ordersTrend", ordersTrend);
            summary.put("staffTrend", staffTrend);
            summary.put("productTrend", productTrend);
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy dữ liệu tổng quan: " + e.getMessage());
            
            // Đặt giá trị mặc định khi có lỗi
            summary.put("todayRevenue", 0);
            summary.put("todayOrders", 0);
            summary.put("staffCount", 0);
            summary.put("productCount", 0);
            summary.put("bestSeller", "Chưa có dữ liệu");
            summary.put("busiestTime", "Chưa có dữ liệu");
            summary.put("avgOrderValue", 0);
            summary.put("loyalCustomers", 0);
            
            // Đặt các trend về 0
            Map<String, Object> defaultTrend = new HashMap<>();
            defaultTrend.put("value", 0.0);
            defaultTrend.put("direction", "no-change");
            
            summary.put("revenueTrend", defaultTrend);
            summary.put("ordersTrend", defaultTrend);
            summary.put("staffTrend", defaultTrend);
            summary.put("productTrend", defaultTrend);
        }
        
        return ResponseEntity.ok(summary);
    }
    
    @GetMapping("/revenue-chart")
    public ResponseEntity<Map<String, Object>> getRevenueChart(@RequestParam(defaultValue = "week") String period) {
        Map<String, Object> chartData = new HashMap<>();
        List<String> labels = new ArrayList<>();
        List<Double> data = new ArrayList<>();
        
        try {
            LocalDate today = LocalDate.now();
            
            // Dựa trên khoảng thời gian được yêu cầu
            switch (period) {
                case "week":
                    // Lấy dữ liệu doanh thu trong tuần (T2 -> CN)
                    LocalDate monday = today.minusDays(today.getDayOfWeek().getValue() - 1);
                    
                    for (int i = 0; i < 7; i++) {
                        LocalDate day = monday.plusDays(i);
                        Date startOfDay = Date.from(day.atStartOfDay(ZoneId.systemDefault()).toInstant());
                        Date endOfDay = Date.from(day.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant());
                        
                        // Lấy đơn hàng trong ngày
                        List<CafeOrder> dayOrders = cafeOrderService.getOrdersInDateRange(startOfDay, endOfDay);
                        
                        // Đảm bảo danh sách không null
                        if (dayOrders == null) {
                            dayOrders = new ArrayList<>();
                        }
                        
                        // Tính tổng doanh thu trong ngày
                        double dayRevenue = 0;
                        for (CafeOrder order : dayOrders) {
                            if ("COMPLETED".equalsIgnoreCase(order.getStatus()) && order.getTotalAmount() != null) {
                                dayRevenue += order.getTotalAmount().doubleValue();
                            }
                        }
                        
                        // Chuyển đổi sang đơn vị triệu đồng và làm tròn 1 chữ số
                        double revenueInMillions = Math.round(dayRevenue / 100000.0) / 10.0;
                        
                        // Thêm nhãn ngày và doanh thu
                        String[] days = {"T2", "T3", "T4", "T5", "T6", "T7", "CN"};
                        labels.add(days[i]);
                        data.add(revenueInMillions);
                    }
                    break;
                
                case "month":
                    // Lấy dữ liệu doanh thu trong tháng (30 ngày)
                    LocalDate firstDayOfMonth = today.withDayOfMonth(1);
                    int daysInMonth = today.lengthOfMonth();
                    
                    for (int i = 0; i < daysInMonth; i++) {
                        LocalDate day = firstDayOfMonth.plusDays(i);
                        Date startOfDay = Date.from(day.atStartOfDay(ZoneId.systemDefault()).toInstant());
                        Date endOfDay = Date.from(day.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant());
                        
                        // Lấy đơn hàng trong ngày
                        List<CafeOrder> dayOrders = cafeOrderService.getOrdersInDateRange(startOfDay, endOfDay);
                        
                        // Đảm bảo danh sách không null
                        if (dayOrders == null) {
                            dayOrders = new ArrayList<>();
                        }
                        
                        // Tính tổng doanh thu trong ngày
                        double dayRevenue = 0;
                        for (CafeOrder order : dayOrders) {
                            if ("COMPLETED".equalsIgnoreCase(order.getStatus()) && order.getTotalAmount() != null) {
                                dayRevenue += order.getTotalAmount().doubleValue();
                            }
                        }
                        
                        // Chuyển đổi sang đơn vị triệu đồng và làm tròn 1 chữ số
                        double revenueInMillions = Math.round(dayRevenue / 100000.0) / 10.0;
                        
                        // Thêm nhãn ngày và doanh thu
                        labels.add(String.valueOf(i + 1));
                        data.add(revenueInMillions);
                    }
                    break;
                
                case "year":
                    // Lấy dữ liệu doanh thu trong năm (12 tháng)
                    int currentYear = today.getYear();
                    
                    for (int month = 1; month <= 12; month++) {
                        LocalDate monthFirstDay = LocalDate.of(currentYear, month, 1);
                        LocalDate nextMonthFirstDay = monthFirstDay.plusMonths(1);
                        
                        Date startOfMonth = Date.from(monthFirstDay.atStartOfDay(ZoneId.systemDefault()).toInstant());
                        Date startOfNextMonth = Date.from(nextMonthFirstDay.atStartOfDay(ZoneId.systemDefault()).toInstant());
                        
                        // Lấy đơn hàng trong tháng
                        List<CafeOrder> monthOrders = cafeOrderService.getOrdersInDateRange(startOfMonth, startOfNextMonth);
                        
                        // Đảm bảo danh sách không null
                        if (monthOrders == null) {
                            monthOrders = new ArrayList<>();
                        }
                        
                        // Tính tổng doanh thu trong tháng
                        double monthRevenue = 0;
                        for (CafeOrder order : monthOrders) {
                            if ("COMPLETED".equalsIgnoreCase(order.getStatus()) && order.getTotalAmount() != null) {
                                monthRevenue += order.getTotalAmount().doubleValue();
                            }
                        }
                        
                        // Chuyển đổi sang đơn vị triệu đồng và làm tròn 1 chữ số
                        double revenueInMillions = Math.round(monthRevenue / 100000.0) / 10.0;
                        
                        // Thêm nhãn tháng và doanh thu
                        labels.add("T" + month);
                        data.add(revenueInMillions);
                    }
                    break;
                
                default:
                    // Mặc định: dữ liệu tuần
                    LocalDate defaultMonday = today.minusDays(today.getDayOfWeek().getValue() - 1);
                    
                    for (int i = 0; i < 7; i++) {
                        LocalDate day = defaultMonday.plusDays(i);
                        Date startOfDay = Date.from(day.atStartOfDay(ZoneId.systemDefault()).toInstant());
                        Date endOfDay = Date.from(day.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant());
                        
                        // Lấy đơn hàng trong ngày
                        List<CafeOrder> dayOrders = cafeOrderService.getOrdersInDateRange(startOfDay, endOfDay);
                        
                        // Đảm bảo danh sách không null
                        if (dayOrders == null) {
                            dayOrders = new ArrayList<>();
                        }
                        
                        // Tính tổng doanh thu trong ngày
                        double dayRevenue = 0;
                        for (CafeOrder order : dayOrders) {
                            if ("COMPLETED".equalsIgnoreCase(order.getStatus()) && order.getTotalAmount() != null) {
                                dayRevenue += order.getTotalAmount().doubleValue();
                            }
                        }
                        
                        // Chuyển đổi sang đơn vị triệu đồng và làm tròn 1 chữ số
                        double revenueInMillions = Math.round(dayRevenue / 100000.0) / 10.0;
                        
                        // Thêm nhãn ngày và doanh thu
                        String[] days = {"T2", "T3", "T4", "T5", "T6", "T7", "CN"};
                        labels.add(days[i]);
                        data.add(revenueInMillions);
                    }
                    break;
            }
        } catch (Exception e) {
            System.err.println("Lỗi khi tính toán dữ liệu biểu đồ doanh thu: " + e.getMessage());
            // Trong trường hợp lỗi, trả về dữ liệu trống
            labels.clear();
            data.clear();
        }
        
        chartData.put("labels", labels);
        chartData.put("data", data);
        
        return ResponseEntity.ok(chartData);
    }
    
    @GetMapping("/top-products")
    public ResponseEntity<Map<String, Object>> getTopProducts() {
        Map<String, Object> chartData = new HashMap<>();
        List<String> labels = new ArrayList<>();
        List<Integer> data = new ArrayList<>();
        
        try {
            // Lấy tất cả đơn hàng trong 30 ngày gần nhất
            LocalDate today = LocalDate.now();
            LocalDate thirtyDaysAgo = today.minusDays(30);
            
            Date startDate = Date.from(thirtyDaysAgo.atStartOfDay(ZoneId.systemDefault()).toInstant());
            Date endDate = Date.from(today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant());
            
            List<CafeOrder> recentOrders = cafeOrderService.getOrdersInDateRange(startDate, endDate);
            
            // Đảm bảo danh sách không null
            if (recentOrders == null) {
                recentOrders = new ArrayList<>();
            }
            
            // Tính số lượng bán của từng sản phẩm
            Map<String, Integer> productSales = new HashMap<>();
            for (CafeOrder order : recentOrders) {
                if (order.getOrderDetails() != null) {
                    for (OrderDetail detail : order.getOrderDetails()) {
                        if (detail.getProduct() != null && detail.getProduct().getProductName() != null) {
                            String productName = detail.getProduct().getProductName();
                            int quantity = detail.getQuantity();
                            productSales.put(productName, productSales.getOrDefault(productName, 0) + quantity);
                        }
                    }
                }
            }
            
            // Sắp xếp sản phẩm theo số lượng bán
            List<Map.Entry<String, Integer>> sortedProducts = productSales.entrySet()
                    .stream()
                    .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                    .collect(Collectors.toList());
            
            // Lấy top 5 sản phẩm bán chạy nhất
            int otherProductsTotal = 0;
            for (int i = 0; i < sortedProducts.size(); i++) {
                if (i < 4) {
                    // Thêm top 4 sản phẩm
                    labels.add(sortedProducts.get(i).getKey());
                    data.add(sortedProducts.get(i).getValue());
                } else {
                    // Tổng hợp các sản phẩm còn lại vào mục "Khác"
                    otherProductsTotal += sortedProducts.get(i).getValue();
                }
            }
            
            // Thêm mục "Khác" nếu có
            if (otherProductsTotal > 0) {
                labels.add("Khác");
                data.add(otherProductsTotal);
            }
        } catch (Exception e) {
            System.err.println("Lỗi khi tính toán dữ liệu sản phẩm bán chạy: " + e.getMessage());
        }
        
        // Nếu không có dữ liệu sản phẩm
        if (labels.isEmpty()) {
            labels.add("Chưa có dữ liệu");
            data.add(1); // Giá trị 1 để vẽ biểu đồ trống
        }
        
        chartData.put("labels", labels);
        chartData.put("data", data);
        
        return ResponseEntity.ok(chartData);
    }

    // Thêm endpoint /chart để fix lỗi 404
    @GetMapping("/chart")
    public ResponseEntity<Map<String, Object>> getChartData(@RequestParam(defaultValue = "week") String period) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Lấy dữ liệu biểu đồ doanh thu
            ResponseEntity<Map<String, Object>> revenueChartResponse = getRevenueChart(period);
            Map<String, Object> revenueChartData = revenueChartResponse.getBody();
            
            // Đóng gói dữ liệu vào response
            response.put("revenue", revenueChartData);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Lỗi khi lấy dữ liệu biểu đồ: " + e.getMessage());
            response.put("error", "Có lỗi xảy ra khi lấy dữ liệu biểu đồ");
            return ResponseEntity.ok(response);
        }
    }
} 
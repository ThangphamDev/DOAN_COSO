package com.t2kcoffee.controller;

import com.t2kcoffee.entity.CafeOrder;
import com.t2kcoffee.entity.OrderDetail;
import com.t2kcoffee.entity.Product;
import com.t2kcoffee.entity.Payment;
import com.t2kcoffee.entity.Account;
import com.t2kcoffee.dto.CafeOrderDTO;
import com.t2kcoffee.dto.OrderDetailDTO;
import com.t2kcoffee.dto.ProductDTO;
import com.t2kcoffee.dto.PaymentDTO;
import com.t2kcoffee.service.CafeOrderService;
import com.t2kcoffee.service.ProductService;
import com.t2kcoffee.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class CafeOrderController {

    private final CafeOrderService cafeOrderService;
    private final ProductService productService;
    private final AccountService accountService;

    @Autowired
    public CafeOrderController(CafeOrderService cafeOrderService, ProductService productService, AccountService accountService) {
        this.cafeOrderService = cafeOrderService;
        this.productService = productService;
        this.accountService = accountService;
    }

    // Hàm chuyển đổi Product -> ProductDTO
    private ProductDTO toProductDTO(Product product) {
        if (product == null) return null;
        ProductDTO dto = new ProductDTO();
        dto.setIdProduct(product.getIdProduct());
        dto.setProductName(product.getProductName());
        dto.setPrice(product.getPrice());
        dto.setDescription(product.getDescription());
        dto.setIsAvailable(product.getIsAvailable());
        dto.setImage(product.getImage());
        if (product.getCategory() != null) {
            dto.setCategoryId(product.getCategory().getIdCategory());
            dto.setCategoryName(product.getCategory().getCategoryName());
        }
        return dto;
    }

    // Hàm chuyển đổi Payment -> PaymentDTO
    private PaymentDTO toPaymentDTO(Payment payment) {
        if (payment == null) return null;
        PaymentDTO dto = new PaymentDTO();
        dto.setIdPayment(payment.getIdPayment());
        dto.setCreateAt(payment.getCreateAt());
        dto.setPaymentMethod(payment.getPaymentMethod());
        dto.setPaymentStatus(payment.getPaymentStatus());
        return dto;
    }

    // Hàm chuyển đổi OrderDetail -> OrderDetailDTO
    private OrderDetailDTO toOrderDetailDTO(OrderDetail detail) {
        if (detail == null) return null;
        OrderDetailDTO dto = new OrderDetailDTO();
        dto.setProductId(detail.getId() != null ? detail.getId().getIdProduct() : null);
        dto.setOrderId(detail.getId() != null ? detail.getId().getIdOrder() : null);
        dto.setProduct(toProductDTO(detail.getProduct()));  // Product info đầy đủ
        dto.setQuantity(detail.getQuantity());
        dto.setUnitPrice(detail.getUnitPrice());
        dto.setSubtotal(detail.getSubtotal());
        dto.setSize(detail.getSize());
        dto.setIcePercent(detail.getIcePercent());
        dto.setSugarPercent(detail.getSugarPercent());
        dto.setToppings(detail.getToppings());
        dto.setAdditionalPrice(detail.getAdditionalPrice());
        dto.setVariantNote(detail.getVariantNote());
        return dto;
    }

    // Hàm chuyển đổi CafeOrder -> CafeOrderDTO
    private CafeOrderDTO toCafeOrderDTO(CafeOrder order) {
        if (order == null) return null;
        CafeOrderDTO dto = new CafeOrderDTO();
        dto.setIdOrder(order.getIdOrder());
        if (order.getTable() != null) {
            dto.setIdTable(order.getTable().getIdTable());
            dto.setTableNumber(order.getTable().getTableNumber() != null 
                ? order.getTable().getTableNumber().toString() 
                : null);
        }
        dto.setQuantity(order.getQuantity());
        dto.setOrderTime(order.getOrderTime());
        dto.setTotalAmount(order.getTotalAmount());
        dto.setNote(order.getNote());
        dto.setStatus(order.getStatus());
        if (order.getAccount() != null) {
            dto.setIdAccount(order.getAccount().getIdAccount());
            dto.setCustomerName(order.getAccount().getFullName());
        }
        if (order.getPromotion() != null) {
            dto.setIdPromotion(order.getPromotion().getIdPromotion());
        }
        dto.setPayment(toPaymentDTO(order.getPayment()));
        
        // Convert orderDetails với Product info đầy đủ
        if (order.getOrderDetails() != null && !order.getOrderDetails().isEmpty()) {
            dto.setOrderDetails(order.getOrderDetails().stream()
                .map(this::toOrderDetailDTO)
                .collect(java.util.stream.Collectors.toList()));
        }
        
        return dto;
    }

    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodayOrders() {
        return ResponseEntity.ok(cafeOrderService.getTodayOrders());
    }

    @GetMapping
    public ResponseEntity<List<CafeOrderDTO>> getAllOrders() {
        List<CafeOrder> orders = cafeOrderService.getAllOrders();
        List<CafeOrderDTO> dtos = orders.stream()
            .map(this::toCafeOrderDTO)
            .collect(java.util.stream.Collectors.toList());
        return new ResponseEntity<>(dtos, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CafeOrderDTO> getOrderById(@PathVariable Integer id) {
        Optional<CafeOrder> order = cafeOrderService.getOrderById(id);
        return order.map(value -> new ResponseEntity<>(toCafeOrderDTO(value), HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<CafeOrderDTO>> getOrdersByAccountId(@PathVariable Integer accountId) {
        List<CafeOrder> orders = cafeOrderService.getOrdersByAccountId(accountId);
        List<CafeOrderDTO> dtos = orders.stream()
            .map(this::toCafeOrderDTO)
            .collect(java.util.stream.Collectors.toList());
        return new ResponseEntity<>(dtos, HttpStatus.OK);
    }

    @GetMapping("/table/{tableId}")
    public ResponseEntity<List<CafeOrderDTO>> getOrdersByTableId(@PathVariable Integer tableId) {
        List<CafeOrder> orders = cafeOrderService.getOrdersByTableId(tableId);
        List<CafeOrderDTO> dtos = orders.stream()
            .map(this::toCafeOrderDTO)
            .collect(java.util.stream.Collectors.toList());
        return new ResponseEntity<>(dtos, HttpStatus.OK);
    }

    @GetMapping("/date-range")
    public ResponseEntity<List<CafeOrderDTO>> getOrdersInDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) Date endDate) {
        
        List<CafeOrder> orders = cafeOrderService.getOrdersInDateRange(startDate, endDate);
        List<CafeOrderDTO> dtos = orders.stream()
            .map(this::toCafeOrderDTO)
            .collect(java.util.stream.Collectors.toList());
        return new ResponseEntity<>(dtos, HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> requestData) {
        try {
            // Tạo đơn hàng mới
            CafeOrder order = new CafeOrder();
            
            // Thiết lập totalAmount
            if (requestData.containsKey("totalAmount")) {
                Object totalAmountObj = requestData.get("totalAmount");
                if (totalAmountObj != null) {
                    try {
                        BigDecimal amount = new BigDecimal(totalAmountObj.toString());
                        order.setTotalAmount(amount);
                    } catch (NumberFormatException e) {
                        return new ResponseEntity<>("Định dạng totalAmount không hợp lệ", HttpStatus.BAD_REQUEST);
                    }
                }
            }
            
            // Thiết lập bàn nếu có
            if (requestData.containsKey("table")) {
                Map<String, Object> tableMap = (Map<String, Object>) requestData.get("table");
                if (tableMap != null && tableMap.containsKey("idTable")) {
                    Object idTableObj = tableMap.get("idTable");
                    if (idTableObj != null && !"takeaway".equals(idTableObj.toString())) {
                        try {
                            Integer tableId = Integer.parseInt(idTableObj.toString());
                            order = cafeOrderService.setTableForOrder(order, tableId);
                        } catch (NumberFormatException e) {
                            System.out.println("DEBUG - Error parsing table ID: " + idTableObj.toString());
                        }
                    }
                }
            }
            
            // Thiết lập tài khoản người dùng nếu có
            if (requestData.containsKey("accountId")) {
                Object accountIdObj = requestData.get("accountId");
                if (accountIdObj != null) {
                    try {
                        Integer accountId = Integer.parseInt(accountIdObj.toString());
                        Optional<Account> accountOpt = accountService.getAccountById(accountId);
                        if (accountOpt.isPresent()) {
                            order.setAccount(accountOpt.get());
                            System.out.println("DEBUG - Đơn hàng được liên kết với tài khoản: " + accountId);
                        }
                    } catch (NumberFormatException e) {
                        System.out.println("DEBUG - Error parsing account ID: " + accountIdObj.toString());
                    }
                }
            }
            
            // Thiết lập trạng thái nếu có
            if (requestData.containsKey("status")) {
                order.setStatus(requestData.get("status").toString());
            } else {
                order.setStatus("processing"); // Mặc định là processing
            }
            
            // Thiết lập ghi chú nếu có
            if (requestData.containsKey("note") && requestData.get("note") != null) {
                order.setNote(requestData.get("note").toString());
            }
            
            // Thiết lập thời gian đặt hàng nếu chưa có
            if (order.getOrderTime() == null) {
                order.setOrderTime(new Date());
            }
            
            // Xử lý thông tin thanh toán nếu có
            if (requestData.containsKey("payment")) {
                System.out.println("DEBUG - Payment info: " + requestData.get("payment"));
                
                Map<String, Object> paymentMap = (Map<String, Object>) requestData.get("payment");
                if (paymentMap != null) {
                    // Tạo đối tượng Payment
                    Payment payment = new Payment();
                    
                    // Thiết lập phương thức thanh toán
                    if (paymentMap.containsKey("paymentMethod")) {
                        payment.setPaymentMethod(paymentMap.get("paymentMethod").toString());
                    } else {
                        payment.setPaymentMethod("cash"); // Mặc định là tiền mặt
                    }
                    
                    // Thiết lập trạng thái thanh toán
                    if (paymentMap.containsKey("paymentStatus")) {
                        payment.setPaymentStatus(paymentMap.get("paymentStatus").toString());
                    } else {
                        payment.setPaymentStatus("pending"); // Mặc định là chờ thanh toán
                    }
                    
                    // Thiết lập thời gian tạo
                    payment.setCreateAt(new Date());
                    
                    // Liên kết payment với order
                    order.setPayment(payment);
                    payment.setOrder(order);
                }
            }
            
            // Bước 1: Lưu đơn hàng trước, không có OrderDetails
            System.out.println("DEBUG - Bước 1: Lưu đơn hàng");
            CafeOrder savedOrder = cafeOrderService.createOrder(order);
            System.out.println("DEBUG - Đơn hàng đã được lưu với ID: " + savedOrder.getIdOrder());
            
            // Bước 2: Xử lý các sản phẩm trong đơn hàng
            List<String> failedProducts = new ArrayList<>();
            
            if (requestData.containsKey("productItems")) {
                List<Map<String, Object>> productItems = (List<Map<String, Object>>) requestData.get("productItems");
                if (productItems != null && !productItems.isEmpty()) {
                    System.out.println("DEBUG - Bước 2: Xử lý " + productItems.size() + " sản phẩm");
                    
                    // Xử lý từng sản phẩm (không gộp để giữ nguyên variants)
                    for (Map<String, Object> item : productItems) {
                        Integer productId = Integer.parseInt(item.get("productId").toString());
                        Integer quantity = Integer.parseInt(item.get("quantity").toString());
                        BigDecimal unitPrice = new BigDecimal(item.get("unitPrice").toString());
                        
                        // Lấy variants nếu có
                        String size = item.containsKey("size") && item.get("size") != null 
                            ? item.get("size").toString() : null;
                        String icePercent = item.containsKey("icePercent") && item.get("icePercent") != null
                            ? item.get("icePercent").toString() 
                            : (item.containsKey("ice_percent") && item.get("ice_percent") != null
                                ? item.get("ice_percent").toString() : null);
                        String sugarPercent = item.containsKey("sugarPercent") && item.get("sugarPercent") != null
                            ? item.get("sugarPercent").toString()
                            : (item.containsKey("sugar_percent") && item.get("sugar_percent") != null
                                ? item.get("sugar_percent").toString() : null);
                        String toppings = item.containsKey("toppings") && item.get("toppings") != null
                            ? item.get("toppings").toString() : null;
                        
                        System.out.println("DEBUG - Xử lý sản phẩm: id=" + productId + 
                                          ", quantity=" + quantity + 
                                          ", price=" + unitPrice +
                                          ", size=" + size +
                                          ", icePercent=" + icePercent +
                                          ", sugarPercent=" + sugarPercent +
                                          ", toppings=" + toppings);
                        
                        // Thêm chi tiết đơn hàng với variants trong một giao dịch riêng
                        boolean added = cafeOrderService.addOrderDetailWithVariants(
                            savedOrder, productId, quantity, unitPrice, 
                            size, icePercent, sugarPercent, toppings);
                        
                        if (!added) {
                            failedProducts.add(productId.toString());
                            System.out.println("DEBUG - Không thể thêm sản phẩm: " + productId);
                        }
                    }
                } else {
                    System.out.println("DEBUG - Không có sản phẩm nào trong đơn hàng");
                }
            } else {
                System.out.println("DEBUG - Không có trường productItems trong request");
            }
            
            // Kiểm tra nếu có lỗi khi thêm sản phẩm
            if (!failedProducts.isEmpty()) {
                String errorMessage = "Không thể thêm các sản phẩm với ID: " + 
                                     String.join(", ", failedProducts);
                return new ResponseEntity<>(errorMessage, HttpStatus.PARTIAL_CONTENT);
            }
            
            // Bước 3: Lấy đơn hàng đã cập nhật đầy đủ và convert to DTO
            CafeOrder finalOrder = cafeOrderService.getOrderById(savedOrder.getIdOrder()).orElse(savedOrder);
            CafeOrderDTO dto = toCafeOrderDTO(finalOrder);

            return new ResponseEntity<>(dto, HttpStatus.CREATED);
        } catch (Exception e) {
            System.err.println("ERROR trong createOrder: " + e.getMessage());
            e.printStackTrace();
            return new ResponseEntity<>("Lỗi khi tạo đơn hàng: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<CafeOrderDTO> updateOrder(@PathVariable Integer id, @RequestBody CafeOrder order) {
        CafeOrder updatedOrder = cafeOrderService.updateOrder(id, order);
        if (updatedOrder != null) {
            // Convert to DTO with full product info
            CafeOrderDTO dto = toCafeOrderDTO(updatedOrder);
            return new ResponseEntity<>(dto, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable Integer id) {
        Optional<CafeOrder> order = cafeOrderService.getOrderById(id);
        if (order.isPresent()) {
            cafeOrderService.deleteOrder(id);
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // Thêm endpoint để lấy đơn hàng theo trạng thái
    @GetMapping("/status/{status}")
    public ResponseEntity<List<CafeOrderDTO>> getOrdersByStatus(@PathVariable String status) {
        List<CafeOrder> orders = cafeOrderService.getOrdersByStatus(status);
        List<CafeOrderDTO> dtos = orders.stream()
            .map(this::toCafeOrderDTO)
            .collect(java.util.stream.Collectors.toList());
        return new ResponseEntity<>(dtos, HttpStatus.OK);
    }

    // Thêm endpoint để lấy đơn hàng gần đây
    @GetMapping("/recent")
    public ResponseEntity<List<CafeOrderDTO>> getRecentOrders() {
        List<CafeOrder> recentOrders = cafeOrderService.getRecentOrders(10);
        List<CafeOrderDTO> dtos = recentOrders.stream()
            .map(this::toCafeOrderDTO)
            .collect(java.util.stream.Collectors.toList());
        return new ResponseEntity<>(dtos, HttpStatus.OK);
    }
    
    // Thêm endpoint để kiểm tra trạng thái đơn hàng
    @GetMapping("/{id}/status")
    public ResponseEntity<Map<String, String>> getOrderStatus(@PathVariable Integer id) {
        Optional<CafeOrder> orderOpt = cafeOrderService.getOrderById(id);
        if (orderOpt.isPresent()) {
            Map<String, String> statusInfo = new HashMap<>();
            statusInfo.put("status", orderOpt.get().getStatus());
            return new ResponseEntity<>(statusInfo, HttpStatus.OK);
        }
        return new ResponseEntity<>(HttpStatus.NOT_FOUND);
    }
    
    // Thêm endpoint để cập nhật trạng thái đơn hàng
    @PutMapping("/{id}/status")
    public ResponseEntity<CafeOrderDTO> updateOrderStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, String> statusUpdate) {

        if (!statusUpdate.containsKey("status")) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }

        String newStatus = statusUpdate.get("status");
        CafeOrder updatedOrder = cafeOrderService.updateOrderStatus(id, newStatus);

        if (updatedOrder != null) {
            // Convert to DTO with full product info
            CafeOrderDTO dto = toCafeOrderDTO(updatedOrder);
            return new ResponseEntity<>(dto, HttpStatus.OK);
        } else {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }
    
    // Thêm endpoint để cập nhật thông tin thanh toán
    @PutMapping("/{id}/payment")
    public ResponseEntity<?> updatePaymentInfo(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> paymentInfo) {

        try {
            // Lấy thông tin thanh toán từ request
            String paymentMethod = paymentInfo.containsKey("paymentMethod")
                ? paymentInfo.get("paymentMethod").toString()
                : "cash";

            String paymentStatus = paymentInfo.containsKey("paymentStatus")
                ? paymentInfo.get("paymentStatus").toString()
                : "pending";

            // Gọi service để cập nhật thanh toán
            CafeOrder updatedOrder = cafeOrderService.updatePaymentInfo(id, paymentMethod, paymentStatus);

            if (updatedOrder != null) {
                // Convert to DTO with full product info
                CafeOrderDTO dto = toCafeOrderDTO(updatedOrder);
                return new ResponseEntity<>(dto, HttpStatus.OK);
            } else {
                return new ResponseEntity<>("Không tìm thấy đơn hàng với ID: " + id, HttpStatus.NOT_FOUND);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return new ResponseEntity<>("Lỗi khi cập nhật thông tin thanh toán: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Thêm endpoint để kiểm tra tất cả thông tin thanh toán
    @GetMapping("/payments")
    public ResponseEntity<?> getAllPayments() {
        try {
            List<CafeOrder> orders = cafeOrderService.getAllOrders();
            List<Map<String, Object>> paymentInfoList = new ArrayList<>();
            
            for (CafeOrder order : orders) {
                if (order.getPayment() != null) {
                    Map<String, Object> paymentInfo = new HashMap<>();
                    paymentInfo.put("orderId", order.getIdOrder());
                    paymentInfo.put("paymentId", order.getPayment().getIdPayment());
                    paymentInfo.put("paymentMethod", order.getPayment().getPaymentMethod());
                    paymentInfo.put("paymentStatus", order.getPayment().getPaymentStatus());
                    paymentInfo.put("createAt", order.getPayment().getCreateAt());
                    paymentInfoList.add(paymentInfo);
                }
            }
            
            return new ResponseEntity<>(paymentInfoList, HttpStatus.OK);
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi khi lấy thông tin thanh toán: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
} 
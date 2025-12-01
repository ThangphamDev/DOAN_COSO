package com.t2kcoffee.service;

import com.t2kcoffee.entity.CafeOrder;
import com.t2kcoffee.entity.CafeTable;
import com.t2kcoffee.entity.OrderDetail;
import com.t2kcoffee.entity.OrderDetailId;
import com.t2kcoffee.entity.Product;
import com.t2kcoffee.entity.Payment;
import com.t2kcoffee.entity.Account;
import com.t2kcoffee.repository.CafeOrderRepository;
import com.t2kcoffee.repository.CafeTableRepository;
import com.t2kcoffee.repository.OrderDetailRepository;
import com.t2kcoffee.repository.ProductRepository;
import com.t2kcoffee.service.AccountService;
import com.t2kcoffee.service.WebSocketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;
import java.util.HashMap;

@Service
public class CafeOrderService {

    private final CafeOrderRepository cafeOrderRepository;
    private final CafeTableRepository cafeTableRepository;
    private final ProductRepository productRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final AccountService accountService;
    private final WebSocketService webSocketService;

    @Autowired
    public CafeOrderService(CafeOrderRepository cafeOrderRepository, 
                           CafeTableRepository cafeTableRepository,
                           ProductRepository productRepository,
                           OrderDetailRepository orderDetailRepository,
                           AccountService accountService,
                           WebSocketService webSocketService) {
        this.cafeOrderRepository = cafeOrderRepository;
        this.cafeTableRepository = cafeTableRepository;
        this.productRepository = productRepository;
        this.orderDetailRepository = orderDetailRepository;
        this.accountService = accountService;
        this.webSocketService = webSocketService;
    }

    public List<CafeOrder> getAllOrders() {
        return cafeOrderRepository.findAll();
    }

    public Optional<CafeOrder> getOrderById(Integer id) {
        return cafeOrderRepository.findById(id);
    }

    public List<CafeOrder> getOrdersByAccountId(Integer accountId) {
        return cafeOrderRepository.findByAccount_IdAccount(accountId);
    }

    public List<CafeOrder> getOrdersByTableId(Integer tableId) {
        return cafeOrderRepository.findByTable_IdTable(tableId);
    }

    public List<CafeOrder> getOrdersInDateRange(Date startDate, Date endDate) {
        return cafeOrderRepository.findOrdersInDateRange(startDate, endDate);
    }

    @Transactional
    public CafeOrder createOrder(CafeOrder order) {
        // Nếu có payment thì mặc định paymentStatus là 'completed'
        // TRỪ KHI là MoMo payment (sẽ giữ nguyên pending)
        if (order.getPayment() != null) {
            String paymentMethod = order.getPayment().getPaymentMethod();
            // Chỉ set completed cho cash payment, MoMo giữ nguyên pending
            if (!"momo".equalsIgnoreCase(paymentMethod) && 
                !"transfer".equalsIgnoreCase(paymentMethod)) {
                order.getPayment().setPaymentStatus("completed");
            }
        }
        // Set order time to current time if not set
        if (order.getOrderTime() == null) {
            order.setOrderTime(new Date());
        }
        // Clear order details to avoid session conflicts
        if (order.getOrderDetails() != null) {
            order.setOrderDetails(new ArrayList<>());
        }
        CafeOrder savedOrder = cafeOrderRepository.save(order);

        // Cập nhật trạng thái bàn thành Occupied nếu có bàn
        if (savedOrder.getTable() != null) {
            Integer tableId = savedOrder.getTable().getIdTable();
            cafeTableRepository.updateTableStatus(tableId, "Occupied");
        }
        
        // KHÔNG tích điểm thưởng ngay khi tạo đơn
        // Điểm chỉ được cộng khi đơn hàng chuyển sang trạng thái 'completed'
        // (xem updateOrderStatus method)
        
        // Gửi thông báo đơn hàng mới qua WebSocket
        // CHỈ gửi nếu không phải pending (tức là đã thanh toán)
        if (!"pending".equalsIgnoreCase(savedOrder.getStatus())) {
            // Notify staff about new order (for staff order management screen)
            webSocketService.notifyStaffNewOrder(savedOrder);
            
            // Notify customer about their new order (for customer order list screen)
            // This allows customer to see their order immediately without refreshing
            webSocketService.notifyCustomerNewOrder(savedOrder);
        }

        return savedOrder;
    }

    @Transactional
    public CafeOrder updateOrder(Integer id, CafeOrder orderDetails) {
        Optional<CafeOrder> orderOpt = cafeOrderRepository.findById(id);
        if (orderOpt.isPresent()) {
            CafeOrder existingOrder = orderOpt.get();
            
            // Cập nhật trạng thái đơn hàng
            if (orderDetails.getStatus() != null) {
                existingOrder.setStatus(orderDetails.getStatus());
            }
            
            // Update fields that can be changed after order creation
            if (orderDetails.getTable() != null) {
                existingOrder.setTable(orderDetails.getTable());
            }
            
            if (orderDetails.getQuantity() != null) {
                existingOrder.setQuantity(orderDetails.getQuantity());
            }
            
            if (orderDetails.getTotalAmount() != null) {
                existingOrder.setTotalAmount(orderDetails.getTotalAmount());
            }
            
            if (orderDetails.getNote() != null) {
                existingOrder.setNote(orderDetails.getNote());
            }
            
            if (orderDetails.getPromotion() != null) {
                existingOrder.setPromotion(orderDetails.getPromotion());
            }
            
            return cafeOrderRepository.save(existingOrder);
        }
        return null;
    }

    @Transactional
    public void deleteOrder(Integer id) {
        cafeOrderRepository.deleteById(id);
    }

    @Transactional
    public CafeOrder setTableForOrder(CafeOrder order, Integer tableId) {
        Optional<CafeTable> tableOpt = cafeTableRepository.findById(tableId);
        if (tableOpt.isPresent()) {
            order.setTable(tableOpt.get());
        }
        return order;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean addOrderDetail(CafeOrder order, Integer productId, Integer quantity, BigDecimal unitPrice) {
        return addOrderDetailWithVariants(order, productId, quantity, unitPrice, null, null, null, null);
    }
    
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean addOrderDetailWithVariants(CafeOrder order, Integer productId, Integer quantity, 
                                             BigDecimal unitPrice, String size, String icePercent, 
                                             String sugarPercent, String toppings) {
        try {
            // Kiểm tra sản phẩm tồn tại
            Optional<Product> productOpt = productRepository.findById(productId);
            
            if (!productOpt.isPresent()) {
                System.out.println("DEBUG - Product not found: " + productId);
                return false;
            }
            
            Product product = productOpt.get();
            Integer orderId = order.getIdOrder();
            
            System.out.println("DEBUG - Adding OrderDetail: productId=" + productId + 
                              ", orderId=" + orderId + 
                              ", quantity=" + quantity +
                              ", size=" + size +
                              ", icePercent=" + icePercent +
                              ", sugarPercent=" + sugarPercent +
                              ", toppings=" + toppings);
            
            // Tạo OrderDetailId
            OrderDetailId orderDetailId = new OrderDetailId(productId, orderId);
            
            // Xoá OrderDetail cũ nếu đã tồn tại để tránh lỗi trùng khóa chính
            try {
                // Kiểm tra OrderDetail đã tồn tại chưa
                Optional<OrderDetail> existingDetail = orderDetailRepository.findById(orderDetailId);
                if (existingDetail.isPresent()) {
                    OrderDetail detail = existingDetail.get();
                    // Cập nhật thông tin
                    detail.setQuantity(quantity);
                    detail.setUnitPrice(unitPrice);
                    detail.setSize(size);
                    detail.setIcePercent(icePercent);
                    detail.setSugarPercent(sugarPercent);
                    detail.setToppings(toppings);
                    // Lưu OrderDetail
                    orderDetailRepository.save(detail);
                    System.out.println("DEBUG - Updated existing OrderDetail");
                    return true;
                }
            } catch (Exception e) {
                System.out.println("DEBUG - Error checking existing OrderDetail: " + e.getMessage());
            }
            
            // Tạo OrderDetail mới
            OrderDetail newDetail = new OrderDetail();
            newDetail.setId(orderDetailId);
            
            // Lấy lại đối tượng order từ database để tránh lỗi session
            CafeOrder refreshedOrder = cafeOrderRepository.findById(orderId).orElse(order);
            newDetail.setOrder(refreshedOrder);
            newDetail.setProduct(product);
            newDetail.setQuantity(quantity);
            newDetail.setUnitPrice(unitPrice);
            
            // Set variants
            newDetail.setSize(size != null && !size.isEmpty() ? size : "S");
            newDetail.setIcePercent(icePercent != null && !icePercent.isEmpty() ? icePercent : "100");
            newDetail.setSugarPercent(sugarPercent != null && !sugarPercent.isEmpty() ? sugarPercent : "100");
            newDetail.setToppings(toppings);
            
            // Lưu OrderDetail
            OrderDetail savedDetail = orderDetailRepository.save(newDetail);
            System.out.println("DEBUG - Created new OrderDetail with id: " + savedDetail.getId());
            
            return true;
        } catch (Exception e) {
            System.err.println("ERROR in addOrderDetailWithVariants: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    // Thêm phương thức mới để lấy đơn hàng theo trạng thái
    public List<CafeOrder> getOrdersByStatus(String status) {
        return cafeOrderRepository.findByStatus(status);
    }
    
    // Thêm phương thức mới để lấy đơn hàng gần đây
    public List<CafeOrder> getRecentOrders(int limit) {
        List<CafeOrder> orders = cafeOrderRepository.findTop10ByOrderByOrderTimeDesc();
        // Giới hạn kết quả theo tham số limit
        return orders.size() > limit ? orders.subList(0, limit) : orders;
    }
    
    // Thêm phương thức để cập nhật trạng thái đơn hàng
    @Transactional
    public CafeOrder updateOrderStatus(Integer orderId, String status) {
        Optional<CafeOrder> orderOpt = cafeOrderRepository.findById(orderId);
        if (orderOpt.isPresent()) {
            CafeOrder order = orderOpt.get();
            order.setStatus(status);
            
            CafeOrder updatedOrder = cafeOrderRepository.save(order);
            
            // Gửi thông báo cập nhật trạng thái đến customer
            webSocketService.notifyCustomerOrderUpdate(updatedOrder);
            
            // Gửi thông báo cập nhật trạng thái đến tất cả staff
            // Điều này cho phép các staff khác (đang xem trang đơn hàng) nhận được updates realtime
            webSocketService.notifyStaffOrderUpdate(updatedOrder);
            
            // Nếu đơn hàng hoàn thành, gửi thông báo đặc biệt và CỘNG ĐIỂM THƯỞNG
            if ("COMPLETED".equalsIgnoreCase(status)) {
                webSocketService.notifyCustomerOrderCompleted(updatedOrder);
                
                // Tích điểm thưởng khi đơn hàng hoàn thành
                if (updatedOrder.getAccount() != null && updatedOrder.getTotalAmount() != null) {
                    addRewardPointsForOrder(updatedOrder);
                }
            }
            
            return updatedOrder;
        }
        return null;
    }

    @Transactional
    public CafeOrder updatePaymentInfo(Integer orderId, String paymentMethod, String paymentStatus) {
        Optional<CafeOrder> orderOpt = cafeOrderRepository.findById(orderId);
        if (!orderOpt.isPresent()) {
            return null;
        }
        
        CafeOrder order = orderOpt.get();
        
        // Luôn đặt trạng thái thanh toán là 'completed' khi xác nhận thanh toán
        String finalPaymentStatus = "completed";
        
        // Kiểm tra xem đơn hàng đã có payment chưa
        if (order.getPayment() == null) {
            // Tạo mới payment
            Payment payment = new Payment();
            payment.setOrder(order);
            payment.setPaymentMethod(paymentMethod);
            payment.setPaymentStatus(finalPaymentStatus);
            payment.setCreateAt(new Date());
            // Lưu payment vào order
            order.setPayment(payment);
        } else {
            // Cập nhật payment hiện có
            Payment payment = order.getPayment();
            payment.setPaymentMethod(paymentMethod);
            payment.setPaymentStatus(finalPaymentStatus);
            // Không cập nhật createAt vì đã có
        }
        
        
        return cafeOrderRepository.save(order);
    }

    // Add method to get today's orders
    public Map<String, Object> getTodayOrders() {
        Map<String, Object> result = new HashMap<>();
        try {
            // Get today's date
            LocalDateTime startOfDay = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0);
            LocalDateTime endOfDay = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);

            // Get orders for today
            List<CafeOrder> todayOrders = cafeOrderRepository.findByOrderTimeBetween(
                Date.from(startOfDay.atZone(ZoneId.systemDefault()).toInstant()),
                Date.from(endOfDay.atZone(ZoneId.systemDefault()).toInstant())
            );

            // Calculate statistics
            BigDecimal cashRevenue = BigDecimal.ZERO;
            BigDecimal transferRevenue = BigDecimal.ZERO;

            for (CafeOrder order : todayOrders) {
                if (order.getPayment() != null) {
                    BigDecimal amount = order.getTotalAmount();
                    if ("cash".equalsIgnoreCase(order.getPayment().getPaymentMethod())) {
                        cashRevenue = cashRevenue.add(amount);
                    } else if ("transfer".equalsIgnoreCase(order.getPayment().getPaymentMethod())) {
                        transferRevenue = transferRevenue.add(amount);
                    }
                }
            }

            // Populate result
            result.put("totalOrders", todayOrders.size());
            result.put("cashRevenue", cashRevenue);
            result.put("transferRevenue", transferRevenue);
            result.put("orders", todayOrders);

        } catch (Exception e) {
            e.printStackTrace();
            result.put("error", "Error fetching today's orders: " + e.getMessage());
        }

        return result;
    }

    /**
     * Tích điểm thưởng cho khách hàng dựa trên giá trị đơn hàng
     * Quy đổi: 1 điểm cho mỗi 10,000 VND
     * CHỈ tích điểm cho CUSTOMER, KHÔNG tích cho STAFF
     */
    private void addRewardPointsForOrder(CafeOrder order) {
        if (order.getAccount() == null || order.getTotalAmount() == null) {
            return;
        }
        
        // Kiểm tra role: CHỈ tích điểm cho CUSTOMER
        String role = order.getAccount().getRole();
        if (role == null || role.startsWith("STAFF_")) {
            return; // Không tích điểm cho staff
        }
        
        // Lấy ID tài khoản
        Integer accountId = order.getAccount().getIdAccount();
        
        // Tính số điểm thưởng: 1 điểm cho mỗi 10,000 VND
        BigDecimal amount = order.getTotalAmount();
        BigDecimal pointsPerUnit = new BigDecimal("10000");
        Integer points = amount.divide(pointsPerUnit, 0, RoundingMode.DOWN).intValue();
        
        if (points > 0) {
            // Gọi service để thêm điểm thưởng
            accountService.addRewardPoints(accountId, points);
        }
    }
} 
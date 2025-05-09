package com.t2kcoffee.service;

import com.t2kcoffee.model.CafeOrder;
import com.t2kcoffee.model.CafeTable;
import com.t2kcoffee.model.OrderDetail;
import com.t2kcoffee.model.OrderDetailId;
import com.t2kcoffee.model.Product;
import com.t2kcoffee.model.Payment;
import com.t2kcoffee.repository.CafeOrderRepository;
import com.t2kcoffee.repository.CafeTableRepository;
import com.t2kcoffee.repository.OrderDetailRepository;
import com.t2kcoffee.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.ArrayList;

@Service
public class CafeOrderService {

    private final CafeOrderRepository cafeOrderRepository;
    private final CafeTableRepository cafeTableRepository;
    private final ProductRepository productRepository;
    private final OrderDetailRepository orderDetailRepository;

    @Autowired
    public CafeOrderService(CafeOrderRepository cafeOrderRepository, 
                           CafeTableRepository cafeTableRepository,
                           ProductRepository productRepository,
                           OrderDetailRepository orderDetailRepository) {
        this.cafeOrderRepository = cafeOrderRepository;
        this.cafeTableRepository = cafeTableRepository;
        this.productRepository = productRepository;
        this.orderDetailRepository = orderDetailRepository;
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
        if (order.getPayment() != null) {
            order.getPayment().setPaymentStatus("completed");
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
                              ", quantity=" + quantity);
            
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
            
            // Lưu OrderDetail
            OrderDetail savedDetail = orderDetailRepository.save(newDetail);
            System.out.println("DEBUG - Created new OrderDetail with id: " + savedDetail.getId());
            
            return true;
        } catch (Exception e) {
            System.err.println("ERROR in addOrderDetail: " + e.getMessage());
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
    public CafeOrder updateOrderStatus(Integer id, String status) {
        Optional<CafeOrder> orderOpt = cafeOrderRepository.findById(id);
        if(orderOpt.isPresent()) {
            CafeOrder order = orderOpt.get();
            order.setStatus(status);

            // Nếu hủy đơn và có bàn, trả bàn về trạng thái Available
            if (order.getTable() != null && 
                ("cancelled".equalsIgnoreCase(status) || "canceled".equalsIgnoreCase(status))) {
                CafeTable table = order.getTable();
                table.setStatus("Available");
                cafeTableRepository.save(table);
            }

            return cafeOrderRepository.save(order);
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
        
        // Không cập nhật trạng thái bàn ở đây nữa
        
        // Lưu đơn hàng với thông tin thanh toán mới
        return cafeOrderRepository.save(order);
    }
} 
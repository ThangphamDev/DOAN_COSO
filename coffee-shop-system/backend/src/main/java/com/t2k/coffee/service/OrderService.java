package com.t2k.coffee.service;

import com.t2k.coffee.entity.*;
import com.t2k.coffee.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class OrderService {
    @Autowired
    private CafeOrderRepository orderRepository;
    
    @Autowired
    private OrderDetailRepository orderDetailRepository;
    
    @Autowired
    private CafeTableRepository tableRepository;
    
    @Autowired
    private ProductRepository productRepository;

    public List<CafeOrder> getAllOrders() {
        return orderRepository.findAll();
    }

    public Optional<CafeOrder> getOrderById(Integer id) {
        return orderRepository.findById(id);
    }

    public List<CafeOrder> getOrdersByStatus(String status) {
        return orderRepository.findByStatus(status);
    }

    public List<CafeOrder> getOrdersByTable(Integer tableId) {
        return orderRepository.findByTableId(tableId);
    }

    public List<CafeOrder> getOrdersByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return orderRepository.findByOrderTimeBetween(startDate, endDate);
    }

    @Transactional
    public CafeOrder createOrder(CafeOrder order) {
        // Set initial values
        order.setOrderTime(LocalDateTime.now());
        order.setStatus("processing");
        
        // Calculate total amount
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (OrderDetail detail : order.getOrderDetails()) {
            Product product = productRepository.findById(detail.getProduct().getId())
                .orElseThrow(() -> new RuntimeException("Product not found"));
            
            BigDecimal unitPrice = BigDecimal.valueOf(product.getPrice());
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(detail.getQuantity()));
            
            if (detail.getAdditionalPrice() != null) {
                subtotal = subtotal.add(detail.getAdditionalPrice());
            }
            
            detail.setUnitPrice(unitPrice);
            detail.setSubtotal(subtotal);
            totalAmount = totalAmount.add(subtotal);
        }
        order.setTotalAmount(totalAmount);
        
        // Update table status if table is selected
        if (order.getTable() != null) {
            CafeTable table = tableRepository.findById(order.getTable().getId())
                .orElseThrow(() -> new RuntimeException("Table not found"));
            table.setStatus("Occupied");
            tableRepository.save(table);
        }
        
        // Save order and details
        CafeOrder savedOrder = orderRepository.save(order);
        for (OrderDetail detail : order.getOrderDetails()) {
            detail.setOrder(savedOrder);
            orderDetailRepository.save(detail);
        }
        
        return savedOrder;
    }

    @Transactional
    public CafeOrder updateOrderStatus(Integer id, String status) {
        CafeOrder order = orderRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Order not found"));
        
        order.setStatus(status);
        
        // If order is completed or cancelled, free up the table
        if (status.equals("completed") || status.equals("cancelled")) {
            if (order.getTable() != null) {
                CafeTable table = order.getTable();
                table.setStatus("Available");
                tableRepository.save(table);
            }
        }
        
        return orderRepository.save(order);
    }

    public void deleteOrder(Integer id) {
        orderRepository.deleteById(id);
    }
} 
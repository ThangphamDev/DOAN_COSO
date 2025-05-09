package com.t2kcoffee.service;

import com.t2kcoffee.model.OrderVariant;
import com.t2kcoffee.model.OrderDetail;
import com.t2kcoffee.repository.OrderVariantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class OrderVariantService {

    private final OrderVariantRepository orderVariantRepository;

    @Autowired
    public OrderVariantService(OrderVariantRepository orderVariantRepository) {
        this.orderVariantRepository = orderVariantRepository;
    }

    /**
     * Lấy tất cả biến thể đơn hàng
     */
    public List<OrderVariant> getAllOrderVariants() {
        return orderVariantRepository.findAll();
    }

    /**
     * Lấy biến thể đơn hàng theo ID
     */
    public Optional<OrderVariant> getOrderVariantById(Integer id) {
        return orderVariantRepository.findById(id);
    }

    /**
     * Lấy biến thể đơn hàng theo ID đơn hàng
     */
    public List<OrderVariant> getOrderVariantsByOrderId(Integer orderId) {
        return orderVariantRepository.findByOrderDetailIdOrder(orderId);
    }

    /**
     * Lấy biến thể đơn hàng theo ID đơn hàng và ID sản phẩm
     */
    public Optional<OrderVariant> getOrderVariantByOrderAndProduct(Integer orderId, Integer productId) {
        return orderVariantRepository.findByOrderDetailIdOrderAndOrderDetailIdProduct(orderId, productId);
    }

    /**
     * Lưu biến thể đơn hàng mới
     */
    public OrderVariant saveOrderVariant(OrderVariant orderVariant) {
        return orderVariantRepository.save(orderVariant);
    }

    /**
     * Lưu biến thể đơn hàng từ thông tin chi tiết đơn hàng và dữ liệu biến thể
     */
    public OrderVariant saveOrderVariantFromDetails(OrderDetail orderDetail, String size, Integer icePercent, 
                                                 Integer sugarPercent, String toppings, Double additionalPrice) {
        OrderVariant orderVariant = new OrderVariant();
        orderVariant.setOrderDetail(orderDetail);
        orderVariant.setSize(size);
        orderVariant.setIcePercent(icePercent);
        orderVariant.setSugarPercent(sugarPercent);
        orderVariant.setToppings(toppings);
        orderVariant.setAdditionalPrice(additionalPrice);
        
        return orderVariantRepository.save(orderVariant);
    }

    /**
     * Xóa biến thể đơn hàng theo ID
     */
    public void deleteOrderVariant(Integer id) {
        orderVariantRepository.deleteById(id);
    }

    /**
     * Xóa tất cả biến thể đơn hàng theo ID đơn hàng
     */
    public void deleteOrderVariantsByOrderId(Integer orderId) {
        List<OrderVariant> orderVariants = orderVariantRepository.findByOrderDetailIdOrder(orderId);
        orderVariantRepository.deleteAll(orderVariants);
    }
} 
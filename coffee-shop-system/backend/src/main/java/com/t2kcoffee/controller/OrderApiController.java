package com.t2kcoffee.controller;

import com.t2kcoffee.model.Account;
import com.t2kcoffee.model.CafeOrder;
import com.t2kcoffee.repository.AccountRepository;
import com.t2kcoffee.repository.CafeOrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/orders")
public class OrderApiController {

    @Autowired
    private CafeOrderRepository cafeOrderRepository;

    @Autowired
    private AccountRepository accountRepository;

    // API để lấy thông tin khách hàng đã đặt hàng
    @GetMapping("/customers")
    public ResponseEntity<List<Account>> getCustomersWithOrders() {
        // Lấy tất cả đơn hàng
        List<CafeOrder> orders = cafeOrderRepository.findAll();

        // Lấy danh sách khách hàng từ các đơn hàng (loại bỏ trùng lặp)
        List<Account> customers = orders.stream()
                .map(CafeOrder::getAccount)
                .distinct()
                .collect(Collectors.toList());

        return ResponseEntity.ok(customers);
    }

    // API để lấy thông tin khách hàng đã đặt hàng theo accountId
    @GetMapping("/customer/{accountId}")
    public ResponseEntity<Account> getCustomerByOrder(@PathVariable Integer accountId) {
        // Kiểm tra xem khách hàng có tồn tại không
        return accountRepository.findById(accountId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
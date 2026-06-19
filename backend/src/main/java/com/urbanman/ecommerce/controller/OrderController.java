package com.urbanman.ecommerce.controller;

import com.urbanman.ecommerce.model.Order;
import com.urbanman.ecommerce.service.EmailService;
import com.urbanman.ecommerce.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/order")
public class OrderController {

    @Autowired private OrderService orderService;
    @Autowired private EmailService emailService;

    @PostMapping("/place")
    public ResponseEntity<Order> placeOrder(@RequestBody Order order) {
        Order saved = orderService.placeOrder(order);
        // Send confirmation email
        String email = saved.getEmail();
        String customerName = saved.getCustomerName();
        if (email != null && !email.isEmpty()) {
            String name = customerName != null ? customerName : "Customer";
            String otp = String.valueOf((int)(100000 + Math.random() * 900000));
            emailService.sendOrderConfirmation(
                email != null ? email : "",
                name != null ? name : "",
                "ORD-" + (saved.getOrderId() != null ? saved.getOrderId() : ""),
                saved.getTotalAmount() != null ? saved.getTotalAmount() : 0,
                otp != null ? otp : ""
            );
        }
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{userId}")
    public List<Order> getOrdersByUser(@PathVariable Long userId) {
        return orderService.getOrdersByUser(userId);
    }

    @GetMapping("/status/{status}")
    public List<Order> getOrdersByStatus(@PathVariable String status) {
        return orderService.getOrdersByStatus(status);
    }

    @PutMapping("/{orderId}/status")
    public ResponseEntity<Order> updateOrderStatus(@PathVariable @NonNull Long orderId,
                                                   @RequestParam String status) {
        Order updated = orderService.updateOrderStatus(orderId, status);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/all")
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }
}

package com.urbanman.ecommerce.controller;

import com.urbanman.ecommerce.model.Order;
import com.urbanman.ecommerce.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/order")
public class OrderController {
    @Autowired private OrderService orderService;

    @PostMapping("/place")
    public ResponseEntity<Order> placeOrder(@RequestBody Order order) {
        Order saved = orderService.placeOrder(order);
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
    public ResponseEntity<Order> updateOrderStatus(@PathVariable Long orderId, 
                                                   @RequestParam String status) {
        Order updated = orderService.updateOrderStatus(orderId, status);
        return ResponseEntity.ok(updated);
    }
}

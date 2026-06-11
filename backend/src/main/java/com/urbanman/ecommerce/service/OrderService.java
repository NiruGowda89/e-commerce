package com.urbanman.ecommerce.service;

import com.urbanman.ecommerce.model.Order;
import com.urbanman.ecommerce.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class OrderService {

    @Autowired private OrderRepository orderRepo;

    public Order placeOrder(Order order) {
        order.setOrderDate(LocalDateTime.now());
        order.setStatus("Pending");
        return orderRepo.save(order);
    }

    public List<Order> getOrdersByUser(Long userId) {
        return orderRepo.findAll().stream()
            .filter(o -> o.getUser() != null && o.getUser().getUserId().equals(userId))
            .toList();
    }

    public List<Order> getOrdersByStatus(String status) {
        return orderRepo.findByStatus(status);
    }

    public Order updateOrderStatus(Long orderId, String status) {
        Order order = orderRepo.findById(orderId).orElseThrow();
        order.setStatus(status);
        return orderRepo.save(order);
    }

    public List<Order> getAllOrders() {
        return orderRepo.findAll();
    }
}

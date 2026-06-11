package com.urbanman.ecommerce.repository;

import com.urbanman.ecommerce.model.Cart;
import com.urbanman.ecommerce.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CartRepository extends JpaRepository<Cart, Long> {
    List<Cart> findByUser(User user);
    void deleteByUser(User user);
}

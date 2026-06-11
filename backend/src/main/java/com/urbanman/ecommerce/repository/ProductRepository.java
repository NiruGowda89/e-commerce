package com.urbanman.ecommerce.repository;

import com.urbanman.ecommerce.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategory(String category);
    List<Product> findBySizeAndColor(String size, String color);
}

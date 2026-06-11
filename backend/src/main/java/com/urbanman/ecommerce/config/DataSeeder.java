package com.urbanman.ecommerce.config;

import com.urbanman.ecommerce.model.Product;
import com.urbanman.ecommerce.repository.ProductRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedProducts(ProductRepository repo) {
        return args -> {
            if (repo.count() == 0) {
                repo.save(make("Classic Shirt",        "Shirts",         "Urban Man", 999.0,  "M",  "Blue",  50, "images/shirt.jpg",  "Premium cotton shirt for formal wear."));
                repo.save(make("Casual T-Shirt",       "T-Shirts",       "Urban Man", 499.0,  "L",  "Black", 75, "images/tshirt.jpg", "Comfortable everyday casual t-shirt."));
                repo.save(make("Premium Linen Shirt",  "New Collection", "Urban Man", 1299.0, "M",  "White", 30, "images/linen.jpg",  "Luxury breathable linen shirt."));
                repo.save(make("Slim Fit Jeans",       "Jeans",          "Urban Man", 1499.0, "L",  "Blue",  60, "images/jeans.jpg",  "Modern slim-fit denim jeans."));
            }
        };
    }

    private Product make(String name, String cat, String brand,
                         Double price, String size, String color,
                         Integer stock, String img, String desc) {
        Product p = new Product();
        p.setProductName(name);
        p.setCategory(cat);
        p.setBrand(brand);
        p.setPrice(price);
        p.setSize(size);
        p.setColor(color);
        p.setStock(stock);
        p.setImageUrl(img);
        p.setDescription(desc);
        return p;
    }
}

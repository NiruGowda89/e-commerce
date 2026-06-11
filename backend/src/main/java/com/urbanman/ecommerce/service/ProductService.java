package com.urbanman.ecommerce.service;

import com.urbanman.ecommerce.model.Product;
import com.urbanman.ecommerce.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ProductService {

    @Autowired private ProductRepository productRepo;

    public List<Product> getAllProducts()                        { return productRepo.findAll(); }
    public Product getProductById(Long id)                      { return productRepo.findById(id).orElse(null); }
    public List<Product> filterProducts(String size, String color) { return productRepo.findBySizeAndColor(size, color); }
    public Product saveProduct(Product product)                 { return productRepo.save(product); }
    public void deleteProduct(Long id)                          { productRepo.deleteById(id); }
}

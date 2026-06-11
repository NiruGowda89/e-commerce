package com.urbanman.ecommerce.service;

import com.urbanman.ecommerce.model.Cart;
import com.urbanman.ecommerce.model.Product;
import com.urbanman.ecommerce.model.User;
import com.urbanman.ecommerce.repository.CartRepository;
import com.urbanman.ecommerce.repository.ProductRepository;
import com.urbanman.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CartService {

    @Autowired private CartRepository cartRepo;
    @Autowired private UserRepository userRepo;
    @Autowired private ProductRepository productRepo;

    public Cart addToCart(Long userId, Long productId, int qty) {
        User user       = userRepo.findById(userId).orElseThrow();
        Product product = productRepo.findById(productId).orElseThrow();
        Cart cart       = new Cart();
        cart.setUser(user);
        cart.setProduct(product);
        cart.setQuantity(qty);
        return cartRepo.save(cart);
    }

    public List<Cart> getCartByUser(Long userId) {
        User user = userRepo.findById(userId).orElseThrow();
        return cartRepo.findByUser(user);
    }

    public void removeFromCart(Long cartId) { cartRepo.deleteById(cartId); }
}

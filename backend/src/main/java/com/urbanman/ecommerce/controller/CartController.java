package com.urbanman.ecommerce.controller;

import com.urbanman.ecommerce.model.Cart;
import com.urbanman.ecommerce.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired private CartService cartService;

    @PostMapping("/add")
    public ResponseEntity<Cart> addToCart(@RequestParam @NonNull Long userId,
                                          @RequestParam @NonNull Long productId,
                                          @RequestParam int qty) {
        return ResponseEntity.ok(cartService.addToCart(userId, productId, qty));
    }

    @GetMapping("/{userId}")
    public List<Cart> getCart(@PathVariable @NonNull Long userId) {
        return cartService.getCartByUser(userId);
    }

    @DeleteMapping("/remove/{cartId}")
    public ResponseEntity<String> remove(@PathVariable @NonNull Long cartId) {
        cartService.removeFromCart(cartId);
        return ResponseEntity.ok("Item removed");
    }
}

package com.urbanman.ecommerce.controller;

import com.urbanman.ecommerce.model.Coupon;
import com.urbanman.ecommerce.repository.CouponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/coupons")
public class CouponController {

    @Autowired private CouponRepository couponRepo;

    // Validate a coupon code
    @PostMapping("/validate")
    public ResponseEntity<?> validate(@RequestBody Map<String, Object> body) {
        String code        = body.get("code").toString().toUpperCase();
        Double orderAmount = Double.valueOf(body.get("orderAmount").toString());

        return couponRepo.findByCodeAndActiveTrue(code).map(coupon -> {
            if (coupon.getMinOrderAmount() != null && orderAmount < coupon.getMinOrderAmount()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Minimum order amount is ₹" + coupon.getMinOrderAmount()));
            }
            double discount = 0;
            if (coupon.getDiscountPercent() != null) {
                discount = orderAmount * coupon.getDiscountPercent() / 100;
            } else if (coupon.getDiscountAmount() != null) {
                discount = coupon.getDiscountAmount();
            }
            discount = Math.min(discount, orderAmount); // can't exceed order total
            Map<String, Object> result = new HashMap<>();
            result.put("valid", true);
            result.put("discount", Math.round(discount * 100.0) / 100.0);
            result.put("coupon", coupon);
            return ResponseEntity.ok(result);
        }).orElse(ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired coupon")));
    }

    // Admin: create coupon
    @PostMapping
    public ResponseEntity<Coupon> create(@RequestBody Coupon coupon) {
        coupon.setCode(coupon.getCode().toUpperCase());
        return ResponseEntity.ok(couponRepo.save(coupon));
    }

    // Admin: list all coupons
    @GetMapping
    public List<Coupon> getAllCoupons() {
        return couponRepo.findAll();
    }

    // Admin: delete coupon
    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        couponRepo.deleteById(id);
        return ResponseEntity.ok("Coupon deleted");
    }
}

package com.urbanman.ecommerce.controller;

import com.urbanman.ecommerce.model.Product;
import com.urbanman.ecommerce.model.Review;
import com.urbanman.ecommerce.model.User;
import com.urbanman.ecommerce.repository.ReviewRepository;
import com.urbanman.ecommerce.service.ProductService;
import com.urbanman.ecommerce.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired private ReviewRepository reviewRepo;
    @Autowired private ProductService productService;
    @Autowired private UserService userService;

    // Get all reviews for a product with average rating
    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getProductReviews(@PathVariable Long productId) {
        List<Review> reviews = reviewRepo.findByProductProductId(productId);
        Double avg = reviewRepo.avgRatingByProduct(productId);
        Map<String, Object> result = new HashMap<>();
        result.put("reviews", reviews);
        result.put("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0);
        result.put("totalReviews", reviews.size());
        return ResponseEntity.ok(result);
    }

    // Submit a review
    @PostMapping
    public ResponseEntity<?> addReview(@RequestBody Map<String, Object> body) {
        long productId = Long.parseLong(body.get("productId").toString());
        long userId    = Long.parseLong(body.get("userId").toString());
        Integer rating = Integer.valueOf(body.get("rating").toString());
        String comment = body.getOrDefault("comment", "").toString();

        if (rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().body("Rating must be between 1 and 5");
        }

        Product product = productService.getProductById(productId);
        User user       = userService.findById(userId);

        if (product == null || user == null) {
            return ResponseEntity.notFound().build();
        }

        // One review per user per product
        if (reviewRepo.existsByProductProductIdAndUserUserId(productId, userId)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("You have already reviewed this product");
        }

        Review review = new Review();
        review.setProduct(product);
        review.setUser(user);
        review.setUserName(user.getName());
        review.setRating(rating);
        review.setComment(comment);

        return ResponseEntity.ok(reviewRepo.save(review));
    }

    // Delete a review
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<String> deleteReview(@PathVariable @NonNull Long reviewId) {
        reviewRepo.deleteById(reviewId);
        return ResponseEntity.ok("Review deleted");
    }
}

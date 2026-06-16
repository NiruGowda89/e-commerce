package com.urbanman.ecommerce.controller;

import com.urbanman.ecommerce.model.User;
import com.urbanman.ecommerce.repository.UserRepository;
import com.urbanman.ecommerce.service.EmailService;
import com.urbanman.ecommerce.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired private UserService userService;
    @Autowired private UserRepository userRepo;
    @Autowired private EmailService emailService;

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User user) {
        return ResponseEntity.ok(userService.register(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User user) {
        User loggedIn = userService.login(user.getEmail(), user.getPassword());
        if (loggedIn != null) {
            return ResponseEntity.ok(loggedIn);
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        return userRepo.findByEmail(email).map(user -> {
            // Generate temp password
            String tempPass = "Reset@" + (int)(1000 + Math.random() * 9000);
            user.setPassword(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(tempPass));
            userRepo.save(user);
            // Send email
            emailService.sendPasswordReset(email, user.getName(), tempPass);
            return ResponseEntity.ok(Map.of("message", "Password reset email sent"));
        }).orElse(ResponseEntity.badRequest().body(Map.of("error", "No account found with this email")));
    }
}

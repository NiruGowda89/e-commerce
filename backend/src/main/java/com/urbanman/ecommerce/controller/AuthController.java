package com.urbanman.ecommerce.controller;

import com.urbanman.ecommerce.model.User;
import com.urbanman.ecommerce.repository.UserRepository;
import com.urbanman.ecommerce.service.EmailService;
import com.urbanman.ecommerce.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "https://e-commerce-1-ariz.onrender.com")
public class AuthController {

    private final UserService userService;
    private final UserRepository userRepo;
    private final EmailService emailService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Autowired
    public AuthController(UserService userService, UserRepository userRepo, EmailService emailService) {
        this.userService = userService;
        this.userRepo = userRepo;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (userRepo.findByEmail(user.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userRepo.save(user);
        return ResponseEntity.ok(Map.of(
                "message", "User registered successfully",
                "user", Map.of(
                        "id", savedUser.getUserId(),
                        "name", savedUser.getName(),
                        "email", savedUser.getEmail()
                )
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required"));
        }

        return userRepo.findByEmail(email)
                .filter(u -> passwordEncoder.matches(password, u.getPassword()))
                .map(u -> ResponseEntity.ok(Map.of(
                        "token", "sample-jwt-token",
                        "user", Map.of("id", u.getUserId(), "name", u.getName(), "email", u.getEmail())
                )))
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials")));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        return userRepo.findByEmail(email).map(user -> {
            String tempPass = "Reset@" + (int)(1000 + Math.random() * 9000);
            user.setPassword(passwordEncoder.encode(tempPass));
            userRepo.save(user);
            emailService.sendPasswordReset(email, user.getName(), tempPass);
            return ResponseEntity.ok(Map.of("message", "Password reset email sent"));
        }).orElse(ResponseEntity.badRequest().body(Map.of("error", "No account found with this email")));
    }
}

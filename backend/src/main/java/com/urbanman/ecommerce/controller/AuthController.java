package com.urbanman.ecommerce.controller;

import com.urbanman.ecommerce.model.User;
import com.urbanman.ecommerce.repository.UserRepository;
import com.urbanman.ecommerce.config.JwtUtil;
import com.urbanman.ecommerce.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
        "https://e-commerce-1-ariz.onrender.com",
        "https://e-commerce-two-rouge-62.vercel.app",
        "https://e-commerce-1ttw.vercel.app"
})
public class AuthController {

    private final UserRepository userRepo;
    private final EmailService emailService;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Autowired
    public AuthController(UserRepository userRepo, EmailService emailService, JwtUtil jwtUtil) {
        this.userRepo = userRepo;
        this.emailService = emailService;
        this.jwtUtil = jwtUtil;
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
                .map(u -> {
                    String token = jwtUtil.generateToken(u.getEmail(), u.getRole().name());
                    return ResponseEntity.ok(Map.of(
                        "token", token,
                        "user", Map.of("id", u.getUserId(), "name", u.getName(), "email", u.getEmail(), "role", u.getRole().name())
                    ));
                })
                .orElse(ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid credentials")));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        return userRepo.findByEmail(email).map(user -> {
            String tempPass = "Reset@" + (int)(1000 + Math.random() * 9000);
            user.setPassword(passwordEncoder.encode(tempPass));
            userRepo.save(user);
            emailService.sendPasswordReset(email, user.getName() != null ? user.getName() : "Customer", tempPass);
            return ResponseEntity.ok(Map.of("message", "Password reset email sent"));
        }).orElse(ResponseEntity.badRequest().body(Map.of("error", "No account found with this email")));
    }
}

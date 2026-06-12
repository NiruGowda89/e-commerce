package com.urbanman.ecommerce.service;

import com.urbanman.ecommerce.model.User;
import com.urbanman.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired private UserRepository userRepo;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public User register(User user) {
        // Hash password before saving
        user.setPassword(encoder.encode(user.getPassword()));
        return userRepo.save(user);
    }

    public User findById(Long id) {
        return userRepo.findById(id).orElse(null);
    }

    public User login(String email, String rawPassword) {
        return userRepo.findByEmail(email)
                .filter(u -> encoder.matches(rawPassword, u.getPassword()))
                .orElse(null);
    }
}

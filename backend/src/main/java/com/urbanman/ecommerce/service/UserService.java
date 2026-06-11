package com.urbanman.ecommerce.service;

import com.urbanman.ecommerce.model.User;
import com.urbanman.ecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    @Autowired private UserRepository userRepo;

    public User register(User user)                             { return userRepo.save(user); }
    public User findById(Long id)                               { return userRepo.findById(id).orElse(null); }
    public User login(String email, String password) {
        return userRepo.findByEmail(email)
                .filter(u -> u.getPassword().equals(password))
                .orElse(null);
    }
}

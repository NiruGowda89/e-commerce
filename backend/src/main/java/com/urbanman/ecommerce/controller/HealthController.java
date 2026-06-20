package com.urbanman.ecommerce.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@CrossOrigin(origins = "*")
public class HealthController {

    @GetMapping("/")
    public String home() {
        return "Backend Running";
    }

    @GetMapping("/health")
    public String health() {
        return "OK";
    }
}

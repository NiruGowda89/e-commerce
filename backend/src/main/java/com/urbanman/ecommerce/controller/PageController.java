package com.urbanman.ecommerce.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping("/")
    public String index() {
        return "forward:/index.html";
    }

    @GetMapping("/shop")
    public String shop() {
        return "forward:/shop.html";
    }

    @GetMapping("/cart")
    public String cart() {
        return "forward:/cart.html";
    }

    @GetMapping("/checkout")
    public String checkout() {
        return "forward:/checkout.html";
    }

    @GetMapping("/account")
    public String account() {
        return "forward:/account.html";
    }

    @GetMapping("/login")
    public String login() {
        return "forward:/login.html";
    }

    @GetMapping("/admin")
    public String admin() {
        return "forward:/admin.html";
    }

    @GetMapping("/super-admin")
    public String superAdmin() {
        return "forward:/super-admin.html";
    }

    @GetMapping("/new-arrivals")
    public String newArrivals() {
        return "forward:/new-arrivals.html";
    }

    @GetMapping("/offers")
    public String offers() {
        return "forward:/offers.html";
    }

    @GetMapping("/delivery")
    public String delivery() {
        return "forward:/delivery.html";
    }

    @GetMapping("/favourites")
    public String favourites() {
        return "forward:/favourites.html";
    }

    @GetMapping("/orders")
    public String orders() {
        return "forward:/orders.html";
    }

    @GetMapping("/product")
    public String product() {
        return "forward:/product.html";
    }
}

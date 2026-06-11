package com.urbanman.ecommerce.model;

import jakarta.persistence.*;

@Entity
@Table(name = "cart")
public class Cart {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cartId;

    @ManyToOne @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne @JoinColumn(name = "product_id")
    private Product product;

    private Integer quantity;

    public Long getCartId()                  { return cartId; }
    public void setCartId(Long cartId)       { this.cartId = cartId; }

    public User getUser()                    { return user; }
    public void setUser(User user)           { this.user = user; }

    public Product getProduct()              { return product; }
    public void setProduct(Product product)  { this.product = product; }

    public Integer getQuantity()             { return quantity; }
    public void setQuantity(Integer qty)     { this.quantity = qty; }
}

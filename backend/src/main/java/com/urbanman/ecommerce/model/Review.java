package com.urbanman.ecommerce.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
public class Review {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reviewId;

    @ManyToOne @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String userName;     // snapshot at review time

    @Column(nullable = false)
    private Integer rating;      // 1 to 5

    @Column(length = 1000)
    private String comment;

    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters & Setters
    public Long getReviewId()                       { return reviewId; }
    public void setReviewId(Long id)                { this.reviewId = id; }

    public Product getProduct()                     { return product; }
    public void setProduct(Product product)         { this.product = product; }

    public User getUser()                           { return user; }
    public void setUser(User user)                  { this.user = user; }

    public String getUserName()                     { return userName; }
    public void setUserName(String userName)        { this.userName = userName; }

    public Integer getRating()                      { return rating; }
    public void setRating(Integer rating)           { this.rating = rating; }

    public String getComment()                      { return comment; }
    public void setComment(String comment)          { this.comment = comment; }

    public LocalDateTime getCreatedAt()             { return createdAt; }
    public void setCreatedAt(LocalDateTime t)       { this.createdAt = t; }
}

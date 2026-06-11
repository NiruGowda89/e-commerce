package com.urbanman.ecommerce.model;

import jakarta.persistence.*;

@Entity
@Table(name = "products")
public class Product {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long productId;
    private String productName;
    private String category;
    private String brand;
    private Double price;
    private String size;
    private String color;
    private Integer stock;
    private String imageUrl;
    private String description;

    public Long getProductId()                  { return productId; }
    public void setProductId(Long productId)    { this.productId = productId; }

    public String getProductName()              { return productName; }
    public void setProductName(String n)        { this.productName = n; }

    public String getCategory()                 { return category; }
    public void setCategory(String c)           { this.category = c; }

    public String getBrand()                    { return brand; }
    public void setBrand(String b)              { this.brand = b; }

    public Double getPrice()                    { return price; }
    public void setPrice(Double p)              { this.price = p; }

    public String getSize()                     { return size; }
    public void setSize(String s)               { this.size = s; }

    public String getColor()                    { return color; }
    public void setColor(String c)              { this.color = c; }

    public Integer getStock()                   { return stock; }
    public void setStock(Integer s)             { this.stock = s; }

    public String getImageUrl()                 { return imageUrl; }
    public void setImageUrl(String u)           { this.imageUrl = u; }

    public String getDescription()              { return description; }
    public void setDescription(String d)        { this.description = d; }
}

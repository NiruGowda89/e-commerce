package com.urbanman.ecommerce.model;

import jakarta.persistence.*;

@Entity
@Table(name = "coupons")
public class Coupon {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long couponId;

    @Column(unique = true, nullable = false)
    private String code;

    private Double discountPercent;   // e.g. 10.0 = 10%
    private Double discountAmount;    // flat discount in rupees
    private Double minOrderAmount;    // minimum order to apply
    private Boolean active = true;

    // Getters & Setters
    public Long getCouponId()                           { return couponId; }
    public void setCouponId(Long id)                    { this.couponId = id; }

    public String getCode()                             { return code; }
    public void setCode(String code)                    { this.code = code; }

    public Double getDiscountPercent()                  { return discountPercent; }
    public void setDiscountPercent(Double d)            { this.discountPercent = d; }

    public Double getDiscountAmount()                   { return discountAmount; }
    public void setDiscountAmount(Double d)             { this.discountAmount = d; }

    public Double getMinOrderAmount()                   { return minOrderAmount; }
    public void setMinOrderAmount(Double m)             { this.minOrderAmount = m; }

    public Boolean getActive()                          { return active; }
    public void setActive(Boolean active)               { this.active = active; }
}

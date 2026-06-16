package com.urbanman.ecommerce.controller;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/payment")
public class PaymentController {

    @Value("${razorpay.key.id:}")
    private String keyId;

    @Value("${razorpay.key.secret:}")
    private String keySecret;

    // Create a Razorpay order
    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body) {
        if (keyId == null || keyId.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Razorpay not configured"));
        }
        try {
            double amount = Double.parseDouble(body.get("amount").toString());
            RazorpayClient client = new RazorpayClient(keyId, keySecret);

            JSONObject opts = new JSONObject();
            opts.put("amount", (int)(amount * 100)); // paise
            opts.put("currency", "INR");
            opts.put("receipt", "order_" + System.currentTimeMillis());

            Order rzpOrder = client.orders.create(opts);

            Map<String, Object> result = new HashMap<>();
            result.put("orderId",  rzpOrder.get("id"));
            result.put("amount",   rzpOrder.get("amount"));
            result.put("currency", rzpOrder.get("currency"));
            result.put("keyId",    keyId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Verify payment signature
    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> body) {
        try {
            String razorpayOrderId   = body.get("razorpay_order_id");
            String razorpayPaymentId = body.get("razorpay_payment_id");
            String razorpaySignature = body.get("razorpay_signature");

            String data = razorpayOrderId + "|" + razorpayPaymentId;
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(keySecret.getBytes(), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes());
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) hex.append(String.format("%02x", b));

            boolean valid = hex.toString().equals(razorpaySignature);
            return ResponseEntity.ok(Map.of("verified", valid));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }
}

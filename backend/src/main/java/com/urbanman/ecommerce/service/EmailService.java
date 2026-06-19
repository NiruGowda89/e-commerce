package com.urbanman.ecommerce.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendOrderConfirmation(@NonNull String toEmail, @NonNull String customerName,
                                       @NonNull String orderId, double total, @NonNull String otp) {
        if (mailSender == null) {
            System.out.println("Mail not configured — skipping email for order " + orderId);
            return;
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true);
            h.setTo(toEmail);
            h.setSubject("✅ Order Confirmed — " + orderId + " | Karunada Collection");
            h.setText(buildOrderEmail(customerName, orderId, total, otp), true);
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("Email send failed: " + e.getMessage());
        }
    }

    public void sendPasswordReset(@NonNull String toEmail, @NonNull String customerName, @NonNull String tempPassword) {
        if (mailSender == null) return;
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, true);
            h.setTo(toEmail);
            h.setSubject("🔑 Password Reset — Karunada Collection");
            h.setText(buildResetEmail(customerName, tempPassword), true);
            mailSender.send(msg);
        } catch (Exception e) {
            System.err.println("Email send failed: " + e.getMessage());
        }
    }

    private @NonNull String buildOrderEmail(String name, String orderId, double total, String otp) {
        return "<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;'>" +
            "<div style='background:#1a1a2e;padding:20px;text-align:center;'>" +
            "<h1 style='color:#ffc107;margin:0;'>🛍️ Karunada Collection</h1></div>" +
            "<div style='padding:30px;background:#fff;'>" +
            "<h2 style='color:#28a745;'>✅ Order Confirmed!</h2>" +
            "<p>Hi <strong>" + name + "</strong>,</p>" +
            "<p>Your order <strong>" + orderId + "</strong> has been confirmed.</p>" +
            "<table style='width:100%;border-collapse:collapse;margin:20px 0;'>" +
            "<tr style='background:#f8f9fa;'><td style='padding:10px;border:1px solid #dee2e6;'><strong>Order ID</strong></td>" +
            "<td style='padding:10px;border:1px solid #dee2e6;'>" + orderId + "</td></tr>" +
            "<tr><td style='padding:10px;border:1px solid #dee2e6;'><strong>Total Amount</strong></td>" +
            "<td style='padding:10px;border:1px solid #dee2e6;'>₹" + total + "</td></tr>" +
            "<tr style='background:#f8f9fa;'><td style='padding:10px;border:1px solid #dee2e6;'><strong>Delivery OTP</strong></td>" +
            "<td style='padding:10px;border:1px solid #dee2e6;font-size:1.4rem;letter-spacing:6px;color:#0c5460;'><strong>" + otp + "</strong></td></tr>" +
            "</table>" +
            "<p style='color:#666;'>Share this OTP with your delivery person to confirm delivery.</p>" +
            "<p>Thank you for shopping with us!</p>" +
            "</div>" +
            "<div style='background:#f8f9fa;padding:15px;text-align:center;color:#999;font-size:12px;'>" +
            "© 2026 Karunada Collection</div></div>";
    }

    private @NonNull String buildResetEmail(String name, String tempPassword) {
        return "<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;'>" +
            "<div style='background:#1a1a2e;padding:20px;text-align:center;'>" +
            "<h1 style='color:#ffc107;margin:0;'>🛍️ Karunada Collection</h1></div>" +
            "<div style='padding:30px;background:#fff;'>" +
            "<h2>🔑 Password Reset</h2>" +
            "<p>Hi <strong>" + name + "</strong>,</p>" +
            "<p>Your temporary password is:</p>" +
            "<div style='background:#f8f9fa;padding:15px;border-radius:8px;text-align:center;font-size:1.5rem;letter-spacing:4px;font-weight:bold;color:#1a1a2e;'>" +
            tempPassword + "</div>" +
            "<p style='margin-top:20px;color:#666;'>Please login and change your password immediately.</p>" +
            "</div>" +
            "<div style='background:#f8f9fa;padding:15px;text-align:center;color:#999;font-size:12px;'>" +
            "© 2026 Karunada Collection</div></div>";
    }
}

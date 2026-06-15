package com.cafe.pos.controller;

import com.cafe.pos.model.Payment;
import com.cafe.pos.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @GetMapping("/order/{orderId}")
    public List<Payment> getPaymentsForOrder(@PathVariable Long orderId) {
        return paymentService.getPaymentsForOrder(orderId);
    }

    @GetMapping("/order/{orderId}/balance")
    public Map<String, Object> getOrderBalanceDetails(@PathVariable Long orderId) {
        double paid = paymentService.getAmountPaidSoFar(orderId);
        double remaining = paymentService.getRemainingBalance(orderId);
        
        return Map.of(
                "amountPaid", paid,
                "remainingBalance", remaining
        );
    }

    @PostMapping("/order/{orderId}/pay-full")
    public ResponseEntity<Payment> processFullPayment(
            @PathVariable Long orderId,
            @RequestParam String method) {
        try {
            return ResponseEntity.ok(paymentService.processFullPayment(orderId, method));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/order/{orderId}/pay-partial")
    public ResponseEntity<Payment> processPartialPayment(
            @PathVariable Long orderId,
            @RequestBody Map<String, Object> body) {
        try {
            double amount = Double.parseDouble(body.get("amount").toString());
            String method = body.get("method").toString();
            return ResponseEntity.ok(paymentService.processPartialPayment(orderId, amount, method));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/order/{orderId}/pay-items")
    public ResponseEntity<Payment> processItemizedPayment(
            @PathVariable Long orderId,
            @RequestBody Map<String, Object> body) {
        try {
            String method = body.get("method").toString();
            
            // Cast itemPayments object to Map<Long, Integer>
            Map<String, Object> rawItemPayments = (Map<String, Object>) body.get("itemPayments");
            java.util.Map<Long, Integer> itemPayments = new java.util.HashMap<>();
            
            for (Map.Entry<String, Object> entry : rawItemPayments.entrySet()) {
                itemPayments.put(Long.parseLong(entry.getKey()), Integer.parseInt(entry.getValue().toString()));
            }

            return ResponseEntity.ok(paymentService.processItemizedPayment(orderId, itemPayments, method));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}

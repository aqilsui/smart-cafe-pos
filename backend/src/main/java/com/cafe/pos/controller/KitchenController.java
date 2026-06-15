package com.cafe.pos.controller;

import com.cafe.pos.model.OrderItem;
import com.cafe.pos.service.KitchenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kitchen")
@CrossOrigin(origins = "*")
public class KitchenController {

    @Autowired
    private KitchenService kitchenService;

    @GetMapping("/queue")
    public List<OrderItem> getKitchenQueue() {
        return kitchenService.getKitchenQueue();
    }

    @PutMapping("/items/{orderItemId}/status")
    public ResponseEntity<OrderItem> updateItemStatus(
            @PathVariable Long orderItemId,
            @RequestParam String status) {
        try {
            return ResponseEntity.ok(kitchenService.updateItemStatus(orderItemId, status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/metrics")
    public Map<String, Object> getKitchenMetrics() {
        return kitchenService.getKitchenMetrics();
    }
}

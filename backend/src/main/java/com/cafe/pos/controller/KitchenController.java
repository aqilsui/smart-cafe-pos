package com.cafe.pos.controller;

import com.cafe.pos.dto.KitchenQueueItemDTO;
import com.cafe.pos.model.OrderItem;
import com.cafe.pos.service.KitchenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/kitchen")
@CrossOrigin(origins = "*")
public class KitchenController {

    @Autowired
    private KitchenService kitchenService;

    @GetMapping("/queue")
    public List<KitchenQueueItemDTO> getKitchenQueue() {
        return kitchenService.getKitchenQueue()
                .stream()
                .map(KitchenQueueItemDTO::from)
                .collect(Collectors.toList());
    }

    @PutMapping("/items/{orderItemId}/status")
    public ResponseEntity<KitchenQueueItemDTO> updateItemStatus(
            @PathVariable Long orderItemId,
            @RequestParam String status) {
        try {
            OrderItem updated = kitchenService.updateItemStatus(orderItemId, status);
            return ResponseEntity.ok(KitchenQueueItemDTO.from(updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/metrics")
    public Map<String, Object> getKitchenMetrics() {
        return kitchenService.getKitchenMetrics();
    }
}

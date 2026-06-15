package com.cafe.pos.service;

import com.cafe.pos.model.Order;
import com.cafe.pos.model.OrderItem;
import com.cafe.pos.repository.OrderItemRepository;
import com.cafe.pos.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class KitchenService {

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    // Fetch active items in the kitchen queue
    public List<OrderItem> getKitchenQueue() {
        return orderItemRepository.findByStatusIn(List.of("PENDING", "COOKING"));
    }

    // Update individual item status (PENDING -> COOKING -> COMPLETED)
    public OrderItem updateItemStatus(Long orderItemId, String status) {
        OrderItem item = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new RuntimeException("OrderItem not found"));
        
        item.setStatus(status);
        OrderItem savedItem = orderItemRepository.save(item);

        // Check if all items in the parent order are cooked/cancelled
        Order order = item.getOrder();
        boolean allFinished = true;
        boolean hasCooking = false;
        
        for (OrderItem oi : order.getOrderItems()) {
            if (oi.getStatus().equals("PENDING") || oi.getStatus().equals("COOKING")) {
                allFinished = false;
            }
            if (oi.getStatus().equals("COOKING")) {
                hasCooking = true;
            }
        }

        if (allFinished) {
            order.setStatus("READY"); // Ready to serve
            orderRepository.save(order);
        } else if (hasCooking && order.getStatus().equals("PENDING")) {
            order.setStatus("PREPARING");
            orderRepository.save(order);
        }

        return savedItem;
    }

    // Get statistics on kitchen load to show if kitchen is falling behind
    public Map<String, Object> getKitchenMetrics() {
        List<OrderItem> activeItems = getKitchenQueue();
        int pending = 0;
        int cooking = 0;
        long totalWaitSeconds = 0;
        int count = 0;
        
        LocalDateTime now = LocalDateTime.now();
        for (OrderItem item : activeItems) {
            if (item.getStatus().equals("PENDING")) {
                pending++;
            } else if (item.getStatus().equals("COOKING")) {
                cooking++;
            }
            
            if (item.getCreatedAt() != null) {
                totalWaitSeconds += Duration.between(item.getCreatedAt(), now).getSeconds();
                count++;
            }
        }

        double avgWaitTimeMins = count > 0 ? (totalWaitSeconds / 60.0) / count : 0.0;
        // Bottleneck score based on size: 0 (clear) to 10 (overloaded)
        double bottleneckScore = Math.min(10.0, (pending + cooking * 0.5) / 2.0);
        boolean isFallingBehind = avgWaitTimeMins > 8.0 || activeItems.size() > 12;

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("pendingCount", pending);
        metrics.put("cookingCount", cooking);
        metrics.put("averageWaitMinutes", Math.round(avgWaitTimeMins * 10.0) / 10.0);
        metrics.put("bottleneckScore", Math.round(bottleneckScore * 10.0) / 10.0);
        metrics.put("isFallingBehind", isFallingBehind);
        
        return metrics;
    }
}

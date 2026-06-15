package com.cafe.pos.controller;

import com.cafe.pos.model.MenuItem;
import com.cafe.pos.model.Order;
import com.cafe.pos.repository.MenuItemRepository;
import com.cafe.pos.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private MenuItemRepository menuItemRepository;

    // Fetch active menu items catalog
    @GetMapping("/menu")
    public List<MenuItem> getMenu() {
        return menuItemRepository.findByActiveTrue();
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/active")
    public List<Order> getActiveOrders() {
        return orderService.getActiveOrders();
    }

    @GetMapping("/table/{tableId}/active")
    public ResponseEntity<Order> getActiveOrderByTableId(@PathVariable Long tableId) {
        return orderService.getActiveOrderByTableId(tableId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/table/{tableId}")
    public ResponseEntity<Order> createOrder(@PathVariable Long tableId) {
        try {
            return ResponseEntity.ok(orderService.createOrder(tableId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Mid-meal update: Add item to order
    @PostMapping("/{id}/items")
    public ResponseEntity<Order> addItemToOrder(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        try {
            Long menuItemId = Long.valueOf(body.get("menuItemId").toString());
            Integer quantity = Integer.valueOf(body.get("quantity").toString());
            String notes = body.containsKey("notes") && body.get("notes") != null ? body.get("notes").toString() : null;

            return ResponseEntity.ok(orderService.addItemToOrder(id, menuItemId, quantity, notes));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Mid-meal update: Modify quantity
    @PutMapping("/{id}/items/{orderItemId}")
    public ResponseEntity<Order> updateItemQuantity(
            @PathVariable Long id,
            @PathVariable Long orderItemId,
            @RequestParam Integer quantity) {
        try {
            return ResponseEntity.ok(orderService.updateItemQuantity(id, orderItemId, quantity));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // Mid-meal update: Cancel item
    @DeleteMapping("/{id}/items/{orderItemId}")
    public ResponseEntity<Order> cancelOrderItem(
            @PathVariable Long id,
            @PathVariable Long orderItemId) {
        try {
            return ResponseEntity.ok(orderService.cancelOrderItem(id, orderItemId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        try {
            return ResponseEntity.ok(orderService.updateOrderStatus(id, status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

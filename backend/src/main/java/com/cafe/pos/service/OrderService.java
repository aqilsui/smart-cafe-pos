package com.cafe.pos.service;

import com.cafe.pos.model.*;
import com.cafe.pos.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private TableRepository tableRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    public List<Order> getActiveOrders() {
        return orderRepository.findByStatusIn(List.of("PENDING", "PREPARING", "READY"));
    }

    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public Optional<Order> getActiveOrderByTableId(Long tableId) {
        return orderRepository.findActiveOrderByTableId(tableId);
    }

    public Order createOrder(Long tableId) {
        CafeTable table = tableRepository.findById(tableId)
                .orElseThrow(() -> new RuntimeException("Table not found"));
        
        // Check if there is already an active order
        Optional<Order> existing = orderRepository.findActiveOrderByTableId(tableId);
        if (existing.isPresent()) {
            return existing.get();
        }

        // Seating the table
        table.setStatus("OCCUPIED");
        tableRepository.save(table);

        Order order = new Order();
        order.setTable(table);
        order.setStatus("PENDING");
        order.setTotalAmount(0.0);
        order.setTax(0.0);
        order.setDiscount(0.0);
        order.setOrderItems(new ArrayList<>());

        return orderRepository.save(order);
    }

    // Mid-meal update: Add item(s) to order
    public Order addItemToOrder(Long orderId, Long menuItemId, Integer quantity, String notes) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        MenuItem menuItem = menuItemRepository.findById(menuItemId)
                .orElseThrow(() -> new RuntimeException("Menu item not found"));

        // Check if item already exists in PENDING state to combine them, else add new
        OrderItem existingItem = null;
        for (OrderItem item : order.getOrderItems()) {
            if (item.getMenuItem().getId().equals(menuItemId) && item.getStatus().equals("PENDING") && 
                ((notes == null && item.getNotes() == null) || (notes != null && notes.equals(item.getNotes())))) {
                existingItem = item;
                break;
            }
        }

        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + quantity);
        } else {
            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setMenuItem(menuItem);
            item.setQuantity(quantity);
            item.setNotes(notes);
            item.setStatus("PENDING");
            order.getOrderItems().add(item);
        }

        recalculateOrderTotals(order);
        
        // If order was ready or completed (though completed wouldn't be active), reset status to PENDING/PREPARING
        if (order.getStatus().equals("READY") || order.getStatus().equals("COMPLETED")) {
            order.setStatus("PREPARING");
        }

        return orderRepository.save(order);
    }

    // Mid-meal update: Cancel or edit quantity
    public Order updateItemQuantity(Long orderId, Long orderItemId, Integer newQuantity) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        OrderItem item = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new RuntimeException("Order item not found"));

        if (!item.getOrder().getId().equals(orderId)) {
            throw new RuntimeException("Item does not belong to this order");
        }

        if (newQuantity <= 0) {
            // Cancel item
            item.setStatus("CANCELLED");
        } else {
            // Can only modify quantity if not already completed
            if (item.getStatus().equals("COMPLETED")) {
                throw new RuntimeException("Cannot edit quantity of completed items");
            }
            item.setQuantity(newQuantity);
        }

        recalculateOrderTotals(order);
        return orderRepository.save(order);
    }

    public Order cancelOrderItem(Long orderId, Long orderItemId) {
        return updateItemQuantity(orderId, orderItemId, 0);
    }

    public Order updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        order.setStatus(status);
        
        // If completed or cancelled, make sure table is vacated (or set to paying first if completing)
        if (status.equals("COMPLETED") || status.equals("CANCELLED")) {
            CafeTable table = order.getTable();
            table.setStatus("VACANT");
            tableRepository.save(table);
        }
        
        return orderRepository.save(order);
    }

    public void recalculateOrderTotals(Order order) {
        double subtotal = 0.0;
        for (OrderItem item : order.getOrderItems()) {
            if (!item.getStatus().equals("CANCELLED")) {
                subtotal += item.getMenuItem().getPrice() * item.getQuantity();
            }
        }
        
        double taxRate = 0.06; // 6% service tax
        double tax = subtotal * taxRate;
        double total = subtotal + tax - order.getDiscount();
        
        order.setTax(Math.round(tax * 100.0) / 100.0);
        order.setTotalAmount(Math.round(total * 100.0) / 100.0);
    }
}

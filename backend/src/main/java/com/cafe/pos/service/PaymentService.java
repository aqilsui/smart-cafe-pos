package com.cafe.pos.service;

import com.cafe.pos.model.*;
import com.cafe.pos.repository.OrderItemRepository;
import com.cafe.pos.repository.OrderRepository;
import com.cafe.pos.repository.PaymentRepository;
import com.cafe.pos.repository.TableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class PaymentService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private TableRepository tableRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private OrderService orderService;

    public List<Payment> getPaymentsForOrder(Long orderId) {
        return paymentRepository.findByOrderId(orderId);
    }

    public double getAmountPaidSoFar(Long orderId) {
        List<Payment> payments = paymentRepository.findByOrderId(orderId);
        return payments.stream().mapToDouble(Payment::getAmount).sum();
    }

    public double getRemainingBalance(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        double paid = getAmountPaidSoFar(orderId);
        double remaining = order.getTotalAmount() - paid;
        return Math.max(0.0, Math.round(remaining * 100.0) / 100.0);
    }

    // Standard pay full amount
    public Payment processFullPayment(Long orderId, String method) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        double remaining = getRemainingBalance(orderId);
        if (remaining <= 0) {
            throw new RuntimeException("Order is already fully paid");
        }

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(remaining);
        payment.setPaymentMethod(method);
        payment.setStatus("COMPLETED");
        Payment savedPayment = paymentRepository.save(payment);

        // Complete the order and vacate table
        order.setStatus("COMPLETED");
        orderRepository.save(order);

        CafeTable table = order.getTable();
        table.setStatus("VACANT");
        tableRepository.save(table);

        return savedPayment;
    }

    // Register a partial payment (e.g. for equal split)
    public Payment processPartialPayment(Long orderId, double amount, String method) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        double remaining = getRemainingBalance(orderId);
        if (amount > remaining + 0.05) { // adding small buffer for rounding
            throw new RuntimeException("Payment amount exceeds remaining balance");
        }

        // Adjust if last payment has minor rounding discrepancies
        if (Math.abs(remaining - amount) < 0.1) {
            amount = remaining;
        }

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(amount);
        payment.setPaymentMethod(method);
        payment.setStatus("COMPLETED");
        Payment savedPayment = paymentRepository.save(payment);

        // Update table status to PAYING to indicate active checkout/partial payment
        CafeTable table = order.getTable();
        table.setStatus("PAYING");
        tableRepository.save(table);

        // Check if fully paid now
        double updatedRemaining = getRemainingBalance(orderId);
        if (updatedRemaining <= 0) {
            order.setStatus("COMPLETED");
            orderRepository.save(order);
            table.setStatus("VACANT");
            tableRepository.save(table);
        }

        return savedPayment;
    }

    // Split by items logic
    // itemPayments is a map of OrderItemId -> quantity to pay
    public Payment processItemizedPayment(Long orderId, Map<Long, Integer> itemPayments, String method) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        double splitSubtotal = 0.0;

        for (Map.Entry<Long, Integer> entry : itemPayments.entrySet()) {
            Long orderItemId = entry.getKey();
            int qtyToPay = entry.getValue();

            if (qtyToPay <= 0) continue;

            OrderItem item = orderItemRepository.findById(orderItemId)
                    .orElseThrow(() -> new RuntimeException("OrderItem not found: " + orderItemId));

            if (!item.getOrder().getId().equals(orderId)) {
                throw new RuntimeException("Item does not belong to this order");
            }

            if (item.getStatus().equals("CANCELLED")) {
                throw new RuntimeException("Cannot pay for cancelled item");
            }

            // Calculate active remaining qty of this item
            // Unpaid items have parentSplitId = null. Wait, items that are already paid are split off.
            // So the active item's current quantity represents the unpaid remaining quantity.
            if (qtyToPay > item.getQuantity()) {
                throw new RuntimeException("Cannot pay for more items than currently in the order");
            }

            splitSubtotal += item.getMenuItem().getPrice() * qtyToPay;

            // Handle the item splitting in the database
            if (qtyToPay == item.getQuantity()) {
                // If paying for the entire item, we don't need to split the row.
                // We just keep it as is, it is now "paid".
                // We don't change status to COMPLETED if it's already completed in kitchen,
                // but we can set parentSplitId = -1 (or some code) to mark it as settled/paid.
                // To keep it simple, let's mark it by setting parentSplitId = -1L (indicating paid).
                item.setParentSplitId(-1L);
                orderItemRepository.save(item);
            } else {
                // Paying for a partial quantity. We decrement the active item quantity
                item.setQuantity(item.getQuantity() - qtyToPay);
                orderItemRepository.save(item);

                // Create a new OrderItem representing the paid portion
                OrderItem paidItem = new OrderItem();
                paidItem.setOrder(order);
                paidItem.setMenuItem(item.getMenuItem());
                paidItem.setQuantity(qtyToPay);
                paidItem.setNotes(item.getNotes() + " (Paid)");
                paidItem.setStatus(item.getStatus());
                paidItem.setParentSplitId(-1L); // marked as paid
                orderItemRepository.save(paidItem);
            }
        }

        if (splitSubtotal <= 0) {
            throw new RuntimeException("No items selected for payment");
        }

        // Calculate tax and total for this split
        double tax = splitSubtotal * 0.06;
        double splitTotal = Math.round((splitSubtotal + tax) * 100.0) / 100.0;

        // Apply payment
        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(splitTotal);
        payment.setPaymentMethod(method);
        payment.setStatus("COMPLETED");
        Payment savedPayment = paymentRepository.save(payment);

        // Update totals of order (recalculate based on all items)
        orderService.recalculateOrderTotals(order);
        orderRepository.save(order);

        // Update table/order status
        CafeTable table = order.getTable();
        table.setStatus("PAYING");
        tableRepository.save(table);

        double remaining = getRemainingBalance(orderId);
        if (remaining <= 0) {
            order.setStatus("COMPLETED");
            orderRepository.save(order);
            table.setStatus("VACANT");
            tableRepository.save(table);
        }

        return savedPayment;
    }
}

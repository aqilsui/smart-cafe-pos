package com.cafe.pos.dto;

import com.cafe.pos.model.MenuItem;
import com.cafe.pos.model.OrderItem;

import java.time.LocalDateTime;

/**
 * Flat DTO for the kitchen queue endpoint.
 * Avoids @JsonBackReference stripping the parent Order from the response.
 */
public class KitchenQueueItemDTO {

    public Long id;
    public String status;
    public Integer quantity;
    public String notes;
    public LocalDateTime createdAt;

    // Nested order info
    public OrderInfo order;

    // MenuItem passed through directly (already serialisable)
    public MenuItem menuItem;

    public static class OrderInfo {
        public Long id;
        public String status;
        public LocalDateTime createdAt;
        public TableInfo table;

        public static class TableInfo {
            public Long id;
            public Integer tableNumber;
            public Integer capacity;
        }
    }

    /** Convert a JPA OrderItem entity into this DTO */
    public static KitchenQueueItemDTO from(OrderItem item) {
        KitchenQueueItemDTO dto = new KitchenQueueItemDTO();
        dto.id        = item.getId();
        dto.status    = item.getStatus();
        dto.quantity  = item.getQuantity();
        dto.notes     = item.getNotes();
        dto.createdAt = item.getCreatedAt();
        dto.menuItem  = item.getMenuItem();

        if (item.getOrder() != null) {
            OrderInfo oi   = new OrderInfo();
            oi.id          = item.getOrder().getId();
            oi.status      = item.getOrder().getStatus();
            oi.createdAt   = item.getOrder().getCreatedAt();

            if (item.getOrder().getTable() != null) {
                OrderInfo.TableInfo ti = new OrderInfo.TableInfo();
                ti.id          = item.getOrder().getTable().getId();
                ti.tableNumber = item.getOrder().getTable().getTableNumber();
                ti.capacity    = item.getOrder().getTable().getCapacity();
                oi.table       = ti;
            }
            dto.order = oi;
        }
        return dto;
    }
}

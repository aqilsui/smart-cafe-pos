package com.cafe.pos.repository;

import com.cafe.pos.model.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByStatusIn(List<String> statuses);
    List<OrderItem> findByOrderId(Long orderId);
}

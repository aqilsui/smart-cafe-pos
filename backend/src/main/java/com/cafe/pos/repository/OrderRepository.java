package com.cafe.pos.repository;

import com.cafe.pos.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    // Find active order for a table (i.e. status is not COMPLETED or CANCELLED)
    @Query("SELECT o FROM Order o WHERE o.table.id = :tableId AND o.status NOT IN ('COMPLETED', 'CANCELLED')")
    Optional<Order> findActiveOrderByTableId(Long tableId);

    @Query("SELECT o FROM Order o WHERE o.table.tableNumber = :tableNumber AND o.status NOT IN ('COMPLETED', 'CANCELLED')")
    Optional<Order> findActiveOrderByTableNumber(Integer tableNumber);

    List<Order> findByStatusIn(List<String> statuses);
}

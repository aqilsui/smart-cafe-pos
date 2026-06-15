package com.cafe.pos.repository;

import com.cafe.pos.model.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Long> {
    List<MenuItem> findByCategoryAndActiveTrue(String category);
    List<MenuItem> findByActiveTrue();
    Optional<MenuItem> findByNameIgnoreCase(String name);
}

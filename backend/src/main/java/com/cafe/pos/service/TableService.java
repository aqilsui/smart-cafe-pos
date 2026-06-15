package com.cafe.pos.service;

import com.cafe.pos.model.CafeTable;
import com.cafe.pos.repository.TableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class TableService {

    @Autowired
    private TableRepository tableRepository;

    public List<CafeTable> getAllTables() {
        return tableRepository.findAll();
    }

    public Optional<CafeTable> getTableById(Long id) {
        return tableRepository.findById(id);
    }

    public Optional<CafeTable> getTableByNumber(Integer tableNumber) {
        return tableRepository.findByTableNumber(tableNumber);
    }

    public CafeTable updateTableStatus(Long id, String status) {
        CafeTable table = tableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Table not found with id " + id));
        table.setStatus(status);
        return tableRepository.save(table);
    }

    public CafeTable seatTable(Long id) {
        return updateTableStatus(id, "OCCUPIED");
    }

    public CafeTable vacateTable(Long id) {
        return updateTableStatus(id, "VACANT");
    }
}

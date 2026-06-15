package com.cafe.pos.controller;

import com.cafe.pos.model.CafeTable;
import com.cafe.pos.service.TableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tables")
@CrossOrigin(origins = "*")
public class TableController {

    @Autowired
    private TableService tableService;

    @GetMapping
    public List<CafeTable> getAllTables() {
        return tableService.getAllTables();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CafeTable> getTableById(@PathVariable Long id) {
        return tableService.getTableById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/seat")
    public ResponseEntity<CafeTable> seatTable(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(tableService.seatTable(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{id}/vacate")
    public ResponseEntity<CafeTable> vacateTable(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(tableService.vacateTable(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

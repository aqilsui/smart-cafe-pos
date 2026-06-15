package com.cafe.pos.controller;

import com.cafe.pos.model.MenuItem;
import com.cafe.pos.service.AiService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(origins = "*")
public class AiController {

    @Autowired
    private AiService aiService;

    @PostMapping("/parse")
    public ResponseEntity<Map<String, Object>> parseOrderText(@RequestBody Map<String, String> body) {
        try {
            String text = body.get("text");
            return ResponseEntity.ok(aiService.parseOrderText(text));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/eta")
    public ResponseEntity<Map<String, Object>> calculateOrderEta(@RequestBody Map<String, List<Long>> body) {
        try {
            List<Long> menuItemIds = body.get("menuItemIds");
            return ResponseEntity.ok(aiService.calculateOrderEta(menuItemIds));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/recommend")
    public ResponseEntity<List<MenuItem>> getSmartRecommendations(@RequestBody Map<String, List<Long>> body) {
        try {
            List<Long> menuItemIds = body.get("menuItemIds");
            return ResponseEntity.ok(aiService.getSmartRecommendations(menuItemIds));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}

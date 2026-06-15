package com.cafe.pos.service;

import com.cafe.pos.model.*;
import com.cafe.pos.repository.MenuItemRepository;
import com.cafe.pos.repository.OrderItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class AiService {

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    // AI Feature 1: Natural Language order parser
    // Parses statements like "Table 4 wants 2 latte with oat milk and a chocolate croissant"
    public Map<String, Object> parseOrderText(String text) {
        Map<String, Object> result = new HashMap<>();
        if (text == null || text.trim().isEmpty()) {
            result.put("tableNumber", null);
            result.put("items", new ArrayList<>());
            result.put("confidence", 0.0);
            result.put("message", "Empty input text");
            return result;
        }

        // 1. Extract table number
        Integer tableNumber = extractTableNumber(text);
        result.put("tableNumber", tableNumber);

        // 2. Fetch active menu items for matching
        List<MenuItem> menuItems = menuItemRepository.findByActiveTrue();
        List<Map<String, Object>> parsedItems = new ArrayList<>();

        // Normalize text
        String normalizedText = text.toLowerCase().replaceAll("[.,!]", " ");

        // Convert word numbers to digits
        normalizedText = convertWordNumbers(normalizedText);

        // Split text by "and" or "," to parse segments
        String[] segments = normalizedText.split("and|,");

        for (String segment : segments) {
            segment = segment.trim();
            if (segment.isEmpty()) continue;

            // Try to match menu items in this segment
            MenuItem matchedItem = null;
            int bestMatchIndex = -1;
            
            for (MenuItem item : menuItems) {
                String itemName = item.getName().toLowerCase();
                int idx = segment.indexOf(itemName);
                if (idx != -1) {
                    matchedItem = item;
                    bestMatchIndex = idx;
                    break; // Found matching item
                }
                
                // Try fuzzy/partial matching for common variations (e.g., "espresso" vs "espressos", "latte" vs "caffe latte")
                if (itemName.contains("latte") && segment.contains("latte")) {
                    matchedItem = item;
                    break;
                }
                if (itemName.contains("croissant") && segment.contains("croissant")) {
                    matchedItem = item;
                    break;
                }
                if (itemName.contains("sandwich") && segment.contains("sandwich")) {
                    matchedItem = item;
                    break;
                }
                if (itemName.contains("muffin") && segment.contains("muffin")) {
                    matchedItem = item;
                    break;
                }
                if (itemName.contains("cheesecake") && segment.contains("cheesecake")) {
                    matchedItem = item;
                    break;
                }
            }

            if (matchedItem != null) {
                // Determine quantity: look for a number in the segment
                int quantity = 1;
                Pattern numberPattern = Pattern.compile("\\b(\\d+)\\b");
                Matcher numberMatcher = numberPattern.matcher(segment);
                if (numberMatcher.find()) {
                    quantity = Integer.parseInt(numberMatcher.group(1));
                }

                // Extract custom notes (e.g. "oat milk", "hot", "iced", "less sugar")
                String notes = null;
                List<String> commonNotes = List.of("oat milk", "soy milk", "almond milk", "iced", "hot", "less sugar", "extra hot", "extra cheese");
                for (String note : commonNotes) {
                    if (segment.contains(note)) {
                        notes = note;
                        break;
                    }
                }

                Map<String, Object> itemData = new HashMap<>();
                itemData.put("menuItemId", matchedItem.getId());
                itemData.put("name", matchedItem.getName());
                itemData.put("quantity", quantity);
                itemData.put("price", matchedItem.getPrice());
                itemData.put("notes", notes);
                parsedItems.add(itemData);
            }
        }

        result.put("items", parsedItems);
        result.put("confidence", parsedItems.isEmpty() ? 0.0 : 0.92); // High confidence if items matched
        result.put("message", parsedItems.isEmpty() ? "No items recognized from the order request." : "Successfully parsed order.");
        
        return result;
    }

    private Integer extractTableNumber(String text) {
        Pattern tablePattern = Pattern.compile("(?i)\\b(table|t)\\s*(\\d+)\\b");
        Matcher matcher = tablePattern.matcher(text);
        if (matcher.find()) {
            return Integer.parseInt(matcher.group(2));
        }
        return null;
    }

    private String convertWordNumbers(String text) {
        Map<String, String> wordToNum = new HashMap<>();
        wordToNum.put("a", "1");
        wordToNum.put("an", "1");
        wordToNum.put("one", "1");
        wordToNum.put("two", "2");
        wordToNum.put("three", "3");
        wordToNum.put("four", "4");
        wordToNum.put("five", "5");
        wordToNum.put("six", "6");
        wordToNum.put("seven", "7");
        wordToNum.put("eight", "8");
        wordToNum.put("nine", "9");
        wordToNum.put("ten", "10");

        String result = text;
        for (Map.Entry<String, String> entry : wordToNum.entrySet()) {
            result = result.replaceAll("\\b" + entry.getKey() + "\\b", entry.getValue());
        }
        return result;
    }

    // AI Feature 2: Dynamic ETA & preparation time estimation based on kitchen load
    public Map<String, Object> calculateOrderEta(List<Long> menuItemIds) {
        int basePrepTime = 0;
        int maxPrepTime = 0;
        
        List<MenuItem> items = menuItemRepository.findAllById(menuItemIds);
        for (MenuItem item : items) {
            maxPrepTime = Math.max(maxPrepTime, item.getPrepTime());
            basePrepTime += item.getPrepTime();
        }

        // Parallel processing calculation: maximum prep time + 15% of the rest of the preparation times
        double estimatedBaseSeconds = maxPrepTime + (basePrepTime - maxPrepTime) * 0.15;

        // Fetch active queue load in kitchen
        List<OrderItem> activeQueue = orderItemRepository.findByStatusIn(List.of("PENDING", "COOKING"));
        int activeQueueSize = activeQueue.size();

        // Calculate load delay penalty: 20 seconds delay per active item in queue
        double queueDelaySeconds = activeQueueSize * 20.0;
        
        // Add dynamic scaling based on queue size (bottleneck threshold)
        if (activeQueueSize > 8) {
            queueDelaySeconds *= 1.5; // Escalation multiplier
        }

        double totalEtaSeconds = estimatedBaseSeconds + queueDelaySeconds;
        int etaMinutes = (int) Math.ceil(totalEtaSeconds / 60.0);

        Map<String, Object> etaResult = new HashMap<>();
        etaResult.put("estimatedPrepTimeSeconds", Math.round(totalEtaSeconds));
        etaResult.put("estimatedPrepTimeMinutes", etaMinutes);
        etaResult.put("activeQueueSize", activeQueueSize);
        etaResult.put("queueDelaySeconds", Math.round(queueDelaySeconds));
        etaResult.put("isKitchenBusy", activeQueueSize > 8);

        return etaResult;
    }

    // AI Feature 3: Smart cross-selling recommendation engine
    public List<MenuItem> getSmartRecommendations(List<Long> currentCartItemIds) {
        if (currentCartItemIds == null || currentCartItemIds.isEmpty()) {
            // Default top recommendations
            return menuItemRepository.findAllById(List.of(3L, 10L, 14L)); // Latte, Croissant, Chocolate Cake
        }

        List<MenuItem> cartItems = menuItemRepository.findAllById(currentCartItemIds);
        Set<String> categoriesInCart = cartItems.stream().map(MenuItem::getCategory).collect(Collectors.toSet());

        List<MenuItem> recommendations = new ArrayList<>();
        List<MenuItem> allActive = menuItemRepository.findByActiveTrue();

        // Rules based recommendation:
        // 1. If only coffee/tea is in cart -> recommend FOOD (Croissant, Avocado Toast) and DESSERT (Cheesecake, Chocolate Cake)
        if (categoriesInCart.contains("COFFEE") || categoriesInCart.contains("TEA")) {
            if (!categoriesInCart.contains("FOOD")) {
                // Recommend top food items: Croissant, Sandwich
                allActive.stream()
                        .filter(item -> item.getCategory().equals("FOOD") && !currentCartItemIds.contains(item.getId()))
                        .limit(2)
                        .forEach(recommendations::add);
            }
            if (!categoriesInCart.contains("DESSERT")) {
                // Recommend top desserts: Muffin, Cake
                allActive.stream()
                        .filter(item -> item.getCategory().equals("DESSERT") && !currentCartItemIds.contains(item.getId()))
                        .limit(2)
                        .forEach(recommendations::add);
            }
        }

        // 2. If food is in cart, but no beverage -> recommend Coffee/Tea
        if (categoriesInCart.contains("FOOD") && !categoriesInCart.contains("COFFEE") && !categoriesInCart.contains("TEA")) {
            allActive.stream()
                    .filter(item -> (item.getCategory().equals("COFFEE") || item.getCategory().equals("TEA")) && !currentCartItemIds.contains(item.getId()))
                    .limit(2)
                    .forEach(recommendations::add);
        }

        // 3. Fallback: if nothing matched or we need more recommendations, fill with most popular items
        if (recommendations.size() < 3) {
            allActive.stream()
                    .filter(item -> !currentCartItemIds.contains(item.getId()) && !recommendations.contains(item))
                    .limit(3 - recommendations.size())
                    .forEach(recommendations::add);
        }

        return recommendations;
    }
}

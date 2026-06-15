package com.cafe.pos.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "menu_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String category; // COFFEE, TEA, FOOD, DESSERT

    @Column(nullable = false)
    private Double price;

    @Column(name = "prep_time", nullable = false)
    private Integer prepTime; // in seconds

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private Boolean active;
}

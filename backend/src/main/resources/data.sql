-- Seed Cafe Tables
-- Table schemas will be created by JPA. Since data.sql runs after DDL generation, we insert records safely.
-- Statuses: VACANT, OCCUPIED, PAYING

-- Clean start (optional, or just do insert with conflict check. Since ids are generated, we can insert specific IDs to make foreign keys easy)
INSERT INTO cafe_tables (id, table_number, capacity, status) VALUES
(1, 1, 2, 'VACANT'),
(2, 2, 2, 'VACANT'),
(3, 3, 4, 'VACANT'),
(4, 4, 4, 'VACANT'),
(5, 5, 6, 'VACANT'),
(6, 6, 6, 'VACANT'),
(7, 7, 8, 'VACANT'),
(8, 8, 2, 'VACANT')
ON CONFLICT (id) DO UPDATE SET capacity = EXCLUDED.capacity, table_number = EXCLUDED.table_number;

-- Seed Menu Items
-- Categories: COFFEE, TEA, FOOD, DESSERT
INSERT INTO menu_items (id, name, category, price, prep_time, description, active) VALUES
(1, 'Espresso', 'COFFEE', 3.00, 120, 'Rich and bold single shot of espresso.', true),
(2, 'Americano', 'COFFEE', 3.50, 150, 'Espresso shots topped with hot water.', true),
(3, 'Caffe Latte', 'COFFEE', 4.50, 180, 'Espresso with steamed milk and a thin layer of foam.', true),
(4, 'Cappuccino', 'COFFEE', 4.50, 180, 'Espresso with equal parts steamed milk and thick foam.', true),
(5, 'Flat White', 'COFFEE', 4.50, 180, 'Velvety microfoam poured over double ristretto.', true),
(6, 'Caramel Macchiato', 'COFFEE', 5.00, 210, 'Espresso with vanilla syrup, steamed milk, and caramel drizzle.', true),
(7, 'English Breakfast Tea', 'TEA', 3.50, 120, 'Premium black tea blend served hot.', true),
(8, 'Green Tea Matcha Latte', 'TEA', 4.80, 180, 'Stone-ground matcha green tea with steamed milk.', true),
(9, 'Peach Ice Tea', 'TEA', 4.00, 150, 'Refreshing chilled tea with sweet peach flavor.', true),
(10, 'Chocolate Croissant', 'FOOD', 3.80, 90, 'Buttery, flaky pastry filled with dark chocolate.', true),
(11, 'Avocado Sourdough Toast', 'FOOD', 7.50, 300, 'Freshly mashed avocado on toasted sourdough, cherry tomatoes.', true),
(12, 'Chicken Club Sandwich', 'FOOD', 8.50, 420, 'Triple-decker sandwich with chicken breast, lettuce, tomato, and mayo.', true),
(13, 'Classic Beef Burger', 'FOOD', 9.50, 480, 'Grilled beef patty, cheddar cheese, pickles, and burger sauce.', true),
(14, 'Chocolate Fudge Cake', 'DESSERT', 5.50, 60, 'Decadent slice of chocolate cake with fudge frosting.', true),
(15, 'Blueberry Muffin', 'DESSERT', 3.50, 60, 'Soft muffin packed with fresh blueberries.', true),
(16, 'New York Cheesecake', 'DESSERT', 6.00, 60, 'Classic creamy cheesecake with a graham cracker crust.', true)
ON CONFLICT (id) DO UPDATE SET price = EXCLUDED.price, prep_time = EXCLUDED.prep_time, description = EXCLUDED.description;

-- Reset PK sequence for tables if needed (specific to Postgres)
SELECT setval('cafe_tables_id_seq', (SELECT MAX(id) FROM cafe_tables));
SELECT setval('menu_items_id_seq', (SELECT MAX(id) FROM menu_items));

-- =========================================================
-- Sample data. Run after schema.sql:
--   mysql -u root -p hunar_marketplace < seed.sql
--
-- Login credentials this creates:
--   Admin:    admin@hunar.pk     / Admin123!
--   Customer: buyer@example.com  / Customer123!
-- =========================================================

USE hunar_marketplace;

-- password: Admin123!
INSERT INTO admins (username, email, password_hash) VALUES
('admin', 'admin@hunar.pk', '$2b$10$4cQrVzcQCPqOMTh4fHPas.w2DI2ethnARmzrOZzFXD1wnH0RQswdW');

-- password: Customer123!
INSERT INTO customers (name, email, password_hash, phone, address) VALUES
('Ayesha Buyer', 'buyer@example.com', '$2b$10$2Nsn2hMbeQx/YpDWSC14PejAG267B6NAxqS.4FrdNX7YcTGQt1TFC', '0300-1234567', 'Street 12, Peshawar');

INSERT INTO products (name, description, price, category, image, stock, rating) VALUES
('Hand-woven Shawl', 'A soft, hand-loomed shawl made using traditional techniques passed down through generations.', 4200, 'Shawls', 'assets/images/products/handmade-shawl.png', 14, 4.8),
('Hand-knotted Carpet', 'A durable, richly patterned carpet knotted entirely by hand over several weeks.', 15500, 'Carpets', 'assets/images/products/carpets.jpg', 6, 4.9),
('Handmade Jewellery Set', 'A beaded and hammered-metal jewellery set crafted by local artisans.', 2100, 'Jewellery', 'assets/images/products/handmade-jewellery.jpeg', 20, 4.7),
('Carved Wooden Vase', 'A hand-carved wooden vase finished with natural oils.', 2800, 'Woodwork', 'assets/images/products/wooden-vase.png', 10, 4.6),
('Crochet Sunflower Bouquet', 'A hand-crocheted bouquet of sunflowers that never wilts.', 1600, 'Embroidery', 'assets/images/products/Crochet Sunflower Bouquet.jpeg', 25, 4.9),
('Glazed Pottery Set', 'A wheel-thrown and hand-glazed tea set, fired in a traditional kiln.', 3400, 'Pottery', 'assets/images/products/pottery-set.png', 8, 4.8),
('Woven Basket', 'A sturdy, hand-woven basket made from natural palm leaf.', 1200, 'Baskets', 'assets/images/products/handmade-basket.png', 30, 4.5);

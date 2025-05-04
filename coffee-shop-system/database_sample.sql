-- Thêm các danh mục sản phẩm
INSERT INTO category (Category_Name, Description) VALUES 
('Coffee', 'Các loại cà phê nóng và lạnh'),
('Tea', 'Các loại trà thơm ngon'),
('Bakery', 'Các loại bánh mì và bánh ngọt'),
('Dessert', 'Các loại tráng miệng ngọt ngào'),
('Smoothie', 'Các loại sinh tố mát lạnh');

-- Thêm sản phẩm cho danh mục Coffee
INSERT INTO product (Product_Name, Price, Description, Is_Available, ID_Category) VALUES 
('Espresso', 25000, 'Cà phê đậm đặc pha bằng cách ép nước qua hạt cà phê xay mịn', 1, 1),
('Cappuccino', 35000, 'Cà phê Espresso trộn với sữa nóng và bọt sữa', 1, 1),
('Latte', 40000, 'Cà phê Espresso với nhiều sữa nóng và một ít bọt sữa', 1, 1),
('Americano', 30000, 'Cà phê Espresso pha loãng với nước nóng', 1, 1),
('Mocha', 45000, 'Cà phê Espresso với sữa nóng, socola và bọt sữa', 1, 1);

-- Thêm sản phẩm cho danh mục Tea
INSERT INTO product (Product_Name, Price, Description, Is_Available, ID_Category) VALUES 
('Trà xanh', 25000, 'Trà xanh nhật bản thanh mát', 1, 2),
('Trà đào', 35000, 'Trà đen pha với đào tươi và siro đào', 1, 2),
('Trà sữa', 30000, 'Trà đen với sữa đặc', 1, 2),
('Trà gừng', 28000, 'Trà đen ấm nóng với gừng tươi', 1, 2),
('Trà chanh', 25000, 'Trà đen với nước cốt chanh tươi', 1, 2);

-- Thêm sản phẩm cho danh mục Bakery
INSERT INTO product (Product_Name, Price, Description, Is_Available, ID_Category) VALUES 
('Bánh mì pate', 20000, 'Bánh mì giòn với pate gan', 1, 3),
('Croissant', 25000, 'Bánh croissant bơ truyền thống', 1, 3),
('Bánh Danish', 30000, 'Bánh Danish với nhân kem phô mai', 1, 3),
('Bánh sừng bò', 22000, 'Bánh sừng bò với socola', 1, 3),
('Bánh mì que', 15000, 'Bánh mì que giòn rụm', 1, 3);

-- Thêm sản phẩm cho danh mục Dessert
INSERT INTO product (Product_Name, Price, Description, Is_Available, ID_Category) VALUES 
('Bánh flan', 25000, 'Bánh flan mềm mịn với caramel', 1, 4),
('Tiramisu', 45000, 'Bánh tiramisu với cà phê và phô mai mascarpone', 1, 4),
('Cheesecake', 40000, 'Bánh phô mai mịn với đế bánh giòn', 1, 4),
('Bánh cupcake', 30000, 'Bánh cupcake với kem tươi', 1, 4),
('Panna Cotta', 35000, 'Tráng miệng Ý với kem tươi và sốt dâu', 1, 4);

-- Thêm sản phẩm cho danh mục Smoothie
INSERT INTO product (Product_Name, Price, Description, Is_Available, ID_Category) VALUES 
('Sinh tố xoài', 35000, 'Sinh tố xoài mát lạnh', 1, 5),
('Sinh tố dâu', 40000, 'Sinh tố dâu tây tươi ngon', 1, 5),
('Sinh tố bơ', 45000, 'Sinh tố bơ béo ngậy', 1, 5),
('Sinh tố chuối', 35000, 'Sinh tố chuối mát lành', 1, 5),
('Sinh tố dứa', 35000, 'Sinh tố dứa giải nhiệt', 1, 5);

-- Thêm các bàn trong quán
INSERT INTO cafetable (Capacity, Status, Location) VALUES 
(2, 'Available', 'Ground Floor'),
(2, 'Available', 'Ground Floor'),
(4, 'Available', 'Ground Floor'),
(4, 'Available', 'Ground Floor'),
(6, 'Available', 'Ground Floor'),
(2, 'Available', 'First Floor'),
(4, 'Available', 'First Floor'),
(8, 'Available', 'First Floor'),
(2, 'Available', 'Outdoor'),
(4, 'Available', 'Outdoor');

-- Thêm tài khoản người dùng
INSERT INTO account (User_Name, Full_Name, Pass_Word, Phone, Address, Role) VALUES 
('admin', 'Administrator', 'admin123', '0987654321', 'Hồ Chí Minh', 'Admin'),
('staff', 'Staff User', 'staff123', '0123456789', 'Hồ Chí Minh', 'Staff'),
('customer', 'Customer User', 'customer123', '0123498765', 'Hồ Chí Minh', 'Customer'); 
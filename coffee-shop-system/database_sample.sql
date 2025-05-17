-- --------------------------------------------------------
-- Máy chủ:                      127.0.0.1
-- Server version:               8.0.30 - MySQL Community Server - GPL
-- Server OS:                    Win64
-- HeidiSQL Phiên bản:           12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for coffee_t2k
CREATE DATABASE IF NOT EXISTS `coffee_t2k` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `coffee_t2k`;

-- Dumping structure for table coffee_t2k.account
CREATE TABLE IF NOT EXISTS `account` (
  `ID_Account` int NOT NULL AUTO_INCREMENT,
  `user_name` varchar(255) DEFAULT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `pass_word` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active',
  PRIMARY KEY (`ID_Account`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.account: ~4 rows (approximately)
INSERT INTO `account` (`ID_Account`, `user_name`, `full_name`, `pass_word`, `phone`, `address`, `image`, `role`, `status`) VALUES
	(1, 'admin', 'Administrator', '090524', '0987654321', 'Hồ Chí Minh', '/uploads/images/avatar/1_774e342d-7425-4625-a758-86510be16e7d.jpg', 'Admin', 'active'),
	(2, 'staff', 'Staff User', '090524', '023627622', 'Hồ Chí Minh', '/uploads/images/avatar/2_e2a7029c-bb48-4389-b5fb-fdc4c394d40d.jpg', 'Staff', 'active'),
	(4, 'Thang', 'Thang Pham', '090524', '0326314436', 'Hồ Chí Minh', NULL, 'Customer', 'active'),
	(12, 'srgr', 'Nguyễn Lê Phương Trang', '090524', '0794887919', 'số 37 đường 120 phường Tân Phú thủ đức thành phố hồ chí minh', NULL, 'Staff', 'active');

-- Dumping structure for table coffee_t2k.cafeorder
CREATE TABLE IF NOT EXISTS `cafeorder` (
  `ID_Order` int NOT NULL AUTO_INCREMENT,
  `ID_Table` int DEFAULT NULL,
  `Quantity` int DEFAULT NULL,
  `order_time` datetime(6) DEFAULT NULL,
  `total_amount` decimal(38,2) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `ID_Account` int DEFAULT NULL,
  `ID_Promotion` int DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID_Order`),
  KEY `ID_Table` (`ID_Table`),
  KEY `ID_Account` (`ID_Account`),
  KEY `ID_Promotion` (`ID_Promotion`),
  CONSTRAINT `cafeorder_ibfk_1` FOREIGN KEY (`ID_Table`) REFERENCES `cafetable` (`ID_Table`),
  CONSTRAINT `cafeorder_ibfk_2` FOREIGN KEY (`ID_Account`) REFERENCES `account` (`ID_Account`),
  CONSTRAINT `cafeorder_ibfk_3` FOREIGN KEY (`ID_Promotion`) REFERENCES `promotion` (`ID_Promotion`),
  CONSTRAINT `FK2gdg8wvg8gldsn3wx8tbdbg2i` FOREIGN KEY (`ID_Account`) REFERENCES `account` (`ID_Account`),
  CONSTRAINT `FKa7eja5u55lbcvb02yrydak3ct` FOREIGN KEY (`ID_Promotion`) REFERENCES `promotion` (`ID_Promotion`),
  CONSTRAINT `FKsa9rioc5l2lvagl09sonoqx1a` FOREIGN KEY (`ID_Table`) REFERENCES `cafetable` (`ID_Table`)
) ENGINE=InnoDB AUTO_INCREMENT=310 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.cafeorder: ~28 rows (approximately)
INSERT INTO `cafeorder` (`ID_Order`, `ID_Table`, `Quantity`, `order_time`, `total_amount`, `note`, `ID_Account`, `ID_Promotion`, `status`) VALUES
	(256, 7, NULL, '2025-05-10 04:19:27.505000', 270000.00, '', NULL, NULL, 'completed'),
	(257, 4, NULL, '2025-05-10 04:19:55.528000', 140000.00, '', NULL, NULL, 'completed'),
	(258, 5, NULL, '2025-05-10 04:20:36.436000', 185000.00, '', NULL, NULL, 'completed'),
	(259, 3, NULL, '2025-05-10 04:42:13.848000', 60000.00, '', NULL, NULL, 'completed'),
	(260, NULL, NULL, '2025-05-10 04:48:17.425000', 190000.00, '', NULL, NULL, 'completed'),
	(261, NULL, NULL, '2025-05-10 04:49:18.335000', 485000.00, '', NULL, NULL, 'completed'),
	(262, 2, NULL, '2025-05-10 04:50:33.479000', 140000.00, '', NULL, NULL, 'completed'),
	(263, NULL, NULL, '2025-05-10 04:51:58.701000', 30000.00, '', NULL, NULL, 'completed'),
	(264, 8, NULL, '2025-05-10 04:53:48.441000', 150000.00, '', NULL, NULL, 'completed'),
	(265, NULL, NULL, '2025-05-10 04:54:28.103000', 185000.00, '', NULL, NULL, 'completed'),
	(266, NULL, NULL, '2025-05-10 04:55:27.481000', 150000.00, '', NULL, NULL, 'completed'),
	(267, 9, NULL, '2025-05-10 04:58:56.800000', 150000.00, '', NULL, NULL, 'completed'),
	(268, 10, NULL, '2025-05-10 04:59:41.164000', 150000.00, '', NULL, NULL, 'completed'),
	(269, 12, NULL, '2025-05-10 05:00:07.166000', 150000.00, '', NULL, NULL, 'completed'),
	(270, 11, NULL, '2025-05-10 05:00:25.937000', 180000.00, '', NULL, NULL, 'completed'),
	(271, NULL, NULL, '2025-05-10 05:01:31.824000', 195000.00, '', NULL, NULL, 'completed'),
	(272, NULL, NULL, '2025-05-10 05:01:55.417000', 180000.00, '', NULL, NULL, 'completed'),
	(273, 6, NULL, '2025-05-10 05:02:13.696000', 120000.00, '', NULL, NULL, 'completed'),
	(274, NULL, NULL, '2025-05-10 05:05:03.482000', 220000.00, '', NULL, NULL, 'completed'),
	(275, NULL, NULL, '2025-05-10 05:05:29.477000', 140000.00, '', NULL, NULL, 'completed'),
	(276, NULL, NULL, '2025-05-10 05:06:40.116000', 185000.00, '', NULL, NULL, 'completed'),
	(277, NULL, NULL, '2025-05-10 05:08:55.804000', 345000.00, '', NULL, NULL, 'completed'),
	(278, 1, NULL, '2025-05-10 05:18:56.304000', 140000.00, '', NULL, NULL, 'completed'),
	(279, NULL, NULL, '2025-05-10 05:19:15.357000', 120000.00, '', NULL, NULL, 'completed'),
	(280, NULL, NULL, '2025-05-10 16:49:28.565000', 42000.00, '', NULL, NULL, 'completed'),
	(281, NULL, NULL, '2025-05-10 16:50:01.507000', 150000.00, '', NULL, NULL, 'completed'),
	(282, NULL, NULL, '2025-05-10 16:51:30.869000', 60000.00, '', NULL, NULL, 'completed'),
	(283, NULL, NULL, '2025-05-10 16:54:39.023000', 150000.00, '', NULL, NULL, 'completed'),
	(284, NULL, NULL, '2025-05-10 16:55:10.789000', 150000.00, '', NULL, NULL, 'completed'),
	(285, NULL, NULL, '2025-05-10 16:56:04.589000', 140000.00, '', NULL, NULL, 'completed'),
	(286, NULL, NULL, '2025-05-10 16:56:31.622000', 150000.00, '', NULL, NULL, 'completed'),
	(287, NULL, NULL, '2025-05-10 16:57:41.128000', 140000.00, '', NULL, NULL, 'completed'),
	(288, 2, NULL, '2025-05-11 16:33:02.679000', 110000.00, '', NULL, NULL, 'completed'),
	(289, NULL, NULL, '2025-05-11 16:33:45.464000', 30000.00, '', NULL, NULL, 'completed'),
	(290, NULL, NULL, '2025-05-11 16:34:52.843000', 1150.00, '', NULL, NULL, 'completed'),
	(291, 4, NULL, '2025-05-11 23:33:00.540000', 30000.00, '', NULL, NULL, 'completed'),
	(292, NULL, NULL, '2025-05-11 23:33:25.855000', 105000.00, '', NULL, NULL, 'completed'),
	(293, NULL, NULL, '2025-05-12 13:44:18.945000', 280000.00, '', NULL, NULL, 'completed'),
	(294, NULL, NULL, '2025-05-12 22:33:45.349000', 280000.00, '', NULL, NULL, 'completed'),
	(295, 4, NULL, '2025-05-13 00:06:51.654000', 302000.00, '', NULL, NULL, 'completed'),
	(296, 2, NULL, '2025-05-13 00:08:56.971000', 130000.00, '', NULL, NULL, 'completed'),
	(297, NULL, NULL, '2025-05-13 00:13:44.742000', 28000.00, '', NULL, NULL, 'completed'),
	(298, NULL, NULL, '2025-05-13 00:16:35.575000', 30000.00, '', NULL, NULL, 'completed'),
	(299, NULL, NULL, '2025-05-13 00:17:53.265000', 30000.00, '', NULL, NULL, 'completed'),
	(300, NULL, NULL, '2025-05-13 00:25:35.651000', 2490.00, '', NULL, NULL, 'completed'),
	(301, NULL, NULL, '2025-05-13 00:29:42.704000', 35600.00, '', NULL, NULL, 'completed'),
	(302, NULL, NULL, '2025-05-13 00:31:51.031000', 170000.00, '', NULL, NULL, 'completed'),
	(303, NULL, NULL, '2025-05-13 00:34:53.283000', 34000.00, '', NULL, NULL, 'completed'),
	(304, NULL, NULL, '2025-05-13 00:35:50.476000', 167000.00, '', NULL, NULL, 'completed'),
	(305, NULL, NULL, '2025-05-13 00:38:32.400000', 163800.00, '', NULL, NULL, 'completed'),
	(306, NULL, NULL, '2025-05-13 00:39:21.678000', 80000.00, '', NULL, NULL, 'completed'),
	(307, 4, NULL, '2025-05-13 01:20:05.718000', 27000.00, '', NULL, NULL, 'completed'),
	(308, 1, NULL, '2025-05-13 01:31:59.889000', 135000.00, '', NULL, NULL, 'completed'),
	(309, 5, NULL, '2025-05-13 01:57:52.890000', 55000.00, '', NULL, NULL, 'processing');

-- Dumping structure for table coffee_t2k.cafetable
CREATE TABLE IF NOT EXISTS `cafetable` (
  `ID_Table` int NOT NULL AUTO_INCREMENT,
  `status` varchar(255) DEFAULT NULL,
  `Capacity` int NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `table_number` int DEFAULT NULL,
  PRIMARY KEY (`ID_Table`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.cafetable: ~13 rows (approximately)
INSERT INTO `cafetable` (`ID_Table`, `status`, `Capacity`, `location`, `table_number`) VALUES
	(1, 'Occupied', 3, 'First Floor', 1),
	(2, 'Available', 2, 'First Floor', 2),
	(3, 'Available', 4, 'Ground Floor', 3),
	(4, 'Occupied', 4, 'Ground Floor', 4),
	(5, 'Occupied', 7, 'Ground Floor', 5),
	(6, 'Available', 2, 'First Floor', 6),
	(7, 'Available', 4, 'First Floor', 7),
	(8, 'Available', 8, 'First Floor', 8),
	(9, 'Available', 2, 'Outdoor', 9),
	(10, 'Available', 4, 'Outdoor', 10),
	(11, 'Available', 3, 'First Floor', 11),
	(12, 'Available', 6, 'Ground Floor', 12),
	(13, 'Available', 2, 'Ground Floor', 12);

-- Dumping structure for table coffee_t2k.category
CREATE TABLE IF NOT EXISTS `category` (
  `ID_Category` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID_Category`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.category: ~5 rows (approximately)
INSERT INTO `category` (`ID_Category`, `category_name`, `description`) VALUES
	(1, 'Cà Phê', 'Các loại cà phê nóng và lạnh'),
	(2, 'Trà', 'Các loại trà thơm ngon'),
	(3, 'Bánh', 'Các loại bánh mì và bánh ngọt'),
	(4, 'Tráng Miệng', 'Các loại tráng miệng ngọt ngào'),
	(5, 'Sinh Tố', 'Các loại sinh tố mát lạnh');

-- Dumping structure for table coffee_t2k.order_detail
CREATE TABLE IF NOT EXISTS `order_detail` (
  `ID_Product` int NOT NULL,
  `ID_Order` int NOT NULL,
  `Quantity` int NOT NULL,
  `unit_price` decimal(38,2) DEFAULT NULL,
  `subtotal` decimal(38,2) DEFAULT NULL,
  `size` varchar(5) DEFAULT 'S',
  `ice_percent` varchar(10) DEFAULT '100',
  `sugar_percent` varchar(10) DEFAULT '100',
  `toppings` varchar(255) DEFAULT NULL,
  `additional_price` decimal(10,2) DEFAULT '0.00',
  `variant_note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID_Product`,`ID_Order`),
  KEY `ID_Order` (`ID_Order`),
  CONSTRAINT `FKicrtfcntxfkyrnoaqh1croidl` FOREIGN KEY (`ID_Product`) REFERENCES `product` (`ID_Product`),
  CONSTRAINT `FKm1uk6ra8guu71ewavs00un4sd` FOREIGN KEY (`ID_Order`) REFERENCES `cafeorder` (`ID_Order`),
  CONSTRAINT `order_detail_ibfk_1` FOREIGN KEY (`ID_Product`) REFERENCES `product` (`ID_Product`),
  CONSTRAINT `order_detail_ibfk_2` FOREIGN KEY (`ID_Order`) REFERENCES `cafeorder` (`ID_Order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.order_detail: ~65 rows (approximately)
INSERT INTO `order_detail` (`ID_Product`, `ID_Order`, `Quantity`, `unit_price`, `subtotal`, `size`, `ice_percent`, `sugar_percent`, `toppings`, `additional_price`, `variant_note`) VALUES
	(1, 309, 1, 55000.00, NULL, 'S', '100', '100', NULL, 0.00, NULL);

-- Dumping structure for table coffee_t2k.payment
CREATE TABLE IF NOT EXISTS `payment` (
  `ID_Payment` int NOT NULL AUTO_INCREMENT,
  `ID_Order` int DEFAULT NULL,
  `create_at` datetime(6) DEFAULT NULL,
  `payment_method` varchar(255) DEFAULT NULL,
  `payment_status` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID_Payment`),
  UNIQUE KEY `UK_dm7pgny5g5lm9nqxqd7iqfutp` (`ID_Order`),
  KEY `ID_Order` (`ID_Order`),
  CONSTRAINT `FKk9qpkedyh8x8diq42o0qj48y8` FOREIGN KEY (`ID_Order`) REFERENCES `cafeorder` (`ID_Order`),
  CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`ID_Order`) REFERENCES `cafeorder` (`ID_Order`)
) ENGINE=InnoDB AUTO_INCREMENT=110 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.payment: ~28 rows (approximately)
INSERT INTO `payment` (`ID_Payment`, `ID_Order`, `create_at`, `payment_method`, `payment_status`) VALUES
	(56, 256, '2025-05-10 04:19:27.505000', 'cash', 'completed'),
	(57, 257, '2025-05-10 04:19:55.529000', 'transfer', 'completed'),
	(58, 258, '2025-05-10 04:20:36.436000', 'transfer', 'completed'),
	(59, 259, '2025-05-10 04:42:13.848000', 'cash', 'completed'),
	(60, 260, '2025-05-10 04:48:17.425000', 'cash', 'completed'),
	(61, 261, '2025-05-10 04:49:18.335000', 'transfer', 'completed'),
	(62, 262, '2025-05-10 04:50:33.479000', 'cash', 'completed'),
	(63, 263, '2025-05-10 04:51:58.701000', 'transfer', 'completed'),
	(64, 264, '2025-05-10 04:53:48.441000', 'transfer', 'completed'),
	(65, 265, '2025-05-10 04:54:28.103000', 'transfer', 'completed'),
	(66, 266, '2025-05-10 04:55:27.481000', 'transfer', 'completed'),
	(67, 267, '2025-05-10 04:58:56.800000', 'transfer', 'completed'),
	(68, 268, '2025-05-10 04:59:41.164000', 'transfer', 'completed'),
	(69, 269, '2025-05-10 05:00:07.166000', 'cash', 'completed'),
	(70, 270, '2025-05-10 05:00:25.938000', 'transfer', 'completed'),
	(71, 271, '2025-05-10 05:01:31.824000', 'cash', 'completed'),
	(72, 272, '2025-05-10 05:01:55.418000', 'cash', 'completed'),
	(73, 273, '2025-05-10 05:02:13.696000', 'cash', 'completed'),
	(74, 274, '2025-05-10 05:05:03.483000', 'transfer', 'completed'),
	(75, 275, '2025-05-10 05:05:29.477000', 'cash', 'completed'),
	(76, 276, '2025-05-10 05:06:40.116000', 'cash', 'completed'),
	(77, 277, '2025-05-10 05:08:55.804000', 'cash', 'completed'),
	(78, 278, '2025-05-10 05:18:56.304000', 'cash', 'completed'),
	(79, 279, '2025-05-10 05:19:15.357000', 'transfer', 'completed'),
	(80, 280, '2025-05-10 16:49:28.565000', 'transfer', 'completed'),
	(81, 281, '2025-05-10 16:50:01.507000', 'cash', 'completed'),
	(82, 282, '2025-05-10 16:51:30.870000', 'transfer', 'completed'),
	(83, 283, '2025-05-10 16:54:39.023000', 'transfer', 'completed'),
	(84, 284, '2025-05-10 16:55:10.789000', 'transfer', 'completed'),
	(85, 285, '2025-05-10 16:56:04.589000', 'transfer', 'completed'),
	(86, 286, '2025-05-10 16:56:31.622000', 'transfer', 'completed'),
	(87, 287, '2025-05-10 16:57:41.128000', 'cash', 'completed'),
	(88, 288, '2025-05-11 16:33:02.680000', 'cash', 'completed'),
	(89, 289, '2025-05-11 16:33:45.464000', 'transfer', 'completed'),
	(90, 290, '2025-05-11 16:34:52.843000', 'cash', 'completed'),
	(91, 291, '2025-05-11 23:33:00.540000', 'transfer', 'completed'),
	(92, 292, '2025-05-11 23:33:25.857000', 'cash', 'completed'),
	(93, 293, '2025-05-12 13:44:18.945000', 'transfer', 'completed'),
	(94, 294, '2025-05-12 22:33:45.353000', 'transfer', 'completed'),
	(95, 295, '2025-05-13 00:06:51.656000', 'cash', 'completed'),
	(96, 296, '2025-05-13 00:08:56.973000', 'transfer', 'completed'),
	(97, 297, '2025-05-13 00:13:44.743000', 'cash', 'completed'),
	(98, 298, '2025-05-13 00:16:35.579000', 'transfer', 'completed'),
	(99, 299, '2025-05-13 00:17:53.265000', 'cash', 'completed'),
	(100, 300, '2025-05-13 00:25:35.651000', 'cash', 'completed'),
	(101, 301, '2025-05-13 00:29:42.704000', 'transfer', 'completed'),
	(102, 302, '2025-05-13 00:31:51.031000', 'cash', 'completed'),
	(103, 303, '2025-05-13 00:34:53.284000', 'transfer', 'completed'),
	(104, 304, '2025-05-13 00:35:50.477000', 'cash', 'completed'),
	(105, 305, '2025-05-13 00:38:32.400000', 'transfer', 'completed'),
	(106, 306, '2025-05-13 00:39:21.678000', 'cash', 'completed'),
	(107, 307, '2025-05-13 01:20:05.721000', 'transfer', 'completed'),
	(108, 308, '2025-05-13 01:31:59.891000', 'transfer', 'completed'),
	(109, 309, '2025-05-13 01:57:52.890000', 'cash', 'completed');

-- Dumping structure for table coffee_t2k.product
CREATE TABLE IF NOT EXISTS `product` (
  `ID_Product` int NOT NULL AUTO_INCREMENT,
  `product_name` varchar(255) DEFAULT NULL,
  `price` double DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `Is_Available` tinyint(1) DEFAULT '1',
  `ID_Category` int DEFAULT NULL,
  PRIMARY KEY (`ID_Product`),
  KEY `ID_Category` (`ID_Category`),
  CONSTRAINT `FK5cxv31vuhc7v32omftlxa8k3c` FOREIGN KEY (`ID_Category`) REFERENCES `category` (`ID_Category`),
  CONSTRAINT `product_ibfk_1` FOREIGN KEY (`ID_Category`) REFERENCES `category` (`ID_Category`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.product: ~23 rows (approximately)
INSERT INTO `product` (`ID_Product`, `product_name`, `price`, `description`, `image`, `Is_Available`, `ID_Category`) VALUES
	(1, 'Espresso', 35000, 'Cà phê đậm đặc pha bằng cách ép nước qua hạt cà phê xay mịn', '1_a572645e-1c86-45ff-b251-d1f15e6e8011.jpg', 1, 1),
	(2, 'Cappuccino', 35000, 'Cà phê Espresso trộn với sữa nóng và bọt sữa', '2_64cd49bb-4469-475a-bc82-4fd0da357cd7.jpg', 1, 1),
	(3, 'Latte', 40000, 'Cà phê Espresso với nhiều sữa nóng và một ít bọt sữa', '3_827b8004-689e-419b-b8d1-dcca842a30c0.jpg', 1, 1),
	(4, 'Americano', 30000, 'Cà phê Espresso pha loãng với nước nóng', '4_a6266c21-f539-4efd-a5ef-327e42d80bf6.jpg', 1, 1),
	(5, 'Mocha', 45000, 'Cà phê Espresso với sữa nóng, socola và bọt sữa', '5_d33183bf-adec-4a43-ad15-f8a7ff23cdc1.jpg', 1, 1),
	(7, 'Trà đào', 35000, 'Trà đen pha với đào tươi và siro đào', '7_40099dde-5664-46c2-9e68-a17c12fafbc5.jpg', 1, 2),
	(8, 'Trà sữa', 30000, 'Trà sữa kem muối', '8_0088d818-ab60-4b4b-8727-bc5b29bec263.jpg', 1, 2),
	(10, 'Trà chanh', 25000, 'Trà đen với nước cốt chanh tươi', '10_2166fc2c-1d26-41c3-8559-876a29c7b595.png', 1, 2),
	(11, 'Bánh Mousse Gấu', 32000, 'Bánh mì giòn với pate gan', '11_9d3a325f-c73a-4a70-bdf3-5dab1f2e5669.jpg', 1, 3),
	(12, 'Croissant', 25000, 'Bánh croissant bơ truyền thống', '12_3e4810c1-ebda-4202-a936-becb3d01eed2.jpg', 1, 3),
	(14, 'Croissant Chà Bông', 32000, 'Bánh Croissant thơm ngon', '14_4102356a-86f2-47f2-acbf-646876a2048b.jpg', 1, 3),
	(17, 'Tiramisu', 45000, 'Bánh tiramisu với cà phê và phô mai mascarpone', '17_84a40fd2-4fb0-4523-aa07-abacde51ea33.jpg', 1, 4),
	(18, 'Cheesecake', 40000, 'Bánh phô mai mịn với đế bánh giòn', '18_7e602351-6ce9-4de4-a570-b30265aceb69.jpg', 1, 4),
	(19, 'Bánh cupcake', 30000, 'Bánh cupcake với kem tươi', '19_97368b96-8bbe-4a59-93ac-353911c9b316.jfif', 1, 4),
	(20, 'Panna Cotta', 35000, 'Tráng miệng Ý với kem tươi và sốt dâu', '20_20876433-5236-45e7-ad19-00b58cc21720.jpg', 1, 4),
	(21, 'Sinh tố xoài', 35000, 'Sinh tố xoài mát lạnh', '21_c2c3141e-f101-4a19-ba19-9d4c633cd148.jpg', 1, 5),
	(22, 'Sinh tố dâu', 40000, 'Sinh tố dâu tây tươi ngon', '22_76b1ef27-7b7d-48f6-8f78-09e7a7e7f718.jpg', 1, 5),
	(23, 'Sinh tố bơ', 45000, 'Sinh tố bơ béo ngậy', '23_d618f883-eeef-4f34-a7a6-d7476e12a0f9.jpg', 1, 5),
	(24, 'Sinh tố chuối', 35000, 'Sinh tố chuối mát lành', '24_827b6778-ee57-4b52-98ef-47030c44b6ea.jfif', 1, 5),
	(30, 'Frosty Caramel Arabica', 30000, '', '30_9a317ad8-000e-4750-92f9-2c3103638ea9.jpg', 1, 4),
	(31, 'Frosty Trà Xanh', 32000, '', '31_54133549-7a10-4756-8672-0e0ae02ba9e7.jpg', 1, 4),
	(44, 'Bạc xỉu nóng', 32000, 'Cà phê siêu thơm ngon', '44_b3e603d7-15af-4788-a97e-fc2d4b026083.jpg', 1, 1),
	(46, 'Cà phê bơ', 34000, 'Cà phê đen kết hợp bơ dẻo siêu ngon', '46_bd23839f-b0de-4095-a37c-a4fd86a28356.jpg', 1, 1),
	(47, 'Trà ô long tứ quý', 35000, 'Trà Oolong thượng hạng', '47_40d3832c-b2f4-413c-9749-c63c62496db2.jpg', 1, 2),
	(48, 'Trà Olong tứ quý', 35000, 'Trà ô long tứ quý với những hạt chân châu giòn', '48_18fefc72-23ce-4b85-a471-e8757b984475.jpg', 1, 2);

-- Dumping structure for table coffee_t2k.product_variants
CREATE TABLE IF NOT EXISTS `product_variants` (
  `id_variant` int NOT NULL AUTO_INCREMENT,
  `additional_price` double DEFAULT NULL,
  `display_order` int DEFAULT NULL,
  `is_default` bit(1) DEFAULT NULL,
  `variant_name` varchar(255) NOT NULL,
  `variant_type` varchar(255) NOT NULL,
  `variant_value` varchar(255) NOT NULL,
  `id_category` int DEFAULT NULL,
  `id_product` int DEFAULT NULL,
  PRIMARY KEY (`id_variant`),
  KEY `FKe56lper054yacdqpbcuchh7v0` (`id_category`),
  KEY `FK_product_variant_product` (`id_product`),
  CONSTRAINT `FK_product_variant_product` FOREIGN KEY (`id_product`) REFERENCES `product` (`ID_Product`),
  CONSTRAINT `FKe56lper054yacdqpbcuchh7v0` FOREIGN KEY (`id_category`) REFERENCES `category` (`ID_Category`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.product_variants: ~11 rows (approximately)
INSERT INTO `product_variants` (`id_variant`, `additional_price`, `display_order`, `is_default`, `variant_name`, `variant_type`, `variant_value`, `id_category`, `id_product`) VALUES
	(1, 0, 1, b'1', 'Size S', 'size', 'S', 1, NULL),
	(2, 5000, 2, b'0', 'Size M', 'size', 'M', 1, NULL),
	(3, 10000, 3, b'0', 'Size L', 'size', 'L', 1, NULL),
	(4, 0, 1, b'1', '100% đá', 'ice', '100', 1, NULL),
	(5, 0, 2, b'0', '70% đá', 'ice', '70', 1, NULL),
	(6, 0, 3, b'0', 'Không đá', 'ice', '0', 1, NULL),
	(7, 0, 1, b'1', '100% đường', 'sugar', '100', 1, NULL),
	(8, 0, 2, b'0', '50% đường', 'sugar', '50', 1, NULL),
	(9, 0, 3, b'0', 'Không đường', 'sugar', '0', 1, NULL),
	(10, 10000, 1, b'0', 'Trân châu đen', 'topping', 'tranchau', 1, NULL),
	(11, 15000, 2, b'0', 'Bánh flan', 'topping', 'flan', 1, NULL);

-- Dumping structure for table coffee_t2k.promotion
CREATE TABLE IF NOT EXISTS `promotion` (
  `ID_Promotion` int NOT NULL AUTO_INCREMENT,
  `Name_Promotion` varchar(255) DEFAULT NULL,
  `code` varchar(255) DEFAULT NULL,
  `Start_Date` date NOT NULL,
  `End_Date` date NOT NULL,
  `Is_Active` tinyint(1) DEFAULT '1',
  `discount_type` varchar(255) DEFAULT NULL,
  `discount_value` decimal(38,2) DEFAULT NULL,
  `minimum_order_amount` decimal(38,2) DEFAULT NULL,
  `maximum_discount` decimal(38,2) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID_Promotion`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.promotion: ~3 rows (approximately)
INSERT INTO `promotion` (`ID_Promotion`, `Name_Promotion`, `code`, `Start_Date`, `End_Date`, `Is_Active`, `discount_type`, `discount_value`, `minimum_order_amount`, `maximum_discount`, `description`) VALUES
	(1, 'Khuyễn mãi đặc biệt hè', 'SUMMER23', '2025-05-07', '2025-06-09', 1, 'PERCENT', 25.00, 30000.00, NULL, NULL),
	(2, 'Giảm giá 25% cho các loại đồ uống', 'THAGA25', '2025-05-07', '2025-06-09', 1, 'PERCENT', 30.00, 20000.00, NULL, NULL),
	(3, 'Khách Hàng Mới', 'BANMOI', '2025-05-07', '2025-06-09', 1, 'PERCENT', 80.00, 50000.00, NULL, NULL),
	(4, 'DAC BIET THANG 5', 'DACBIET', '2025-05-11', '2025-06-10', 1, 'PERCENT', 99.00, 0.00, NULL, NULL),
	(5, 'Khuyễn mãi hè 2025', 'HESOIDONG', '2025-05-13', '2026-05-13', 1, 'FIXED', 15000.00, 50000.00, NULL, NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

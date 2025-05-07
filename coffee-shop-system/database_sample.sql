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
  `image` tinyblob,
  `role` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active',
  PRIMARY KEY (`ID_Account`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.account: ~4 rows (approximately)
INSERT INTO `account` (`ID_Account`, `user_name`, `full_name`, `pass_word`, `phone`, `address`, `image`, `role`, `status`) VALUES
	(1, 'admin', 'Administrator', 'admin123', '0987654321', 'Hồ Chí Minh', NULL, 'Admin', 'active'),
	(2, 'staff', 'Staff User', 'admin123', '0123456789', 'Hồ Chí Minh', NULL, 'Staff', 'active'),
	(4, 'Thang', 'Thang Pham', 'admin123', '0326314436', 'Hồ Chí Minh', NULL, 'Admin', 'active'),
	(12, 'srgr', 'Nguyễn Lê Phương Trang', 'áefawerfw', '0794887919', 'số 37 đường 120 phường Tân Phú thủ đức thành phố hồ chí minh', NULL, 'Staff', 'active');

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
) ENGINE=InnoDB AUTO_INCREMENT=244 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.cafeorder: ~48 rows (approximately)
INSERT INTO `cafeorder` (`ID_Order`, `ID_Table`, `Quantity`, `order_time`, `total_amount`, `note`, `ID_Account`, `ID_Promotion`, `status`) VALUES
	(189, 4, NULL, '2025-05-02 21:39:15.015000', 210000.00, NULL, NULL, NULL, 'processing'),
	(190, 4, NULL, '2025-05-02 21:39:18.927000', 210000.00, '', NULL, NULL, 'processing'),
	(191, NULL, NULL, '2025-05-02 21:41:55.633000', 35000.00, NULL, NULL, NULL, 'processing'),
	(192, NULL, NULL, '2025-05-02 21:41:57.192000', 35000.00, '', NULL, NULL, 'processing'),
	(193, 10, NULL, '2025-05-02 21:42:14.177000', 60000.00, NULL, NULL, NULL, 'processing'),
	(194, 10, NULL, '2025-05-02 21:42:21.909000', 60000.00, '', NULL, NULL, 'processing'),
	(196, 3, NULL, '2025-05-02 21:44:09.613000', 35000.00, '', NULL, NULL, 'processing'),
	(197, 3, NULL, '2025-05-02 21:49:26.297000', 75000.00, NULL, NULL, NULL, 'processing'),
	(198, 6, NULL, '2025-05-02 21:49:52.332000', 160000.00, NULL, NULL, NULL, 'processing'),
	(199, 4, NULL, '2025-05-02 21:50:03.782000', 170000.00, NULL, NULL, NULL, 'processing'),
	(200, 4, NULL, '2025-05-03 00:03:18.488000', 155000.00, NULL, NULL, NULL, 'processing'),
	(201, 4, NULL, '2025-05-03 01:31:45.467000', 225000.00, '', NULL, NULL, 'processing'),
	(202, 5, NULL, '2025-05-03 20:29:29.526000', 30000.00, '', NULL, NULL, 'processing'),
	(203, 3, NULL, '2025-05-06 19:19:20.631000', 35000.00, '', NULL, NULL, 'processing'),
	(204, NULL, NULL, '2025-05-06 19:19:35.728000', 40000.00, '', NULL, NULL, 'processing'),
	(205, 3, NULL, '2025-05-07 01:46:16.558000', 180000.00, '', NULL, NULL, 'processing'),
	(206, 2, NULL, '2025-05-07 01:52:51.517000', 140000.00, '', NULL, NULL, 'processing'),
	(208, 2, NULL, '2025-05-07 16:16:38.557000', 275000.00, NULL, NULL, NULL, 'processing'),
	(209, 2, NULL, '2025-05-07 16:44:49.571000', 60000.00, NULL, NULL, NULL, 'processing'),
	(210, NULL, NULL, '2025-05-07 16:45:27.303000', 70000.00, NULL, NULL, NULL, 'processing'),
	(211, 11, NULL, '2025-05-07 16:58:45.571000', 180000.00, NULL, NULL, NULL, 'processing'),
	(212, 2, NULL, '2025-05-07 17:01:15.353000', 185000.00, NULL, NULL, NULL, 'processing'),
	(213, 1, NULL, '2025-05-07 17:05:02.877000', 150000.00, NULL, NULL, NULL, 'processing'),
	(214, 2, NULL, '2025-05-07 17:05:38.574000', 140000.00, NULL, NULL, NULL, 'processing'),
	(215, 2, NULL, '2025-05-07 17:09:07.872000', 150000.00, NULL, NULL, NULL, 'processing'),
	(216, 2, NULL, '2025-05-07 17:09:39.384000', 150000.00, NULL, NULL, NULL, 'processing'),
	(217, 2, NULL, '2025-05-07 17:13:59.878000', 140000.00, NULL, NULL, NULL, 'processing'),
	(218, 1, NULL, '2025-05-07 17:16:05.031000', 150000.00, NULL, NULL, NULL, 'processing'),
	(219, 7, NULL, '2025-05-07 18:20:04.707000', 150000.00, NULL, NULL, NULL, 'processing'),
	(220, 2, NULL, '2025-05-07 18:20:18.963000', 150000.00, NULL, NULL, NULL, 'processing'),
	(221, 3, NULL, '2025-05-07 18:23:06.846000', 150000.00, NULL, NULL, NULL, 'processing'),
	(222, 3, NULL, '2025-05-07 18:53:30.548000', 110000.00, NULL, NULL, NULL, 'processing'),
	(223, 7, NULL, '2025-05-07 18:54:07.450000', 110000.00, NULL, NULL, NULL, 'processing'),
	(224, 7, NULL, '2025-05-07 18:54:17.680000', 82500.00, '', NULL, NULL, 'processing'),
	(225, 3, NULL, '2025-05-07 18:54:52.859000', 300000.00, NULL, NULL, NULL, 'processing'),
	(226, 10, NULL, '2025-05-07 18:55:05.561000', 300000.00, NULL, NULL, NULL, 'processing'),
	(227, NULL, NULL, '2025-05-07 18:56:03.171000', 300000.00, NULL, NULL, NULL, 'processing'),
	(228, NULL, NULL, '2025-05-07 18:56:19.192000', 90000.00, NULL, NULL, NULL, 'processing'),
	(229, 7, NULL, '2025-05-07 18:56:33.879000', 67500.00, '', NULL, NULL, 'processing'),
	(230, NULL, NULL, '2025-05-07 18:57:21.556000', 159000.00, NULL, NULL, NULL, 'processing'),
	(231, 7, NULL, '2025-05-07 18:57:32.539000', 119250.00, '', NULL, NULL, 'processing'),
	(232, 2, NULL, '2025-05-07 18:58:28.101000', 280000.00, NULL, NULL, NULL, 'processing'),
	(233, 2, NULL, '2025-05-07 18:58:34.545000', 280000.00, NULL, NULL, NULL, 'processing'),
	(234, 7, NULL, '2025-05-07 18:58:51.442000', 210000.00, '', NULL, NULL, 'processing'),
	(235, 11, NULL, '2025-05-07 19:00:24.430000', 285000.00, NULL, NULL, NULL, 'processing'),
	(236, 3, NULL, '2025-05-07 19:03:36.370000', 213750.00, '', NULL, NULL, 'processing'),
	(237, NULL, NULL, '2025-05-07 19:04:30.685000', 318750.00, '', NULL, NULL, 'processing'),
	(238, 10, NULL, '2025-05-07 19:04:58.079000', 243750.00, '', NULL, NULL, 'processing'),
	(239, NULL, NULL, '2025-05-07 19:21:45.121000', 170000.00, '', NULL, NULL, 'processing'),
	(240, 3, NULL, '2025-05-07 19:45:45.998000', 168750.00, '', NULL, NULL, 'processing'),
	(241, 1, NULL, '2025-05-07 19:52:05.033000', 206250.00, '', NULL, NULL, 'processing'),
	(242, 1, NULL, '2025-05-07 19:57:00.226000', 100000.00, '', NULL, NULL, 'processing'),
	(243, 2, NULL, '2025-05-07 20:40:59.689000', 27200.00, '', NULL, NULL, 'processing');

-- Dumping structure for table coffee_t2k.cafetable
CREATE TABLE IF NOT EXISTS `cafetable` (
  `ID_Table` int NOT NULL AUTO_INCREMENT,
  `status` varchar(255) DEFAULT NULL,
  `Capacity` int NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `table_number` int DEFAULT NULL,
  PRIMARY KEY (`ID_Table`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.cafetable: ~10 rows (approximately)
INSERT INTO `cafetable` (`ID_Table`, `status`, `Capacity`, `location`, `table_number`) VALUES
	(1, 'Available', 3, 'First Floor', 1),
	(2, 'Available', 2, 'First Floor', 2),
	(3, 'Available', 4, 'Ground Floor', 3),
	(4, 'Reserved', 4, 'Ground Floor', 4),
	(5, 'Occupied', 7, 'Ground Floor', 5),
	(6, 'Occupied', 2, 'First Floor', 6),
	(7, 'Available', 4, 'First Floor', 7),
	(8, 'Cleaning', 8, 'First Floor', 8),
	(9, 'Occupied', 2, 'Outdoor', 9),
	(10, 'Available', 4, 'Outdoor', 10),
	(11, 'Available', 3, 'First Floor', 11);

-- Dumping structure for table coffee_t2k.category
CREATE TABLE IF NOT EXISTS `category` (
  `ID_Category` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID_Category`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.category: ~5 rows (approximately)
INSERT INTO `category` (`ID_Category`, `category_name`, `description`) VALUES
	(1, 'Coffee', 'Các loại cà phê nóng và lạnh'),
	(2, 'Tea', 'Các loại trà thơm ngon'),
	(3, 'Bakery', 'Các loại bánh mì và bánh ngọt'),
	(4, 'Dessert', 'Các loại tráng miệng ngọt ngào'),
	(5, 'Smoothie', 'Các loại sinh tố mát lạnh');

-- Dumping structure for table coffee_t2k.order_detail
CREATE TABLE IF NOT EXISTS `order_detail` (
  `ID_Product` int NOT NULL,
  `ID_Order` int NOT NULL,
  `Quantity` int NOT NULL,
  `unit_price` decimal(38,2) DEFAULT NULL,
  `subtotal` decimal(38,2) DEFAULT NULL,
  PRIMARY KEY (`ID_Product`,`ID_Order`),
  KEY `ID_Order` (`ID_Order`),
  CONSTRAINT `FKicrtfcntxfkyrnoaqh1croidl` FOREIGN KEY (`ID_Product`) REFERENCES `product` (`ID_Product`),
  CONSTRAINT `FKm1uk6ra8guu71ewavs00un4sd` FOREIGN KEY (`ID_Order`) REFERENCES `cafeorder` (`ID_Order`),
  CONSTRAINT `order_detail_ibfk_1` FOREIGN KEY (`ID_Product`) REFERENCES `product` (`ID_Product`),
  CONSTRAINT `order_detail_ibfk_2` FOREIGN KEY (`ID_Order`) REFERENCES `cafeorder` (`ID_Order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.order_detail: ~94 rows (approximately)
INSERT INTO `order_detail` (`ID_Product`, `ID_Order`, `Quantity`, `unit_price`, `subtotal`) VALUES
	(1, 198, 5, 25000.00, NULL),
	(1, 200, 2, 25000.00, NULL),
	(1, 211, 2, 35000.00, NULL),
	(1, 241, 1, 35000.00, NULL),
	(2, 189, 2, 35000.00, NULL),
	(2, 191, 1, 35000.00, NULL),
	(2, 197, 1, 35000.00, NULL),
	(2, 198, 1, 35000.00, NULL),
	(2, 200, 3, 35000.00, NULL),
	(2, 201, 3, 35000.00, NULL),
	(2, 210, 2, 35000.00, NULL),
	(2, 211, 2, 35000.00, NULL),
	(2, 212, 3, 35000.00, NULL),
	(2, 213, 2, 35000.00, NULL),
	(2, 215, 2, 35000.00, NULL),
	(2, 216, 2, 35000.00, NULL),
	(2, 218, 2, 35000.00, NULL),
	(2, 219, 2, 35000.00, NULL),
	(2, 220, 2, 35000.00, NULL),
	(2, 221, 2, 35000.00, NULL),
	(2, 238, 3, 35000.00, NULL),
	(2, 240, 3, 35000.00, NULL),
	(2, 241, 1, 35000.00, NULL),
	(3, 189, 2, 40000.00, NULL),
	(3, 197, 1, 40000.00, NULL),
	(3, 199, 2, 40000.00, NULL),
	(3, 201, 3, 40000.00, NULL),
	(3, 204, 1, 40000.00, NULL),
	(3, 205, 3, 40000.00, NULL),
	(3, 206, 2, 40000.00, NULL),
	(3, 211, 1, 40000.00, NULL),
	(3, 212, 2, 40000.00, NULL),
	(3, 213, 2, 40000.00, NULL),
	(3, 214, 2, 40000.00, NULL),
	(3, 215, 2, 40000.00, NULL),
	(3, 216, 2, 40000.00, NULL),
	(3, 217, 2, 40000.00, NULL),
	(3, 218, 2, 40000.00, NULL),
	(3, 219, 2, 40000.00, NULL),
	(3, 220, 2, 40000.00, NULL),
	(3, 221, 2, 40000.00, NULL),
	(3, 225, 6, 40000.00, NULL),
	(3, 226, 6, 40000.00, NULL),
	(3, 227, 6, 40000.00, NULL),
	(3, 237, 3, 40000.00, NULL),
	(3, 238, 4, 40000.00, NULL),
	(3, 239, 2, 40000.00, NULL),
	(3, 240, 3, 40000.00, NULL),
	(3, 242, 1, 40000.00, NULL),
	(4, 189, 2, 30000.00, NULL),
	(4, 199, 3, 30000.00, NULL),
	(4, 205, 2, 30000.00, NULL),
	(4, 206, 2, 30000.00, NULL),
	(4, 214, 2, 30000.00, NULL),
	(4, 217, 2, 30000.00, NULL),
	(4, 225, 2, 30000.00, NULL),
	(4, 226, 2, 30000.00, NULL),
	(4, 227, 2, 30000.00, NULL),
	(4, 228, 3, 30000.00, NULL),
	(4, 229, 3, 30000.00, NULL),
	(4, 238, 2, 30000.00, NULL),
	(4, 239, 3, 30000.00, NULL),
	(4, 242, 2, 30000.00, NULL),
	(5, 232, 4, 45000.00, NULL),
	(5, 233, 4, 45000.00, NULL),
	(5, 234, 4, 45000.00, NULL),
	(6, 193, 1, 25000.00, NULL),
	(6, 222, 3, 25000.00, NULL),
	(6, 223, 3, 25000.00, NULL),
	(6, 224, 3, 25000.00, NULL),
	(6, 232, 4, 25000.00, NULL),
	(6, 233, 4, 25000.00, NULL),
	(6, 234, 4, 25000.00, NULL),
	(6, 237, 8, 25000.00, NULL),
	(6, 241, 3, 25000.00, NULL),
	(7, 193, 1, 35000.00, NULL),
	(7, 203, 1, 35000.00, NULL),
	(7, 222, 1, 35000.00, NULL),
	(7, 223, 1, 35000.00, NULL),
	(7, 224, 1, 35000.00, NULL),
	(7, 237, 3, 35000.00, NULL),
	(7, 241, 2, 35000.00, NULL),
	(8, 209, 2, 30000.00, NULL),
	(8, 241, 2, 30000.00, NULL),
	(9, 230, 3, 28000.00, NULL),
	(9, 231, 3, 28000.00, NULL),
	(9, 235, 2, 28000.00, NULL),
	(9, 236, 2, 28000.00, NULL),
	(10, 230, 3, 25000.00, NULL),
	(10, 231, 3, 25000.00, NULL),
	(10, 235, 3, 25000.00, NULL),
	(10, 236, 3, 25000.00, NULL),
	(11, 243, 3, 52000.00, NULL),
	(14, 235, 2, 32000.00, NULL),
	(14, 236, 2, 32000.00, NULL),
	(17, 235, 2, 45000.00, NULL),
	(17, 236, 2, 45000.00, NULL),
	(19, 202, 1, 30000.00, NULL),
	(20, 208, 2, 35000.00, NULL),
	(21, 208, 3, 35000.00, NULL),
	(22, 208, 1, 40000.00, NULL),
	(30, 208, 2, 30000.00, NULL);

-- Dumping structure for table coffee_t2k.order_item_variant
CREATE TABLE IF NOT EXISTS `order_item_variant` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ID_Order` int NOT NULL,
  `ID_Product` int NOT NULL,
  `size` varchar(5) DEFAULT 'S',
  `ice_percent` varchar(10) DEFAULT '100',
  `sugar_percent` varchar(10) DEFAULT '100',
  `toppings` varchar(255) DEFAULT NULL,
  `additional_price` decimal(10,2) DEFAULT '0.00',
  `variant_note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ID_Order_Product` (`ID_Order`,`ID_Product`),
  CONSTRAINT `order_item_variant_ibfk_1` FOREIGN KEY (`ID_Order`, `ID_Product`) REFERENCES `order_detail` (`ID_Order`, `ID_Product`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.order_item_variant: ~0 rows (approximately)

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
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.payment: ~14 rows (approximately)
INSERT INTO `payment` (`ID_Payment`, `ID_Order`, `create_at`, `payment_method`, `payment_status`) VALUES
	(28, 190, '2025-05-02 21:39:18.927000', 'transfer', 'completed'),
	(29, 192, '2025-05-02 21:41:57.193000', 'cash', 'completed'),
	(30, 194, '2025-05-02 21:42:21.909000', 'cash', 'completed'),
	(31, 196, '2025-05-02 21:44:09.613000', 'transfer', 'completed'),
	(32, 224, '2025-05-07 18:54:17.683000', 'cash', 'pending'),
	(33, 229, '2025-05-07 18:56:33.880000', 'cash', 'pending'),
	(34, 231, '2025-05-07 18:57:32.540000', 'cash', 'pending'),
	(35, 234, '2025-05-07 18:58:51.444000', 'cash', 'pending'),
	(36, 236, '2025-05-07 19:03:36.371000', 'transfer', 'completed'),
	(37, 237, '2025-05-07 19:04:30.685000', 'transfer', 'completed'),
	(38, 238, '2025-05-07 19:04:58.081000', 'cash', 'pending'),
	(39, 239, '2025-05-07 19:21:45.121000', 'cash', 'pending'),
	(40, 240, '2025-05-07 19:45:45.999000', 'transfer', 'pending'),
	(41, 241, '2025-05-07 19:52:05.036000', 'transfer', 'pending'),
	(42, 242, '2025-05-07 19:57:00.228000', 'cash', 'pending'),
	(43, 243, '2025-05-07 20:40:59.689000', 'cash', 'pending');

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
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.product: ~23 rows (approximately)
INSERT INTO `product` (`ID_Product`, `product_name`, `price`, `description`, `image`, `Is_Available`, `ID_Category`) VALUES
	(1, 'Espresso', 35000, 'Cà phê đậm đặc pha bằng cách ép nước qua hạt cà phê xay mịn', '1_a572645e-1c86-45ff-b251-d1f15e6e8011.jpg', 1, 1),
	(2, 'Cappuccino', 35000, 'Cà phê Espresso trộn với sữa nóng và bọt sữa', '2_64cd49bb-4469-475a-bc82-4fd0da357cd7.jpg', 1, 1),
	(3, 'Latte', 40000, 'Cà phê Espresso với nhiều sữa nóng và một ít bọt sữa', '3_827b8004-689e-419b-b8d1-dcca842a30c0.jpg', 1, 1),
	(4, 'Americano', 30000, 'Cà phê Espresso pha loãng với nước nóng', '4_a6266c21-f539-4efd-a5ef-327e42d80bf6.jpg', 1, 1),
	(5, 'Mocha', 45000, 'Cà phê Espresso với sữa nóng, socola và bọt sữa', '5_ba59de10-9c47-45ba-be49-bf4e40f85454.jpg', 1, 1),
	(6, 'Trà xanh', 25000, 'Trà xanh nhật bản thanh mát', '6_4e74da3b-e788-47a2-aca8-3fa0e81653dc.jpg', 1, 2),
	(7, 'Trà đào', 35000, 'Trà đen pha với đào tươi và siro đào', '7_40099dde-5664-46c2-9e68-a17c12fafbc5.jpg', 1, 2),
	(8, 'Trà sữa', 30000, 'Trà đen với sữa đặc', '8_0088d818-ab60-4b4b-8727-bc5b29bec263.jpg', 1, 2),
	(9, 'Trà gừng', 28000, 'Trà đen ấm nóng với gừng tươi', '9_f710baf0-3b8b-49ba-945c-4bee49391efc.jpg', 1, 2),
	(10, 'Trà chanh', 25000, 'Trà đen với nước cốt chanh tươi', '10_2166fc2c-1d26-41c3-8559-876a29c7b595.png', 1, 2),
	(11, 'Bánh Mousse Gấu', 32000, 'Bánh mì giòn với pate gan', '11_9d3a325f-c73a-4a70-bdf3-5dab1f2e5669.jpg', 1, 3),
	(12, 'Croissant', 25000, 'Bánh croissant bơ truyền thống', '12_3e4810c1-ebda-4202-a936-becb3d01eed2.jpg', 1, 3),
	(14, 'Croissant Chà Bông', 32000, 'Bánh Croissant thơm ngon', '14_4102356a-86f2-47f2-acbf-646876a2048b.jpg', 1, 3),
	(17, 'Tiramisu', 45000, 'Bánh tiramisu với cà phê và phô mai mascarpone', '17_401274d8-c081-4004-b1cd-5030041c8c5f.jpg', 1, 4),
	(18, 'Cheesecake', 40000, 'Bánh phô mai mịn với đế bánh giòn', '18_7e602351-6ce9-4de4-a570-b30265aceb69.jpg', 1, 4),
	(19, 'Bánh cupcake', 30000, 'Bánh cupcake với kem tươi', '19_ee43340d-8688-4b16-9a9b-e2da2c47db2b.jfif', 1, 4),
	(20, 'Panna Cotta', 35000, 'Tráng miệng Ý với kem tươi và sốt dâu', '20_20876433-5236-45e7-ad19-00b58cc21720.jpg', 1, 4),
	(21, 'Sinh tố xoài', 35000, 'Sinh tố xoài mát lạnh', '21_c2c3141e-f101-4a19-ba19-9d4c633cd148.jpg', 1, 5),
	(22, 'Sinh tố dâu', 40000, 'Sinh tố dâu tây tươi ngon', '22_76b1ef27-7b7d-48f6-8f78-09e7a7e7f718.jpg', 1, 5),
	(23, 'Sinh tố bơ', 45000, 'Sinh tố bơ béo ngậy', '23_d618f883-eeef-4f34-a7a6-d7476e12a0f9.jpg', 1, 5),
	(24, 'Sinh tố chuối', 35000, 'Sinh tố chuối mát lành', '24_875193c9-6e3d-4924-bfa0-0c118480ee6e.jfif', 1, 5),
	(30, 'Frosty Caramel Arabica', 30000, '', '30_9a317ad8-000e-4750-92f9-2c3103638ea9.jpg', 1, 4),
	(31, 'Frosty Trà Xanh', 32000, '', '31_54133549-7a10-4756-8672-0e0ae02ba9e7.jpg', 1, 4);

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.promotion: ~3 rows (approximately)
INSERT INTO `promotion` (`ID_Promotion`, `Name_Promotion`, `code`, `Start_Date`, `End_Date`, `Is_Active`, `discount_type`, `discount_value`, `minimum_order_amount`, `maximum_discount`, `description`) VALUES
	(1, 'Khuyễn mãi đăch biệt hè', 'SUMMER23', '2025-05-07', '2025-06-09', 1, 'PERCENT', 25.00, 30000.00, NULL, NULL),
	(2, 'Giảm giá 25% cho các loại đồ uống', 'THAGA25', '2025-05-07', '2025-06-09', 1, 'PERCENT', 25.00, 20000.00, NULL, NULL),
	(3, 'Khách Hàng Mới', 'BANMOI', '2025-05-07', '2025-06-09', 1, 'PERCENT', 80.00, 50000.00, NULL, NULL);

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

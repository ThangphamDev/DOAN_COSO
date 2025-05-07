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
  PRIMARY KEY (`ID_Account`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.account: ~3 rows (approximately)
INSERT INTO `account` (`ID_Account`, `user_name`, `full_name`, `pass_word`, `phone`, `address`, `image`, `role`) VALUES
	(1, 'admin', 'Administrator', 'admin123', '0987654321', 'Hồ Chí Minh', NULL, 'Admin'),
	(2, 'staff', 'Staff User', 'staff123', '0123456789', 'Hồ Chí Minh', NULL, 'Staff'),
	(3, 'customer', 'Customer User', 'customer123', '0123498765', 'Hồ Chí Minh', NULL, 'Customer'),
	(4, 'Thang', 'Thang Pham', 'Thang09876', '0326314436', NULL, NULL, 'Admin');

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
) ENGINE=InnoDB AUTO_INCREMENT=203 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.cafeorder: ~13 rows (approximately)
INSERT INTO `cafeorder` (`ID_Order`, `ID_Table`, `Quantity`, `order_time`, `total_amount`, `note`, `ID_Account`, `ID_Promotion`, `status`) VALUES
	(187, 3, NULL, '2025-05-02 21:38:48.767000', 75000.00, NULL, NULL, NULL, 'processing'),
	(188, 3, NULL, '2025-05-02 21:38:54.542000', 75000.00, '', NULL, NULL, 'processing'),
	(189, 4, NULL, '2025-05-02 21:39:15.015000', 210000.00, NULL, NULL, NULL, 'processing'),
	(190, 4, NULL, '2025-05-02 21:39:18.927000', 210000.00, '', NULL, NULL, 'processing'),
	(191, NULL, NULL, '2025-05-02 21:41:55.633000', 35000.00, NULL, NULL, NULL, 'processing'),
	(192, NULL, NULL, '2025-05-02 21:41:57.192000', 35000.00, '', NULL, NULL, 'processing'),
	(193, 10, NULL, '2025-05-02 21:42:14.177000', 60000.00, NULL, NULL, NULL, 'processing'),
	(194, 10, NULL, '2025-05-02 21:42:21.909000', 60000.00, '', NULL, NULL, 'processing'),
	(195, 3, NULL, '2025-05-02 21:44:05.743000', 35000.00, NULL, NULL, NULL, 'processing'),
	(196, 3, NULL, '2025-05-02 21:44:09.613000', 35000.00, '', NULL, NULL, 'processing'),
	(197, 3, NULL, '2025-05-02 21:49:26.297000', 75000.00, NULL, NULL, NULL, 'processing'),
	(198, 6, NULL, '2025-05-02 21:49:52.332000', 160000.00, NULL, NULL, NULL, 'processing'),
	(199, 4, NULL, '2025-05-02 21:50:03.782000', 170000.00, NULL, NULL, NULL, 'processing'),
	(200, 4, NULL, '2025-05-03 00:03:18.488000', 155000.00, NULL, NULL, NULL, 'processing'),
	(201, 4, NULL, '2025-05-03 01:31:45.467000', 225000.00, NULL, NULL, NULL, 'processing'),
	(202, 5, NULL, '2025-05-03 20:29:29.526000', 30000.00, NULL, NULL, NULL, 'processing');

-- Dumping structure for table coffee_t2k.cafetable
CREATE TABLE IF NOT EXISTS `cafetable` (
  `ID_Table` int NOT NULL AUTO_INCREMENT,
  `status` varchar(255) DEFAULT NULL,
  `Capacity` int NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `table_number` int DEFAULT NULL,
  PRIMARY KEY (`ID_Table`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.cafetable: ~10 rows (approximately)
INSERT INTO `cafetable` (`ID_Table`, `status`, `Capacity`, `location`, `table_number`) VALUES
	(1, 'Available', 2, 'Ground Floor', 1),
	(2, 'Available', 2, 'Ground Floor', 2),
	(3, 'Available', 4, 'Ground Floor', 3),
	(4, 'Available', 4, 'Ground Floor', 4),
	(5, 'Available', 6, 'Ground Floor', 5),
	(6, 'Available', 2, 'First Floor', 6),
	(7, 'Available', 4, 'First Floor', 7),
	(8, 'Available', 8, 'First Floor', 8),
	(9, 'Available', 2, 'Outdoor', 9),
	(10, 'Available', 4, 'Outdoor', 10);

-- Dumping structure for table coffee_t2k.category
CREATE TABLE IF NOT EXISTS `category` (
  `ID_Category` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ID_Category`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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

-- Dumping data for table coffee_t2k.order_detail: ~18 rows (approximately)
INSERT INTO `order_detail` (`ID_Product`, `ID_Order`, `Quantity`, `unit_price`, `subtotal`) VALUES
	(1, 198, 5, 25000.00, NULL),
	(1, 200, 2, 25000.00, NULL),
	(2, 187, 1, 35000.00, NULL),
	(2, 189, 2, 35000.00, NULL),
	(2, 191, 1, 35000.00, NULL),
	(2, 195, 1, 35000.00, NULL),
	(2, 197, 1, 35000.00, NULL),
	(2, 198, 1, 35000.00, NULL),
	(2, 200, 3, 35000.00, NULL),
	(2, 201, 3, 35000.00, NULL),
	(3, 187, 1, 40000.00, NULL),
	(3, 189, 2, 40000.00, NULL),
	(3, 197, 1, 40000.00, NULL),
	(3, 199, 2, 40000.00, NULL),
	(3, 201, 3, 40000.00, NULL),
	(4, 189, 2, 30000.00, NULL),
	(4, 199, 3, 30000.00, NULL),
	(6, 193, 1, 25000.00, NULL),
	(7, 193, 1, 35000.00, NULL),
	(19, 202, 1, 30000.00, NULL);

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
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.payment: ~5 rows (approximately)
INSERT INTO `payment` (`ID_Payment`, `ID_Order`, `create_at`, `payment_method`, `payment_status`) VALUES
	(27, 188, '2025-05-02 21:38:54.543000', 'transfer', 'completed'),
	(28, 190, '2025-05-02 21:39:18.927000', 'transfer', 'completed'),
	(29, 192, '2025-05-02 21:41:57.193000', 'cash', 'completed'),
	(30, 194, '2025-05-02 21:42:21.909000', 'cash', 'completed'),
	(31, 196, '2025-05-02 21:44:09.613000', 'transfer', 'completed');

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
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.product: ~25 rows (approximately)
INSERT INTO `product` (`ID_Product`, `product_name`, `price`, `description`, `image`, `Is_Available`, `ID_Category`) VALUES
	(1, 'Espresso', 25000, 'Cà phê đậm đặc pha bằng cách ép nước qua hạt cà phê xay mịn', _binary 0x315f38623433373465302d626639332d346333332d616565352d3361643438323434376265362e6a7067, 0, 1),
	(2, 'Cappuccino', 35000, 'Cà phê Espresso trộn với sữa nóng và bọt sữa', _binary 0x325f36346364343962622d343436392d343735612d626338322d3466643064613335376364372e6a7067, 1, 1),
	(3, 'Latte', 40000, 'Cà phê Espresso với nhiều sữa nóng và một ít bọt sữa', _binary 0x335f38323762383030342d363839652d343139622d623864312d6463636138343261333063302e6a7067, 1, 1),
	(4, 'Americano', 30000, 'Cà phê Espresso pha loãng với nước nóng', _binary 0x345f61363236366332312d663533392d346566642d613565662d3332376534326438306266362e6a7067, 1, 1),
	(5, 'Mocha', 45000, 'Cà phê Espresso với sữa nóng, socola và bọt sữa', NULL, 1, 1),
	(6, 'Trà xanh', 25000, 'Trà xanh nhật bản thanh mát', _binary 0x365f34653734646133622d653738382d343761322d616361382d3366613065383136353364632e6a7067, 1, 2),
	(7, 'Trà đào', 35000, 'Trà đen pha với đào tươi và siro đào', _binary 0x375f34303039396464652d353636342d343663322d396536382d6131376331326661666263352e6a7067, 1, 2),
	(8, 'Trà sữa', 30000, 'Trà đen với sữa đặc', NULL, 1, 2),
	(9, 'Trà gừng', 28000, 'Trà đen ấm nóng với gừng tươi', NULL, 1, 2),
	(10, 'Trà chanh', 25000, 'Trà đen với nước cốt chanh tươi', NULL, 1, 2),
	(11, 'Bánh mì pate', 20000, 'Bánh mì giòn với pate gan', NULL, 1, 3),
	(12, 'Croissant', 25000, 'Bánh croissant bơ truyền thống', NULL, 1, 3),
	(13, 'Bánh Danish', 30000, 'Bánh Danish với nhân kem phô mai', NULL, 1, 3),
	(14, 'Bánh sừng bò', 22000, 'Bánh sừng bò với socola', NULL, 1, 3),
	(15, 'Bánh mì que', 15000, 'Bánh mì que giòn rụm', NULL, 1, 3),
	(16, 'Bánh flan', 25000, 'Bánh flan mềm mịn với caramel', NULL, 1, 4),
	(17, 'Tiramisu', 45000, 'Bánh tiramisu với cà phê và phô mai mascarpone', NULL, 1, 4),
	(18, 'Cheesecake', 40000, 'Bánh phô mai mịn với đế bánh giòn', NULL, 1, 4),
	(19, 'Bánh cupcake', 30000, 'Bánh cupcake với kem tươi', NULL, 1, 4),
	(20, 'Panna Cotta', 35000, 'Tráng miệng Ý với kem tươi và sốt dâu', NULL, 1, 4),
	(21, 'Sinh tố xoài', 35000, 'Sinh tố xoài mát lạnh', NULL, 1, 5),
	(22, 'Sinh tố dâu', 40000, 'Sinh tố dâu tây tươi ngon', NULL, 1, 5),
	(23, 'Sinh tố bơ', 45000, 'Sinh tố bơ béo ngậy', NULL, 1, 5),
	(24, 'Sinh tố chuối', 35000, 'Sinh tố chuối mát lành', NULL, 1, 5),
	(25, 'Sinh tố dứa', 35000, 'Sinh tố dứa giải nhiệt', NULL, 1, 5);

-- Dumping structure for table coffee_t2k.promotion
CREATE TABLE IF NOT EXISTS `promotion` (
  `ID_Promotion` int NOT NULL AUTO_INCREMENT,
  `name_promotion` varchar(255) DEFAULT NULL,
  `code` varchar(255) DEFAULT NULL,
  `Start_Date` date NOT NULL,
  `End_Date` date NOT NULL,
  `Is_Active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`ID_Promotion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.promotion: ~0 rows (approximately)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;

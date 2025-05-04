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
  `User_Name` varchar(100) NOT NULL,
  `Full_Name` varchar(100) NOT NULL,
  `Pass_Word` varchar(100) NOT NULL,
  `Phone` varchar(20) DEFAULT NULL,
  `Address` text,
  `Image` longblob,
  `Role` varchar(50) NOT NULL,
  PRIMARY KEY (`ID_Account`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.account: ~0 rows (approximately)

-- Dumping structure for table coffee_t2k.cafeorder
CREATE TABLE IF NOT EXISTS `cafeorder` (
  `ID_Order` int NOT NULL AUTO_INCREMENT,
  `ID_Table` int DEFAULT NULL,
  `Quantity` int DEFAULT NULL,
  `Order_Time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Total_Amount` decimal(12,2) DEFAULT NULL,
  `Note` text,
  `ID_Account` int DEFAULT NULL,
  `ID_Promotion` int DEFAULT NULL,
  PRIMARY KEY (`ID_Order`),
  KEY `ID_Table` (`ID_Table`),
  KEY `ID_Account` (`ID_Account`),
  KEY `ID_Promotion` (`ID_Promotion`),
  CONSTRAINT `cafeorder_ibfk_1` FOREIGN KEY (`ID_Table`) REFERENCES `cafetable` (`ID_Table`),
  CONSTRAINT `cafeorder_ibfk_2` FOREIGN KEY (`ID_Account`) REFERENCES `account` (`ID_Account`),
  CONSTRAINT `cafeorder_ibfk_3` FOREIGN KEY (`ID_Promotion`) REFERENCES `promotion` (`ID_Promotion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.cafeorder: ~0 rows (approximately)

-- Dumping structure for table coffee_t2k.cafetable
CREATE TABLE IF NOT EXISTS `cafetable` (
  `ID_Table` int NOT NULL AUTO_INCREMENT,
  `Status` varchar(50) NOT NULL,
  `Capacity` int NOT NULL,
  `Location` varchar(100) NOT NULL,
  PRIMARY KEY (`ID_Table`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.cafetable: ~0 rows (approximately)

-- Dumping structure for table coffee_t2k.category
CREATE TABLE IF NOT EXISTS `category` (
  `ID_Category` int NOT NULL AUTO_INCREMENT,
  `Category_Name` varchar(100) NOT NULL,
  `Description` text,
  PRIMARY KEY (`ID_Category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.category: ~0 rows (approximately)

-- Dumping structure for table coffee_t2k.order_detail
CREATE TABLE IF NOT EXISTS `order_detail` (
  `ID_Product` int NOT NULL,
  `ID_Order` int NOT NULL,
  `Quantity` int NOT NULL,
  `Unit_Price` decimal(10,2) NOT NULL,
  `Subtotal` decimal(10,2) GENERATED ALWAYS AS ((`Quantity` * `Unit_Price`)) STORED,
  PRIMARY KEY (`ID_Product`,`ID_Order`),
  KEY `ID_Order` (`ID_Order`),
  CONSTRAINT `order_detail_ibfk_1` FOREIGN KEY (`ID_Product`) REFERENCES `product` (`ID_Product`),
  CONSTRAINT `order_detail_ibfk_2` FOREIGN KEY (`ID_Order`) REFERENCES `cafeorder` (`ID_Order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.order_detail: ~0 rows (approximately)

-- Dumping structure for table coffee_t2k.payment
CREATE TABLE IF NOT EXISTS `payment` (
  `ID_Payment` int NOT NULL AUTO_INCREMENT,
  `ID_Order` int DEFAULT NULL,
  `Create_At` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Payment_Method` varchar(50) NOT NULL,
  `Payment_Status` varchar(50) NOT NULL,
  PRIMARY KEY (`ID_Payment`),
  KEY `ID_Order` (`ID_Order`),
  CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`ID_Order`) REFERENCES `cafeorder` (`ID_Order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.payment: ~0 rows (approximately)

-- Dumping structure for table coffee_t2k.product
CREATE TABLE IF NOT EXISTS `product` (
  `ID_Product` int NOT NULL AUTO_INCREMENT,
  `Product_Name` varchar(100) NOT NULL,
  `Price` decimal(10,2) NOT NULL,
  `Description` text,
  `Image` longblob,
  `Is_Available` tinyint(1) DEFAULT '1',
  `ID_Category` int DEFAULT NULL,
  PRIMARY KEY (`ID_Product`),
  KEY `ID_Category` (`ID_Category`),
  CONSTRAINT `product_ibfk_1` FOREIGN KEY (`ID_Category`) REFERENCES `category` (`ID_Category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table coffee_t2k.product: ~0 rows (approximately)

-- Dumping structure for table coffee_t2k.promotion
CREATE TABLE IF NOT EXISTS `promotion` (
  `ID_Promotion` int NOT NULL AUTO_INCREMENT,
  `Name_Promotion` varchar(100) NOT NULL,
  `Code` varchar(50) NOT NULL,
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

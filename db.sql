-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: localhost    Database: home_blueprint
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT INTO `admin_users` VALUES (1,'mifsal2121@gmail.com','MifSal100#','2026-05-05 20:30:25');
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(255) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('Success','Failed','Pending') DEFAULT 'Pending',
  `email_sent` tinyint(1) DEFAULT '0',
  `order_id` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'Saran T','saran17sakthi@gmail.com','9499954810',599.00,'Success',0,'order_SfLS68de7qcQlm','2026-04-19 12:05:14'),(2,'Saran T','saran17sakthi@gmail.com','9499954810',399.00,'Pending',0,'order_SfLxpvvKuNo2pa','2026-04-19 12:35:17'),(3,'Saran T','saran17sakthi@gmail.com','9499954810',200.00,'Success',0,'order_SfPdFK910ACYpN','2026-04-19 16:10:37'),(4,'Saran T','saran07dhoni@gmail.com','9499954810',200.00,'Success',0,'order_SfPlgS0ca1eq7v','2026-04-19 16:18:36'),(5,'Saran T','saran07dhoni@gmail.com','9499954810',200.00,'Success',0,'order_SfPpMyQovlZE5B','2026-04-19 16:22:05'),(6,'Saran T','saran17sakthi@gmail.com','9499954810',200.00,'Success',0,'order_SfPsMWmaE8wDdk','2026-04-19 16:24:55'),(7,'Saran T','saran17sakthi@gmail.com','9499954810',200.00,'Success',1,'order_SfQ5BamOXyDRSL','2026-04-19 16:37:04'),(8,'Saran T','saran17sakthi@gmail.com','9499954810',200.00,'Success',1,'order_SljzF1LMNZLJHW','2026-05-05 15:59:19'),(9,'Saran T','saran17sakthi@gmail.com','9499954810',200.00,'Success',1,'order_Slk6p7k8WZJ48E','2026-05-05 16:06:30'),(10,'Saran T','saran17sakthi@gmail.com','9499954810',200.00,'Success',1,'order_Slkabb1zHSY8Md','2026-05-05 16:34:41');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `razorpay_orders`
--

DROP TABLE IF EXISTS `razorpay_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `razorpay_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` varchar(100) NOT NULL,
  `payment_id` varchar(100) DEFAULT NULL,
  `customer_name` varchar(150) NOT NULL,
  `email` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('Success','Failed','Pending') DEFAULT 'Pending',
  `method` varchar(50) DEFAULT NULL,
  `customer_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `razorpay_orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `razorpay_orders`
--

LOCK TABLES `razorpay_orders` WRITE;
/*!40000 ALTER TABLE `razorpay_orders` DISABLE KEYS */;
INSERT INTO `razorpay_orders` VALUES (1,'order_SfLS68de7qcQlm','pay_SfLSlBe7iwD1SH','Saran T','saran17sakthi@gmail.com',599.00,'Success','UPI',1,'2026-04-19 12:05:14'),(2,'order_SfLxpvvKuNo2pa','','Saran T','saran17sakthi@gmail.com',399.00,'Pending','',2,'2026-04-19 12:35:17'),(3,'order_SfPdFK910ACYpN','pay_SfPeWO1Bm92Mb0','Saran T','saran17sakthi@gmail.com',200.00,'Success','UPI',3,'2026-04-19 16:10:37'),(4,'order_SfPlgS0ca1eq7v','pay_SfPmDgkEGLkupF','Saran T','saran07dhoni@gmail.com',200.00,'Success','UPI',4,'2026-04-19 16:18:36'),(5,'order_SfPpMyQovlZE5B','pay_SfPpXD8u5zbJ3d','Saran T','saran07dhoni@gmail.com',200.00,'Success','UPI',5,'2026-04-19 16:22:05'),(6,'order_SfPsMWmaE8wDdk','pay_SfPsXK2Y10PDT7','Saran T','saran17sakthi@gmail.com',200.00,'Success','UPI',6,'2026-04-19 16:24:55'),(7,'order_SfQ5BamOXyDRSL','pay_SfQ5KiAmM4v2E3','Saran T','saran17sakthi@gmail.com',200.00,'Success','UPI',7,'2026-04-19 16:37:04'),(8,'order_SljzF1LMNZLJHW','pay_SljzXp2SogdDfy','Saran T','saran17sakthi@gmail.com',200.00,'Success','UPI',8,'2026-05-05 15:59:19'),(9,'order_Slk6p7k8WZJ48E','pay_Slk6uaFoXbJ4VY','Saran T','saran17sakthi@gmail.com',200.00,'Success','UPI',9,'2026-05-05 16:06:30'),(10,'order_Slkabb1zHSY8Md','pay_SlkahXarmzi2kP','Saran T','saran17sakthi@gmail.com',200.00,'Success','UPI',10,'2026-05-05 16:34:41');
/*!40000 ALTER TABLE `razorpay_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_order_photos`
--

DROP TABLE IF EXISTS `service_order_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_order_photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` varchar(100) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `sop_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `service_orders` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_order_photos`
--

LOCK TABLES `service_order_photos` WRITE;
/*!40000 ALTER TABLE `service_order_photos` DISABLE KEYS */;
INSERT INTO `service_order_photos` VALUES (1,'order_SlPi3JRPQPdVaB','ace66b498ac3c5c33370353e05a07fcb.png','HCB_Logo_Light-removebg-preview2.png','2026-05-04 20:09:07'),(2,'order_SlPi3JRPQPdVaB','7029a175e2f8d41170d8dc8e251294f9.png','HCB_Logo_Light-removebg-preview.png','2026-05-04 20:09:07'),(3,'order_SlPi3JRPQPdVaB','9ba1ac01ae050e22405ea25659dcc52f.png','HCB_Logo_Dark.png','2026-05-04 20:09:07'),(4,'order_SlQ6klWqJow3xW','aaaf4e00fa85c65a641ba119c23e7a72.jpeg','WhatsApp Image 2026-05-01 at 11.07.14 AM.jpeg','2026-05-04 20:32:30'),(5,'order_SlQ6klWqJow3xW','6a807a952c78b8f7c2a4dad570e4f0fe.png','WhatsApp_Image_2026-05-01_at_1.24.07_PM-removebg-preview.png','2026-05-04 20:32:30'),(6,'order_SlQ6klWqJow3xW','23bde50db6870c4bd5bd65a8723fb419.jpeg','WhatsApp Image 2026-05-01 at 11.07.13 AM.jpeg','2026-05-04 20:32:30'),(7,'order_SlQELdeeZERzTK','26153811be6c56e9dc3bf1c5aa1255e0.jpeg','home.jpeg','2026-05-04 20:39:41'),(8,'order_SlQELdeeZERzTK','fb73bd637fa0f3d59f6cb52e1200ede0.jpeg','office.jpeg','2026-05-04 20:39:41'),(9,'order_SlQELdeeZERzTK','24f9f1846a7cc5c84dcda618ec3f30e3.jpeg','WhatsApp Image 2026-04-15 at 8.06.25 PM.jpeg','2026-05-04 20:39:41'),(10,'order_SlQGN2k3Jxz2XW','ae593b24539b25056388e1711f1a0ef0.png','HCB_Logo_Light-removebg-preview.png','2026-05-04 20:41:36'),(11,'order_SlQGN2k3Jxz2XW','d3728c67e9d51d1bfc0b9e36ce1a8813.png','HCB_Logo_Dark.png','2026-05-04 20:41:36'),(12,'order_SlQGN2k3Jxz2XW','0dde87d6bd82aa29b0b415fd524ad0f5.png','HCB_Logo_Light.png','2026-05-04 20:41:36'),(13,'order_SlQKJ3w2dGlMRa','f2a357ff3e8f3b4323eb4907f8cff58d.png','HCB_Logo_Light-removebg-preview.png','2026-05-04 20:45:20'),(14,'order_SlQKJ3w2dGlMRa','9d519074841d6d91347bd3d95de97acc.png','HCB_Logo_Dark.png','2026-05-04 20:45:20'),(15,'order_SlQKJ3w2dGlMRa','4a40a9fe1c4d9ebcfdca277d1d0ddc26.png','HCB_Logo_Light.png','2026-05-04 20:45:20'),(16,'order_Slkl9bgB153moI','09a778f82dcfca5ab0c56cdc67f114f9.png','HCB_Logo_Light-removebg-preview2.png','2026-05-05 16:44:41'),(17,'order_Slkl9bgB153moI','6f8f13317572ef52a78f7edc3ae0ff37.png','HCB_Logo_Light-removebg-preview.png','2026-05-05 16:44:41'),(18,'order_Slkl9bgB153moI','b6bb776b661bd357fef375cb19901409.png','HCB_Logo_Dark.png','2026-05-05 16:44:41');
/*!40000 ALTER TABLE `service_order_photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_orders`
--

DROP TABLE IF EXISTS `service_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` varchar(100) NOT NULL,
  `payment_id` varchar(100) DEFAULT NULL,
  `plan` enum('elevation','floorplan','interior') NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `email` varchar(255) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('Success','Failed','Pending') DEFAULT 'Pending',
  `email_sent` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `method` varchar(50) DEFAULT 'UPI',
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_orders`
--

LOCK TABLES `service_orders` WRITE;
/*!40000 ALTER TABLE `service_orders` DISABLE KEYS */;
INSERT INTO `service_orders` VALUES (1,'order_SlPi3JRPQPdVaB',NULL,'elevation','Saran T','saran17sakthi@gmail.com','9499954810',99.00,'Pending',1,'2026-05-04 20:09:07','UPI'),(2,'order_SlQ6klWqJow3xW','pay_SlQ7nHkTi8jg8A','interior','Saran T','saran17sakthi@gmail.com','9499954810',999.00,'Success',0,'2026-05-04 20:32:30','UPI'),(3,'order_SlQELdeeZERzTK','pay_SlQEWWsXqFwx74','floorplan','T','saran17sakthi@gmail.com','9499954810',999.00,'Success',0,'2026-05-04 20:39:41','UPI'),(4,'order_SlQGN2k3Jxz2XW',NULL,'elevation','Saran T','saran17sakthi@gmail.com','9499954810',99.00,'Pending',0,'2026-05-04 20:41:36',''),(5,'order_SlQKJ3w2dGlMRa','pay_SlQKNrcEefSFM7','elevation','Saran T','saran17sakthi@gmail.com','9499954810',99.00,'Success',0,'2026-05-04 20:45:20','UPI'),(6,'order_Slkl9bgB153moI','pay_SlklEQlLVY1PkJ','elevation','Saran T','saran17sakthi@gmail.com','9499954810',99.00,'Success',0,'2026-05-05 16:44:41','UPI');
/*!40000 ALTER TABLE `service_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_settings`
--

DROP TABLE IF EXISTS `service_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_settings` (
  `plan` enum('elevation','floorplan','interior') NOT NULL,
  `mrp` decimal(10,2) NOT NULL,
  `offer` decimal(10,2) NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`plan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_settings`
--

LOCK TABLES `service_settings` WRITE;
/*!40000 ALTER TABLE `service_settings` DISABLE KEYS */;
INSERT INTO `service_settings` VALUES ('elevation',1999.00,1.00,'2026-05-05 20:35:56'),('floorplan',1999.00,1.00,'2026-05-05 20:35:56'),('interior',1999.00,1.00,'2026-05-05 20:35:56');
/*!40000 ALTER TABLE `service_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `id` int NOT NULL DEFAULT '1',
  `original_price` decimal(10,2) NOT NULL,
  `discount_price` decimal(10,2) NOT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `single_row` CHECK ((`id` = 1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,1999.00,1.00,'2026-05-05 20:35:51');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-06  2:09:27

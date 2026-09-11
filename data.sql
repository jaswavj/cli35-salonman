/*
SQLyog Community v13.3.1 (64 bit)
MySQL - 8.4.7 : Database - salonman
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`salonman` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `salonman`;

/*Table structure for table `attendance` */

DROP TABLE IF EXISTS `attendance`;

CREATE TABLE `attendance` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `punch_type` varchar(10) NOT NULL,
  `notes` text,
  `shop_id` varchar(255) DEFAULT NULL,
  `uid` int DEFAULT NULL,
  `punch_date` date DEFAULT NULL,
  `punch_time` time DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `attendance` */

/*Table structure for table `company_details` */

DROP TABLE IF EXISTS `company_details`;

CREATE TABLE `company_details` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `shop_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `address` text,
  `gstin` varchar(255) DEFAULT NULL,
  `print_type` int NOT NULL DEFAULT '0',
  `printer_name` varchar(255) DEFAULT NULL,
  `bank_details` varchar(255) DEFAULT NULL,
  `barcode_printer` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `company_details` */

insert  into `company_details`(`id`,`shop_name`,`address`,`gstin`,`print_type`,`printer_name`,`bank_details`,`barcode_printer`) values 
(2,'THE SALOON MAN','CHENNAI','',2,'','Bank Details','AP4909');

/*Table structure for table `customer_account` */

DROP TABLE IF EXISTS `customer_account`;

CREATE TABLE `customer_account` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `advance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `customer_account` */

/*Table structure for table `customers` */

DROP TABLE IF EXISTS `customers`;

CREATE TABLE `customers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phone_number` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `time` time DEFAULT NULL,
  `is_eligible_for_commission` tinyint DEFAULT '1',
  `is_active` int DEFAULT '1',
  `gstin` varchar(255) DEFAULT NULL,
  `is_gst` int DEFAULT '0',
  `salesman` int DEFAULT NULL,
  `area` int DEFAULT NULL,
  `credit_limit` double(10,2) NOT NULL DEFAULT '0.00',
  `local` int DEFAULT '1',
  `exchange_point` double(10,3) DEFAULT '0.000',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `customers` */

/*Table structure for table `expense_entry` */

DROP TABLE IF EXISTS `expense_entry`;

CREATE TABLE `expense_entry` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `exp_type` int NOT NULL,
  `content` varchar(255) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` text,
  `exc_date_time` datetime DEFAULT NULL,
  `entry_date_time` datetime DEFAULT NULL,
  `is_active` int DEFAULT '1',
  `uid` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `type` (`exp_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `expense_entry` */

/*Table structure for table `expense_type` */

DROP TABLE IF EXISTS `expense_type`;

CREATE TABLE `expense_type` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(255) NOT NULL,
  `is_active` int DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `expense_type` */

/*Table structure for table `incentives` */

DROP TABLE IF EXISTS `incentives`;

CREATE TABLE `incentives` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `shop_id` varchar(255) NOT NULL,
  `uid` int NOT NULL,
  `target_amount` decimal(12,2) NOT NULL,
  `compare_type` varchar(20) NOT NULL,
  `incentive_mode` varchar(20) NOT NULL,
  `incentive_value` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `incentives` */

insert  into `incentives`(`id`,`shop_id`,`uid`,`target_amount`,`compare_type`,`incentive_mode`,`incentive_value`) values 
(1,'S01',1,100.00,'gt','percent',10.00);

/*Table structure for table `outlets` */

DROP TABLE IF EXISTS `outlets`;

CREATE TABLE `outlets` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `shop_id` varchar(255) NOT NULL,
  `shop_name` varchar(255) NOT NULL,
  `Address` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `outlets` */

insert  into `outlets`(`id`,`shop_id`,`shop_name`,`Address`) values 
(1,'S01','Chennai1','Nagercoil'),
(2,'S02','Chennai2','Chennai'),
(3,'S03','Mylapore','Mylapore');

/*Table structure for table `quick_bill_logs` */

DROP TABLE IF EXISTS `quick_bill_logs`;

CREATE TABLE `quick_bill_logs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `bill_id` int NOT NULL,
  `action` varchar(20) NOT NULL,
  `old_amount` decimal(12,2) DEFAULT NULL,
  `new_amount` decimal(12,2) DEFAULT NULL,
  `old_pay_mode` varchar(20) DEFAULT NULL,
  `new_pay_mode` varchar(20) DEFAULT NULL,
  `old_notes` text,
  `new_notes` text,
  `reason` text,
  `uid` int DEFAULT NULL,
  `shop_id` varchar(255) DEFAULT NULL,
  `log_date` date DEFAULT NULL,
  `log_time` time DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `quick_bill_logs` */

/*Table structure for table `quick_bills` */

DROP TABLE IF EXISTS `quick_bills`;

CREATE TABLE `quick_bills` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `amount` decimal(12,2) NOT NULL,
  `pay_mode` varchar(20) NOT NULL,
  `notes` text,
  `shop_id` varchar(255) DEFAULT NULL,
  `uid` int DEFAULT NULL,
  `bill_date` date DEFAULT NULL,
  `bill_time` time DEFAULT NULL,
  `is_cancelled` int DEFAULT '0',
  `tips_amount` decimal(12,2) DEFAULT '0.00',
  `tips_pay_mode` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `quick_bills` */

insert  into `quick_bills`(`id`,`amount`,`pay_mode`,`notes`,`shop_id`,`uid`,`bill_date`,`bill_time`,`is_cancelled`,`tips_amount`,`tips_pay_mode`) values 
(1,200.00,'cash','','S01',1,'2026-09-11','21:31:57',0,10.00,'cash'),
(2,200.00,'gpay','','S01',1,'2026-09-11','21:32:05',0,20.00,'gpay'),
(3,100.00,'cash','','S01',28,'2026-09-11','21:48:29',0,10.00,'cash'),
(4,200.00,'gpay','','S01',28,'2026-09-11','21:48:38',0,20.00,'cash');

/*Table structure for table `salon_expenses` */

DROP TABLE IF EXISTS `salon_expenses`;

CREATE TABLE `salon_expenses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `amount` decimal(12,2) NOT NULL,
  `expense_for` varchar(255) NOT NULL,
  `shop_id` varchar(255) DEFAULT NULL,
  `uid` int DEFAULT NULL,
  `exp_date` date DEFAULT NULL,
  `exp_time` time DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `salon_expenses` */

insert  into `salon_expenses`(`id`,`amount`,`expense_for`,`shop_id`,`uid`,`exp_date`,`exp_time`) values 
(1,10.00,'Tea','S01',1,'2026-09-11','22:07:06'),
(2,20.00,'rent','S01',28,'2026-09-11','22:11:17');

/*Table structure for table `special_permission` */

DROP TABLE IF EXISTS `special_permission`;

CREATE TABLE `special_permission` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `content` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `special_permission` */

insert  into `special_permission`(`id`,`content`) values 
(1,'allow to Zero stock billing ');

/*Table structure for table `trans_bill` */

DROP TABLE IF EXISTS `trans_bill`;

CREATE TABLE `trans_bill` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `tr_no` varchar(255) NOT NULL,
  `customer_id` int DEFAULT NULL,
  `cus_name` varchar(255) DEFAULT '-',
  `cus_phn` varchar(255) DEFAULT '-',
  `load_from` varchar(255) NOT NULL,
  `load_to` varchar(255) NOT NULL,
  `freight_amount` double(10,3) DEFAULT '0.000',
  `paid` double(10,3) DEFAULT '0.000',
  `cash_paid` double(10,3) DEFAULT '0.000',
  `bank_paid` double(10,3) DEFAULT '0.000',
  `balance` double(10,3) DEFAULT '0.000',
  `current_balance` double(10,3) DEFAULT '0.000',
  `is_balance` int DEFAULT '0',
  `payment_mode` int NOT NULL DEFAULT '1',
  `payment_type` int DEFAULT '0',
  `is_allotted` tinyint DEFAULT '0',
  `allotted_uid` int DEFAULT NULL,
  `allotted_at` datetime DEFAULT NULL,
  `uid` int NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL DEFAULT '00:00:00',
  `is_cancelled` int DEFAULT '0',
  `vehicle_no` varchar(50) DEFAULT NULL,
  `driver_no` varchar(50) DEFAULT NULL,
  `owner_no` varchar(50) DEFAULT NULL,
  `pay_date` date DEFAULT NULL,
  `utr_no` varchar(80) DEFAULT NULL,
  `veh_freight` double(10,3) DEFAULT '0.000',
  `veh_paid` double(10,3) DEFAULT '0.000',
  `veh_cash_paid` double(10,3) DEFAULT '0.000',
  `veh_bank_paid` double(10,3) DEFAULT '0.000',
  `veh_balance` double(10,3) DEFAULT '0.000',
  `veh_payment_mode` int DEFAULT '1',
  `veh_payment_type` int DEFAULT '0',
  `veh_pay_date` date DEFAULT NULL,
  `veh_utr_no` varchar(80) DEFAULT NULL,
  `is_unloaded` tinyint DEFAULT '0',
  `unloaded_at` datetime DEFAULT NULL,
  `unloaded_uid` int DEFAULT NULL,
  `bill_image` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `is_allotted` (`is_allotted`),
  KEY `current_balance` (`current_balance`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `trans_bill` */

/*Table structure for table `trans_bill_due` */

DROP TABLE IF EXISTS `trans_bill_due`;

CREATE TABLE `trans_bill_due` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `bill_id` int NOT NULL,
  `customer_id` int DEFAULT NULL,
  `amount` double(10,3) NOT NULL DEFAULT '0.000',
  `cash_paid` double(10,3) NOT NULL DEFAULT '0.000',
  `bank_paid` double(10,3) NOT NULL DEFAULT '0.000',
  `balance` double(10,3) NOT NULL DEFAULT '0.000',
  `pay_mode` tinyint NOT NULL DEFAULT '1',
  `pay_type` tinyint NOT NULL DEFAULT '0',
  `txn_type` varchar(20) NOT NULL DEFAULT 'COLLECTION',
  `notes` varchar(255) DEFAULT NULL,
  `uid` int NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `utr_no` varchar(80) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bill_id` (`bill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `trans_bill_due` */

/*Table structure for table `user_modules` */

DROP TABLE IF EXISTS `user_modules`;

CREATE TABLE `user_modules` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `module_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=latin1;

/*Data for the table `user_modules` */

insert  into `user_modules`(`id`,`module_name`) values 
(1,'Salon Bill'),
(2,'Staff Today collection'),
(3,'All Collection Report'),
(4,'Attendance Entry'),
(5,'Attendance Report'),
(6,'Admin'),
(7,'Incentive Entry'),
(8,'Incentive report'),
(9,'Expense');

/*Table structure for table `user_permission` */

DROP TABLE IF EXISTS `user_permission`;

CREATE TABLE `user_permission` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `module_id` int NOT NULL,
  `uid` int NOT NULL,
  `date` date DEFAULT NULL,
  `time` time DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mod` (`module_id`),
  KEY `uid` (`uid`)
) ENGINE=InnoDB AUTO_INCREMENT=189 DEFAULT CHARSET=latin1;

/*Data for the table `user_permission` */

insert  into `user_permission`(`id`,`module_id`,`uid`,`date`,`time`) values 
(163,1,29,'2026-09-11','21:48:02'),
(164,2,29,'2026-09-11','21:48:02'),
(165,3,29,'2026-09-11','21:48:02'),
(166,4,29,'2026-09-11','21:48:02'),
(167,5,29,'2026-09-11','21:48:02'),
(168,6,29,'2026-09-11','21:48:02'),
(169,7,29,'2026-09-11','21:48:02'),
(170,8,29,'2026-09-11','21:48:02'),
(171,1,1,'2026-09-11','22:05:49'),
(172,2,1,'2026-09-11','22:05:49'),
(173,3,1,'2026-09-11','22:05:49'),
(174,4,1,'2026-09-11','22:05:49'),
(175,5,1,'2026-09-11','22:05:49'),
(176,6,1,'2026-09-11','22:05:49'),
(177,7,1,'2026-09-11','22:05:49'),
(178,8,1,'2026-09-11','22:05:49'),
(179,9,1,'2026-09-11','22:05:49'),
(180,1,28,'2026-09-11','22:10:57'),
(181,2,28,'2026-09-11','22:10:57'),
(182,3,28,'2026-09-11','22:10:57'),
(183,4,28,'2026-09-11','22:10:57'),
(184,5,28,'2026-09-11','22:10:57'),
(185,6,28,'2026-09-11','22:10:57'),
(186,8,28,'2026-09-11','22:10:57'),
(187,7,28,'2026-09-11','22:10:57'),
(188,9,28,'2026-09-11','22:10:57');

/*Table structure for table `user_special_permission` */

DROP TABLE IF EXISTS `user_special_permission`;

CREATE TABLE `user_special_permission` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `content_id` int NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

/*Data for the table `user_special_permission` */

insert  into `user_special_permission`(`id`,`content_id`,`user_id`) values 
(3,1,1);

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_name` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_active` int DEFAULT '1',
  `fullName` varchar(255) DEFAULT NULL,
  `disc_per` int DEFAULT '100',
  `shop_id` varchar(255) DEFAULT NULL,
  `is_admin` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=latin1;

/*Data for the table `users` */

insert  into `users`(`id`,`user_name`,`password`,`is_active`,`fullName`,`disc_per`,`shop_id`,`is_admin`) values 
(1,'admin','aecbf9a63cec1e93327dfc212f31acdb31c4f5d10bedccf8fbb8b042a6f0f39155797bdd04517905ae5d98b69fdc452cdb61b018e10939740ec96f36e133d639',1,'admin',50,'S01',1),
(28,'admin1','aecbf9a63cec1e93327dfc212f31acdb31c4f5d10bedccf8fbb8b042a6f0f39155797bdd04517905ae5d98b69fdc452cdb61b018e10939740ec96f36e133d639',1,'admin1',100,'S01',0),
(29,'admin2','aecbf9a63cec1e93327dfc212f31acdb31c4f5d10bedccf8fbb8b042a6f0f39155797bdd04517905ae5d98b69fdc452cdb61b018e10939740ec96f36e133d639',1,'admin2',100,'S02',0);

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

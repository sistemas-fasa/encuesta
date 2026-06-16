CREATE TABLE IF NOT EXISTS `import_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) NOT NULL,
  `total_rows` int(11) DEFAULT 0,
  `status` enum('en_progreso','completado','con_errores') DEFAULT 'en_progreso',
  `imported_by` int(11) DEFAULT NULL,
  `created_at` timestamp DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_import_user` (`imported_by`),
  CONSTRAINT `fk_import_user` FOREIGN KEY (`imported_by`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `temp_import_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `import_id` int(11) NOT NULL,
  `row_number` int(11) NOT NULL,
  `raw_data` json NOT NULL,
  `validation_errors` json DEFAULT NULL,
  `status` enum('pendiente','valido','error','importado') DEFAULT 'pendiente',
  PRIMARY KEY (`id`),
  KEY `fk_temp_import_history` (`import_id`),
  CONSTRAINT `fk_temp_import_history` FOREIGN KEY (`import_id`) REFERENCES `import_history` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

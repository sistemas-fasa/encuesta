-- Survey System Production Dump
SET FOREIGN_KEY_CHECKS = 0;

-- Structure for camara
DROP TABLE IF EXISTS `camara`;
CREATE TABLE `camara` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) NOT NULL,
  `sigla` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for camara
INSERT INTO `camara` (`id`, `nombre`, `sigla`) VALUES (1, 'Cámara de Comercio e Industria de Posadas', 'CCIP');
INSERT INTO `camara` (`id`, `nombre`, `sigla`) VALUES (2, 'Cámara Regional de Industria, Producción y Comercio de Oberá', 'CRIPCO');
INSERT INTO `camara` (`id`, `nombre`, `sigla`) VALUES (3, 'Cámara de Comercio e Industria de Eldorado', 'CCIE');
INSERT INTO `camara` (`id`, `nombre`, `sigla`) VALUES (4, 'Cámara de Comercio, Ind. y Turismo de San Vicente', 'CCITSV');
INSERT INTO `camara` (`id`, `nombre`, `sigla`) VALUES (5, 'Asociación Misionera de Marketing', 'AM');
INSERT INTO `camara` (`id`, `nombre`, `sigla`) VALUES (6, 'Cámara de Comercio e Industria de Puerto Rico', 'CCIPR');
INSERT INTO `camara` (`id`, `nombre`, `sigla`) VALUES (7, 'Asociación de Madereros, Aserraderos y Afines del Alto Paraná', 'AMAYADAP');

-- Structure for empresa
DROP TABLE IF EXISTS `empresa`;
CREATE TABLE `empresa` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rubro_id` int(11) NOT NULL,
  `situacion_iva_id` int(11) NOT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp(),
  `localidad_id` int(11) NOT NULL,
  `camara_id` int(11) NOT NULL,
  `nombre` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `rubro_id` (`rubro_id`),
  KEY `situacion_iva_id` (`situacion_iva_id`),
  KEY `fk_empresa_localidad` (`localidad_id`),
  KEY `fk_empresa_camara` (`camara_id`),
  CONSTRAINT `empresa_ibfk_1` FOREIGN KEY (`rubro_id`) REFERENCES `rubro` (`id`),
  CONSTRAINT `empresa_ibfk_2` FOREIGN KEY (`situacion_iva_id`) REFERENCES `situacion_iva` (`id`),
  CONSTRAINT `fk_empresa_camara` FOREIGN KEY (`camara_id`) REFERENCES `camara` (`id`),
  CONSTRAINT `fk_empresa_localidad` FOREIGN KEY (`localidad_id`) REFERENCES `localidad` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for empresa
INSERT INTO `empresa` (`id`, `rubro_id`, `situacion_iva_id`, `fecha_registro`, `localidad_id`, `camara_id`, `nombre`) VALUES (3, 11, 2, '2026-03-26 14:53:44', 5, 7, 'Empresa de Prueba');

-- Structure for encuesta
DROP TABLE IF EXISTS `encuesta`;
CREATE TABLE `encuesta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `estado` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for encuesta
INSERT INTO `encuesta` (`id`, `titulo`, `descripcion`, `estado`, `fecha_creacion`) VALUES (11, ' DICIEMBRE 2025', '', 1, '2026-03-26 20:15:00');

-- Structure for encuesta_periodo
DROP TABLE IF EXISTS `encuesta_periodo`;
CREATE TABLE `encuesta_periodo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mes` int(11) NOT NULL,
  `anio` int(11) NOT NULL,
  `fecha_apertura` date DEFAULT NULL,
  `fecha_cierre` date DEFAULT NULL,
  `encuesta_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_periodo_encuesta` (`encuesta_id`),
  CONSTRAINT `fk_periodo_encuesta` FOREIGN KEY (`encuesta_id`) REFERENCES `encuesta` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for encuesta_periodo
INSERT INTO `encuesta_periodo` (`id`, `mes`, `anio`, `fecha_apertura`, `fecha_cierre`, `encuesta_id`) VALUES (3, 4, 2026, NULL, NULL, 11);
INSERT INTO `encuesta_periodo` (`id`, `mes`, `anio`, `fecha_apertura`, `fecha_cierre`, `encuesta_id`) VALUES (4, 3, 2026, NULL, NULL, 11);
INSERT INTO `encuesta_periodo` (`id`, `mes`, `anio`, `fecha_apertura`, `fecha_cierre`, `encuesta_id`) VALUES (5, 3, 2026, NULL, NULL, 11);

-- Structure for envio_encuesta
DROP TABLE IF EXISTS `envio_encuesta`;
CREATE TABLE `envio_encuesta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Structure for localidad
DROP TABLE IF EXISTS `localidad`;
CREATE TABLE `localidad` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=78 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for localidad
INSERT INTO `localidad` (`id`, `nombre`) VALUES (1, '25 DE MAYO');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (2, '9 DE JULIO');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (3, 'ALBA POSSE');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (4, 'ALMAFUERTE');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (5, 'APOSTOLES');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (6, 'ARISTOBULO DEL VALLE');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (7, 'ARROYO DEL MEDIO');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (8, 'AZARA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (9, 'BERNARDO DE IRIGOYEN');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (10, 'BONPLAND');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (11, 'CAA-YARI');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (12, 'CAMPO GRANDE');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (13, 'CAMPO RAMON');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (14, 'CAMPO VIERA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (15, 'CANDELARIA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (16, 'CAPIOVI');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (17, 'CARAGUATAY');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (18, 'CERRO AZUL');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (19, 'CERRO CORA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (20, 'COLONIA ALBERDI');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (21, 'COLONIA ALICIA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (22, 'COLONIA AURORA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (23, 'COLONIA DELICIA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (24, 'COLONIA POLANA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (25, 'COLONIA VICTORIA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (26, 'COLONIA WANDA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (27, 'CONCEPCION DE LA SIERRA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (28, 'CORPUS');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (29, 'CTE.A.GUACURARI');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (30, 'DOS ARROYOS');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (31, 'DOS DE MAYO');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (32, 'EL ALCAZAR');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (33, 'EL SOBERBIO');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (34, 'ELDORADO');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (35, 'FACHINAL');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (36, 'FLORENTINO AMEGHINO');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (37, 'GARUHAPE');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (38, 'GARUPA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (39, 'GENERAL ALVEAR');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (40, 'GENERAL URQUIZA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (41, 'GOBERNADOR LOPEZ');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (42, 'GOBERNADOR ROCA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (43, 'GUARANI');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (44, 'HIPOLITO IRIGOYEN');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (45, 'ITACARUARE');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (46, 'JARDIN AMERICA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (47, 'LEANDRO N. ALEM');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (48, 'LIBERTAD');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (49, 'LORETO');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (50, 'LOS HELECHOS');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (51, 'MARTIRES');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (52, 'MOJON GRANDE');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (53, 'MONTECARLO');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (54, 'OBERA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (55, 'OLEGARIO VICTOR ANDRADE');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (56, 'PANAMBI');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (57, 'PIRAY');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (58, 'POSADAS');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (59, 'PROFUNDIDAD');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (60, 'PUERTO ESPERANZA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (61, 'PUERTO IGUAZU');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (62, 'PUERTO LEONI');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (63, 'PUERTO RICO');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (64, 'RUIZ DE MONTOYA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (65, 'SAN ANTONIO');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (66, 'SAN IGNACIO');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (67, 'SAN JAVIER');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (68, 'SAN JOSE');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (69, 'SAN MARTIN');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (70, 'SAN PEDRO');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (71, 'SAN VICENTE');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (72, 'SANTA ANA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (73, 'SANTA MARIA');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (74, 'SANTIAGO DE LINIERS');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (75, 'SANTO PIPO');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (76, 'TRES CAPONES');
INSERT INTO `localidad` (`id`, `nombre`) VALUES (77, 'GOBERNADOR VIRASORO');

-- Structure for opcion
DROP TABLE IF EXISTS `opcion`;
CREATE TABLE `opcion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pregunta_id` int(11) NOT NULL,
  `texto_opcion` varchar(150) NOT NULL,
  `valor` int(11) DEFAULT NULL,
  `siguiente_seccion_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pregunta_id` (`pregunta_id`),
  KEY `fk_opcion_siguiente_sec` (`siguiente_seccion_id`),
  CONSTRAINT `fk_opcion_siguiente_sec` FOREIGN KEY (`siguiente_seccion_id`) REFERENCES `seccion` (`id`) ON DELETE SET NULL,
  CONSTRAINT `opcion_ibfk_1` FOREIGN KEY (`pregunta_id`) REFERENCES `pregunta` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=985 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for opcion
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (45, 14, 'No encuentro la Cámara a la cual estoy afiliado', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (46, 14, 'No pertenezco a ninguna entidad o cámara.', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (339, 13, 'Asociación de Turismo del Alto Uruguay', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (340, 13, 'Cámara de Comercio, Industria y Actividades Afines de Gobernador Virasoro', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (341, 13, 'Cámara de Comercio, Industria y Turismo de San Vicente', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (342, 13, 'Cámara de Comercio, Industria, Comercio Exterior y Afines de Puerto Iguazú', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (343, 13, 'Cámara de Comercio, Industria, Turismo, Servicio y Producción de Bernardo de Irigoyen', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (344, 13, 'Cámara de Industria, Comercio, Producción y Turismo de Jardín América y Zona de Influencia', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (345, 13, 'Cámara de Producción, Industria y Comercio de Apóstoles y Alto Uruguay', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (346, 13, 'Cámara Inmobiliaria de Misiones', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (499, 21, 'Construcción, electricidad, plomería.', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (500, 21, 'Mecanica, general, electrica, tornerías', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (501, 21, 'Lubricentros, lavaderos.', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (502, 21, 'Estética, peluquerías.', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (503, 21, 'Servicios de Salud, funerarias', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (504, 21, 'Servicios profesionales', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (505, 21, 'Servicios financieros ', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (506, 21, 'Servicios educativos', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (507, 21, 'Servicios de seguridad', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (508, 21, 'Transporte   de cargas', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (509, 21, 'Transporte   de pasajeros', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (510, 21, 'Comercio   exterior', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (511, 21, 'Gastrónomicos (eventos y catering)', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (512, 21, 'Medios   de Comunicación', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (513, 21, 'Metalúrgica (soldadura, forjado, aberturas de aluminio) ', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (514, 21, 'Seguros ', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (515, 21, 'MUY MALO', 0, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (516, 21, 'MALO', 1, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (517, 21, 'REGULAR', 2, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (518, 21, 'BUENO', 3, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (519, 21, 'MUY BUENO', 4, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (545, 22, 'Aserradero, forestal', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (546, 22, 'Ganadería, frigorífico', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (547, 22, 'Tabacalera', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (548, 22, 'Tealera', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (549, 22, 'Yerbatera', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (550, 22, 'Almidonera', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (551, 22, 'Cerámica, ladrillero, olero', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (552, 22, 'Citricos', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (553, 22, 'Celulosa y papel', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (554, 22, 'Piscicultura', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (555, 22, 'Apicultura', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (556, 22, 'Peletería (indumentaria, cuero, piel animal)', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (557, 22, 'Textiles', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (558, 22, 'Chacinados', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (559, 22, 'Aberturas de Aluminio', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (560, 22, 'Carpintería', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (561, 22, 'Cantera ', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (562, 22, 'Hormigonera', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (563, 22, 'Metalurgica', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (564, 22, 'Envases Flexibles', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (565, 22, 'Muy Malo', 0, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (566, 22, 'Malo', 1, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (567, 22, 'Regular', 2, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (568, 22, 'Bueno', 3, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (569, 22, 'Muy  Bueno', 4, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (570, 17, 'De 0 a 5 personas', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (571, 17, 'De 5 a 10 personas', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (572, 17, 'De 10 a 20 personas', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (573, 17, 'De 20 a 40 personas', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (574, 17, 'De 40 a 80 personas', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (575, 17, 'Más de 80 personas', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (617, 20, 'Alimentos y bebidas (supermercados, minimercados, distribuidoras, etc', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (618, 20, 'Bazar, Decoración, textiles, muebles, electrodomesticos, articulos para el hogar.', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (619, 20, 'Farmacia, perfumería, opticas, joyerìas, cuidado personal.', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (620, 20, 'Indumentaria, calzado y marroquineria', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (621, 20, 'Ferreteria, materiales construcción, eléctricos, maderas minoristas.', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (622, 20, 'Repuestos maquinaria, automotor e insumos y consumibles para vehículos', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (623, 20, 'Tecnología, informática, celulares.', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (624, 20, 'Automóviles y motociletas.', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (625, 20, 'Agropecuaria, veterinaria, insumos forestales, forrajeria.', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (626, 20, 'Imprenta, librerías, Jugueterías.', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (627, 20, 'Estaciones de Servicio, expendio de Combustibles y lubricantes', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (628, 20, 'Gastronómicos (restaurantes y locales de comida rápida)', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (629, 20, 'Metalúrgica (soldadura, forjado, aberturas de aluminio)', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (630, 20, 'MUY MALO', 0, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (631, 20, 'MALO', 1, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (632, 20, 'REGULAR', 2, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (633, 20, 'BUENO', 3, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (634, 20, 'MUY BUENO', 4, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (716, 25, 'SI', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (717, 25, 'NO', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (718, 18, 'Yerba Mate', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (719, 18, 'Té', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (720, 18, 'Forestal (madera en rollo, resina)', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (721, 18, 'MUY MALO', 0, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (722, 18, 'MALO', 1, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (723, 18, 'REGULAR', 2, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (724, 18, 'BUENO', 3, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (725, 18, 'MUY BUENO', 4, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (726, 18, 'Tabaco', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (727, 18, 'Ganadería (bovina, porcina, caprina, ovina y aves)', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (728, 18, 'Citrus (frutales perennes en general)', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (729, 18, 'Mandioca', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (730, 18, 'Cereales (Maíz, soja)', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (731, 18, 'Horticultura (varias verduras y frutas)', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (732, 18, 'Piscicultura', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (838, 11, 'Responsable Inscripto', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (839, 11, 'Monotributista', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (840, 16, 'Comercio', NULL, 4);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (841, 16, 'Servicios', NULL, 5);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (842, 16, 'Industria', NULL, 6);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (843, 16, 'Turismo', NULL, 3);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (844, 16, 'Producción', NULL, 7);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (845, 23, 'Hotelero', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (846, 23, 'Alquileres temporales, cabañas, departamentos.', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (847, 23, 'Gastronómico', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (848, 23, 'Complejos recreativos, camping', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (849, 23, 'Guía turística', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (850, 23, 'Piletas ', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (851, 23, 'Aguas termales', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (852, 23, 'Agencias de Viajes', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (853, 23, 'Espectáculos ', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (854, 23, 'Viajes y turismo', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (855, 23, 'Turismo Aventura', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (856, 23, 'Museos y lugares históricos ', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (857, 23, 'Articulos regionales, artesanías y antigüedades.', NULL, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (858, 23, 'Muy malo', 0, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (859, 23, 'Malo', 1, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (860, 23, 'Regular', 2, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (861, 23, 'Bueno', 3, NULL);
INSERT INTO `opcion` (`id`, `pregunta_id`, `texto_opcion`, `valor`, `siguiente_seccion_id`) VALUES (862, 23, 'Muy bueno', 4, NULL);

-- Structure for pregunta
DROP TABLE IF EXISTS `pregunta`;
CREATE TABLE `pregunta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `texto_pregunta` text NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `camara_id` int(11) DEFAULT NULL,
  `encuesta_id` int(11) DEFAULT NULL,
  `orden` int(11) DEFAULT 0,
  `seccion_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_pregunta_camara` (`camara_id`),
  KEY `fk_pregunta_encuesta` (`encuesta_id`),
  KEY `fk_pregunta_seccion` (`seccion_id`),
  CONSTRAINT `fk_pregunta_camara` FOREIGN KEY (`camara_id`) REFERENCES `camara` (`id`),
  CONSTRAINT `fk_pregunta_encuesta` FOREIGN KEY (`encuesta_id`) REFERENCES `encuesta` (`id`),
  CONSTRAINT `fk_pregunta_seccion` FOREIGN KEY (`seccion_id`) REFERENCES `seccion` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for pregunta
INSERT INTO `pregunta` (`id`, `texto_pregunta`, `tipo`, `camara_id`, `encuesta_id`, `orden`, `seccion_id`) VALUES (11, 'Situación ante el IVA', 'opcion_unica', NULL, 11, 1, 1);
INSERT INTO `pregunta` (`id`, `texto_pregunta`, `tipo`, `camara_id`, `encuesta_id`, `orden`, `seccion_id`) VALUES (13, '¿A qué Cámara o Asociación perteneces?', 'opcion_unica', NULL, 11, 3, 1);
INSERT INTO `pregunta` (`id`, `texto_pregunta`, `tipo`, `camara_id`, `encuesta_id`, `orden`, `seccion_id`) VALUES (14, 'Si no visualiza la cámara o entidad a la que pertenece, seleccione las siguientes opciones', 'opcion_unica', NULL, 11, 4, 1);
INSERT INTO `pregunta` (`id`, `texto_pregunta`, `tipo`, `camara_id`, `encuesta_id`, `orden`, `seccion_id`) VALUES (16, '¿A qué rubro pertenece?', 'opcion_unica', NULL, 11, 6, 2);
INSERT INTO `pregunta` (`id`, `texto_pregunta`, `tipo`, `camara_id`, `encuesta_id`, `orden`, `seccion_id`) VALUES (17, '¿Con cuántas personas cuenta la estructura de su empresa?', 'opcion_unica', NULL, 11, 7, 2);
INSERT INTO `pregunta` (`id`, `texto_pregunta`, `tipo`, `camara_id`, `encuesta_id`, `orden`, `seccion_id`) VALUES (18, '¿Cómo evalúa el movimiento productivo en el último mes?  Puede elegir la cantidad de rubros según su actividad', 'cuadricula', NULL, 11, 10, 7);
INSERT INTO `pregunta` (`id`, `texto_pregunta`, `tipo`, `camara_id`, `encuesta_id`, `orden`, `seccion_id`) VALUES (20, '¿Cómo evalúa el movimiento comercial en el último mes?  Puede elegir la cantidad de rubros según su actividad', 'cuadricula', NULL, 11, 11, 4);
INSERT INTO `pregunta` (`id`, `texto_pregunta`, `tipo`, `camara_id`, `encuesta_id`, `orden`, `seccion_id`) VALUES (21, '¿Cómo evalúa el movimiento de servicios en el último mes?  Puede elegir la cantidad de rubros según su actividad', 'cuadricula', NULL, 11, 11, 5);
INSERT INTO `pregunta` (`id`, `texto_pregunta`, `tipo`, `camara_id`, `encuesta_id`, `orden`, `seccion_id`) VALUES (22, '¿Cómo evalúa el movimiento industrial en el último mes?  Puede elegir la cantidad de rubros según su actividad', 'cuadricula', NULL, 11, 11, 6);
INSERT INTO `pregunta` (`id`, `texto_pregunta`, `tipo`, `camara_id`, `encuesta_id`, `orden`, `seccion_id`) VALUES (23, '¿Cómo evalúa el movimiento turístico en el último mes?  Puede elegir la cantidad de rubros según su actividad', 'cuadricula', NULL, 11, 11, 3);
INSERT INTO `pregunta` (`id`, `texto_pregunta`, `tipo`, `camara_id`, `encuesta_id`, `orden`, `seccion_id`) VALUES (25, 'Con respecto a la pregunta anterior, su actividad ¿se encuentra contemplada? *', 'opcion_unica', NULL, 11, 13, 6);

-- Structure for respuesta
DROP TABLE IF EXISTS `respuesta`;
CREATE TABLE `respuesta` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) DEFAULT NULL,
  `encuesta_periodo_id` int(11) NOT NULL,
  `pregunta_id` int(11) NOT NULL,
  `opcion_id` int(11) DEFAULT NULL,
  `valor_numerico` decimal(10,2) DEFAULT NULL,
  `valor_texto` text DEFAULT NULL,
  `fecha_respuesta` datetime DEFAULT current_timestamp(),
  `localidad_id` int(11) DEFAULT NULL,
  `sector_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  KEY `encuesta_periodo_id` (`encuesta_periodo_id`),
  KEY `pregunta_id` (`pregunta_id`),
  KEY `opcion_id` (`opcion_id`),
  KEY `fk_respuesta_localidad` (`localidad_id`),
  CONSTRAINT `fk_respuesta_localidad` FOREIGN KEY (`localidad_id`) REFERENCES `localidad` (`id`),
  CONSTRAINT `respuesta_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresa` (`id`),
  CONSTRAINT `respuesta_ibfk_2` FOREIGN KEY (`encuesta_periodo_id`) REFERENCES `encuesta_periodo` (`id`),
  CONSTRAINT `respuesta_ibfk_3` FOREIGN KEY (`pregunta_id`) REFERENCES `pregunta` (`id`),
  CONSTRAINT `respuesta_ibfk_4` FOREIGN KEY (`opcion_id`) REFERENCES `opcion` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=192 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for respuesta
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (7, NULL, 3, 11, NULL, NULL, 'Responsable Inscripto', '2026-03-28 12:34:03', 18, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (8, NULL, 3, 13, NULL, NULL, 'Cámara de Comercio, Industria y Actividades Afines de Gobernador Virasoro', '2026-03-28 12:34:03', 18, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (9, NULL, 3, 14, 45, NULL, 'No encuentro la Cámara a la cual estoy afiliado', '2026-03-28 12:34:03', 18, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (11, NULL, 3, 16, NULL, NULL, 'Comercio', '2026-03-28 12:34:03', 18, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (12, NULL, 3, 20, NULL, NULL, 'Alimentos y bebidas (supermercados, minimercados, distribuidoras, etc', '2026-03-28 12:34:03', 18, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (13, NULL, 3, 21, NULL, NULL, 'Seguros ', '2026-03-28 12:34:03', 18, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (14, NULL, 3, 22, NULL, NULL, 'Aserradero, forestal', '2026-03-28 12:34:03', 18, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (15, NULL, 3, 23, NULL, NULL, 'Hotelero', '2026-03-28 12:34:03', 18, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (17, NULL, 3, 11, NULL, NULL, 'Responsable Inscripto', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (18, NULL, 3, 13, 341, NULL, 'Cámara de Comercio, Industria y Turismo de San Vicente', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (19, NULL, 3, 14, 45, NULL, 'No encuentro la Cámara a la cual estoy afiliado', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (20, NULL, 3, 16, NULL, NULL, 'Comercio', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (21, NULL, 3, 17, NULL, NULL, 'De 0 a 5 personas', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (22, NULL, 3, 18, NULL, NULL, 'Yerba Mate', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (23, NULL, 3, 20, NULL, NULL, 'Alimentos y bebidas (supermercados, minimercados, distribuidoras, etc', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (24, NULL, 3, 20, NULL, NULL, 'Bazar, Decoración, textiles, muebles, electrodomesticos, articulos para el hogar.', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (25, NULL, 3, 20, NULL, NULL, 'Farmacia, perfumería, opticas, joyerìas, cuidado personal.', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (26, NULL, 3, 20, NULL, NULL, 'Ferreteria, materiales construcción, eléctricos, maderas minoristas.', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (27, NULL, 3, 20, NULL, NULL, 'Indumentaria, calzado y marroquineria', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (28, NULL, 3, 20, NULL, NULL, 'Repuestos maquinaria, automotor e insumos y consumibles para vehículos', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (29, NULL, 3, 20, NULL, NULL, 'Tecnología, informática, celulares.', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (30, NULL, 3, 20, NULL, NULL, 'Automóviles y motociletas.', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (31, NULL, 3, 20, NULL, NULL, 'Agropecuaria, veterinaria, insumos forestales, forrajeria.', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (32, NULL, 3, 20, NULL, NULL, 'Imprenta, librerías, Jugueterías.', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (33, NULL, 3, 20, NULL, NULL, 'Estaciones de Servicio, expendio de Combustibles y lubricantes', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (34, NULL, 3, 20, NULL, NULL, 'Gastronómicos (restaurantes y locales de comida rápida)', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (35, NULL, 3, 20, NULL, NULL, 'Metalúrgica (soldadura, forjado, aberturas de aluminio)', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (36, NULL, 3, 21, NULL, NULL, 'Construcción, electricidad, plomería.', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (37, NULL, 3, 22, NULL, NULL, 'Aserradero, forestal', '2026-03-30 18:03:53', 1, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (66, NULL, 3, 11, NULL, NULL, 'Responsable Inscripto', '2026-03-30 18:16:58', 5, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (67, NULL, 3, 13, 339, NULL, 'Asociación de Turismo del Alto Uruguay', '2026-03-30 18:16:58', 5, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (68, NULL, 3, 14, 45, NULL, 'No encuentro la Cámara a la cual estoy afiliado', '2026-03-30 18:16:58', 5, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (69, NULL, 3, 16, NULL, NULL, 'Servicios', '2026-03-30 18:16:58', 5, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (70, NULL, 3, 17, 570, NULL, 'De 0 a 5 personas', '2026-03-30 18:16:58', 5, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (71, NULL, 3, 18, NULL, NULL, 'Yerba Mate', '2026-03-30 18:16:58', 5, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (72, NULL, 3, 21, 515, NULL, 'Construcción, electricidad, plomería.', '2026-03-30 18:16:58', 5, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (73, NULL, 3, 21, 515, NULL, 'Mecanica, general, electrica, tornerías', '2026-03-30 18:16:58', 5, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (74, NULL, 3, 21, 515, NULL, 'Lubricentros, lavaderos.', '2026-03-30 18:16:58', 5, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (75, NULL, 3, 22, 566, NULL, 'Peletería (indumentaria, cuero, piel animal)', '2026-03-30 18:16:58', 5, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (76, NULL, 3, 11, NULL, NULL, 'Responsable Inscripto', '2026-03-30 18:18:58', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (77, NULL, 3, 13, 339, NULL, 'Asociación de Turismo del Alto Uruguay', '2026-03-30 18:18:58', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (78, NULL, 3, 14, 45, NULL, 'No encuentro la Cámara a la cual estoy afiliado', '2026-03-30 18:18:58', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (79, NULL, 3, 16, NULL, NULL, 'Comercio', '2026-03-30 18:18:58', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (80, NULL, 3, 17, 570, NULL, 'De 0 a 5 personas', '2026-03-30 18:18:58', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (81, NULL, 3, 18, NULL, NULL, 'Yerba Mate', '2026-03-30 18:18:58', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (82, NULL, 3, 20, 630, NULL, 'Bazar, Decoración, textiles, muebles, electrodomesticos, articulos para el hogar.', '2026-03-30 18:18:58', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (83, NULL, 3, 21, 515, NULL, 'Construcción, electricidad, plomería.', '2026-03-30 18:18:58', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (84, NULL, 3, 22, 565, NULL, 'Aserradero, forestal', '2026-03-30 18:18:58', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (85, NULL, 3, 11, NULL, NULL, 'Responsable Inscripto', '2026-03-30 18:28:59', 15, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (86, NULL, 3, 13, 341, NULL, 'Cámara de Comercio, Industria y Turismo de San Vicente', '2026-03-30 18:28:59', 15, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (87, NULL, 3, 14, 45, NULL, 'No encuentro la Cámara a la cual estoy afiliado', '2026-03-30 18:28:59', 15, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (88, NULL, 3, 16, NULL, NULL, 'Producción', '2026-03-30 18:28:59', 15, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (89, NULL, 3, 17, 570, NULL, 'De 0 a 5 personas', '2026-03-30 18:28:59', 15, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (90, NULL, 3, 18, 721, NULL, 'Yerba Mate', '2026-03-30 18:28:59', 15, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (91, NULL, 3, 11, 838, NULL, 'Responsable Inscripto', '2026-03-30 19:41:16', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (92, NULL, 3, 13, 345, NULL, 'Cámara de Producción, Industria y Comercio de Apóstoles y Alto Uruguay', '2026-03-30 19:41:16', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (93, NULL, 3, 14, 45, NULL, 'No encuentro la Cámara a la cual estoy afiliado', '2026-03-30 19:41:16', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (94, NULL, 3, 16, NULL, NULL, 'Comercio', '2026-03-30 19:41:16', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (95, NULL, 3, 17, 570, NULL, 'De 0 a 5 personas', '2026-03-30 19:41:16', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (96, NULL, 3, 20, 630, NULL, 'Alimentos y bebidas (supermercados, minimercados, distribuidoras, etc', '2026-03-30 19:41:16', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (97, NULL, 3, 20, 630, NULL, 'Bazar, Decoración, textiles, muebles, electrodomesticos, articulos para el hogar.', '2026-03-30 19:41:16', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (98, NULL, 3, 20, 630, NULL, 'Farmacia, perfumería, opticas, joyerìas, cuidado personal.', '2026-03-30 19:41:16', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (99, NULL, 3, 20, 630, NULL, 'Indumentaria, calzado y marroquineria', '2026-03-30 19:41:16', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (100, NULL, 3, 20, 630, NULL, 'Ferreteria, materiales construcción, eléctricos, maderas minoristas.', '2026-03-30 19:41:16', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (101, NULL, 3, 20, 630, NULL, 'Repuestos maquinaria, automotor e insumos y consumibles para vehículos', '2026-03-30 19:41:16', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (102, NULL, 3, 20, 630, NULL, 'Tecnología, informática, celulares.', '2026-03-30 19:41:16', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (103, NULL, 3, 20, 630, NULL, 'Automóviles y motociletas.', '2026-03-30 19:41:16', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (104, NULL, 3, 20, 630, NULL, 'Agropecuaria, veterinaria, insumos forestales, forrajeria.', '2026-03-30 19:41:16', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (105, NULL, 3, 20, 630, NULL, 'Imprenta, librerías, Jugueterías.', '2026-03-30 19:41:16', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (106, NULL, 3, 20, 630, NULL, 'Estaciones de Servicio, expendio de Combustibles y lubricantes', '2026-03-30 19:41:16', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (107, NULL, 3, 20, 630, NULL, 'Gastronómicos (restaurantes y locales de comida rápida)', '2026-03-30 19:41:16', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (108, NULL, 3, 20, 630, NULL, 'Metalúrgica (soldadura, forjado, aberturas de aluminio)', '2026-03-30 19:41:16', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (109, NULL, 3, 11, 839, NULL, 'Monotributista', '2026-03-30 19:44:52', 63, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (110, NULL, 3, 13, 341, NULL, 'Cámara de Comercio, Industria y Turismo de San Vicente', '2026-03-30 19:44:52', 63, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (111, NULL, 3, 14, 45, NULL, 'No encuentro la Cámara a la cual estoy afiliado', '2026-03-30 19:44:52', 63, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (112, NULL, 3, 16, NULL, NULL, 'Industria', '2026-03-30 19:44:52', 63, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (113, NULL, 3, 17, 570, NULL, 'De 0 a 5 personas', '2026-03-30 19:44:52', 63, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (114, NULL, 3, 22, 566, NULL, 'Aserradero, forestal', '2026-03-30 19:44:52', 63, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (115, NULL, 3, 22, 567, NULL, 'Ganadería, frigorífico', '2026-03-30 19:44:52', 63, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (116, NULL, 3, 25, 716, NULL, 'SI', '2026-03-30 19:44:52', 63, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (117, NULL, 3, 11, 839, NULL, 'Monotributista', '2026-03-30 19:47:01', 56, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (118, NULL, 3, 13, 339, NULL, 'Asociación de Turismo del Alto Uruguay', '2026-03-30 19:47:01', 56, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (119, NULL, 3, 14, 45, NULL, 'No encuentro la Cámara a la cual estoy afiliado', '2026-03-30 19:47:01', 56, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (120, NULL, 3, 16, NULL, NULL, 'Comercio', '2026-03-30 19:47:01', 56, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (121, NULL, 3, 17, 570, NULL, 'De 0 a 5 personas', '2026-03-30 19:47:01', 56, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (122, NULL, 3, 20, 630, NULL, 'Alimentos y bebidas (supermercados, minimercados, distribuidoras, etc', '2026-03-30 19:47:01', 56, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (123, NULL, 3, 11, 838, NULL, 'Responsable Inscripto', '2026-03-30 20:15:38', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (124, NULL, 3, 13, 339, NULL, 'Asociación de Turismo del Alto Uruguay', '2026-03-30 20:15:38', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (125, NULL, 3, 14, 45, NULL, 'No encuentro la Cámara a la cual estoy afiliado', '2026-03-30 20:15:38', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (126, NULL, 3, 16, NULL, NULL, 'Servicios', '2026-03-30 20:15:38', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (127, NULL, 3, 17, 570, NULL, 'De 0 a 5 personas', '2026-03-30 20:15:38', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (128, NULL, 3, 21, 515, NULL, 'Construcción, electricidad, plomería.', '2026-03-30 20:15:38', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (129, NULL, 3, 21, 515, NULL, 'Mecanica, general, electrica, tornerías', '2026-03-30 20:15:38', 3, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (130, NULL, 3, 11, 838, NULL, 'Responsable Inscripto', '2026-03-30 20:36:05', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (131, NULL, 3, 13, 345, NULL, 'Cámara de Producción, Industria y Comercio de Apóstoles y Alto Uruguay', '2026-03-30 20:36:05', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (132, NULL, 3, 14, 45, NULL, 'No encuentro la Cámara a la cual estoy afiliado', '2026-03-30 20:36:05', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (133, NULL, 3, 16, NULL, NULL, 'Comercio', '2026-03-30 20:36:05', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (134, NULL, 3, 17, 572, NULL, 'De 10 a 20 personas', '2026-03-30 20:36:05', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (135, NULL, 3, 20, 631, NULL, 'Alimentos y bebidas (supermercados, minimercados, distribuidoras, etc', '2026-03-30 20:36:05', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (136, NULL, 3, 20, 631, NULL, 'Bazar, Decoración, textiles, muebles, electrodomesticos, articulos para el hogar.', '2026-03-30 20:36:05', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (137, NULL, 3, 20, 631, NULL, 'Farmacia, perfumería, opticas, joyerìas, cuidado personal.', '2026-03-30 20:36:05', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (138, NULL, 3, 11, 838, NULL, 'Responsable Inscripto', '2026-03-30 20:45:29', 17, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (139, NULL, 3, 13, 339, NULL, 'Asociación de Turismo del Alto Uruguay', '2026-03-30 20:45:29', 17, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (140, NULL, 3, 14, 45, NULL, 'No encuentro la Cámara a la cual estoy afiliado', '2026-03-30 20:45:29', 17, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (141, NULL, 3, 16, NULL, NULL, 'Comercio', '2026-03-30 20:45:29', 17, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (142, NULL, 3, 17, 570, NULL, 'De 0 a 5 personas', '2026-03-30 20:45:29', 17, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (143, NULL, 3, 20, 630, NULL, 'Alimentos y bebidas (supermercados, minimercados, distribuidoras, etc', '2026-03-30 20:45:29', 17, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (144, NULL, 3, 20, 630, NULL, 'Bazar, Decoración, textiles, muebles, electrodomesticos, articulos para el hogar.', '2026-03-30 20:45:29', 17, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (145, NULL, 3, 11, 839, NULL, 'Monotributista', '2026-03-30 20:56:17', 63, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (146, NULL, 3, 13, 339, NULL, 'Asociación de Turismo del Alto Uruguay', '2026-03-30 20:56:17', 63, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (147, NULL, 3, 14, 45, NULL, 'No encuentro la Cámara a la cual estoy afiliado', '2026-03-30 20:56:17', 63, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (148, NULL, 3, 16, NULL, NULL, 'Industria', '2026-03-30 20:56:17', 63, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (149, NULL, 3, 17, 570, NULL, 'De 0 a 5 personas', '2026-03-30 20:56:17', 63, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (150, NULL, 3, 22, 565, NULL, 'Aserradero, forestal', '2026-03-30 20:56:17', 63, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (151, NULL, 3, 22, 565, NULL, 'Ganadería, frigorífico', '2026-03-30 20:56:17', 63, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (152, NULL, 3, 25, 716, NULL, 'SI', '2026-03-30 20:56:17', 63, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (153, NULL, 3, 11, 838, NULL, 'Responsable Inscripto', '2026-03-31 10:21:04', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (154, NULL, 3, 13, 339, NULL, 'Asociación de Turismo del Alto Uruguay', '2026-03-31 10:21:04', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (155, NULL, 3, 14, 45, NULL, 'No encuentro la Cámara a la cual estoy afiliado', '2026-03-31 10:21:04', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (156, NULL, 3, 16, NULL, NULL, 'Comercio', '2026-03-31 10:21:04', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (157, NULL, 3, 17, 570, NULL, 'De 0 a 5 personas', '2026-03-31 10:21:04', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (158, NULL, 3, 20, 630, NULL, 'Tecnología, informática, celulares.', '2026-03-31 10:21:04', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (159, NULL, 3, 11, 839, NULL, 'Monotributista', '2026-03-31 10:56:27', 60, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (160, NULL, 3, 13, 339, NULL, 'Asociación de Turismo del Alto Uruguay', '2026-03-31 10:56:27', 60, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (161, NULL, 3, 14, 45, NULL, 'No encuentro la Cámara a la cual estoy afiliado', '2026-03-31 10:56:27', 60, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (162, NULL, 3, 16, 840, NULL, 'Comercio', '2026-03-31 10:56:27', 60, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (163, NULL, 3, 17, 570, NULL, 'De 0 a 5 personas', '2026-03-31 10:56:27', 60, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (164, NULL, 3, 20, 630, NULL, 'Alimentos y bebidas (supermercados, minimercados, distribuidoras, etc', '2026-03-31 10:56:27', 60, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (165, NULL, 3, 20, 630, NULL, 'Bazar, Decoración, textiles, muebles, electrodomesticos, articulos para el hogar.', '2026-03-31 10:56:27', 60, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (166, NULL, 3, 20, 630, NULL, 'Farmacia, perfumería, opticas, joyerìas, cuidado personal.', '2026-03-31 10:56:27', 60, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (167, NULL, 3, 20, 630, NULL, 'Indumentaria, calzado y marroquineria', '2026-03-31 10:56:27', 60, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (168, NULL, 3, 20, 630, NULL, 'Ferreteria, materiales construcción, eléctricos, maderas minoristas.', '2026-03-31 10:56:27', 60, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (169, NULL, 3, 20, 630, NULL, 'Repuestos maquinaria, automotor e insumos y consumibles para vehículos', '2026-03-31 10:56:27', 60, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (170, NULL, 3, 20, 630, NULL, 'Tecnología, informática, celulares.', '2026-03-31 10:56:27', 60, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (171, NULL, 3, 20, 630, NULL, 'Automóviles y motociletas.', '2026-03-31 10:56:27', 60, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (172, NULL, 3, 20, 630, NULL, 'Agropecuaria, veterinaria, insumos forestales, forrajeria.', '2026-03-31 10:56:27', 60, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (173, NULL, 3, 20, 630, NULL, 'Imprenta, librerías, Jugueterías.', '2026-03-31 10:56:27', 60, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (174, NULL, 3, 20, 630, NULL, 'Estaciones de Servicio, expendio de Combustibles y lubricantes', '2026-03-31 10:56:27', 60, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (175, NULL, 3, 20, 630, NULL, 'Gastronómicos (restaurantes y locales de comida rápida)', '2026-03-31 10:56:27', 60, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (176, NULL, 3, 20, 630, NULL, 'Metalúrgica (soldadura, forjado, aberturas de aluminio)', '2026-03-31 10:56:27', 60, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (177, NULL, 3, 11, 838, NULL, 'Responsable Inscripto', '2026-03-31 11:34:15', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (178, NULL, 3, 13, 339, NULL, 'Asociación de Turismo del Alto Uruguay', '2026-03-31 11:34:15', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (179, NULL, 3, 14, 45, NULL, 'No encuentro la Cámara a la cual estoy afiliado', '2026-03-31 11:34:15', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (180, NULL, 3, 16, 844, NULL, 'Producción', '2026-03-31 11:34:15', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (181, NULL, 3, 17, 571, NULL, 'De 5 a 10 personas', '2026-03-31 11:34:15', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (182, NULL, 3, 18, 721, NULL, 'Yerba Mate', '2026-03-31 11:34:15', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (183, NULL, 3, 18, 721, NULL, 'Té', '2026-03-31 11:34:15', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (184, NULL, 3, 18, 721, NULL, 'Forestal (madera en rollo, resina)', '2026-03-31 11:34:15', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (185, NULL, 3, 18, 721, NULL, 'Tabaco', '2026-03-31 11:34:15', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (186, NULL, 3, 18, 721, NULL, 'Ganadería (bovina, porcina, caprina, ovina y aves)', '2026-03-31 11:34:15', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (187, NULL, 3, 18, 721, NULL, 'Citrus (frutales perennes en general)', '2026-03-31 11:34:15', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (188, NULL, 3, 18, 721, NULL, 'Mandioca', '2026-03-31 11:34:15', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (189, NULL, 3, 18, 721, NULL, 'Cereales (Maíz, soja)', '2026-03-31 11:34:15', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (190, NULL, 3, 18, 721, NULL, 'Horticultura (varias verduras y frutas)', '2026-03-31 11:34:15', 2, NULL);
INSERT INTO `respuesta` (`id`, `empresa_id`, `encuesta_periodo_id`, `pregunta_id`, `opcion_id`, `valor_numerico`, `valor_texto`, `fecha_respuesta`, `localidad_id`, `sector_id`) VALUES (191, NULL, 3, 18, 721, NULL, 'Piscicultura', '2026-03-31 11:34:15', 2, NULL);

-- Structure for rubro
DROP TABLE IF EXISTS `rubro`;
CREATE TABLE `rubro` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sector_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sector_id` (`sector_id`),
  CONSTRAINT `rubro_ibfk_1` FOREIGN KEY (`sector_id`) REFERENCES `sector` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for rubro
INSERT INTO `rubro` (`id`, `sector_id`, `nombre`) VALUES (1, 1, 'Agroinsumos y Veterinaria');
INSERT INTO `rubro` (`id`, `sector_id`, `nombre`) VALUES (2, 1, 'Alimentos y Bebidas');
INSERT INTO `rubro` (`id`, `sector_id`, `nombre`) VALUES (3, 1, 'Automotor y Repuestos');
INSERT INTO `rubro` (`id`, `sector_id`, `nombre`) VALUES (4, 1, 'Construcción y Ferretería');
INSERT INTO `rubro` (`id`, `sector_id`, `nombre`) VALUES (5, 2, 'Producción Agrícola');
INSERT INTO `rubro` (`id`, `sector_id`, `nombre`) VALUES (6, 2, 'Producción Forestal');
INSERT INTO `rubro` (`id`, `sector_id`, `nombre`) VALUES (7, 2, 'Producción Ganadera');
INSERT INTO `rubro` (`id`, `sector_id`, `nombre`) VALUES (8, 3, 'Industria Agroindustrial');
INSERT INTO `rubro` (`id`, `sector_id`, `nombre`) VALUES (9, 3, 'Industria Alimenticia');
INSERT INTO `rubro` (`id`, `sector_id`, `nombre`) VALUES (10, 3, 'Industria Maderera');
INSERT INTO `rubro` (`id`, `sector_id`, `nombre`) VALUES (11, 4, 'Agencias y Operadores');
INSERT INTO `rubro` (`id`, `sector_id`, `nombre`) VALUES (12, 4, 'Alojamiento');
INSERT INTO `rubro` (`id`, `sector_id`, `nombre`) VALUES (13, 4, 'Turismo Aventura');
INSERT INTO `rubro` (`id`, `sector_id`, `nombre`) VALUES (14, 5, 'Servicios Profesionales');
INSERT INTO `rubro` (`id`, `sector_id`, `nombre`) VALUES (15, 5, 'Transporte y Logística');

-- Structure for seccion
DROP TABLE IF EXISTS `seccion`;
CREATE TABLE `seccion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `encuesta_id` int(11) NOT NULL,
  `titulo` varchar(200) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `orden` int(11) DEFAULT 0,
  `sector_id` int(11) DEFAULT NULL,
  `color` varchar(50) DEFAULT '#94a3b8',
  `siguiente_seccion_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `encuesta_id` (`encuesta_id`),
  KEY `fk_seccion_siguiente` (`siguiente_seccion_id`),
  CONSTRAINT `seccion_ibfk_1` FOREIGN KEY (`encuesta_id`) REFERENCES `encuesta` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_seccion_siguiente` FOREIGN KEY (`siguiente_seccion_id`) REFERENCES `seccion` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for seccion
INSERT INTO `seccion` (`id`, `encuesta_id`, `titulo`, `descripcion`, `orden`, `sector_id`) VALUES (1, 11, 'Sección Principal', NULL, 0, NULL);
INSERT INTO `seccion` (`id`, `encuesta_id`, `titulo`, `descripcion`, `orden`, `sector_id`) VALUES (2, 11, 'seccion 2', '', 2, NULL);
INSERT INTO `seccion` (`id`, `encuesta_id`, `titulo`, `descripcion`, `orden`, `sector_id`) VALUES (3, 11, 'Turismo', '', 3, 4);
INSERT INTO `seccion` (`id`, `encuesta_id`, `titulo`, `descripcion`, `orden`, `sector_id`) VALUES (4, 11, 'Comercio', '', 3, 1);
INSERT INTO `seccion` (`id`, `encuesta_id`, `titulo`, `descripcion`, `orden`, `sector_id`) VALUES (5, 11, 'Servicios', '', 3, 5);
INSERT INTO `seccion` (`id`, `encuesta_id`, `titulo`, `descripcion`, `orden`, `sector_id`) VALUES (6, 11, 'Industria', '', 3, 3);
INSERT INTO `seccion` (`id`, `encuesta_id`, `titulo`, `descripcion`, `orden`, `sector_id`) VALUES (7, 11, 'Producción', '', 3, 2);

-- Structure for sector
DROP TABLE IF EXISTS `sector`;
CREATE TABLE `sector` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `color` varchar(20) DEFAULT '#0ea5e9',
  `orden` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for sector
INSERT INTO `sector` (`id`, `nombre`, `color`, `orden`) VALUES (1, 'Comercio', '#ED7D31', 1);
INSERT INTO `sector` (`id`, `nombre`, `color`, `orden`) VALUES (2, 'Produccin', '#FFC000', 5);
INSERT INTO `sector` (`id`, `nombre`, `color`, `orden`) VALUES (3, 'Industria', '#7030A0', 3);
INSERT INTO `sector` (`id`, `nombre`, `color`, `orden`) VALUES (4, 'Turismo', '#4472C4', 4);
INSERT INTO `sector` (`id`, `nombre`, `color`, `orden`) VALUES (5, 'Servicios', '#70AD47', 2);

-- Structure for situacion_iva
DROP TABLE IF EXISTS `situacion_iva`;
CREATE TABLE `situacion_iva` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for situacion_iva
INSERT INTO `situacion_iva` (`id`, `nombre`) VALUES (1, 'Responsable Inscripto');
INSERT INTO `situacion_iva` (`id`, `nombre`) VALUES (2, 'Monotributista');

-- Structure for usuarios
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nombre` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `rol` enum('admin','user') DEFAULT 'admin',
  `estado` tinyint(1) DEFAULT 1,
  `fecha_creacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario` (`usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for usuarios
INSERT INTO `usuarios` (`id`, `usuario`, `password`, `nombre`, `email`, `rol`, `estado`, `fecha_creacion`) VALUES (1, 'admin', '$2b$10$OcAnECN3Bm1KIGjHDsoxcOjxP1.l1GnNQ0nggicpomXebbm2TxU6O', 'Enrique', 'enriqueloffler2@gmail.com', 'admin', 1, '2026-03-26 13:25:13');

SET FOREIGN_KEY_CHECKS = 1;
-- Actualización de colores de rubros/sectores según la imagen provista
UPDATE `sector` SET `color` = '#ED7D31' WHERE `nombre` LIKE 'Comercio%';
UPDATE `sector` SET `color` = '#FFC000' WHERE `nombre` LIKE 'Producci%';
UPDATE `sector` SET `color` = '#7030A0' WHERE `nombre` LIKE 'Industria%';
UPDATE `sector` SET `color` = '#4472C4' WHERE `nombre` LIKE 'Turismo%';
UPDATE `sector` SET `color` = '#70AD47' WHERE `nombre` LIKE 'Servicios%';

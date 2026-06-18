-- ============================================================
-- Migración: poblar sector_id en respuestas existentes
-- ============================================================
-- Este script asigna sector_id a las respuestas que tienen NULL,
-- usando dos estrategias:
--   1) Desde la respuesta del rubro (pregunta tipo selector_rubro)
--      en la misma sesión (mismo periodo + localidad + fecha)
--   2) Desde el sector_id de la sección de la pregunta
-- ============================================================

START TRANSACTION;

-- ============================================================
-- Paso 1: Obtener sector_id desde la respuesta del rubro
-- ============================================================
-- El rubro (selector_rubro) guarda el nombre del sector en valor_texto.
-- Lo vinculamos con la tabla sector manejando acentos.
-- ============================================================
UPDATE respuesta r
JOIN (
    SELECT 
        rubro.encuesta_periodo_id,
        rubro.localidad_id,
        rubro.fecha_respuesta,
        s.id AS sector_id
    FROM (
        -- Una respuesta de rubro por sesión (tomamos la primera si hay varias)
        SELECT r2.encuesta_periodo_id, r2.localidad_id, r2.fecha_respuesta,
               r2.valor_texto
        FROM respuesta r2
        JOIN pregunta p2 ON r2.pregunta_id = p2.id AND p2.tipo = 'selector_rubro'
        WHERE r2.valor_texto IS NOT NULL
        GROUP BY r2.encuesta_periodo_id, r2.localidad_id, r2.fecha_respuesta
    ) rubro
    LEFT JOIN sector s ON 
        -- Comparamos sin acentos, sin espacios, sin distinción mayúsculas
        LOWER(TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            rubro.valor_texto, 'Á', 'A'), 'É', 'E'), 'Í', 'I'), 'Ó', 'O'), 'Ú', 'U')))
        =
        LOWER(TRIM(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
            s.nombre, 'Á', 'A'), 'É', 'E'), 'Í', 'I'), 'Ó', 'O'), 'Ú', 'U')))
    WHERE s.id IS NOT NULL
) rubro_sector
    ON  r.encuesta_periodo_id = rubro_sector.encuesta_periodo_id
    AND r.localidad_id        = rubro_sector.localidad_id
    AND r.fecha_respuesta     = rubro_sector.fecha_respuesta
SET r.sector_id = rubro_sector.sector_id
WHERE r.sector_id IS NULL;

SELECT ROW_COUNT() AS 'filas_actualizadas_desde_rubro';

-- ============================================================
-- Paso 2: Para las que quedaron NULL, usar sector_id de la sección
-- ============================================================
UPDATE respuesta r
JOIN pregunta p ON r.pregunta_id = p.id
JOIN seccion sec ON p.seccion_id = sec.id
SET r.sector_id = sec.sector_id
WHERE r.sector_id IS NULL
  AND sec.sector_id IS NOT NULL;

SELECT ROW_COUNT() AS 'filas_actualizadas_desde_seccion';

-- ============================================================
-- Verificar cuántas quedaron sin sector_id
-- ============================================================
SELECT COUNT(*) AS 'respuestas_sin_sector_id' 
FROM respuesta 
WHERE sector_id IS NULL;

COMMIT;
-- ============================================================
-- Si algo salió mal, ejecutar: ROLLBACK;
-- ============================================================

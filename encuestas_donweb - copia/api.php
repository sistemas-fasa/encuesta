<?php
// backend/php/api.php
require_once __DIR__ . '/config.php';

// Obtener la URI y el método HTTP
$uri = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];

// Limpiar la URI para el enrutamiento (ej: /encuestas/api.php/login -> /login)
$scriptPath = $_SERVER['SCRIPT_NAME'];
$requestPath = str_replace($scriptPath, '', parse_url($uri, PHP_URL_PATH));
$requestPath = rtrim($requestPath, '/');
if (empty($requestPath)) $requestPath = '/';

// Leer el JSON entrante si es un POST/PUT
$input = json_decode(file_get_contents('php://input'), true);

// Función para obtener parámetros de la URL de una ruta dinámica (ej: /encuestas/:id)
function match_route($pattern, $path) {
    $pattern = preg_quote($pattern, '/');
    $pattern = str_replace('\:id', '(?P<id>[0-9]+)', $pattern);
    $pattern = '/^' . $pattern . '$/';
    if (preg_match($pattern, $path, $matches)) {
        return $matches;
    }
    return false;
}

// ==========================================
// ENDPOINTS
// ==========================================

switch ($method) {
    case 'POST':
        // LOGIN
        if ($requestPath === '/login') {
            $user = $input['usuario'] ?? '';
            $pass = $input['password'] ?? '';
            
            $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE usuario = ? AND estado = 1");
            $stmt->execute([$user]);
            $userData = $stmt->fetch();
            
            if ($userData && password_verify($pass, $userData['password'])) {
                $_SESSION['user'] = [
                    'id' => $userData['id'],
                    'usuario' => $userData['usuario'],
                    'rol' => $userData['rol'],
                    'nombre' => $userData['nombre']
                ];
                send_json(['message' => 'Login exitoso', 'user' => $_SESSION['user']]);
            } else {
                send_json(['error' => 'Usuario o contraseña inválidos'], 401);
            }
        }
        
        // LOGOUT
        if ($requestPath === '/logout') {
            session_destroy();
            send_json(['message' => 'Sesión cerrada']);
        }
        
        // CREATE ENCUESTA
        if ($requestPath === '/encuestas') {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("INSERT INTO encuesta (titulo, descripcion) VALUES (?, ?)");
            $stmt->execute([$input['titulo'], $input['descripcion']]);
            send_json(['id' => $pdo->lastInsertId(), 'titulo' => $input['titulo']]);
        }
        
        // CREATE PERIOD
        if ($requestPath === '/periodos') {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("INSERT INTO encuesta_periodo (mes, anio, encuesta_id, fecha_apertura, fecha_cierre) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$input['mes'], $input['anio'], $input['encuesta_id'], $input['fecha_apertura'] ?? null, $input['fecha_cierre'] ?? null]);
            send_json(['id' => $pdo->lastInsertId(), 'mes' => $input['mes']]);
        }

        // SAVE RESPUESTAS (SURVEY SUBMISSION)
        if ($requestPath === '/respuestas') {
            $localidad_id = $input['localidad_id'] ?? null;
            $periodo_id = $input['periodo_id'] ?? null;
            $respuestas = $input['respuestas'] ?? [];
            
            $pdo->beginTransaction();
            try {
                $stmt = $pdo->prepare("INSERT INTO respuesta (encuesta_periodo_id, localidad_id, pregunta_id, opcion_id, valor_texto, valor_numerico, sector_id) VALUES (?, ?, ?, ?, ?, ?, ?)");
                foreach ($respuestas as $ans) {
                    $stmt->execute([
                        $periodo_id,
                        $localidad_id,
                        $ans['pregunta_id'],
                        $ans['opcion_id'] ?? null,
                        $ans['valor_texto'] ?? null,
                        $ans['valor_numerico'] ?? null,
                        $ans['sector_id'] ?? null
                    ]);
                }
                $pdo->commit();
                send_json(['message' => 'Respuestas guardadas']);
            } catch (Exception $e) {
                $pdo->rollBack();
                send_json(['error' => 'Error al guardar: ' . $e->getMessage()], 500);
            }
        }

        // CREATE SECTION
        if ($requestPath === '/secciones') {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("INSERT INTO seccion (encuesta_id, titulo, descripcion, orden, sector_id) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$input['encuesta_id'], $input['titulo'], $input['descripcion'], $input['orden'], $input['sector_id']]);
            send_json(['id' => $pdo->lastInsertId(), 'titulo' => $input['titulo']]);
        }
        
        // CREATE SECTOR
        if ($requestPath === '/sectores') {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("INSERT INTO sector (nombre, color, orden) VALUES (?, ?, ?)");
            $stmt->execute([$input['nombre'], $input['color'], $input['orden']]);
            send_json(['id' => $pdo->lastInsertId(), 'nombre' => $input['nombre']]);
        }
        
        // CREATE LOCALIDAD
        if ($requestPath === '/localidades') {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("INSERT INTO localidad (nombre) VALUES (?)");
            $stmt->execute([$input['nombre']]);
            send_json(['id' => $pdo->lastInsertId(), 'nombre' => $input['nombre']]);
        }

        
        // CREATE QUESTION (legacy)
        // CREATE QUESTION
        if ($requestPath === '/preguntas' || $requestPath === '/banco-preguntas') {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $pdo->beginTransaction();
            try {
                $stmt = $pdo->prepare("INSERT INTO pregunta (texto_pregunta, tipo, orden, categoria) VALUES (?, ?, ?, ?)");
                $stmt->execute([$input['texto_pregunta'], $input['tipo'], $input['orden'] ?? 0, $input['categoria'] ?? null]);
                $pId = $pdo->lastInsertId();
                
                if (isset($input['encuesta_id'])) {
                    $stmtLink = $pdo->prepare("INSERT INTO encuesta_pregunta (encuesta_id, pregunta_id, seccion_id, orden) VALUES (?, ?, ?, ?)");
                    $stmtLink->execute([$input['encuesta_id'], $pId, $input['seccion_id'] ?? null, $input['orden'] ?? 0]);
                }
                
                $pdo->commit();
                send_json(['id' => $pId, 'texto_pregunta' => $input['texto_pregunta']]);
            } catch (Exception $e) {
                $pdo->rollBack();
                send_json(['error' => $e->getMessage()], 500);
            }
        }

        // LINK EXISTING QUESTION TO SURVEY
        if ($matches = match_route('/encuestas/:id/vincular-pregunta', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("INSERT INTO encuesta_pregunta (encuesta_id, pregunta_id, seccion_id, orden) 
                                 VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE seccion_id = ?, orden = ?");
            $stmt->execute([
                $matches['id'], 
                $input['pregunta_id'], 
                $input['seccion_id'] ?? null, 
                $input['orden'] ?? 0,
                $input['seccion_id'] ?? null,
                $input['orden'] ?? 0
            ]);
            send_json(['message' => 'Vinculado OK']);
        }
        
        // UPDATE OPTIONS
        if ($matches = match_route('/preguntas/:id/opciones', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $id = $matches['id'];
            $opciones = $input['opciones'] ?? [];
            $pdo->beginTransaction();
            try {
                // Update respuestas to NULL before deleting options to satisfy FK
                $pdo->prepare("UPDATE respuesta SET opcion_id = NULL WHERE pregunta_id = ?")->execute([$id]);
                $pdo->prepare("DELETE FROM opcion WHERE pregunta_id = ?")->execute([$id]);
                $stmt = $pdo->prepare("INSERT INTO opcion (pregunta_id, texto_opcion, valor, siguiente_seccion_id) VALUES (?, ?, ?, ?)");
                foreach ($opciones as $opt) {
                    $stmt->execute([$id, $opt['texto'], $opt['valor'] ?? null, $opt['siguiente_seccion_id'] ?? null]);
                }
                $pdo->commit();
                send_json(['message' => 'Opciones OK']);
            } catch (Exception $e) { $pdo->rollBack(); send_json(['error' => $e->getMessage()], 500); }
        }

        // DUPLICATE SURVEY
        if ($matches = match_route('/encuestas/:id/duplicate', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $surveyId = $matches['id'];
            
            $pdo->beginTransaction();
            try {
                // 1. Get original
                $stmt = $pdo->prepare("SELECT * FROM encuesta WHERE id = ?");
                $stmt->execute([$surveyId]);
                $original = $stmt->fetch();
                if (!$original) throw new Exception("Encuesta no encontrada");
                
                // 2. Duplicate survey
                $stmt = $pdo->prepare("INSERT INTO encuesta (titulo, descripcion) VALUES (?, ?)");
                $stmt->execute(['Copia de ' . $original['titulo'], $original['descripcion']]);
                $newSurveyId = $pdo->lastInsertId();
                
                // 3. Duplicate SECTIONS and map IDs
                $stmt = $pdo->prepare("SELECT * FROM seccion WHERE encuesta_id = ?");
                $stmt->execute([$surveyId]);
                $sections = $stmt->fetchAll();
                $sectionMap = [];
                
                $insertSec = $pdo->prepare("INSERT INTO seccion (encuesta_id, titulo, descripcion, orden, sector_id) VALUES (?, ?, ?, ?, ?)");
                foreach ($sections as $s) {
                    $insertSec->execute([$newSurveyId, $s['titulo'], $s['descripcion'], $s['orden'], $s['sector_id']]);
                    $sectionMap[$s['id']] = $pdo->lastInsertId();
                }
                
                // 4. Duplicate QUESTIONS
                $stmt = $pdo->prepare("SELECT * FROM pregunta WHERE encuesta_id = ?");
                $stmt->execute([$surveyId]);
                $questions = $stmt->fetchAll();
                $questionMap = [];
                
                $insertQ = $pdo->prepare("INSERT INTO pregunta (texto_pregunta, tipo, camara_id, encuesta_id, orden, seccion_id) VALUES (?, ?, ?, ?, ?, ?)");
                foreach ($questions as $q) {
                    $newSecId = $q['seccion_id'] ? ($sectionMap[$q['seccion_id']] ?? null) : null;
                    $insertQ->execute([$q['texto_pregunta'], $q['tipo'], $q['camara_id'], $newSurveyId, $q['orden'], $newSecId]);
                    $questionMap[$q['id']] = $pdo->lastInsertId();
                }
                
                // 5. Duplicate OPTIONS
                foreach ($questionMap as $oldQId => $newQId) {
                    $stmt = $pdo->prepare("SELECT * FROM opcion WHERE pregunta_id = ?");
                    $stmt->execute([$oldQId]);
                    $options = $stmt->fetchAll();
                    
                    $insertOpt = $pdo->prepare("INSERT INTO opcion (pregunta_id, texto_opcion, valor, siguiente_seccion_id) VALUES (?, ?, ?, ?)");
                    foreach ($options as $o) {
                        $nextSecId = $o['siguiente_seccion_id'] ? ($sectionMap[$o['siguiente_seccion_id']] ?? null) : null;
                        $insertOpt->execute([$newQId, $o['texto_opcion'], $o['valor'], $nextSecId]);
                    }
                }
                
                $pdo->commit();
                send_json(['message' => 'Duplicado exitoso', 'newId' => $newSurveyId]);
            } catch (Exception $e) {
                $pdo->rollBack();
                send_json(['error' => $e->getMessage()], 500);
            }
        }
        break;

    case 'GET':
        // ME (CHECK SESSION)
        if ($requestPath === '/me') {
            if (is_authenticated()) send_json($_SESSION['user']);
            send_json(['error' => 'No autenticado'], 401);
        }
        
        // ALL SURVEYS (ADMIN)
        if ($requestPath === '/encuestas') {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->query("SELECT * FROM encuesta ORDER BY id DESC");
            send_json($stmt->fetchAll());
        }
        
        // PUBLIC SURVEYS
        if ($requestPath === '/public/encuestas') {
            $stmt = $pdo->query("SELECT * FROM encuesta WHERE estado = 1 ORDER BY id DESC");
            send_json($stmt->fetchAll());
        }
        
        // SURVEY QUESTIONS (COMPLEX JOIN)
        if ($requestPath === '/preguntas') {
            $encuestaId = $_GET['encuesta_id'] ?? null;
            if (!$encuestaId) send_json(['error' => 'Falta encuesta_id'], 400);
            
            // JOIN with encuesta_pregunta for specific survey questions
            $stmt = $pdo->prepare("
                SELECT p.*, ep.seccion_id, ep.orden,
                       GROUP_CONCAT(o.texto_opcion ORDER BY o.id SEPARATOR '|||') as opciones_textos,
                       GROUP_CONCAT(o.id ORDER BY o.id SEPARATOR '|||') as opciones_ids,
                       GROUP_CONCAT(COALESCE(o.valor, 'NULL_VAL') ORDER BY o.id SEPARATOR '|||') as opciones_valores,
                       GROUP_CONCAT(COALESCE(o.siguiente_seccion_id, '') ORDER BY o.id SEPARATOR '|||') as opciones_saltos
                FROM pregunta p 
                JOIN encuesta_pregunta ep ON p.id = ep.pregunta_id
                LEFT JOIN opcion o ON p.id = o.pregunta_id
                WHERE ep.encuesta_id = ?
                GROUP BY p.id ORDER BY ep.seccion_id, ep.orden, p.id
            ");
            $stmt->execute([$encuestaId]);
            $rows = $stmt->fetchAll();
            
            $formatted = [];
            foreach ($rows as $r) {
                $opts = [];
                if ($r['opciones_textos']) {
                    $texts = explode('|||', $r['opciones_textos']);
                    $ids = explode('|||', $r['opciones_ids']);
                    $vals = explode('|||', $r['opciones_valores']);
                    $saltos = explode('|||', $r['opciones_saltos']);
                    
                    foreach ($texts as $i => $t) {
                        $opts[] = [
                            'id' => (int)$ids[$i],
                            'texto' => $t,
                            'valor' => ($vals[$i] === 'NULL_VAL') ? null : (float)$vals[$i],
                            'siguiente_seccion_id' => $saltos[$i] ? (int)$saltos[$i] : null
                        ];
                    }
                }
                $r['opciones'] = $opts;
                
                // Manual selection for Rubro selector
                if ($r['tipo'] === 'selector_rubro') {
                    $stmtSec = $pdo->prepare("
                        SELECT s.id as sector_id, s.nombre, s.color, sec.id as seccion_id
                        FROM sector s
                        LEFT JOIN seccion sec ON sec.sector_id = s.id AND sec.encuesta_id = ?
                        ORDER BY s.orden, s.nombre
                    ");
                    $stmtSec->execute([$encuestaId]);
                    $sectores = $stmtSec->fetchAll();
                    $r['opciones'] = array_map(function($s) {
                        return [
                            'id' => $s['sector_id'],
                            'texto' => $s['nombre'],
                            'sector_id' => $s['sector_id'],
                            'color' => $s['color'],
                            'siguiente_seccion_id' => $s['seccion_id'] ? (int)$s['seccion_id'] : null,
                            'valor' => null
                        ];
                    }, $sectores);
                }
                
                $formatted[] = $r;
            }
            send_json($formatted);
        }

        // STATS
        if ($matches = match_route('/stats/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $periodo_id = $matches['id'];
            $localidad_id = $_GET['localidad_id'] ?? null;
            $seccion_id = $_GET['seccion_id'] ?? null;
            $sector_id = $_GET['sector_id'] ?? null;
            
            // 1. Total Participantes
            $sqlTotal = "SELECT COUNT(*) as total FROM (SELECT DISTINCT fecha_respuesta, localidad_id FROM respuesta WHERE encuesta_periodo_id = ?";
            $paramsTotal = [$periodo_id];
            if ($localidad_id) { $sqlTotal .= " AND localidad_id = ?"; $paramsTotal[] = $localidad_id; }
            $sqlTotal .= ") as sub";
            $stmt = $pdo->prepare($sqlTotal);
            $stmt->execute($paramsTotal);
            $total = $stmt->fetch()['total'];
            
            // 2. Query Statistics
            $sqlStats = "SELECT r.pregunta_id, p.texto_pregunta, p.tipo, p.seccion_id, 
                                o.texto_opcion, r.valor_texto,
                                r.sector_id, s.nombre as sector_nombre, s.color as sector_color,
                                COUNT(*) as count, AVG(r.valor_numerico) as promedio
                        FROM respuesta r
                        JOIN pregunta p ON r.pregunta_id = p.id
                        LEFT JOIN opcion o ON r.opcion_id = o.id
                        LEFT JOIN sector s ON r.sector_id = s.id
                        WHERE r.encuesta_periodo_id = ?";
            $paramsStats = [$periodo_id];
            
            if ($localidad_id) { $sqlStats .= " AND r.localidad_id = ?"; $paramsStats[] = $localidad_id; }
            if ($seccion_id) { $sqlStats .= " AND p.seccion_id = ?"; $paramsStats[] = $seccion_id; }
            if ($sector_id) { $sqlStats .= " AND r.sector_id = ?"; $paramsStats[] = $sector_id; }
            
            $sqlStats .= " GROUP BY r.pregunta_id, o.id, r.valor_texto, r.sector_id";
            $stmt = $pdo->prepare($sqlStats);
            $stmt->execute($paramsStats);
            $answers = $stmt->fetchAll();
            
            // 3. Sector Distribution
            $stmtSec = $pdo->prepare("
                SELECT r.sector_id, s.nombre, s.color, COUNT(*) as count
                FROM respuesta r
                JOIN sector s ON r.sector_id = s.id
                WHERE r.encuesta_periodo_id = ? AND r.sector_id IS NOT NULL
                GROUP BY r.sector_id, s.nombre, s.color ORDER BY s.orden
            ");
            $stmtSec->execute([$periodo_id]);
            $sectors = $stmtSec->fetchAll();
            
            send_json([
                'total' => $total,
                'answers' => $answers,
                'sectorDistribution' => $sectors
            ]);
        }

        // STATS HISTORICAL
        if ($matches = match_route('/stats-historical/:encuesta_id/:pregunta_id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $encuesta_id = $matches['encuesta_id'];
            $pregunta_id = $matches['pregunta_id'];
            $sector_id = $_GET['sector_id'] ?? null;
            $localidad_id = $_GET['localidad_id'] ?? null;

            $sql = "SELECT ep.id as periodo_id, ep.mes, ep.anio,
                           o.texto_opcion, 
                           AVG(r.valor_numerico) as avg_value,
                           COUNT(r.id) as count
                    FROM encuesta_periodo ep
                    JOIN respuesta r ON r.encuesta_periodo_id = ep.id
                    LEFT JOIN opcion o ON r.opcion_id = o.id
                    WHERE ep.encuesta_id = ? AND r.pregunta_id = ?";
            
            $params = [$encuesta_id, $pregunta_id];
            
            if ($sector_id && $sector_id !== 'null') {
                $sql .= " AND r.sector_id = ?";
                $params[] = $sector_id;
            }
            if ($localidad_id) {
                $sql .= " AND r.localidad_id = ?";
                $params[] = $localidad_id;
            }
            
            $sql .= " GROUP BY ep.id, o.id ORDER BY ep.anio ASC, ep.mes ASC";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            send_json($stmt->fetchAll());
        }
        

        if ($requestPath === '/aux/data') {
            $localidades = [];
            $camaras = [];
            $ivas = [];
            $rubros = [];
            try { $localidades = $pdo->query("SELECT * FROM localidad ORDER BY nombre")->fetchAll(); } catch (Exception $e) {}
            try { $camaras = $pdo->query("SELECT * FROM camara ORDER BY nombre")->fetchAll(); } catch (Exception $e) {}
            try { $ivas = $pdo->query("SELECT * FROM situacion_iva ORDER BY nombre")->fetchAll(); } catch (Exception $e) {}
            try { $rubros = $pdo->query("SELECT * FROM rubro ORDER BY nombre")->fetchAll(); } catch (Exception $e) {}
            send_json(['localidades' => $localidades, 'camaras' => $camaras, 'ivas' => $ivas, 'rubros' => $rubros]);
        }
        
        if ($matches = match_route('/encuestas/:id/secciones', $requestPath)) {
             $stmt = $pdo->prepare("SELECT * FROM seccion WHERE encuesta_id = ? ORDER BY orden, id");
             $stmt->execute([$matches['id']]);
             send_json($stmt->fetchAll());
        }

        if ($matches = match_route('/public/encuestas/:id/secciones', $requestPath)) {
             $stmt = $pdo->prepare("SELECT * FROM seccion WHERE encuesta_id = ? ORDER BY orden, id");
             $stmt->execute([$matches['id']]);
             send_json($stmt->fetchAll());
        }
        
        if ($requestPath === '/sectores') {
             send_json($pdo->query("SELECT * FROM sector ORDER BY orden, nombre")->fetchAll());
        }
        
        if ($requestPath === '/localidades') {
             send_json($pdo->query("SELECT * FROM localidad ORDER BY nombre")->fetchAll());
        }
        
        if ($requestPath === '/periodos') {
            $surveyId = $_GET['encuesta_id'] ?? null;
            $sql = "SELECT * FROM encuesta_periodo";
            if ($surveyId) {
                $sql .= " WHERE encuesta_id = " . (int)$surveyId;
            }
            $sql .= " ORDER BY anio DESC, mes DESC";
            send_json($pdo->query($sql)->fetchAll());
        }

        // BANCO DE PREGUNTAS (ALL)
        if ($requestPath === '/banco-preguntas') {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->query("
                SELECT p.*, 
                       GROUP_CONCAT(o.texto_opcion ORDER BY o.id SEPARATOR '|||') as opciones_textos,
                       GROUP_CONCAT(o.id ORDER BY o.id SEPARATOR '|||') as opciones_ids,
                       GROUP_CONCAT(COALESCE(o.valor, 'NULL_VAL') ORDER BY o.id SEPARATOR '|||') as opciones_valores,
                       GROUP_CONCAT(COALESCE(o.siguiente_seccion_id, '') ORDER BY o.id SEPARATOR '|||') as opciones_saltos
                FROM pregunta p 
                LEFT JOIN opcion o ON p.id = o.pregunta_id
                GROUP BY p.id ORDER BY p.categoria, p.orden, p.id
            ");
            $rows = $stmt->fetchAll();
            $formatted = [];
            foreach ($rows as $r) {
                $opts = [];
                if ($r['opciones_textos']) {
                    $texts = explode('|||', $r['opciones_textos']);
                    $ids = explode('|||', $r['opciones_ids']);
                    $vals = explode('|||', $r['opciones_valores']);
                    $saltos = explode('|||', $r['opciones_saltos']);
                    foreach ($texts as $i => $t) {
                        $opts[] = [
                            'id' => (int)$ids[$i],
                            'texto' => $t,
                            'valor' => ($vals[$i] === 'NULL_VAL') ? null : (float)$vals[$i],
                            'siguiente_seccion_id' => $saltos[$i] ? (int)$saltos[$i] : null
                        ];
                    }
                }
                $r['opciones'] = $opts;
                $formatted[] = $r;
            }
            send_json($formatted);
        }

        break;

    case 'PUT':
        // TOGGLE STATUS
        if ($matches = match_route('/encuestas/:id/status', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("UPDATE encuesta SET estado = ? WHERE id = ?");
            $stmt->execute([$input['estado'], $matches['id']]);
            send_json(['message' => 'Status OK']);
        }
        
        // UPDATE ENCUESTA
        if ($matches = match_route('/encuestas/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("UPDATE encuesta SET titulo = ?, descripcion = ? WHERE id = ?");
            $stmt->execute([$input['titulo'], $input['descripcion'], $matches['id']]);
            send_json(['message' => 'Encuesta OK']);
        }

        // UPDATE SECTION
        if ($matches = match_route('/secciones/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("UPDATE seccion SET titulo = ?, descripcion = ?, orden = ?, sector_id = ? WHERE id = ?");
            $stmt->execute([$input['titulo'], $input['descripcion'], $input['orden'], $input['sector_id'], $matches['id']]);
            send_json(['message' => 'Sección OK']);
        }
        
        // UPDATE QUESTION
        if ($matches = match_route('/preguntas/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("UPDATE pregunta SET texto_pregunta = ?, tipo = ?, orden = ?, seccion_id = ? WHERE id = ?");
            $stmt->execute([$input['texto_pregunta'], $input['tipo'], $input['orden'], $input['seccion_id'], $matches['id']]);
            send_json(['message' => 'Pregunta OK']);
        }
        
        // UPDATE SECTOR
        if ($matches = match_route('/sectores/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("UPDATE sector SET nombre = ?, color = ?, orden = ? WHERE id = ?");
            $stmt->execute([$input['nombre'], $input['color'], $input['orden'], $matches['id']]);
            send_json(['message' => 'Sector OK']);
        }

        // UPDATE LOCALIDAD
        if ($matches = match_route('/localidades/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("UPDATE localidad SET nombre = ? WHERE id = ?");
            $stmt->execute([$input['nombre'], $matches['id']]);
            send_json(['message' => 'Localidad OK']);
        }

        // UPDATE BANCO PREGUNTA
        if ($matches = match_route('/banco-preguntas/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("UPDATE pregunta SET texto_pregunta = ?, tipo = ?, orden = ?, categoria = ? WHERE id = ?");
            $stmt->execute([$input['texto_pregunta'], $input['tipo'], $input['orden'] ?? 0, $input['categoria'] ?? null, $matches['id']]);
            send_json(['message' => 'Pregunta OK']);
        }
        break;

    case 'DELETE':
        // DELETE SURVEY
        if ($matches = match_route('/encuestas/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $surveyId = $matches['id'];
            $pdo->beginTransaction();
            try {
                // Cascading delete
                $pdo->prepare("DELETE FROM respuesta WHERE encuesta_periodo_id IN (SELECT id FROM encuesta_periodo WHERE encuesta_id = ?)")->execute([$surveyId]);
                $pdo->prepare("DELETE FROM encuesta_periodo WHERE encuesta_id = ?")->execute([$surveyId]);
                $pdo->prepare("DELETE FROM opcion WHERE pregunta_id IN (SELECT id FROM pregunta WHERE encuesta_id = ?)")->execute([$surveyId]);
                $pdo->prepare("DELETE FROM pregunta WHERE encuesta_id = ?")->execute([$surveyId]);
                $pdo->prepare("DELETE FROM seccion WHERE encuesta_id = ?")->execute([$surveyId]);
                $pdo->prepare("DELETE FROM encuesta WHERE id = ?")->execute([$surveyId]);
                $pdo->commit();
                send_json(['message' => 'Eliminado']);
            } catch (Exception $e) {
                $pdo->rollBack();
                send_json(['error' => $e->getMessage()], 500);
            }
        }
        
        // DELETE SECTION
        if ($matches = match_route('/secciones/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("DELETE FROM seccion WHERE id = ?");
            $stmt->execute([$matches['id']]);
            send_json(['message' => 'Eliminado']);
        }
        
        // DELETE QUESTION (Hard Delete from Bank)
        if ($matches = match_route('/preguntas/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $id = $matches['id'];
            $pdo->beginTransaction();
            try {
                $pdo->prepare("DELETE FROM encuesta_pregunta WHERE pregunta_id = ?")->execute([$id]);
                $pdo->prepare("DELETE FROM respuesta WHERE pregunta_id = ?")->execute([$id]);
                $pdo->prepare("DELETE FROM opcion WHERE pregunta_id = ?")->execute([$id]);
                $pdo->prepare("DELETE FROM pregunta WHERE id = ?")->execute([$id]);
                $pdo->commit();
                send_json(['message' => 'Eliminado permanentemente']);
            } catch (Exception $e) { $pdo->rollBack(); send_json(['error' => $e->getMessage()], 500); }
        }

        // UNLINK QUESTION FROM SURVEY
        if ($matches = match_route('/encuestas/:id/desvincular-pregunta/:pregunta_id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("DELETE FROM encuesta_pregunta WHERE encuesta_id = ? AND pregunta_id = ?");
            $stmt->execute([$matches['id'], $matches['pregunta_id']]);
            send_json(['message' => 'Desvinculado OK']);
        }
        
        // DELETE PERIOD (and its responses)
        if ($matches = match_route('/periodos/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $id = $matches['id'];
            $pdo->beginTransaction();
            try {
                // 1. Delete responses linked to this period
                $pdo->prepare("DELETE FROM respuesta WHERE encuesta_periodo_id = ?")->execute([$id]);
                
                // 2. Delete the period itself
                $stmt = $pdo->prepare("DELETE FROM encuesta_periodo WHERE id = ?");
                $stmt->execute([$id]);
                
                if ($stmt->rowCount() === 0) {
                    throw new Exception('Periodo no encontrado');
                }

                $pdo->commit();
                send_json(['message' => 'Eliminado']);
            } catch (Exception $e) {
                $pdo->rollBack();
                send_json(['error' => $e->getMessage()], 500);
            }
        }
        
        // DELETE SECTOR
        if ($matches = match_route('/sectores/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("DELETE FROM sector WHERE id = ?");
            $stmt->execute([$matches['id']]);
            send_json(['message' => 'Eliminado']);
        }
        
        // DELETE LOCALIDAD
        if ($matches = match_route('/localidades/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $stmt = $pdo->prepare("DELETE FROM localidad WHERE id = ?");
            $stmt->execute([$matches['id']]);
            send_json(['message' => 'Eliminado']);
        }

        // DELETE BANCO PREGUNTA
        if ($matches = match_route('/banco-preguntas/:id', $requestPath)) {
            if (!is_authenticated()) send_json(['error' => 'No autorizado'], 401);
            $id = $matches['id'];
            $pdo->beginTransaction();
            try {
                $check = $pdo->prepare("SELECT COUNT(*) as c FROM respuesta WHERE pregunta_id = ?");
                $check->execute([$id]);
                if ($check->fetch()['c'] > 0) {
                    throw new Exception('No se puede eliminar: tiene respuestas registradas.');
                }
                $pdo->prepare("DELETE FROM opcion WHERE pregunta_id = ?")->execute([$id]);
                $pdo->prepare("DELETE FROM pregunta WHERE id = ?")->execute([$id]);
                $pdo->commit();
                send_json(['message' => 'Eliminado']);
            } catch (Exception $e) { $pdo->rollBack(); send_json(['error' => $e->getMessage()], 500); }
        }
        break;
}

// Default 404
send_json(['error' => "Ruta no encontrada: $method $requestPath"], 404);
?>

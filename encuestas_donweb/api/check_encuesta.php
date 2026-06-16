<?php
header('Content-Type: text/html; charset=utf-8');
echo "<h2>Verificar encuesta seleccionada por defecto</h2>";

$host = 'localhost';
$db   = 'l0012413_encuest';
$user = 'l0012413_encuest';
$pass = 'SEvoba25pi';
$dsn = "mysql:host=$host;dbname=$db;charset=utf8mb4";
$pdo = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

// 1. Mostrar todas las encuestas (mismo orden que GET /encuestas)
echo "<h3>Todas las encuestas (ORDER BY id DESC):</h3>";
$stmt = $pdo->query("SELECT * FROM encuesta ORDER BY id DESC");
$encuestas = $stmt->fetchAll();
echo "<table border='1' cellpadding='5'>";
echo "<tr><th>ID</th><th>Título</th><th>Estado</th><th>Fecha</th></tr>";
foreach ($encuestas as $e) {
    echo "<tr><td>{$e['id']}</td><td>{$e['titulo']}</td><td>{$e['estado']}</td><td>{$e['fecha_creacion']}</td></tr>";
}
echo "</table>";

// La primera (default selection)
$default = $encuestas[0];
echo "<p><b>Encuesta seleccionada por defecto:</b> ID {$default['id']} - {$default['titulo']}</p>";

// 2. Periodos de esa encuesta
echo "<h3>Periodos de encuesta ID {$default['id']} (ORDER BY anio DESC, mes DESC):</h3>";
$stmt = $pdo->prepare("SELECT * FROM encuesta_periodo WHERE encuesta_id = ? ORDER BY anio DESC, mes DESC");
$stmt->execute([$default['id']]);
$periodos = $stmt->fetchAll();
echo "<table border='1' cellpadding='5'>";
echo "<tr><th>ID</th><th>Mes</th><th>Año</th></tr>";
foreach ($periodos as $p) {
    echo "<tr><td>{$p['id']}</td><td>{$p['mes']}</td><td>{$p['anio']}</td></tr>";
}
echo "</table>";

if (count($periodos) > 0) {
    $defaultPeriodo = $periodos[0];
    echo "<p><b>Período seleccionado por defecto:</b> ID {$defaultPeriodo['id']} - Mes {$defaultPeriodo['mes']}/{$defaultPeriodo['anio']}</p>";

    // 3. Total de respuestas DISTINCT de ese período
    $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM (SELECT DISTINCT r.fecha_respuesta, r.localidad_id FROM respuesta r WHERE r.encuesta_periodo_id = ?) as sub");
    $stmt->execute([$defaultPeriodo['id']]);
    $total = $stmt->fetch()['total'];
    echo "<p><b>Total respuestas (distinct):</b> {$total}</p>";

    // 4. Sector distribution
    $stmt = $pdo->prepare("SELECT r.sector_id, s.nombre, s.color, COUNT(*) as count FROM respuesta r JOIN sector s ON r.sector_id = s.id WHERE r.encuesta_periodo_id = ? AND r.sector_id IS NOT NULL GROUP BY r.sector_id, s.nombre, s.color ORDER BY s.orden");
    $stmt->execute([$defaultPeriodo['id']]);
    $sectores = $stmt->fetchAll();
    echo "<h3>Participación por rubro (sector distribution):</h3>";
    echo "<table border='1' cellpadding='5'>";
    echo "<tr><th>Sector ID</th><th>Nombre</th><th>Color</th><th>Count</th></tr>";
    $sum = 0;
    foreach ($sectores as $s) {
        echo "<tr><td>{$s['sector_id']}</td><td>{$s['nombre']}</td><td>{$s['color']}</td><td>{$s['count']}</td></tr>";
        $sum += $s['count'];
    }
    echo "</table>";
    echo "<p><b>Suma total sector distribution:</b> {$sum}</p>";

    // 5. Mostrar otras encuestas con sus totales
    echo "<h3>Otras encuestas y sus totales:</h3>";
    foreach ($encuestas as $e) {
        if ($e['id'] == $default['id']) continue;
        $stmt = $pdo->prepare("SELECT id FROM encuesta_periodo WHERE encuesta_id = ? LIMIT 1");
        $stmt->execute([$e['id']]);
        $per = $stmt->fetch();
        if ($per) {
            $stmt = $pdo->prepare("SELECT COUNT(*) as total FROM (SELECT DISTINCT r.fecha_respuesta, r.localidad_id FROM respuesta r WHERE r.encuesta_periodo_id = ?) as sub");
            $stmt->execute([$per['id']]);
            $t = $stmt->fetch()['total'];
            echo "<p>Encuesta ID {$e['id']} - {$e['titulo']}: {$t} respuestas</p>";
        } else {
            echo "<p>Encuesta ID {$e['id']} - {$e['titulo']}: Sin períodos</p>";
        }
    }
}
?>

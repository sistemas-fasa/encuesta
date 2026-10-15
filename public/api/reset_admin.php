<?php
// reset_admin.php - Script para restablecer la contraseña del admin en la base de datos
require_once __DIR__ . '/config.php';

header('Content-Type: text/html; charset=utf-8');

$newPassword = 'Fasa@2026';
$hash = '$2b$10$02B43gdpSPSazO9FAEdoEOG8QzmAJqo.TN9xTUmvR6EKSFAoThtCi';

echo "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Restablecer Administrador</title>";
echo "<style>body{font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}";
echo ".card{background:white;padding:2.5rem;border-radius:16px;box-shadow:0 10px 25px rgba(0,0,0,0.08);max-width:440px;width:90%;text-align:center;border:1px solid #e2e8f0;}";
echo "h2{color:#16a34a;margin-top:0;font-size:1.5rem;} p{color:#475569;line-height:1.6;} .box{background:#f1f5f9;padding:1rem;border-radius:8px;margin:1.5rem 0;text-align:left;font-family:monospace;font-size:0.95rem;}";
echo ".btn{display:inline-block;padding:0.75rem 1.5rem;background:#0ea5e9;color:white;text-decoration:none;border-radius:8px;font-weight:600;transition:0.2s;} .btn:hover{background:#0284c7;}</style>";
echo "</head><body><div class='card'>";

try {
    // 1. Verificar si existe la tabla usuarios
    $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE usuario = 'admin'");
    $stmt->execute();
    $user = $stmt->fetch();

    if ($user) {
        $update = $pdo->prepare("UPDATE usuarios SET password = ?, estado = 1 WHERE usuario = 'admin'");
        $update->execute([$hash]);
        echo "<h2>✅ Contraseña Actualizada</h2>";
        echo "<p>La contraseña del usuario administrador ha sido actualizada con éxito en la base de datos activa.</p>";
    } else {
        $insert = $pdo->prepare("INSERT INTO usuarios (usuario, password, nombre, email, rol, estado) VALUES ('admin', ?, 'Administrador', 'sistemas@ferreteriaavenida.com.ar', 'admin', 1)");
        $insert->execute([$hash]);
        echo "<h2>✅ Usuario Admin Creado</h2>";
        echo "<p>El usuario administrador no existía y fue creado exitosamente en la base de datos activa.</p>";
    }

    echo "<div class='box'>";
    echo "<div><strong>Usuario:</strong> admin</div>";
    echo "<div><strong>Contraseña:</strong> " . htmlspecialchars($newPassword) . "</div>";
    echo "<div><strong>Estado:</strong> Activo (1)</div>";
    echo "</div>";

    echo "<a class='btn' href='../login'>Ir a Iniciar Sesión</a>";
} catch (Exception $e) {
    echo "<h2 style='color:#dc2626;'>❌ Error de Base de Datos</h2>";
    echo "<p style='color:#dc2626;'>" . htmlspecialchars($e->getMessage()) . "</p>";
}

echo "</div></body></html>";

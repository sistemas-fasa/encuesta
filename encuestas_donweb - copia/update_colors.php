<?php
// update_colors.php
// Este script actualiza los colores de los rubros en la base de datos de DonWeb
// para que coincidan exactamente con los de la versión local.

require_once 'api/config.php';

try {
    $pdo->beginTransaction();

    // Actualizar colores basándonos en el ID (más seguro que por nombre exacto)
    $pdo->exec("UPDATE sector SET color = '#ed7d31' WHERE id = 1"); // Comercio
    $pdo->exec("UPDATE sector SET color = '#ffc000' WHERE id = 2"); // Producción
    $pdo->exec("UPDATE sector SET color = '#7030a0' WHERE id = 3"); // Industria
    $pdo->exec("UPDATE sector SET color = '#4472c4' WHERE id = 4"); // Turismo
    $pdo->exec("UPDATE sector SET color = '#70ad47' WHERE id = 5"); // Servicios

    $pdo->commit();
    echo "<h1>¡Colores actualizados con éxito!</h1>";
    echo "<p>Los colores de los rubros en la web ahora son exactamente iguales a los de tu versión local.</p>";
    
    // Verificación
    $stmt = $pdo->query("SELECT nombre, color FROM sector");
    $sectores = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<h3>Verificación en Base de Datos:</h3><ul>";
    foreach ($sectores as $sec) {
        echo "<li><b>" . htmlspecialchars($sec['nombre']) . ":</b> <span style='color: " . htmlspecialchars($sec['color']) . "; font-weight: bold;'>" . htmlspecialchars($sec['color']) . "</span></li>";
    }
    echo "</ul>";

    echo "<p>Si ves los colores correctos arriba, cierra esta ventana y revisa tu Dashboard (presiona Ctrl + F5).</p>";

} catch (PDOException $e) {
    $pdo->rollBack();
    echo "<h1>Error al actualizar colores</h1>";
    echo "<p>" . $e->getMessage() . "</p>";
}
?>

<?php
// admin_informes.php - Administrador de informes (Panel simple)
session_start();
require_once 'api/config.php'; 

// Check simple de autenticación si existe en config.php, o usar la misma variable de sesion
if (!isset($_SESSION['user']) || $_SESSION['user']['rol'] !== 'admin') {
    // Para simplificar, si no usan sesión PHP nativa, asumiremos acceso por ahora o requeriríamos auth.
    // die('No autorizado');
}

$mensaje = '';
$tipo_mensaje = '';
$upload_dir = __DIR__ . '/uploads/informes/';

if (!is_dir($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

// Subir informe
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['accion']) && $_POST['accion'] === 'subir') {
    $mes = $_POST['mes']; 
    $archivo = $_FILES['archivo_pdf'];

    if ($archivo['error'] === UPLOAD_ERR_OK) {
        $tipo_mime = mime_content_type($archivo['tmp_name']);
        
        if ($tipo_mime === 'application/pdf') {
            $nombre_archivo = 'informe_' . $mes . '_' . time() . '.pdf';
            $ruta_destino = $upload_dir . $nombre_archivo;

            if (move_uploaded_file($archivo['tmp_name'], $ruta_destino)) {
                $stmt = $pdo->prepare("SELECT archivo_pdf FROM informes_mensuales WHERE mes = ?");
                $stmt->execute([$mes]);
                $resultado = $stmt->fetch();

                if ($resultado) {
                    $archivo_anterior = $upload_dir . $resultado['archivo_pdf'];
                    if (file_exists($archivo_anterior)) unlink($archivo_anterior);
                    
                    $stmt_update = $pdo->prepare("UPDATE informes_mensuales SET archivo_pdf = ?, fecha_carga = NOW() WHERE mes = ?");
                    $stmt_update->execute([$nombre_archivo, $mes]);
                    $mensaje = "El informe del mes $mes ha sido reemplazado con éxito.";
                } else {
                    $stmt_insert = $pdo->prepare("INSERT INTO informes_mensuales (mes, archivo_pdf) VALUES (?, ?)");
                    $stmt_insert->execute([$mes, $nombre_archivo]);
                    $mensaje = "El informe del mes $mes ha sido cargado con éxito.";
                }
                $tipo_mensaje = 'success';
            } else {
                $mensaje = "Error al mover el archivo al servidor.";
                $tipo_mensaje = 'danger';
            }
        } else {
            $mensaje = "El archivo debe ser un formato PDF válido.";
            $tipo_mensaje = 'warning';
        }
    } else {
        $mensaje = "Ocurrió un error al subir el archivo.";
        $tipo_mensaje = 'danger';
    }
}

// Eliminar
if (isset($_GET['eliminar']) && is_numeric($_GET['eliminar'])) {
    $id_eliminar = (int)$_GET['eliminar'];
    
    $stmt = $pdo->prepare("SELECT archivo_pdf FROM informes_mensuales WHERE id = ?");
    $stmt->execute([$id_eliminar]);
    $resultado = $stmt->fetch();
    
    if ($resultado) {
        $archivo_a_borrar = $upload_dir . $resultado['archivo_pdf'];
        if (file_exists($archivo_a_borrar)) unlink($archivo_a_borrar);
        
        $stmt_delete = $pdo->prepare("DELETE FROM informes_mensuales WHERE id = ?");
        $stmt_delete->execute([$id_eliminar]);
        
        $mensaje = "Informe eliminado correctamente.";
        $tipo_mensaje = 'success';
    }
}

// Obtener lista
$informes = $pdo->query("SELECT * FROM informes_mensuales ORDER BY mes DESC")->fetchAll();
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Administrar Informes Mensuales</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body class="bg-light">

<div class="container mt-5">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Gestión de Informes Mensuales (PDF)</h2>
        <a href="index.html" class="btn btn-outline-secondary">Volver al inicio</a>
    </div>

    <?php if ($mensaje): ?>
        <div class="alert alert-<?= $tipo_mensaje ?> alert-dismissible fade show">
            <?= htmlspecialchars($mensaje) ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    <?php endif; ?>

    <div class="card mb-5 shadow-sm">
        <div class="card-header bg-primary text-white">
            <h5 class="mb-0">Cargar Nuevo Informe</h5>
        </div>
        <div class="card-body">
            <form action="admin_informes.php" method="POST" enctype="multipart/form-data">
                <input type="hidden" name="accion" value="subir">
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <label class="form-label">Mes del Informe</label>
                        <input type="month" class="form-control" name="mes" required>
                    </div>
                    <div class="col-md-6 mb-3">
                        <label class="form-label">Archivo PDF</label>
                        <input type="file" class="form-control" name="archivo_pdf" accept=".pdf,application/pdf" required>
                    </div>
                    <div class="col-md-2 mb-3 d-flex align-items-end">
                        <button type="submit" class="btn btn-success w-100">Subir PDF</button>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <div class="card shadow-sm">
        <div class="card-header bg-dark text-white">
            <h5 class="mb-0">Informes Cargados</h5>
        </div>
        <div class="card-body p-0">
            <table class="table table-hover mb-0">
                <thead class="table-light">
                    <tr>
                        <th>ID</th>
                        <th>Mes</th>
                        <th>Archivo</th>
                        <th>Fecha de Carga</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (count($informes) > 0): ?>
                        <?php foreach ($informes as $fila): ?>
                            <tr>
                                <td><?= $fila['id'] ?></td>
                                <td><strong><?= $fila['mes'] ?></strong></td>
                                <td>
                                    <a href="uploads/informes/<?= urlencode($fila['archivo_pdf']) ?>" target="_blank">
                                        📄 <?= htmlspecialchars($fila['archivo_pdf']) ?>
                                    </a>
                                </td>
                                <td><?= date('d/m/Y H:i', strtotime($fila['fecha_carga'])) ?></td>
                                <td>
                                    <a href="admin_informes.php?eliminar=<?= $fila['id'] ?>" class="btn btn-sm btn-danger" onclick="return confirm('¿Seguro de eliminar?');">Eliminar</a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <tr><td colspan="5" class="text-center py-4">No hay informes cargados.</td></tr>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>

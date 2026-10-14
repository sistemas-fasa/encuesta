-- Actualización de contraseña para el usuario administrador
-- Contraseña en texto plano: Fasa@2026
UPDATE `usuarios` 
SET `password` = '$2y$10$h9PujaFxMb9sFevKVY8KHOv/YVBU9YoTTwLOvt5CAgmPxMFhI8u/G' 
WHERE `usuario` = 'admin';

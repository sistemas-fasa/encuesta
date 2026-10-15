-- Actualización de contraseña para el usuario administrador
-- Contraseña en texto plano: Fasa@2026 (Compatible 100% con Node.js bcrypt y PHP password_verify)
UPDATE `usuarios` 
SET `password` = '$2b$10$02B43gdpSPSazO9FAEdoEOG8QzmAJqo.TN9xTUmvR6EKSFAoThtCi', 
    `estado` = 1 
WHERE `usuario` = 'admin';

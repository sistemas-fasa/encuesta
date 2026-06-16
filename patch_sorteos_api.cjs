const fs = require('fs');

const paths = [
    'C:\\Users\\Pc\\Documents\\Encuestas\\public\\api\\api.php',
    'C:\\Users\\Pc\\Documents\\Encuestas\\encuestas_donweb\\api\\api.php',
    'C:\\Users\\Pc\\Documents\\Encuestas\\dist\\api\\api.php'
];

paths.forEach(p => {
    if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');

        // Patch POST /sorteos
        content = content.replace(
            /INSERT INTO sorteos \(nombre, periodo, fecha_inicio, fecha_fin, activo\) VALUES \(\?, \?, \?, \?, \?\)/g,
            "INSERT INTO sorteos (nombre, subtitulo, premios, periodo, fecha_inicio, fecha_fin, activo) VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        content = content.replace(
            /\$stmt->execute\(\\[\$input\['nombre'\], \$input\['periodo'\], \$input\['fecha_inicio'\], \$input\['fecha_fin'\], \$activo\\]\);/g,
            `$subtitulo = $input['subtitulo'] ?? '';
                $premios = $input['premios'] ?? '';
                $stmt->execute([$input['nombre'], $subtitulo, $premios, $input['periodo'], $input['fecha_inicio'], $input['fecha_fin'], $activo]);`
        );

        // Patch PUT /sorteos/:id
        content = content.replace(
            /UPDATE sorteos SET nombre = \?, periodo = \?, fecha_inicio = \?, fecha_fin = \?, activo = \? WHERE id = \?/g,
            "UPDATE sorteos SET nombre = ?, subtitulo = ?, premios = ?, periodo = ?, fecha_inicio = ?, fecha_fin = ?, activo = ? WHERE id = ?"
        );
        // We have to be careful with the execute for UPDATE, let's use a simpler regex
        if (content.includes("UPDATE sorteos SET nombre = ?, subtitulo = ?, premios = ?")) {
            // Already replaced SQL, now replace execute
            content = content.replace(
                /\$stmt->execute\(\\[\$input\['nombre'\], \$input\['periodo'\], \$input\['fecha_inicio'\], \$input\['fecha_fin'\], \$activo, \$id\\]\);/g,
                `$subtitulo = $input['subtitulo'] ?? '';
                $premios = $input['premios'] ?? '';
                $stmt->execute([$input['nombre'], $subtitulo, $premios, $input['periodo'], $input['fecha_inicio'], $input['fecha_fin'], $activo, $id]);`
            );
        }

        fs.writeFileSync(p, content, 'utf8');
        console.log('Patched ' + p);
    }
});

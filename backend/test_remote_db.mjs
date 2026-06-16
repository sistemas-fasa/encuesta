import net from 'net';

const host = 'ko000378.ferozo.com';
const port = 3306;

console.log(`🔍 Probando si el puerto ${port} está abierto en ${host}...`);

const socket = new net.Socket();
socket.setTimeout(5000);

socket.on('connect', () => {
    console.log('✅ ¡BUENAS NOTICIAS! El puerto 3306 está ABIERTO.');
    console.log('Esto significa que el servidor de DonWeb acepta conexiones externas.');
    socket.destroy();
});

socket.on('timeout', () => {
    console.log('❌ ERROR: Tiempo de espera agotado. El puerto parece estar CERRADO.');
    console.log('Esto confirma que DonWeb bloquea las conexiones externas.');
    socket.destroy();
});

socket.on('error', (err) => {
    console.log('❌ ERROR de conexión:', err.message);
    console.log('Confirmado: El servidor no acepta conexiones desde fuera de DonWeb.');
});

socket.connect(port, host);

<?php
// Temporary debug file
require_once __DIR__ . '/config.php';

header('Content-Type: text/plain; charset=utf-8');

$logDir = __DIR__ . '/../../logs';
$logFiles = glob($logDir . '/encuestas_*.log*');
rsort($logFiles);

echo "Log files found in $logDir:\n";
foreach ($logFiles as $lf) {
    echo "- " . basename($lf) . " (" . filesize($lf) . " bytes)\n";
}

if (!empty($logFiles)) {
    echo "\n--- LATEST LOG ENTRIES ({" . basename($logFiles[0]) . "}) ---\n";
    $lines = file($logFiles[0]);
    if ($lines) {
        $latest = array_slice(array_reverse($lines), 0, 10);
        foreach ($latest as $l) {
            echo $l;
        }
    }
} else {
    echo "\nNo log files found.\n";
}

// Also check php_error.log
$phpErrorLog = $logDir . '/php_error.log';
if (file_exists($phpErrorLog)) {
    echo "\n--- LATEST PHP ERRORS ---\n";
    $lines = file($phpErrorLog);
    if ($lines) {
        $latest = array_slice(array_reverse($lines), 0, 20);
        foreach ($latest as $l) {
            echo $l;
        }
    }
} else {
    echo "\nNo php_error.log found.\n";
}

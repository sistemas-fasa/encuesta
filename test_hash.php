<?php
$hash_admin = '$2b$10$FGIvlsDsY7Us2xvkl2cFGebCvhX6b7nbr48cLbqpPru...'; // We don't have the full hash
$hash_luis = '$2y$10$mzay7Pu4OIYPNkoz6K8sV.BIkF/KtG3V/FTcGWE4v5N...';

// Let's just create a new hash for "123456" and test it
$test_pass = "123456";
$hash = password_hash($test_pass, PASSWORD_DEFAULT);
echo "Hash: " . $hash . "\n";
echo "Verify 123456: " . (password_verify("123456", $hash) ? "OK" : "FAIL") . "\n";

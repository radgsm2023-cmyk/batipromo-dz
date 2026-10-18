@echo off
chcp 65001 > nul
title BATIPROMO DZ - Publication en Ligne (Tunnel Public)
color 0B

echo ======================================================================
echo          BATIPROMO DZ - Publication Public Internet
echo ======================================================================
echo.
echo Démarrage du tunnel sécurisé Cloudflare...
echo Vos collaborateurs peuvent y accéder depuis n'importe quel smartphone
echo ou ordinateur connecté à Internet (4G, Wi-Fi).
echo.
echo ======================================================================

c:\projectpromo\cloudflared.exe tunnel --url http://127.0.0.1:5000
pause

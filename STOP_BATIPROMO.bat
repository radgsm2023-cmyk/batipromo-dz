@echo off
chcp 65001 > nul
title BATIPROMO DZ - Arrêt du Serveur
color 0C

echo ======================================================================
echo          BATIPROMO DZ - Arrêt du Serveur Local
echo ======================================================================
echo.
echo Recherche des processus actifs sur le port 5000...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do (
    echo Arrêt du processus PID %%a...
    taskkill /F /PID %%a > nul 2>&1
)

echo.
echo Le serveur BATIPROMO DZ a été arrêté avec succès.
echo ======================================================================
timeout /t 3

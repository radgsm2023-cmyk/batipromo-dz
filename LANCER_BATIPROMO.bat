@echo off
chcp 65001 > nul
title BATIPROMO DZ - Démarrage Production
color 0A

echo ======================================================================
echo          BATIPROMO DZ - Système de Gestion Immobilière
echo ======================================================================
echo.
echo [1/3] Vérification des modules et de l'environnement...
cd /d "%~dp0"

echo [2/3] Démarrage du serveur BATIPROMO DZ sur le port 5000...
echo.
echo - Accès Local sur ce PC : http://localhost:5000
echo - Accès Réseau (Mobiles/Tablettes) : http://192.168.100.2:5000
echo.
echo [3/3] Ouverture automatique du navigateur...
start http://localhost:5000

echo.
echo Le serveur fonctionne en arrière-plan.
echo Pour fermer l'application, appuyez sur Ctrl+C ou fermez cette fenêtre.
echo ======================================================================
echo.

node server/index.js
pause

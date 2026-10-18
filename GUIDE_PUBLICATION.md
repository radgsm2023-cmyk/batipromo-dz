# 🚀 Guide de Publication & Déploiement - BATIPROMO DZ

Ce guide détaille comment publier, déployer et rendre accessible votre application **BATIPROMO DZ** pour vous, vos chefs de chantier et votre équipe administrative.

---

## 1. 🖥️ Utilisation Immédiate en 1 Clic (Poste de Travail / Bureau)

Votre application est déjà compilée et prête à l'emploi.

* **Pour démarrer l'application :** Double-cliquez sur le fichier [`LANCER_BATIPROMO.bat`](file:///c:/projectpromo/LANCER_BATIPROMO.bat).
  * Le serveur se lance en production sur le port `5000`.
  * Votre navigateur par défaut s'ouvre automatiquement sur : **`http://localhost:5000`**.
* **Pour arrêter l'application :** Double-cliquez sur [`STOP_BATIPROMO.bat`](file:///c:/projectpromo/STOP_BATIPROMO.bat) ou fermez la fenêtre de commande.

---

## 2. 📱 Accès Réseau Local (Smartphones & Tablettes sur Chantier / Bureau)

L'application est **100% responsive** et dotée d'une barre de navigation mobile type application native.

* Lorsque le serveur est démarré sur votre machine, tous les appareils connectés au même réseau (Wi-Fi de l'entreprise ou partage de connexion 4G) peuvent y accéder directement.
* **Adresse d'accès réseau :**
  ```text
  http://192.168.100.2:5000
  ```
* **Astuce Mobile (PWA) :** Sur iPhone (Safari) ou Android (Chrome), ouvrez cette adresse et choisissez **« Ajouter à l'écran d'accueil »** pour l'utiliser comme une véritable application mobile sans barre de navigateur.

---

## 3. 🌐 Publication sur Serveur Cloud / VPS (Hébergement en ligne)

Pour rendre l'application accessible 24h/24 depuis n'importe où en Algérie et dans le monde avec un nom de domaine (ex: `https://app.votredomaine.dz`) :

### Option A : Déploiement avec Docker & Docker Compose (Recommandé)
1. Transférez le dossier `projectpromo` sur votre VPS (Ubuntu / Debian).
2. Lancez simplement :
   ```bash
   docker compose up -d --build
   ```
   L'application est automatiquement isolée et démarrée.

### Option B : Déploiement avec Node.js & PM2
1. Installez PM2 globalement :
   ```bash
   npm install -g pm2
   ```
2. Lancez le service :
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### Configuration du Reverse Proxy Nginx (avec SSL HTTPS gratuit Certbot)
```nginx
server {
    server_name app.votredomaine.dz;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 25M;
    }
}
```

---

## 4. 💾 Sauvegardes de Sécurité (Backups)

* **Depuis l'interface :** Allez dans le menu **Paramètres** de l'application et cliquez sur **« Exporter la sauvegarde complète »**.
* **Sauvegarde manuelle du fichier :** Le fichier de base de données SQLite contenant toutes vos données s'appelle `batipromo.db`. Il vous suffit de copier ce fichier sur une clé USB ou un stockage cloud (Google Drive, OneDrive) pour conserver une sauvegarde sécurisée.

---

## 5. 👥 Comptes de Démonstration Inclus

* **Directeur Général / Admin :** `direction@promo.dz` (mot de passe configuré lors de l'initialisation)
* **Chef de Chantier :** `karim.b@promo.dz`
* **Comptable :** `compta@promo.dz`

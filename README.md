# TwinSync IoT - Jumeau Numérique Industriel Haute Fidélité

**TwinSync IoT** est une application de Jumeau Numérique (*Digital Twin*) en temps réel pour équipement connecté industriel (Turbine & Groupe Moto-Propulseur `AERO-9000X`). Elle permet la surveillance continue des performances électro-mécaniques, le diagnostic thermique, la détection précoce d'anomalies vibratoires et la maintenance prédictive.

---

## 🚀 Fonctionnalités Clés

### 1. Visualiseur 3D Interactif (Three.js)
- **Modèle mécanique procédural PBR** : Carénage en aluminium à ailettes de dissipation, rotor magnétique avec rainures de ventilation, pales de turbine en titane anodisé, roulements de précision et passerelle IoT durcie.
- **Synchronisation dynamique de rotation** : Vitesse de rotation du rotor et du rouet de turbine indexée à la télémétrie réelle (0 à 6 000 tr/min).
- **Vue Éclatée continue (*Exploded View*)** : Séparation axiale et radiale progressive des composants pour inspection des sous-ensembles internes.
- **4 Modes de Rendu 3D** :
  - **Standard (PBR)** : Matériaux physiques réalistes avec reflets d'environnement studio (*RoomEnvironment*).
  - **Thermique (Heatmap IR)** : Cartographie chromatique dynamique des températures réelles (20°C à >95°C).
  - **Nœuds Capteurs IoT** : Localisation des sondes avec balises 3D interactives cliquables.
  - **Rayons X / Translucide** : Vue de structure interne pour observer le rotor et les roulements en transparence.
- **Inspection 3D des Capteurs** : Clic sur une sonde dans la scène 3D pour afficher sa fiche technique détaillée (plage nominale, bus de communication, cadence d'échantillonnage).

### 2. Télémétrie & Monitoring en Temps Réel
- **Vibrations spectrales (ISO 10816-3)** : Classification instantanée par zones de sévérité (Zone A : Bonne, Zone B : Acceptable, Zone C : Tolérée, Zone D : Critique).
- **Thermographie multizone** : Suivi simultané des bobinages statoriques (sonde PT100), des paliers avant/arrière et du fluide de refroidissement.
- **Paramètres électriques & énergétiques** : Tension triphasée (U), intensité efficace (I), facteur de puissance ($\cos \varphi$), puissance active instantanée (kW) et énergie cumulée (kWh).
- **Circuit hydraulique** : Pression d'huile de lubrification et débit caloporteur.
- **Qualité de transmission IoT** : Cadence de paquets MQTT v5.0, latence ping (RTT) et écart temporel physique $\leftrightarrow$ jumeau numérique.

### 3. Contrôle Actionneur & Simulateur de Contraintes
- **Commandes bidirectionnelles** : Mise en marche / Arrêt, consigne de vitesse de rotation, réglage de la charge mécanique et bouton d'**Arrêt d'Urgence**.
- **Synthèse sonore procédurale** : Son réaliste du groupe moteur généré en direct par la **Web Audio API** selon le régime RPM (aucun fichier audio externe requis).
- **Injecteur d'anomalies (Stress-Tests)** :
  - *Balourd dynamique* (déséquilibre de masse 1X).
  - *Dégradation de roulement* (frottement et échauffement palier).
  - *Surchauffe stator* (défaut de ventilation bobinage).
  - *Chute de pression de lubrification* (fuite ou désamorçage pompe).
  - *Creux de tension réseau* (affaissement 15%).

### 4. Maintenance Prédictive & Traçabilité
- **Indice de santé global (*Health Score*)** : Score agrégé calculé sur 12 paramètres d'exploitation.
- **RUL (*Remaining Useful Life*)** : Estimation de la durée de vie résiduelle en heures d'exploitation avant révision majeure.
- **Diagnostic Prescriptif IA** : Générateur de rapports d'intervention avec préconisations de maintenance et kit de pièces de rechange certifiées (roulements SKF, graisse synthétique Klüber, joints Viton).
- **Journal des alarmes & Exportation** : Historique traçable des alertes avec fonction d'acquittement et export direct des jeux de données en formats **CSV** et **JSON**.

---

## 🛠️ Architecture Technique

| Composant | Technologie |
| :--- | :--- |
| **Framework UI** | React 19 + TypeScript |
| **Moteur 3D WebGL** | Three.js (Rendu PBR, PMREM RoomEnvironment, PCFSoftShadowMap) |
| **Styles & Design** | Tailwind CSS v4, Typographies *Plus Jakarta Sans* & *JetBrains Mono* |
| **Audio Procédural** | Web Audio API (Oscillateurs basse fréquence + filtre passe-bas résonant) |
| **Simulation Télémétrique** | Moteur physique dédié en boucle continue à 500 ms |
| **Icônes** | Lucide React |
| **Outil de Build** | Vite 8 + `@tailwindcss/vite` |

---

## 📦 Installation et Lancement

### Prérequis
- **Node.js** (version 20 ou supérieure recommandée)
- **npm** ou équivalent

### 1. Installation des dépendances
```bash
npm install
```

### 2. Démarrage du serveur de développement
```bash
npm run dev
```
L'application sera accessible sur `http://localhost:3000`.

### 3. Vérification du typage et linting
```bash
npm run lint
```

### 4. Compilation pour la production
```bash
npm run build
```

---

## ⌨️ Raccourcis Clavier

- `Espace` : Démarrer / Couper l'alimentation du groupe d'entraînement.
- Clic gauche + glisser : Rotation orbitale autour du modèle 3D.
- Molette de la souris : Zoom avant / Zoom arrière.
- Clic sur un marqueur lumineux : Ouverture instantanée de la fiche capteur.

---

## 📄 Licence
Ce projet est développé sous licence **Apache 2.0**.

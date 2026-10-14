/**
 * Visualiseur 3D interactif du Jumeau Numérique Industriel (Three.js)
 * Implémente le modèle mécanique complet (carénage, rotor, pales de turbine, roulements, passerelle IoT)
 * avec vue éclatée progressive, cartographie thermique dynamique, et marqueurs de capteurs.
 */

import React, { useEffect, useRef, useState, useTransition } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { TwinTelemetry, ViewMode, CameraPreset, SensorNodeInfo } from '../types/twin';

interface Twin3DViewerProps {
  telemetry: TwinTelemetry;
  viewMode: ViewMode;
  explodedProgress: number; // 0 à 1
  cameraPreset: CameraPreset;
  onSelectSensor: (sensor: SensorNodeInfo) => void;
}

// Emplacements des capteurs physiques
export const SENSOR_NODES: SensorNodeInfo[] = [
  {
    id: 'sensor-vib-front',
    name: 'Vib-X1 (Palier Avant)',
    type: 'vibration',
    position: [0, 0.4, 2.3],
    component: 'Roulement à billes avant',
    currentValue: '1.45',
    unit: 'mm/s',
    nominalRange: '0.2 - 2.3 mm/s (ISO Classe II)',
    description: 'Accéléromètre piézoélectrique triaxial mesurant les vibrations spectrales et les chocs mécaniques.',
    status: 'nominal',
  },
  {
    id: 'sensor-temp-stator',
    name: 'PT100-Winding (Stator)',
    type: 'temperature',
    position: [0, 1.35, 0],
    component: 'Bobinage cuivre statorique',
    currentValue: '58.4',
    unit: '°C',
    nominalRange: '40 - 75 °C (Classe d’isolation F)',
    description: 'Sonde thermométrique platine intégrée au cœur des encoches du bobinage cuivre.',
    status: 'nominal',
  },
  {
    id: 'sensor-temp-rear',
    name: 'Temp-R2 (Palier Arrière)',
    type: 'temperature',
    position: [0, 0.4, -2.1],
    component: 'Roulement à billes arrière',
    currentValue: '44.1',
    unit: '°C',
    nominalRange: '35 - 65 °C',
    description: 'Capteur de température infrarouge sans contact surveillant la cage du roulement.',
    status: 'nominal',
  },
  {
    id: 'sensor-oil-pres',
    name: 'Hydro-P1 (Lubrification)',
    type: 'pressure',
    position: [1.25, -0.6, 0.4],
    component: 'Circuit d’huile de lubrification',
    currentValue: '3.85',
    unit: 'bar',
    nominalRange: '3.2 - 4.5 bar',
    description: 'Transmetteur de pression piézorésistif surveillant l’intégrité du film d’huile hydrodynamique.',
    status: 'nominal',
  },
  {
    id: 'sensor-iot-edge',
    name: 'Edge-Gateway & Hall (Inverter)',
    type: 'gateway',
    position: [0, 2.25, 0.2],
    component: 'Module IoT & Inverter de puissance',
    currentValue: '24.8',
    unit: 'A',
    nominalRange: '10 - 45 A / 400 V',
    description: 'Passerelle industrielle durcie Edge Compute avec transducteur de courant à effet Hall et liaison MQTT.',
    status: 'nominal',
  },
];

// Couleurs thermiques basées sur la température
function getThermalColor(tempC: number): THREE.Color {
  // Gradient: 20C (Bleu profond) -> 45C (Cyan) -> 65C (Jaune-Vert) -> 80C (Orange) -> >95C (Rouge vif)
  const norm = Math.min(1, Math.max(0, (tempC - 20) / 75));
  const color = new THREE.Color();
  if (norm < 0.25) {
    color.setRGB(0.1, 0.2 + norm * 2.5, 0.8 + norm * 0.8);
  } else if (norm < 0.5) {
    const sub = (norm - 0.25) / 0.25;
    color.setRGB(0.1 + sub * 0.4, 0.85 + sub * 0.15, 0.8 - sub * 0.7);
  } else if (norm < 0.75) {
    const sub = (norm - 0.5) / 0.25;
    color.setRGB(0.5 + sub * 0.5, 1.0 - sub * 0.4, 0.1);
  } else {
    const sub = (norm - 0.75) / 0.25;
    color.setRGB(1.0, 0.6 - sub * 0.55, 0.05);
  }
  return color;
}

export const Twin3DViewer: React.FC<Twin3DViewerProps> = ({
  telemetry,
  viewMode,
  explodedProgress,
  cameraPreset,
  onSelectSensor,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();
  const [hoveredSensor, setHoveredSensor] = useState<string | null>(null);

  // References pour l'animation Three.js
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const reqIdRef = useRef<number | null>(null);

  // Groupes du modèle mécanique
  const rotorGroupRef = useRef<THREE.Group | null>(null);
  const turbineGroupRef = useRef<THREE.Group | null>(null);
  const frontHousingRef = useRef<THREE.Group | null>(null);
  const rearHousingRef = useRef<THREE.Group | null>(null);
  const statorCylinderRef = useRef<THREE.Group | null>(null);
  const inverterTopRef = useRef<THREE.Group | null>(null);
  const frontBearingRef = useRef<THREE.Group | null>(null);
  const rearBearingRef = useRef<THREE.Group | null>(null);
  const sensorPinsGroupRef = useRef<THREE.Group | null>(null);

  // Matériaux pour bascule dynamique des modes
  const materialsMapRef = useRef<Map<string, { std: THREE.Material; thermal: THREE.Material; xray: THREE.Material }>>(new Map());

  // Contrôles de caméra & orbite
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0.5, 0));
  const cameraDesiredPosRef = useRef(new THREE.Vector3(5.2, 3.8, 5.8));
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const sphericalRef = useRef(new THREE.Spherical(9, Math.PI / 3, Math.PI / 4));

  // Valeurs réactives persistantes pour la boucle d'animation
  const telemetryStateRef = useRef(telemetry);
  telemetryStateRef.current = telemetry;
  const explodedProgressRef = useRef(explodedProgress);
  explodedProgressRef.current = explodedProgress;
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;

  // Ajustement caméra selon le preset
  useEffect(() => {
    switch (cameraPreset) {
      case 'iso':
        cameraDesiredPosRef.current.set(5.2, 3.8, 5.8);
        cameraTargetRef.current.set(0, 0.5, 0);
        break;
      case 'front':
        cameraDesiredPosRef.current.set(0, 0.8, 7.5);
        cameraTargetRef.current.set(0, 0.5, 0);
        break;
      case 'bearing':
        cameraDesiredPosRef.current.set(2.8, 1.8, 3.6);
        cameraTargetRef.current.set(0, 0.3, 2.2);
        break;
      case 'inverter':
        cameraDesiredPosRef.current.set(0.5, 5.2, 2.0);
        cameraTargetRef.current.set(0, 2.2, 0.2);
        break;
      case 'turbine':
        cameraDesiredPosRef.current.set(-3.2, 2.2, -4.8);
        cameraTargetRef.current.set(0, 0.4, -2.8);
        break;
    }
  }, [cameraPreset]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Initialisation Scène & Caméra
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070c18);
    scene.fog = new THREE.FogExp2(0x070c18, 0.025);
    sceneRef.current = scene;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80);
    camera.position.copy(cameraDesiredPosRef.current);
    camera.lookAt(cameraTargetRef.current);
    cameraRef.current = camera;

    // 2. Renderer & Pipeline Couleur
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 3. Studio Environment Map (PMREM RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xdde5f5, 0.65);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(6, 9, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 25;
    keyLight.shadow.camera.left = -6;
    keyLight.shadow.camera.right = 6;
    keyLight.shadow.camera.top = 6;
    keyLight.shadow.camera.bottom = -6;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x70a5ff, 1.1);
    fillLight.position.set(-6, 4, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    rimLight.position.set(0, -3, -8);
    scene.add(rimLight);

    // 5. Contact Shadow & Grille de sol technique
    const groundGeo = new THREE.PlaneGeometry(24, 24);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a1020,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.6;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grille circulaire discrète sur le sol
    const gridHelper = new THREE.PolarGridHelper(10, 16, 8, 32, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -1.59;
    scene.add(gridHelper);

    // Contact shadow soft plane
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const shadowCtx = shadowCanvas.getContext('2d');
    if (shadowCtx) {
      const grad = shadowCtx.createRadialGradient(64, 64, 0, 64, 64, 60);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      shadowCtx.fillStyle = grad;
      shadowCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(8, 8),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.7, depthWrite: false })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.58;
    scene.add(shadowPlane);

    // 6. MATÉRIAUX PROCÉDURAUX DE QUALITÉ INDUSTRIELLE PBR
    // Housing aluminium moulé
    const housingMatStd = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.35,
    });
    const housingMatThermal = new THREE.MeshStandardMaterial({
      color: getThermalColor(48),
      roughness: 0.3,
      metalness: 0.4,
    });
    const housingMatXray = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      metalness: 0.1,
      roughness: 0.2,
      transmission: 0.85,
      thickness: 1.2,
      transparent: true,
      opacity: 0.35,
      wireframe: false,
    });

    // Rotor & Arbre acier usiné
    const shaftMatStd = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      metalness: 0.95,
      roughness: 0.12,
    });
    const rotorCoreMatStd = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.9,
      roughness: 0.25,
    });

    // Bobinage cuivre
    const copperMatStd = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.88,
      roughness: 0.22,
    });
    const copperMatThermal = new THREE.MeshStandardMaterial({
      color: getThermalColor(65),
      roughness: 0.2,
      metalness: 0.3,
    });

    // Turbine titane anodisé
    const impellerMatStd = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.92,
      roughness: 0.18,
    });

    // Roulements acier chromé
    const bearingSteelMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.98,
      roughness: 0.05,
    });

    // Enceinte Électronique IoT supérieure
    const inverterMatStd = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.7,
      roughness: 0.4,
    });

    materialsMapRef.current.set('housing', { std: housingMatStd, thermal: housingMatThermal, xray: housingMatXray });
    materialsMapRef.current.set('copper', { std: copperMatStd, thermal: copperMatThermal, xray: housingMatXray });

    // 7. ASSEMBLAGE HIÉRARCHIQUE DU MODÈLE MÉCANIQUE

    // --- A. Stator & Carénage Central avec Ailettes de refroidissement ---
    const statorGroup = new THREE.Group();
    scene.add(statorGroup);
    statorCylinderRef.current = statorGroup;

    // Tube statorique principal
    const statorCylinderGeo = new THREE.CylinderGeometry(1.6, 1.6, 3.4, 48, 1, true);
    const statorMesh = new THREE.Mesh(statorCylinderGeo, housingMatStd);
    statorMesh.rotation.x = Math.PI / 2;
    statorMesh.castShadow = true;
    statorMesh.receiveShadow = true;
    statorGroup.add(statorMesh);

    // Ailettes de refroidissement circulaires (12 ailettes)
    const finGeo = new THREE.RingGeometry(1.58, 1.95, 48);
    for (let i = 0; i < 12; i++) {
      const fin = new THREE.Mesh(finGeo, housingMatStd);
      fin.position.z = -1.4 + i * 0.26;
      fin.castShadow = true;
      statorGroup.add(fin);
    }

    // Bobinages cuivre visibles à l'intérieur
    const coilCount = 10;
    const coilRadius = 1.35;
    for (let c = 0; c < coilCount; c++) {
      const angle = (c / coilCount) * Math.PI * 2;
      const coilGeo = new THREE.BoxGeometry(0.35, 0.45, 3.0);
      const coilMesh = new THREE.Mesh(coilGeo, copperMatStd);
      coilMesh.position.set(Math.cos(angle) * coilRadius, Math.sin(angle) * coilRadius, 0);
      coilMesh.rotation.z = angle;
      statorGroup.add(coilMesh);
    }

    // Pieds de fixation industriels
    const footGeo = new THREE.BoxGeometry(0.4, 0.4, 3.2);
    const footL = new THREE.Mesh(footGeo, housingMatStd);
    footL.position.set(-1.45, -1.35, 0);
    footL.castShadow = true;
    statorGroup.add(footL);

    const footR = new THREE.Mesh(footGeo, housingMatStd);
    footR.position.set(1.45, -1.35, 0);
    footR.castShadow = true;
    statorGroup.add(footR);

    // --- B. Flasque / Carter Avant (Front Housing Endcap) ---
    const frontHousingGroup = new THREE.Group();
    scene.add(frontHousingGroup);
    frontHousingRef.current = frontHousingGroup;

    const frontCapGeo = new THREE.CylinderGeometry(1.65, 1.65, 0.5, 48);
    const frontCapMesh = new THREE.Mesh(frontCapGeo, housingMatStd);
    frontCapMesh.rotation.x = Math.PI / 2;
    frontCapMesh.position.z = 1.95;
    frontCapMesh.castShadow = true;
    frontHousingGroup.add(frontCapMesh);

    // Bride de sortie avant
    const flangeFrontGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.4, 32);
    const flangeFront = new THREE.Mesh(flangeFrontGeo, housingMatStd);
    flangeFront.rotation.x = Math.PI / 2;
    flangeFront.position.z = 2.3;
    frontHousingGroup.add(flangeFront);

    // --- C. Flasque / Carter Arrière (Rear Housing Endcap & Grille) ---
    const rearHousingGroup = new THREE.Group();
    scene.add(rearHousingGroup);
    rearHousingRef.current = rearHousingGroup;

    const rearCapGeo = new THREE.CylinderGeometry(1.65, 1.65, 0.5, 48);
    const rearCapMesh = new THREE.Mesh(rearCapGeo, housingMatStd);
    rearCapMesh.rotation.x = Math.PI / 2;
    rearCapMesh.position.z = -1.95;
    rearCapMesh.castShadow = true;
    rearHousingGroup.add(rearCapMesh);

    // Grille de protection d'admission arrière
    const rearGrilleGeo = new THREE.TorusGeometry(1.2, 0.1, 16, 32);
    const rearGrille = new THREE.Mesh(rearGrilleGeo, shaftMatStd);
    rearGrille.position.z = -2.25;
    rearHousingGroup.add(rearGrille);

    // --- D. Roulements à billes de précision (Avant & Arrière) ---
    const createBearingMesh = () => {
      const brgGroup = new THREE.Group();
      // Bague externe
      const outerRing = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.08, 16, 32), bearingSteelMat);
      brgGroup.add(outerRing);
      // Bague interne
      const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.06, 16, 32), bearingSteelMat);
      brgGroup.add(innerRing);
      // 8 Billes chromées
      const ballGeo = new THREE.SphereGeometry(0.1, 16, 16);
      for (let b = 0; b < 8; b++) {
        const theta = (b / 8) * Math.PI * 2;
        const ball = new THREE.Mesh(ballGeo, bearingSteelMat);
        ball.position.set(Math.cos(theta) * 0.57, Math.sin(theta) * 0.57, 0);
        brgGroup.add(ball);
      }
      return brgGroup;
    };

    const frontBearing = createBearingMesh();
    frontBearing.position.z = 1.7;
    scene.add(frontBearing);
    frontBearingRef.current = frontBearing;

    const rearBearing = createBearingMesh();
    rearBearing.position.z = -1.7;
    scene.add(rearBearing);
    rearBearingRef.current = rearBearing;

    // --- E. Rotor & Arbre de Transmission (Rotating Subsystem) ---
    const rotorGroup = new THREE.Group();
    scene.add(rotorGroup);
    rotorGroupRef.current = rotorGroup;

    // Arbre central en acier
    const shaftGeo = new THREE.CylinderGeometry(0.38, 0.38, 6.2, 32);
    const shaftMesh = new THREE.Mesh(shaftGeo, shaftMatStd);
    shaftMesh.rotation.x = Math.PI / 2;
    shaftMesh.castShadow = true;
    rotorGroup.add(shaftMesh);

    // Clavette usinée sur le bout d'arbre avant
    const keyGeo = new THREE.BoxGeometry(0.1, 0.1, 0.8);
    const keyMesh = new THREE.Mesh(keyGeo, shaftMatStd);
    keyMesh.position.set(0, 0.38, 2.7);
    rotorGroup.add(keyMesh);

    // Noyau magnétique rotor (pôles aimantés)
    const rotorCoreGeo = new THREE.CylinderGeometry(1.15, 1.15, 2.6, 32);
    const rotorCoreMesh = new THREE.Mesh(rotorCoreGeo, rotorCoreMatStd);
    rotorCoreMesh.rotation.x = Math.PI / 2;
    rotorCoreMesh.castShadow = true;
    rotorGroup.add(rotorCoreMesh);

    // Rainures longitudinales de ventilation rotor
    const slotCount = 8;
    for (let s = 0; s < slotCount; s++) {
      const angle = (s / slotCount) * Math.PI * 2;
      const slotGeo = new THREE.BoxGeometry(0.12, 0.12, 2.62);
      const slotMesh = new THREE.Mesh(slotGeo, copperMatStd);
      slotMesh.position.set(Math.cos(angle) * 1.14, Math.sin(angle) * 1.14, 0);
      slotMesh.rotation.z = angle;
      rotorGroup.add(slotMesh);
    }

    // --- F. Turbine Aérodynamique / Rouet (Impeller Blades) ---
    const turbineGroup = new THREE.Group();
    turbineGroup.position.z = -2.35;
    rotorGroup.add(turbineGroup);
    turbineGroupRef.current = turbineGroup;

    // Moyeu profilé
    const impellerHubGeo = new THREE.ConeGeometry(0.65, 0.8, 32);
    const impellerHub = new THREE.Mesh(impellerHubGeo, impellerMatStd);
    impellerHub.rotation.x = -Math.PI / 2;
    turbineGroup.add(impellerHub);

    // 12 Pales profilées en spirale
    const bladeCount = 12;
    for (let b = 0; b < bladeCount; b++) {
      const bAngle = (b / bladeCount) * Math.PI * 2;
      const bladeGeo = new THREE.BoxGeometry(0.1, 0.8, 0.4);
      const bladeMesh = new THREE.Mesh(bladeGeo, impellerMatStd);
      bladeMesh.position.set(Math.cos(bAngle) * 0.75, Math.sin(bAngle) * 0.75, 0);
      bladeMesh.rotation.z = bAngle + 0.45;
      bladeMesh.rotation.y = 0.35;
      bladeMesh.castShadow = true;
      turbineGroup.add(bladeMesh);
    }

    // Anneau de carénage extérieur de turbine
    const impellerShroudGeo = new THREE.TorusGeometry(1.25, 0.08, 16, 32);
    const impellerShroud = new THREE.Mesh(impellerShroudGeo, impellerMatStd);
    turbineGroup.add(impellerShroud);

    // --- G. Module Supérieur Inverter & Passerelle Edge IoT ---
    const inverterGroup = new THREE.Group();
    inverterGroup.position.y = 1.95;
    scene.add(inverterGroup);
    inverterTopRef.current = inverterGroup;

    const inverterBoxGeo = new THREE.BoxGeometry(1.6, 0.65, 2.4);
    const inverterBox = new THREE.Mesh(inverterBoxGeo, inverterMatStd);
    inverterBox.castShadow = true;
    inverterGroup.add(inverterBox);

    // Ailettes de dissipation thermique sur le capot
    for (let hf = 0; hf < 7; hf++) {
      const heatFin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.18, 0.08), inverterMatStd);
      heatFin.position.set(0, 0.4, -0.9 + hf * 0.3);
      inverterGroup.add(heatFin);
    }

    // Connecteurs circulaires industriels M12 / Ethernet M12
    const connectorGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 16);
    const connector1 = new THREE.Mesh(connectorGeo, shaftMatStd);
    connector1.rotation.z = Math.PI / 2;
    connector1.position.set(0.85, 0.1, 0.5);
    inverterGroup.add(connector1);

    const connector2 = new THREE.Mesh(connectorGeo, shaftMatStd);
    connector2.rotation.z = Math.PI / 2;
    connector2.position.set(0.85, 0.1, -0.5);
    inverterGroup.add(connector2);

    // Antenne IoT industrielle
    const antennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 16), inverterMatStd);
    antennaStem.position.set(-0.6, 0.65, 0.7);
    inverterGroup.add(antennaStem);

    // Voyant d'état IoT fixe (pas de clignotement distrayant)
    const ledGeo = new THREE.SphereGeometry(0.07, 16, 16);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const ledMesh = new THREE.Mesh(ledGeo, ledMat);
    ledMesh.position.set(0.65, 0.35, 0.9);
    inverterGroup.add(ledMesh);

    // --- H. Pins & Marqueurs de Capteurs Interactifs (Sensor Nodes) ---
    const sensorPinsGroup = new THREE.Group();
    scene.add(sensorPinsGroup);
    sensorPinsGroupRef.current = sensorPinsGroup;

    const sensorPinMeshes: THREE.Mesh[] = [];
    SENSOR_NODES.forEach((s) => {
      const pinAnchor = new THREE.Group();
      pinAnchor.position.set(...s.position);
      pinAnchor.name = s.id;

      // Sphère du capteur
      const pinSphereGeo = new THREE.SphereGeometry(0.16, 24, 24);
      const pinMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 0.8,
        metalness: 0.5,
        roughness: 0.2,
      });
      const pinMesh = new THREE.Mesh(pinSphereGeo, pinMat);
      pinMesh.userData = { sensorInfo: s };
      pinAnchor.add(pinMesh);
      sensorPinMeshes.push(pinMesh);

      // Anneau de balise radio autour du capteur
      const ringGeo = new THREE.RingGeometry(0.24, 0.28, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x38bdf8,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      pinAnchor.add(ringMesh);

      sensorPinsGroup.add(pinAnchor);
    });

    // 8. Gestion des Interactions Souris / Tactile (Orbite & Clics)
    let pointerDown = false;
    let prevX = 0;
    let prevY = 0;
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      pointerDown = true;
      isDraggingRef.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevX = clientX;
      prevY = clientY;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (pointerDown) {
        const dx = clientX - prevX;
        const dy = clientY - prevY;
        prevX = clientX;
        prevY = clientY;

        sphericalRef.current.theta -= dx * 0.006;
        sphericalRef.current.phi = Math.max(0.15, Math.min(Math.PI / 2 + 0.2, sphericalRef.current.phi - dy * 0.006));

        const r = sphericalRef.current.radius;
        cameraDesiredPosRef.current.set(
          cameraTargetRef.current.x + r * Math.sin(sphericalRef.current.phi) * Math.sin(sphericalRef.current.theta),
          cameraTargetRef.current.y + r * Math.cos(sphericalRef.current.phi),
          cameraTargetRef.current.z + r * Math.sin(sphericalRef.current.phi) * Math.cos(sphericalRef.current.theta)
        );
      } else if ('clientX' in e) {
        // Raycast pour hover sur les capteurs
        const rect = container.getBoundingClientRect();
        mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouseCoord, camera);
        const intersects = raycaster.intersectObjects(sensorPinMeshes);
        if (intersects.length > 0) {
          const s = intersects[0].object.userData.sensorInfo as SensorNodeInfo;
          container.style.cursor = 'pointer';
          setHoveredSensor(s.name);
        } else {
          container.style.cursor = 'grab';
          setHoveredSensor(null);
        }
      }
    };

    const handlePointerUp = (e: MouseEvent | TouchEvent) => {
      // Détection clic sur un capteur si peu de déplacement
      if (pointerDown && 'clientX' in e) {
        const rect = container.getBoundingClientRect();
        mouseCoord.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseCoord.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouseCoord, camera);
        const intersects = raycaster.intersectObjects(sensorPinMeshes);
        if (intersects.length > 0) {
          const s = intersects[0].object.userData.sensorInfo as SensorNodeInfo;
          startTransition(() => {
            onSelectSensor(s);
          });
        }
      }
      pointerDown = false;
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.005;
      sphericalRef.current.radius = Math.max(3.5, Math.min(18.0, sphericalRef.current.radius + zoomDelta));
      const r = sphericalRef.current.radius;
      cameraDesiredPosRef.current.set(
        cameraTargetRef.current.x + r * Math.sin(sphericalRef.current.phi) * Math.sin(sphericalRef.current.theta),
        cameraTargetRef.current.y + r * Math.cos(sphericalRef.current.phi),
        cameraTargetRef.current.z + r * Math.sin(sphericalRef.current.phi) * Math.cos(sphericalRef.current.theta)
      );
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    dom.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp, { passive: true });
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // 9. Resize Observer pour adaptation fluide de la fenêtre
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Render Loop à 60 FPS avec Damping Exponentiel
    const clock = new THREE.Clock();
    let currentExploded = 0;

    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const t = telemetryStateRef.current;
      const currentMode = viewModeRef.current;
      const targetExploded = explodedProgressRef.current;

      // 1. Rotation du Rotor proportionnelle à la vitesse réelle (RPM)
      if (rotorGroupRef.current) {
        // rad/s = RPM * 2 * PI / 60
        const radPerSec = (t.rpm * Math.PI) / 30;
        rotorGroupRef.current.rotation.z += radPerSec * delta * 0.45; // Échelle visuelle confortable
      }

      // 2. Damping fluide de la Vue Éclatée (Exploded View)
      currentExploded = THREE.MathUtils.damp(currentExploded, targetExploded, 4.5, delta);

      // Déplacements axiaux et radiaux des composants
      if (frontHousingRef.current) {
        frontHousingRef.current.position.z = currentExploded * 2.2;
      }
      if (rearHousingRef.current) {
        rearHousingRef.current.position.z = -currentExploded * 2.2;
      }
      if (frontBearingRef.current) {
        frontBearingRef.current.position.z = 1.7 + currentExploded * 1.3;
      }
      if (rearBearingRef.current) {
        rearBearingRef.current.position.z = -1.7 - currentExploded * 1.3;
      }
      if (inverterTopRef.current) {
        inverterTopRef.current.position.y = 1.95 + currentExploded * 1.5;
      }
      if (statorCylinderRef.current) {
        statorCylinderRef.current.position.y = -currentExploded * 0.4;
      }

      // 3. Mise à jour dynamique des matériaux selon le mode
      const isThermal = currentMode === 'thermal';
      const isXray = currentMode === 'xray';
      const isSensors = currentMode === 'sensors';

      // Affichage / Masquage ou mise en valeur des nœuds capteurs
      if (sensorPinsGroupRef.current) {
        sensorPinsGroupRef.current.visible = isSensors || currentMode === 'standard';
        sensorPinsGroupRef.current.children.forEach((child) => {
          const ring = child.children[1] as THREE.Mesh;
          if (ring) {
            ring.rotation.z += delta * 2;
            const mat = ring.material as THREE.MeshBasicMaterial;
            mat.opacity = isSensors ? 0.9 : 0.4;
          }
        });
      }

      // Couleur thermique temps réel
      if (isThermal) {
        housingMatThermal.color.copy(getThermalColor(t.tempBearingFront));
        copperMatThermal.color.copy(getThermalColor(t.tempStator));
        statorMesh.material = housingMatThermal;
        frontCapMesh.material = housingMatThermal;
        rearCapMesh.material = housingMatThermal;
      } else if (isXray) {
        statorMesh.material = housingMatXray;
        frontCapMesh.material = housingMatXray;
        rearCapMesh.material = housingMatXray;
      } else {
        statorMesh.material = housingMatStd;
        frontCapMesh.material = housingMatStd;
        rearCapMesh.material = housingMatStd;
      }

      // 4. Interpolation fluide de la Caméra (Damping)
      if (cameraRef.current) {
        cameraRef.current.position.x = THREE.MathUtils.damp(cameraRef.current.position.x, cameraDesiredPosRef.current.x, 3.5, delta);
        cameraRef.current.position.y = THREE.MathUtils.damp(cameraRef.current.position.y, cameraDesiredPosRef.current.y, 3.5, delta);
        cameraRef.current.position.z = THREE.MathUtils.damp(cameraRef.current.position.z, cameraDesiredPosRef.current.z, 3.5, delta);
        cameraRef.current.lookAt(cameraTargetRef.current);
      }

      renderer.render(scene, camera);
    };

    reqIdRef.current = requestAnimationFrame(animate);

    // 11. Nettoyage mémoire rigoureux (Disposal)
    return () => {
      if (reqIdRef.current) cancelAnimationFrame(reqIdRef.current);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      dom.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      dom.removeEventListener('wheel', handleWheel);

      renderer.dispose();
      scene.clear();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[500px] select-none bg-slate-950 overflow-hidden">
      {/* Canvas Three.js monté ici */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Surimpression discrète : Identité de l'objet et badge télémétrique temps réel (Haut-Gauche) */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Jumeau Numérique Actif</span>
          <span className="text-slate-500 text-xs">·</span>
          <span className="text-xs text-slate-300 font-mono-numbers">ID: TWIN-AERO-9000X</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
          Turbine Industrielle & Groupe Moteur IoT
        </h1>
        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
          <span>OPC-UA / MQTT v5.0</span>
          <span>·</span>
          <span className="font-mono-numbers">{telemetry.mqttRate} msg/s</span>
          <span>·</span>
          <span className="font-mono-numbers">Latence {telemetry.pingLatency} ms</span>
          <span>·</span>
          <span className={telemetry.healthScore > 80 ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
            Santé {telemetry.healthScore}%
          </span>
        </div>
      </div>

      {/* Indicateur d'inspection de capteur au survol (Haut-Droite) */}
      {hoveredSensor && (
        <div className="absolute top-4 right-4 z-10 pointer-events-none bg-slate-900/90 border border-cyan-500/30 px-3.5 py-2 rounded-lg backdrop-blur-md shadow-lg text-xs">
          <div className="text-cyan-300 font-medium">{hoveredSensor}</div>
          <div className="text-slate-400 mt-0.5">Cliquez pour inspecter la sonde télémétrique</div>
        </div>
      )}

      {/* Légende du mode thermique si actif */}
      {viewMode === 'thermal' && (
        <div className="absolute top-20 right-4 z-10 pointer-events-none bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg backdrop-blur-sm text-xs flex flex-col gap-1.5">
          <div className="text-slate-300 font-medium">Thermographie Infrarouge</div>
          <div className="w-32 h-2.5 rounded bg-gradient-to-r from-blue-600 via-cyan-400 via-yellow-400 to-red-600" />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono-numbers">
            <span>20°C</span>
            <span>50°C</span>
            <span>80°C</span>
            <span>&gt;95°C</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Panneau de télémétrie approfondie en temps réel (TelemetryCharts)
 * Affiche les oscillogrammes continus, l'analyse vibratoire spectrale ISO 10816-3 et les métriques électriques/thermiques.
 */

import React from 'react';
import { TwinTelemetry, HistoryDataPoint } from '../types/twin';
import { Gauge, Activity, Zap, Thermometer, Droplet, Radio } from 'lucide-react';

interface TelemetryChartsProps {
  telemetry: TwinTelemetry;
  history: HistoryDataPoint[];
}

export const TelemetryCharts: React.FC<TelemetryChartsProps> = ({ telemetry, history }) => {
  // Calcul zone ISO 10816-3
  let isoZone = 'Zone A (Bonne)';
  let isoColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  if (telemetry.vibrationRms > 7.1) {
    isoZone = 'Zone D (Critique / Arrêt)';
    isoColor = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  } else if (telemetry.vibrationRms > 4.5) {
    isoZone = 'Zone C (Tolérée / Attention)';
    isoColor = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
  } else if (telemetry.vibrationRms > 2.3) {
    isoZone = 'Zone B (Acceptable)';
    isoColor = 'text-sky-400 border-sky-500/30 bg-sky-500/10';
  }

  // Fonction utilitaire pour générer un tracé SVG à partir de l'historique
  const generateSvgPath = (points: number[], minVal: number, maxVal: number, width: number, height: number) => {
    if (points.length < 2) return '';
    const span = maxVal - minVal || 1;
    return points
      .map((val, idx) => {
        const x = (idx / (points.length - 1)) * width;
        const normalizedY = 1 - (val - minVal) / span;
        const y = Math.max(4, Math.min(height - 4, normalizedY * height));
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const vibHistory = history.map((h) => h.vibrationRms);
  const tempHistory = history.map((h) => h.tempStator);
  const powerHistory = history.map((h) => h.powerKw);
  const rpmHistory = history.map((h) => h.rpm);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Kicker & Titre */}
      <div>
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <span>Surveillance Conditionnelle</span>
          <span>·</span>
          <span>Cadence 50 Hz</span>
          <span>·</span>
          <span className="font-mono-numbers">Flux MQTT/OPC-UA Synchronisé</span>
        </div>
        <h2 className="text-xl font-bold text-white mt-1">Télémétrie en Temps Réel & Analyse Spectrale</h2>
      </div>

      {/* Cartes KPI supérieures */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              Vitesse Rotor
            </span>
            <span className="font-mono-numbers">{telemetry.dominantFrequency} Hz</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono-numbers text-white">
              {Math.round(telemetry.rpm)}{' '}
              <span className="text-xs font-normal text-slate-400">tr/min</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Consigne : {telemetry.targetRpm} tr/min
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
              Vibration RMS
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${isoColor}`}>{isoZone.split(' ')[0]}</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono-numbers text-white">
              {telemetry.vibrationRms.toFixed(2)}{' '}
              <span className="text-xs font-normal text-slate-400">mm/s</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Pic accélération : {telemetry.vibrationPeak} g
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              Température Stator
            </span>
            <span className="text-xs text-slate-400 font-mono-numbers">PT100</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono-numbers text-white">
              {telemetry.tempStator.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-400">°C</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Palier avant : {telemetry.tempBearingFront}°C
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Puissance Active
            </span>
            <span className="text-xs text-slate-400 font-mono-numbers">cos φ {telemetry.powerFactor}</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono-numbers text-white">
              {telemetry.activePower.toFixed(1)}{' '}
              <span className="text-xs font-normal text-slate-400">kW</span>
            </div>
            <div className="text-xs text-slate-400 mt-0.5 font-mono-numbers">
              {telemetry.energyKwh.toFixed(1)} kWh cumulés
            </div>
          </div>
        </div>
      </div>

      {/* Grille principale des oscilloscopes & spectrogrammes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Oscilloscope 1 : Vibrations dynamiques (mm/s) */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Vibrations d’Exploitation (ISO 10816-3)</h3>
              <p className="text-xs text-slate-400">Surveillance continue des paliers et balourd dynamique</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono-numbers font-medium text-cyan-300">
                {telemetry.vibrationRms.toFixed(2)} mm/s RMS
              </span>
            </div>
          </div>

          {/* Tracé SVG de vibration */}
          <div className="relative w-full h-36 bg-slate-950 rounded-lg p-2 overflow-hidden border border-slate-800/80">
            {/* Lignes horizontales des seuils ISO */}
            <div className="absolute top-[20%] left-0 right-0 border-b border-rose-500/30 flex justify-between px-2 text-[9px] text-rose-400">
              <span>Seuil D Danger (7.1 mm/s)</span>
            </div>
            <div className="absolute top-[50%] left-0 right-0 border-b border-amber-500/30 flex justify-between px-2 text-[9px] text-amber-400">
              <span>Seuil C Alerte (4.5 mm/s)</span>
            </div>
            <div className="absolute top-[75%] left-0 right-0 border-b border-emerald-500/20 flex justify-between px-2 text-[9px] text-emerald-400">
              <span>Seuil B Nominal (2.3 mm/s)</span>
            </div>

            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
              <path
                d={generateSvgPath(vibHistory, 0, 9, 400, 120)}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono-numbers">
            <span>-60 secondes</span>
            <span>-30 secondes</span>
            <span>Présent (T)</span>
          </div>
        </div>

        {/* Oscilloscope 2 : Températures thermiques comparées */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Profil Thermique Continu (°C)</h3>
              <p className="text-xs text-slate-400">Bobinage statorique vs Température palier avant</p>
            </div>
            <div className="text-right text-xs font-mono-numbers">
              <span className="text-amber-400 font-medium">Stator: {telemetry.tempStator}°C</span>
              <span className="text-slate-500 mx-1.5">|</span>
              <span className="text-cyan-400 font-medium">Palier: {telemetry.tempBearingFront}°C</span>
            </div>
          </div>

          <div className="relative w-full h-36 bg-slate-950 rounded-lg p-2 overflow-hidden border border-slate-800/80">
            {/* Ligne limite de température critique */}
            <div className="absolute top-[18%] left-0 right-0 border-b border-rose-500/30 flex justify-between px-2 text-[9px] text-rose-400">
              <span>Limite Température Classe F (90°C)</span>
            </div>

            <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
              <path
                d={generateSvgPath(tempHistory, 20, 105, 400, 120)}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono-numbers">
            <span>-60 secondes</span>
            <span>-30 secondes</span>
            <span>Présent (T)</span>
          </div>
        </div>
      </div>

      {/* Détails Électriques, Fluides & Réseau IoT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Électrique */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
          <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            Réseau Électrique Triphasé
          </h4>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Tension d’alimentation (U)</span>
              <span className="font-mono-numbers text-white font-medium">{telemetry.voltage} V AC</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Courant efficace (I)</span>
              <span className="font-mono-numbers text-white font-medium">{telemetry.current} A</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Facteur de puissance (cos φ)</span>
              <span className="font-mono-numbers text-white font-medium">{telemetry.powerFactor}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Rendement estimé groupe</span>
              <span className="font-mono-numbers text-emerald-400 font-medium">94.8%</span>
            </div>
          </div>
        </div>

        {/* Fluides & Lubrification */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
          <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-2">
            <Droplet className="w-4 h-4 text-cyan-400" />
            Circuit Hydraulique & Lubrification
          </h4>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Pression film d’huile</span>
              <span className="font-mono-numbers text-white font-medium">{telemetry.oilPressure} bar</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Débit circuit refroidissement</span>
              <span className="font-mono-numbers text-white font-medium">{telemetry.coolantFlow} L/min</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Température fluide caloporteur</span>
              <span className="font-mono-numbers text-white font-medium">{telemetry.tempCoolant}°C</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">État pompe de lubrification</span>
              <span className="font-mono-numbers text-emerald-400 font-medium">Nominal</span>
            </div>
          </div>
        </div>

        {/* Réseau & Passerelle IoT */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
          <h4 className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            Liaison Télémétrique & Jumeau
          </h4>
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Protocole IoT</span>
              <span className="font-mono-numbers text-white font-medium">MQTT v5.0 / Sparkplug B</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Latence réseau (RTT)</span>
              <span className="font-mono-numbers text-white font-medium">{telemetry.pingLatency} ms</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-400">Délai physique &lt;-&gt; jumeau</span>
              <span className="font-mono-numbers text-emerald-400 font-medium">{telemetry.dataSyncDelta} ms</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Statut de synchronisation</span>
              <span className="font-mono-numbers text-emerald-400 font-medium">Verrouillé 1:1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

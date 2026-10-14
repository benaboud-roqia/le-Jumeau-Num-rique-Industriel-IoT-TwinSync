/**
 * Dock de contrôle ergonomique rétractable (Bottom Control Dock)
 * Conforme aux directives Three.js : centré en bas, repliable, sans masquer le sujet 3D central.
 */

import React, { useState } from 'react';
import { ViewMode, CameraPreset, TwinTelemetry } from '../types/twin';
import { 
  Layers, 
  Flame, 
  Radio, 
  Eye, 
  RotateCw, 
  Power, 
  ChevronDown, 
  ChevronUp, 
  Gauge, 
  Zap,
  Maximize2
} from 'lucide-react';

interface BottomControlDockProps {
  telemetry: TwinTelemetry;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  explodedProgress: number;
  onExplodedChange: (val: number) => void;
  cameraPreset: CameraPreset;
  onCameraPresetChange: (preset: CameraPreset) => void;
  onTogglePower: () => void;
  onTargetRpmChange: (rpm: number) => void;
  onLoadChange: (load: number) => void;
  onResetView: () => void;
}

export const BottomControlDock: React.FC<BottomControlDockProps> = ({
  telemetry,
  viewMode,
  onViewModeChange,
  explodedProgress,
  onExplodedChange,
  cameraPreset,
  onCameraPresetChange,
  onTogglePower,
  onTargetRpmChange,
  onLoadChange,
  onResetView,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'view' | 'actuator'>('view');

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94vw] max-w-[920px] transition-transform duration-300 ease-out select-none ${
        collapsed ? 'translate-y-[calc(100%-36px)]' : 'translate-y-0'
      }`}
    >
      {/* Bouton de rétractation / extension (Top Edge Toggle) */}
      <div className="flex justify-center mb-1">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-full text-[11px] font-medium text-slate-300 hover:text-white backdrop-blur-md shadow-lg transition-colors cursor-pointer"
        >
          {collapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Afficher le panneau de commande</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Masquer pour vue plein écran</span>
            </>
          )}
        </button>
      </div>

      {/* Conteneur principal du Dock en verre dépoli */}
      <div className="bg-slate-900/95 border border-slate-700/60 rounded-xl p-3 backdrop-blur-xl shadow-2xl">
        {/* Navigation d'onglets du Dock */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
          <div className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('view')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'view'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Inspection 3D & Vue Éclatée
            </button>
            <button
              onClick={() => setActiveTab('actuator')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'actuator'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Commandes Actionneur & Consignes
            </button>
          </div>

          {/* Statut rapide de rotation / allumage */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="text-slate-400">Régime:</span>
              <span className="text-white font-mono-numbers font-medium">{Math.round(telemetry.rpm)} RPM</span>
            </div>
            <button
              onClick={onTogglePower}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                telemetry.powerOn
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/50'
                  : 'bg-rose-600/30 text-rose-300 border border-rose-500/40 hover:bg-rose-600/50'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{telemetry.powerOn ? 'En Marche' : 'À l’Arrêt'}</span>
            </button>
          </div>
        </div>

        {/* CONTENU ONGLET 1 : INSPECTION 3D & VUE ÉCLATÉE */}
        {activeTab === 'view' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Slider de vue éclatée */}
            <div className="md:col-span-5 flex flex-col gap-1.5 bg-slate-950/40 p-2 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Vue Éclatée (Exploded View)
                </span>
                <span className="font-mono-numbers text-cyan-300 font-semibold">
                  {Math.round(explodedProgress * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={explodedProgress}
                onChange={(e) => onExplodedChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0% Assemblé</span>
                <span>50% Semi-éclaté</span>
                <span>100% Décomposé</span>
              </div>
            </div>

            {/* Sélecteur de mode de rendu */}
            <div className="md:col-span-4 flex flex-col gap-1">
              <span className="text-[11px] text-slate-400 font-medium">Mode de Rendu 3D</span>
              <div className="grid grid-cols-4 gap-1 bg-slate-950/70 p-1 rounded-lg">
                <button
                  onClick={() => onViewModeChange('standard')}
                  title="Rendu Physique PBR"
                  className={`p-1.5 text-xs rounded flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                    viewMode === 'standard' ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Standard</span>
                </button>
                <button
                  onClick={() => onViewModeChange('thermal')}
                  title="Cartographie thermique infrarouge"
                  className={`p-1.5 text-xs rounded flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                    viewMode === 'thermal' ? 'bg-amber-900/60 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Thermique</span>
                </button>
                <button
                  onClick={() => onViewModeChange('sensors')}
                  title="Nœuds et capteurs IoT"
                  className={`p-1.5 text-xs rounded flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                    viewMode === 'sensors' ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Capteurs</span>
                </button>
                <button
                  onClick={() => onViewModeChange('xray')}
                  title="Translucide & Flux magnétique"
                  className={`p-1.5 text-xs rounded flex flex-col items-center gap-1 cursor-pointer transition-colors ${
                    viewMode === 'xray' ? 'bg-sky-900/60 text-sky-300 border border-sky-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="text-[10px]">Rayons X</span>
                </button>
              </div>
            </div>

            {/* Angles Caméra Presets */}
            <div className="md:col-span-3 flex flex-col gap-1">
              <span className="text-[11px] text-slate-400 font-medium">Angles Prédéfinis</span>
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'iso', label: 'ISO' },
                    { id: 'front', label: 'Face' },
                    { id: 'bearing', label: 'Paliers' },
                    { id: 'turbine', label: 'Turbine' },
                  ] as const
                ).map((cam) => (
                  <button
                    key={cam.id}
                    onClick={() => onCameraPresetChange(cam.id)}
                    className={`flex-1 py-1.5 px-1 text-xs rounded text-center cursor-pointer transition-colors ${
                      cameraPreset === cam.id
                        ? 'bg-slate-700 text-white font-medium border border-slate-600'
                        : 'bg-slate-800/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cam.label}
                  </button>
                ))}
                <button
                  onClick={onResetView}
                  title="Réinitialiser la vue"
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONTENU ONGLET 2 : COMMANDES ACTIONNEUR & CONSIGNES */}
        {activeTab === 'actuator' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Consigne Régime (RPM) */}
            <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  Consigne Vitesse de Rotation (RPM)
                </span>
                <span className="font-mono-numbers text-cyan-300 font-semibold">{telemetry.targetRpm} tr/min</span>
              </div>
              <input
                type="range"
                min="0"
                max="6000"
                step="100"
                disabled={!telemetry.powerOn}
                value={telemetry.targetRpm}
                onChange={(e) => onTargetRpmChange(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none disabled:opacity-40"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>0 RPM (Arrêt)</span>
                <span>3000 RPM (Nominal)</span>
                <span>6000 RPM (Maxi)</span>
              </div>
            </div>

            {/* Charge Mécanique (%) */}
            <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Couple Résistant / Charge Utile
                </span>
                <span className="font-mono-numbers text-amber-300 font-semibold">{telemetry.loadPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                disabled={!telemetry.powerOn}
                value={telemetry.loadPercent}
                onChange={(e) => onLoadChange(parseInt(e.target.value, 10))}
                className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none disabled:opacity-40"
              />
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>À vide (0%)</span>
                <span>Charge Nominale (50%)</span>
                <span>Plein régime (100%)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

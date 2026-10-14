/**
 * Barre de navigation supérieure (Top Bar Contract)
 * Respecte strictement la structure 3 zones sans clignotement ni clutter décoratif.
 */

import React from 'react';
import { Volume2, VolumeX, AlertOctagon, Activity } from 'lucide-react';

export type NavigationTab = 'overview' | 'telemetry' | 'sync' | 'predictive' | 'alarms';

interface HeaderNavProps {
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
  onEmergencyStop: () => void;
  powerOn: boolean;
  activeAlarmCount: number;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentTab,
  onTabChange,
  isAudioMuted,
  onToggleAudio,
  onEmergencyStop,
  powerOn,
  activeAlarmCount,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md sticky top-0 z-30 select-none">
      {/* Zone 1: Wordmark / Identité unique sans sous-titre parasite */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/10">
          <Activity className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            TwinSync IoT
          </span>
          <span className="text-slate-600 text-xs hidden sm:inline">/</span>
          <span className="text-xs text-slate-400 font-mono-numbers hidden sm:inline">Jumeau Numérique</span>
        </div>
      </div>

      {/* Zone 2: Liens de navigation épurés et interactifs (Single-line controls) */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => onTabChange('overview')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            currentTab === 'overview'
              ? 'text-cyan-400 border-cyan-400 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          Aperçu 3D
        </button>
        <button
          onClick={() => onTabChange('telemetry')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            currentTab === 'telemetry'
              ? 'text-cyan-400 border-cyan-400 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          Télémétrie Directe
        </button>
        <button
          onClick={() => onTabChange('sync')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            currentTab === 'sync'
              ? 'text-cyan-400 border-cyan-400 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          Simulation & Anomalies
        </button>
        <button
          onClick={() => onTabChange('predictive')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
            currentTab === 'predictive'
              ? 'text-cyan-400 border-cyan-400 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          Maintenance IA
        </button>
        <button
          onClick={() => onTabChange('alarms')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 flex items-center gap-1.5 ${
            currentTab === 'alarms'
              ? 'text-cyan-400 border-cyan-400 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          <span>Alarmes & Journal</span>
          {activeAlarmCount > 0 && (
            <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded font-mono-numbers">
              {activeAlarmCount}
            </span>
          )}
        </button>
      </nav>

      {/* Zone 3: 1 action principale + contrôle son discret */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleAudio}
          title={isAudioMuted ? 'Activer le son du moteur' : 'Couper le son'}
          className={`p-2 rounded-lg border cursor-pointer transition-colors ${
            !isAudioMuted
              ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onEmergencyStop}
          disabled={!powerOn}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-100 bg-rose-600/80 hover:bg-rose-600 border border-rose-500/50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm shadow-rose-900/30"
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Arrêt d’Urgence</span>
        </button>
      </div>
    </header>
  );
};

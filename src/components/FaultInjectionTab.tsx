/**
 * Module de synchronisation Physique <-> Jumeau Numérique et Injection d'Anomalies
 * Permet d'injecter des scénarios de contraintes réelles pour observer la fidélité de convergence du jumeau.
 */

import React from 'react';
import { FaultType, TwinTelemetry } from '../types/twin';
import { ShieldCheck, AlertTriangle, Flame, Droplet, Zap, Wrench, RefreshCw, CheckCircle2 } from 'lucide-react';

interface FaultInjectionTabProps {
  telemetry: TwinTelemetry;
  onSetFault: (fault: FaultType) => void;
  onReset: () => void;
}

export const FaultInjectionTab: React.FC<FaultInjectionTabProps> = ({
  telemetry,
  onSetFault,
  onReset,
}) => {
  const currentFault = telemetry.activeFault;

  const faultScenarios: Array<{
    type: FaultType;
    title: string;
    description: string;
    icon: React.ReactNode;
    impact: string;
    subsystem: string;
  }> = [
    {
      type: 'none',
      title: 'Régime Nominal Idéal',
      description: 'Groupe opérant dans les tolérances constructeur optimales sans perturbation.',
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      impact: 'Vibrations < 2.0 mm/s · T° normale',
      subsystem: 'Système complet',
    },
    {
      type: 'imbalance',
      title: 'Balourd Dynamique Rotor',
      description: 'Simulation d’une masse excentrique (encrassement d’une pale ou perte de masselotte d’équilibrage).',
      icon: <RefreshCw className="w-5 h-5 text-amber-400" />,
      impact: 'Pic vibratoire 1X fondamental élevé (jusqu’à 6.8 mm/s)',
      subsystem: 'Arbre & Pales turbine',
    },
    {
      type: 'bearing_friction',
      title: 'Dégradation & Grippage Palier',
      description: 'Micro-écaillage de la bague de roulement avant provoquant frottement et échauffement localisé.',
      icon: <Wrench className="w-5 h-5 text-rose-400" />,
      impact: 'Élévation T° palier avant (> 78°C) + vibrations hautes fréquences',
      subsystem: 'Roulement avant',
    },
    {
      type: 'overheating',
      title: 'Surcharge Thermique Stator',
      description: 'Colmatage partiel des ailettes de ventilation ou sur-intensité prolongée dans les bobinages.',
      icon: <Flame className="w-5 h-5 text-rose-500" />,
      impact: 'Température bobinage > 92°C (Classe F franchie)',
      subsystem: 'Stator cuivre',
    },
    {
      type: 'oil_leak',
      title: 'Défaut de Pression d’Huile',
      description: 'Chute brutale du circuit de lubrification sous pression (défaillance pompe auxiliaire ou fuite raccord).',
      icon: <Droplet className="w-5 h-5 text-rose-400" />,
      impact: 'Pression hydraulique < 1.5 bar · Risque de rupture de film',
      subsystem: 'Circuit d’huile',
    },
    {
      type: 'voltage_sag',
      title: 'Creux de Tension Réseau',
      description: 'Affaissement de 15% de la tension de ligne triphasée industrielle.',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      impact: 'Tension ~340 V · Augmentation du courant d’appel',
      subsystem: 'Module de puissance',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Kicker & Titre */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Banc de Test Virtuel</span>
            <span>·</span>
            <span>Synchronisation Bidirectionnelle</span>
            <span>·</span>
            <span className="font-mono-numbers">Modélisation Haute Fidélité</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Simulation de Contraintes & Détection d’Anomalies
          </h2>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Rétablir l’État Nominal</span>
        </button>
      </div>

      {/* Tableau comparatif Modèle Théorique vs Télémétrie Physique */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <h3 className="text-sm font-semibold text-white mb-1">Convergence Jumeau Numérique & Réalité Physique</h3>
        <p className="text-xs text-slate-400 mb-4">
          Écart résiduel instantané calculé entre le modèle analytique prédictif et les signaux des capteurs physiques connectés.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Écart Télémétrique Vitesse (Δ RPM)</span>
              <span className="text-emerald-400 font-mono-numbers">0.05%</span>
            </div>
            <div className="mt-2 text-lg font-bold font-mono-numbers text-white">
              {Math.round(telemetry.rpm)}{' '}
              <span className="text-xs font-normal text-slate-400">tr/min / Référence 3200</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '99.5%' }} />
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Écart Thermique Modèle (Δ Temp)</span>
              <span className="text-cyan-400 font-mono-numbers">± 0.4°C</span>
            </div>
            <div className="mt-2 text-lg font-bold font-mono-numbers text-white">
              {telemetry.tempStator}°C{' '}
              <span className="text-xs font-normal text-slate-400">vs Modèle Éléments Finis</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full" style={{ width: '97.8%' }} />
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Corrélation Spectrale Vibratoire</span>
              <span className="text-emerald-400 font-mono-numbers">98.2%</span>
            </div>
            <div className="mt-2 text-lg font-bold font-mono-numbers text-white">
              {telemetry.vibrationRms} mm/s{' '}
              <span className="text-xs font-normal text-slate-400">Corrélation FFT</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '98.2%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Catalogue des scénarios de pannes injectables */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-3">
          Injecteur de Défaillances Simulées (Stress-Tests)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {faultScenarios.map((sc) => {
            const isSelected = currentFault === sc.type;
            return (
              <div
                key={sc.type}
                onClick={() => onSetFault(sc.type)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                      {sc.icon}
                    </div>
                    {isSelected && (
                      <span className="text-[11px] font-medium text-cyan-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Scénario Actif
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-white">{sc.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sc.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-col gap-1 text-[11px]">
                  <div className="text-slate-400 flex justify-between">
                    <span>Organe ciblé :</span>
                    <span className="text-slate-200 font-medium">{sc.subsystem}</span>
                  </div>
                  <div className="text-slate-400 flex justify-between">
                    <span>Effet physique :</span>
                    <span className="text-amber-300 font-medium">{sc.impact}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

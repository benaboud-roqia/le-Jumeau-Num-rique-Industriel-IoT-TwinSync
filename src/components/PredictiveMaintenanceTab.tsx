/**
 * Onglet de Maintenance Prédictive & Diagnostic IA (PredictiveMaintenanceTab)
 * Analyse les tendances d'usure, calcule le RUL (Remaining Useful Life) et génère des recommandations prescriptives.
 */

import React, { useState } from 'react';
import { TwinTelemetry } from '../types/twin';
import { ShieldCheck, AlertTriangle, Clock, Wrench, CheckCircle2, Sparkles, Cpu, Layers } from 'lucide-react';

interface PredictiveMaintenanceTabProps {
  telemetry: TwinTelemetry;
}

export const PredictiveMaintenanceTab: React.FC<PredictiveMaintenanceTabProps> = ({ telemetry }) => {
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // Évaluation des sous-systèmes
  const subsystems = [
    {
      name: 'Roulements à billes (Palier avant/arrière)',
      health: telemetry.activeFault === 'bearing_friction' ? 38 : Math.max(25, Math.min(99, 100 - telemetry.vibrationRms * 10)),
      wearText: telemetry.activeFault === 'bearing_friction' ? 'Frottement anormal détecté (Zone C)' : 'Usure superficielle normale',
      criticity: telemetry.activeFault === 'bearing_friction' ? 'Critique' : 'Faible',
    },
    {
      name: 'Isolation bobinage statorique (Classe F)',
      health: telemetry.tempStator > 85 ? 42 : Math.max(30, Math.min(99, 100 - (telemetry.tempStator - 40) * 1.1)),
      wearText: telemetry.tempStator > 85 ? 'Contrainte thermique excessive' : 'Rigidité diélectrique optimale',
      criticity: telemetry.tempStator > 85 ? 'Élevée' : 'Normale',
    },
    {
      name: 'Film d’huile & Circuit hydraulique',
      health: telemetry.oilPressure < 2.0 ? 25 : Math.max(20, Math.min(100, (telemetry.oilPressure / 4.0) * 100)),
      wearText: telemetry.oilPressure < 2.0 ? 'Pression insuffisante sous le seuil' : 'Viscosité et pression conformes',
      criticity: telemetry.oilPressure < 2.0 ? 'Critique' : 'Optimale',
    },
    {
      name: 'Pales de turbine & Aérodynamique',
      health: telemetry.activeFault === 'imbalance' ? 55 : 94,
      wearText: telemetry.activeFault === 'imbalance' ? 'Balourd résiduel / Légère dissymétrie' : 'Intégrité structurelle des profils validée',
      criticity: telemetry.activeFault === 'imbalance' ? 'Moyenne' : 'Basse',
    },
  ];

  // Déclenchement d'une analyse experte IA
  const handleRunAiDiagnostic = () => {
    setAnalyzingAi(true);
    setTimeout(() => {
      let analysisText = '';
      if (telemetry.activeFault === 'bearing_friction') {
        analysisText = `Le jumeau numérique met en évidence une corrélation forte entre l'élévation thermique du palier avant (${telemetry.tempBearingFront}°C) et une montée des vibrations spectrales (${telemetry.vibrationRms} mm/s). Diagnostic prédictif : Écaillage prématuré de la bague de roulement SKF 6208. Action recommandée : Planifier un remplacement sous 72h ouvrées et vérifier la propreté du graissage pour éviter un grippage complet du rotor.`;
      } else if (telemetry.activeFault === 'imbalance') {
        analysisText = `Analyse spectrale FFT : Pic dominant à 1X fréquence de rotation (${telemetry.dominantFrequency} Hz). L'amplitude vibratoire de ${telemetry.vibrationRms} mm/s indique un balourd dynamique sur le rouet de turbine. Action recommandée : Nettoyage haute pression des pales lors du prochain arrêt technique et rééquilibrage statique/dynamique ISO 1940 Degré G2.5.`;
      } else if (telemetry.activeFault === 'overheating') {
        analysisText = `Surcharge thermique mesurée à ${telemetry.tempStator}°C sur le stator, approchant la limite de classe d'isolation F (155°C admissible en pointe). La puissance active s'établit à ${telemetry.activePower} kW. Action recommandée : Contrôler le débit des ventilateurs forcés, détartrer le circuit d'échange thermique et vérifier la symétrie des courants de phase.`;
      } else if (telemetry.activeFault === 'oil_leak') {
        analysisText = `Pression hydraulique critique mesurée à ${telemetry.oilPressure} bar (inférieure au seuil de sécurité de 2.0 bar). Risque imminent de rupture du film d'huile hydrodynamique et usure métal-sur-métal. Action recommandée : Inspection immédiate des joints toriques de raccordement et appoint d'huile synthétique ISO VG 46.`;
      } else {
        analysisText = `État global d'exploitation optimal. Tous les indicateurs de santé sont au vert (Score global : ${telemetry.healthScore}%, RUL estimé : ${telemetry.rulHours} h). Le profil vibratoire (${telemetry.vibrationRms} mm/s) respecte la norme ISO 10816-3 Classe II. Aucune intervention curative n'est nécessaire ; prochain jalon de maintenance préventive prévu dans 2 500 heures (contrôle d'alignement au laser).`;
      }
      setAiReport(analysisText);
      setAnalyzingAi(false);
    }, 800);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Kicker & Titre */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Analyse Prédictive Avancée</span>
            <span>·</span>
            <span>Modèle Dégradation Weibull</span>
            <span>·</span>
            <span className="font-mono-numbers">RUL Dynamique</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Santé du Système & Recommandations de Maintenance
          </h2>
        </div>

        <button
          onClick={handleRunAiDiagnostic}
          disabled={analyzingAi}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-cyan-900/20"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{analyzingAi ? 'Analyse en cours...' : 'Générer Diagnostic Jumeau IA'}</span>
        </button>
      </div>

      {/* Cartes KPI RUL & Score de santé */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score de santé globale */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Indice de Santé Global (Health Score)</span>
            <span className="font-mono-numbers">Calculé sur 12 paramètres</span>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span
              className={`text-4xl font-extrabold font-mono-numbers ${
                telemetry.healthScore > 80
                  ? 'text-emerald-400'
                  : telemetry.healthScore > 50
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {telemetry.healthScore}%
            </span>
            <span className="text-xs text-slate-400">
              {telemetry.healthScore > 80
                ? 'Fonctionnement Nominal'
                : telemetry.healthScore > 50
                ? 'Dérive Détectée'
                : 'Intervention Requise'}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                telemetry.healthScore > 80
                  ? 'bg-emerald-500'
                  : telemetry.healthScore > 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${telemetry.healthScore}%` }}
            />
          </div>
        </div>

        {/* RUL (Remaining Useful Life) */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Durée de Vie Résiduelle Estimée (RUL)</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-mono-numbers text-white">
              {telemetry.rulHours.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">heures d’exploitation</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Prochain arrêt planifié : <span className="text-slate-200 font-medium">Révision palier sous 8 mois</span>
          </div>
        </div>

        {/* Taux d'usure cumulé */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Indice d’Usure Mécanique</span>
            <Wrench className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold font-mono-numbers text-slate-200">
              {telemetry.wearIndex}%
            </span>
            <span className="text-xs text-slate-400">consommation de potentiel</span>
          </div>
          <div className="text-xs text-slate-400 mt-2">
            Fatigue oligocyclique : <span className="text-emerald-400 font-medium">Faible (Cycle continu)</span>
          </div>
        </div>
      </div>

      {/* Panneau de Rapport d'Expertise IA (Diagnostic Prescriptif) */}
      {aiReport && (
        <div className="p-5 rounded-xl bg-slate-900/90 border border-cyan-500/40 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-300 text-sm font-semibold">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Rapport d’Analyse Prescriptive IA (Jumeau Numérique)</span>
            </div>
            <span className="text-xs text-slate-400 font-mono-numbers">Généré à l’instant</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-4 rounded-lg border border-slate-800">
            {aiReport}
          </p>
        </div>
      )}

      {/* Matrice de santé des sous-ensembles */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <h3 className="text-sm font-semibold text-white mb-1">
          Matrice d’Usure & État des Composants Internes
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Évaluation continue calculée à partir des sondes PT100, accéléromètres triaxiaux et transmetteurs de pression.
        </p>

        <div className="flex flex-col divide-y divide-slate-800/80">
          {subsystems.map((sub, idx) => (
            <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">{sub.name}</span>
                <span className="text-[11px] text-slate-400">{sub.wearText}</span>
              </div>

              <div className="flex items-center gap-6">
                <div className="w-36 flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono-numbers">
                    <span>Intégrité</span>
                    <span className="text-white font-medium">{Math.round(sub.health)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        sub.health > 75
                          ? 'bg-emerald-500'
                          : sub.health > 45
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${sub.health}%` }}
                    />
                  </div>
                </div>

                <div className="w-24 text-right">
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${
                      sub.criticity === 'Critique'
                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        : sub.criticity === 'Élevée' || sub.criticity === 'Moyenne'
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {sub.criticity}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pièces de Rechange Recommandées (Bill of Materials) */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <h3 className="text-sm font-semibold text-white mb-1">Kit de Maintenance & Rechanges Recommandés</h3>
        <p className="text-xs text-slate-400 mb-4">
          Composants certifiés constructeur préconisés selon les heures de fonctionnement cumulées.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-cyan-400 font-mono-numbers text-[11px]">Réf. SKF-6208-2Z-C3</div>
              <div className="font-semibold text-white mt-1">Roulement avant haute vitesse</div>
              <p className="text-slate-400 text-[11px] mt-1">Jeu radial C3, flasques d’étanchéité acier.</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-between text-slate-300">
              <span>Stock local :</span>
              <span className="font-mono-numbers text-emerald-400">4 unités disponibles</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-cyan-400 font-mono-numbers text-[11px]">Réf. KLUB-ISOFLEX-NBU15</div>
              <div className="font-semibold text-white mt-1">Graisse synthétique haute vitesse</div>
              <p className="text-slate-400 text-[11px] mt-1">Stabilité thermique de -50°C à +150°C.</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-between text-slate-300">
              <span>Cartouche 400g :</span>
              <span className="font-mono-numbers text-emerald-400">Prêt à l’emploi</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-cyan-400 font-mono-numbers text-[11px]">Réf. VITON-ORING-SET</div>
              <div className="font-semibold text-white mt-1">Jeu de joints toriques FKM</div>
              <p className="text-slate-400 text-[11px] mt-1">Étanchéité circuit d’huile carter flasque.</p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800/80 flex justify-between text-slate-300">
              <span>Kit complet :</span>
              <span className="font-mono-numbers text-emerald-400">En stock</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

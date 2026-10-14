/**
 * Onglet Journal des Alarmes & Télémétrie MQTT (AlarmsTab)
 * Permet la gestion des événements industriels, l'acquittement d'alertes et l'exportation des données.
 */

import React, { useState } from 'react';
import { AlarmItem, TwinTelemetry } from '../types/twin';
import { AlertCircle, AlertTriangle, Info, Check, Download, Trash2, CheckCheck } from 'lucide-react';

interface AlarmsTabProps {
  alarms: AlarmItem[];
  telemetry: TwinTelemetry;
  onAcknowledge: (id: string) => void;
  onClearAll: () => void;
}

export const AlarmsTab: React.FC<AlarmsTabProps> = ({
  alarms,
  telemetry,
  onAcknowledge,
  onClearAll,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filteredAlarms = alarms.filter((a) => {
    if (filterSeverity === 'all') return true;
    return a.severity === filterSeverity;
  });

  // Export JSON complet du Jumeau
  const handleExportJson = () => {
    const data = {
      equipment: 'Turbine Industrielle & Groupe Moto-Propulseur IoT-9000X',
      exportDate: new Date().toISOString(),
      currentTelemetry: telemetry,
      alarmHistory: alarms,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twin-telemetry-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV des alarmes
  const handleExportCsv = () => {
    const headers = ['ID', 'Horodatage', 'Gravité', 'Code', 'Capteur', 'Message', 'Acquitté'];
    const rows = alarms.map((a) => [
      a.id,
      a.timestamp,
      a.severity,
      a.code,
      `"${a.sensor}"`,
      `"${a.message.replace(/"/g, '""')}"`,
      a.acknowledged ? 'Oui' : 'Non',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alarmes-jumeau-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Kicker & Titre */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span>Journal de Bord Événements</span>
            <span>·</span>
            <span>Traçabilité IEC 62443</span>
            <span>·</span>
            <span className="font-mono-numbers">Flux MQTT/Kafka</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Alarmes, Événements & Télémétrie Réseau
          </h2>
        </div>

        {/* Boutons d'exportation de données */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Exporter CSV</span>
          </button>
          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Données Complètes JSON</span>
          </button>
        </div>
      </div>

      {/* Barre d'outils et filtres d'alarmes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterSeverity('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filterSeverity === 'all'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Toutes ({alarms.length})
          </button>
          <button
            onClick={() => setFilterSeverity('critical')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filterSeverity === 'critical'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Critiques ({alarms.filter((a) => a.severity === 'critical').length})
          </button>
          <button
            onClick={() => setFilterSeverity('warning')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filterSeverity === 'warning'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Avertissements ({alarms.filter((a) => a.severity === 'warning').length})
          </button>
          <button
            onClick={() => setFilterSeverity('info')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filterSeverity === 'info'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Informations ({alarms.filter((a) => a.severity === 'info').length})
          </button>
        </div>

        {alarms.length > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer self-end sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Effacer le journal</span>
          </button>
        )}
      </div>

      {/* Liste des alarmes */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {filteredAlarms.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Aucun événement enregistré pour ce niveau de filtre.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredAlarms.map((item) => (
              <div
                key={item.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  item.acknowledged ? 'bg-slate-950/30 opacity-70' : 'bg-slate-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {item.severity === 'critical' && (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    {item.severity === 'warning' && (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    {item.severity === 'info' && (
                      <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono-numbers text-slate-400">{item.timestamp}</span>
                      <span className="text-slate-600">·</span>
                      <span className="font-mono-numbers font-medium text-slate-300">
                        {item.code}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">{item.sensor}</span>
                    </div>
                    <p className="text-xs text-white font-medium mt-1 leading-snug">{item.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {item.acknowledged ? (
                    <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                      <CheckCheck className="w-3.5 h-3.5" />
                      Acquitté
                    </span>
                  ) : (
                    <button
                      onClick={() => onAcknowledge(item.id)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Acquitter</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

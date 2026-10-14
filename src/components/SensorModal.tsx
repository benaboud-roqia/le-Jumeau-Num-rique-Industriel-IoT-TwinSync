/**
 * Fiche détaillée d'inspection d'un capteur télémétrique IoT (SensorModal)
 */

import React from 'react';
import { SensorNodeInfo, TwinTelemetry } from '../types/twin';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Cpu, Radio, Gauge } from 'lucide-react';

interface SensorModalProps {
  sensor: SensorNodeInfo | null;
  telemetry: TwinTelemetry;
  onClose: () => void;
}

export const SensorModal: React.FC<SensorModalProps> = ({ sensor, telemetry, onClose }) => {
  if (!sensor) return null;

  // Calcul dynamique de la valeur réelle actuelle selon le capteur
  let liveVal = sensor.currentValue;
  let status: 'nominal' | 'warning' | 'alert' = 'nominal';

  if (sensor.id === 'sensor-vib-front') {
    liveVal = telemetry.vibrationRms.toFixed(2);
    if (telemetry.vibrationRms > 4.5) status = 'alert';
    else if (telemetry.vibrationRms > 2.3) status = 'warning';
  } else if (sensor.id === 'sensor-temp-stator') {
    liveVal = telemetry.tempStator.toFixed(1);
    if (telemetry.tempStator > 85) status = 'alert';
    else if (telemetry.tempStator > 75) status = 'warning';
  } else if (sensor.id === 'sensor-temp-rear') {
    liveVal = telemetry.tempBearingRear.toFixed(1);
    if (telemetry.tempBearingRear > 75) status = 'alert';
    else if (telemetry.tempBearingRear > 65) status = 'warning';
  } else if (sensor.id === 'sensor-oil-pres') {
    liveVal = telemetry.oilPressure.toFixed(2);
    if (telemetry.oilPressure < 2.0) status = 'alert';
    else if (telemetry.oilPressure < 3.0) status = 'warning';
  } else if (sensor.id === 'sensor-iot-edge') {
    liveVal = telemetry.current.toFixed(1);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header de la fiche */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span>Nœud Télémétrique</span>
                <span>·</span>
                <span className="font-mono-numbers">{sensor.id}</span>
              </div>
              <h3 className="text-base font-semibold text-white">{sensor.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps de la fiche */}
        <div className="p-5 flex flex-col gap-4">
          {/* Métrique en direct */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Valeur Instantanée Mesurée</div>
              <div className="text-3xl font-bold font-mono-numbers text-white mt-1">
                {liveVal}{' '}
                <span className="text-sm font-normal text-slate-400">{sensor.unit}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Plage nominale : {sensor.nominalRange}
              </div>
            </div>

            {/* État */}
            <div className="flex flex-col items-end gap-1">
              {status === 'nominal' && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Plage Nominale</span>
                </div>
              )}
              {status === 'warning' && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Vigilance Seuil</span>
                </div>
              )}
              {status === 'alert' && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                  <span>Seuil Critique</span>
                </div>
              )}
              <span className="text-[11px] text-slate-400 font-mono-numbers">
                Échantillonnage 100 Hz
              </span>
            </div>
          </div>

          {/* Description & Position mécanique */}
          <div className="text-xs text-slate-300 leading-relaxed bg-slate-800/30 p-3 rounded-lg border border-slate-800">
            {sensor.description}
          </div>

          {/* Propriétés techniques */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
              <div className="text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                Sous-ensemble ciblé
              </div>
              <div className="text-slate-200 font-medium mt-1">{sensor.component}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800">
              <div className="text-slate-400 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                Protocole Bus
              </div>
              <div className="text-slate-200 font-medium mt-1 font-mono-numbers">
                Modbus-RTU over RS-485
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Fermer l’inspection
          </button>
        </div>
      </div>
    </div>
  );
};

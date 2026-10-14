/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  TwinTelemetry, 
  ViewMode, 
  CameraPreset, 
  SensorNodeInfo, 
  FaultType, 
  AlarmItem, 
  HistoryDataPoint 
} from './types/twin';
import { telemetryEngine } from './utils/telemetryEngine';
import { audioEngine } from './utils/audioEngine';
import { HeaderNav, NavigationTab } from './components/HeaderNav';
import { Twin3DViewer } from './components/Twin3DViewer';
import { BottomControlDock } from './components/BottomControlDock';
import { SensorModal } from './components/SensorModal';
import { TelemetryCharts } from './components/TelemetryCharts';
import { FaultInjectionTab } from './components/FaultInjectionTab';
import { PredictiveMaintenanceTab } from './components/PredictiveMaintenanceTab';
import { AlarmsTab } from './components/AlarmsTab';

export default function App() {
  const [telemetry, setTelemetry] = useState<TwinTelemetry>(telemetryEngine.getTelemetry());
  const [history, setHistory] = useState<HistoryDataPoint[]>(telemetryEngine.getHistory());
  const [alarms, setAlarms] = useState<AlarmItem[]>(telemetryEngine.getAlarms());
  
  // Navigation
  const [currentTab, setCurrentTab] = useState<NavigationTab>('overview');
  
  // 3D Visualizer state
  const [viewMode, setViewMode] = useState<ViewMode>('standard');
  const [explodedProgress, setExplodedProgress] = useState<number>(0);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('iso');
  const [selectedSensor, setSelectedSensor] = useState<SensorNodeInfo | null>(null);

  // Audio state
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);

  // Initialisation du moteur de simulation
  useEffect(() => {
    telemetryEngine.start();

    const unsubTelemetry = telemetryEngine.subscribe((t) => {
      setTelemetry(t);
      setHistory(telemetryEngine.getHistory());
      audioEngine.updateRpm(t.rpm, t.powerOn);
    });

    const unsubAlarms = telemetryEngine.subscribeAlarms((a) => {
      setAlarms(a);
    });

    return () => {
      telemetryEngine.stop();
      unsubTelemetry();
      unsubAlarms();
    };
  }, []);

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        telemetryEngine.setPower(!telemetry.powerOn);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [telemetry.powerOn]);

  const handleToggleAudio = () => {
    const muted = audioEngine.toggleMute();
    setIsAudioMuted(muted);
  };

  const handleEmergencyStop = () => {
    telemetryEngine.setPower(false);
  };

  const handleTogglePower = () => {
    telemetryEngine.setPower(!telemetry.powerOn);
  };

  const handleTargetRpmChange = (rpm: number) => {
    telemetryEngine.setTargetRpm(rpm);
  };

  const handleLoadChange = (load: number) => {
    telemetryEngine.setLoadPercent(load);
  };

  const handleSetFault = (fault: FaultType) => {
    telemetryEngine.setFault(fault);
  };

  const handleReset = () => {
    telemetryEngine.setFault('none');
    telemetryEngine.setTargetRpm(3200);
    telemetryEngine.setLoadPercent(45);
    telemetryEngine.setPower(true);
    setExplodedProgress(0);
    setViewMode('standard');
    setCameraPreset('iso');
  };

  const activeAlarmCount = alarms.filter((a) => !a.acknowledged && a.severity !== 'info').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Barre de navigation Top Bar Contract */}
      <HeaderNav
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isAudioMuted={isAudioMuted}
        onToggleAudio={handleToggleAudio}
        onEmergencyStop={handleEmergencyStop}
        powerOn={telemetry.powerOn}
        activeAlarmCount={activeAlarmCount}
      />

      {/* 2. Vue Principale selon l'onglet actif */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {currentTab === 'overview' && (
          <div className="relative w-full h-[calc(100vh-61px)] min-h-[600px] flex flex-col">
            {/* Visualiseur 3D interactif Three.js */}
            <Twin3DViewer
              telemetry={telemetry}
              viewMode={viewMode}
              explodedProgress={explodedProgress}
              cameraPreset={cameraPreset}
              onSelectSensor={setSelectedSensor}
            />

            {/* Dock de contrôle repliable au bas de la vue 3D */}
            <BottomControlDock
              telemetry={telemetry}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              explodedProgress={explodedProgress}
              onExplodedChange={setExplodedProgress}
              cameraPreset={cameraPreset}
              onCameraPresetChange={setCameraPreset}
              onTogglePower={handleTogglePower}
              onTargetRpmChange={handleTargetRpmChange}
              onLoadChange={handleLoadChange}
              onResetView={() => {
                setExplodedProgress(0);
                setCameraPreset('iso');
                setViewMode('standard');
              }}
            />
          </div>
        )}

        {currentTab === 'telemetry' && (
          <div className="flex-1 overflow-y-auto">
            <TelemetryCharts telemetry={telemetry} history={history} />
          </div>
        )}

        {currentTab === 'sync' && (
          <div className="flex-1 overflow-y-auto">
            <FaultInjectionTab
              telemetry={telemetry}
              onSetFault={handleSetFault}
              onReset={handleReset}
            />
          </div>
        )}

        {currentTab === 'predictive' && (
          <div className="flex-1 overflow-y-auto">
            <PredictiveMaintenanceTab telemetry={telemetry} />
          </div>
        )}

        {currentTab === 'alarms' && (
          <div className="flex-1 overflow-y-auto">
            <AlarmsTab
              alarms={alarms}
              telemetry={telemetry}
              onAcknowledge={(id) => telemetryEngine.acknowledgeAlarm(id)}
              onClearAll={() => telemetryEngine.clearAllAlarms()}
            />
          </div>
        )}
      </main>

      {/* Modal d'inspection détaillée de capteur 3D */}
      <SensorModal
        sensor={selectedSensor}
        telemetry={telemetry}
        onClose={() => setSelectedSensor(null)}
      />
    </div>
  );
}

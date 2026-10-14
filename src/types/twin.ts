/**
 * Types et interfaces pour le Jumeau Numérique IoT (TwinSync)
 */

export type ViewMode = 'standard' | 'thermal' | 'sensors' | 'xray';

export type CameraPreset = 'iso' | 'front' | 'bearing' | 'inverter' | 'turbine';

export type FaultType = 
  | 'none' 
  | 'imbalance' 
  | 'bearing_friction' 
  | 'overheating' 
  | 'voltage_sag' 
  | 'oil_leak';

export interface SensorNodeInfo {
  id: string;
  name: string;
  type: 'temperature' | 'vibration' | 'electrical' | 'pressure' | 'gateway';
  position: [number, number, number];
  component: string;
  currentValue: string;
  unit: string;
  nominalRange: string;
  description: string;
  status: 'nominal' | 'warning' | 'alert';
}

export interface TwinTelemetry {
  timestamp: number;
  powerOn: boolean;
  rpm: number;
  targetRpm: number;
  loadPercent: number;
  
  // Thermique
  tempStator: number;
  tempBearingFront: number;
  tempBearingRear: number;
  tempCoolant: number;
  tempAmbient: number;

  // Vibrations mécaniques (ISO 10816-3)
  vibrationRms: number; // mm/s
  vibrationPeak: number; // g
  dominantFrequency: number; // Hz

  // Électrique
  voltage: number; // V
  current: number; // A
  activePower: number; // kW
  powerFactor: number; // cos phi
  energyKwh: number; // kWh cumulés

  // Fluide & lubrification
  oilPressure: number; // bar
  coolantFlow: number; // L/min

  // Réseau IoT
  networkStatus: 'connected' | 'degraded' | 'offline';
  mqttRate: number; // msgs/sec
  pingLatency: number; // ms
  dataSyncDelta: number; // ms (décalage physique-numérique)

  // Santé & Maintenance Prédictive
  healthScore: number; // 0 à 100%
  rulHours: number; // Remaining Useful Life en heures
  wearIndex: number; // 0 à 100%
  activeFault: FaultType;
}

export interface AlarmItem {
  id: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
  code: string;
  sensor: string;
  message: string;
  acknowledged: boolean;
}

export interface HistoryDataPoint {
  timeStr: string;
  rpm: number;
  tempStator: number;
  tempBearingFront: number;
  vibrationRms: number;
  powerKw: number;
  healthScore: number;
}

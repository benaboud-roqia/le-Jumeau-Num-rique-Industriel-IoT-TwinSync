/**
 * Moteur de simulation physique et télémétrique du Jumeau Numérique
 * Calcule en continu la dynamique thermique, vibratoire, électrique et mécanique.
 */

import { TwinTelemetry, FaultType, AlarmItem, HistoryDataPoint } from '../types/twin';

export class TelemetryEngine {
  private telemetry: TwinTelemetry;
  private alarms: AlarmItem[] = [];
  private history: HistoryDataPoint[] = [];
  private maxHistory = 40;
  private listeners: Array<(t: TwinTelemetry) => void> = [];
  private alarmListeners: Array<(a: AlarmItem[]) => void> = [];
  private timer: number | null = null;
  private internalElapsed = 0;

  constructor() {
    this.telemetry = {
      timestamp: Date.now(),
      powerOn: true,
      rpm: 3200,
      targetRpm: 3200,
      loadPercent: 45,
      
      tempStator: 58.4,
      tempBearingFront: 48.2,
      tempBearingRear: 44.1,
      tempCoolant: 32.5,
      tempAmbient: 22.0,

      vibrationRms: 1.45,
      vibrationPeak: 0.85,
      dominantFrequency: 53.3, // 3200 / 60

      voltage: 400.2,
      current: 24.8,
      activePower: 15.2,
      powerFactor: 0.91,
      energyKwh: 1248.6,

      oilPressure: 3.85,
      coolantFlow: 16.4,

      networkStatus: 'connected',
      mqttRate: 50,
      pingLatency: 14,
      dataSyncDelta: 4,

      healthScore: 94,
      rulHours: 8420,
      wearIndex: 12,
      activeFault: 'none',
    };

    // Pre-populate initial history
    const now = Date.now();
    for (let i = this.maxHistory; i >= 0; i--) {
      const time = new Date(now - i * 1500);
      const timeStr = time.toTimeString().split(' ')[0];
      this.history.push({
        timeStr,
        rpm: 3200 + (Math.random() - 0.5) * 40,
        tempStator: 58 + (Math.random() - 0.5) * 1.5,
        tempBearingFront: 48 + (Math.random() - 0.5) * 1.2,
        vibrationRms: 1.45 + (Math.random() - 0.5) * 0.1,
        powerKw: 15.2 + (Math.random() - 0.5) * 0.4,
        healthScore: 94,
      });
    }
  }

  public start() {
    if (this.timer) return;
    this.timer = window.setInterval(() => this.tick(), 500);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public getTelemetry(): TwinTelemetry {
    return { ...this.telemetry };
  }

  public getHistory(): HistoryDataPoint[] {
    return [...this.history];
  }

  public getAlarms(): AlarmItem[] {
    return [...this.alarms];
  }

  public setPower(on: boolean) {
    this.telemetry.powerOn = on;
    if (!on) {
      this.telemetry.targetRpm = 0;
    } else if (this.telemetry.targetRpm === 0) {
      this.telemetry.targetRpm = 3000;
    }
    this.addAlarm(
      'info',
      'SYS_PWR',
      'Contrôle Actionneur',
      on ? 'Démarrage groupe moto-propulseur demandé' : 'Arrêt du groupe demandé'
    );
  }

  public setTargetRpm(rpm: number) {
    this.telemetry.targetRpm = Math.max(0, Math.min(6000, rpm));
  }

  public setLoadPercent(load: number) {
    this.telemetry.loadPercent = Math.max(0, Math.min(100, load));
  }

  public setFault(fault: FaultType) {
    this.telemetry.activeFault = fault;
    if (fault !== 'none') {
      const messages: Record<Exclude<FaultType, 'none'>, { code: string; sensor: string; msg: string; sev: 'warning' | 'critical' }> = {
        imbalance: {
          code: 'VIB_IMBALANCE',
          sensor: 'Vib-X1',
          msg: 'Déséquilibre dynamique rotor détecté (balourd 1X)',
          sev: 'warning',
        },
        bearing_friction: {
          code: 'BRG_DEGRADE',
          sensor: 'Brg-Temp-Front',
          msg: 'Frottement anormal palier avant & élévation thermique',
          sev: 'critical',
        },
        overheating: {
          code: 'STATOR_OVERHEAT',
          sensor: 'PT100-Winding',
          msg: 'Surchauffe thermique bobinage stator > 90°C',
          sev: 'critical',
        },
        voltage_sag: {
          code: 'GRID_VOLT_DROP',
          sensor: 'Hall-Bus400',
          msg: 'Sous-tension réseau détectée (chute 15%)',
          sev: 'warning',
        },
        oil_leak: {
          code: 'OIL_PRES_LOW',
          sensor: 'Hydro-P1',
          msg: 'Chute brutale pression circuit lubrification < 2.0 bar',
          sev: 'critical',
        },
      };

      const info = messages[fault];
      this.addAlarm(info.sev, info.code, info.sensor, info.msg);
    } else {
      this.addAlarm('info', 'SYS_FAULT_CLEAR', 'Diagnostic', 'Anomalies réinitialisées en condition nominale');
    }
  }

  public acknowledgeAlarm(id: string) {
    this.alarms = this.alarms.map((a) => (a.id === id ? { ...a, acknowledged: true } : a));
    this.notifyAlarms();
  }

  public clearAllAlarms() {
    this.alarms = [];
    this.notifyAlarms();
  }

  public subscribe(fn: (t: TwinTelemetry) => void) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  public subscribeAlarms(fn: (a: AlarmItem[]) => void) {
    this.alarmListeners.push(fn);
    return () => {
      this.alarmListeners = this.alarmListeners.filter((l) => l !== fn);
    };
  }

  private addAlarm(severity: 'info' | 'warning' | 'critical', code: string, sensor: string, message: string) {
    const item: AlarmItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      severity,
      code,
      sensor,
      message,
      acknowledged: false,
    };
    this.alarms = [item, ...this.alarms.slice(0, 49)];
    this.notifyAlarms();
  }

  private notifyAlarms() {
    this.alarmListeners.forEach((fn) => fn(this.alarms));
  }

  private tick() {
    this.internalElapsed += 0.5;
    const t = this.telemetry;
    const fault = t.activeFault;

    // 1. Inertie mécanique du Rotor (RPM)
    const target = t.powerOn ? t.targetRpm : 0;
    const deltaRpm = (target - t.rpm) * 0.12;
    t.rpm += deltaRpm;
    if (Math.abs(t.rpm - target) < 2) t.rpm = target;

    // Bruit de fond naturel
    const rpmNoise = t.rpm > 10 ? (Math.random() - 0.5) * 8 : 0;
    const effectiveRpm = Math.max(0, t.rpm + rpmNoise);
    t.dominantFrequency = effectiveRpm > 0 ? Number((effectiveRpm / 60).toFixed(1)) : 0;

    // 2. Électrique
    let targetVoltage = 400.0 + (Math.random() - 0.5) * 1.5;
    if (fault === 'voltage_sag') targetVoltage = 338.0 + (Math.random() - 0.5) * 3;
    t.voltage = Number(targetVoltage.toFixed(1));

    const loadRatio = t.loadPercent / 100;
    const rpmRatio = effectiveRpm / 6000;
    const baseCurrent = t.powerOn ? 4.5 + rpmRatio * 18 + loadRatio * 32 : 0;
    t.current = Number((baseCurrent + (Math.random() - 0.5) * 0.4).toFixed(1));

    // Puissance P = U * I * sqrt(3) * cos phi / 1000
    t.powerFactor = t.powerOn ? Number((0.88 + loadRatio * 0.08).toFixed(2)) : 0.0;
    t.activePower = t.powerOn
      ? Number(((t.voltage * t.current * Math.sqrt(3) * t.powerFactor) / 1000).toFixed(1))
      : 0;
    t.energyKwh = Number((t.energyKwh + (t.activePower * (0.5 / 3600))).toFixed(3));

    // 3. Vibrations (ISO 10816-3)
    let baseVib = (rpmRatio * 1.8) + (loadRatio * 0.4);
    if (fault === 'imbalance') {
      baseVib += 5.2 + Math.sin(this.internalElapsed * 4) * 0.6; // Balourd massif
    }
    if (fault === 'bearing_friction') {
      baseVib += 3.8 + Math.random() * 0.8; // Frottement à haute fréquence
    }
    t.vibrationRms = Number(Math.max(0.1, baseVib + (Math.random() - 0.5) * 0.08).toFixed(2));
    t.vibrationPeak = Number((t.vibrationRms * 1.55 + (Math.random() - 0.5) * 0.1).toFixed(2));

    // 4. Thermique
    const ambient = 22.0;
    t.tempAmbient = ambient;
    
    // Stator
    let targetStatorTemp = ambient + (rpmRatio * 28) + (loadRatio * 25);
    if (fault === 'overheating') targetStatorTemp += 38;
    t.tempStator += (targetStatorTemp - t.tempStator) * 0.04;
    t.tempStator = Number(t.tempStator.toFixed(1));

    // Paliers
    let targetBrgFront = ambient + (rpmRatio * 22) + (t.vibrationRms * 3.5);
    if (fault === 'bearing_friction') targetBrgFront += 32;
    t.tempBearingFront += (targetBrgFront - t.tempBearingFront) * 0.05;
    t.tempBearingFront = Number(t.tempBearingFront.toFixed(1));

    let targetBrgRear = ambient + (rpmRatio * 18);
    t.tempBearingRear += (targetBrgRear - t.tempBearingRear) * 0.04;
    t.tempBearingRear = Number(t.tempBearingRear.toFixed(1));

    // Refroidissement & Fluide
    let targetCoolant = ambient + (t.tempStator - ambient) * 0.35;
    t.tempCoolant += (targetCoolant - t.tempCoolant) * 0.06;
    t.tempCoolant = Number(t.tempCoolant.toFixed(1));

    let targetOilPressure = t.powerOn ? 3.8 + (rpmRatio * 0.8) : 0.2;
    if (fault === 'oil_leak') targetOilPressure = 1.1;
    t.oilPressure = Number((targetOilPressure + (Math.random() - 0.5) * 0.05).toFixed(2));

    t.coolantFlow = t.powerOn ? Number((15.5 + rpmRatio * 4 + (Math.random() - 0.5) * 0.2).toFixed(1)) : 0;

    // 5. Réseau IoT
    t.pingLatency = Math.floor(12 + Math.random() * 5);
    t.dataSyncDelta = Math.floor(3 + Math.random() * 3);
    t.mqttRate = 50 + Math.floor((Math.random() - 0.5) * 4);

    // 6. Calcul Score de Santé & RUL
    let health = 98;
    if (t.vibrationRms > 4.5) health -= 25;
    else if (t.vibrationRms > 2.8) health -= 10;

    if (t.tempStator > 85) health -= 30;
    else if (t.tempStator > 75) health -= 12;

    if (t.tempBearingFront > 75) health -= 25;
    if (t.oilPressure < 2.0 && t.powerOn) health -= 35;
    if (fault !== 'none') health -= 15;

    t.healthScore = Math.max(8, Math.min(100, Math.round(health)));
    t.rulHours = Math.round((t.healthScore / 100) * 9000);
    t.wearIndex = Math.round(100 - t.healthScore * 0.95);

    // Historique
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    this.history.push({
      timeStr,
      rpm: Math.round(t.rpm),
      tempStator: t.tempStator,
      tempBearingFront: t.tempBearingFront,
      vibrationRms: t.vibrationRms,
      powerKw: t.activePower,
      healthScore: t.healthScore,
    });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Auto-déclenchement d'alarmes sur seuil
    if (t.vibrationRms >= 7.1 && !this.hasRecentAlarm('VIB_CRIT')) {
      this.addAlarm('critical', 'VIB_CRIT', 'Vib-X1', `Vibration critique ISO Zone D: ${t.vibrationRms} mm/s`);
    } else if (t.vibrationRms >= 4.5 && t.vibrationRms < 7.1 && !this.hasRecentAlarm('VIB_WARN')) {
      this.addAlarm('warning', 'VIB_WARN', 'Vib-X1', `Vibration élevée ISO Zone C: ${t.vibrationRms} mm/s`);
    }

    if (t.tempStator >= 90 && !this.hasRecentAlarm('TEMP_STATOR_MAX')) {
      this.addAlarm('critical', 'TEMP_STATOR_MAX', 'PT100-Winding', `Température stator dépassée: ${t.tempStator}°C`);
    }

    // Notification aux écouteurs
    this.listeners.forEach((fn) => fn({ ...t }));
  }

  private hasRecentAlarm(code: string): boolean {
    return this.alarms.slice(0, 3).some((a) => a.code === code && !a.acknowledged);
  }
}

// Instance globale unique
export const telemetryEngine = new TelemetryEngine();

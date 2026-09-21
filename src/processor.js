/**
 * Biosignal Edge Processor
 * Runs deterministic moving-window analysis over incoming telemetry.
 */
export class BiosignalProcessor {
  constructor(windowSize = 8) {
    this.windowSize = windowSize;
    this.buffer = [];
    this.consecutiveCrits = 0;
  }

  ingest(sample) {
    this.buffer.push(sample);
    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
    }

    const avgHR = this.buffer.reduce((acc, s) => acc + s.heart_rate, 0) / this.buffer.length;
    const avgSpO2 = this.buffer.reduce((acc, s) => acc + s.spo2, 0) / this.buffer.length;

    // Sustained Ventricular Tachycardia Check (>145 BPM)
    if (sample.heart_rate >= 145) {
      this.consecutiveCrits++;
      if (this.consecutiveCrits >= 2) {
        return {
          isAnomaly: true,
          type: 'Ventricular Tachycardia',
          value: sample.heart_rate,
          severity: 'CRITICAL',
          stats: { avgHR: avgHR.toFixed(1), avgSpO2: avgSpO2.toFixed(1) }
        };
      }
    } 
    // Acute Hypoxemia (<90% SpO2)
    else if (sample.spo2 < 90.0) {
      this.consecutiveCrits++;
      if (this.consecutiveCrits >= 2) {
        return {
          isAnomaly: true,
          type: 'Acute Hypoxemia',
          value: sample.spo2,
          severity: 'CRITICAL',
          stats: { avgHR: avgHR.toFixed(1), avgSpO2: avgSpO2.toFixed(1) }
        };
      }
    } else {
      this.consecutiveCrits = 0;
    }

    return { isAnomaly: false, stats: { avgHR: avgHR.toFixed(1), avgSpO2: avgSpO2.toFixed(1) } };
  }
}

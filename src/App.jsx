import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  // Telemetry state vector
  const [telemetry, setTelemetry] = useState({
    heartRate: 74,
    spo2: 98,
    temp: 36.7,
    radiation: 0.18,
    timestamp: new Date().toLocaleTimeString()
  });

  const [isSimulating, setIsSimulating] = useState(true);
  const [lastLoggedStatus, setLastLoggedStatus] = useState('Nominal Operations');

  // Background Telemetry Simulation Engine
  useEffect(() => {
    if (!isSimulating) return;

    const streamInterval = setInterval(() => {
      setTelemetry((prev) => {
        // Small organic fluctuations around baseline
        const deltaHR = Math.floor(Math.random() * 5) - 2; // -2 to +2 bpm
        const deltaSpo2 = (Math.random() * 0.4 - 0.2); // subtle drift
        const deltaRad = (Math.random() * 0.02 - 0.01);

        const newHR = Math.min(Math.max(prev.heartRate + deltaHR, 55), 160);
        const newSpo2 = Math.min(Math.max(+(prev.spo2 + deltaSpo2).toFixed(1), 85), 100);
        const newRad = +(prev.radiation + deltaRad).toFixed(2);

        return {
          heartRate: newHR,
          spo2: newSpo2,
          temp: +(36.7 + (Math.random() * 0.2 - 0.1)).toFixed(1),
          radiation: newRad > 0 ? newRad : 0.01,
          timestamp: new Date().toLocaleTimeString()
        };
      });
    }, 1500); // Ticks every 1.5 seconds

    // Memory cleanup on unmount
    return () => clearInterval(streamInterval);
  }, [isSimulating]);

  // Anomaly Injection Test (Simulates sudden acute failure)
  const injectArrhythmiaAnomaly = async () => {
    const criticalHR = 158;
    setTelemetry((prev) => ({ ...prev, heartRate: criticalHR }));
    setLastLoggedStatus('Uplinking Autonomous Triage Event...');

    const { error } = await supabase.from('incident_logs').insert([
      {
        crew_member: 'Commander',
        vital_type: 'Ventricular Tachycardia',
        value: criticalHR,
        severity: 'CRITICAL',
        countermeasure: 'Auto-Triage CDS: Deploy synchronized cardioversion checklist & notify habitat pod.'
      }
    ]);

    if (error) {
      setLastLoggedStatus(`Uplink Error: ${error.message}`);
    } else {
      setLastLoggedStatus('Incident Committed to Mission Log');
    }
  };

  return (
    <div style={{ backgroundColor: '#090d16', color: '#e2e8f0', minHeight: '100vh', padding: '32px', fontFamily: 'monospace' }}>
      <header style={{ borderBottom: '1px solid #1e293b', paddingBottom: '16px', marginBottom: '28px' }}>
        <h1 style={{ color: '#00ffcc', margin: 0, letterSpacing: '2px', fontSize: '24px' }}>LYNXSTATION // PULSAERO</h1>
        <p style={{ color: '#64748b', margin: '6px 0 0 0', fontSize: '13px' }}>
          Autonomous Clinical Triage & Deep-Space Biometric Stream
        </p>
      </header>

      {/* Primary Telemetry Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        
        <div style={{ background: '#111827', border: '1px solid #1f2937', padding: '18px', borderRadius: '6px' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>HEART RATE</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: telemetry.heartRate > 120 ? '#ef4444' : '#38bdf8', marginTop: '6px' }}>
            {telemetry.heartRate} <span style={{ fontSize: '14px', color: '#64748b' }}>BPM</span>
          </div>
        </div>

        <div style={{ background: '#111827', border: '1px solid #1f2937', padding: '18px', borderRadius: '6px' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>PULSE OXIMETRY</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: telemetry.spo2 < 92 ? '#f59e0b' : '#34d399', marginTop: '6px' }}>
            {telemetry.spo2} <span style={{ fontSize: '14px', color: '#64748b' }}>%</span>
          </div>
        </div>

        <div style={{ background: '#111827', border: '1px solid #1f2937', padding: '18px', borderRadius: '6px' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>CORE TEMP</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#a78bfa', marginTop: '6px' }}>
            {telemetry.temp} <span style={{ fontSize: '14px', color: '#64748b' }}>°C</span>
          </div>
        </div>

        <div style={{ background: '#111827', border: '1px solid #1f2937', padding: '18px', borderRadius: '6px' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>IONIZING RAD</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f43f5e', marginTop: '6px' }}>
            {telemetry.radiation} <span style={{ fontSize: '14px', color: '#64748b' }}>mSv/h</span>
          </div>
        </div>

      </div>

      {/* Engine Controls & Simulation Injector */}
      <div style={{ background: '#111827', border: '1px solid #1f2937', padding: '20px', borderRadius: '6px', maxWidth: '600px' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#cbd5e1' }}>SIMULATION CONTROLS & MANUAL INJECTION</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            style={{
              background: isSimulating ? '#1e293b' : '#0284c7',
              color: '#fff',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isSimulating ? 'PAUSE TELEMETRY' : 'RESUME TELEMETRY'}
          </button>

          <button
            onClick={injectArrhythmiaAnomaly}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              padding: '10px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            SIMULATE CARDIAC ARREST
          </button>
        </div>

        <p style={{ margin: '16px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
          Telemetry Ticker: <span style={{ color: '#00ffcc' }}>{telemetry.timestamp}</span> | Event Link: <span style={{ color: '#f8fafc' }}>{lastLoggedStatus}</span>
        </p>
      </div>
    </div>
  );
}
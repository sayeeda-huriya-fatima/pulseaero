import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { supabase } from './supabaseClient';
import { BiosignalProcessor } from './processor';

const EMERGENCY_PROTOCOLS = {
  'Ventricular Tachycardia': {
    title: 'CARDIAC ARREST / TACHYARRHYTHMIA PROTOCOL',
    severity: 'RED ALERT',
    broadcast: 'CREW ALERT: Commander experiencing cardiac collapse. All available crew respond to Crew Quarters.',
    steps: [
      'Deploy AED from Medical Bay (Rack 2).',
      'Expose chest; attach electrode pads (Upper right chest & lower left ribs).',
      'Ensure nobody touches the patient while AED analyzes rhythm.',
      'Deliver shock if advised; begin high-quality chest compressions immediately (100–120 bpm).'
    ]
  },
  'Acute Hypoxemia': {
    title: 'ACUTE HYPOXEMIA / PERFUSION DROP PROTOCOL',
    severity: 'YELLOW ADVISORY',
    broadcast: 'CABIN ADVISORY: Commander SpO2 below critical margins. Assess oxygenation immediately.',
    steps: [
      'Inspect suit umbilical connectors and visor seal for pressure drop.',
      'Engage secondary 100% O2 emergency bypass valve.',
      'Check cabin Barometric Pressure indicators.',
      'Position patient seated upright; monitor telemetry recovery.'
    ]
  }
};

export default function App() {
  const [telemetry, setTelemetry] = useState({
    heart_rate: 78,
    spo2: 98.3,
    core_temp: 36.6,
    ionizing_rad: 0.1,
  });

  const [isPaused, setIsPaused] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stressProfile, setStressProfile] = useState(null);
  const [activeEmergency, setActiveEmergency] = useState(null);

  const processor = useRef(new BiosignalProcessor());
  const incidentLoggedRef = useRef(false);

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setTelemetry((prev) => {
        let hr = prev.heart_rate;
        let spo2 = prev.spo2;

        if (stressProfile === 'tachycardia') {
          hr = Math.min(168, hr + 12);
          spo2 = Math.max(89.2, parseFloat((spo2 - 0.7).toFixed(1)));
        } else {
          hr = Math.max(72, Math.min(84, Math.round(hr + (Math.random() * 2 - 1))));
          spo2 = parseFloat(Math.max(97.5, Math.min(99.4, spo2 + (Math.random() * 0.2 - 0.1))).toFixed(1));
        }

        const sample = {
          heart_rate: hr,
          spo2: parseFloat(spo2),
          core_temp: 36.6,
          ionizing_rad: 0.1,
        };

        const evaluation = processor.current.ingest(sample);

        if (evaluation.isAnomaly && !incidentLoggedRef.current) {
          incidentLoggedRef.current = true;
          setActiveEmergency(EMERGENCY_PROTOCOLS[evaluation.type] || null);

          supabase
            .from('incident_logs')
            .insert([
              {
                crew_member: 'Commander',
                vital_type: evaluation.type,
                value: evaluation.value,
                severity: evaluation.severity,
              },
            ])
            .then(() => fetchRecentLogs());
        }

        return sample;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, stressProfile]);

  const fetchRecentLogs = async () => {
    const { data } = await supabase
      .from('incident_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(4);
    if (data) setLogs(data);
  };

  useEffect(() => {
    fetchRecentLogs();
  }, []);

  return (
    <div className="dashboard-container">
      <h1 className="header-title">LYNXSTATION // PULSEAERO</h1>
      <p className="header-sub">Autonomous Clinical Triage & Deep-Space Biometric Stream</p>

      {/* Emergency Advisory Modal / Banner */}
      {activeEmergency && (
        <div style={{
          width: '100%',
          maxWidth: '900px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '2rem',
          fontFamily: 'monospace'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.9rem' }}>
              ⚠️ {activeEmergency.title}
            </span>
            <button 
              onClick={() => setActiveEmergency(null)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              [DISMISS ADVISORY]
            </button>
          </div>
          <p style={{ color: '#fca5a5', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {activeEmergency.broadcast}
          </p>
          <div style={{ fontSize: '0.75rem', color: '#e2e8f0' }}>
            <strong style={{ color: '#ffffff' }}>AUTOMATED CLINICAL GUIDANCE:</strong>
            <ol style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', lineHeight: '1.5' }}>
              {activeEmergency.steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* 4 HUD Metric Tiles */}
      <div className="hud-grid">
        <div className="hud-card">
          <div className="hud-label">Heart Rate</div>
          <div className={`hud-value ${telemetry.heart_rate > 140 ? 'val-critical' : 'val-blue'}`}>
            {telemetry.heart_rate} <span className="hud-unit">BPM</span>
          </div>
        </div>

        <div className="hud-card">
          <div className="hud-label">Pulse Oximetry</div>
          <div className={`hud-value ${telemetry.spo2 < 90 ? 'val-red' : 'val-green'}`}>
            {telemetry.spo2} <span className="hud-unit">%</span>
          </div>
        </div>

        <div className="hud-card">
          <div className="hud-label">Core Temp</div>
          <div className="hud-value val-cyan">
            {telemetry.core_temp} <span className="hud-unit">°C</span>
          </div>
        </div>

        <div className="hud-card">
          <div className="hud-label">Ionizing Rad</div>
          <div className="hud-value val-red">
            {telemetry.ionizing_rad} <span className="hud-unit">mSv/h</span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="controls-row">
        <button className="btn-secondary" onClick={() => setIsPaused(!isPaused)}>
          {isPaused ? 'Resume Telemetry' : 'Pause Telemetry'}
        </button>

        <button
          className="btn-alert"
          onClick={() => {
            incidentLoggedRef.current = false;
            setStressProfile(stressProfile === 'tachycardia' ? null : 'tachycardia');
          }}
        >
          {stressProfile === 'tachycardia' ? 'Stabilize Crew' : 'Induce Arrhythmic Event'}
        </button>
      </div>

      {/* Autonomous Incident Logs Table */}
      <div className="logs-card">
        <div className="logs-header">
          <span>Autonomous Clinical Audit Log (Supabase Realtime)</span>
          <span style={{ color: '#34d399' }}>● Connected</span>
        </div>

        <div className="logs-list">
          {logs.length === 0 ? (
            <div style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '0.75rem' }}>
              Awaiting telemetry incidents...
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id || Math.random()} className="log-entry">
                <span style={{ color: '#64748b' }}>
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
                <span style={{ color: '#cbd5e1' }}>[{log.crew_member}]</span>
                <span style={{ color: '#f8fafc' }}>{log.vital_type}</span>
                <span style={{ color: '#94a3b8' }}>Val: {log.value}</span>
                <span className="badge-critical">{log.severity}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { supabase } from './supabaseClient';
import { BiosignalProcessor } from './processor';

// 1. Autonomous Clinical Decision Support System (CDSS) Protocols
const EMERGENCY_PROTOCOLS = {
  'Ventricular Tachycardia': {
    title: 'CARDIAC ARREST / TACHYARRHYTHMIA PROTOCOL',
    severity: 'RED ALERT',
    broadcast: 'CREW ALERT: Commander experiencing sudden cardiac collapse. All available crew respond to Crew Quarters.',
    steps: [
      'Deploy AED from Medical Bay (Rack 2).',
      'Expose chest; attach electrode pads (Upper right chest & lower left ribs).',
      'Ensure nobody touches the patient while AED analyzes rhythm.',
      'Deliver shock if advised; begin high-quality chest compressions immediately (100–120 bpm).'
    ]
  },
  'Solar Particle Event': {
    title: 'SOLAR PARTICLE EVENT (SPE) / ACUTE FLUX PROTOCOL',
    severity: 'AMBER WARNING',
    broadcast: 'ENVIRONMENTAL ALERT: High-energy solar proton flux detected (8.4 mSv/h). Exceeds operational baseline.',
    steps: [
      'Terminate active Extravehicular Activity (EVA) immediately.',
      'Direct all crew members to central storm shelter (Water wall reinforced module).',
      'Deploy supplemental polyethylene shielding blocks across crew quarters.',
      'Administer baseline radioprotective antioxidant countermeasures per CMO protocol.'
    ]
  },
  'EVA Exertion': {
    title: 'METABOLIC WORKLOAD & HYPERTHERMIA ADVISORY',
    severity: 'BLUE ADVISORY',
    broadcast: 'MISSION ADVISORY: High metabolic output detected during extravehicular operations.',
    steps: [
      'Increase Liquid Cooling and Ventilation Garment (LCVG) coolant loop flow rate.',
      'Enforce 10-minute active physical rest pause on tether.',
      'Monitor real-time metabolic rate and suit CO2 scrub canister delta-P.',
      'Ensure core body temperature stabilizes below 37.5°C before resuming traversal.'
    ]
  }
};

// 2. Real-Time 60 FPS Canvas ECG Oscilloscope Component
function ECGWaveform({ isArrhythmia }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let x = 0;
    const height = canvas.height;
    const width = canvas.width;
    const mid = height / 2;

    ctx.fillStyle = '#070b0f';
    ctx.fillRect(0, 0, width, height);

    const render = () => {
      ctx.fillStyle = 'rgba(7, 11, 15, 0.08)';
      ctx.fillRect(x, 0, 8, height);

      let y = mid;
      const cycle = x % (isArrhythmia ? 45 : 90);

      if (isArrhythmia) {
        if (cycle > 10 && cycle < 18) {
          y = mid - Math.sin((cycle - 10) * 0.4) * (mid * 0.85);
        } else if (cycle >= 18 && cycle < 28) {
          y = mid + Math.sin((cycle - 18) * 0.35) * (mid * 0.7);
        } else {
          y = mid + (Math.random() * 8 - 4);
        }
      } else {
        if (cycle > 15 && cycle < 25) {
          y = mid - Math.sin((cycle - 15) * 0.314) * 8;
        } else if (cycle >= 28 && cycle < 31) {
          y = mid + 6;
        } else if (cycle >= 31 && cycle < 36) {
          y = mid - (mid * 0.75);
        } else if (cycle >= 36 && cycle < 40) {
          y = mid + 12;
        } else if (cycle >= 48 && cycle < 62) {
          y = mid - Math.sin((cycle - 48) * 0.224) * 14;
        } else {
          y = mid + (Math.random() * 2 - 1);
        }
      }

      ctx.strokeStyle = isArrhythmia ? '#ef4444' : '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x - 1, mid);
      ctx.lineTo(x, y);
      ctx.stroke();

      x = (x + 2) % width;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [isArrhythmia]);

  return (
    <div style={{
      width: '100%',
      maxWidth: '900px',
      background: '#070b0f',
      border: '1px solid #1e293b',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1.5rem',
      boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'monospace',
        fontSize: '0.7rem',
        color: '#64748b',
        marginBottom: '0.5rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }}>
        <span>Telemetry Lead II: Real-time Dynamic Vector Waveform</span>
        <span style={{ color: isArrhythmia ? '#ef4444' : '#38bdf8' }}>
          {isArrhythmia ? '● CHAOTIC RHYTHM DETECTED' : '● NOMINAL SINUS TRACE'}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={860}
        height={85}
        style={{ width: '100%', height: '85px', display: 'block' }}
      />
    </div>
  );
}

// 3. Primary Mission Console Application
export default function App() {
  const [telemetry, setTelemetry] = useState({
    heart_rate: 78,
    spo2: 98.3,
    core_temp: 36.6,
    ionizing_rad: 0.1,
  });

  const [cumulativeRad] = useState(14.8);
  const [readinessScore] = useState(91);
  const [boneCountermeasure] = useState(85);
  const [cognitiveLoad] = useState(24);

  const [isPaused, setIsPaused] = useState(false);
  const [logs, setLogs] = useState([]);
  const [stressProfile, setStressProfile] = useState(null);
  const [activeEmergency, setActiveEmergency] = useState(null);

  const processor = useRef(new BiosignalProcessor());

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

  const triggerScenario = (scenario) => {
    if (stressProfile === scenario) {
      setStressProfile(null);
      setActiveEmergency(null);
      return;
    }

    setStressProfile(scenario);

    if (scenario === 'tachycardia') {
      setActiveEmergency(EMERGENCY_PROTOCOLS['Ventricular Tachycardia']);
      supabase
        .from('incident_logs')
        .insert([{
          crew_member: 'Commander',
          vital_type: 'Ventricular Tachycardia',
          value: 168,
          severity: 'CRITICAL',
        }])
        .then(() => fetchRecentLogs());
    } else if (scenario === 'solar_flare') {
      setActiveEmergency(EMERGENCY_PROTOCOLS['Solar Particle Event']);
      supabase
        .from('incident_logs')
        .insert([{
          crew_member: 'Commander',
          vital_type: 'Solar Particle Event (SPE)',
          value: 8.4,
          severity: 'WARNING',
        }])
        .then(() => fetchRecentLogs());
    } else if (scenario === 'eva_workload') {
      setActiveEmergency(EMERGENCY_PROTOCOLS['EVA Exertion']);
      supabase
        .from('incident_logs')
        .insert([{
          crew_member: 'Commander',
          vital_type: 'EVA Metabolic Exertion',
          value: 138,
          severity: 'ADVISORY',
        }])
        .then(() => fetchRecentLogs());
    }
  };

  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      setTelemetry((prev) => {
        let hr = prev.heart_rate;
        let spo2 = prev.spo2;
        let temp = 36.6;
        let rad = 0.1;

        if (stressProfile === 'tachycardia') {
          hr = Math.min(168, hr + 12);
          spo2 = Math.max(89.2, parseFloat((spo2 - 0.7).toFixed(1)));
        } else if (stressProfile === 'solar_flare') {
          rad = 8.4;
          hr = Math.max(82, Math.min(94, Math.round(hr + (Math.random() * 2 - 1))));
        } else if (stressProfile === 'eva_workload') {
          hr = Math.min(138, hr + 6);
          temp = 37.3;
          spo2 = 96.5;
        } else {
          hr = Math.max(72, Math.min(84, Math.round(hr + (Math.random() * 2 - 1))));
          spo2 = parseFloat(Math.max(97.5, Math.min(99.4, spo2 + (Math.random() * 0.2 - 0.1))).toFixed(1));
        }

        const sample = {
          heart_rate: hr,
          spo2: parseFloat(spo2),
          core_temp: temp,
          ionizing_rad: rad,
        };

        processor.current.ingest(sample);
        return sample;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, stressProfile]);

  return (
    <div className="dashboard-container">
      <h1 className="header-title">LYNXSTATION // PULSEAERO</h1>
      <p className="header-sub">NASA Autonomous Astronaut Health & Telemetry System</p>

      <ECGWaveform isArrhythmia={stressProfile === 'tachycardia'} />

      {activeEmergency && (
        <div style={{
          width: '100%',
          maxWidth: '900px',
          background: activeEmergency.severity === 'RED ALERT' 
            ? 'rgba(239, 68, 68, 0.12)' 
            : activeEmergency.severity === 'AMBER WARNING' 
            ? 'rgba(245, 158, 11, 0.12)' 
            : 'rgba(56, 189, 248, 0.12)',
          border: `1px solid ${
            activeEmergency.severity === 'RED ALERT' 
              ? '#ef4444' 
              : activeEmergency.severity === 'AMBER WARNING' 
              ? '#f59e0b' 
              : '#38bdf8'
          }`,
          borderRadius: '8px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          fontFamily: 'monospace'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ 
              color: activeEmergency.severity === 'RED ALERT' ? '#ef4444' : activeEmergency.severity === 'AMBER WARNING' ? '#f59e0b' : '#38bdf8', 
              fontWeight: 'bold', 
              fontSize: '0.9rem' 
            }}>
              ⚠️ {activeEmergency.title} [{activeEmergency.severity}]
            </span>
            <button 
              onClick={() => setActiveEmergency(null)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              [DISMISS ADVISORY]
            </button>
          </div>
          <p style={{ color: '#e2e8f0', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
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
          <div className={`hud-value ${telemetry.ionizing_rad > 2.0 ? 'val-red' : 'val-blue'}`}>
            {telemetry.ionizing_rad} <span className="hud-unit">mSv/h</span>
          </div>
        </div>
      </div>

      <div className="eval-section">
        <div className="eval-card">
          <div className="eval-title">
            <span>Astronaut Health Indicators</span>
            <span style={{ color: readinessScore > 80 ? '#34d399' : '#f59e0b' }}>Readiness: {readinessScore}%</span>
          </div>

          <div className="metric-bar-group">
            <div className="metric-bar-header">
              <span>Cumulative Mission Radiation</span>
              <span>{cumulativeRad} / 100 mSv</span>
            </div>
            <div className="metric-bar-bg">
              <div className="metric-bar-fill" style={{ width: `${cumulativeRad}%`, background: '#f87171' }}></div>
            </div>
          </div>

          <div className="metric-bar-group">
            <div className="metric-bar-header">
              <span>Bone/Muscle Countermeasure Target (ARED)</span>
              <span>{boneCountermeasure}%</span>
            </div>
            <div className="metric-bar-bg">
              <div className="metric-bar-fill" style={{ width: `${boneCountermeasure}%`, background: '#38bdf8' }}></div>
            </div>
          </div>

          <div className="metric-bar-group">
            <div className="metric-bar-header">
              <span>Behavioral & Cognitive Fatigue Index</span>
              <span>{cognitiveLoad}% (Nominal)</span>
            </div>
            <div className="metric-bar-bg">
              <div className="metric-bar-fill" style={{ width: `${cognitiveLoad}%`, background: '#a78bfa' }}></div>
            </div>
          </div>
        </div>

        <div className="eval-card">
          <div className="eval-title">
            <span>Prescriptive Countermeasures</span>
            <span style={{ color: '#38bdf8' }}>Autonomous Plan</span>
          </div>

          <div className="rec-item">
            🦴 <strong>Musculoskeletal:</strong> Schedule 45 min resistive load on ARED to mitigate microgravity bone mineral density loss.
          </div>
          <div className="rec-item">
            🧠 <strong>Behavioral:</strong> Circadian blue-enriched light therapy (480nm) scheduled for 07:00 UTC cycle.
          </div>
          <div className="rec-item warning">
            🛡️ <strong>Radiation Shielding:</strong> Cumulative dosage tracking nominal. Storm shelter protocol ready if ambient &gt; 5.0 mSv/h.
          </div>
        </div>
      </div>

      <div className="controls-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
        <button className="btn-secondary" onClick={() => setIsPaused(!isPaused)}>
          {isPaused ? 'Resume Telemetry' : 'Pause Telemetry'}
        </button>

        <button
          className="btn-secondary"
          style={{ borderColor: stressProfile === 'solar_flare' ? '#f59e0b' : '#334155' }}
          onClick={() => triggerScenario('solar_flare')}
        >
          {stressProfile === 'solar_flare' ? 'Clear Radiation Storm' : 'Simulate Solar Flare (SPE)'}
        </button>

        <button
          className="btn-secondary"
          style={{ borderColor: stressProfile === 'eva_workload' ? '#38bdf8' : '#334155' }}
          onClick={() => triggerScenario('eva_workload')}
        >
          {stressProfile === 'eva_workload' ? 'Complete Spacewalk' : 'Simulate EVA Exertion'}
        </button>

        <button
          className="btn-alert"
          onClick={() => triggerScenario('tachycardia')}
        >
          {stressProfile === 'tachycardia' ? 'Stabilize Crew' : 'Induce Arrhythmic Event'}
        </button>
      </div>

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
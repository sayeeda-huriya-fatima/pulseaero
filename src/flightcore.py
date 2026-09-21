from dataclasses import dataclass
from datetime import datetime
import random
import time


@dataclass
class BiometricSample:
  astronaut_id: str
  timestamp: str
  heart_rate: int  # bpm (Target: 55-90)
  hrv_rmssd: float  # ms - autonomic stress (Target: >35)
  map_pressure: int  # mmHg - Mean Arterial Pressure (Target: 70-100; >105 indicates fluid shift risks)
  spo2: float  # % (Target: >=96.0)
  radiation_msv: float  # cumulative mSv/day


class FlightHealthEngine:

  def __init__(self, crew_name: str):
    self.crew_name = crew_name

  def evaluate_sample(self, s: BiometricSample) -> dict:
    alerts = []
    actions = []
    risk_score = 0  # Scale: 0 (Nominal) to 100 (Critical)

    # 1. Cardiovascular / Cephalic Fluid Shift (SANS precursor)
    if s.map_pressure > 105:
      risk_score += 35
      alerts.append(
          f"ELEVATED MAP ({s.map_pressure} mmHg) - Intracranial fluid shift"
          " risk"
      )
      actions.append("Engage Lower Body Negative Pressure (LBNP) suit: 30 mins")
    elif s.map_pressure < 65:
      risk_score += 25
      alerts.append(f"HYPOTENSION DETECTED ({s.map_pressure} mmHg)")
      actions.append(
          "Administer electrolyte hydration pack (750ml); check cabin"
          " pressure"
      )

    # 2. Autonomic Tone / Fatigue
    if s.hrv_rmssd < 25.0:
      risk_score += 30
      alerts.append(
          f"CRITICAL HRV DROP ({s.hrv_rmssd:.1f}ms) - Sympathetic exhaustion"
      )
      actions.append(
          "Mandate sleep cycle extension + cut scheduled EVA load by 50%"
      )

    # 3. Hypoxia Check
    if s.spo2 < 95.0:
      risk_score += 40
      alerts.append(f"DESATURATION ({s.spo2:.1f}%)")
      actions.append("Inspect spacesuit/cabin O2 regulator; switch to reserve O2")

    # Determine flight status
    if risk_score >= 60:
      status = "RED - MISSION INTERVENTION REQUIRED"
    elif risk_score >= 30:
      status = "AMBER - ADAPTIVE COUNTERMEASURES"
    else:
      status = "GREEN - NOMINAL BIOMETRICS"

    return {
        "status": status,
        "score": risk_score,
        "alerts": alerts if alerts else ["All telemetry within mission limits"],
        "prescribed_actions": (
            actions if actions else ["Maintain nominal flight protocol"]
        ),
    }


# Simulation loop
engine = FlightHealthEngine(crew_name="Cmdr. V. Patel")

print(f"=== TELEMETRY MONITOR: {engine.crew_name} ===")
for cycle in range(1, 4):
  # Synthetic telemetry injection
  sample = BiometricSample(
      astronaut_id="ASTRO-01",
      timestamp=datetime.utcnow().strftime("%H:%M:%S UTC"),
      heart_rate=random.randint(60, 110),
      hrv_rmssd=round(random.uniform(18.0, 48.0), 1),
      map_pressure=random.randint(85, 115),
      spo2=round(random.uniform(94.0, 99.5), 1),
      radiation_msv=round(random.uniform(0.1, 0.4), 2),
  )

  result = engine.evaluate_sample(sample)

  print(
      f"\n[Packet {cycle}] Time: {sample.timestamp} | HR: {sample.heart_rate}bpm"
      f" | HRV: {sample.hrv_rmssd}ms | MAP: {sample.map_pressure}mmHg | SpO2:"
      f" {sample.spo2}%"
  )
  print(f"Status: {result['status']} (Risk Index: {result['score']}/100)")
  print("Alerts: " + " | ".join(result["alerts"]))
  print("Actions Prescribed:")
  for act in result["prescribed_actions"]:
    print(f"  -> {act}")
  time.sleep(1)
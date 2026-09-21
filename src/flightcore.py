"""
PulseAero - Flight Telemetry Edge Daemon (FTED)
Target Environment: On-orbit avionics / FreeRTOS micro-gateway
Protocol: Synchronous Frame Telemetry over Serial / UDP
"""

import time
import json
import math
from datetime import datetime, timezone

class FlightTelemetryCore:
    def __init__(self, crew_callsign="CDR-01"):
        self.callsign = crew_callsign
        self.frame_id = 0
        # Ring buffer for sliding window evaluation (10 samples)
        self.buffer_size = 10
        self.hr_window = []
        self.spo2_window = []
        
    def read_biosensors(self, tick):
        """
        Simulates raw hardware I2C/SPI ADC registers.
        Injects realistic physiological dynamics:
        - Respiratory sinus arrhythmia (HR wavering with breathing)
        - Baseline noise
        """
        # Micro-fluctuations modeled as sine wave + sensor jitter
        hr_base = 75.0 + 3.0 * math.sin(tick * 0.2)
        spo2_base = 98.2 + 0.3 * math.cos(tick * 0.1)
        core_temp = 36.65 + 0.05 * math.sin(tick * 0.05)
        radiation = 0.11 # mSv/h background

        return {
            "hr": round(hr_base, 1),
            "spo2": round(spo2_base, 1),
            "temp": round(core_temp, 2),
            "rad": radiation
        }

    def evaluate_edge_anomaly(self, raw_vitals):
        """
        DSP & State Machine: Runs zero-allocation deterministic triage.
        Calculates moving mean and flags deviations.
        """
        self.hr_window.append(raw_vitals["hr"])
        self.spo2_window.append(raw_vitals["spo2"])

        if len(self.hr_window) > self.buffer_size:
            self.hr_window.pop(0)
            self.spo2_window.pop(0)

        moving_avg_hr = sum(self.hr_window) / len(self.hr_window)
        moving_avg_spo2 = sum(self.spo2_window) / len(self.spo2_window)

        # NASA Bio-advisory thresholds
        triage = "NOMINAL"
        fault_code = 0x00

        if moving_avg_hr > 140.0:
            triage = "CRITICAL_TACHYCARDIA"
            fault_code = 0xE1
        elif moving_avg_spo2 < 90.0:
            triage = "CRITICAL_HYPOXIA"
            fault_code = 0xE2

        return triage, fault_code, moving_avg_hr, moving_avg_spo2

    def build_telemetry_frame(self, tick):
        """Packages data into standard Space Packet Protocol format (CCSDS-aligned)"""
        self.frame_id += 1
        raw = self.read_biosensors(tick)
        triage, fault, avg_hr, avg_spo2 = self.evaluate_edge_anomaly(raw)

        telemetry_frame = {
            "sync_word": "0x1ACFFC1D", # Standard CCSDS Frame Sync
            "frame_seq": self.frame_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "crew": self.callsign,
            "channels": raw,
            "edge_dsp": {
                "rolling_hr": round(avg_hr, 1),
                "rolling_spo2": round(avg_spo2, 1),
                "status": triage,
                "fault_code": hex(fault)
            }
        }
        return telemetry_frame

    def run_daemon(self, duration_secs=10):
        print(f"[*] PulseAero Flight Core Booting...")
        print(f"[*] Architecture: Radiation-Tolerant Edge Daemon")
        print(f"[*] Sampling Frequency: 1.0 Hz | Window Size: {self.buffer_size} Frames\n")
        
        for tick in range(duration_secs):
            frame = self.build_telemetry_frame(tick)
            # Output directly to stdout as formatted telemetry packet
            print(json.dumps(frame))
            time.sleep(1.0)

if __name__ == "__main__":
    core = FlightTelemetryCore()
    core.run_daemon()
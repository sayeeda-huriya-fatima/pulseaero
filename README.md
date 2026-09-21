# 🛰️ PulseAero // LynxStation

> **Autonomous Deep-Space Astronaut Clinical Decision Support System (CDSS) & Edge Telemetry**  
> **Live Production Console:** [pulseaero.vercel.app](https://pulseaero.vercel.app)  
> **Target Operation:** Non-terrestrial physiological monitoring under high-latency & zero-connectivity flight constraints.

---

## Overview

During long-duration missions to Mars or deep cislunar space, communication latencies between 5 and 22 minutes make real-time terrestrial mission control telemedicine physically impossible. **PulseAero** operates as an autonomous, edge-resident biomedical copilot deployed aboard the crew station. 

The system continuously streams multi-channel biometric registers, filters dynamic noise via deterministic digital signal processing (DSP), monitors non-terrestrial physiological stressors, and autonomously executes acute clinical intervention protocols.

---

## Key Technical Capabilities

* **60 FPS Vector Oscilloscope:** Hardware-accelerated HTML5 Canvas rendering engine providing Lead-II real-time sweep biometrics with dynamic cardiac morphing between Sinus Rhythm and Ventricular Tachycardia.
* **Non-Terrestrial Health Vectors:** Continuous monitoring of mission-critical spaceflight hazards:
  * *Spaceflight-Associated Neuro-ocular Syndrome (SANS):* Mean Arterial Pressure (MAP) and intracranial fluid shift markers.
  * *Musculoskeletal Atrophy:* ARED resistive workload compliance tracking against microgravity bone mineral density loss.
  * *Solar Particle Events (SPE):* High-energy proton flux rate ($mSv/h$) threshold monitoring with storm shelter alerts.
* **Autonomous Decision Support (CDSS):** Edge-driven rule engine delivering step-by-step clinical guidance (AED deployment, suit hyperbaric oxygen bypass, radiation shelter routines) without requiring physician crew members.
* **Deterministic Edge Framing (`flightcore.py`):** Standalone Python avionics core generating CCSDS-compliant (`0x1ACFFC1D`) telemetry packets with sliding-window moving averages.
* **Immutable Incident Audit Log:** Real-time bi-directional incident synchronization to Supabase (PostgreSQL) for mission record integrity.

---

## Architecture & Technology Stack

| Layer | Technologies Used | Operational Function |
| :--- | :--- | :--- |
| **Frontend HUD** | React 18, Vite, HTML5 Canvas, CSS3 | Mission control interface styled to NASA telemetry display standards |
| **Avionics Core** | Python 3, DSP Sliding Window, CCSDS framing | Deterministic edge telemetry simulator and protocol encoder |
| **Database Layer** | Supabase, Managed PostgreSQL | Real-time incident logging, structured severity metrics, and event audit |
| **Deployment** | Vercel CI/CD | Production edge delivery tied directly to version control |

---

## Live Mission Simulation Injectors

The production console at [pulseaero.vercel.app](https://pulseaero.vercel.app) features one-click environmental and clinical event injections:
1. **Simulate Solar Flare (SPE):** Triggers an acute ionizing radiation jump ($8.4\text{ mSv/h}$), dispatching the storm shelter radiation protocol and logging an anomaly to Supabase.
2. **Simulate EVA Exertion:** Simulates high metabolic workload and core temperature shifts during an extravehicular spacewalk.
3. **Induce Arrhythmic Event:** Dynamically alters ECG vector waveform into polymorphic tachycardia, instantly triggering the autonomous emergency AED protocol.

---

## 👥 Engineering & Mission Operations

* **Huriya Fatima** — *Lead Systems Architect & Full-Stack Developer* (React HUD, Canvas ECG engine, Supabase integration, Vercel pipeline)
* **Crew Medical Officer (Biomedical Lead)** — *Clinical Protocol Design* (Cardiac arrest algorithms, SANS cephalic fluid shift calibration)
* **Avionics & Software Lead** — *Edge Telemetry & Data Systems* (`flightcore.py` CCSDS framing, zero-allocation buffers)
* **Operations & Payload Specialist** — *Countermeasures & Radiation Ops* (ARED resistive workload tracking, SPE shelter checklists)

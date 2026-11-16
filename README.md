# Interactive Network Communication Simulator

An interactive, web-based educational simulator demonstrating how data packets move, route, and interact across computer network topologies in real-time.

---

## 🌟 Key Features

1. **Visual Network Topology Canvas (React Flow):**
   - Create, drag, connect, and configure network devices: **PCs, L2 Switches, L3 Routers, and Servers**.
   - Interactive link editor with adjustable propagation latency (ms), bandwidth capacity (Mbps), and packet loss rate (%).
   - One-click cable severing (`Cut Cable`) to simulate physical link cuts and watch failover rerouting.

2. **Full Protocol & Simulation Engine:**
   - **Address Resolution Protocol (ARP):** Broadcast ARP Requests (`FF:FF:FF:FF:FF:FF`), ARP Reply unicast, and dynamic per-device ARP tables.
   - **Layer 2 Ethernet Switching:** Source MAC address learning, CAM table aging, unknown unicast flooding, and selective port forwarding.
   - **Layer 3 IPv4 Routing & Subnetting:** Multi-interface routers, default gateway support, Longest Prefix Matching (LPM), and TTL decrementing.
   - **Dijkstra's Shortest Path Algorithm:** Dynamically computes optimal router paths based on link latency/cost. Instantly recalculates alternative routes when links fail.

3. **Packet Animation & Telemetry:**
   - Smooth animated packet tokens traveling along SVG connection paths color-coded by protocol.
   - Play, pause, single-step debugger, and variable simulation speed (0.5x, 1x, 2x).
   - Click any packet in flight to open the **Packet Inspector (OSI Stack)**: view Layer 2 Frame, Layer 3 IP Header, Payload, and hop timeline.

4. **Analytics Dashboard (Recharts):**
   - Real-time charts for Throughput (kbps) and Cumulative Packet Delivery vs. Packet Loss.
   - Live KPI metric cards: Total Sent, Delivered, Dropped, Loss Rate (%), and Average Latency (ms).

5. **Diagnostic Packet Console (Wireshark-Style):**
   - Filterable by layer (L2, L3, Physical) and severity (Info, Success, Warning, Error).
   - Real-time educational log explaining *why* every forwarding or routing decision was made.
   - Export logs as JSON for post-lab grading or inspection.

---

## 👥 Division of Work Among Members

| Member | Module | Implementation Scope |
|---|---|---|
| **Member 1** | Topology Editor & Device Configuration | React Flow canvas integration, custom node types (PC, Switch, Router, Server), connection handles, Device Configuration modal, interface IP/MAC assignment, and subnet validation. |
| **Member 2** | Protocol Engine, Switching & Routing | L2 frame/L3 packet data models, ARP resolution, switch CAM table learning & flooding, router forwarding with Longest Prefix Match, and Dijkstra's Shortest Path First algorithm. |
| **Member 3** | Packet Animation, Impairments & Analytics | Moving packet tokens, simulation tick loop, link impairments (latency, loss rate, link down), Wireshark-style event logs, and Recharts performance dashboard. |

---

## 🧪 Built-in Educational Lab Presets

1. **Simple LAN (Switch & ARP):**
   - 2 PCs, 1 Web-Server, and a central Layer 2 Switch.
   - Demonstrates initial ARP broadcast flooding, MAC learning in CAM table, and subsequent directed ping unicast.
2. **Two Subnets via Router (L3 Gateway):**
   - Two distinct IP subnets (`192.168.1.0/24` and `192.168.2.0/24`) connected through a dual-interface Router.
   - Demonstrates cross-subnet routing, default gateways, dual ARP lookups, and TTL decrementing.
3. **Dijkstra SPF & Redundant Mesh (Failover):**
   - 4 Routers in a diamond mesh with distinct link latencies (Primary: 10ms vs Backup: 45ms).
   - Demonstrates Dijkstra's algorithm selecting the lowest-latency path. Sever the primary link on the fly to observe instant failover routing along the backup path!
4. **Network Congestion & Impairment Lab:**
   - Client and Server connected over an impaired WAN link with 25% packet loss and 75ms latency.
   - Demonstrates throughput degradation, real-time packet loss charts, and dropped packet diagnostics.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation
```bash
# Clone or navigate to the project directory
cd NetworkCommunicationSimulator

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

### Running Test Suite
```bash
# Run unit and protocol integration tests
npm test
```

### Building for Production
```bash
# Type check and build static production bundle
npm run build
```

---

## 🏗️ Project Architecture

```
src/
├── components/
│   ├── canvas/
│   │   ├── nodes/
│   │   │   └── DeviceNode.tsx          # Member 1: Custom PC, Switch, Router, Server nodes
│   │   ├── edges/
│   │   │   └── NetworkLinkEdge.tsx     # Member 1 & 3: Links, latency badges, cable cut button
│   │   ├── DeviceConfigModal.tsx       # Member 1: IP, Subnet, ARP/CAM/Routing tables
│   │   ├── LinkConfigModal.tsx         # Member 1 & 3: Latency, loss rate, bandwidth
│   │   ├── PacketOverlay.tsx           # Member 3: Smooth animated packet tokens
│   │   └── TopologyCanvas.tsx          # Member 1: React Flow canvas and toolbar
│   ├── dashboard/
│   │   ├── AnalyticsDashboard.tsx      # Member 3: Recharts throughput & latency charts
│   │   ├── PacketInspectorModal.tsx    # Member 2 & 3: L2/L3 OSI stack inspector
│   │   └── PacketLogView.tsx           # Member 2 & 3: Wireshark-style protocol logs
│   └── simulation/
│       └── PlaybackToolbar.tsx         # Member 3: Play/Pause, Step, Transmit, Presets
├── engine/
│   ├── arp.ts                          # Member 2: ARP request/reply generation & cache
│   ├── dijkstra.ts                     # Member 2: Dijkstra shortest path algorithm
│   ├── macTable.ts                     # Member 2: Switch CAM table learning & port lookup
│   ├── routingTable.ts                 # Member 2: Longest prefix match & SPF table generation
│   └── simulator.ts                    # Member 2 & 3: Discrete tick coordinator & impairment engine
├── data/
│   └── presets.ts                      # Educational lab presets
├── store/
│   └── useNetworkStore.ts              # Central Zustand reactive store
├── types/
│   └── network.ts                      # Unified TypeScript interfaces
└── utils/
    └── ipUtils.ts                      # IP math, subnetting, CIDR, MAC generator
```

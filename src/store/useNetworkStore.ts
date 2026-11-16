import { create } from 'zustand';
import { 
  NetworkDevice, 
  NetworkLink, 
  NetworkPacket, 
  SimulationLog, 
  NetworkMetrics, 
  DeviceType,
  PacketType,
  NetworkInterface
} from '../types/network';
import { PRESETS } from '../data/presets';
import { buildDynamicRoutingTables } from '../engine/routingTable';
import { initiateTransmission, stepSimulation } from '../engine/simulator';
import { generateMac } from '../utils/ipUtils';

interface NetworkStore {
  // State
  devices: NetworkDevice[];
  links: NetworkLink[];
  activePackets: NetworkPacket[];
  logs: SimulationLog[];
  metrics: NetworkMetrics;
  
  selectedDeviceId: string | null;
  selectedLinkId: string | null;
  inspectingPacketId: string | null;
  
  isPlaying: boolean;
  simulationSpeed: number;
  currentPresetId: string;
  activeTab: 'canvas' | 'analytics' | 'logs';

  // Actions
  setSelectedDevice: (id: string | null) => void;
  setSelectedLink: (id: string | null) => void;
  setInspectingPacket: (id: string | null) => void;
  setActiveTab: (tab: 'canvas' | 'analytics' | 'logs') => void;
  
  addDevice: (type: DeviceType, x: number, y: number) => string;
  updateDevice: (id: string, updates: Partial<NetworkDevice>) => void;
  removeDevice: (id: string) => void;
  
  addLink: (sourceDeviceId: string, targetDeviceId: string, sourceIfaceId?: string, targetIfaceId?: string) => void;
  updateLink: (id: string, updates: Partial<NetworkLink>) => void;
  toggleLinkStatus: (id: string) => void;
  removeLink: (id: string) => void;
  
  sendPacket: (srcDeviceId: string, dstDeviceId: string, type?: PacketType, message?: string) => void;
  
  step: () => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setSimulationSpeed: (speed: number) => void;
  
  loadPreset: (presetId: string) => void;
  clearTopology: () => void;
  clearLogs: () => void;
  resetMetrics: () => void;
  refreshRoutingTables: () => void;
}

const initialMetrics: NetworkMetrics = {
  totalSent: 0,
  totalDelivered: 0,
  totalDropped: 0,
  avgLatencyMs: 0,
  packetLossPercentage: 0,
  throughputKbps: 0,
  recentDeliveries: [],
  history: [
    { timestamp: Date.now() - 5000, sent: 0, delivered: 0, dropped: 0, lossRate: 0, throughput: 0 },
    { timestamp: Date.now(), sent: 0, delivered: 0, dropped: 0, lossRate: 0, throughput: 0 },
  ],
};

const initialPreset = PRESETS.simpleLan;

export const useNetworkStore = create<NetworkStore>((set, get) => {
  // Helper to recompute routing tables
  const computeRoutes = (devices: NetworkDevice[], links: NetworkLink[]): NetworkDevice[] => {
    const routeMap = buildDynamicRoutingTables(devices, links);
    return devices.map(d => {
      if (d.type === 'router') {
        return {
          ...d,
          routingTable: routeMap.get(d.id) || [],
        };
      }
      return d;
    });
  };

  const initialDevices = computeRoutes(initialPreset.devices, initialPreset.links);

  return {
    devices: initialDevices,
    links: initialPreset.links,
    activePackets: [],
    logs: [
      {
        id: 'init-log-1',
        timestamp: Date.now(),
        simTimeFormatted: '00:00:00.000',
        level: 'info',
        action: 'Topology Loaded',
        details: `Loaded preset "${initialPreset.name}". Ready for simulation.`,
        layer: 'PHYSICAL',
      }
    ],
    metrics: initialMetrics,
    selectedDeviceId: null,
    selectedLinkId: null,
    inspectingPacketId: null,
    isPlaying: false,
    simulationSpeed: 1.0,
    currentPresetId: 'simpleLan',
    activeTab: 'canvas',

    setSelectedDevice: (id) => set({ selectedDeviceId: id, selectedLinkId: null }),
    setSelectedLink: (id) => set({ selectedLinkId: id, selectedDeviceId: null }),
    setInspectingPacket: (id) => set({ inspectingPacketId: id }),
    setActiveTab: (tab) => set({ activeTab: tab }),

    addDevice: (type: DeviceType, x: number, y: number) => {
      const state = get();
      const count = state.devices.filter(d => d.type === type).length + 1;
      const id = `${type}-${Date.now().toString(36)}`;
      const name = `${type.toUpperCase()}-${count}`;

      let interfaces: NetworkInterface[] = [];
      let defaultGateway: string | undefined;

      if (type === 'pc') {
        interfaces = [
          {
            id: 'eth0',
            name: 'eth0',
            ip: `192.168.1.${10 + count}`,
            subnetMask: '255.255.255.0',
            mac: generateMac('00:1A:2B'),
            status: 'up' as const,
          }
        ];
        defaultGateway = '192.168.1.1';
      } else if (type === 'server') {
        interfaces = [
          {
            id: 'eth0',
            name: 'eth0',
            ip: `192.168.1.${100 + count}`,
            subnetMask: '255.255.255.0',
            mac: generateMac('00:1A:2B'),
            status: 'up' as const,
          }
        ];
        defaultGateway = '192.168.1.1';
      } else if (type === 'switch') {
        interfaces = [
          { id: 'port1', name: 'Fa0/1', mac: generateMac('00:1A:2B'), status: 'up' as const },
          { id: 'port2', name: 'Fa0/2', mac: generateMac('00:1A:2B'), status: 'up' as const },
          { id: 'port3', name: 'Fa0/3', mac: generateMac('00:1A:2B'), status: 'up' as const },
          { id: 'port4', name: 'Fa0/4', mac: generateMac('00:1A:2B'), status: 'up' as const },
        ];
      } else if (type === 'router') {
        interfaces = [
          {
            id: 'g0_0',
            name: 'Gi0/0',
            ip: `192.168.${count}.1`,
            subnetMask: '255.255.255.0',
            mac: generateMac('00:1A:2B'),
            status: 'up' as const,
          },
          {
            id: 'g0_1',
            name: 'Gi0/1',
            ip: `10.0.${count}.1`,
            subnetMask: '255.255.255.0',
            mac: generateMac('00:1A:2B'),
            status: 'up' as const,
          }
        ];
      }

      const newDevice: NetworkDevice = {
        id,
        type,
        name,
        x,
        y,
        interfaces,
        defaultGateway,
        arpTable: [],
        macTable: type === 'switch' ? [] : undefined,
        routingTable: type === 'router' ? [] : undefined,
      };

      const newDevices = computeRoutes([...state.devices, newDevice], state.links);
      set({ devices: newDevices, selectedDeviceId: id });
      return id;
    },

    updateDevice: (id, updates) => {
      const state = get();
      const updatedDevices = state.devices.map(d => d.id === id ? { ...d, ...updates } : d);
      const recomputed = computeRoutes(updatedDevices, state.links);
      set({ devices: recomputed });
    },

    removeDevice: (id) => {
      const state = get();
      const filteredDevices = state.devices.filter(d => d.id !== id);
      const filteredLinks = state.links.filter(l => l.sourceDeviceId !== id && l.targetDeviceId !== id);
      const recomputed = computeRoutes(filteredDevices, filteredLinks);
      set({
        devices: recomputed,
        links: filteredLinks,
        selectedDeviceId: state.selectedDeviceId === id ? null : state.selectedDeviceId,
      });
    },

    addLink: (sourceDeviceId, targetDeviceId, sourceIfaceId, targetIfaceId) => {
      const state = get();
      if (sourceDeviceId === targetDeviceId) return;

      const srcDev = state.devices.find(d => d.id === sourceDeviceId);
      const tgtDev = state.devices.find(d => d.id === targetDeviceId);
      if (!srcDev || !tgtDev) return;

      const srcIface = sourceIfaceId || srcDev.interfaces[0]?.id || 'eth0';
      const tgtIface = targetIfaceId || tgtDev.interfaces[0]?.id || 'eth0';

      // Check if already linked
      const exists = state.links.some(l => 
        (l.sourceDeviceId === sourceDeviceId && l.targetDeviceId === targetDeviceId) ||
        (l.sourceDeviceId === targetDeviceId && l.targetDeviceId === sourceDeviceId)
      );
      if (exists) return;

      const newLink: NetworkLink = {
        id: `link-${Date.now().toString(36)}`,
        sourceDeviceId,
        sourceInterfaceId: srcIface,
        targetDeviceId,
        targetInterfaceId: tgtIface,
        bandwidthMbps: 100,
        latencyMs: 15,
        lossRate: 0,
        status: 'up',
        label: '15ms',
      };

      const newLinks = [...state.links, newLink];
      const recomputedDevices = computeRoutes(state.devices, newLinks);
      set({ links: newLinks, devices: recomputedDevices, selectedLinkId: newLink.id });
    },

    updateLink: (id, updates) => {
      const state = get();
      const updatedLinks = state.links.map(l => l.id === id ? { ...l, ...updates } : l);
      const recomputedDevices = computeRoutes(state.devices, updatedLinks);
      set({ links: updatedLinks, devices: recomputedDevices });
    },

    toggleLinkStatus: (id) => {
      const state = get();
      const link = state.links.find(l => l.id === id);
      if (!link) return;

      const newStatus: 'up' | 'down' = link.status === 'up' ? 'down' : 'up';
      const updatedLinks: NetworkLink[] = state.links.map(l => l.id === id ? { ...l, status: newStatus } : l);
      const recomputedDevices = computeRoutes(state.devices, updatedLinks);

      const statusLog: SimulationLog = {
        id: `log-toggle-${Date.now()}`,
        timestamp: Date.now(),
        simTimeFormatted: new Date().toLocaleTimeString(),
        level: newStatus === 'up' ? 'success' : 'warning',
        action: newStatus === 'up' ? 'Link Restored' : 'Link Severed',
        details: `Physical link between ${link.sourceDeviceId} and ${link.targetDeviceId} is now ${newStatus.toUpperCase()}. Dynamic routing tables recalculated via Dijkstra SPF.`,
        layer: 'PHYSICAL',
      };

      set({ 
        links: updatedLinks, 
        devices: recomputedDevices,
        logs: [statusLog, ...state.logs].slice(0, 300)
      });
    },

    removeLink: (id) => {
      const state = get();
      const filteredLinks = state.links.filter(l => l.id !== id);
      const recomputedDevices = computeRoutes(state.devices, filteredLinks);
      set({
        links: filteredLinks,
        devices: recomputedDevices,
        selectedLinkId: state.selectedLinkId === id ? null : state.selectedLinkId,
      });
    },

    sendPacket: (srcDeviceId, dstDeviceId, type = 'ICMP_ECHO_REQ', message = 'Ping transmission') => {
      const state = get();
      const { packets, newLogs, updatedDevices } = initiateTransmission(
        state.devices,
        state.links,
        srcDeviceId,
        dstDeviceId,
        type,
        message
      );

      const newTotalSent = state.metrics.totalSent + packets.length;
      set({
        devices: updatedDevices,
        activePackets: [...state.activePackets, ...packets],
        logs: [...newLogs, ...state.logs].slice(0, 300),
        metrics: {
          ...state.metrics,
          totalSent: newTotalSent,
        },
        isPlaying: true, // auto play to see packets move!
      });
    },

    step: () => {
      const state = get();
      if (state.activePackets.length === 0) return;

      const result = stepSimulation(
        state.devices,
        state.links,
        state.activePackets,
        state.simulationSpeed
      );

      // Update telemetry
      const newDelivered = state.metrics.totalDelivered + result.metricsUpdates.deliveredDelta;
      const newDropped = state.metrics.totalDropped + result.metricsUpdates.droppedDelta;
      const totalResolved = newDelivered + newDropped;
      const lossPct = totalResolved > 0 ? Math.round((newDropped / totalResolved) * 100) : 0;
      
      let avgLat = state.metrics.avgLatencyMs;
      if (result.metricsUpdates.latencySamples.length > 0) {
        const sum = result.metricsUpdates.latencySamples.reduce((a, b) => a + b, 0);
        const sampleAvg = sum / result.metricsUpdates.latencySamples.length;
        avgLat = avgLat === 0 ? sampleAvg : Math.round((avgLat * 0.8) + (sampleAvg * 0.2));
      }

      // Add point to history periodically
      const now = Date.now();
      const lastHist = state.metrics.history[state.metrics.history.length - 1];
      const shouldAppendHistory = !lastHist || (now - lastHist.timestamp > 1500);

      const updatedHistory = shouldAppendHistory
        ? [
            ...state.metrics.history.slice(-19),
            {
              timestamp: now,
              sent: state.metrics.totalSent,
              delivered: newDelivered,
              dropped: newDropped,
              lossRate: lossPct,
              throughput: Math.round(newDelivered * 8 * 1.5), // approximate throughput
            }
          ]
        : state.metrics.history;

      set({
        devices: result.devices,
        links: result.links,
        activePackets: result.packets,
        logs: [...result.newLogs, ...state.logs].slice(0, 300),
        metrics: {
          ...state.metrics,
          totalDelivered: newDelivered,
          totalDropped: newDropped,
          avgLatencyMs: avgLat,
          packetLossPercentage: lossPct,
          throughputKbps: Math.round(newDelivered * 8 * 1.5),
          history: updatedHistory,
        }
      });
    },

    setIsPlaying: (playing) => set({ isPlaying: playing }),
    togglePlay: () => set(s => ({ isPlaying: !s.isPlaying })),
    setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),

    loadPreset: (presetId) => {
      const preset = PRESETS[presetId];
      if (!preset) return;

      const devicesWithRoutes = computeRoutes(preset.devices, preset.links);
      set({
        devices: devicesWithRoutes,
        links: preset.links,
        activePackets: [],
        currentPresetId: presetId,
        selectedDeviceId: null,
        selectedLinkId: null,
        logs: [
          {
            id: `load-${Date.now()}`,
            timestamp: Date.now(),
            simTimeFormatted: new Date().toLocaleTimeString(),
            level: 'info',
            action: 'Preset Loaded',
            details: `Loaded "${preset.name}". ${preset.description}`,
            layer: 'PHYSICAL',
          }
        ],
        metrics: initialMetrics,
      });
    },

    clearTopology: () => {
      set({
        devices: [],
        links: [],
        activePackets: [],
        selectedDeviceId: null,
        selectedLinkId: null,
        logs: [
          {
            id: `clear-${Date.now()}`,
            timestamp: Date.now(),
            simTimeFormatted: new Date().toLocaleTimeString(),
            level: 'warning',
            action: 'Canvas Cleared',
            details: 'Topology cleared. You can now build a custom network from scratch.',
            layer: 'PHYSICAL',
          }
        ],
        metrics: initialMetrics,
      });
    },

    clearLogs: () => set({ logs: [] }),
    resetMetrics: () => set({ metrics: initialMetrics }),

    refreshRoutingTables: () => {
      const state = get();
      const recomputed = computeRoutes(state.devices, state.links);
      set({ devices: recomputed });
    }
  };
});

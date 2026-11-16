export type DeviceType = 'pc' | 'router' | 'switch' | 'server';

export interface NetworkInterface {
  id: string;
  name: string;
  ip?: string;
  subnetMask?: string;
  mac: string;
  status: 'up' | 'down';
  connectedEdgeId?: string;
  connectedDeviceId?: string;
}

export interface ArpEntry {
  ip: string;
  mac: string;
  interfaceId: string;
  timestamp: number;
}

export interface MacTableEntry {
  mac: string;
  portId: string;
  timestamp: number;
}

export interface RouteEntry {
  id: string;
  destinationSubnet: string; // e.g. "192.168.2.0" or "0.0.0.0"
  mask: string;              // e.g. "255.255.255.0" or "0.0.0.0"
  nextHop: string;           // "DIRECT" or next hop IP e.g. "192.168.1.1"
  interfaceId: string;       // router interface used
  metric: number;            // cost / hops
  type: 'DIRECT' | 'STATIC' | 'SPF';
}

export interface NetworkDevice {
  id: string;
  type: DeviceType;
  name: string;
  x: number;
  y: number;
  interfaces: NetworkInterface[];
  defaultGateway?: string;
  arpTable: ArpEntry[];
  macTable?: MacTableEntry[];    // for switches
  routingTable?: RouteEntry[];  // for routers
  iconColor?: string;
}

export interface NetworkLink {
  id: string;
  sourceDeviceId: string;
  sourceInterfaceId: string;
  targetDeviceId: string;
  targetInterfaceId: string;
  bandwidthMbps: number;     // e.g. 100
  latencyMs: number;         // e.g. 15
  lossRate: number;          // 0 to 100 %
  status: 'up' | 'down';
  label?: string;
}

export type PacketType = 
  | 'ICMP_ECHO_REQ' 
  | 'ICMP_ECHO_REP' 
  | 'ARP_REQ' 
  | 'ARP_REP' 
  | 'HTTP_REQ' 
  | 'HTTP_RES';

export interface PacketPayload {
  message: string;
  seq?: number;
  dataSize?: number; // bytes
}

export interface NetworkPacket {
  id: string;
  type: PacketType;
  // L2 Ethernet Frame
  srcMac: string;
  dstMac: string; // "FF:FF:FF:FF:FF:FF" for broadcast
  // L3 IP Header
  srcIp: string;
  dstIp: string;
  ttl: number;
  protocol: 'ICMP' | 'ARP' | 'TCP';
  // L4 Payload
  payload: PacketPayload;
  // Animation & Transit state
  originDeviceId: string;
  destinationDeviceId: string;
  currentEdgeId?: string;
  edgeDirection?: 'sourceToTarget' | 'targetToSource';
  progress: number; // 0.0 to 1.0 along currentEdgeId
  speed: number;    // increment per tick based on link latency
  hopPath: string[]; // list of visited device IDs
  status: 'in-flight' | 'delivered' | 'dropped';
  dropReason?: string;
  color?: string;
  parentPacketId?: string; // e.g. ARP request that triggered echo
}

export interface SimulationLog {
  id: string;
  timestamp: number;
  simTimeFormatted: string;
  level: 'info' | 'success' | 'warning' | 'error';
  packetId?: string;
  packetType?: PacketType;
  deviceId?: string;
  action: string;
  details: string;
  layer: 'L2' | 'L3' | 'L4' | 'PHYSICAL';
}

export interface NetworkMetrics {
  totalSent: number;
  totalDelivered: number;
  totalDropped: number;
  avgLatencyMs: number;
  packetLossPercentage: number;
  throughputKbps: number;
  recentDeliveries: { time: number; latency: number }[];
  history: {
    timestamp: number;
    sent: number;
    delivered: number;
    dropped: number;
    lossRate: number;
    throughput: number;
  }[];
}

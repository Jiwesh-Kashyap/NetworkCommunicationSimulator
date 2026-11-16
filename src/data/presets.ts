import { NetworkDevice, NetworkLink } from '../types/network';
import { generateMac } from '../utils/ipUtils';

export interface PresetTopology {
  id: string;
  name: string;
  description: string;
  category: 'Basics' | 'Routing' | 'Advanced';
  devices: NetworkDevice[];
  links: NetworkLink[];
}

export const PRESETS: Record<string, PresetTopology> = {
  simpleLan: {
    id: 'simpleLan',
    name: '1. Simple LAN (Switch & ARP)',
    category: 'Basics',
    description: 'Demonstrates Layer 2 Ethernet switching, ARP request broadcast flooding, source MAC address learning, and CAM table population.',
    devices: [
      {
        id: 'pc-1',
        type: 'pc',
        name: 'PC-1',
        x: 120,
        y: 120,
        interfaces: [
          {
            id: 'eth0',
            name: 'eth0',
            ip: '192.168.1.10',
            subnetMask: '255.255.255.0',
            mac: '00:1A:2B:11:11:11',
            status: 'up',
          }
        ],
        defaultGateway: '192.168.1.1',
        arpTable: [],
      },
      {
        id: 'pc-2',
        type: 'pc',
        name: 'PC-2',
        x: 120,
        y: 360,
        interfaces: [
          {
            id: 'eth0',
            name: 'eth0',
            ip: '192.168.1.20',
            subnetMask: '255.255.255.0',
            mac: '00:1A:2B:22:22:22',
            status: 'up',
          }
        ],
        defaultGateway: '192.168.1.1',
        arpTable: [],
      },
      {
        id: 'switch-1',
        type: 'switch',
        name: 'Switch-1',
        x: 380,
        y: 240,
        interfaces: [
          { id: 'port1', name: 'Fa0/1', mac: '00:1A:2B:SW:01:01', status: 'up' },
          { id: 'port2', name: 'Fa0/2', mac: '00:1A:2B:SW:01:02', status: 'up' },
          { id: 'port3', name: 'Fa0/3', mac: '00:1A:2B:SW:01:03', status: 'up' },
          { id: 'port4', name: 'Fa0/4', mac: '00:1A:2B:SW:01:04', status: 'up' },
        ],
        arpTable: [],
        macTable: [],
      },
      {
        id: 'server-1',
        type: 'server',
        name: 'Web-Server',
        x: 640,
        y: 240,
        interfaces: [
          {
            id: 'eth0',
            name: 'eth0',
            ip: '192.168.1.100',
            subnetMask: '255.255.255.0',
            mac: '00:1A:2B:99:99:99',
            status: 'up',
          }
        ],
        defaultGateway: '192.168.1.1',
        arpTable: [],
      }
    ],
    links: [
      {
        id: 'link-pc1-sw1',
        sourceDeviceId: 'pc-1',
        sourceInterfaceId: 'eth0',
        targetDeviceId: 'switch-1',
        targetInterfaceId: 'port1',
        bandwidthMbps: 100,
        latencyMs: 10,
        lossRate: 0,
        status: 'up',
        label: '10ms',
      },
      {
        id: 'link-pc2-sw1',
        sourceDeviceId: 'pc-2',
        sourceInterfaceId: 'eth0',
        targetDeviceId: 'switch-1',
        targetInterfaceId: 'port2',
        bandwidthMbps: 100,
        latencyMs: 10,
        lossRate: 0,
        status: 'up',
        label: '10ms',
      },
      {
        id: 'link-srv1-sw1',
        sourceDeviceId: 'server-1',
        sourceInterfaceId: 'eth0',
        targetDeviceId: 'switch-1',
        targetInterfaceId: 'port3',
        bandwidthMbps: 1000,
        latencyMs: 5,
        lossRate: 0,
        status: 'up',
        label: '5ms',
      }
    ]
  },

  twoSubnets: {
    id: 'twoSubnets',
    name: '2. Two Subnets via Router (L3 Gateway)',
    category: 'Routing',
    description: 'Demonstrates packet forwarding across different IP subnets (192.168.1.0/24 and 192.168.2.0/24), default gateway configuration, and TTL decrement.',
    devices: [
      {
        id: 'pc-sub1',
        type: 'pc',
        name: 'PC-A (Subnet 1)',
        x: 80,
        y: 220,
        interfaces: [
          {
            id: 'eth0',
            name: 'eth0',
            ip: '192.168.1.10',
            subnetMask: '255.255.255.0',
            mac: '00:1A:2B:A1:A1:A1',
            status: 'up',
          }
        ],
        defaultGateway: '192.168.1.1',
        arpTable: [],
      },
      {
        id: 'sw-sub1',
        type: 'switch',
        name: 'Switch-A',
        x: 260,
        y: 220,
        interfaces: [
          { id: 'port1', name: 'Fa0/1', mac: generateMac('00:1A:2B'), status: 'up' },
          { id: 'port2', name: 'Fa0/2', mac: generateMac('00:1A:2B'), status: 'up' },
        ],
        arpTable: [],
        macTable: [],
      },
      {
        id: 'router-1',
        type: 'router',
        name: 'Gateway-Router',
        x: 480,
        y: 220,
        interfaces: [
          {
            id: 'g0_0',
            name: 'Gi0/0 (Subnet 1)',
            ip: '192.168.1.1',
            subnetMask: '255.255.255.0',
            mac: '00:1A:2B:R1:00:01',
            status: 'up',
          },
          {
            id: 'g0_1',
            name: 'Gi0/1 (Subnet 2)',
            ip: '192.168.2.1',
            subnetMask: '255.255.255.0',
            mac: '00:1A:2B:R1:00:02',
            status: 'up',
          }
        ],
        arpTable: [],
        routingTable: [],
      },
      {
        id: 'sw-sub2',
        type: 'switch',
        name: 'Switch-B',
        x: 700,
        y: 220,
        interfaces: [
          { id: 'port1', name: 'Fa0/1', mac: generateMac('00:1A:2B'), status: 'up' },
          { id: 'port2', name: 'Fa0/2', mac: generateMac('00:1A:2B'), status: 'up' },
        ],
        arpTable: [],
        macTable: [],
      },
      {
        id: 'pc-sub2',
        type: 'pc',
        name: 'PC-B (Subnet 2)',
        x: 880,
        y: 220,
        interfaces: [
          {
            id: 'eth0',
            name: 'eth0',
            ip: '192.168.2.20',
            subnetMask: '255.255.255.0',
            mac: '00:1A:2B:B2:B2:B2',
            status: 'up',
          }
        ],
        defaultGateway: '192.168.2.1',
        arpTable: [],
      }
    ],
    links: [
      {
        id: 'l1',
        sourceDeviceId: 'pc-sub1',
        sourceInterfaceId: 'eth0',
        targetDeviceId: 'sw-sub1',
        targetInterfaceId: 'port1',
        bandwidthMbps: 100,
        latencyMs: 10,
        lossRate: 0,
        status: 'up',
        label: '10ms',
      },
      {
        id: 'l2',
        sourceDeviceId: 'sw-sub1',
        sourceInterfaceId: 'port2',
        targetDeviceId: 'router-1',
        targetInterfaceId: 'g0_0',
        bandwidthMbps: 1000,
        latencyMs: 5,
        lossRate: 0,
        status: 'up',
        label: '5ms',
      },
      {
        id: 'l3',
        sourceDeviceId: 'router-1',
        sourceInterfaceId: 'g0_1',
        targetDeviceId: 'sw-sub2',
        targetInterfaceId: 'port1',
        bandwidthMbps: 1000,
        latencyMs: 5,
        lossRate: 0,
        status: 'up',
        label: '5ms',
      },
      {
        id: 'l4',
        sourceDeviceId: 'sw-sub2',
        sourceInterfaceId: 'port2',
        targetDeviceId: 'pc-sub2',
        targetInterfaceId: 'eth0',
        bandwidthMbps: 100,
        latencyMs: 10,
        lossRate: 0,
        status: 'up',
        label: '10ms',
      }
    ]
  },

  dijkstraMesh: {
    id: 'dijkstraMesh',
    name: '3. Dijkstra SPF & Redundant Mesh (Failover)',
    category: 'Advanced',
    description: 'Demonstrates dynamic shortest path computation (Dijkstra) between routers. Try severing the primary link to see instant rerouting along the backup path!',
    devices: [
      {
        id: 'pc-source',
        type: 'pc',
        name: 'Client-Host',
        x: 80,
        y: 240,
        interfaces: [
          {
            id: 'eth0',
            name: 'eth0',
            ip: '10.0.1.10',
            subnetMask: '255.255.255.0',
            mac: '00:1A:2B:C1:C1:C1',
            status: 'up',
          }
        ],
        defaultGateway: '10.0.1.1',
        arpTable: [],
      },
      {
        id: 'r-west',
        type: 'router',
        name: 'Router-West',
        x: 280,
        y: 240,
        interfaces: [
          { id: 'eth_client', name: 'Gi0/0', ip: '10.0.1.1', subnetMask: '255.255.255.0', mac: generateMac('00:1A:2B'), status: 'up' },
          { id: 'eth_north', name: 'Gi0/1', ip: '172.16.1.1', subnetMask: '255.255.255.0', mac: generateMac('00:1A:2B'), status: 'up' },
          { id: 'eth_south', name: 'Gi0/2', ip: '172.16.2.1', subnetMask: '255.255.255.0', mac: generateMac('00:1A:2B'), status: 'up' },
        ],
        arpTable: [],
        routingTable: [],
      },
      {
        id: 'r-north',
        type: 'router',
        name: 'Router-North (Fast 10ms)',
        x: 520,
        y: 110,
        interfaces: [
          { id: 'eth_west', name: 'Gi0/0', ip: '172.16.1.2', subnetMask: '255.255.255.0', mac: generateMac('00:1A:2B'), status: 'up' },
          { id: 'eth_east', name: 'Gi0/1', ip: '172.16.3.1', subnetMask: '255.255.255.0', mac: generateMac('00:1A:2B'), status: 'up' },
        ],
        arpTable: [],
        routingTable: [],
      },
      {
        id: 'r-south',
        type: 'router',
        name: 'Router-South (Backup 45ms)',
        x: 520,
        y: 370,
        interfaces: [
          { id: 'eth_west', name: 'Gi0/0', ip: '172.16.2.2', subnetMask: '255.255.255.0', mac: generateMac('00:1A:2B'), status: 'up' },
          { id: 'eth_east', name: 'Gi0/1', ip: '172.16.4.1', subnetMask: '255.255.255.0', mac: generateMac('00:1A:2B'), status: 'up' },
        ],
        arpTable: [],
        routingTable: [],
      },
      {
        id: 'r-east',
        type: 'router',
        name: 'Router-East',
        x: 760,
        y: 240,
        interfaces: [
          { id: 'eth_north', name: 'Gi0/0', ip: '172.16.3.2', subnetMask: '255.255.255.0', mac: generateMac('00:1A:2B'), status: 'up' },
          { id: 'eth_south', name: 'Gi0/1', ip: '172.16.4.2', subnetMask: '255.255.255.0', mac: generateMac('00:1A:2B'), status: 'up' },
          { id: 'eth_server', name: 'Gi0/2', ip: '10.0.2.1', subnetMask: '255.255.255.0', mac: generateMac('00:1A:2B'), status: 'up' },
        ],
        arpTable: [],
        routingTable: [],
      },
      {
        id: 'server-target',
        type: 'server',
        name: 'Data-Center Server',
        x: 960,
        y: 240,
        interfaces: [
          {
            id: 'eth0',
            name: 'eth0',
            ip: '10.0.2.50',
            subnetMask: '255.255.255.0',
            mac: '00:1A:2B:D2:D2:D2',
            status: 'up',
          }
        ],
        defaultGateway: '10.0.2.1',
        arpTable: [],
      }
    ],
    links: [
      {
        id: 'm-client-west',
        sourceDeviceId: 'pc-source',
        sourceInterfaceId: 'eth0',
        targetDeviceId: 'r-west',
        targetInterfaceId: 'eth_client',
        bandwidthMbps: 100,
        latencyMs: 5,
        lossRate: 0,
        status: 'up',
        label: '5ms',
      },
      {
        id: 'm-west-north',
        sourceDeviceId: 'r-west',
        sourceInterfaceId: 'eth_north',
        targetDeviceId: 'r-north',
        targetInterfaceId: 'eth_west',
        bandwidthMbps: 1000,
        latencyMs: 10,
        lossRate: 0,
        status: 'up',
        label: 'Primary (10ms)',
      },
      {
        id: 'm-north-east',
        sourceDeviceId: 'r-north',
        sourceInterfaceId: 'eth_east',
        targetDeviceId: 'r-east',
        targetInterfaceId: 'eth_north',
        bandwidthMbps: 1000,
        latencyMs: 10,
        lossRate: 0,
        status: 'up',
        label: 'Primary (10ms)',
      },
      {
        id: 'm-west-south',
        sourceDeviceId: 'r-west',
        sourceInterfaceId: 'eth_south',
        targetDeviceId: 'r-south',
        targetInterfaceId: 'eth_west',
        bandwidthMbps: 100,
        latencyMs: 45,
        lossRate: 0,
        status: 'up',
        label: 'Backup (45ms)',
      },
      {
        id: 'm-south-east',
        sourceDeviceId: 'r-south',
        sourceInterfaceId: 'eth_east',
        targetDeviceId: 'r-east',
        targetInterfaceId: 'eth_south',
        bandwidthMbps: 100,
        latencyMs: 45,
        lossRate: 0,
        status: 'up',
        label: 'Backup (45ms)',
      },
      {
        id: 'm-east-server',
        sourceDeviceId: 'r-east',
        sourceInterfaceId: 'eth_server',
        targetDeviceId: 'server-target',
        targetInterfaceId: 'eth0',
        bandwidthMbps: 1000,
        latencyMs: 5,
        lossRate: 0,
        status: 'up',
        label: '5ms',
      }
    ]
  },

  impairmentLab: {
    id: 'impairmentLab',
    name: '4. Network Congestion & Impairment Lab',
    category: 'Advanced',
    description: 'Explore network performance under extreme conditions: packet loss (25%), latency spikes (80ms), and bandwidth bottlenecks.',
    devices: [
      {
        id: 'pc-lab-1',
        type: 'pc',
        name: 'Workstation-1',
        x: 140,
        y: 160,
        interfaces: [
          {
            id: 'eth0',
            name: 'eth0',
            ip: '192.168.10.5',
            subnetMask: '255.255.255.0',
            mac: '00:1A:2B:55:55:55',
            status: 'up',
          }
        ],
        defaultGateway: '192.168.10.1',
        arpTable: [],
      },
      {
        id: 'r-lab-1',
        type: 'router',
        name: 'Branch-Router',
        x: 380,
        y: 240,
        interfaces: [
          { id: 'lan', name: 'Gi0/0', ip: '192.168.10.1', subnetMask: '255.255.255.0', mac: generateMac('00:1A:2B'), status: 'up' },
          { id: 'wan', name: 'Serial0/1', ip: '10.50.0.1', subnetMask: '255.255.255.0', mac: generateMac('00:1A:2B'), status: 'up' },
        ],
        arpTable: [],
        routingTable: [],
      },
      {
        id: 'r-lab-2',
        type: 'router',
        name: 'HQ-Router',
        x: 680,
        y: 240,
        interfaces: [
          { id: 'wan', name: 'Serial0/1', ip: '10.50.0.2', subnetMask: '255.255.255.0', mac: generateMac('00:1A:2B'), status: 'up' },
          { id: 'lan', name: 'Gi0/0', ip: '192.168.20.1', subnetMask: '255.255.255.0', mac: generateMac('00:1A:2B'), status: 'up' },
        ],
        arpTable: [],
        routingTable: [],
      },
      {
        id: 'srv-lab',
        type: 'server',
        name: 'Cloud-App',
        x: 920,
        y: 240,
        interfaces: [
          {
            id: 'eth0',
            name: 'eth0',
            ip: '192.168.20.50',
            subnetMask: '255.255.255.0',
            mac: '00:1A:2B:77:77:77',
            status: 'up',
          }
        ],
        defaultGateway: '192.168.20.1',
        arpTable: [],
      }
    ],
    links: [
      {
        id: 'lab-lan1',
        sourceDeviceId: 'pc-lab-1',
        sourceInterfaceId: 'eth0',
        targetDeviceId: 'r-lab-1',
        targetInterfaceId: 'lan',
        bandwidthMbps: 1000,
        latencyMs: 2,
        lossRate: 0,
        status: 'up',
        label: 'Fast LAN',
      },
      {
        id: 'lab-wan',
        sourceDeviceId: 'r-lab-1',
        sourceInterfaceId: 'wan',
        targetDeviceId: 'r-lab-2',
        targetInterfaceId: 'wan',
        bandwidthMbps: 10,
        latencyMs: 75,
        lossRate: 25, // 25% packet loss
        status: 'up',
        label: 'WAN: 75ms Latency, 25% Loss',
      },
      {
        id: 'lab-lan2',
        sourceDeviceId: 'r-lab-2',
        sourceInterfaceId: 'lan',
        targetDeviceId: 'srv-lab',
        targetInterfaceId: 'eth0',
        bandwidthMbps: 1000,
        latencyMs: 2,
        lossRate: 0,
        status: 'up',
        label: 'Fast LAN',
      }
    ]
  }
};

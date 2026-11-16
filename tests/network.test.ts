import { test, expect, describe } from 'vitest';
import { isSameSubnet, ipToInt, intToIp, isValidIpv4, getNetworkAddress, cidrToMask, maskToCidr } from '../src/utils/ipUtils';
import { computeDijkstra } from '../src/engine/dijkstra';
import { PRESETS } from '../src/data/presets';
import { buildDynamicRoutingTables, lookupRoute } from '../src/engine/routingTable';
import { initiateTransmission, stepSimulation } from '../src/engine/simulator';
import { updateMacTable, lookupMacPort } from '../src/engine/macTable';
import { NetworkDevice, NetworkLink, NetworkPacket } from '../src/types/network';

describe('Data Communication & Network Protocols', () => {
  test('IP and Subnet calculations and conversions', () => {
    expect(isValidIpv4('192.168.1.1')).toBe(true);
    expect(isValidIpv4('256.0.0.1')).toBe(false);
    expect(isValidIpv4('192.168.1')).toBe(false);

    expect(isSameSubnet('192.168.1.10', '192.168.1.20', '255.255.255.0')).toBe(true);
    expect(isSameSubnet('192.168.1.10', '192.168.2.10', '255.255.255.0')).toBe(false);
    expect(getNetworkAddress('192.168.1.55', '255.255.255.0')).toBe('192.168.1.0');

    expect(cidrToMask(24)).toBe('255.255.255.0');
    expect(cidrToMask(16)).toBe('255.255.0.0');
    expect(maskToCidr('255.255.255.0')).toBe(24);
  });

  test('Dijkstra algorithm selects optimal shortest path', () => {
    const meshPreset = PRESETS.dijkstraMesh;
    const result = computeDijkstra(meshPreset.devices, meshPreset.links, 'pc-source', 'server-target');

    // Should select the fast primary path via Router-North (10ms+10ms) rather than South (45ms+45ms)
    expect(result.path.includes('r-north')).toBe(true);
    expect(result.path.includes('r-south')).toBe(false);
    expect(result.path[0]).toBe('pc-source');
    expect(result.path[result.path.length - 1]).toBe('server-target');
  });

  test('Dijkstra algorithm dynamically reroutes when primary link fails', () => {
    const meshPreset = PRESETS.dijkstraMesh;
    // Sever the primary link (r-west <-> r-north)
    const modifiedLinks = meshPreset.links.map(l => 
      l.id === 'm-west-north' ? { ...l, status: 'down' as const } : l
    );

    const result = computeDijkstra(meshPreset.devices, modifiedLinks, 'pc-source', 'server-target');

    // Now it must take the backup path through Router-South!
    expect(result.path.includes('r-south')).toBe(true);
    expect(result.path.includes('r-north')).toBe(false);
  });

  test('Dynamic routing table generation across routers', () => {
    const twoSubnets = PRESETS.twoSubnets;
    const routeMap = buildDynamicRoutingTables(twoSubnets.devices, twoSubnets.links);
    const routerRoutes = routeMap.get('router-1');

    expect(routerRoutes).toBeDefined();
    expect(routerRoutes!.length).toBeGreaterThanOrEqual(2);
    // Router must have direct routes to both 192.168.1.0 and 192.168.2.0
    const sub1 = routerRoutes!.find(r => r.destinationSubnet === '192.168.1.0');
    const sub2 = routerRoutes!.find(r => r.destinationSubnet === '192.168.2.0');
    expect(sub1).toBeDefined();
    expect(sub2).toBeDefined();
  });

  test('Longest Prefix Match (LPM) route lookup', () => {
    const dummyRouter: NetworkDevice = {
      id: 'test-router',
      type: 'router',
      name: 'R-Test',
      x: 0,
      y: 0,
      interfaces: [
        { id: 'eth0', name: 'eth0', ip: '10.0.0.1', subnetMask: '255.0.0.0', mac: '00:1A:2B:00:00:01', status: 'up' },
        { id: 'eth1', name: 'eth1', ip: '10.1.2.1', subnetMask: '255.255.255.0', mac: '00:1A:2B:00:00:02', status: 'up' },
      ],
      arpTable: [],
      routingTable: [
        { id: 'r1', destinationSubnet: '10.0.0.0', mask: '255.0.0.0', nextHop: 'DIRECT', interfaceId: 'eth0', metric: 0, type: 'DIRECT' },
        { id: 'r2', destinationSubnet: '10.1.2.0', mask: '255.255.255.0', nextHop: 'DIRECT', interfaceId: 'eth1', metric: 0, type: 'DIRECT' },
      ]
    };

    // 10.1.2.55 matches both /8 and /24; LPM must pick /24
    const match = lookupRoute(dummyRouter, '10.1.2.55');
    expect(match).toBeDefined();
    expect(match?.destinationSubnet).toBe('10.1.2.0');
    expect(match?.interfaceId).toBe('eth1');
  });

  test('Switch CAM table learning and selective forwarding', () => {
    const sw: NetworkDevice = {
      id: 'sw-test',
      type: 'switch',
      name: 'SW-Test',
      x: 0,
      y: 0,
      interfaces: [
        { id: 'port1', name: 'Fa0/1', mac: '00:00:00:00:00:01', status: 'up' },
        { id: 'port2', name: 'Fa0/2', mac: '00:00:00:00:00:02', status: 'up' },
      ],
      arpTable: [],
      macTable: [],
    };

    // Before learning, unknown MAC returns undefined
    expect(lookupMacPort(sw, 'AA:BB:CC:DD:EE:FF')).toBeUndefined();

    // Ingress frame on port1 learns MAC
    const { updatedTable, learned } = updateMacTable(sw, 'AA:BB:CC:DD:EE:FF', 'port1');
    expect(learned).toBe(true);
    sw.macTable = updatedTable;

    // After learning, port is resolved
    expect(lookupMacPort(sw, 'AA:BB:CC:DD:EE:FF')).toBe('port1');
  });

  test('Simulation step handles ARP cache miss and resolution', () => {
    const simpleLan = PRESETS.simpleLan;
    // Initiate ping from PC-1 to Web-Server
    const { packets } = initiateTransmission(
      simpleLan.devices,
      simpleLan.links,
      'pc-1',
      'server-1',
      'ICMP_ECHO_REQ',
      'Test Ping'
    );

    // Because ARP is not cached initially, an ARP Request must be generated
    expect(packets.length).toBe(1);
    expect(packets[0].type).toBe('ARP_REQ');
    expect(packets[0].dstMac).toBe('FF:FF:FF:FF:FF:FF');

    // Step simulation until packet arrives at Switch-1
    let currentPackets = packets;
    let devState = simpleLan.devices;
    let linkState = simpleLan.links;

    for (let i = 0; i < 30; i++) {
      const stepRes = stepSimulation(devState, linkState, currentPackets, 1.0);
      currentPackets = stepRes.packets;
      devState = stepRes.devices;
      linkState = stepRes.links;
      if (currentPackets.length === 0) break;
    }

    // Switch must have learned PC-1 MAC address in its CAM table
    const sw = devState.find(d => d.id === 'switch-1');
    expect(sw?.macTable && sw.macTable.length > 0).toBe(true);
    expect(sw!.macTable![0].mac).toBe('00:1A:2B:11:11:11');
  });

  test('Simulated packet loss drops packets according to link lossRate', () => {
    const impairedPreset = PRESETS.impairmentLab;
    const wanLink = impairedPreset.links.find(l => l.id === 'lab-wan');
    expect(wanLink?.lossRate).toBe(25);

    // Create a 100% loss link to verify guaranteed drop
    const lossLinks: NetworkLink[] = [
      {
        id: 'lossy-link',
        sourceDeviceId: 'dev-a',
        sourceInterfaceId: 'eth0',
        targetDeviceId: 'dev-b',
        targetInterfaceId: 'eth0',
        bandwidthMbps: 10,
        latencyMs: 10,
        lossRate: 100, // 100% loss
        status: 'up',
      }
    ];

    const lossDevices: NetworkDevice[] = [
      {
        id: 'dev-a',
        type: 'pc',
        name: 'Dev-A',
        x: 0,
        y: 0,
        interfaces: [{ id: 'eth0', name: 'eth0', ip: '10.0.0.1', subnetMask: '255.255.255.0', mac: '00:00:00:00:00:01', status: 'up' }],
        arpTable: [{ ip: '10.0.0.2', mac: '00:00:00:00:00:02', interfaceId: 'eth0', timestamp: Date.now() }],
      },
      {
        id: 'dev-b',
        type: 'pc',
        name: 'Dev-B',
        x: 100,
        y: 0,
        interfaces: [{ id: 'eth0', name: 'eth0', ip: '10.0.0.2', subnetMask: '255.255.255.0', mac: '00:00:00:00:00:02', status: 'up' }],
        arpTable: [],
      }
    ];

    const { packets } = initiateTransmission(lossDevices, lossLinks, 'dev-a', 'dev-b', 'ICMP_ECHO_REQ');
    const stepRes = stepSimulation(lossDevices, lossLinks, packets, 1.0);
    expect(stepRes.metricsUpdates.droppedDelta).toBe(1);
    expect(stepRes.packets.length).toBe(0);
  });
});

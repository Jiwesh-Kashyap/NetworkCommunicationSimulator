import { NetworkDevice, NetworkLink, RouteEntry } from '../types/network';
import { ipToInt, isSameSubnet, getNetworkAddress, maskToCidr } from '../utils/ipUtils';
import { computeDijkstra } from './dijkstra';

/**
 * Finds the best route in a router's table using Longest Prefix Match (LPM).
 */
export function lookupRoute(
  router: NetworkDevice,
  destinationIp: string
): RouteEntry | null {
  if (!router.routingTable || router.routingTable.length === 0) {
    return null;
  }

  const destInt = ipToInt(destinationIp);
  let bestRoute: RouteEntry | null = null;
  let bestPrefixLength = -1;
  let lowestMetric = Infinity;

  for (const route of router.routingTable) {
    const maskInt = ipToInt(route.mask);
    const subnetInt = ipToInt(route.destinationSubnet);

    // Check if destination matches this subnet
    if ((destInt & maskInt) === subnetInt) {
      const prefixLength = maskToCidr(route.mask);
      if (
        prefixLength > bestPrefixLength ||
        (prefixLength === bestPrefixLength && route.metric < lowestMetric)
      ) {
        bestPrefixLength = prefixLength;
        lowestMetric = route.metric;
        bestRoute = route;
      }
    }
  }

  return bestRoute;
}

/**
 * Automatically computes and populates routing tables for all routers in the topology.
 * Generates direct connected routes + Dijkstra SPF shortest-path routes to remote subnets.
 */
export function buildDynamicRoutingTables(
  devices: NetworkDevice[],
  links: NetworkLink[]
): Map<string, RouteEntry[]> {
  const result = new Map<string, RouteEntry[]>();
  const routers = devices.filter(d => d.type === 'router');

  // Collect all known IP subnets across all devices
  const allSubnets = new Map<string, { subnet: string; mask: string; hostDeviceId: string; routerInterfaceId?: string }>();

  for (const device of devices) {
    for (const iface of device.interfaces) {
      if (iface.ip && iface.subnetMask && iface.status === 'up') {
        const netAddr = getNetworkAddress(iface.ip, iface.subnetMask);
        const key = `${netAddr}/${iface.subnetMask}`;
        if (!allSubnets.has(key)) {
          allSubnets.set(key, {
            subnet: netAddr,
            mask: iface.subnetMask,
            hostDeviceId: device.id,
            routerInterfaceId: device.type === 'router' ? iface.id : undefined,
          });
        }
      }
    }
  }

  for (const router of routers) {
    const routes: RouteEntry[] = [];
    const directSubnets = new Set<string>();

    // 1. Direct Connected Routes from active interfaces
    for (const iface of router.interfaces) {
      if (iface.ip && iface.subnetMask && iface.status === 'up') {
        const netAddr = getNetworkAddress(iface.ip, iface.subnetMask);
        directSubnets.add(`${netAddr}/${iface.subnetMask}`);
        routes.push({
          id: `route-dir-${router.id}-${iface.id}`,
          destinationSubnet: netAddr,
          mask: iface.subnetMask,
          nextHop: 'DIRECT',
          interfaceId: iface.id,
          metric: 0,
          type: 'DIRECT',
        });
      }
    }

    // 2. Shortest Path First (Dijkstra) to all other routers / remote subnets
    const dijkstra = computeDijkstra(devices, links, router.id, undefined, 'latency');

    for (const [key, subnetInfo] of allSubnets.entries()) {
      if (directSubnets.has(key)) continue; // Already directly connected

      const targetDeviceId = subnetInfo.hostDeviceId;
      // If target device is reachable
      if (dijkstra.distances[targetDeviceId] !== Infinity && dijkstra.distances[targetDeviceId] > 0) {
        // Reconstruct the first hop from `router` towards `targetDeviceId`
        let curr: string | null = targetDeviceId;
        let firstHopDevice: string | null = null;
        let egressEdgeId: string | null = null;

        while (curr) {
          const prev: { deviceId: string; edgeId: string } | null = dijkstra.previous[curr];
          if (!prev) break;
          if (prev.deviceId === router.id) {
            firstHopDevice = curr;
            egressEdgeId = prev.edgeId;
            break;
          }
          curr = prev.deviceId;
        }

        if (firstHopDevice && egressEdgeId) {
          // Find which router interface this link is attached to
          const link = links.find(l => l.id === egressEdgeId);
          if (link) {
            const ifaceId = link.sourceDeviceId === router.id ? link.sourceInterfaceId : link.targetInterfaceId;
            
            // Find IP of next-hop device
            const nextHopDevice = devices.find(d => d.id === firstHopDevice);
            let nextHopIp = 'NEXT-HOP';
            if (nextHopDevice) {
              const nextHopIfaceId = link.sourceDeviceId === router.id ? link.targetInterfaceId : link.sourceInterfaceId;
              const nextHopIface = nextHopDevice.interfaces.find(i => i.id === nextHopIfaceId);
              if (nextHopIface?.ip) nextHopIp = nextHopIface.ip;
            }

            routes.push({
              id: `route-spf-${router.id}-${subnetInfo.subnet}`,
              destinationSubnet: subnetInfo.subnet,
              mask: subnetInfo.mask,
              nextHop: nextHopIp,
              interfaceId: ifaceId,
              metric: Math.round(dijkstra.distances[targetDeviceId]),
              type: 'SPF',
            });
          }
        }
      }
    }

    // 3. Optional Default Route if configured
    if (router.defaultGateway) {
      routes.push({
        id: `route-default-${router.id}`,
        destinationSubnet: '0.0.0.0',
        mask: '0.0.0.0',
        nextHop: router.defaultGateway,
        interfaceId: router.interfaces[0]?.id || 'eth0',
        metric: 99,
        type: 'STATIC',
      });
    }

    result.set(router.id, routes);
  }

  return result;
}

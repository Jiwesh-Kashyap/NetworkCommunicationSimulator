import { NetworkDevice, NetworkLink } from '../types/network';

export interface DijkstraResult {
  path: string[];             // Array of device IDs from start to end
  edgePath: string[];         // Array of link IDs traversed
  totalCost: number;          // Total metric (e.g. cumulative latency)
  distances: Record<string, number>;
  previous: Record<string, { deviceId: string; edgeId: string } | null>;
}

/**
 * Computes shortest path between devices using Dijkstra's algorithm.
 * Accounts for link status (up/down) and uses link latency/cost as edge weight.
 */
export function computeDijkstra(
  devices: NetworkDevice[],
  links: NetworkLink[],
  startDeviceId: string,
  endDeviceId?: string,
  metricType: 'latency' | 'hops' = 'latency'
): DijkstraResult {
  const distances: Record<string, number> = {};
  const previous: Record<string, { deviceId: string; edgeId: string } | null> = {};
  const unvisited = new Set<string>();

  // Initialize
  for (const device of devices) {
    distances[device.id] = device.id === startDeviceId ? 0 : Infinity;
    previous[device.id] = null;
    unvisited.add(device.id);
  }

  // Build adjacency list for UP links only
  const adjacency: Record<string, { neighborId: string; edgeId: string; weight: number }[]> = {};
  for (const device of devices) {
    adjacency[device.id] = [];
  }

  for (const link of links) {
    if (link.status !== 'up') continue; // Skip broken or down links!

    const weight = metricType === 'latency' ? Math.max(1, link.latencyMs) : 1;

    adjacency[link.sourceDeviceId]?.push({
      neighborId: link.targetDeviceId,
      edgeId: link.id,
      weight,
    });

    adjacency[link.targetDeviceId]?.push({
      neighborId: link.sourceDeviceId,
      edgeId: link.id,
      weight,
    });
  }

  while (unvisited.size > 0) {
    // Find node with smallest distance
    let currentId: string | null = null;
    let smallestDist = Infinity;

    for (const id of unvisited) {
      if (distances[id] < smallestDist) {
        smallestDist = distances[id];
        currentId = id;
      }
    }

    if (!currentId || smallestDist === Infinity) {
      // Remaining nodes are unreachable
      break;
    }

    if (endDeviceId && currentId === endDeviceId) {
      // Reached destination
      break;
    }

    unvisited.delete(currentId);

    const neighbors = adjacency[currentId] || [];
    for (const { neighborId, edgeId, weight } of neighbors) {
      if (!unvisited.has(neighborId)) continue;

      const alt = distances[currentId] + weight;
      if (alt < distances[neighborId]) {
        distances[neighborId] = alt;
        previous[neighborId] = { deviceId: currentId, edgeId };
      }
    }
  }

  // Reconstruct path if endDeviceId was specified
  const path: string[] = [];
  const edgePath: string[] = [];

  if (endDeviceId && distances[endDeviceId] !== Infinity) {
    let curr: string | null = endDeviceId;
    while (curr) {
      path.unshift(curr);
      const prev: { deviceId: string; edgeId: string } | null = previous[curr];
      if (prev) {
        edgePath.unshift(prev.edgeId);
        curr = prev.deviceId;
      } else {
        break;
      }
    }
  }

  return {
    path,
    edgePath,
    totalCost: endDeviceId ? distances[endDeviceId] : 0,
    distances,
    previous,
  };
}

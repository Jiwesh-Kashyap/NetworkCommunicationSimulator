import { 
  NetworkDevice, 
  NetworkLink, 
  NetworkPacket, 
  SimulationLog, 
  NetworkMetrics,
  NetworkInterface,
  PacketType
} from '../types/network';
import { isSameSubnet } from '../utils/ipUtils';
import { lookupArp, updateArpCache, createArpRequestPacket, createArpReplyPacket, BROADCAST_MAC } from './arp';
import { updateMacTable, lookupMacPort } from './macTable';
import { lookupRoute } from './routingTable';

export interface SimulationStepResult {
  devices: NetworkDevice[];
  links: NetworkLink[];
  packets: NetworkPacket[];
  newLogs: SimulationLog[];
  metricsUpdates: {
    sentDelta: number;
    deliveredDelta: number;
    droppedDelta: number;
    latencySamples: number[];
  };
}

let logCounter = 0;
function createLog(
  action: string,
  details: string,
  level: SimulationLog['level'] = 'info',
  layer: SimulationLog['layer'] = 'L3',
  packet?: NetworkPacket,
  deviceId?: string
): SimulationLog {
  logCounter++;
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
  
  return {
    id: `log-${Date.now()}-${logCounter}`,
    timestamp: Date.now(),
    simTimeFormatted: timeStr,
    action,
    details,
    level,
    layer,
    packetId: packet?.id,
    packetType: packet?.type,
    deviceId,
  };
}

/**
 * Creates and initializes an outgoing packet from a source device
 */
export function initiateTransmission(
  devices: NetworkDevice[],
  links: NetworkLink[],
  srcDeviceId: string,
  dstDeviceId: string,
  packetType: PacketType = 'ICMP_ECHO_REQ',
  messagePayload: string = 'Echo ping request'
): { packets: NetworkPacket[]; newLogs: SimulationLog[]; updatedDevices: NetworkDevice[] } {
  const srcDevice = devices.find(d => d.id === srcDeviceId);
  const dstDevice = devices.find(d => d.id === dstDeviceId);
  const newLogs: SimulationLog[] = [];
  let updatedDevices = [...devices];

  if (!srcDevice || !dstDevice) {
    return { packets: [], newLogs: [createLog('Transmission Error', 'Source or destination device not found', 'error', 'L3')], updatedDevices };
  }

  const srcIface = srcDevice.interfaces[0];
  const dstIface = dstDevice.interfaces[0];

  if (!srcIface?.ip || !dstIface?.ip) {
    return {
      packets: [],
      newLogs: [createLog('Addressing Error', 'Both source and destination must have IP addresses assigned', 'error', 'L3', undefined, srcDevice.id)],
      updatedDevices
    };
  }

  // Find link connected to source device
  const egressLink = links.find(l => 
    (l.sourceDeviceId === srcDevice.id && l.sourceInterfaceId === srcIface.id) ||
    (l.targetDeviceId === srcDevice.id && l.targetInterfaceId === srcIface.id)
  );

  if (!egressLink || egressLink.status !== 'up') {
    return {
      packets: [],
      newLogs: [createLog('Physical Link Error', `Device ${srcDevice.name} has no connected or active link on ${srcIface.name}`, 'error', 'PHYSICAL', undefined, srcDevice.id)],
      updatedDevices
    };
  }

  const isLocal = isSameSubnet(srcIface.ip, dstIface.ip, srcIface.subnetMask || '255.255.255.0');
  const targetLookupIp = isLocal ? dstIface.ip : srcDevice.defaultGateway;

  if (!isLocal && !srcDevice.defaultGateway) {
    return {
      packets: [],
      newLogs: [createLog('Routing Error', `Destination ${dstIface.ip} is on a remote subnet, but ${srcDevice.name} has no default gateway configured!`, 'error', 'L3', undefined, srcDevice.id)],
      updatedDevices
    };
  }

  if (!targetLookupIp) {
    return { packets: [], newLogs: [], updatedDevices };
  }

  // Check ARP table
  const arpEntry = lookupArp(srcDevice, targetLookupIp);
  const packets: NetworkPacket[] = [];

  const mainPacket: NetworkPacket = {
    id: `pkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: packetType,
    srcMac: srcIface.mac,
    dstMac: arpEntry ? arpEntry.mac : BROADCAST_MAC,
    srcIp: srcIface.ip,
    dstIp: dstIface.ip,
    ttl: 64,
    protocol: packetType.startsWith('ICMP') ? 'ICMP' : packetType.startsWith('ARP') ? 'ARP' : 'TCP',
    payload: {
      message: messagePayload,
      seq: 1,
      dataSize: 64,
    },
    originDeviceId: srcDevice.id,
    destinationDeviceId: dstDevice.id,
    currentEdgeId: egressLink.id,
    edgeDirection: egressLink.sourceDeviceId === srcDevice.id ? 'sourceToTarget' : 'targetToSource',
    progress: 0,
    speed: Math.max(0.02, Math.min(0.08, 10 / (egressLink.latencyMs || 20))),
    hopPath: [srcDevice.id],
    status: 'in-flight',
    color: '#38bdf8', // sky blue
  };

  if (arpEntry) {
    // ARP is cached; send packet immediately
    packets.push(mainPacket);
    newLogs.push(createLog(
      'Packet Transmitted',
      `${srcDevice.name} sending ${packetType} to ${dstIface.ip} (Resolved via ARP cache: ${arpEntry.mac})`,
      'info',
      'L3',
      mainPacket,
      srcDevice.id
    ));
  } else {
    // Need ARP Resolution first!
    const arpReq = createArpRequestPacket(srcDevice, srcIface, targetLookupIp);
    arpReq.currentEdgeId = egressLink.id;
    arpReq.edgeDirection = egressLink.sourceDeviceId === srcDevice.id ? 'sourceToTarget' : 'targetToSource';
    arpReq.speed = Math.max(0.02, Math.min(0.08, 10 / (egressLink.latencyMs || 20)));

    packets.push(arpReq);

    newLogs.push(createLog(
      'ARP Cache Miss',
      `${srcDevice.name} needs MAC address for ${targetLookupIp}. Broadcasting ARP Request (Who has ${targetLookupIp}?)`,
      'warning',
      'L2',
      arpReq,
      srcDevice.id
    ));
  }

  return { packets, newLogs, updatedDevices };
}

/**
 * Step the simulation tick by dt
 */
export function stepSimulation(
  devices: NetworkDevice[],
  links: NetworkLink[],
  activePackets: NetworkPacket[],
  speedMultiplier: number = 1.0
): SimulationStepResult {
  let updatedDevices = [...devices];
  let updatedLinks = [...links];
  const survivingPackets: NetworkPacket[] = [];
  const generatedPackets: NetworkPacket[] = [];
  const newLogs: SimulationLog[] = [];
  const metricsUpdates = {
    sentDelta: 0,
    deliveredDelta: 0,
    droppedDelta: 0,
    latencySamples: [] as number[],
  };

  for (const packet of activePackets) {
    if (packet.status !== 'in-flight') continue;

    const link = updatedLinks.find(l => l.id === packet.currentEdgeId);

    // 1. Check Link Health
    if (!link || link.status !== 'up') {
      packet.status = 'dropped';
      packet.dropReason = 'Physical link disconnected or broken';
      metricsUpdates.droppedDelta++;
      newLogs.push(createLog('Packet Dropped', `Link severed in transit: ${packet.dropReason}`, 'error', 'PHYSICAL', packet));
      continue;
    }

    // 2. Check Simulated Link Impairments (Loss Rate)
    if (packet.progress === 0 && link.lossRate > 0) {
      const dropRoll = Math.random() * 100;
      if (dropRoll < link.lossRate) {
        packet.status = 'dropped';
        packet.dropReason = `Link loss rate dropped packet (${link.lossRate}% configured loss)`;
        metricsUpdates.droppedDelta++;
        newLogs.push(createLog('Simulated Loss', `Packet dropped due to link packet loss rate (${link.lossRate}%)`, 'warning', 'PHYSICAL', packet));
        continue;
      }
    }

    // 3. Move packet along edge
    const progressInc = packet.speed * speedMultiplier;
    packet.progress += progressInc;

    if (packet.progress < 1.0) {
      // Still in transit along the link
      survivingPackets.push(packet);
      continue;
    }

    // 4. Arrived at target end of the link
    const arrivalDeviceId = packet.edgeDirection === 'sourceToTarget' ? link.targetDeviceId : link.sourceDeviceId;
    const arrivalInterfaceId = packet.edgeDirection === 'sourceToTarget' ? link.targetInterfaceId : link.sourceInterfaceId;
    const arrivalDevice = updatedDevices.find(d => d.id === arrivalDeviceId);

    if (!arrivalDevice) {
      packet.status = 'dropped';
      packet.dropReason = 'Destination node not found';
      metricsUpdates.droppedDelta++;
      continue;
    }

    // Record hop
    packet.hopPath.push(arrivalDevice.id);

    // ==========================================
    // NODE PROCESSING LOGIC
    // ==========================================

    // CASE A: SWITCH (Layer 2 Forwarding & MAC Learning)
    if (arrivalDevice.type === 'switch') {
      // 1. MAC Learning
      const { updatedTable, learned } = updateMacTable(arrivalDevice, packet.srcMac, arrivalInterfaceId);
      arrivalDevice.macTable = updatedTable;
      if (learned) {
        newLogs.push(createLog(
          'MAC Learned',
          `Switch ${arrivalDevice.name} learned ${packet.srcMac} is on Port ${arrivalInterfaceId}`,
          'info',
          'L2',
          packet,
          arrivalDevice.id
        ));
      }

      // 2. Forwarding Decision
      const isBroadcast = packet.dstMac === BROADCAST_MAC;
      const targetPort = isBroadcast ? undefined : lookupMacPort(arrivalDevice, packet.dstMac);

      // Find all connected links to this switch except the ingress link
      const otherLinks = updatedLinks.filter(l => 
        l.id !== link.id && 
        l.status === 'up' && 
        (l.sourceDeviceId === arrivalDevice.id || l.targetDeviceId === arrivalDevice.id)
      );

      if (isBroadcast || !targetPort) {
        // Flood frame out all other ports
        newLogs.push(createLog(
          isBroadcast ? 'Broadcast Flooded' : 'Unknown Unicast Flooded',
          `Switch ${arrivalDevice.name} flooded frame out ${otherLinks.length} port(s) (Target MAC: ${packet.dstMac})`,
          'info',
          'L2',
          packet,
          arrivalDevice.id
        ));

        for (const outLink of otherLinks) {
          const isSource = outLink.sourceDeviceId === arrivalDevice.id;
          generatedPackets.push({
            ...packet,
            id: `pkt-flood-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            currentEdgeId: outLink.id,
            edgeDirection: isSource ? 'sourceToTarget' : 'targetToSource',
            progress: 0,
            speed: Math.max(0.02, Math.min(0.08, 10 / (outLink.latencyMs || 20))),
            hopPath: [...packet.hopPath],
          });
        }
      } else {
        // Directed Unicast forwarding to known port
        const egressLink = otherLinks.find(l => 
          (l.sourceDeviceId === arrivalDevice.id && l.sourceInterfaceId === targetPort) ||
          (l.targetDeviceId === arrivalDevice.id && l.targetInterfaceId === targetPort)
        );

        if (egressLink) {
          const isSource = egressLink.sourceDeviceId === arrivalDevice.id;
          newLogs.push(createLog(
            'Frame Forwarded',
            `Switch ${arrivalDevice.name} forwarded frame to Port ${targetPort} based on CAM Table`,
            'info',
            'L2',
            packet,
            arrivalDevice.id
          ));

          generatedPackets.push({
            ...packet,
            currentEdgeId: egressLink.id,
            edgeDirection: isSource ? 'sourceToTarget' : 'targetToSource',
            progress: 0,
            speed: Math.max(0.02, Math.min(0.08, 10 / (egressLink.latencyMs || 20))),
            hopPath: [...packet.hopPath],
          });
        } else {
          packet.status = 'dropped';
          packet.dropReason = `Switch CAM port ${targetPort} is disconnected`;
          metricsUpdates.droppedDelta++;
          newLogs.push(createLog('Port Disconnected', `Switch port ${targetPort} link is down`, 'error', 'L2', packet, arrivalDevice.id));
        }
      }
      continue;
    }

    // CASE B: ROUTER (Layer 3 Routing & IP Processing)
    if (arrivalDevice.type === 'router') {
      const receivingIface = arrivalDevice.interfaces.find(i => i.id === arrivalInterfaceId);

      // 1. ARP Request addressed to router
      if (packet.type === 'ARP_REQ') {
        const matchesRouterIp = arrivalDevice.interfaces.some(i => i.ip === packet.dstIp);
        if (matchesRouterIp && receivingIface) {
          // Router updates ARP cache with sender
          arrivalDevice.arpTable = updateArpCache(arrivalDevice, packet.srcIp, packet.srcMac, receivingIface.id);
          
          // Generate ARP reply
          const arpRep = createArpReplyPacket(arrivalDevice, receivingIface, packet.srcMac, packet.srcIp);
          arpRep.currentEdgeId = link.id;
          arpRep.edgeDirection = link.sourceDeviceId === arrivalDevice.id ? 'sourceToTarget' : 'targetToSource';
          arpRep.speed = packet.speed;
          generatedPackets.push(arpRep);

          newLogs.push(createLog(
            'Router ARP Reply',
            `Router ${arrivalDevice.name} answered ARP request for its interface IP ${receivingIface.ip}`,
            'success',
            'L2',
            arpRep,
            arrivalDevice.id
          ));
        }
        continue;
      }

      // 2. ARP Reply received by router
      if (packet.type === 'ARP_REP') {
        if (receivingIface) {
          arrivalDevice.arpTable = updateArpCache(arrivalDevice, packet.srcIp, packet.srcMac, receivingIface.id);
          newLogs.push(createLog('Router ARP Updated', `Router ${arrivalDevice.name} cached ${packet.srcIp} -> ${packet.srcMac}`, 'info', 'L2', packet, arrivalDevice.id));
        }
        continue;
      }

      // 3. IP Packet Forwarding
      // Check TTL
      packet.ttl -= 1;
      if (packet.ttl <= 0) {
        packet.status = 'dropped';
        packet.dropReason = 'Time to Live (TTL) expired in transit';
        metricsUpdates.droppedDelta++;
        newLogs.push(createLog('TTL Expired', `Router ${arrivalDevice.name} dropped packet: TTL reached 0`, 'error', 'L3', packet, arrivalDevice.id));
        continue;
      }

      // Route Lookup (LPM)
      const route = lookupRoute(arrivalDevice, packet.dstIp);
      if (!route) {
        packet.status = 'dropped';
        packet.dropReason = `No route to host ${packet.dstIp} in routing table`;
        metricsUpdates.droppedDelta++;
        newLogs.push(createLog('Routing Failed', `Router ${arrivalDevice.name}: Destination unreachable (no matching route for ${packet.dstIp})`, 'error', 'L3', packet, arrivalDevice.id));
        continue;
      }

      // Find egress interface and link
      const egressIface = arrivalDevice.interfaces.find(i => i.id === route.interfaceId) || arrivalDevice.interfaces[0];
      const egressLink = updatedLinks.find(l => 
        l.status === 'up' &&
        ((l.sourceDeviceId === arrivalDevice.id && l.sourceInterfaceId === egressIface.id) ||
         (l.targetDeviceId === arrivalDevice.id && l.targetInterfaceId === egressIface.id))
      );

      if (!egressLink) {
        packet.status = 'dropped';
        packet.dropReason = `Egress interface ${egressIface.name} link is down`;
        metricsUpdates.droppedDelta++;
        newLogs.push(createLog('Interface Down', `Router ${arrivalDevice.name}: Egress link for interface ${egressIface.name} is down`, 'error', 'PHYSICAL', packet, arrivalDevice.id));
        continue;
      }

      const nextTargetIp = route.nextHop === 'DIRECT' ? packet.dstIp : route.nextHop;
      const cachedArp = lookupArp(arrivalDevice, nextTargetIp);

      newLogs.push(createLog(
        'Route Lookup Match',
        `Router ${arrivalDevice.name} routed packet to ${route.destinationSubnet}/${route.mask} via ${route.nextHop} (TTL decremented to ${packet.ttl})`,
        'info',
        'L3',
        packet,
        arrivalDevice.id
      ));

      // Rewrite L2 frame header
      const forwardedPacket: NetworkPacket = {
        ...packet,
        srcMac: egressIface.mac,
        dstMac: cachedArp ? cachedArp.mac : BROADCAST_MAC,
        currentEdgeId: egressLink.id,
        edgeDirection: egressLink.sourceDeviceId === arrivalDevice.id ? 'sourceToTarget' : 'targetToSource',
        progress: 0,
        speed: Math.max(0.02, Math.min(0.08, 10 / (egressLink.latencyMs || 20))),
        hopPath: [...packet.hopPath],
      };

      if (!cachedArp) {
        // Trigger ARP request from router
        const routerArp = createArpRequestPacket(arrivalDevice, egressIface, nextTargetIp);
        routerArp.currentEdgeId = egressLink.id;
        routerArp.edgeDirection = egressLink.sourceDeviceId === arrivalDevice.id ? 'sourceToTarget' : 'targetToSource';
        routerArp.speed = forwardedPacket.speed;
        generatedPackets.push(routerArp);
      }

      generatedPackets.push(forwardedPacket);
      continue;
    }

    // CASE C: END HOST (PC or Server)
    if (arrivalDevice.type === 'pc' || arrivalDevice.type === 'server') {
      const hostIface = arrivalDevice.interfaces[0];

      // Handle ARP Request
      if (packet.type === 'ARP_REQ') {
        if (hostIface && hostIface.ip === packet.dstIp) {
          // Device updates its ARP table with sender
          arrivalDevice.arpTable = updateArpCache(arrivalDevice, packet.srcIp, packet.srcMac, hostIface.id);
          
          // Generate ARP Reply
          const arpReply = createArpReplyPacket(arrivalDevice, hostIface, packet.srcMac, packet.srcIp);
          arpReply.currentEdgeId = link.id;
          arpReply.edgeDirection = link.sourceDeviceId === arrivalDevice.id ? 'sourceToTarget' : 'targetToSource';
          arpReply.speed = packet.speed;
          generatedPackets.push(arpReply);

          newLogs.push(createLog(
            'ARP Resolved & Replied',
            `${arrivalDevice.name} resolved ARP for ${hostIface.ip} and replied with MAC ${hostIface.mac}`,
            'success',
            'L2',
            arpReply,
            arrivalDevice.id
          ));
        }
        continue;
      }

      // Handle ARP Reply
      if (packet.type === 'ARP_REP') {
        if (hostIface) {
          arrivalDevice.arpTable = updateArpCache(arrivalDevice, packet.srcIp, packet.srcMac, hostIface.id);
          newLogs.push(createLog(
            'ARP Cache Updated',
            `${arrivalDevice.name} cached IP ${packet.srcIp} -> MAC ${packet.srcMac}`,
            'success',
            'L2',
            packet,
            arrivalDevice.id
          ));
        }
        continue;
      }

      // Handle IP packets (ICMP Ping / HTTP)
      if (hostIface && hostIface.ip === packet.dstIp) {
        // Delivered!
        packet.status = 'delivered';
        metricsUpdates.deliveredDelta++;
        const simulatedLatency = Math.round(packet.hopPath.length * 12 + (link.latencyMs || 10));
        metricsUpdates.latencySamples.push(simulatedLatency);

        newLogs.push(createLog(
          'Packet Delivered',
          `${arrivalDevice.name} received ${packet.type} from ${packet.srcIp}: "${packet.payload.message}"`,
          'success',
          'L3',
          packet,
          arrivalDevice.id
        ));

        // If it was an ICMP Echo Request, send back Echo Reply!
        if (packet.type === 'ICMP_ECHO_REQ') {
          const isSrcLocal = isSameSubnet(hostIface.ip, packet.srcIp, hostIface.subnetMask || '255.255.255.0');
          const replyTargetIp = isSrcLocal ? packet.srcIp : arrivalDevice.defaultGateway;
          const cachedMac = replyTargetIp ? lookupArp(arrivalDevice, replyTargetIp)?.mac : undefined;

          const replyPacket: NetworkPacket = {
            id: `pkt-echo-rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            type: 'ICMP_ECHO_REP',
            srcMac: hostIface.mac,
            dstMac: cachedMac || packet.srcMac,
            srcIp: hostIface.ip,
            dstIp: packet.srcIp,
            ttl: 64,
            protocol: 'ICMP',
            payload: {
              message: `Echo reply to "${packet.payload.message}"`,
              seq: (packet.payload.seq || 1),
              dataSize: 64,
            },
            originDeviceId: arrivalDevice.id,
            destinationDeviceId: packet.originDeviceId,
            currentEdgeId: link.id,
            edgeDirection: link.sourceDeviceId === arrivalDevice.id ? 'sourceToTarget' : 'targetToSource',
            progress: 0,
            speed: packet.speed,
            hopPath: [arrivalDevice.id],
            status: 'in-flight',
            color: '#10b981', // emerald green
          };

          generatedPackets.push(replyPacket);

          newLogs.push(createLog(
            'ICMP Reply Generated',
            `${arrivalDevice.name} responding with ICMP Echo Reply back to ${packet.srcIp}`,
            'info',
            'L3',
            replyPacket,
            arrivalDevice.id
          ));
        }
      } else {
        // Packet arrived at wrong host
        packet.status = 'dropped';
        packet.dropReason = `Destination IP ${packet.dstIp} does not match host IP ${hostIface?.ip}`;
        metricsUpdates.droppedDelta++;
        newLogs.push(createLog('Host Mismatch', `Packet dropped: ${arrivalDevice.name} is not ${packet.dstIp}`, 'warning', 'L3', packet, arrivalDevice.id));
      }
    }
  }

  return {
    devices: updatedDevices,
    links: updatedLinks,
    packets: [...survivingPackets, ...generatedPackets],
    newLogs,
    metricsUpdates,
  };
}

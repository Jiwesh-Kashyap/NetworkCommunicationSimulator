import { NetworkDevice, NetworkInterface, NetworkPacket, ArpEntry } from '../types/network';

export const BROADCAST_MAC = 'FF:FF:FF:FF:FF:FF';

export function lookupArp(device: NetworkDevice, ip: string): ArpEntry | undefined {
  return device.arpTable.find(entry => entry.ip === ip);
}

export function updateArpCache(
  device: NetworkDevice,
  ip: string,
  mac: string,
  interfaceId: string
): ArpEntry[] {
  const existingIndex = device.arpTable.findIndex(entry => entry.ip === ip);
  const now = Date.now();
  const newEntry: ArpEntry = { ip, mac, interfaceId, timestamp: now };

  if (existingIndex >= 0) {
    const updated = [...device.arpTable];
    updated[existingIndex] = newEntry;
    return updated;
  }
  return [...device.arpTable, newEntry];
}

export function createArpRequestPacket(
  srcDevice: NetworkDevice,
  srcInterface: NetworkInterface,
  targetIp: string
): NetworkPacket {
  return {
    id: `pkt-arp-req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'ARP_REQ',
    srcMac: srcInterface.mac,
    dstMac: BROADCAST_MAC,
    srcIp: srcInterface.ip || '0.0.0.0',
    dstIp: targetIp,
    ttl: 1, // L2 local broadcast domain only
    protocol: 'ARP',
    payload: {
      message: `Who has ${targetIp}? Tell ${srcInterface.ip} (${srcInterface.mac})`,
      dataSize: 28, // 28 bytes ARP packet
    },
    originDeviceId: srcDevice.id,
    destinationDeviceId: '', // broadcast
    progress: 0,
    speed: 0.05,
    hopPath: [srcDevice.id],
    status: 'in-flight',
    color: '#eab308', // amber
  };
}

export function createArpReplyPacket(
  replyingDevice: NetworkDevice,
  replyingInterface: NetworkInterface,
  destMac: string,
  destIp: string
): NetworkPacket {
  return {
    id: `pkt-arp-rep-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: 'ARP_REP',
    srcMac: replyingInterface.mac,
    dstMac: destMac,
    srcIp: replyingInterface.ip || '0.0.0.0',
    dstIp: destIp,
    ttl: 1,
    protocol: 'ARP',
    payload: {
      message: `${replyingInterface.ip} is at ${replyingInterface.mac}`,
      dataSize: 28,
    },
    originDeviceId: replyingDevice.id,
    destinationDeviceId: '', // Directed unicast L2
    progress: 0,
    speed: 0.05,
    hopPath: [replyingDevice.id],
    status: 'in-flight',
    color: '#22c55e', // green
  };
}

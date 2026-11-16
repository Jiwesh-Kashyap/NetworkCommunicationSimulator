import React from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { NetworkPacket } from '../../types/network';

export const PacketOverlay: React.FC = () => {
  const activePackets = useNetworkStore(s => s.activePackets);
  const devices = useNetworkStore(s => s.devices);
  const links = useNetworkStore(s => s.links);
  const setInspectingPacket = useNetworkStore(s => s.setInspectingPacket);

  // Map devices for quick position lookup
  const devicePosMap = new Map<string, { x: number; y: number }>();
  for (const d of devices) {
    // Offset to roughly center of node card (~180px width, ~100px height)
    devicePosMap.set(d.id, { x: d.x + 90, y: d.y + 50 });
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-visible">
      {activePackets.map((packet: NetworkPacket) => {
        if (!packet.currentEdgeId) return null;
        const link = links.find(l => l.id === packet.currentEdgeId);
        if (!link) return null;

        const isForward = packet.edgeDirection === 'sourceToTarget';
        const startId = isForward ? link.sourceDeviceId : link.targetDeviceId;
        const endId = isForward ? link.targetDeviceId : link.sourceDeviceId;

        const startPos = devicePosMap.get(startId);
        const endPos = devicePosMap.get(endId);

        if (!startPos || !endPos) return null;

        const clampedProgress = Math.min(1, Math.max(0, packet.progress));
        const currentX = startPos.x + (endPos.x - startPos.x) * clampedProgress;
        const currentY = startPos.y + (endPos.y - startPos.y) * clampedProgress;

        const packetColor = packet.color || '#38bdf8';
        const label = packet.type.startsWith('ARP') ? 'ARP' : packet.type.startsWith('ICMP') ? 'ICMP' : 'TCP';

        return (
          <div
            key={packet.id}
            style={{
              position: 'absolute',
              left: `${currentX}px`,
              top: `${currentY}px`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={(e) => {
              e.stopPropagation();
              setInspectingPacket(packet.id);
            }}
            className="pointer-events-auto cursor-pointer group flex flex-col items-center select-none transition-transform duration-75"
          >
            {/* Packet glowing dot */}
            <div className="relative flex items-center justify-center">
              <span
                className="absolute w-5 h-5 rounded-full animate-ping opacity-75"
                style={{ backgroundColor: packetColor }}
              />
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-lg flex items-center justify-center font-bold text-[8px] text-white"
                style={{ backgroundColor: packetColor }}
              />
            </div>

            {/* Protocol tag pill */}
            <div
              className="mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider shadow-md border border-slate-700/80 backdrop-blur-md whitespace-nowrap bg-slate-900/90 text-white group-hover:scale-110 transition-transform"
              style={{ borderColor: packetColor }}
            >
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
};

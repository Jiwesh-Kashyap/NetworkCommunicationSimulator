import React from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { X, Layers, ShieldCheck, ArrowRight, Activity, Clock, Cpu } from 'lucide-react';

export const PacketInspectorModal: React.FC = () => {
  const inspectingPacketId = useNetworkStore(s => s.inspectingPacketId);
  const setInspectingPacket = useNetworkStore(s => s.setInspectingPacket);
  const activePackets = useNetworkStore(s => s.activePackets);
  const devices = useNetworkStore(s => s.devices);

  if (!inspectingPacketId) return null;

  const packet = activePackets.find(p => p.id === inspectingPacketId);

  const getDeviceName = (id: string) => devices.find(d => d.id === id)?.name || id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                Packet Inspector (OSI Stack)
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/20 text-blue-300">
                  {packet?.type || 'PACKET'}
                </span>
              </h3>
              <p className="text-[11px] font-mono text-slate-400">ID: {inspectingPacketId}</p>
            </div>
          </div>

          <button
            onClick={() => setInspectingPacket(null)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {packet ? (
          <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
            {/* Hop Path Timeline */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
                Path Traversed & Current Hop:
              </span>
              <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                {packet.hopPath.map((hopId, i) => (
                  <React.Fragment key={i}>
                    <span className="px-2 py-1 bg-slate-800 rounded-lg text-sky-300 font-semibold border border-slate-700">
                      {getDeviceName(hopId)}
                    </span>
                    {i < packet.hopPath.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="text-[11px] font-mono text-slate-400 pt-1">
                Progress along current edge: {Math.round(packet.progress * 100)}%
              </div>
            </div>

            {/* Layer 2: Data Link Header */}
            <div className="border border-emerald-500/30 bg-emerald-950/10 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5">
                <span className="text-xs font-bold font-mono uppercase text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Layer 2: Ethernet II Frame Header
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Type: {packet.type.startsWith('ARP') ? '0x0806 (ARP)' : '0x0800 (IPv4)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">Source MAC:</span>
                  <span className="text-slate-200 font-semibold">{packet.srcMac}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">Destination MAC:</span>
                  <span className={`font-semibold ${packet.dstMac === 'FF:FF:FF:FF:FF:FF' ? 'text-amber-400' : 'text-slate-200'}`}>
                    {packet.dstMac} {packet.dstMac === 'FF:FF:FF:FF:FF:FF' && '(Broadcast)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Layer 3: Network Header */}
            <div className="border border-sky-500/30 bg-sky-950/10 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-sky-500/20 pb-1.5">
                <span className="text-xs font-bold font-mono uppercase text-sky-400 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  Layer 3: IPv4 Packet Header
                </span>
                <span className="text-[10px] font-mono text-sky-300">
                  TTL: {packet.ttl}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">Source IPv4:</span>
                  <span className="text-sky-300 font-semibold">{packet.srcIp}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-slate-400 block">Destination IPv4:</span>
                  <span className="text-sky-300 font-semibold">{packet.dstIp}</span>
                </div>
              </div>
            </div>

            {/* Layer 4 / Application Payload */}
            <div className="border border-purple-500/30 bg-purple-950/10 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5">
                <span className="text-xs font-bold font-mono uppercase text-purple-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Payload & Message
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {packet.payload.dataSize || 64} bytes
                </span>
              </div>
              <p className="text-xs font-mono text-slate-200 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                "{packet.payload.message}"
              </p>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            Packet is no longer in transit or has finished delivery.
          </div>
        )}
      </div>
    </div>
  );
};

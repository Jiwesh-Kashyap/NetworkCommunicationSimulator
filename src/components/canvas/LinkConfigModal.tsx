import React from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { X, Trash2, Zap, ZapOff, Activity, Clock, Gauge, AlertTriangle } from 'lucide-react';

export const LinkConfigModal: React.FC = () => {
  const selectedLinkId = useNetworkStore(s => s.selectedLinkId);
  const setSelectedLink = useNetworkStore(s => s.setSelectedLink);
  const links = useNetworkStore(s => s.links);
  const devices = useNetworkStore(s => s.devices);
  const updateLink = useNetworkStore(s => s.updateLink);
  const removeLink = useNetworkStore(s => s.removeLink);
  const toggleLinkStatus = useNetworkStore(s => s.toggleLinkStatus);

  const link = links.find(l => l.id === selectedLinkId);
  if (!link) return null;

  const srcDevice = devices.find(d => d.id === link.sourceDeviceId);
  const tgtDevice = devices.find(d => d.id === link.targetDeviceId);

  const isUp = link.status === 'up';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isUp ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
              {isUp ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">
                Physical Link Configuration
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                {srcDevice?.name || link.sourceDeviceId} ⟷ {tgtDevice?.name || link.targetDeviceId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => removeLink(link.id)}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete Link"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedLink(null)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status Toggle Card */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Link Status</span>
              <span className={`text-[11px] font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {isUp ? '● Link Active & Operational' : '✕ Cable Disconnected (Link Down)'}
              </span>
            </div>

            <button
              onClick={() => toggleLinkStatus(link.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isUp
                  ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40'
              }`}
            >
              {isUp ? 'Cut Cable' : 'Reconnect Link'}
            </button>
          </div>

          {/* Latency Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                Propagation Latency:
              </span>
              <span className="font-mono text-sky-400 font-bold">{link.latencyMs} ms</span>
            </div>
            <input
              type="range"
              min="1"
              max="150"
              value={link.latencyMs}
              onChange={(e) => updateLink(link.id, { latencyMs: Number(e.target.value) })}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1 ms (Fast LAN)</span>
              <span>150 ms (Satellite/WAN)</span>
            </div>
          </div>

          {/* Packet Loss Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Simulated Packet Loss:
              </span>
              <span className="font-mono text-amber-400 font-bold">{link.lossRate}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              step="5"
              value={link.lossRate}
              onChange={(e) => updateLink(link.id, { lossRate: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0% (Perfect Cable)</span>
              <span>80% (Lossy Wireless)</span>
            </div>
          </div>

          {/* Bandwidth Capacity */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              Bandwidth Capacity:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[10, 100, 1000].map(bw => (
                <button
                  key={bw}
                  onClick={() => updateLink(link.id, { bandwidthMbps: bw })}
                  className={`py-2 px-3 rounded-lg text-xs font-mono font-semibold border transition-all ${
                    link.bandwidthMbps === bw
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {bw >= 1000 ? `${bw / 1000} Gbps` : `${bw} Mbps`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

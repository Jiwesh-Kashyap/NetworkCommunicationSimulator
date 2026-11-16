import React, { useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { 
  FileText, 
  Trash2, 
  Search, 
  Filter, 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Info,
  Layers,
  ChevronRight,
  Download
} from 'lucide-react';
import { SimulationLog } from '../../types/network';

export const PacketLogView: React.FC = () => {
  const logs = useNetworkStore(s => s.logs);
  const clearLogs = useNetworkStore(s => s.clearLogs);
  const inspectingPacketId = useNetworkStore(s => s.inspectingPacketId);
  const setInspectingPacket = useNetworkStore(s => s.setInspectingPacket);
  const activePackets = useNetworkStore(s => s.activePackets);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLayer, setSelectedLayer] = useState<'ALL' | 'L2' | 'L3' | 'PHYSICAL'>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'error' | 'warning' | 'success'>('ALL');

  const filteredLogs = logs.filter(log => {
    if (selectedLayer !== 'ALL' && log.layer !== selectedLayer) return false;
    if (selectedLevel !== 'ALL' && log.level !== selectedLevel) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        log.action.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term) ||
        (log.deviceId && log.deviceId.toLowerCase().includes(term)) ||
        (log.packetType && log.packetType.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const inspectingPacket = inspectingPacketId 
    ? activePackets.find(p => p.id === inspectingPacketId) 
    : null;

  const exportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `netsim_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto select-none space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            Live Packet Inspector & Protocol Log (Wireshark-Style)
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Step-by-step diagnostic trace of ARP requests, MAC learning, Dijkstra routing, and hop decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={clearLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-red-400 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, device, IP, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent text-xs text-slate-200 placeholder-slate-500 w-full focus:outline-none"
          />
        </div>

        {/* Layer Filters */}
        <div className="flex items-center gap-1 text-[11px] font-mono">
          {(['ALL', 'L2', 'L3', 'PHYSICAL'] as const).map(layer => (
            <button
              key={layer}
              onClick={() => setSelectedLayer(layer)}
              className={`px-2 py-1 rounded-md transition-colors ${
                selectedLayer === layer
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1 text-[11px] font-mono">
          {(['ALL', 'success', 'warning', 'error'] as const).map(lvl => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-2 py-1 rounded-md uppercase transition-colors ${
                selectedLevel === lvl
                  ? lvl === 'error' ? 'bg-red-600 text-white font-bold' :
                    lvl === 'warning' ? 'bg-amber-600 text-white font-bold' :
                    lvl === 'success' ? 'bg-emerald-600 text-white font-bold' :
                    'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Log Entries Table */}
      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/50 shadow-xl">
        <div className="max-h-[580px] overflow-y-auto divide-y divide-slate-800/80 font-mono text-xs">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log: SimulationLog) => {
              const getLevelIcon = () => {
                switch (log.level) {
                  case 'success':
                    return <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
                  case 'warning':
                    return <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />;
                  case 'error':
                    return <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
                  default:
                    return <Info className="w-4 h-4 text-sky-400 flex-shrink-0" />;
                }
              };

              const getLayerBadgeColor = () => {
                switch (log.layer) {
                  case 'L2':
                    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                  case 'L3':
                    return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
                  case 'PHYSICAL':
                    return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
                  default:
                    return 'bg-slate-800 text-slate-300 border-slate-700';
                }
              };

              return (
                <div
                  key={log.id}
                  className="p-3.5 hover:bg-slate-850/60 transition-colors flex items-start gap-3 group"
                >
                  <div className="mt-0.5">{getLevelIcon()}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {log.simTimeFormatted}
                      </span>

                      <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold border ${getLayerBadgeColor()}`}>
                        {log.layer}
                      </span>

                      {log.packetType && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-slate-300 border border-slate-700">
                          {log.packetType}
                        </span>
                      )}

                      <span className="font-bold text-slate-200 text-xs">
                        {log.action}
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed font-sans">
                      {log.details}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">No events matched the current filter.</p>
              <p className="text-xs">Transmit a packet or load a preset to inspect live simulation events.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

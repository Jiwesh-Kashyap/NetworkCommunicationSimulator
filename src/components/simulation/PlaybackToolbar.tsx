import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Send, 
  Radio, 
  Layers, 
  Activity, 
  FileText, 
  Zap,
  Gauge,
  X
} from 'lucide-react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { PRESETS } from '../../data/presets';
import { PacketType } from '../../types/network';

export const PlaybackToolbar: React.FC = () => {
  const isPlaying = useNetworkStore(s => s.isPlaying);
  const togglePlay = useNetworkStore(s => s.togglePlay);
  const step = useNetworkStore(s => s.step);
  const simulationSpeed = useNetworkStore(s => s.simulationSpeed);
  const setSimulationSpeed = useNetworkStore(s => s.setSimulationSpeed);
  const activePackets = useNetworkStore(s => s.activePackets);
  const devices = useNetworkStore(s => s.devices);
  const sendPacket = useNetworkStore(s => s.sendPacket);
  const loadPreset = useNetworkStore(s => s.loadPreset);
  const currentPresetId = useNetworkStore(s => s.currentPresetId);
  const activeTab = useNetworkStore(s => s.activeTab);
  const setActiveTab = useNetworkStore(s => s.setActiveTab);

  // Transmission form state
  const [srcId, setSrcId] = useState<string>('');
  const [dstId, setDstId] = useState<string>('');
  const [packetType, setPacketType] = useState<PacketType>('ICMP_ECHO_REQ');
  const [showSendPopover, setShowSendPopover] = useState(false);

  // Filter devices that can initiate traffic (PCs, Servers)
  const hostDevices = devices.filter(d => d.type === 'pc' || d.type === 'server');

  // Auto-fill defaults if not selected
  const effectiveSrc = srcId && devices.some(d => d.id === srcId) ? srcId : (hostDevices[0]?.id || '');
  const effectiveDst = dstId && devices.some(d => d.id === dstId) ? dstId : (hostDevices[1]?.id || hostDevices[0]?.id || '');

  const handleSend = () => {
    if (!effectiveSrc || !effectiveDst) return;
    const msg = packetType === 'ICMP_ECHO_REQ' 
      ? 'ICMP Echo Ping' 
      : packetType === 'HTTP_REQ' 
      ? 'GET /index.html HTTP/1.1' 
      : 'Data Transmission';
    sendPacket(effectiveSrc, effectiveDst, packetType, msg);
    setShowSendPopover(false);
  };

  const cycleSpeed = () => {
    if (simulationSpeed === 0.5) setSimulationSpeed(1);
    else if (simulationSpeed === 1) setSimulationSpeed(2);
    else setSimulationSpeed(0.5);
  };

  return (
    <header className="h-14 sm:h-16 w-full max-w-full bg-slate-900 border-b border-slate-800 px-2 sm:px-4 flex items-center justify-between gap-2 sm:gap-4 select-none z-30 shadow-md shrink-0">
      {/* 1. Left: Brand & Preset Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <div className="hidden xs:block">
            <div className="font-bold text-xs tracking-wider uppercase text-slate-100 flex items-center gap-1">
              NetSim <span className="hidden md:inline text-[9px] bg-blue-500/20 text-blue-400 px-1 py-0.2 rounded font-mono">v2.0</span>
            </div>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-800 hidden sm:block" />

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[11px] text-slate-400 font-medium hidden xl:inline shrink-0">Preset:</span>
          <select
            value={currentPresetId}
            onChange={(e) => loadPreset(e.target.value)}
            className="bg-slate-800 border border-slate-700/80 rounded-lg px-2 py-1 text-xs text-slate-200 font-medium focus:outline-none focus:border-blue-500 cursor-pointer max-w-[130px] sm:max-w-[170px] md:max-w-[210px] truncate"
            title="Select Educational Topology Preset"
          >
            {Object.values(PRESETS).map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Middle: Packet Transmission Quick Bar (Desktop inline, Tablet/Mobile trigger) */}
      <div className="flex items-center gap-1.5 min-w-0 shrink-0">
        {/* Full Inline Bar for wide screens */}
        <div className="hidden 2xl:flex items-center gap-1.5 bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold flex items-center gap-1 shrink-0">
            <Zap className="w-3 h-3 text-amber-400" />
            Send:
          </span>

          {/* Source Device */}
          <select
            value={effectiveSrc}
            onChange={(e) => setSrcId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-md px-1.5 py-1 text-xs text-sky-400 font-mono focus:outline-none focus:border-blue-500 max-w-[110px] truncate"
          >
            {hostDevices.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.interfaces[0]?.ip})
              </option>
            ))}
          </select>

          <span className="text-slate-500 text-xs">➔</span>

          {/* Destination Device */}
          <select
            value={effectiveDst}
            onChange={(e) => setDstId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-md px-1.5 py-1 text-xs text-emerald-400 font-mono focus:outline-none focus:border-blue-500 max-w-[110px] truncate"
          >
            {hostDevices.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.interfaces[0]?.ip})
              </option>
            ))}
          </select>

          {/* Protocol Selector */}
          <select
            value={packetType}
            onChange={(e) => setPacketType(e.target.value as PacketType)}
            className="bg-slate-900 border border-slate-800 rounded-md px-1.5 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-blue-500"
          >
            <option value="ICMP_ECHO_REQ">Ping (ICMP)</option>
            <option value="HTTP_REQ">HTTP Request</option>
          </select>

          <button
            onClick={handleSend}
            disabled={!effectiveSrc || !effectiveDst || effectiveSrc === effectiveDst}
            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-semibold text-xs px-2.5 py-1 rounded-md shadow-md transition-colors shrink-0"
          >
            <Send className="w-3 h-3" />
            <span>Transmit</span>
          </button>
        </div>

        {/* Compact Quick-Send Button for screens < 2xl */}
        <div className="relative 2xl:hidden">
          <button
            onClick={() => setShowSendPopover(!showSendPopover)}
            className="flex items-center gap-1.5 bg-blue-600/90 hover:bg-blue-500 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Send Packet</span>
          </button>

          {/* Send Popover */}
          {showSendPopover && (
            <div 
              className="absolute left-1/2 -translate-x-1/2 sm:left-0 sm:translate-x-0 top-full mt-2 w-72 bg-slate-900 border border-slate-700/80 rounded-xl p-3 shadow-2xl z-50 space-y-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Transmit Packet
                </span>
                <button
                  onClick={() => setShowSendPopover(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div>
                  <label className="text-[10px] text-slate-400 uppercase block mb-1">Source Host</label>
                  <select
                    value={effectiveSrc}
                    onChange={(e) => setSrcId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-sky-400"
                  >
                    {hostDevices.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.interfaces[0]?.ip})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase block mb-1">Destination Host</label>
                  <select
                    value={effectiveDst}
                    onChange={(e) => setDstId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-emerald-400"
                  >
                    {hostDevices.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.interfaces[0]?.ip})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 uppercase block mb-1">Protocol Type</label>
                  <select
                    value={packetType}
                    onChange={(e) => setPacketType(e.target.value as PacketType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-slate-200"
                  >
                    <option value="ICMP_ECHO_REQ">Ping (ICMP Echo)</option>
                    <option value="HTTP_REQ">HTTP Request (TCP)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleSend}
                disabled={!effectiveSrc || !effectiveDst || effectiveSrc === effectiveDst}
                className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-xs py-1.5 rounded-lg shadow-md transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transmit Packet</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Right: Playback Controls & Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Play/Pause & Step Controls */}
        <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-0.5 sm:p-1 gap-1 shrink-0">
          <button
            onClick={togglePlay}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span className="hidden xs:inline">Play</span>
              </>
            )}
          </button>

          <button
            onClick={step}
            disabled={isPlaying}
            title="Single Step Forward"
            className="p-1 sm:p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Cycling Speed button */}
          <button
            onClick={cycleSpeed}
            title="Click to cycle speed (0.5x, 1x, 2x)"
            className="px-1.5 py-0.5 rounded text-[10px] font-mono text-blue-400 font-bold bg-blue-500/10 hover:bg-blue-500/20 transition-colors border-l border-slate-800"
          >
            {simulationSpeed}x
          </button>
        </div>

        {/* In-Flight Packet Indicator */}
        {activePackets.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded-lg text-[10px] font-mono text-blue-300 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
            <span>{activePackets.length} in flight</span>
          </div>
        )}

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5 sm:p-1 gap-0.5 sm:gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('canvas')}
            title="Topology Canvas"
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'canvas'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Topology</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            title="Performance Analytics"
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            title="Wireshark-Style Protocol Logs"
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Logs</span>
          </button>
        </div>
      </div>
    </header>
  );
};

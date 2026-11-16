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
  RotateCcw
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
  };

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between gap-4 select-none z-30 shadow-md">
      {/* Brand & Preset Dropdown */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Radio className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-xs tracking-wider uppercase text-slate-100 flex items-center gap-1.5">
              NetSim <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.2 rounded font-mono">v2.0</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Interactive Packet Simulator
            </div>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-medium hidden md:inline">Preset:</span>
          <select
            value={currentPresetId}
            onChange={(e) => loadPreset(e.target.value)}
            className="bg-slate-800 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {Object.values(PRESETS).map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Packet Transmission Quick Bar */}
      <div className="hidden lg:flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5">
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-semibold flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          Send:
        </span>

        {/* Source Device */}
        <select
          value={effectiveSrc}
          onChange={(e) => setSrcId(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-xs text-sky-400 font-mono focus:outline-none focus:border-blue-500"
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
          className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-xs text-emerald-400 font-mono focus:outline-none focus:border-blue-500"
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
          className="bg-slate-900 border border-slate-800 rounded-md px-2 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-blue-500"
        >
          <option value="ICMP_ECHO_REQ">Ping (ICMP)</option>
          <option value="HTTP_REQ">HTTP Request (TCP)</option>
        </select>

        <button
          onClick={handleSend}
          disabled={!effectiveSrc || !effectiveDst || effectiveSrc === effectiveDst}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-semibold text-xs px-3 py-1 rounded-md shadow-md transition-colors"
        >
          <Send className="w-3 h-3" />
          <span>Transmit</span>
        </button>
      </div>

      {/* Playback Controls & Tabs */}
      <div className="flex items-center gap-3">
        {/* Play/Pause & Step Controls */}
        <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1 gap-1">
          <button
            onClick={togglePlay}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Play</span>
              </>
            )}
          </button>

          <button
            onClick={step}
            disabled={isPlaying}
            title="Single Step Forward"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed options */}
          <div className="flex items-center text-[10px] font-mono text-slate-400 pl-1 border-l border-slate-800">
            {[0.5, 1, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => setSimulationSpeed(spd)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  simulationSpeed === spd
                    ? 'text-blue-400 font-bold bg-blue-500/10'
                    : 'hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* In-Flight Packet Indicator */}
        {activePackets.length > 0 && (
          <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg text-[11px] font-mono text-blue-300 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>{activePackets.length} in flight</span>
          </div>
        )}

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'canvas'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Topology</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logs</span>
          </button>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  Activity, 
  CheckCircle, 
  AlertOctagon, 
  Clock, 
  Gauge, 
  RotateCcw,
  TrendingUp,
  Zap
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const metrics = useNetworkStore(s => s.metrics);
  const resetMetrics = useNetworkStore(s => s.resetMetrics);
  const activePackets = useNetworkStore(s => s.activePackets);
  const links = useNetworkStore(s => s.links);

  const formattedHistory = metrics.history.map(item => ({
    ...item,
    time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }));

  const pieData = [
    { name: 'Delivered', value: metrics.totalDelivered, fill: '#10b981' },
    { name: 'Dropped', value: metrics.totalDropped, fill: '#ef4444' },
    { name: 'In Flight', value: activePackets.length, fill: '#38bdf8' },
  ];

  return (
    <div className="w-full h-full bg-slate-950 p-6 overflow-y-auto select-none space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Network Performance & Telemetry Dashboard
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time analytics for throughput, latency, loss rate, and packet delivery.
          </p>
        </div>

        <button
          onClick={resetMetrics}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Metrics</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Sent */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Packets Sent</span>
            <Zap className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {metrics.totalSent}
          </div>
          <div className="text-[10px] text-sky-400/80 font-mono mt-1">
            {activePackets.length} currently in flight
          </div>
        </div>

        {/* Total Delivered */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Delivered</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {metrics.totalDelivered}
          </div>
          <div className="text-[10px] text-emerald-400/80 font-mono mt-1">
            Successful transmissions
          </div>
        </div>

        {/* Total Dropped */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Dropped</span>
            <AlertOctagon className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-red-400">
            {metrics.totalDropped}
          </div>
          <div className="text-[10px] text-red-400/80 font-mono mt-1">
            Loss, cut links, TTL timeouts
          </div>
        </div>

        {/* Packet Loss % */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Loss Rate</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {metrics.packetLossPercentage}%
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            Drop / (Delivered + Drop)
          </div>
        </div>

        {/* Avg Latency */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Avg Latency</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400">
            {metrics.avgLatencyMs} <span className="text-xs">ms</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            End-to-end trip time
          </div>
        </div>

        {/* Throughput */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-1">
            <span>Throughput</span>
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {metrics.throughputKbps} <span className="text-xs">kbps</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-1">
            Effective transmission rate
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Throughput History */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-cyan-400" />
            Throughput (kbps) Over Time
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formattedHistory}>
                <defs>
                  <linearGradient id="throughputGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="throughput" stroke="#06b6d4" fillOpacity={1} fill="url(#throughputGrad)" name="Throughput (kbps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Cumulative Delivery vs Drop */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Packet Delivery vs Packet Loss
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="delivered" fill="#10b981" name="Delivered" stackId="a" />
                <Bar dataKey="dropped" fill="#ef4444" name="Dropped" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Educational Concept Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-2">
        <h4 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          Data Communication Principles Observed Here:
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400 pt-2 font-mono">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <span className="text-sky-300 font-bold block mb-1">1. Latency & Delay</span>
            Propagation delay (link length and medium) + transmission delay (packet size / bandwidth) determine the round-trip ping time.
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <span className="text-amber-300 font-bold block mb-1">2. Packet Loss & Reroute</span>
            When links fail or loss rate is induced, packets are dropped. Routers running Dijkstra recalculate SPF trees to bypass failed links.
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <span className="text-emerald-300 font-bold block mb-1">3. Switching vs. Routing</span>
            Switches use MAC addresses in Layer 2 collision domains; routers use IP addresses and Longest Prefix Matching across distinct subnets.
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Monitor, Server, Network, ShieldCheck, Activity, Cpu, AlertTriangle } from 'lucide-react';
import { NetworkDevice } from '../../../types/network';

interface DeviceNodeProps {
  id: string;
  data: NetworkDevice;
  selected?: boolean;
}

export const DeviceNode = memo(({ id, data, selected }: DeviceNodeProps) => {
  const getDeviceIcon = () => {
    switch (data.type) {
      case 'pc':
        return <Monitor className="w-6 h-6 text-sky-400" />;
      case 'server':
        return <Server className="w-6 h-6 text-purple-400" />;
      case 'switch':
        return <Network className="w-6 h-6 text-emerald-400" />;
      case 'router':
        return <Cpu className="w-6 h-6 text-amber-400" />;
      default:
        return <Activity className="w-6 h-6 text-slate-400" />;
    }
  };

  const getBorderColor = () => {
    if (selected) return 'border-blue-500 shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/50';
    switch (data.type) {
      case 'pc':
        return 'border-sky-500/40 hover:border-sky-400';
      case 'server':
        return 'border-purple-500/40 hover:border-purple-400';
      case 'switch':
        return 'border-emerald-500/40 hover:border-emerald-400';
      case 'router':
        return 'border-amber-500/40 hover:border-amber-400';
    }
  };

  const primaryIp = data.interfaces[0]?.ip;
  const primaryMac = data.interfaces[0]?.mac;

  return (
    <div
      className={`min-w-[170px] max-w-[230px] rounded-xl bg-slate-900/95 backdrop-blur-md border ${getBorderColor()} p-3 transition-all duration-200 cursor-pointer shadow-xl`}
    >
      {/* Target/Source Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-900 hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-900 hover:!scale-125 transition-transform"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-900 hover:!scale-125 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-900 hover:!scale-125 transition-transform"
      />

      {/* Header with Icon and Device Name */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
          {getDeviceIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-xs tracking-wide text-slate-100 truncate">
            {data.name}
          </div>
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            {data.type}
          </div>
        </div>
      </div>

      {/* Device Details & Status Badges */}
      <div className="space-y-1 text-[11px] font-mono border-t border-slate-800/80 pt-2">
        {data.type !== 'switch' && primaryIp && (
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-[9px] uppercase text-slate-400">IP:</span>
            <span className="text-sky-300 font-semibold">{primaryIp}</span>
          </div>
        )}

        {data.type === 'router' && data.interfaces.length > 1 && (
          <div className="text-[10px] text-amber-300/90 truncate flex items-center justify-between">
            <span className="text-[9px] uppercase text-slate-400">Ifaces:</span>
            <span>{data.interfaces.length} Routed</span>
          </div>
        )}

        {data.type === 'switch' && (
          <div className="flex items-center justify-between text-emerald-400 text-[10px]">
            <span className="text-[9px] uppercase text-slate-400">CAM Ports:</span>
            <span>{data.interfaces.length} Ports ({data.macTable?.length || 0} MACs)</span>
          </div>
        )}

        {primaryMac && (
          <div className="flex items-center justify-between text-slate-400 text-[9px] truncate">
            <span className="text-[9px] uppercase text-slate-400">MAC:</span>
            <span className="truncate max-w-[110px]">{primaryMac}</span>
          </div>
        )}

        {data.defaultGateway && (
          <div className="flex items-center justify-between text-slate-400 text-[9px]">
            <span className="text-[9px] uppercase text-slate-400">GW:</span>
            <span className="text-slate-300">{data.defaultGateway}</span>
          </div>
        )}
      </div>

      {/* ARP Cache badge / Routing table badge */}
      <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
        {data.type === 'router' ? (
          <span className="text-amber-400/90 text-[10px]">
            {data.routingTable?.length || 0} Routes (SPF)
          </span>
        ) : data.type === 'switch' ? (
          <span className="text-emerald-400/90 text-[10px]">
            {data.macTable?.length || 0} Learned MACs
          </span>
        ) : (
          <span className="text-slate-400 text-[10px]">
            ARP: {data.arpTable?.length || 0} cached
          </span>
        )}
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </div>
  );
});

DeviceNode.displayName = 'DeviceNode';

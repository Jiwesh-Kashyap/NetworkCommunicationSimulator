import React, { memo } from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath, EdgeLabelRenderer } from '@xyflow/react';
import { NetworkLink } from '../../../types/network';
import { useNetworkStore } from '../../../store/useNetworkStore';
import { Scissors, RefreshCw, ZapOff } from 'lucide-react';

export const NetworkLinkEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const toggleLinkStatus = useNetworkStore(s => s.toggleLinkStatus);
  const setSelectedLink = useNetworkStore(s => s.setSelectedLink);

  const link = data as NetworkLink | undefined;
  const isUp = link?.status !== 'down';
  const latency = link?.latencyMs ?? 10;
  const lossRate = link?.lossRate ?? 0;

  const strokeColor = !isUp 
    ? '#ef4444' 
    : selected 
    ? '#38bdf8' 
    : '#3b82f6';

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: strokeColor,
          strokeWidth: selected ? 3.5 : isUp ? 2.5 : 2,
          strokeDasharray: isUp ? undefined : '6 6',
          opacity: isUp ? 0.9 : 0.6,
          transition: 'all 0.2s ease',
        }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-full px-2 py-0.5 text-[10px] font-mono shadow-md backdrop-blur-sm group hover:border-slate-500 cursor-pointer transition-all"
          onClick={() => setSelectedLink(id)}
        >
          {isUp ? (
            <span className="text-sky-300 font-semibold">{latency}ms</span>
          ) : (
            <span className="text-red-400 font-bold flex items-center gap-1">
              <ZapOff className="w-3 h-3 text-red-400 animate-pulse" />
              DOWN
            </span>
          )}

          {lossRate > 0 && isUp && (
            <span className="text-amber-400 font-medium">{lossRate}% loss</span>
          )}

          {/* Quick Sever / Repair Button */}
          <button
            title={isUp ? 'Click to cut cable (simulate link failure)' : 'Click to restore link'}
            onClick={(e) => {
              e.stopPropagation();
              toggleLinkStatus(id);
            }}
            className={`p-1 rounded-full transition-colors ${
              isUp 
                ? 'text-slate-400 hover:text-red-400 hover:bg-red-500/10' 
                : 'text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {isUp ? <Scissors className="w-3 h-3" /> : <RefreshCw className="w-3 h-3 animate-spin" />}
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

NetworkLinkEdge.displayName = 'NetworkLinkEdge';

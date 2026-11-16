import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  applyNodeChanges,
  NodeChange,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useNetworkStore } from '../../store/useNetworkStore';
import { DeviceNode } from './nodes/DeviceNode';
import { NetworkLinkEdge } from './edges/NetworkLinkEdge';
import { PacketOverlay } from './PacketOverlay';
import { Monitor, Network, Cpu, Server, Plus, Trash2 } from 'lucide-react';
import { DeviceType } from '../../types/network';

const nodeTypes = {
  deviceNode: DeviceNode,
};

const edgeTypes = {
  networkLink: NetworkLinkEdge,
};

export const TopologyCanvas: React.FC = () => {
  const devices = useNetworkStore(s => s.devices);
  const links = useNetworkStore(s => s.links);
  const selectedDeviceId = useNetworkStore(s => s.selectedDeviceId);
  const selectedLinkId = useNetworkStore(s => s.selectedLinkId);

  const setSelectedDevice = useNetworkStore(s => s.setSelectedDevice);
  const setSelectedLink = useNetworkStore(s => s.setSelectedLink);
  const addDevice = useNetworkStore(s => s.addDevice);
  const addLink = useNetworkStore(s => s.addLink);
  const updateDevice = useNetworkStore(s => s.updateDevice);
  const clearTopology = useNetworkStore(s => s.clearTopology);

  // Convert store devices to React Flow nodes
  const nodes: Node[] = useMemo(() => {
    return devices.map(d => ({
      id: d.id,
      type: 'deviceNode',
      position: { x: d.x, y: d.y },
      data: d as any,
      selected: d.id === selectedDeviceId,
    }));
  }, [devices, selectedDeviceId]);

  // Convert store links to React Flow edges
  const edges: Edge[] = useMemo(() => {
    return links.map(l => ({
      id: l.id,
      source: l.sourceDeviceId,
      target: l.targetDeviceId,
      type: 'networkLink',
      data: l as any,
      selected: l.id === selectedLinkId,
    }));
  }, [links, selectedLinkId]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    for (const change of changes) {
      if (change.type === 'position' && change.position) {
        updateDevice(change.id, {
          x: Math.round(change.position.x),
          y: Math.round(change.position.y),
        });
      }
    }
  }, [updateDevice]);

  const onConnect = useCallback((params: Connection) => {
    if (params.source && params.target) {
      addLink(params.source, params.target);
    }
  }, [addLink]);

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedDevice(node.id);
  }, [setSelectedDevice]);

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedLink(edge.id);
  }, [setSelectedLink]);

  const handlePaneClick = useCallback(() => {
    setSelectedDevice(null);
    setSelectedLink(null);
  }, [setSelectedDevice, setSelectedLink]);

  const handleQuickAdd = (type: DeviceType) => {
    // Generate position with slight jitter around center
    const x = 300 + Math.floor(Math.random() * 200) - 100;
    const y = 200 + Math.floor(Math.random() * 200) - 100;
    addDevice(type, x, y);
  };

  return (
    <div className="relative w-full h-full bg-slate-950 select-none">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.0}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#334155" />
        <Controls className="!bg-slate-900/90 !border !border-slate-800 !rounded-xl overflow-hidden [&>button]:!bg-slate-800/80 [&>button]:!border-slate-700 [&>button]:!text-slate-200" />
        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(n) => {
            const dev = n.data as any;
            if (dev?.type === 'pc') return '#38bdf8';
            if (dev?.type === 'router') return '#fbbf24';
            if (dev?.type === 'switch') return '#34d399';
            if (dev?.type === 'server') return '#c084fc';
            return '#94a3b8';
          }}
          className="!bg-slate-900/80 !border !border-slate-800 !rounded-xl overflow-hidden"
        />

        {/* Floating Quick Action Palette */}
        <Panel position="top-left" className="m-3">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 backdrop-blur-md rounded-2xl p-1.5 shadow-2xl">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 font-semibold">
              Add Device:
            </span>
            <button
              onClick={() => handleQuickAdd('pc')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-medium transition-colors"
              title="Add Host PC"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>PC</span>
            </button>
            <button
              onClick={() => handleQuickAdd('switch')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium transition-colors"
              title="Add L2 Switch"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Switch</span>
            </button>
            <button
              onClick={() => handleQuickAdd('router')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-medium transition-colors"
              title="Add L3 Router"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Router</span>
            </button>
            <button
              onClick={() => handleQuickAdd('server')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs font-medium transition-colors"
              title="Add Server"
            >
              <Server className="w-3.5 h-3.5" />
              <span>Server</span>
            </button>
            <div className="h-5 w-px bg-slate-800 mx-1" />
            <button
              onClick={clearTopology}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 text-xs font-medium transition-colors"
              title="Clear Canvas"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </Panel>

        {/* Packet Animation Overlay */}
        <PacketOverlay />
      </ReactFlow>
    </div>
  );
};

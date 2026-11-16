import React, { useEffect, useRef } from 'react';
import { useNetworkStore } from './store/useNetworkStore';
import { PlaybackToolbar } from './components/simulation/PlaybackToolbar';
import { TopologyCanvas } from './components/canvas/TopologyCanvas';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { PacketLogView } from './components/dashboard/PacketLogView';
import { DeviceConfigModal } from './components/canvas/DeviceConfigModal';
import { LinkConfigModal } from './components/canvas/LinkConfigModal';
import { PacketInspectorModal } from './components/dashboard/PacketInspectorModal';

export const App: React.FC = () => {
  const isPlaying = useNetworkStore(s => s.isPlaying);
  const step = useNetworkStore(s => s.step);
  const activeTab = useNetworkStore(s => s.activeTab);
  const activePackets = useNetworkStore(s => s.activePackets);
  const setIsPlaying = useNetworkStore(s => s.setIsPlaying);

  const timerRef = useRef<number | null>(null);

  // Simulation tick loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        step();
      }, 50);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, step]);

  // Auto-pause when all packets finish in flight
  useEffect(() => {
    if (isPlaying && activePackets.length === 0) {
      // Small delay before stopping so users see final state
      const timeout = setTimeout(() => {
        if (useNetworkStore.getState().activePackets.length === 0) {
          setIsPlaying(false);
        }
      }, 600);
      return () => clearTimeout(timeout);
    }
  }, [isPlaying, activePackets.length, setIsPlaying]);

  return (
    <div className="flex flex-col w-screen h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Application Toolbar */}
      <PlaybackToolbar />

      {/* Main Content Area */}
      <main className="flex-1 relative w-full h-[calc(100vh-4rem)] overflow-hidden">
        {activeTab === 'canvas' && <TopologyCanvas />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'logs' && <PacketLogView />}
      </main>

      {/* Modals & Inspectors */}
      <DeviceConfigModal />
      <LinkConfigModal />
      <PacketInspectorModal />
    </div>
  );
};

export default App;

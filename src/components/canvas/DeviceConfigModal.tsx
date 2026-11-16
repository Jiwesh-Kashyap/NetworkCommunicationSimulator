import React, { useState } from 'react';
import { useNetworkStore } from '../../store/useNetworkStore';
import { 
  X, 
  Trash2, 
  Cpu, 
  Monitor, 
  Network, 
  Server, 
  Check, 
  RotateCcw, 
  RefreshCw,
  Table,
  Sliders,
  ShieldAlert
} from 'lucide-react';
import { isValidIpv4, generateMac } from '../../utils/ipUtils';

export const DeviceConfigModal: React.FC = () => {
  const selectedDeviceId = useNetworkStore(s => s.selectedDeviceId);
  const setSelectedDevice = useNetworkStore(s => s.setSelectedDevice);
  const devices = useNetworkStore(s => s.devices);
  const updateDevice = useNetworkStore(s => s.updateDevice);
  const removeDevice = useNetworkStore(s => s.removeDevice);

  const device = devices.find(d => d.id === selectedDeviceId);

  const [activeTab, setActiveTab] = useState<'config' | 'tables'>('config');

  if (!device) return null;

  const handleNameChange = (newName: string) => {
    updateDevice(device.id, { name: newName });
  };

  const handleInterfaceChange = (index: number, field: string, value: string) => {
    const updated = [...device.interfaces];
    updated[index] = { ...updated[index], [field]: value };
    updateDevice(device.id, { interfaces: updated });
  };

  const handleGatewayChange = (gw: string) => {
    updateDevice(device.id, { defaultGateway: gw });
  };

  const clearArp = () => {
    updateDevice(device.id, { arpTable: [] });
  };

  const clearMacTable = () => {
    if (device.type === 'switch') {
      updateDevice(device.id, { macTable: [] });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
              {device.type === 'pc' && <Monitor className="w-5 h-5 text-sky-400" />}
              {device.type === 'switch' && <Network className="w-5 h-5 text-emerald-400" />}
              {device.type === 'router' && <Cpu className="w-5 h-5 text-amber-400" />}
              {device.type === 'server' && <Server className="w-5 h-5 text-purple-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={device.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="bg-transparent font-bold text-slate-100 text-base focus:bg-slate-800/80 px-1.5 py-0.5 rounded border border-transparent focus:border-slate-700 focus:outline-none"
                />
                <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                  {device.type}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">ID: {device.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => removeDevice(device.id)}
              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Delete Device"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDevice(null)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-4">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Configuration & Interfaces</span>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 py-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'tables'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>
              {device.type === 'router'
                ? 'Routing & ARP Tables'
                : device.type === 'switch'
                ? 'CAM MAC Address Table'
                : 'ARP Cache Table'}
            </span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Default Gateway (for PC / Server) */}
              {device.type !== 'switch' && (
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Default Gateway IP:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={device.defaultGateway || ''}
                      placeholder="e.g. 192.168.1.1"
                      onChange={(e) => handleGatewayChange(e.target.value)}
                      className={`bg-slate-900 border rounded-lg px-3 py-2 text-xs font-mono text-slate-100 flex-1 focus:outline-none focus:border-blue-500 ${
                        device.defaultGateway && !isValidIpv4(device.defaultGateway)
                          ? 'border-red-500/80'
                          : 'border-slate-800'
                      }`}
                    />
                    {device.defaultGateway && isValidIpv4(device.defaultGateway) && (
                      <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Valid
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Packets addressed outside local subnet will be routed to this gateway IP.
                  </p>
                </div>
              )}

              {/* Interfaces */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Network Interfaces ({device.interfaces.length})
                </h4>

                {device.interfaces.map((iface, idx) => (
                  <div
                    key={iface.id}
                    className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-xs text-sky-400">
                          {iface.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          ({iface.id})
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        {iface.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                      {device.type !== 'switch' && (
                        <div>
                          <label className="block text-[10px] uppercase text-slate-400 mb-1">
                            IPv4 Address
                          </label>
                          <input
                            type="text"
                            value={iface.ip || ''}
                            placeholder="192.168.1.10"
                            onChange={(e) => handleInterfaceChange(idx, 'ip', e.target.value)}
                            className={`w-full bg-slate-900 border rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 ${
                              iface.ip && !isValidIpv4(iface.ip) ? 'border-red-500' : 'border-slate-800'
                            }`}
                          />
                        </div>
                      )}

                      {device.type !== 'switch' && (
                        <div>
                          <label className="block text-[10px] uppercase text-slate-400 mb-1">
                            Subnet Mask
                          </label>
                          <input
                            type="text"
                            value={iface.subnetMask || ''}
                            placeholder="255.255.255.0"
                            onChange={(e) => handleInterfaceChange(idx, 'subnetMask', e.target.value)}
                            className={`w-full bg-slate-900 border rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 ${
                              iface.subnetMask && !isValidIpv4(iface.subnetMask) ? 'border-red-500' : 'border-slate-800'
                            }`}
                          />
                        </div>
                      )}

                      <div className={device.type === 'switch' ? 'col-span-2' : ''}>
                        <label className="block text-[10px] uppercase text-slate-400 mb-1">
                          Hardware MAC Address
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={iface.mac}
                            onChange={(e) => handleInterfaceChange(idx, 'mac', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
                          />
                          <button
                            onClick={() => handleInterfaceChange(idx, 'mac', generateMac('00:1A:2B'))}
                            title="Generate New MAC"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tables' && (
            <div className="space-y-6">
              {/* ROUTER ROUTING TABLE */}
              {device.type === 'router' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                        IP Routing Table (FIB)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Dynamically maintained via Dijkstra Shortest-Path First (SPF) & Direct Interfaces.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">Destination Subnet</th>
                          <th className="p-2.5">Mask</th>
                          <th className="p-2.5">Next Hop</th>
                          <th className="p-2.5">Interface</th>
                          <th className="p-2.5">Metric</th>
                          <th className="p-2.5">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                        {device.routingTable && device.routingTable.length > 0 ? (
                          device.routingTable.map(route => (
                            <tr key={route.id} className="hover:bg-slate-800/40">
                              <td className="p-2.5 text-sky-400 font-semibold">{route.destinationSubnet}</td>
                              <td className="p-2.5 text-slate-400">{route.mask}</td>
                              <td className="p-2.5 text-emerald-400">{route.nextHop}</td>
                              <td className="p-2.5 text-amber-300">{route.interfaceId}</td>
                              <td className="p-2.5 text-slate-300">{route.metric}</td>
                              <td className="p-2.5">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  route.type === 'DIRECT' 
                                    ? 'bg-blue-500/20 text-blue-400' 
                                    : 'bg-amber-500/20 text-amber-400'
                                }`}>
                                  {route.type}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-slate-400">
                              No routes populated in routing table.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SWITCH CAM / MAC TABLE */}
              {device.type === 'switch' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        CAM / MAC Address Table
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Maps MAC addresses learned dynamically from ingress frames to physical switch ports.
                      </p>
                    </div>
                    <button
                      onClick={clearMacTable}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Clear CAM Table</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">Learned MAC Address</th>
                          <th className="p-2.5">Switch Port</th>
                          <th className="p-2.5">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                        {device.macTable && device.macTable.length > 0 ? (
                          device.macTable.map((entry, i) => (
                            <tr key={i} className="hover:bg-slate-800/40">
                              <td className="p-2.5 text-emerald-300 font-semibold">{entry.mac}</td>
                              <td className="p-2.5 text-sky-400 font-bold">{entry.portId}</td>
                              <td className="p-2.5 text-slate-400">DYNAMIC (Learned)</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="p-4 text-center text-slate-400">
                              Switch MAC table is currently empty. Frames will be flooded until learned.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ARP TABLE (For PC, Server, Router) */}
              {device.type !== 'switch' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                        ARP Cache Table
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Cached mappings between IPv4 addresses and hardware MAC addresses.
                      </p>
                    </div>
                    <button
                      onClick={clearArp}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Flush ARP Cache</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">IPv4 Address</th>
                          <th className="p-2.5">Physical MAC Address</th>
                          <th className="p-2.5">Interface</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                        {device.arpTable.length > 0 ? (
                          device.arpTable.map((entry, i) => (
                            <tr key={i} className="hover:bg-slate-800/40">
                              <td className="p-2.5 text-sky-400 font-semibold">{entry.ip}</td>
                              <td className="p-2.5 text-emerald-300">{entry.mac}</td>
                              <td className="p-2.5 text-slate-400">{entry.interfaceId}</td>
                              <td className="p-2.5 text-emerald-400 font-semibold">DYNAMIC</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400">
                              No entries in ARP cache. ARP Request will be broadcast on next transmission.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

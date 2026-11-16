import { MacTableEntry, NetworkDevice } from '../types/network';

export function updateMacTable(
  switchDevice: NetworkDevice,
  srcMac: string,
  ingressPortId: string
): { updatedTable: MacTableEntry[]; learned: boolean } {
  const currentTable = switchDevice.macTable || [];
  const existingIndex = currentTable.findIndex(entry => entry.mac === srcMac);
  const now = Date.now();

  if (existingIndex >= 0) {
    const updated = [...currentTable];
    const oldEntry = updated[existingIndex];
    const changedPort = oldEntry.portId !== ingressPortId;
    updated[existingIndex] = {
      mac: srcMac,
      portId: ingressPortId,
      timestamp: now,
    };
    return { updatedTable: updated, learned: changedPort };
  }

  const newEntry: MacTableEntry = {
    mac: srcMac,
    portId: ingressPortId,
    timestamp: now,
  };
  return { updatedTable: [...currentTable, newEntry], learned: true };
}

export function lookupMacPort(
  switchDevice: NetworkDevice,
  dstMac: string
): string | undefined {
  if (!switchDevice.macTable) return undefined;
  const entry = switchDevice.macTable.find(e => e.mac.toLowerCase() === dstMac.toLowerCase());
  return entry?.portId;
}

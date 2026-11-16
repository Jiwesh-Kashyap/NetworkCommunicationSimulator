/**
 * IP and Subnet utility functions for computer network simulation
 */

export function ipToInt(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

export function intToIp(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255
  ].join('.');
}

export function isValidIpv4(ip: string): boolean {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = Number(part);
    return !isNaN(num) && num >= 0 && num <= 255 && part === String(num);
  });
}

export function isSameSubnet(ip1: string, ip2: string, mask: string): boolean {
  if (!isValidIpv4(ip1) || !isValidIpv4(ip2) || !isValidIpv4(mask)) return false;
  const int1 = ipToInt(ip1);
  const int2 = ipToInt(ip2);
  const maskInt = ipToInt(mask);
  return (int1 & maskInt) === (int2 & maskInt);
}

export function getNetworkAddress(ip: string, mask: string): string {
  const ipI = ipToInt(ip);
  const maskI = ipToInt(mask);
  return intToIp((ipI & maskI) >>> 0);
}

export function getBroadcastAddress(ip: string, mask: string): string {
  const ipI = ipToInt(ip);
  const maskI = ipToInt(mask);
  const invMask = (~maskI) >>> 0;
  return intToIp((ipI | invMask) >>> 0);
}

export function generateMac(prefix: string = '00:1A:2B'): string {
  const hex = '0123456789ABCDEF';
  const randByte = () => hex[Math.floor(Math.random() * 16)] + hex[Math.floor(Math.random() * 16)];
  return `${prefix}:${randByte()}:${randByte()}:${randByte()}`;
}

export function cidrToMask(cidr: number): string {
  const maskInt = cidr === 0 ? 0 : (~0 << (32 - cidr)) >>> 0;
  return intToIp(maskInt);
}

export function maskToCidr(mask: string): number {
  const int = ipToInt(mask);
  let count = 0;
  for (let i = 31; i >= 0; i--) {
    if ((int & (1 << i)) !== 0) count++;
    else break;
  }
  return count;
}

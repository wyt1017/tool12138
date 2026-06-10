import { useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Copy } from 'lucide-react';

export default function IpSubnetCalculator() {
  const color = '#e94560';
  const [ip, setIp] = useState('');
  const [cidr, setCidr] = useState('');
  const [result, setResult] = useState<{
    networkAddress: string;
    broadcastAddress: string;
    subnetMask: string;
    usableHosts: string;
    firstHost: string;
    lastHost: string;
    totalHosts: number;
    usableHostsCount: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const calculate = () => {
    setError(null);

    // 解析 CIDR 格式 (如 192.168.1.0/24)
    let ipAddr = ip;
    let cidrNum = cidr;

    if (!ipAddr && !cidrNum) {
      setError('请输入 IP 地址和 CIDR');
      return;
    }

    // 如果输入的是 CIDR 格式 (192.168.1.0/24)
    if (ipAddr.includes('/')) {
      const parts = ipAddr.split('/');
      ipAddr = parts[0];
      cidrNum = parts[1];
    }

    const cidrValue = parseInt(cidrNum);
    if (cidrValue < 0 || cidrValue > 32) {
      setError('CIDR 必须在 0-32 之间');
      return;
    }

    // 解析 IP
    const ipParts = ipAddr.split('.');
    if (ipParts.length !== 4) {
      setError('IP 地址格式错误');
      return;
    }

    const ipNums = ipParts.map(p => parseInt(p));
    if (ipNums.some(n => n < 0 || n > 255)) {
      setError('IP 地址数值必须在 0-255 之间');
      return;
    }

    // 计算子网掩码
    const maskParts = [];
    for (let i = 0; i < 4; i++) {
      const onesInOctet = (i * 8 < cidrValue) ? Math.min(cidrValue - i * 8, 8) : 0;
      maskParts.push(parseInt('1'.repeat(onesInOctet) + '0'.repeat(8 - onesInOctet), 2));
    }

    // 计算 IP 的整数值（IPv4 32位无符号整数）
    const ipValue = ((ipNums[0] >>> 0) << 24) | ((ipNums[1] >>> 0) << 16) | ((ipNums[2] >>> 0) << 8) | (ipNums[3] >>> 0);

    // 计算网络地址
    const maskValue = ((maskParts[0] >>> 0) << 24) | ((maskParts[1] >>> 0) << 16) | ((maskParts[2] >>> 0) << 8) | (maskParts[3] >>> 0);
    const networkValue = ipValue & maskValue;
    const networkAddress = [
      (networkValue >>> 24) & 255,
      (networkValue >>> 16) & 255,
      (networkValue >>> 8) & 255,
      networkValue & 255,
    ].join('.');

    // 计算广播地址
    const broadcastValue = networkValue | (~maskValue >>> 0);
    const broadcastAddress = [
      (broadcastValue >>> 24) & 255,
      (broadcastValue >>> 16) & 255,
      (broadcastValue >>> 8) & 255,
      broadcastValue & 255,
    ].join('.');

    // 计算主机范围
    const totalHosts = Math.pow(2, 32 - cidrValue);
    const usableHostsCount = totalHosts > 2 ? totalHosts - 2 : 0;

    // 第一个可用主机
    const firstHostValue = networkValue + 1;
    const firstHost = [
      (firstHostValue >>> 24) & 255,
      (firstHostValue >>> 16) & 255,
      (firstHostValue >>> 8) & 255,
      firstHostValue & 255,
    ].join('.');

    // 最后一个可用主机
    const lastHostValue = broadcastValue - 1;
    const lastHost = [
      (lastHostValue >>> 24) & 255,
      (lastHostValue >>> 16) & 255,
      (lastHostValue >>> 8) & 255,
      lastHostValue & 255,
    ].join('.');

    setResult({
      networkAddress,
      broadcastAddress,
      subnetMask: maskParts.join('.'),
      usableHosts: `${firstHost} - ${lastHost}`,
      firstHost,
      lastHost,
      totalHosts,
      usableHostsCount,
    });
  };

  const copyValue = (value: string) => {
    navigator.clipboard.writeText(value);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Network size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">IP子网计算器</h1>
        </div>
        <p style={{ color: '#a8b2c1', marginLeft: 52 }}>输入CIDR（如192.168.1.0/24）或IP+掩码，计算网络地址、广播地址、可用主机范围等</p>
      </motion.div>

      {/* Input */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="text-xs text-[#666] block mb-2">IP地址 / CIDR格式</label>
            <input
              type="text"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              placeholder="192.168.1.0 或 192.168.1.0/24"
              aria-label="IP地址"
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-lg text-white outline-none focus:border-[#e94560]/30 w-full"
            />
          </div>
          <div className="w-[100px]">
            <label className="text-xs text-[#666] block mb-2">CIDR</label>
            <input
              type="number"
              value={cidr}
              onChange={(e) => setCidr(e.target.value)}
              placeholder="24"
              min={0}
              max={32}
              aria-label="CIDR"
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-lg text-white outline-none focus:border-[#e94560]/30 w-full"
            />
          </div>
          <button onClick={calculate} className="btn-primary">
            计算
          </button>
        </div>
        <p className="text-xs text-[#666] mt-2">支持直接输入 CIDR 格式（如 192.168.1.0/24），或分开输入 IP 和 CIDR</p>
      </motion.div>

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 mb-6 border border-red-500/30">
          <span className="text-red-400 text-sm">{error}</span>
        </motion.div>
      )}

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <h2 className="text-sm font-medium text-[#a8b2c1] mb-4">计算结果</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-xs text-[#666] mb-2">网络地址</div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'monospace', color }}>{result.networkAddress}</div>
              <button onClick={() => copyValue(result.networkAddress)} className="btn-secondary !py-1 !px-2 text-xs mt-2">
                <Copy size={12} className="inline mr-1" /> 复制
              </button>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-xs text-[#666] mb-2">广播地址</div>
              <div className="text-lg font-bold font-mono text-[#00d9ff]">{result.broadcastAddress}</div>
              <button onClick={() => copyValue(result.broadcastAddress)} className="btn-secondary !py-1 !px-2 text-xs mt-2">
                <Copy size={12} className="inline mr-1" /> 复制
              </button>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-xs text-[#666] mb-2">子网掩码</div>
              <div className="text-lg font-bold font-mono text-[#6bcb77]">{result.subnetMask}</div>
              <button onClick={() => copyValue(result.subnetMask)} className="btn-secondary !py-1 !px-2 text-xs mt-2">
                <Copy size={12} className="inline mr-1" /> 复制
              </button>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-xs text-[#666] mb-2">第一个可用主机</div>
              <div className="text-lg font-bold font-mono text-[#a78bfa]">{result.firstHost}</div>
              <button onClick={() => copyValue(result.firstHost)} className="btn-secondary !py-1 !px-2 text-xs mt-2">
                <Copy size={12} className="inline mr-1" /> 复制
              </button>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-xs text-[#666] mb-2">最后一个可用主机</div>
              <div className="text-lg font-bold font-mono text-[#f472b6]">{result.lastHost}</div>
              <button onClick={() => copyValue(result.lastHost)} className="btn-secondary !py-1 !px-2 text-xs mt-2">
                <Copy size={12} className="inline mr-1" /> 复制
              </button>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-xs text-[#666] mb-2">可用主机数</div>
              <div className="text-lg font-bold font-mono text-[#ffd369]">{result.usableHostsCount}</div>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-4 p-4 bg-white/5 rounded-lg">
            <p className="text-xs text-[#a8b2c1]">
              该子网共有 <strong className="text-white">{result.totalHosts}</strong> 个地址，
              其中 <strong className="text-white">{result.usableHostsCount}</strong> 个可用（排除网络地址和广播地址）。
              主机范围：<strong className="text-white">{result.usableHosts}</strong>
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
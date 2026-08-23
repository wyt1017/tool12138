import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Hash, Copy } from 'lucide-react';

type Algorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512';

const ALGORITHM_CONFIGS: Record<Algorithm, { label: string; length: number; color: string }> = {
  MD5: { label: 'MD5', length: 32, color: '#f472b6' },
  'SHA-1': { label: 'SHA-1', length: 40, color: '#f472b6' },
  'SHA-256': { label: 'SHA-256', length: 64, color: '#f472b6' },
  'SHA-512': { label: 'SHA-512', length: 128, color: '#f472b6' },
};

// MD5 Implementation (RFC 1321) - properly handles UTF-8 via TextEncoder
function md5(originalStr: string): string {
  const bytes = new TextEncoder().encode(originalStr);

  // Padding: byte message + 0x80 + zeros + 64-bit bit-length (little-endian)
  let msg: number[] = Array.from(bytes);
  msg.push(0x80);
  while (msg.length % 64 !== 56) msg.push(0);
  const bitLen = bytes.length * 8;
  // 显式写出长度低 32 位 + 4 个零字节。注意不能用 bitLen >>> (8*i)，JS 位移按 32 取模会损坏高字节
  msg.push(bitLen & 0xff, (bitLen >>> 8) & 0xff, (bitLen >>> 16) & 0xff, (bitLen >>> 24) & 0xff, 0, 0, 0, 0);

  const K = [
    0xd76aa478,0xe8c7b756,0x242070db,0xc1bdceee,0xf57c0faf,0x4787c62a,0xa8304613,0xfd469501,
    0x698098d8,0x8b44f7af,0xffff5bb1,0x895cd7be,0x6b901122,0xfd987193,0xa679438e,0x49b40821,
    0xf61e2562,0xc040b340,0x265e5a51,0xe9b6c7aa,0xd62f105d,0x02441453,0xd8a1e681,0xe7d3fbc8,
    0x21e1cde6,0xc33707d6,0xf4d50d87,0x455a14ed,0xa9e3e905,0xfcefa3f8,0x676f02d9,0x8d2a4c8a,
    0xfffa3942,0x8771f681,0x6d9d6122,0xfde5380c,0xa4beea44,0x4bdecfa9,0xf6bb4b60,0xbebfbc70,
    0x289b7ec6,0xeaa127fa,0xd4ef3085,0x04881d05,0xd9d4d039,0xe6db99e5,0x1fa27cf8,0xc4ac5665,
    0xf4292244,0x432aff97,0xab9423a7,0xfc93a039,0x655b59c3,0x8f0ccc92,0xffeff47d,0x85845dd1,
    0x6fa87e4f,0xfe2ce6e0,0xa3014314,0x4e0811a1,0xf7537e82,0xbd3af235,0x2ad7d2bb,0xeb86d391,
  ];
  const S = [
    7,12,17,22,7,12,17,22,7,12,17,22,7,12,17,22,
    5,9,14,20,5,9,14,20,5,9,14,20,5,9,14,20,
    4,11,16,23,4,11,16,23,4,11,16,23,4,11,16,23,
    6,10,15,21,6,10,15,21,6,10,15,21,6,10,15,21,
  ];

  const add = (a: number, b: number) => {
    const l = (a & 0xffff) + (b & 0xffff);
    const h = (a >>> 16) + (b >>> 16) + (l >>> 16);
    return ((h & 0xffff) << 16) | (l & 0xffff);
  };
  const rotl = (x: number, c: number) => (x << c) | (x >>> (32 - c));

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (let i = 0; i < msg.length; i += 64) {
    const M: number[] = [];
    for (let j = 0; j < 16; j++) {
      M[j] = msg[i + j*4] | (msg[i + j*4 + 1] << 8) | (msg[i + j*4 + 2] << 16) | (msg[i + j*4 + 3] << 24);
    }
    let A = a0, B = b0, C = c0, D = d0;
    for (let r = 0; r < 64; r++) {
      let F: number, g: number;
      if (r < 16) { F = (B & C) | (~B & D); g = r; }
      else if (r < 32) { F = (D & B) | (~D & C); g = (5*r + 1) % 16; }
      else if (r < 48) { F = B ^ C ^ D; g = (3*r + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7*r) % 16; }
      const oldD = D;
      F = add(add(add(A, F), K[r]), M[g]);
      D = C; C = B; B = add(B, rotl(F, S[r])); A = oldD;
    }
    a0 = add(a0, A); b0 = add(b0, B); c0 = add(c0, C); d0 = add(d0, D);
  }

  const byte = (v: number, shift: number) => (((v >>> shift) & 0xff).toString(16)).padStart(2, '0');
  const hex = (v: number) => byte(v, 0) + byte(v, 8) + byte(v, 16) + byte(v, 24);
  return hex(a0) + hex(b0) + hex(c0) + hex(d0);
}

async function sha(message: string, algorithm: 'SHA-1' | 'SHA-256' | 'SHA-512'): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function HashGenerator() {
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState<Algorithm>('SHA-256');
  const [hashResult, setHashResult] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!input) {
      setHashResult('');
      return;
    }

    if (algorithm === 'MD5') {
      setHashResult(md5(input));
    } else {
      sha(input, algorithm as 'SHA-1' | 'SHA-256' | 'SHA-512').then(setHashResult);
    }
  }, [input, algorithm]);

  const handleCopy = async () => {
    if (!hashResult) return;
    await navigator.clipboard.writeText(hashResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatHash = (hash: string): string => {
    if (!hash) return '';
    const groupSize = algorithm === 'SHA-512' ? 8 : 4;
    return hash.match(new RegExp(`.{1,${groupSize}}`, 'g'))?.join(' ') ?? hash;
  };

  const config = ALGORITHM_CONFIGS[algorithm];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#f472b6]/15 flex items-center justify-center">
            <Hash size={20} className="text-[#f472b6]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">哈希生成器</h1>
        </div>
        <p className="text-[var(--text-secondary)] ml-[52px]">计算文本的 MD5、SHA-1、SHA-256、SHA-512 哈希值</p>
      </motion.div>

      {/* Algorithm Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-2 mb-6">
        {(Object.keys(ALGORITHM_CONFIGS) as Algorithm[]).map((algo) => (
          <button
            key={algo}
            onClick={() => setAlgorithm(algo)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              algorithm === algo
                ? 'bg-[#f472b6]/15 text-[#f472b6] ring-1 ring-[#f472b6]/30'
                : 'bg-[var(--bg-hover)] text-[var(--text-faint)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            {ALGORITHM_CONFIGS[algo].label}
          </button>
        ))}
      </motion.div>

      {/* Input */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-[var(--text-secondary)]">输入文本</label>
          <span className="text-xs text-[var(--text-faint)]">{input.length} 字符</span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入要计算哈希值的文本..."
          aria-label="输入文本"
          className="tool-area w-full h-[160px] p-4 text-sm leading-relaxed resize-none outline-none focus:border-[#f472b6]/30 transition-colors placeholder:text-[var(--text-faint)]"
        />
      </motion.div>

      {/* Result */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#f472b6]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{config.label} 哈希值</h3>
          </div>
          {hashResult && (
            <button onClick={handleCopy} className="btn-secondary !py-1.5 !px-3 text-xs">
              {copied ? (
                <span className="text-green-400">已复制</span>
              ) : (
                <>
                  <Copy size={13} className="inline mr-1" /> 复制哈希值
                </>
              )}
            </button>
          )}
        </div>

        <div className={`font-mono text-base sm:text-lg break-all leading-relaxed tracking-wide p-4 rounded-xl bg-black/30 border border-[var(--border-color)] ${
          algorithm === 'SHA-512' ? 'text-xs sm:text-sm' : ''
        }`} style={{ color: config.color }}>
          {hashResult ? formatHash(hashResult) : (
            <span className="text-[var(--text-faint)]">等待输入...</span>
          )}
        </div>

        {hashResult && (
          <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center gap-4 text-xs text-[var(--text-faint)]">
            <span>长度：{hashResult.length} 位（{hashResult.length / 2} 字节）</span>
            <span>算法：{config.label}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#f472b6]/10 text-[#f472b6]">
              {config.label === 'MD5' ? '不安全（已破解）' : config.label === 'SHA-1' ? '不推荐（已破解）' : '安全'}
            </span>
          </div>
        )}
      </motion.div>

      {/* Algorithm Info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(ALGORITHM_CONFIGS) as [Algorithm, typeof ALGORITHM_CONFIGS[Algorithm]][]).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setAlgorithm(key)}
            className={`glass-card p-4 text-left transition-all ${
              algorithm === key ? 'ring-1 ring-[#f472b6]/30' : 'hover:bg-[var(--bg-hover)]'
            }`}
          >
            <div className="text-xs font-medium text-[var(--text-faint)] mb-1">{cfg.label}</div>
            <div className="text-sm font-mono font-bold" style={{ color: cfg.color }}>{cfg.length} 位</div>
          </button>
        ))}
      </motion.div>
    </div>
  );
}

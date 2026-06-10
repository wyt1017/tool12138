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

// MD5 Implementation - properly handles UTF-8 encoding via TextEncoder
function md5(originalStr: string): string {
  // Convert to UTF-8 bytes first
  const utf8Bytes = new TextEncoder().encode(originalStr);

  function addUnsigned(x: number, y: number): number {
    const lX = x & 0x40000000;
    const lY = y & 0x40000000;
    const lX8 = x & 0x80000000;
    const lY8 = y & 0x80000000;
    const lResult = (x & 0x3FFFFFFF) + (y & 0x3FFFFFFF);
    return (lResult & 0x3FFFFFFF) | (lX & lY ? 0x40000000 : 0) | (lX8 & lY8 ? 0x80000000 : 0);
  }

  function rotateLeft(x: number, n: number): number {
    return (x << n) | (x >>> (32 - n));
  }

  function f(x: number, y: number, z: number): number { return (x & y) | (~x & z); }
  function g(x: number, y: number, z: number): number { return (x & z) | (y & ~z); }
  function h(x: number, y: number, z: number): number { return x ^ y ^ z; }
  function i(x: number, y: number, z: number): number { return y ^ (x | ~z); }

  function ff(_a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(f(b, c, d), x), ac), s), b);
  }
  function gg(_a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(g(b, c, d), x), ac), s), b);
  }
  function hh(_a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(h(b, c, d), x), ac), s), b);
  }
  function ii(_a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    return addUnsigned(rotateLeft(addUnsigned(addUnsigned(i(b, c, d), x), ac), s), b);
  }

  // Convert UTF-8 bytes to 32-bit words (little-endian)
  function toWordArray(bytes: Uint8Array): string {
    const len = bytes.length;
    const bitLen = len * 8;

    // Build message block: data + 0x80 + zeros + length
    const msgLen = ((Math.floor(bitLen / 64) + 1) * 16) * 4; // bytes
    const msg = new Uint8Array(msgLen);
    msg.set(bytes, 0);
    msg[bytes.length] = 0x80;

    // Append length in bits (little-endian)
    msg[msgLen - 4] = (bitLen >> 0) & 0xff;
    msg[msgLen - 3] = (bitLen >> 8) & 0xff;
    msg[msgLen - 2] = (bitLen >> 16) & 0xff;
    msg[msgLen - 1] = (bitLen >> 24) & 0xff;

    let a0 = 0x67452301, b0 = 0xEFCDAB89, c0 = 0x98BADCFE, d0 = 0x10325476;

    for (let i = 0; i < msgLen; i += 64) {
      const block: number[] = [];
      for (let j = 0; j < 16; j++) {
        block[j] = msg[i + j * 4] | (msg[i + j * 4 + 1] << 8) | (msg[i + j * 4 + 2] << 16) | (msg[i + j * 4 + 3] << 24);
      }

      // Round 1
      a0 = ff(a0, b0, c0, d0, block[0], 7, 0xD76AA478); d0 = ff(d0, a0, b0, c0, block[1], 12, 0xE8C7B756);
      c0 = ff(c0, d0, a0, b0, block[2], 17, 0x242070DB); b0 = ff(b0, c0, d0, a0, block[3], 22, 0xC1BDCEEE);
      a0 = ff(a0, b0, c0, d0, block[4], 7, 0xF57C0FAF); d0 = ff(d0, a0, b0, c0, block[5], 12, 0x4787C62A);
      c0 = ff(c0, d0, a0, b0, block[6], 17, 0xA8304613); b0 = ff(b0, c0, d0, a0, block[7], 22, 0xFD469501);
      a0 = ff(a0, b0, c0, d0, block[8], 7, 0x698098D8); d0 = ff(d0, a0, b0, c0, block[9], 12, 0x8B44F7AF);
      c0 = ff(c0, d0, a0, b0, block[10], 17, 0xFFFF5BB1); b0 = ff(b0, c0, d0, a0, block[11], 22, 0x895CD7BE);
      a0 = ff(a0, b0, c0, d0, block[12], 7, 0x6B901122); d0 = ff(d0, a0, b0, c0, block[13], 12, 0xFD987193);
      c0 = ff(c0, d0, a0, b0, block[14], 17, 0xA679438E); b0 = ff(b0, c0, d0, a0, block[15], 22, 0x49B40821);

      // Round 2
      a0 = gg(a0, b0, c0, d0, block[1], 5, 0xF61E2562); d0 = gg(d0, a0, b0, c0, block[6], 9, 0xC040B340);
      c0 = gg(c0, d0, a0, b0, block[11], 14, 0x265E5A51); b0 = gg(b0, c0, d0, a0, block[0], 20, 0xE9B6C7AA);
      a0 = gg(a0, b0, c0, d0, block[5], 5, 0xD62F105D); d0 = gg(d0, a0, b0, c0, block[10], 9, 0x02441453);
      c0 = gg(c0, d0, a0, b0, block[15], 14, 0xD8A1E681); b0 = gg(b0, c0, d0, a0, block[4], 20, 0xE7D3FBC8);
      a0 = gg(a0, b0, c0, d0, block[9], 5, 0x21E1CDE6); d0 = gg(d0, a0, b0, c0, block[14], 9, 0xC33707D6);
      c0 = gg(c0, d0, a0, b0, block[3], 14, 0xF4D50D87); b0 = gg(b0, c0, d0, a0, block[8], 20, 0x455A14ED);
      a0 = gg(a0, b0, c0, d0, block[13], 5, 0xA9E3E905); d0 = gg(d0, a0, b0, c0, block[2], 9, 0xFCEFA3F8);
      c0 = gg(c0, d0, a0, b0, block[7], 14, 0x676F02D9); b0 = gg(b0, c0, d0, a0, block[12], 20, 0x8D2A4C8A);

      // Round 3
      a0 = hh(a0, b0, c0, d0, block[5], 4, 0xFFFA3942); d0 = hh(d0, a0, b0, c0, block[8], 11, 0x8771F681);
      c0 = hh(c0, d0, a0, b0, block[11], 16, 0x6D9D6122); b0 = hh(b0, c0, d0, a0, block[14], 23, 0xFDE5380C);
      a0 = hh(a0, b0, c0, d0, block[1], 4, 0xA4BEEA44); d0 = hh(d0, a0, b0, c0, block[4], 11, 0x4BDECFA9);
      c0 = hh(c0, d0, a0, b0, block[7], 16, 0xF6BB4B60); b0 = hh(b0, c0, d0, a0, block[10], 23, 0xBEBFBC70);
      a0 = hh(a0, b0, c0, d0, block[13], 4, 0x289B7EC6); d0 = hh(d0, a0, b0, c0, block[0], 11, 0xEAA127FA);
      c0 = hh(c0, d0, a0, b0, block[3], 16, 0xD4EF3085); b0 = hh(b0, c0, d0, a0, block[6], 23, 0x04881D05);
      a0 = hh(a0, b0, c0, d0, block[9], 4, 0xD9D4D039); d0 = hh(d0, a0, b0, c0, block[12], 11, 0xE6DB99E5);
      c0 = hh(c0, d0, a0, b0, block[15], 16, 0x1FA27CF8); b0 = hh(b0, c0, d0, a0, block[2], 23, 0xF4FF5A2D);

      // Round 4
      a0 = ii(a0, b0, c0, d0, block[0], 6, 0xF7537E82); d0 = ii(d0, a0, b0, c0, block[7], 10, 0xFD935A3F);
      c0 = ii(c0, d0, a0, b0, block[14], 15, 0x3EAB66EE); b0 = ii(b0, c0, d0, a0, block[5], 21, 0x85A308D3);
      a0 = ii(a0, b0, c0, d0, block[12], 6, 0x13192A82); d0 = ii(d0, a0, b0, c0, block[3], 10, 0xAF1C451E);
      c0 = ii(c0, d0, a0, b0, block[10], 15, 0x980C9F8A); b0 = ii(b0, c0, d0, a0, block[1], 21, 0x2016D4D3);
      a0 = ii(a0, b0, c0, d0, block[8], 6, 0x49B40821); d0 = ii(d0, a0, b0, c0, block[15], 10, 0xF61E2562);
      c0 = ii(c0, d0, a0, b0, block[6], 15, 0xC040B340); b0 = ii(b0, c0, d0, a0, block[13], 21, 0x265E5A51);
      a0 = ii(a0, b0, c0, d0, block[4], 6, 0xD62F105D); d0 = ii(d0, a0, b0, c0, block[11], 10, 0x02441453);
      c0 = ii(c0, d0, a0, b0, block[2], 15, 0xD8A1E681); b0 = ii(b0, c0, d0, a0, block[9], 21, 0xE7D3FBC8);

      a0 = addUnsigned(a0, 0x67462301); b0 = addUnsigned(b0, 0xEFCDAB89);
      c0 = addUnsigned(c0, 0x98BADCFE); d0 = addUnsigned(d0, 0x10325476);
    }

    const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
    return hex(a0) + hex(b0) + hex(c0) + hex(d0);
  }

  return toWordArray(utf8Bytes);
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
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">哈希生成器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">计算文本的 MD5、SHA-1、SHA-256、SHA-512 哈希值</p>
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
                : 'bg-white/5 text-[#666] hover:text-white hover:bg-white/10'
            }`}
          >
            {ALGORITHM_CONFIGS[algo].label}
          </button>
        ))}
      </motion.div>

      {/* Input */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-[#a8b2c1]">输入文本</label>
          <span className="text-xs text-[#666]">{input.length} 字符</span>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入要计算哈希值的文本..."
          aria-label="输入文本"
          className="tool-area w-full h-[160px] p-4 text-sm leading-relaxed resize-none outline-none focus:border-[#f472b6]/30 transition-colors placeholder:text-[#333]"
        />
      </motion.div>

      {/* Result */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#f472b6]" />
            <h3 className="text-sm font-semibold text-white">{config.label} 哈希值</h3>
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

        <div className={`font-mono text-base sm:text-lg break-all leading-relaxed tracking-wide p-4 rounded-xl bg-black/30 border border-white/5 ${
          algorithm === 'SHA-512' ? 'text-xs sm:text-sm' : ''
        }`} style={{ color: config.color }}>
          {hashResult ? formatHash(hashResult) : (
            <span className="text-[#333]">等待输入...</span>
          )}
        </div>

        {hashResult && (
          <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center gap-4 text-xs text-[#666]">
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
              algorithm === key ? 'ring-1 ring-[#f472b6]/30' : 'hover:bg-white/5'
            }`}
          >
            <div className="text-xs font-medium text-[#666] mb-1">{cfg.label}</div>
            <div className="text-sm font-mono font-bold" style={{ color: cfg.color }}>{cfg.length} 位</div>
          </button>
        ))}
      </motion.div>
    </div>
  );
}

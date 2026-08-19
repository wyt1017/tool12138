import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Hash, Upload, Copy, Trash2, FileIcon, Loader2 } from 'lucide-react';

type Algorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512';

// MD5 Implementation for ArrayBuffer (byte-level, UTF-8 compatible)
function md5ArrayBuffer(buffer: ArrayBuffer): string {
  const uint8 = new Uint8Array(buffer);

  function add32(a: number, b: number): number {
    return (a + b) & 0xffffffff;
  }
  function leftRotate(n: number, c: number): number {
    return (n << c) | (n >>> (32 - c));
  }
  function f(x: number, y: number, z: number): number { return (x & y) | (~x & z); }
  function g(x: number, y: number, z: number): number { return (x & z) | (y & ~z); }
  function h(x: number, y: number, z: number): number { return x ^ y ^ z; }
  function i(x: number, y: number, z: number): number { return y ^ (x | ~z); }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = add32(a, add32(add32(f(b, c, d), x), ac));
    return add32(leftRotate(a, s), b);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = add32(a, add32(add32(g(b, c, d), x), ac));
    return add32(leftRotate(a, s), b);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = add32(a, add32(add32(h(b, c, d), x), ac));
    return add32(leftRotate(a, s), b);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = add32(a, add32(add32(i(b, c, d), x), ac));
    return add32(leftRotate(a, s), b);
  }

  const n = uint8.length;
  const state = [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476];

  // Padding: append 0x80 + zeros + length in bits (little-endian)
  const totalBytes = Math.floor((n + 8) / 64) * 64 + 64;
  const padded = new Uint8Array(totalBytes);
  padded.set(uint8);
  padded[n] = 0x80;
  // Append bit length as 64-bit little-endian
  const bitLen = BigInt(n) * 8n;
  padded[totalBytes - 4] = Number((bitLen & 0xffn) >> 0n);
  padded[totalBytes - 5] = Number((bitLen & 0xff00n) >> 8n);
  padded[totalBytes - 6] = Number((bitLen & 0xff0000n) >> 16n);
  padded[totalBytes - 7] = Number((bitLen & 0xff000000n) >> 24n);
  padded[totalBytes - 8] = Number((bitLen & 0xff00000000n) >> 32n);
  padded[totalBytes - 9] = Number((bitLen & 0xff0000000000n) >> 40n);
  padded[totalBytes - 10] = Number((bitLen & 0xff000000000000n) >> 48n);
  padded[totalBytes - 11] = Number((bitLen & 0xff00000000000000n) >> 56n);

  for (let i = 0; i < totalBytes; i += 64) {
    const block: number[] = [];
    for (let j = 0; j < 16; j++) {
      block[j] = padded[i + j * 4] | (padded[i + j * 4 + 1] << 8) | (padded[i + j * 4 + 2] << 16) | (padded[i + j * 4 + 3] << 24);
    }

    let a = state[0], b = state[1], c = state[2], d = state[3];

    // Round 1
    a = ff(a, b, c, d, block[0], 7, 0xd76aa478); d = ff(d, a, b, c, block[1], 12, 0xe8c7b756);
    c = ff(c, d, a, b, block[2], 17, 0x242070db); b = ff(b, c, d, a, block[3], 22, 0xc1bdceee);
    a = ff(a, b, c, d, block[4], 7, 0xf57c0faf); d = ff(d, a, b, c, block[5], 12, 0x4787c62a);
    c = ff(c, d, a, b, block[6], 17, 0xa8304613); b = ff(b, c, d, a, block[7], 22, 0xfd469501);
    a = ff(a, b, c, d, block[8], 7, 0x698098d8); d = ff(d, a, b, c, block[9], 12, 0x8b44f7af);
    c = ff(c, d, a, b, block[10], 17, 0xffff5bb1); b = ff(b, c, d, a, block[11], 22, 0x895cd7be);
    a = ff(a, b, c, d, block[12], 7, 0x6b901122); d = ff(d, a, b, c, block[13], 12, 0xfd987193);
    c = ff(c, d, a, b, block[14], 17, 0xa679438e); b = ff(b, c, d, a, block[15], 22, 0x49b40821);
    // Round 2
    a = gg(a, b, c, d, block[1], 5, 0xf61e2562); d = gg(d, a, b, c, block[6], 9, 0xc040b340);
    c = gg(c, d, a, b, block[11], 14, 0x265e5a51); b = gg(b, c, d, a, block[0], 20, 0xe9b6c7aa);
    a = gg(a, b, c, d, block[5], 5, 0xd62f105d); d = gg(d, a, b, c, block[10], 9, 0x02441453);
    c = gg(c, d, a, b, block[15], 14, 0xd8a1e681); b = gg(b, c, d, a, block[4], 20, 0xe7d3fbc8);
    a = gg(a, b, c, d, block[9], 5, 0x21e1cde6); d = gg(d, a, b, c, block[14], 9, 0xc33707d6);
    c = gg(c, d, a, b, block[3], 14, 0xf4d50d87); b = gg(b, c, d, a, block[8], 20, 0x455a14ed);
    a = gg(a, b, c, d, block[13], 5, 0xa9e3e905); d = gg(d, a, b, c, block[2], 9, 0xfcefa3f8);
    c = gg(c, d, a, b, block[7], 14, 0x676f02d9); b = gg(b, c, d, a, block[12], 20, 0x8d2a4c8a);
    // Round 3
    a = hh(a, b, c, d, block[5], 4, 0xfffa3942); d = hh(d, a, b, c, block[8], 11, 0x8771f681);
    c = hh(c, d, a, b, block[11], 16, 0x6d9d6122); b = hh(b, c, d, a, block[14], 23, 0xfde5380c);
    a = hh(a, b, c, d, block[1], 4, 0xa4beea44); d = hh(d, a, b, c, block[4], 11, 0x4bdecfa9);
    c = hh(c, d, a, b, block[7], 16, 0xf6bb4b60); b = hh(b, c, d, a, block[10], 23, 0xbebfbc70);
    a = hh(a, b, c, d, block[13], 4, 0x289b7ec6); d = hh(d, a, b, c, block[0], 11, 0xeaa127fa);
    c = hh(c, d, a, b, block[3], 16, 0xd4ef3085); b = hh(b, c, d, a, block[6], 23, 0x04881d05);
    a = hh(a, b, c, d, block[9], 4, 0xd9d4d039); d = hh(d, a, b, c, block[12], 11, 0xe6db99e5);
    c = hh(c, d, a, b, block[15], 16, 0x1fa27cf8); b = hh(b, c, d, a, block[2], 23, 0xf4ff5a2d);
    // Round 4
    a = ii(a, b, c, d, block[0], 6, 0xf7537e82); d = ii(d, a, b, c, block[7], 10, 0xfd935a3f);
    c = ii(c, d, a, b, block[14], 15, 0x3eab66ee); b = ii(b, c, d, a, block[5], 21, 0x85a308d3);
    a = ii(a, b, c, d, block[12], 6, 0x13192a82); d = ii(d, a, b, c, block[3], 10, 0xaf1c451e);
    c = ii(c, d, a, b, block[10], 15, 0x980c9f8a); b = ii(b, c, d, a, block[1], 21, 0x2016d4d3);
    a = ii(a, b, c, d, block[8], 6, 0x49b40821); d = ii(d, a, b, c, block[15], 10, 0xf61e2562);
    c = ii(c, d, a, b, block[6], 15, 0xc040b340); b = ii(b, c, d, a, block[13], 21, 0x265e5a51);
    a = ii(a, b, c, d, block[4], 6, 0xd62f105d); d = ii(d, a, b, c, block[11], 10, 0x02441453);
    c = ii(c, d, a, b, block[2], 15, 0xd8a1e681); b = ii(b, c, d, a, block[9], 21, 0xe7d3fbc8);

    state[0] = add32(state[0], a);
    state[1] = add32(state[1], b);
    state[2] = add32(state[2], c);
    state[3] = add32(state[3], d);
  }

  return state.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
}

async function calculateFileHash(file: File, algorithm: Algorithm): Promise<string> {
  const buffer = await file.arrayBuffer();
  if (algorithm === 'MD5') {
    return md5ArrayBuffer(buffer);
  } else {
    const hashBuffer = await crypto.subtle.digest(algorithm, buffer);
    return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const ALGORITHMS: Algorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512'];

export default function FileHash() {
  const [file, setFile] = useState<File | null>(null);
  const [selectedAlgos, setSelectedAlgos] = useState<Set<Algorithm>>(new Set(['MD5', 'SHA-256']));
  const [results, setResults] = useState<Record<Algorithm, string>>({} as Record<Algorithm, string>);
  const [calculating, setCalculating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copiedAlgo, setCopiedAlgo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setResults({} as Record<Algorithm, string>);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults({} as Record<Algorithm, string>);
    }
  };

  const toggleAlgo = (algo: Algorithm) => {
    setSelectedAlgos((prev) => {
      const next = new Set(prev);
      if (next.has(algo)) next.delete(algo);
      else next.add(algo);
      return next;
    });
  };

  const handleCalculate = async () => {
    if (!file || selectedAlgos.size === 0) return;
    setCalculating(true);
    setProgress(0);
    setResults({} as Record<Algorithm, string>);
    const newResults: Record<Algorithm, string> = {} as Record<Algorithm, string>;
    const algos = Array.from(selectedAlgos);
    for (let i = 0; i < algos.length; i++) {
      newResults[algos[i]] = await calculateFileHash(file, algos[i]);
      setProgress(((i + 1) / algos.length) * 100);
    }
    setResults(newResults);
    setCalculating(false);
  };

  const handleCopy = async (algo: Algorithm) => {
    await navigator.clipboard.writeText(results[algo]);
    setCopiedAlgo(algo);
    setTimeout(() => setCopiedAlgo(null), 2000);
  };

  const formatHash = (hash: string): string => {
    if (!hash) return '';
    const groupSize = hash.length > 64 ? 8 : 4;
    return hash.match(new RegExp(`.{1,${groupSize}}`, 'g'))?.join(' ') ?? hash;
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#6bcb77]/15 flex items-center justify-center">
            <Hash size={20} className="text-[#6bcb77]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">文件哈希计算</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">计算文件的 MD5、SHA-1、SHA-256、SHA-512 哈希值</p>
      </motion.div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className={`glass-card p-8 mb-6 cursor-pointer transition-all border-2 border-dashed ${
          file ? 'border-[#6bcb77]/30' : 'border-white/10 hover:border-[#6bcb77]/40'
        }`}
      >
        <input ref={fileInputRef} type="file" onChange={handleFileSelect} aria-label="选择文件" className="sr-only" />
        {file ? (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#6bcb77]/15 flex items-center justify-center flex-shrink-0">
              <FileIcon size={24} className="text-[#6bcb77]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white font-medium truncate">{file.name}</p>
              <p className="text-sm text-[#666]">{formatFileSize(file.size)}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setResults({} as Record<Algorithm, string>);
              }}
              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 size={18} className="text-[#666] hover:text-red-400" />
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <Upload size={40} className="mx-auto text-[#333] mb-3" />
            <p className="text-[#666] text-sm">拖拽文件到此处，或点击选择文件</p>
          </div>
        )}
      </motion.div>

      {/* Algorithm Selection */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-3 mb-6">
        {ALGORITHMS.map((algo) => (
          <button
            key={algo}
            onClick={() => toggleAlgo(algo)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedAlgos.has(algo)
                ? 'bg-[#6bcb77]/15 text-[#6bcb77] ring-1 ring-[#6bcb77]/30'
                : 'bg-white/5 text-[#666] hover:text-white hover:bg-white/10'
            }`}
          >
            {algo}
          </button>
        ))}
      </motion.div>

      {/* Calculate Button */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
        <button
          onClick={handleCalculate}
          disabled={!file || selectedAlgos.size === 0 || calculating}
          className="btn-primary"
        >
          {calculating ? (
            <>
              <Loader2 size={16} className="inline mr-2 animate-spin" /> 计算中...
            </>
          ) : (
            <>
              <Hash size={16} className="inline mr-2" /> 计算哈希值
            </>
          )}
        </button>
        {calculating && (
          <div className="mt-3 w-full max-w-xs">
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-[#6bcb77] rounded-full" />
            </div>
            <p className="text-xs text-[#666] mt-1">处理进度：{Math.round(progress)}%</p>
          </div>
        )}
      </motion.div>

      {/* Results */}
      {Object.keys(results).length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-3">
          {ALGORITHMS.filter((a) => results[a]).map((algo) => (
            <div key={algo} className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#6bcb77]" />
                  <span className="text-sm font-semibold text-white">{algo}</span>
                </div>
                <button onClick={() => handleCopy(algo)} className="btn-secondary !py-1 !px-2.5 text-xs">
                  {copiedAlgo === algo ? (
                    <span className="text-green-400">已复制</span>
                  ) : (
                    <>
                      <Copy size={12} className="inline mr-1" /> 复制
                    </>
                  )}
                </button>
              </div>
              <div className="font-mono text-xs sm:text-sm break-all leading-relaxed tracking-wide p-3 rounded-lg bg-black/30 text-[#6bcb77]">
                {formatHash(results[algo])}
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {!file && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card p-12 text-center">
          <Hash size={48} className="mx-auto text-[#222] mb-4" />
          <p className="text-[#555] text-sm">请先上传一个文件以计算其哈希值</p>
        </motion.div>
      )}
    </div>
  );
}

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Hash, Upload, Copy, Trash2, FileIcon, Loader2 } from 'lucide-react';

type Algorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512';

// MD5 Implementation (RFC 1321) for ArrayBuffer (byte-level, UTF-8 compatible)
function md5ArrayBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  // Padding: byte message + 0x80 + zeros + 64-bit bit-length (little-endian)
  let msg: number[] = Array.from(bytes);
  msg.push(0x80);
  while (msg.length % 64 !== 56) msg.push(0);
  const bitLenHi = Math.floor(bytes.length / 0x20000000);
  const bitLenLo = (bytes.length << 3) >>> 0;
  for (let i = 0; i < 4; i++) msg.push((bitLenLo >> (8 * i)) & 0xff);
  for (let i = 0; i < 4; i++) msg.push((bitLenHi >> (8 * i)) & 0xff);

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
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">文件哈希计算</h1>
        </div>
        <p className="text-[var(--text-secondary)] ml-[52px]">计算文件的 MD5、SHA-1、SHA-256、SHA-512 哈希值</p>
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
          file ? 'border-[#6bcb77]/30' : 'border-[var(--border-color)] hover:border-[#6bcb77]/40'
        }`}
      >
        <input ref={fileInputRef} type="file" onChange={handleFileSelect} aria-label="选择文件" className="sr-only" />
        {file ? (
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#6bcb77]/15 flex items-center justify-center flex-shrink-0">
              <FileIcon size={24} className="text-[#6bcb77]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[var(--text-primary)] font-medium truncate">{file.name}</p>
              <p className="text-sm text-[var(--text-faint)]">{formatFileSize(file.size)}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
                setResults({} as Record<Algorithm, string>);
              }}
              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 size={18} className="text-[var(--text-faint)] hover:text-[var(--danger)]" />
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            <Upload size={40} className="mx-auto text-[var(--text-faint)] mb-3" />
            <p className="text-[var(--text-faint)] text-sm">拖拽文件到此处，或点击选择文件</p>
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
                : 'bg-[var(--bg-hover)] text-[var(--text-faint)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
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
            <div className="w-full h-1.5 bg-[var(--bg-hover)] rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-[#6bcb77] rounded-full" />
            </div>
            <p className="text-xs text-[var(--text-faint)] mt-1">处理进度：{Math.round(progress)}%</p>
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
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{algo}</span>
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
          <p className="text-[var(--text-faint)] text-sm">请先上传一个文件以计算其哈希值</p>
        </motion.div>
      )}
    </div>
  );
}

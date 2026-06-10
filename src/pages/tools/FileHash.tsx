import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Hash, Upload, Copy, Trash2, FileIcon, Loader2 } from 'lucide-react';

type Algorithm = 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512';

// MD5 Implementation for ArrayBuffer
function md5ArrayBuffer(buffer: ArrayBuffer): string {
  const uint8 = new Uint8Array(buffer);
  let str = '';
  for (let i = 0; i < uint8.length; i++) {
    str += String.fromCharCode(uint8[i]);
  }

  function md5cycle(x: number[], k: number[]) {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
  }
  function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }
  function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }
  function md51(s: string) {
    const n = s.length;
    const state = [1732584193, -271733879, -1732584194, 271733878];
    let i: number;
    for (i = 64; i <= s.length; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) { md5cycle(state, tail); for (i = 0; i < 16; i++) tail[i] = 0; }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }
  function md5blk(s: string) {
    const md5blks: number[] = [];
    let i: number;
    for (i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }
  const hex_chr = '0123456789abcdef'.split('');
  function rhex(n: number) {
    let s = '', j = 0;
    for (; j < 4; j++) s += hex_chr[(n >> (j * 8 + 4)) & 0x0f] + hex_chr[(n >> (j * 8)) & 0x0f];
    return s;
  }
  function hex(x: number[]) { return x.map(rhex).join(''); }
  function add32(a: number, b: number) { return (a + b) & 0xffffffff; }
  return hex(md51(str));
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

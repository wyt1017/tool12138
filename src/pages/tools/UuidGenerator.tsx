import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, Copy, Trash2, ClipboardList } from 'lucide-react';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback implementation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const array = new Uint8Array(1);
    crypto.getRandomValues(array);
    const r = array[0] % 16;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function formatUUID(uuid: string, withDashes: boolean, uppercase: boolean): string {
  let formatted = uuid;
  if (!withDashes) {
    formatted = uuid.replace(/-/g, '');
  }
  return uppercase ? formatted.toUpperCase() : formatted.toLowerCase();
}

export default function UuidGenerator() {
  const [count, setCount] = useState(5);
  const [withDashes, setWithDashes] = useState(true);
  const [uppercase, setUppercase] = useState(false);
  const [uuids, setUuids] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  const handleGenerate = useCallback(() => {
    const newUuids: string[] = [];
    for (let i = 0; i < count; i++) {
      const raw = generateUUID();
      newUuids.push(formatUUID(raw, withDashes, uppercase));
    }
    setUuids(newUuids);
    setHistory((prev) => [...newUuids.slice(0, 10), ...prev].slice(0, 10));
  }, [count, withDashes, uppercase]);

  const handleCopySingle = async (uuid: string, index: number) => {
    await navigator.clipboard.writeText(uuid);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(uuids.join('\n'));
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/15 flex items-center justify-center">
            <Fingerprint size={20} className="text-[#38bdf8]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">UUID/GUID 生成器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">批量生成标准 UUID v4 标识符，支持多种格式</p>
      </motion.div>

      {/* Options */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 mb-6">
        {/* Count Slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-[#a8b2c1]">生成数量</label>
            <span className="text-lg font-bold text-white font-mono bg-white/5 px-3 py-1 rounded-lg">{count}</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            aria-label="生成数量"
            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#38bdf8]"
          />
          <div className="flex justify-between text-xs text-[#666] mt-1">
            <span>1</span>
            <span>100</span>
          </div>
        </div>

        {/* Format Options */}
        <div className="mb-6">
          <label className="text-sm font-medium text-[#a8b2c1] mb-3 block">格式选项</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setWithDashes(!withDashes)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                withDashes ? 'border-[#38bdf8]/30 bg-[#38bdf8]/10 text-white' : 'border-white/10 bg-white/5 text-[#666]'
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${withDashes ? 'border-[#38bdf8] bg-[#38bdf8]' : 'border-[#444]'}`}>
                {withDashes && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">包含横线</div>
                <div className="text-xs opacity-50 font-mono">xxxxxxxx-xxxx...</div>
              </div>
            </button>

            <button
              onClick={() => setUppercase(!uppercase)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                uppercase ? 'border-[#38bdf8]/30 bg-[#38bdf8]/10 text-white' : 'border-white/10 bg-white/5 text-[#666]'
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${uppercase ? 'border-[#38bdf8] bg-[#38bdf8]' : 'border-[#444]'}`}>
                {uppercase && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div className="text-left">
                <div className="text-sm font-medium">大写字母</div>
                <div className="text-xs opacity-50 font-mono">ABCDEF... vs abcdef...</div>
              </div>
            </button>
          </div>

          {/* Preview */}
          <div className="mt-4 p-3 rounded-xl bg-black/30 border border-white/5">
            <div className="text-xs text-[#666] mb-1">格式预览</div>
            <div className="font-mono text-sm" style={{ color: '#38bdf8' }}>
              {formatUUID('550e8400-e29b-41d4-a716-446655440000', withDashes, uppercase)}
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <button onClick={handleGenerate} className="btn-primary w-full py-3 text-base">
          <Fingerprint size={18} className="inline mr-2" /> 生成 {count} 个 UUID
        </button>
      </motion.div>

      {/* Results */}
      {uuids.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">生成结果 ({uuids.length} 个)</h2>
            <div className="flex gap-2">
              <button onClick={handleCopyAll} className="btn-secondary !py-1.5 !px-3 text-xs">
                {allCopied ? (
                  <span className="text-green-400">已复制全部</span>
                ) : (
                  <>
                    <ClipboardList size={13} className="inline mr-1" /> 复制全部
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {uuids.map((uuid, index) => (
              <div key={index} className="glass-card p-4 group flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs text-[#666] shrink-0 w-6 text-right">{index + 1}</span>
                  <code className="font-mono text-sm break-all" style={{ color: '#38bdf8' }}>{uuid}</code>
                </div>
                <button
                  onClick={() => handleCopySingle(uuid, index)}
                  className="btn-secondary !py-1.5 !px-2.5 text-xs shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {copiedIndex === index ? (
                    <span className="text-green-400">已复制</span>
                  ) : (
                    <>
                      <Copy size={12} className="inline mr-1" /> 复制
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* History */}
      {history.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#666] flex items-center gap-2">
              <ClipboardList size={14} /> 生成历史 (最近{Math.min(history.length, 10)}个)
            </h2>
            <button onClick={() => setHistory([])} className="text-xs text-[#666] hover:text-red-400 transition-colors flex items-center gap-1">
              <Trash2 size={12} /> 清空历史
            </button>
          </div>
          <div className="space-y-1.5">
            {history.map((uuid, index) => (
              <div key={index} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/5 transition-colors group/history">
                <span className="text-xs text-[#444] w-5 text-right">{index + 1}</span>
                <code className="font-mono text-xs text-[#666] truncate flex-1">{uuid}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(uuid);
                  }}
                  className="opacity-0 group-hover/history:opacity-100 text-[#444] hover:text-[#38bdf8] transition-all"
                >
                  <Copy size={12} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

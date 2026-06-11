import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Copy, Trash2, Shuffle } from 'lucide-react';

type SortMode = 'asc' | 'desc' | 'lenAsc' | 'lenDesc' | 'numAsc' | 'numDesc' | 'random';

const SORT_OPTIONS: { value: SortMode; label: string; icon: string }[] = [
  { value: 'asc', label: '字母 A→Z', icon: 'A-Z' },
  { value: 'desc', label: '字母 Z→A', icon: 'Z-A' },
  { value: 'lenAsc', label: '长度 短→长', icon: '短→长' },
  { value: 'lenDesc', label: '长度 长→短', icon: '长→短' },
  { value: 'numAsc', label: '数字 小→大', icon: '0→9' },
  { value: 'numDesc', label: '数字 大→小', icon: '9→0' },
  { value: 'random', label: '随机打乱', icon: '🎲' },
];

function sortLines(lines: string[], mode: SortMode): string[] {
  const filtered = lines.filter((l) => l.trim() !== '');
  switch (mode) {
    case 'asc':
      return [...filtered].sort((a, b) => a.localeCompare(b, 'zh-CN'));
    case 'desc':
      return [...filtered].sort((a, b) => b.localeCompare(a, 'zh-CN'));
    case 'lenAsc':
      return [...filtered].sort((a, b) => a.length - b.length);
    case 'lenDesc':
      return [...filtered].sort((a, b) => b.length - a.length);
    case 'numAsc':
      return [...filtered].sort((a, b) => {
        const na = parseFloat(a.replace(/[^\d.-]/g, '')) || 0;
        const nb = parseFloat(b.replace(/[^\d.-]/g, '')) || 0;
        return na - nb;
      });
    case 'numDesc':
      return [...filtered].sort((a, b) => {
        const na = parseFloat(a.replace(/[^\d.-]/g, '')) || 0;
        const nb = parseFloat(b.replace(/[^\d.-]/g, '')) || 0;
        return nb - na;
      });
    case 'random': {
      const arr = [...filtered];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    default:
      return filtered;
  }
}

export default function TextSorter() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<SortMode>('asc');
  const [dedupe, setDedupe] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shuffleKey, setShuffleKey] = useState(0);

  const inputLines = input.split('\n');
  const originalCount = inputLines.filter((l) => l.trim() !== '').length;

  const sortedLines = useMemo(() => {
    let lines = input.split('\n');
    if (dedupe) {
      const seen = new Set<string>();
      lines = lines.filter((l) => {
        if (l.trim() === '') return false;
        if (seen.has(l)) return false;
        seen.add(l);
        return true;
      });
    }
    return sortLines(lines, mode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, mode, dedupe, shuffleKey]);

  const sortedText = sortedLines.join('\n');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sortedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/15 flex items-center justify-center">
            <ArrowUpDown size={20} className="text-[#38bdf8]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">文本排序</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">多维度文本排序：字母、长度、数值、随机打乱</p>
      </motion.div>

      {/* Sort Mode Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-2 mb-6">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setMode(opt.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              mode === opt.value
                ? 'bg-[#38bdf8]/15 text-[#38bdf8] ring-1 ring-[#38bdf8]/30'
                : 'bg-white/5 text-[#666] hover:text-white hover:bg-white/10'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </motion.div>

      {/* Options */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex items-center gap-6 mb-6">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${dedupe ? 'bg-[#38bdf8] border-[#38bdf8]' : 'border-[#444]'}`}>
            {dedupe && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="#0a0a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <span className="text-sm text-[#a8b2c1]">去重空行</span>
          <input type="checkbox" checked={dedupe} onChange={(e) => setDedupe(e.target.checked)} aria-label="去重空行" className="sr-only" />
        </label>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[#a8b2c1] ml-1">输入文本</label>
            <span className="text-xs text-[#666]">{originalCount} 行</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入多行文本，每行一个条目..."
            aria-label="输入文本"
            className="tool-area w-full h-[360px] p-4 text-white text-sm leading-relaxed resize-none outline-none focus:border-[#38bdf8]/30 transition-colors placeholder:text-[#333]"
          />
          <div className="flex gap-3 mt-3">
            <button onClick={() => setInput('')} disabled={!input} className="btn-secondary !px-4 disabled:opacity-30">
              <Trash2 size={15} className="inline mr-1.5" /> 清空
            </button>
          </div>
        </motion.div>

        {/* Output */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-[#a8b2c1] ml-1">
              排序结果{' '}
              {mode === 'random' && <Shuffle size={13} className="inline ml-1 text-[#38bdf8]" />}
            </label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#666]">{sortedLines.length} 行</span>
              {mode === 'random' && sortedText && (
                <button onClick={() => setShuffleKey((k) => k + 1)} className="btn-secondary !py-1.5 !px-3 text-xs">
                  <Shuffle size={13} className="inline mr-1" /> 重新打乱
                </button>
              )}
              {sortedText && (
                <button onClick={handleCopy} className="btn-secondary !py-1.5 !px-3 text-xs">
                  {copied ? (
                    <span className="text-green-400">已复制</span>
                  ) : (
                    <>
                      <Copy size={13} className="inline mr-1" /> 复制
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          <div className={`tool-area w-full h-[360px] p-4 overflow-auto ${!sortedText ? 'flex items-center justify-center' : ''}`}>
            {sortedText ? (
              <pre className="text-white text-sm leading-relaxed whitespace-pre-wrap break-all font-mono">{sortedText}</pre>
            ) : (
              <span className="text-[#333] text-sm">排序结果将在此显示...</span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Stats Bar */}
      {input && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-4 mt-6 flex flex-wrap items-center gap-6 text-sm">
          <span className="text-[#666]">
            原始 <strong className="text-white">{originalCount}</strong> 行
            <ArrowUpDown size={14} className="inline mx-2 text-[#38bdf8]" />
            排序后 <strong className="text-white">{sortedLines.length}</strong> 行
            {originalCount !== sortedLines.length && (
              <span className="ml-2 text-amber-400">(去除 {originalCount - sortedLines.length} 行重复/空行)</span>
            )}
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#38bdf8]/10 text-[#38bdf8] text-xs font-medium">
            {SORT_OPTIONS.find((o) => o.value === mode)?.label}
          </span>
        </motion.div>
      )}
    </div>
  );
}

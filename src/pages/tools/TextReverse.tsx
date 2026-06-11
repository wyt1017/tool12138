import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Copy, RotateCcw, Shuffle } from 'lucide-react';

type ReverseMode = 'full' | 'line' | 'word' | 'shuffle' | 'reverseLine';

const MODES: { key: ReverseMode; label: string; desc: string; icon: string }[] = [
  { key: 'full', label: '全部倒序', desc: '整个文本字符完全反转', icon: '↔️' },
  { key: 'line', label: '每行倒序', desc: '每行内容分别反转字符顺序', icon: '📝' },
  { key: 'word', label: '单词倒序', desc: '以空格分隔，单词顺序反转', icon: '📃' },
  { key: 'shuffle', label: '字符乱序', desc: '随机打乱每个字符位置', icon: '🎲' },
  { key: 'reverseLine', label: '行顺序反转', desc: '行与行之间交换顺序', icon: '🔄' },
];

function shuffleString(str: string): string {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

export default function TextReverse() {
  const [input, setInput] = useState('');
  const [activeMode, setActiveMode] = useState<ReverseMode>('full');
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    if (!input) return '';

    switch (activeMode) {
      case 'full':
        return input.split('').reverse().join('');

      case 'line':
        return input.split('\n').map((line) => line.split('').reverse().join('')).join('\n');

      case 'word':
        // 过滤空字符串，避免多余空格
        return input.split(/\s+/).filter(Boolean).reverse().join(' ');

      case 'shuffle':
        return shuffleString(input);

      case 'reverseLine':
        return input.split('\n').reverse().join('\n');

      default:
        return input;
    }
  }, [input, activeMode]);

  const originalCount = useMemo(() => input.length, [input]);
  const resultCount = useMemo(() => result.length, [result]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleShuffleAgain = useCallback(() => {
    if (!input || activeMode !== 'shuffle') return;
    // Force re-render by toggling a dummy state
    setInput((prev) => prev + '');
  }, [input, activeMode]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#38bdf8]/15 flex items-center justify-center">
            <ArrowLeftRight size={20} className="text-[#38bdf8]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">文本反转排序</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">多种文本反转和排序模式，支持字符、单词、行级别操作</p>
      </motion.div>

      {/* Mode Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {MODES.map((mode) => (
          <button
            key={mode.key}
            onClick={() => setActiveMode(mode.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeMode === mode.key
                ? 'bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30'
                : 'bg-white/5 text-[#666] border border-transparent hover:bg-white/10'
            }`}
          >
            <span>{mode.icon}</span>
            <span>{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Mode Description */}
      <motion.div
        key={activeMode}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <p className="text-xs text-[#666] ml-1">
          当前模式：<span className="text-[#38bdf8]">{MODES.find((m) => m.key === activeMode)?.label}</span> —{' '}
          {MODES.find((m) => m.key === activeMode)?.desc}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Area */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">原始文本</label>
            <span className="text-xs text-[#555]">{originalCount} 字符</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入要处理的文本..."
            aria-label="原始文本"
            className="tool-area w-full h-[360px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#38bdf8]/30 transition-colors placeholder:text-[#333]"
          />
        </motion.div>

        {/* Output Area */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#38bdf8]">处理结果</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#555]">{resultCount} 字符</span>
              {result && (
                <>
                  {activeMode === 'shuffle' && (
                    <button onClick={handleShuffleAgain} className="btn-secondary !py-1 !px-2 text-xs">
                      <Shuffle size={12} className="inline" />
                    </button>
                  )}
                  <button onClick={handleCopy} className="btn-secondary !py-1 !px-3 text-xs">
                    <Copy size={12} className="inline mr-1" /> {copied ? '已复制' : '复制'}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className={`tool-area w-full h-[360px] overflow-y-auto p-5 text-sm leading-relaxed ${!result ? '' : ''}`}>
            {result ? (
              <pre className="whitespace-pre-wrap font-sans text-[#f0f0f5]">{result}</pre>
            ) : (
              <span className="text-[#333]">处理结果将显示在这里...</span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Stats Bar */}
      {input && result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4 glass-card p-4 flex items-center justify-around">
          <div className="text-center">
            <p className="text-xs text-[#666]">原始</p>
            <p className="text-lg font-bold text-white font-mono">{originalCount}</p>
            <p className="text-[10px] text-[#555]">字符</p>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <p className="text-xs text-[#666]">处理后</p>
            <p className="text-lg font-bold text-[#38bdf8] font-mono">{resultCount}</p>
            <p className="text-[10px] text-[#555]">字符</p>
          </div>
          <div className="w-px h-10 bg-white/10" />
          <div className="text-center">
            <p className="text-xs text-[#666]">变化</p>
            <p className={`text-lg font-bold font-mono ${resultCount !== originalCount ? 'text-[#fb923c]' : 'text-[#6bcb77]'}`}>
              {resultCount === originalCount ? '=' : resultCount > originalCount ? '+' : '-'}
              {Math.abs(resultCount - originalCount)}
            </p>
            <p className="text-[10px] text-[#555]">字符</p>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="flex items-center gap-3 mt-6">
        <button onClick={() => setInput('')} disabled={!input} className="btn-secondary disabled:opacity-30">
          <RotateCcw size={15} className="inline mr-1.5" /> 清空
        </button>
      </motion.div>
    </div>
  );
}

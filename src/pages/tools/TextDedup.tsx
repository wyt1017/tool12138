import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Filter, Copy, Trash2, ArrowUpDown, MinusCircle, AlignLeft, SortAsc, SortDesc } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';

interface CheckboxOptionProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  children?: ReactNode;
}

function CheckboxOption({ checked, onChange, label, children }: CheckboxOptionProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <label
      className="flex items-center gap-2 cursor-pointer group"
      onClick={() => onChange(!checked)}
    >
      <div
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={`w-4 h-4 rounded border transition-all flex items-center justify-center outline-none focus:ring-2 focus:ring-[#6bcb77]/50 ${
          checked ? 'bg-[#6bcb77] border-[#6bcb77]' : 'border-[#444] group-hover:border-[#666]'
        }`}
      >
        {checked && <MinusCircle size={10} className="text-white" strokeWidth={3} />}
      </div>
      <span className="text-sm text-[#a8b2c1] group-hover:text-white transition-colors">
        {children}
        {label}
      </span>
    </label>
  );
}

const SORT_OPTIONS = [
  { value: 'none' as const, label: '不排序' },
  { value: 'asc' as const, label: '升序', Icon: SortAsc },
  { value: 'desc' as const, label: '降序', Icon: SortDesc },
];

export default function TextDedup() {
  const [input, setInput] = useState('');
  const [dedupLines, setDedupLines] = useState(true);
  const [removeEmpty, setRemoveEmpty] = useState(true);
  const [trimSpaces, setTrimSpaces] = useState(true);
  const [sortOrder, setSortOrder] = useState<'none' | 'asc' | 'desc'>('none');

  const result = useMemo(() => {
    if (!input) return { text: '', originalCount: 0, resultCount: 0, removedCount: 0 };

    let lines = input.split(/\r?\n/);
    const originalCount = lines.length;

    if (trimSpaces) {
      lines = lines.map((line) => line.trim());
    }

    if (removeEmpty) {
      lines = lines.filter((line) => line.length > 0);
    }

    if (dedupLines) {
      const seen = new Set<string>();
      lines = lines.filter((line) => {
        if (seen.has(line)) return false;
        seen.add(line);
        return true;
      });
    }

    if (sortOrder === 'asc') {
      lines.sort((a, b) => a.localeCompare(b, 'zh-CN'));
    } else if (sortOrder === 'desc') {
      lines.sort((a, b) => b.localeCompare(a, 'zh-CN'));
    }

    const resultText = lines.join('\n');
    const removedCount = originalCount - lines.length;

    return { text: resultText, originalCount, resultCount: lines.length, removedCount };
  }, [input, dedupLines, removeEmpty, trimSpaces, sortOrder]);

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(result.text);
    } catch {
      // fallback: use textarea + execCommand
      const textarea = document.createElement('textarea');
      textarea.value = result.text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  };

  const clearAll = () => {
    setInput('');
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#6bcb77]/15 flex items-center justify-center">
            <Filter size={20} className="text-[#6bcb77]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">文本去重</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">多行文本去重、去空行、排序等处理工具</p>
      </motion.div>

      {/* Options Bar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-4 mb-6"
      >
        <div className="flex flex-wrap items-center gap-4">
          <CheckboxOption checked={dedupLines} onChange={setDedupLines} label="去重行" />

          <CheckboxOption checked={removeEmpty} onChange={setRemoveEmpty} label="去空行" />

          <CheckboxOption checked={trimSpaces} onChange={setTrimSpaces} label="去前后空格">
            <AlignLeft size={12} className="inline mr-1" />
          </CheckboxOption>

          <div className="h-5 w-px bg-white/10" />

          <div className="flex items-center gap-1">
            {SORT_OPTIONS.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSortOrder(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  sortOrder === value
                    ? value === 'none'
                      ? 'bg-white/10 text-white'
                      : 'bg-[#6bcb77]/15 text-[#6bcb77]'
                    : 'text-[#666] hover:text-[#a8b2c1]'
                }`}
              >
                {Icon && <Icon size={12} />} {label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats Bar */}
      {input && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap items-center gap-6 mb-4 px-1"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#666]">原始</span>
            <span className="font-mono text-sm text-[#a8b2c1]">{result.originalCount}</span>
            <span className="text-xs text-[#555]">行</span>
          </div>
          <ArrowUpDown size={14} className="text-[#333]" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#666]">处理后</span>
            <span className="font-mono text-sm text-[#6bcb77]">{result.resultCount}</span>
            <span className="text-xs text-[#555]">行</span>
          </div>
          {result.removedCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
                -{result.removedCount} 行
              </span>
            </div>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">原始文本（每行一条）</label>
            {input && (
              <button type="button" onClick={clearAll} className="btn-secondary !py-1.5 !px-3 text-xs !text-red-400">
                <Trash2 size={13} className="inline mr-1" /> 清空
              </button>
            )}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入多行文本，每行一个条目...&#10;&#10;例如：&#10;apple&#10;banana&#10;apple&#10;cherry"
            aria-label="原始文本"
            className="tool-area w-full h-[360px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#6bcb77]/30 transition-colors placeholder:text-[#333]"
          />
        </motion.div>

        {/* Output */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">处理结果</label>
            {result.text && (
              <button type="button" onClick={copyResult} className="btn-secondary !py-1.5 !px-3 text-xs">
                <Copy size={13} className="inline mr-1" /> 复制全部
              </button>
            )}
          </div>
          <textarea
            readOnly
            value={result.text}
            placeholder="处理结果将显示在这里..."
            aria-label="处理结果"
            className="tool-area w-full h-[360px] p-5 text-sm leading-relaxed resize-none outline-none text-[#a8b2c1] placeholder:text-[#333]"
          />
        </motion.div>
      </div>
    </div>
  );
}

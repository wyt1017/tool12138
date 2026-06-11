import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Type, Copy, FileText, Hash } from 'lucide-react';

interface FormatItem {
  label: string;
  value: string;
}

export default function CaseConverter() {
  const [input, setInput] = useState('');

  const formats = useMemo<FormatItem[]>(() => {
    if (!input.trim()) return [];
    return [
      {
        label: 'UPPER CASE',
        value: input.toUpperCase(),
      },
      {
        label: 'lower case',
        value: input.toLowerCase(),
      },
      {
        label: 'Title Case',
        value: input
          .toLowerCase()
          .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase()),
      },
      {
        label: 'camelCase',
        value: input
          .toLowerCase()
          .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
          .replace(/^[A-Z]/, (c) => c.toLowerCase()),
      },
      {
        label: 'snake_case',
        value: input
          .replace(/\s+/g, '_')
          .replace(/([a-z])([A-Z])/g, '$1_$2')
          .toLowerCase(),
      },
      {
        label: 'kebab-case',
        value: input
          .replace(/\s+/g, '-')
          .replace(/([a-z])([A-Z])/g, '$1-$2')
          .toLowerCase(),
      },
      {
        label: 'CONSTANT_CASE',
        value: input
          .replace(/\s+/g, '_')
          .replace(/([a-z])([A-Z])/g, '$1_$2')
          .toUpperCase(),
      },
    ];
  }, [input]);

  const sentenceCount = useMemo(() => {
    if (!input.trim()) return 0;
    return (input.match(/[.!?。！？]+/g) || []).length || (input.trim() ? 1 : 0);
  }, [input]);

  const wordCount = useMemo(() => {
    if (!input.trim()) return 0;
    return input.trim().split(/\s+/).filter(Boolean).length;
  }, [input]);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ffd369]/15 flex items-center justify-center">
            <Type size={20} className="text-[#ffd369]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">大小写转换</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">英文文本多种格式互转：全大写、小写、驼峰、蛇形等</p>
      </motion.div>

      {/* Input Area */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="flex items-center justify-between mb-2 ml-1">
          <label className="text-sm font-medium text-[#a8b2c1]">输入文本</label>
          <div className="flex items-center gap-4 text-xs text-[#666]">
            <span><FileText size={12} className="inline mr-1" />{sentenceCount} 句</span>
            <span><Hash size={12} className="inline mr-1" />{wordCount} 词</span>
            <span>{input.length} 字符</span>
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入要转换的英文文本..."
          aria-label="输入文本"
          className="tool-area w-full h-[160px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#ffd369]/30 transition-colors placeholder:text-[#333]"
        />
      </motion.div>

      {/* Format Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {formats.map((format, index) => (
          <motion.div
            key={format.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <div className="glass-card p-4 group hover:border-[#ffd369]/20 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono font-semibold text-[#ffd369]">{format.label}</span>
                <button
                  onClick={() => copyText(format.value)}
                  className="btn-secondary !py-1 !px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Copy size={11} className="inline mr-1" /> 复制
                </button>
              </div>
              <p className="font-mono text-sm text-white break-all leading-relaxed">
                {format.value || <span className="text-[#444]">-</span>}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {formats.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 mt-6 text-center"
        >
          <Type size={32} className="mx-auto text-[#333] mb-3" />
          <p className="text-sm text-[#555]">在上方输入框中输入英文文本，将自动生成7种格式的转换结果</p>
        </motion.div>
      )}
    </div>
  );
}

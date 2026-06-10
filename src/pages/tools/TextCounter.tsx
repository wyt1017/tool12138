import { useState } from 'react';
import { motion } from 'framer-motion';
import { Type, Copy, Trash2, AlignLeft, Hash, FileText, ArrowRightLeft } from 'lucide-react';

interface Stats {
  chars: number;
  charsNoSpace: number;
  words: number;
  chinese: number;
  english: number;
  numbers: number;
  paragraphs: number;
  lines: number;
}

function analyzeText(text: string): Stats {
  const trimmed = text.trim();
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, '').length;

  // Chinese characters
  const chinese = (text.match(/[\u4e00-\u9fa5]/g) || []).length;

  // English words
  const englishWords = text.match(/[a-zA-Z]+/g) || [];
  const english = englishWords.length;

  // Numbers
  const numbers = (text.match(/\d+/g) || []).length;

  // Words (Chinese char count + English word count)
  const words = chinese + english;

  // Paragraphs
  const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0;

  // Lines
  const lines = trimmed ? trimmed.split('\n').length : 0;

  return { chars, charsNoSpace, words, chinese, english, numbers, paragraphs, lines };
}

const statItems = [
  { key: 'chars' as const, label: '总字符数', icon: Hash, color: '#00d9ff' },
  { key: 'charsNoSpace' as const, label: '字符数(不含空格)', icon: Hash, color: '#a78bfa' },
  { key: 'words' as const, label: '总字数', icon: Type, color: '#e94560' },
  { key: 'chinese' as const, label: '中文字符', icon: FileText, color: '#ffd369' },
  { key: 'english' as const, label: '英文单词', icon: Type, color: '#6bcb77' },
  { key: 'numbers' as const, label: '数字个数', icon: Hash, color: '#f472b6' },
  { key: 'paragraphs' as const, label: '段落数', icon: AlignLeft, color: '#fb923c' },
  { key: 'lines' as const, label: '行数', icon: ArrowRightLeft, color: '#38bdf8' },
];

export default function TextCounter() {
  const [text, setText] = useState('');
  const stats = analyzeText(text);

  const copyStats = () => {
    const result = statItems.map((item) => `${item.label}: ${stats[item.key]}`).join('\n');
    navigator.clipboard.writeText(result);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#00d9ff]/15 flex items-center justify-center">
            <Type size={20} className="text-[#00d9ff]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">文本字数统计</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">实时统计中英文字数、字符数、段落数、行数</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Area */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <label className="block text-sm font-medium text-[#a8b2c1] mb-2 ml-1">输入文本</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="在此输入或粘贴文本，统计数据将实时显示..."
            aria-label="输入文本"
            className="tool-area w-full h-[360px] p-5 text-white text-sm leading-relaxed resize-none outline-none focus:border-[#00d9ff]/30 transition-colors placeholder:text-[#333]"
          />
          <div className="flex gap-3 mt-3">
            <button onClick={() => setText('')} disabled={!text} className="btn-secondary !px-4 disabled:opacity-30">
              <Trash2 size={15} className="inline mr-1.5" /> 清空
            </button>
          </div>
        </motion.div>

        {/* Stats Area */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">统计结果</label>
            <button onClick={copyStats} className="btn-secondary !py-1.5 !px-3 text-xs" disabled={!text}>
              <Copy size={13} className="inline mr-1" /> 复制全部
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {statItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key} className="glass-card p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}25`, color: item.color }}>
                    <Icon size={17} />
                  </div>
                  <div>
                    <div className="font-['Syne'] font-bold text-xl text-white">{stats[item.key]}</div>
                    <div className="text-xs text-[#666]">{item.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

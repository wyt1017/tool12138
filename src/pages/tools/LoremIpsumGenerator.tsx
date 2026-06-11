import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Copy, RefreshCw } from 'lucide-react';

const COLOR = '#6bcb77';

// Lorem Ipsum 词库
const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
  'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
  'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
  'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
  'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
  'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
  'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
  'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
];

const SENTENCE_ENDINGS = ['.', '.', '.', '.', '?', '!'];

export default function LoremIpsumGenerator() {
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [count, setCount] = useState(3);
  const [startWithLorem, setStartWithLorem] = useState(true);

  const generateWord = (): string => {
    const index = Math.floor(Math.random() * LOREM_WORDS.length);
    return LOREM_WORDS[index];
  };

  const generateSentence = (startClassic: boolean = false): string => {
    const length = Math.floor(Math.random() * 8) + 6; // 6-13 words
    let words: string[] = [];

    if (startClassic) {
      words = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit'];
    } else {
      for (let i = 0; i < length; i++) {
        const word = generateWord();
        words.push(i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word);
      }
    }

    const ending = SENTENCE_ENDINGS[Math.floor(Math.random() * SENTENCE_ENDINGS.length)];
    return words.join(' ') + ending;
  };

  const generateParagraph = (startClassic: boolean = false): string => {
    const sentenceCount = Math.floor(Math.random() * 4) + 4; // 4-7 sentences
    const sentences: string[] = [];

    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(generateSentence(startClassic && i === 0));
    }

    return sentences.join(' ');
  };

  const generate = () => {
    const result: string[] = [];

    switch (mode) {
      case 'paragraphs':
        for (let i = 0; i < count; i++) {
          result.push(generateParagraph(startWithLorem && i === 0));
        }
        setOutput(result.join('\n\n'));
        break;
      case 'sentences':
        for (let i = 0; i < count; i++) {
          result.push(generateSentence(startWithLorem && i === 0));
        }
        setOutput(result.join(' '));
        break;
      case 'words':
        for (let i = 0; i < count; i++) {
          if (startWithLorem && i === 0) {
            result.push('Lorem');
          } else if (startWithLorem && i === 1) {
            result.push('ipsum');
          } else {
            result.push(generateWord());
          }
        }
        setOutput(result.join(' '));
        break;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLOR}26` }}>
            <FileText size={20} style={{ color: COLOR }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">Lorem Ipsum生成器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">生成占位文本，可控制段落数、句子数或单词数量</p>
      </motion.div>

      {/* Options */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#666]">生成类型：</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'paragraphs' | 'sentences' | 'words')}
              aria-label="生成类型"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#6bcb77]/30"
            >
              <option value="paragraphs">段落</option>
              <option value="sentences">句子</option>
              <option value="words">单词</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#666]">数量：</span>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value)))}
              min={1}
              max={100}
              aria-label="数量"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#6bcb77]/30 w-20"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-[#a8b2c1]">
            <input
              type="checkbox"
              checked={startWithLorem}
              onChange={(e) => setStartWithLorem(e.target.checked)}
              aria-label="以Lorem ipsum开头"
              className="w-4 h-4 rounded accent-[#6bcb77]"
            />
            以 "Lorem ipsum..." 开头
          </label>
        </div>

        <button onClick={generate} className="btn-primary w-full">
          <RefreshCw size={16} className="inline mr-2" /> 生成文本
        </button>
      </motion.div>

      {/* Output */}
      {output && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">生成结果</h2>
            <button onClick={() => navigator.clipboard.writeText(output)} className="btn-secondary !py-1.5 !px-3 text-xs">
              <Copy size={13} className="inline mr-1" /> 复制
            </button>
          </div>
          <div className="glass-card p-6">
            <p className="text-[#a8b2c1] leading-relaxed whitespace-pre-wrap">{output}</p>
          </div>
          <div className="mt-4 text-xs text-[#666]">
            共 {mode === 'words' ? count : output.split(/\s+/).length} 个单词，
            {mode === 'sentences' ? count : output.split(/[.!?]+/).filter(s => s.trim()).length} 个句子
          </div>
        </motion.div>
      )}
    </div>
  );
}
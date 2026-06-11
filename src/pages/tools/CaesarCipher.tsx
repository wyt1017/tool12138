import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Copy, ArrowRightLeft, RotateCcw } from 'lucide-react';

const COLOR = '#a78bfa';

export default function CaesarCipher() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [offset, setOffset] = useState(13);
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');

  const shiftChar = (char: string, shift: number): string => {
    // 大写字母 A-Z
    if (char >= 'A' && char <= 'Z') {
      const code = char.charCodeAt(0) - 65;
      const newCode = ((code + shift) % 26 + 26) % 26;
      return String.fromCharCode(newCode + 65);
    }
    // 小写字母 a-z
    if (char >= 'a' && char <= 'z') {
      const code = char.charCodeAt(0) - 97;
      const newCode = ((code + shift) % 26 + 26) % 26;
      return String.fromCharCode(newCode + 97);
    }
    // 其他字符不变
    return char;
  };

  const process = () => {
    const shift = mode === 'encrypt' ? offset : -offset;
    const result = input.split('').map(char => shiftChar(char, shift)).join('');
    setOutput(result);
  };

  const setRot13 = () => {
    setOffset(13);
  };

  const swapInOut = () => {
    setInput(output);
    setOutput('');
  };

  const clearAll = () => {
    setInput('');
    setOutput('');
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLOR}26` }}>
            <Lock size={20} style={{ color: COLOR }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">凯撒密码/ROT13</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">简单移位加密，支持自定义偏移量或ROT13</p>
      </motion.div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setMode('encrypt')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'encrypt' ? `bg-[#a78bfa]/15 text-[#a78bfa]` : 'bg-white/5 text-[#666]'
          }`}
        >
          加密
        </button>
        <button
          onClick={() => setMode('decrypt')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'decrypt' ? `bg-[#00d9ff]/15 text-[#00d9ff]` : 'bg-white/5 text-[#666]'
          }`}
        >
          解密
        </button>
      </div>

      {/* Offset Control */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-[#a8b2c1]">偏移量</label>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold font-mono px-3 py-1 rounded-lg" style={{ color: COLOR, backgroundColor: `${COLOR}1A` }}>{offset}</span>
            <button onClick={setRot13} className="btn-secondary !py-1.5 !px-3 text-xs">
              <RotateCcw size={13} className="inline mr-1" /> ROT13
            </button>
          </div>
        </div>
        <input
          type="range"
          min={1}
          max={25}
          value={offset}
          onChange={(e) => setOffset(Number(e.target.value))}
          aria-label="偏移量"
          className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#a78bfa]"
        />
        <div className="flex justify-between text-xs text-[#666] mt-1">
          <span>1</span>
          <span>25</span>
        </div>
        <p className="text-xs text-[#666] mt-3">
          ROT13（偏移量13）是凯撒密码的特殊形式，加密和解密使用相同的偏移量，对字母表循环移位。
        </p>
      </motion.div>

      {/* Input/Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <label className="text-sm font-medium text-[#a8b2c1] mb-2 ml-1 block">输入文本</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入要加密或解密的文本..."
            aria-label="输入文本"
            className="tool-area w-full h-[280px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#a78bfa]/30 transition-colors placeholder:text-[#333]"
          />
        </motion.div>

        {/* Output */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">输出结果</label>
            {output && (
              <button onClick={() => navigator.clipboard.writeText(output)} className="btn-secondary !py-1.5 !px-3 text-xs">
                <Copy size={13} className="inline mr-1" /> 复制
              </button>
            )}
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="结果将显示在这里..."
            aria-label="输出结果"
            className="tool-area w-full h-[280px] p-5 text-sm leading-relaxed resize-none outline-none text-[#a8b2c1] placeholder:text-[#333]"
          />
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-3 mt-6"
      >
        <button onClick={process} disabled={!input} className="btn-primary disabled:opacity-30">
          {mode === 'encrypt' ? '加密' : '解密'}
        </button>
        <button onClick={swapInOut} disabled={!output} className="btn-secondary">
          <ArrowRightLeft size={15} className="inline mr-1.5" /> 交换输入输出
        </button>
        <button onClick={clearAll} className="btn-secondary">
          清空
        </button>
      </motion.div>
    </div>
  );
}
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ListOrdered, Copy, Eraser } from 'lucide-react';

const COLOR = '#00d9ff';

export default function LineNumberTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'add' | 'remove'>('add');
  const [startNumber, setStartNumber] = useState(1);
  const [separator, setSeparator] = useState(': ');
  const [step, setStep] = useState(1);

  const process = () => {
    if (!input.trim()) {
      setOutput('');
      return;
    }

    const lines = input.split('\n');

    if (mode === 'add') {
      const result = lines.map((line, index) => {
        const num = startNumber + index * step;
        return `${num}${separator}${line}`;
      }).join('\n');
      setOutput(result);
    } else {
      // 移除行号
      const result = lines.map(line => {
        // 匹配开头的数字+分隔符
        const match = line.match(/^\d+[.:;\s\t-]+/);
        if (match) {
          return line.slice(match[0].length);
        }
        return line;
      }).join('\n');
      setOutput(result);
    }
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
            <ListOrdered size={20} style={{ color: COLOR }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">文本行编号工具</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">为每行文本添加行号，或去除已有行号</p>
      </motion.div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setMode('add')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'add' ? `bg-[#00d9ff]/15 text-[#00d9ff]` : 'bg-white/5 text-[#666]'
          }`}
        >
          添加行号
        </button>
        <button
          onClick={() => setMode('remove')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'remove' ? `bg-[#e94560]/15 text-[#e94560]` : 'bg-white/5 text-[#666]'
          }`}
        >
          移除行号
        </button>
      </div>

      {/* Options */}
      {mode === 'add' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6 mb-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-[#666] block mb-2">起始编号</label>
              <input
                type="number"
                value={startNumber}
                onChange={(e) => setStartNumber(Number(e.target.value))}
                aria-label="起始编号"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#00d9ff]/30 w-full"
              />
            </div>
            <div>
              <label className="text-xs text-[#666] block mb-2">分隔符</label>
              <input
                type="text"
                value={separator}
                onChange={(e) => setSeparator(e.target.value)}
                aria-label="分隔符"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#00d9ff]/30 w-full"
              />
            </div>
            <div>
              <label className="text-xs text-[#666] block mb-2">步长</label>
              <input
                type="number"
                value={step}
                onChange={(e) => setStep(Number(e.target.value))}
                min={1}
                aria-label="步长"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#00d9ff]/30 w-full"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Input/Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <label className="text-sm font-medium text-[#a8b2c1] mb-2 ml-1 block">输入文本</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入多行文本..."
            aria-label="输入文本"
            className="tool-area w-full h-[350px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#00d9ff]/30 transition-colors placeholder:text-[#333]"
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
            className="tool-area w-full h-[350px] p-5 text-sm leading-relaxed resize-none outline-none text-[#a8b2c1] placeholder:text-[#333]"
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
          {mode === 'add' ? '添加行号' : '移除行号'}
        </button>
        <button onClick={clearAll} className="btn-secondary">
          <Eraser size={15} className="inline mr-1.5" /> 清空
        </button>
      </motion.div>
    </div>
  );
}
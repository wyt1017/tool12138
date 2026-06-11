import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link2, Copy, ArrowRightLeft, Code } from 'lucide-react';

export default function UrlEncodeDecode() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  useEffect(() => {
    if (!input) {
      setOutput('');
      return;
    }
    try {
      if (mode === 'encode') {
        setOutput(encodeURIComponent(input));
      } else {
        setOutput(decodeURIComponent(input));
      }
    } catch {
      setOutput('错误：无效的输入格式');
    }
  }, [input, mode]);

  const swapInOut = () => {
    setInput(output);
    setOutput('');
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  const copyResult = () => {
    if (output && !output.startsWith('错误')) {
      navigator.clipboard.writeText(output);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/15 flex items-center justify-center">
            <Link2 size={20} className="text-[#a78bfa]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">URL 编解码</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">URL编码（encodeURIComponent）和解码（decodeURIComponent）</p>
      </motion.div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setMode('encode')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'encode' ? 'bg-[#a78bfa]/15 text-[#a78bfa]' : 'bg-white/5 text-[#666]'
          }`}
        >
          <Code size={14} className="inline mr-1.5" /> URL 编码
        </button>
        <button
          onClick={() => setMode('decode')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'decode' ? 'bg-[#a78bfa]/15 text-[#a78bfa]' : 'bg-white/5 text-[#666]'
          }`}
        >
          <Code size={14} className="inline mr-1.5" /> URL 解码
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">{mode === 'encode' ? '原始文本' : '编码字符串'}</label>
            <span className="text-xs text-[#555]">{input.length} 字符</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? '输入要编码的文本或URL...' : '粘贴已编码的URL字符串...'}
            aria-label={mode === 'encode' ? '原始文本' : '编码字符串'}
            className="tool-area w-full h-[320px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#a78bfa]/30 transition-colors placeholder:text-[#333] font-mono"
          />
        </motion.div>

        {/* Output */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">{mode === 'encode' ? '编码结果' : '解码结果'}</label>
            {output && (
              <div className="flex items-center gap-2">
                <span className={`text-xs ${output.startsWith('错误') ? 'text-red-400' : 'text-[#555]'}`}>
                  {output.length} 字符
                </span>
                <button onClick={copyResult} className="btn-secondary !py-1.5 !px-3 text-xs">
                  <Copy size={13} className="inline mr-1" /> 复制
                </button>
              </div>
            )}
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="输出结果将显示在这里..."
            aria-label={mode === 'encode' ? '编码结果' : '解码结果'}
            className={`tool-area w-full h-[320px] p-5 text-sm leading-relaxed resize-none outline-none font-mono placeholder:text-[#333] ${
              output.startsWith('错误') ? 'text-red-400' : 'text-[#a8b2c1]'
            }`}
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
        <button onClick={swapInOut} disabled={!input || !output} className="btn-secondary disabled:opacity-30">
          <ArrowRightLeft size={15} className="inline mr-1.5" /> 交换输入输出
        </button>
        <button onClick={() => { setInput(''); setOutput(''); }} className="btn-secondary">
          清空
        </button>
      </motion.div>
    </div>
  );
}

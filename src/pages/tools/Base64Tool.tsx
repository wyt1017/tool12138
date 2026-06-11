import { useState } from 'react';
import { motion } from 'framer-motion';
import { Binary, Copy, Upload, ImageDown, ArrowRightLeft } from 'lucide-react';

export default function Base64Tool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [isImage, setIsImage] = useState(false);

  // 使用 TextEncoder/TextDecoder 替代废弃的 escape/unescape
  const encode = () => {
    try {
      const encoder = new TextEncoder();
      const encodedBytes = encoder.encode(input);
      const binaryString = Array.from(encodedBytes, (byte) => String.fromCharCode(byte)).join('');
      const encoded = btoa(binaryString);
      setOutput(encoded);
      setIsImage(false);
    } catch {
      setOutput('编码失败：输入内容包含无法编码的字符');
    }
  };

  const decode = () => {
    try {
      const binaryString = atob(input.trim());
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const decoded = new TextDecoder().decode(bytes);
      setOutput(decoded);
      setIsImage(false);
    } catch {
      // Try image decode
      if (input.trim().startsWith('data:image')) {
        setIsImage(true);
        setOutput(input.trim());
      } else {
        setOutput('解码失败：无效的Base64字符串');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      setInput(base64);
      setOutput(result);
      setIsImage(true);
    };
    reader.readAsDataURL(file);
  };

  const downloadImage = () => {
    if (!isImage || !output) return;
    const a = document.createElement('a');
    a.href = output;
    a.download = 'decoded-image.png';
    a.click();
  };

  const swapInOut = () => {
    setInput(output);
    setOutput('');
    setIsImage(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#e94560]/15 flex items-center justify-center">
            <Binary size={20} className="text-[#e94560]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">Base64编解码</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">文本和图片的Base64编码与解码工具</p>
      </motion.div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setMode('encode')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'encode' ? 'bg-[#00d9ff]/15 text-[#00d9ff]' : 'bg-white/5 text-[#666]'
          }`}
        >
          编码 → Base64
        </button>
        <button
          onClick={() => setMode('decode')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'decode' ? 'bg-[#a78bfa]/15 text-[#a78bfa]' : 'bg-white/5 text-[#666]'
          }`}
        >
          解码 ← Base64
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">{mode === 'encode' ? '原始文本' : 'Base64字符串'}</label>
            <label className="btn-secondary !py-1.5 !px-3 text-xs cursor-pointer">
              <Upload size={13} className="inline mr-1" /> 上传图片
              <input type="file" accept="image/*" onChange={handleFileUpload} aria-label="上传图片" className="hidden" />
            </label>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? '输入要编码的文本...' : '粘贴Base64字符串...'}
            aria-label={mode === 'encode' ? '原始文本' : 'Base64字符串'}
            className="tool-area w-full h-[320px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#e94560]/30 transition-colors placeholder:text-[#333] font-mono"
          />
        </motion.div>

        {/* Output */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">{mode === 'encode' ? 'Base64结果' : '解码结果'}</label>
            {output && (
              <div className="flex gap-2">
                <button onClick={() => navigator.clipboard.writeText(output)} className="btn-secondary !py-1.5 !px-3 text-xs">
                  <Copy size={13} className="inline mr-1" /> 复制
                </button>
                {isImage && (
                  <button onClick={downloadImage} className="btn-secondary !py-1.5 !px-3 text-xs">
                    <ImageDown size={13} className="inline mr-1" /> 下载图片
                  </button>
                )}
              </div>
            )}
          </div>
          {isImage ? (
            <div className="tool-area p-4 h-[320px] flex items-center justify-center overflow-hidden">
              <img src={output} alt="Decoded" className="max-w-full max-h-full rounded-lg object-contain" />
            </div>
          ) : (
            <textarea
              readOnly
              value={output}
              placeholder="输出结果将显示在这里..."
              aria-label="输出结果"
              className="tool-area w-full h-[320px] p-5 text-sm leading-relaxed resize-none outline-none text-[#a8b2c1] font-mono placeholder:text-[#333]"
            />
          )}
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-3 mt-6"
      >
        <button onClick={mode === 'encode' ? encode : decode} disabled={!input} className="btn-primary disabled:opacity-30">
          {mode === 'encode' ? '编码' : '解码'}
        </button>
        <button onClick={swapInOut} disabled={!output} className="btn-secondary">
          <ArrowRightLeft size={15} className="inline mr-1.5" /> 交换输入输出
        </button>
        <button onClick={() => { setInput(''); setOutput(''); setIsImage(false); }} className="btn-secondary">
          清空
        </button>
      </motion.div>
    </div>
  );
}

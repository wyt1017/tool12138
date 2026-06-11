import { useState } from 'react';
import { motion } from 'framer-motion';
import { Minimize2, Copy, ArrowRightLeft } from 'lucide-react';
import LZString from 'lz-string';

type CompressFormat = 'base64' | 'utf16' | 'uri';

export default function LzStringCompress() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'compress' | 'decompress'>('compress');
  const [format, setFormat] = useState<CompressFormat>('base64');
  const [stats, setStats] = useState<{ original: number; result: number; ratio: string } | null>(null);

  const compressFn = () => {
    try {
      let result: string | null;
      switch (format) {
        case 'base64':
          result = LZString.compressToBase64(input);
          break;
        case 'utf16':
          result = LZString.compressToUTF16(input);
          break;
        case 'uri':
          result = LZString.compressToEncodedURIComponent(input);
          break;
      }
      if (result === null) {
        setOutput('压缩失败');
        return;
      }
      setOutput(result);
      setStats({
        original: new Blob([input]).size,
        result: new Blob([result]).size,
        ratio: ((new Blob([result]).size / new Blob([input]).size) * 100).toFixed(1) + '%',
      });
    } catch {
      setOutput('压缩失败');
    }
  };

  const decompressFn = () => {
    try {
      let result: string | null;
      switch (format) {
        case 'base64':
          result = LZString.decompressFromBase64(input);
          break;
        case 'utf16':
          result = LZString.decompressFromUTF16(input);
          break;
        case 'uri':
          result = LZString.decompressFromEncodedURIComponent(input);
          break;
      }
      if (result === null) {
        setOutput('解压失败：无效的压缩数据');
        return;
      }
      setOutput(result);
      setStats(null);
    } catch {
      setOutput('解压失败：无效的压缩数据');
    }
  };

  const process = () => {
    if (mode === 'compress') {
      compressFn();
    } else {
      decompressFn();
    }
  };

  const swapInOut = () => {
    setInput(output);
    setOutput('');
    setStats(null);
    setMode(mode === 'compress' ? 'decompress' : 'compress');
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/15 flex items-center justify-center">
            <Minimize2 size={20} className="text-[#a78bfa]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">文本压缩/解压</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">基于LZ算法的纯前端文本压缩，适合长文本存储或传输</p>
      </motion.div>

      {/* Mode Toggle & Format */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <button
          onClick={() => setMode('compress')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'compress' ? 'bg-[#a78bfa]/15 text-[#a78bfa]' : 'bg-white/5 text-[#666]'
          }`}
        >
          压缩
        </button>
        <button
          onClick={() => setMode('decompress')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'decompress' ? 'bg-[#00d9ff]/15 text-[#00d9ff]' : 'bg-white/5 text-[#666]'
          }`}
        >
          解压
        </button>

        <div className="h-5 w-px bg-white/10 mx-2" />

        <span className="text-xs text-[#666]">输出格式：</span>
        {([
          { value: 'base64' as CompressFormat, label: 'Base64' },
          { value: 'utf16' as CompressFormat, label: 'UTF-16' },
          { value: 'uri' as CompressFormat, label: 'URI安全' },
        ]).map((f) => (
          <button
            key={f.value}
            onClick={() => setFormat(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              format === f.value ? 'bg-white/10 text-white' : 'bg-white/5 text-[#666] hover:text-[#a8b2c1]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      {stats && mode === 'compress' && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-[#666] mb-1">原始大小</div>
              <div className="text-lg font-bold font-mono text-[#a78bfa]">{stats.original} 字节</div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">压缩后</div>
              <div className="text-lg font-bold font-mono text-[#6bcb77]">{stats.result} 字节</div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">压缩率</div>
              <div className="text-lg font-bold font-mono text-[#f472b6]">{stats.ratio}</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Input/Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <label className="text-sm font-medium text-[#a8b2c1] mb-2 ml-1 block">
            {mode === 'compress' ? '原始文本' : '压缩数据'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'compress' ? '输入要压缩的长文本...' : '粘贴压缩后的数据...'}
            aria-label="输入文本"
            className="tool-area w-full h-[280px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#a78bfa]/30 transition-colors placeholder:text-[#333] font-mono"
          />
        </motion.div>

        {/* Output */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">
              {mode === 'compress' ? '压缩结果' : '解压结果'}
            </label>
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
            className="tool-area w-full h-[280px] p-5 text-sm leading-relaxed resize-none outline-none text-[#a8b2c1] placeholder:text-[#333] font-mono"
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
          {mode === 'compress' ? '压缩' : '解压'}
        </button>
        <button onClick={swapInOut} disabled={!output} className="btn-secondary">
          <ArrowRightLeft size={15} className="inline mr-1.5" /> 交换输入输出
        </button>
        <button onClick={() => { setInput(''); setOutput(''); setStats(null); setMode('compress'); }} className="btn-secondary">
          清空
        </button>
      </motion.div>

      {/* Info */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-4 mt-6">
        <p className="text-xs text-[#666]">
          <strong className="text-[#a8b2c1]">说明：</strong>
          本工具使用 lz-string 库（真正的 LZ 压缩算法）进行文本压缩，支持中文等 Unicode 字符。
          三种输出格式：Base64（通用）、UTF-16（更短）、URI安全（可直接放 URL 参数中）。
          压缩和解压必须使用相同的格式。
        </p>
      </motion.div>
    </div>
  );
}

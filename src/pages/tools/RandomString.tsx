import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shuffle, Copy, Download, RefreshCw, Sparkles, Eraser } from 'lucide-react';

const color = '#6bcb77';

const DEFAULT_CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

interface Preset {
  name: string;
  chars: string;
}

const PRESETS: Preset[] = [
  { name: '数字', chars: '0123456789' },
  { name: '小写字母', chars: 'abcdefghijklmnopqrstuvwxyz' },
  { name: '大写字母', chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  { name: '字母', chars: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  { name: '字母+数字', chars: DEFAULT_CHARSET },
  { name: '十六进制', chars: '0123456789abcdefABCDEF' },
];

/** 字符集去重（保留顺序），空集合返回 null */
function normalizeCharset(charset: string): string[] | null {
  const seen = new Set<string>();
  const chars: string[] = [];
  for (const ch of charset) {
    if (!seen.has(ch)) {
      seen.add(ch);
      chars.push(ch);
    }
  }
  return chars.length > 0 ? chars : null;
}

/** 在 [0, n) 内均匀取整，使用拒绝采样避免取模偏差 */
function randomIndex(n: number): number {
  const limit = Math.floor(0x100000000 / n) * n;
  let raw: number;
  do {
    raw = crypto.getRandomValues(new Uint32Array(1))[0];
  } while (raw >= limit);
  return raw % n;
}

/** 批量生成随机字符串（核心纯逻辑） */
function generateStrings(count: number, length: number, charset: string): string[] {
  const chars = normalizeCharset(charset);
  if (!chars) return [];
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    let s = '';
    for (let j = 0; j < length; j++) {
      s += chars[randomIndex(chars.length)];
    }
    out.push(s);
  }
  return out;
}

export default function RandomString() {
  const [count, setCount] = useState<number>(10000);
  const [length, setLength] = useState<number>(20);
  const [charset, setCharset] = useState<string>(DEFAULT_CHARSET);
  const [result, setResult] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const outputText = result.join('\n');

  const generate = () => {
    const actualCount = Math.max(1, Math.min(count, 10000));
    const actualLength = Math.max(1, Math.min(length, 200));
    setResult(generateStrings(actualCount, actualLength, charset));
    setCopied(false);
  };

  const reset = () => {
    setCount(10000);
    setLength(20);
    setCharset(DEFAULT_CHARSET);
    setResult([]);
    setCopied(false);
  };

  const showExample = () => {
    setCount(20);
    setLength(16);
    setCharset(DEFAULT_CHARSET);
    setResult(generateStrings(20, 16, DEFAULT_CHARSET));
    setCopied(false);
  };

  const copyAll = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const exportTxt = () => {
    if (!outputText) return;
    const blob = new Blob([outputText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'random-string.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}24` }}>
            <Shuffle size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">随机字符生成</h1>
        </div>
        <p className="text-[var(--text-secondary)] ml-[52px]">按自定义字符集批量生成随机字符串，支持一键复制与下载 TXT</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1">
          <div className="glass-card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">参数设置</h3>

            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1.5">生成数量</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(Number(e.target.value), 10000)))}
                min={1}
                max={10000}
                aria-label="生成数量"
                className="tool-area w-full px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[#6bcb77]/40"
              />
            </div>

            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1.5">每行字符数</label>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(Math.max(1, Math.min(Number(e.target.value), 200)))}
                min={1}
                max={200}
                aria-label="每行字符数"
                className="tool-area w-full px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[#6bcb77]/40"
              />
            </div>

            <div>
              <label className="text-xs text-[var(--text-secondary)] block mb-1.5">备选字符集</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setCharset(p.chars)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                      charset === p.chars ? 'bg-[#6bcb77]/20 text-[#6bcb77]' : 'bg-[var(--bg-hover)] text-[var(--text-faint)]'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <textarea
                value={charset}
                onChange={(e) => setCharset(e.target.value)}
                rows={3}
                aria-label="备选字符集"
                placeholder="输入参与随机生成的字符，例如：ABC123"
                className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm font-mono outline-none focus:border-[#6bcb77]/40 resize-none break-all"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={generate} className="btn-primary flex-1">
                <Shuffle size={16} className="inline mr-1.5" /> 生成
              </button>
              <button onClick={showExample} className="btn-secondary flex items-center gap-1.5 !px-4 text-sm">
                <Sparkles size={14} /> 示例
              </button>
              <button onClick={reset} className="btn-secondary flex items-center gap-1.5 !px-4 text-sm">
                <Eraser size={14} /> 重置
              </button>
            </div>
          </div>
        </motion.div>

        {/* Result Panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 space-y-4">
          {result.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[var(--text-faint)]">
                共 {result.length} 行 · 每行 {result[0].length} 字符
              </span>
              <div className="ml-auto flex gap-2">
                <button onClick={copyAll} className="btn-secondary !py-1.5 !px-3 text-xs">
                  <Copy size={13} className="inline mr-1" /> {copied ? '已复制' : '复制全部'}
                </button>
                <button onClick={exportTxt} className="btn-secondary !py-1.5 !px-3 text-xs">
                  <Download size={13} className="inline mr-1" /> 下载TXT
                </button>
                <button onClick={generate} className="btn-secondary !py-1.5 !px-3 text-xs">
                  <RefreshCw size={13} className="inline mr-1" /> 重新生成
                </button>
              </div>
            </div>
          )}

          <textarea
            value={outputText}
            readOnly
            aria-label="生成结果"
            placeholder="点击左侧「生成」或「示例」查看结果"
            className="tool-area w-full min-h-[320px] max-h-[460px] p-4 font-mono text-xs text-[var(--text-primary)] leading-relaxed outline-none resize-y"
          />
        </motion.div>
      </div>
    </div>
  );
}

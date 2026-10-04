import { useState } from 'react';
import { motion } from 'framer-motion';
import { CircleDot, Copy, Download, Eraser, Sparkles } from 'lucide-react';

const color = '#00d9ff';

interface NumberStyle {
  name: string;
  /** 0-9 对应的带圈字符 */
  base: string[];
  /** 10 及以上（10、11、...）对应的字符，下标 0 表示 10 */
  tens: string[];
}

const STYLES: NumberStyle[] = [
  { name: '①②③', base: ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'], tens: ['⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'] },
  { name: '⓵⓶⓷', base: ['0', '⓵', '⓶', '⓷', '⓸', '⓹', '⓺', '⓻', '⓼', '⓽'], tens: ['⓾'] },
  { name: '❶❷❸', base: ['⓿', '❶', '❷', '❸', '❹', '❺', '❻', '❼', '❽', '❾'], tens: ['❿'] },
  { name: '㊀㊁㊂', base: ['0', '㊀', '㊁', '㊂', '㊃', '㊄', '㊅', '㊆', '㊇', '㊈'], tens: ['㊉'] },
  { name: '㈠㈡㈢', base: ['0', '㈠', '㈡', '㈢', '㈣', '㈤', '㈥', '㈦', '㈧', '㈨'], tens: ['㈩'] },
];

const DEMO = '2024年10月1日，共20人参与第3届活动';

/** 先替换 10 及以上的两位数字，再逐位替换 0-9 */
function convertText(input: string, styleIdx: number): string {
  const s = STYLES[styleIdx];
  let out = input;
  for (let n = 10 + s.tens.length - 1; n >= 10; n--) {
    const glyph = s.tens[n - 10];
    if (glyph) out = out.split(String(n)).join(glyph);
  }
  return out.replace(/\d/g, (d) => s.base[Number(d)]);
}

export default function NumberCircle() {
  const [type, setType] = useState(0);
  const [input, setInput] = useState('');
  const [resultStr, setResultStr] = useState('');
  const [copied, setCopied] = useState(false);

  const convert = () => {
    setResultStr(convertText(input, type));
    setCopied(false);
  };

  const showDemo = () => {
    setInput(DEMO);
    setResultStr(convertText(DEMO, type));
    setCopied(false);
  };

  const clear = () => {
    setInput('');
    setResultStr('');
  };

  const copyResult = () => {
    if (!resultStr) return;
    navigator.clipboard.writeText(resultStr);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const exportTxt = () => {
    if (!resultStr) return;
    const blob = new Blob([resultStr], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'number-circle.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}24` }}>
            <CircleDot size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">数字加圆圈</h1>
        </div>
        <p className="text-[var(--text-secondary)] ml-[52px]">将数字转换为 ①②③、⓵⓶⓷、❶❷❸ 等五种带圈序号样式</p>
      </motion.div>

      <div className="glass-card p-6 space-y-5">
        <div>
          <label className="text-xs text-[var(--text-secondary)] block mb-1.5">带圈款式</label>
          <select
            value={type}
            onChange={(e) => setType(Number(e.target.value))}
            aria-label="带圈款式"
            className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm outline-none focus:border-[#00d9ff]/40"
          >
            {STYLES.map((s, i) => (
              <option key={s.name} value={i}>{s.name}</option>
            ))}
          </select>
          <div className="text-xs text-[var(--text-faint)] mt-2">
            预览：1230 → {convertText('1230', type)}
          </div>
        </div>

        <div>
          <label className="text-xs text-[var(--text-secondary)] block mb-1.5">原文内容</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={4}
            placeholder="输入需要转换的文字，例如：2024年10月1日"
            className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm outline-none focus:border-[#00d9ff]/40 resize-none"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={convert} className="btn-primary flex items-center gap-2 !px-6">
            <CircleDot size={16} /> 开始转换
          </button>
          <button onClick={showDemo} className="btn-secondary flex items-center gap-1.5 !px-4 text-sm">
            <Sparkles size={14} /> 示例
          </button>
          <button onClick={clear} className="btn-secondary flex items-center gap-1.5 !px-4 text-sm">
            <Eraser size={14} /> 清空
          </button>
        </div>
      </div>

      <div className="glass-card p-6 mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">转换结果</h3>
          {resultStr && (
            <div className="flex gap-2">
              <button onClick={copyResult} className="btn-secondary flex items-center gap-1.5 !px-3 !py-1.5 text-xs">
                <Copy size={12} /> {copied ? '已复制' : '复制'}
              </button>
              <button onClick={exportTxt} className="btn-secondary flex items-center gap-1.5 !px-3 !py-1.5 text-xs">
                <Download size={12} /> 下载TXT
              </button>
            </div>
          )}
        </div>
        <div className="tool-area p-4 min-h-[96px] text-[var(--text-primary)] leading-relaxed break-all whitespace-pre-wrap" aria-live="polite">
          {resultStr || <span className="text-[var(--text-faint)] text-sm">点击「开始转换」或「示例」查看结果</span>}
        </div>
      </div>
    </div>
  );
}

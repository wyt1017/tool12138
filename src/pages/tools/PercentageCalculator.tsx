import { useState } from 'react';
import { motion } from 'framer-motion';
import { Percent, Copy, RotateCcw } from 'lucide-react';

const color = '#a78bfa';

interface Mode {
  label: string;
  desc: string;
  calc: (a: number, b: number) => number | null;
  fmt: (result: number) => string;
}

const MODES: Mode[] = [
  {
    label: 'A 是 B 的百分之几',
    desc: '已知部分值和基准值，计算百分比',
    calc: (a, b) => b !== 0 ? (a / b) * 100 : null,
    fmt: (r) => `${r.toFixed(4)}%`,
  },
  {
    label: 'B 的百分之 A 是多少',
    desc: '已知百分比和基准值，计算结果值',
    calc: (a, b) => (a / 100) * b,
    fmt: (r) => r.toLocaleString('zh-CN', { maximumFractionDigits: 6 }),
  },
  {
    label: 'A 比 B 增长/减少百分之几',
    desc: '计算变化率（正数为增长，负数为减少）',
    calc: (a, b) => b !== 0 ? ((a - b) / b) * 100 : null,
    fmt: (r) => `${r >= 0 ? '+' : ''}${r.toFixed(4)}%`,
  },
];

export default function PercentageCalculator() {
  const [modeIdx, setModeIdx] = useState(0);
  const [valA, setValA] = useState('');
  const [valB, setValB] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const mode = MODES[modeIdx];

  const handleCalc = () => {
    const a = parseFloat(valA);
    const b = parseFloat(valB);
    if (isNaN(a) || isNaN(b)) {
      setResult(null);
      return;
    }
    const r = mode.calc(a, b);
    if (r === null || !isFinite(r)) {
      setResult('除数不能为零');
    } else {
      setResult(mode.fmt(r));
    }
    setCopied(false);
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleReset = () => {
    setValA('');
    setValB('');
    setResult(null);
    setCopied(false);
  };

  const placeholders = modeIdx === 0
    ? ['部分值', '基准值']
    : modeIdx === 1
    ? ['百分比', '基准值']
    : ['当前值', '原始值'];

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}24` }}>
            <Percent size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">百分比计算器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">三种常见百分比场景一键换算</p>
      </motion.div>

      {/* Mode Tabs */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-wrap gap-2 mb-6">
        {MODES.map((m, i) => (
          <button
            key={i}
            onClick={() => { setModeIdx(i); setValA(''); setValB(''); setResult(null); }}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              modeIdx === i
                ? 'text-white shadow-lg'
                : 'bg-white/5 text-[#666] hover:text-white hover:bg-white/10'
            }`}
            style={modeIdx === i ? { background: `${color}30`, border: `1px solid ${color}50` } : {}}
          >
            {m.label}
          </button>
        ))}
      </motion.div>

      {/* Input Card */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-7 mb-4">
        <div className="text-sm text-[#a8b2c1] mb-5">{mode.desc}</div>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-xs text-[#666] mb-1.5 block">{placeholders[0]}</label>
            <input
              type="number"
              value={valA}
              onChange={(e) => { setValA(e.target.value); setResult(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
              placeholder="输入数值"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-[#a78bfa]/40 placeholder:text-[#444]"
            />
          </div>
          <div>
            <label className="text-xs text-[#666] mb-1.5 block">{placeholders[1]}</label>
            <input
              type="number"
              value={valB}
              onChange={(e) => { setValB(e.target.value); setResult(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleCalc()}
              placeholder="输入数值"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-lg outline-none focus:border-[#a78bfa]/40 placeholder:text-[#444]"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleCalc} className="btn-primary flex items-center gap-2 !px-6">
            <Percent size={16} /> 计算
          </button>
          <button onClick={handleReset} className="btn-secondary flex items-center gap-2 !px-5">
            <RotateCcw size={14} /> 清空
          </button>
        </div>
      </motion.div>

      {/* Result */}
      {result && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="glass-card p-6 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#666] mb-1">结果</div>
            <div className="font-['Syne'] font-bold text-3xl text-white">{result}</div>
          </div>
          <button onClick={copyResult} className="btn-secondary flex items-center gap-2 !px-4 !py-2 text-sm">
            <Copy size={14} /> {copied ? '已复制' : '复制'}
          </button>
        </motion.div>
      )}

      {/* Quick Reference */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6 glass-card p-5">
        <h3 className="text-xs text-[#666] mb-3 uppercase tracking-widest">常用参考</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {[10, 20, 25, 50, 75, 100].map((p) => (
            <div key={p} className="bg-white/5 rounded-lg px-3 py-2 text-center">
              <div className="text-white font-semibold text-sm">{p}%</div>
              <div className="text-[#666] text-xs">{p / 100}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

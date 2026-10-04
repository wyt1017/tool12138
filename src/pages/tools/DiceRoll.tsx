import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Dice5, RefreshCw, RotateCcw } from 'lucide-react';

const color = '#e94560';

// 骰子点数在 3x3 网格中的位置索引
const PIP_POSITIONS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

const randomFace = () => Math.floor(Math.random() * 6) + 1;

function Die({ value, rolling }: { value: number; rolling: boolean }) {
  return (
    <motion.div
      className="w-16 h-16 rounded-2xl bg-white grid grid-cols-3 grid-rows-3 p-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
      animate={rolling ? { rotate: [0, -8, 8, -4, 4, 0], scale: [1, 1.06, 1] } : { rotate: 0, scale: 1 }}
      transition={{ duration: 0.4, repeat: rolling ? Infinity : 0 }}
    >
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className="flex items-center justify-center">
          {PIP_POSITIONS[value].includes(i) && <span className="w-2 h-2 rounded-full bg-[#1e293b]" />}
        </div>
      ))}
    </motion.div>
  );
}

// 页面加载即摇一次
const INITIAL_DICE = Array.from({ length: 6 }, () => randomFace());

export default function DiceRoll() {
  const [diceNum, setDiceNum] = useState(6);
  const [dice, setDice] = useState<number[]>(INITIAL_DICE);
  const [rolling, setRolling] = useState(false);
  const [stats, setStats] = useState<Record<number, number>>(() => {
    const s: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    INITIAL_DICE.forEach((v) => { s[v]++; });
    return s;
  });
  const [total, setTotal] = useState(INITIAL_DICE.length);
  const timerRef = useRef<number | null>(null);

  const roll = () => {
    if (rolling) return;
    const n = Math.max(1, Math.min(diceNum, 30));
    setRolling(true);
    setDice(Array.from({ length: n }, () => randomFace()));
    let ticks = 0;
    timerRef.current = window.setInterval(() => {
      setDice(Array.from({ length: n }, () => randomFace()));
      ticks += 1;
      if (ticks >= 12) {
        if (timerRef.current !== null) window.clearInterval(timerRef.current);
        timerRef.current = null;
        const final = Array.from({ length: n }, () => randomFace());
        setDice(final);
        setStats((prev) => {
          const next = { ...prev };
          final.forEach((v) => { next[v]++; });
          return next;
        });
        setTotal((t) => t + final.length);
        setRolling(false);
      }
    }, 70);
  };

  const reset = () => {
    setStats({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
    setTotal(0);
  };

  const maxStat = Math.max(1, ...Object.values(stats));

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}24` }}>
            <Dice5 size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">随机摇骰子</h1>
        </div>
        <p className="text-[var(--text-secondary)] ml-[52px]">模拟摇骰子，自定义骰子数量并统计各面点数出现次数</p>
      </motion.div>

      <div className="glass-card p-6 mb-4">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span>骰子数量</span>
            <input
              type="number"
              min={1}
              max={30}
              value={diceNum}
              onChange={(e) => setDiceNum(Math.max(1, Math.min(parseInt(e.target.value) || 1, 30)))}
              aria-label="骰子数量"
              className="w-20 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm outline-none focus:border-[#e94560]/40"
            />
          </div>
          <button onClick={roll} disabled={rolling} className="btn-primary flex items-center gap-2 !px-6 disabled:opacity-60">
            <RefreshCw size={16} className={rolling ? 'animate-spin' : ''} /> {rolling ? '摇动中...' : '摇骰子'}
          </button>
          <button onClick={reset} className="btn-secondary flex items-center gap-1.5 !px-4 text-sm">
            <RotateCcw size={14} /> 重置统计
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-4 min-h-[80px] items-center">
          {dice.map((v, i) => (
            <Die key={i} value={v} rolling={rolling} />
          ))}
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">点数统计</h3>
          <span className="text-xs text-[var(--text-faint)]">累计 {total} 颗</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="flex items-center gap-3">
              <Die value={n} rolling={false} />
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--text-secondary)]">{n} 点</span>
                  <span className="font-mono text-[var(--text-primary)]">{stats[n]}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(stats[n] / maxStat) * 100}%`, background: color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, RefreshCw, RotateCcw } from 'lucide-react';

const color = '#ffd369';

type Face = 'front' | 'back';

interface CoinResult {
  id: number;
  face: Face;
}

const randomFace = (): Face => (Math.random() < 0.5 ? 'front' : 'back');

/** 生成初始结果（页面加载即抛一次，无动画） */
function initCoins(n: number): CoinResult[] {
  return Array.from({ length: n }, (_, i) => ({ id: i, face: randomFace() }));
}

function Coin({ face, delay }: { face: Face; delay: number }) {
  const target = face === 'front' ? 720 : 900;
  return (
    <div className="[perspective:700px]">
      <motion.div
        className="relative w-20 h-20 [transform-style:preserve-3d]"
        initial={{ rotateY: 0 }}
        animate={{ rotateY: target }}
        transition={{ duration: 1.1, delay, ease: [0.34, 1.2, 0.64, 1] }}
      >
        <div
          className="absolute inset-0 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-[0_6px_18px_rgba(0,0,0,0.35)] [backface-visibility:hidden]"
          style={{ background: 'linear-gradient(135deg, #fde68a, #d97706)' }}
        >
          正
        </div>
        <div
          className="absolute inset-0 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-[0_6px_18px_rgba(0,0,0,0.35)] [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{ background: 'linear-gradient(135deg, #94a3b8, #475569)' }}
        >
          反
        </div>
      </motion.div>
    </div>
  );
}

// 页面加载即抛一次，统计与结果保持一致
const INITIAL_COINS = initCoins(2);
const INITIAL_FRONT = INITIAL_COINS.filter((c) => c.face === 'front').length;
const INITIAL_BACK = INITIAL_COINS.length - INITIAL_FRONT;

export default function CoinFlip() {
  const [coinNum, setCoinNum] = useState(2);
  const [coins, setCoins] = useState<CoinResult[]>(INITIAL_COINS);
  const [flipping, setFlipping] = useState(false);
  const [frontCount, setFrontCount] = useState(INITIAL_FRONT);
  const [backCount, setBackCount] = useState(INITIAL_BACK);
  const [total, setTotal] = useState(INITIAL_COINS.length);

  const flip = () => {
    if (flipping) return;
    const n = Math.max(1, Math.min(coinNum, 50));
    const next = Array.from({ length: n }, (_, i) => ({ id: Date.now() + i, face: randomFace() }));
    setFlipping(true);
    setCoins(next);
    window.setTimeout(() => {
      const f = next.filter((c) => c.face === 'front').length;
      const b = next.length - f;
      setFrontCount((v) => v + f);
      setBackCount((v) => v + b);
      setTotal((v) => v + next.length);
      setFlipping(false);
    }, 1150);
  };

  const reset = () => {
    setFrontCount(0);
    setBackCount(0);
    setTotal(0);
  };

  const frontPct = total > 0 ? Math.round((frontCount / total) * 100) : 0;
  /** 反面百分比与正面互补，避免两个独立 round 相加溢出/留缝 */
  const backPct = total > 0 ? 100 - frontPct : 0;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}24` }}>
            <Coins size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">随机抛硬币</h1>
        </div>
        <p className="text-[var(--text-secondary)] ml-[52px]">模拟抛硬币，自定义数量并统计正反面出现次数</p>
      </motion.div>

      <div className="glass-card p-6 mb-4">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <span>硬币数量</span>
            <input
              type="number"
              min={1}
              max={50}
              value={coinNum}
              onChange={(e) => setCoinNum(Math.max(1, Math.min(parseInt(e.target.value) || 1, 50)))}
              aria-label="硬币数量"
              className="w-20 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm outline-none focus:border-[#ffd369]/40"
            />
          </div>
          <button onClick={flip} disabled={flipping} className="btn-primary flex items-center gap-2 !px-6 disabled:opacity-60">
            <RefreshCw size={16} className={flipping ? 'animate-spin' : ''} /> {flipping ? '抛掷中...' : '抛硬币'}
          </button>
          <button onClick={reset} className="btn-secondary flex items-center gap-1.5 !px-4 text-sm">
            <RotateCcw size={14} /> 重置统计
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-5 min-h-[104px] items-center">
          {coins.map((c, i) => (
            <Coin key={c.id} face={c.face} delay={i * 0.08} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="glass-card p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg,#fde68a,#d97706)' }} />
            <span className="text-xs text-[var(--text-faint)]">正面</span>
          </div>
          <div className="font-['Syne'] font-bold text-3xl text-[var(--text-primary)]">{frontCount}</div>
          <div className="text-xs text-[var(--text-faint)] mt-1">{frontPct}%</div>
        </div>
        <div className="glass-card p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="w-3 h-3 rounded-full" style={{ background: 'linear-gradient(135deg,#94a3b8,#475569)' }} />
            <span className="text-xs text-[var(--text-faint)]">反面</span>
          </div>
          <div className="font-['Syne'] font-bold text-3xl text-[var(--text-primary)]">{backCount}</div>
          <div className="text-xs text-[var(--text-faint)] mt-1">{backPct}%</div>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="text-xs text-[var(--text-faint)] mb-3">正反面比例</div>
        <div className="flex h-3 rounded-full overflow-hidden bg-[var(--bg-hover)]">
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${frontPct}%`, background: 'linear-gradient(135deg,#fde68a,#d97706)' }}
          />
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${backPct}%`, background: 'linear-gradient(135deg,#94a3b8,#475569)' }}
          />
        </div>
        <div className="text-xs text-[var(--text-faint)] mt-3">累计抛掷：{total} 次</div>
      </div>
    </div>
  );
}

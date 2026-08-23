import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Dice1, Copy, Plus, Trash2, Play, RotateCcw } from 'lucide-react';

const color = '#f472b6';
const PALETTE = ['#f472b6', '#a78bfa', '#6bcb77', '#ffd369', '#00d9ff', '#e94560', '#f59e0b', '#60a5fa'];

interface Prize {
  name: string;
  weight: number;
}

const DEFAULT_PRIZES: Prize[] = [
  { name: '一等奖', weight: 1 },
  { name: '二等奖', weight: 3 },
  { name: '三等奖', weight: 6 },
  { name: '谢谢参与', weight: 10 },
];

function weightedPick(prizes: Prize[]): number {
  const total = prizes.reduce((s, p) => s + Math.max(p.weight, 0), 0);
  if (total <= 0) return -1;
  let r = Math.random() * total;
  for (let i = 0; i < prizes.length; i++) {
    r -= Math.max(prizes[i].weight, 0);
    if (r <= 0) return i;
  }
  return prizes.length - 1;
}

/**
 * 权重信息汇总，用于健壮性校验
 * @returns total 总权重（已归一为非负）；hasValid 是否满足「至少一个权重大于 0」且列表非空
 */
function getWeightInfo(prizes: Prize[]): { total: number; hasValid: boolean } {
  const total = prizes.reduce((s, p) => s + Math.max(p.weight || 0, 0), 0);
  return { total, hasValid: total > 0 && prizes.length > 0 };
}

const CONFETTI_COUNT = 22;

/** 抽中后从转盘中心爆出的环形彩带 */
function WheelConfetti({ winner, color }: { winner: string; color: string }) {
  const particles = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => {
        const angle = (i / CONFETTI_COUNT) * Math.PI * 2;
        const dist = 70 + Math.random() * 110;
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist - 50,
          rot: (Math.random() - 0.5) * 540,
          w: 5 + Math.random() * 8,
          h: 5 + Math.random() * 8,
          c: [color, '#ffd369', '#6bcb77', '#00d9ff', '#a78bfa', '#ffffff'][i % 6],
          delay: Math.random() * 0.18,
          dur: 0.7 + Math.random() * 0.5,
        };
      }),
    [winner, color],
  );
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.span
          key={`${winner}-${i}`}
          className="absolute rounded-[2px]"
          style={{ width: p.w, height: p.h, background: p.c }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
          animate={{ x: p.dx, y: p.dy, opacity: 0, scale: 0.5, rotate: p.rot }}
          transition={{ delay: p.delay, duration: p.dur, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

export default function LotteryWheel() {
  const [tab, setTab] = useState<'wheel' | 'draw'>('wheel');

  // ===== 转盘 =====
  const [prizes, setPrizes] = useState<Prize[]>(DEFAULT_PRIZES);
  const [rotation, setRotation] = useState(0);
  const [spinState, setSpinState] = useState<{ spinning: boolean; winner: string | null; winnerColor: string | null }>({
    spinning: false,
    winner: null,
    winnerColor: null,
  });
  const { spinning, winner, winnerColor } = spinState;
  const [wheelHistory, setWheelHistory] = useState<string[]>([]);

  const weightInfo = getWeightInfo(prizes);
  const totalWeight = weightInfo.total || 1;
  const hasValidWeight = weightInfo.hasValid;
  const segments = (() => {
    let acc = 0;
    return prizes.map((p) => {
      const start = acc;
      const angle = (Math.max(p.weight, 0) / totalWeight) * 360;
      acc += angle;
      return { start, end: acc, angle };
    });
  })();
  const gradient = segments
    .map((s, i) => `${PALETTE[i % PALETTE.length]} ${s.start}deg ${s.end}deg`)
    .join(', ');

  const spin = () => {
    if (spinning || !hasValidWeight) return;
    const idx = weightedPick(prizes);
    if (idx < 0) return;
    const seg = segments[idx];
    const center = (seg.start + seg.end) / 2;
    const spins = 5;
    const targetMod = (360 - center) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    let delta = targetMod - currentMod;
    if (delta < 0) delta += 360;
    const next = rotation + spins * 360 + delta;
    setSpinState({ spinning: true, winner: null, winnerColor: null });
    setRotation(next);
  };

  const onSpinEnd = () => {
    const currentMod = ((rotation % 360) + 360) % 360;
    const pointerLocal = (360 - currentMod) % 360;
    const idx = segments.findIndex((s) => pointerLocal >= s.start && pointerLocal < s.end);
    const w = idx >= 0 ? prizes[idx].name : '';
    setSpinState({
      spinning: false,
      winner: w,
      winnerColor: idx >= 0 ? PALETTE[idx % PALETTE.length] : color,
    });
    if (w) setWheelHistory((h) => [w, ...h].slice(0, 20));
  };

  const updatePrize = (i: number, patch: Partial<Prize>) => {
    setPrizes((prev) => prev.map((p, j) => (j === i ? { ...p, ...patch } : p)));
    setSpinState((s) => (s.winner !== null ? { ...s, winner: null, winnerColor: null } : s));
  };
  const removePrize = (i: number) => {
    setPrizes((prev) => prev.filter((_, j) => j !== i));
    setSpinState((s) => (s.winner !== null ? { ...s, winner: null, winnerColor: null } : s));
  };
  const addPrize = () => setPrizes((prev) => [...prev, { name: `奖项 ${prev.length + 1}`, weight: 1 }]);

  // ===== 抽签 =====
  const [candidates, setCandidates] = useState('张三\n李四\n王五\n赵六\n孙七');
  const [drawCount, setDrawCount] = useState(1);
  const [allowRepeat, setAllowRepeat] = useState(false);
  const [drawResult, setDrawResult] = useState<string[]>([]);
  const [drawCopied, setDrawCopied] = useState(false);

  const doDraw = () => {
    const list = candidates
      .split(/[\n,，]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length === 0) {
      setDrawResult([]);
      return;
    }
    const pool = [...list];
    const res: string[] = [];
    const k = Math.max(1, Math.floor(drawCount));
    for (let i = 0; i < k; i++) {
      if (!allowRepeat && pool.length === 0) break;
      const j = Math.floor(Math.random() * pool.length);
      res.push(pool[j]);
      if (!allowRepeat) pool.splice(j, 1);
    }
    setDrawResult(res);
    setDrawCopied(false);
  };

  const copyDraw = () => {
    if (drawResult.length === 0) return;
    navigator.clipboard.writeText(drawResult.join('\n'));
    setDrawCopied(true);
    setTimeout(() => setDrawCopied(false), 1500);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}24` }}>
            <Dice1 size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">抽奖转盘 / 抽签</h1>
        </div>
        <p className="text-[var(--text-secondary)] ml-[52px]">可自定义奖项与权重的概率转盘，以及随机抽签</p>
      </motion.div>

      <div className="flex flex-wrap gap-2 mb-6">
        {([
          { k: 'wheel', label: '概率转盘' },
          { k: 'draw', label: '随机抽签' },
        ] as const).map((m) => (
          <button
            key={m.k}
            onClick={() => setTab(m.k)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === m.k ? '' : 'bg-[var(--bg-hover)] text-[var(--text-faint)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
            style={tab === m.k ? { background: `${color}30`, border: `1px solid ${color}50` } : {}}
          >
            {m.label}
          </button>
        ))}
      </div>

      {tab === 'wheel' ? (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass-card p-6">
            <div className="relative w-72 h-72 mx-auto mb-4">
              <div
                className="absolute inset-0 rounded-full border-4 border-[var(--border-color)] shadow-2xl"
                style={{
                  background: `conic-gradient(${gradient})`,
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 4s cubic-bezier(0.17,0.67,0.12,0.99)' : 'none',
                }}
                onTransitionEnd={onSpinEnd}
              />
              {/* 指针：顶部朝下的三角 + 中心圆点，带发光 */}
              <div
                className={`absolute top-0 left-1/2 -translate-x-1/2 -mt-1 z-10 w-0 h-0 drop-shadow-lg ${
                  spinning ? 'animate-pulse-glow' : ''
                }`}
                style={{ borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '24px solid #fff' }}
              />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-[6px] w-3 h-3 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] z-10" />
              {/* 中心 GO */}
              <button
                onClick={spin}
                disabled={spinning || !hasValidWeight}
                aria-label={spinning ? '转盘旋转中' : '开始旋转'}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-[#111] border-2 flex items-center justify-center text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ borderColor: color }}
              >
                {spinning ? '...' : 'GO'}
              </button>
              {/* 抽中彩带 */}
              {winner && !spinning && winnerColor && (
                <WheelConfetti winner={winner} color={winnerColor} />
              )}
            </div>

            {!hasValidWeight && (
              <p className="text-center text-xs text-[#e94560] mb-3">请至少保留一个权重大于 0 的奖项</p>
            )}

            {winner && !spinning && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-center mb-4">
                <div className="text-xs text-[var(--text-faint)] mb-2">🎉 中奖</div>
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                  style={{ background: `${winnerColor ?? color}1a`, border: `1px solid ${winnerColor ?? color}50` }}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: winnerColor ?? color }} />
                  <span className="font-['Syne'] font-bold text-xl text-[var(--text-primary)]">{winner}</span>
                </div>
              </motion.div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {prizes.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-[var(--bg-hover)] rounded-full px-3 py-1 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                  <span className="text-[var(--text-primary)]">{p.name}</span>
                  <span className="text-[var(--text-faint)]">{((Math.max(p.weight, 0) / totalWeight) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm text-[var(--text-primary)] font-medium">奖项设置</h3>
              <button onClick={addPrize} className="btn-secondary flex items-center gap-1 !px-3 !py-1.5 text-xs">
                <Plus size={12} /> 添加
              </button>
            </div>
            <div className="space-y-2">
              {prizes.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PALETTE[i % PALETTE.length] }} />
                  <input
                    value={p.name}
                    onChange={(e) => updatePrize(i, { name: e.target.value })}
                    className="flex-1 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm outline-none focus:border-[#f472b6]/40"
                  />
                  <div className="flex items-center gap-1 text-xs text-[var(--text-faint)]">
                    <span>权重</span>
                    <input
                      type="number"
                      value={p.weight}
                      min={0}
                      onChange={(e) => updatePrize(i, { weight: parseFloat(e.target.value) || 0 })}
                      className="w-16 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-lg px-2 py-2 text-[var(--text-primary)] text-sm outline-none focus:border-[#f472b6]/40"
                    />
                  </div>
                  <button onClick={() => removePrize(i)} className="text-[var(--text-faint)] hover:text-[#e94560] p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            {wheelHistory.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[var(--border-color)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-[var(--text-faint)]">最近中奖</div>
                  <button
                    onClick={() => setWheelHistory([])}
                    className="text-[10px] text-[var(--text-faint)] hover:text-[#e94560] flex items-center gap-1"
                  >
                    <RotateCcw size={10} /> 清空
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {wheelHistory.map((h, i) => (
                    <span key={i} className="bg-[var(--bg-hover)] rounded px-2 py-0.5 text-xs text-[var(--text-secondary)]">{h}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="glass-card p-6">
            <label className="text-xs text-[var(--text-faint)] mb-1.5 block">候选名单（每行一个，或用逗号分隔）</label>
            <textarea
              value={candidates}
              onChange={(e) => setCandidates(e.target.value)}
              rows={5}
              className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-lg px-4 py-3 text-[var(--text-primary)] text-sm outline-none focus:border-[#f472b6]/40 resize-none"
            />
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-[var(--text-faint)]">
                <span>抽取数量</span>
                <input
                  type="number"
                  min={1}
                  value={drawCount}
                  onChange={(e) => setDrawCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-lg px-2 py-2 text-[var(--text-primary)] text-sm outline-none focus:border-[#f472b6]/40"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                <input type="checkbox" checked={allowRepeat} onChange={(e) => setAllowRepeat(e.target.checked)} className="accent-[#f472b6]" />
                允许重复
              </label>
              <button onClick={doDraw} className="btn-primary flex items-center gap-2 !px-6 ml-auto">
                <Play size={16} /> 抽签
              </button>
            </div>
          </div>

          {drawResult.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm text-[var(--text-primary)] font-medium">抽签结果</h3>
                <button onClick={copyDraw} className="btn-secondary flex items-center gap-2 !px-4 !py-1.5 text-xs">
                  <Copy size={12} /> {drawCopied ? '已复制' : '复制'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {drawResult.map((r, i) => (
                  <span key={i} className="bg-[var(--bg-secondary)] rounded-lg px-4 py-2 text-[var(--text-primary)] font-medium">{r}</span>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => { setCandidates(''); setDrawResult([]); }} className="btn-secondary flex items-center gap-2 !px-5 text-sm">
            <RotateCcw size={14} /> 清空名单
          </button>
        </motion.div>
      )}
    </div>
  );
}

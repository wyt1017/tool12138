import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Timer, Play, Pause, RotateCcw, Flag, Plus } from 'lucide-react';

const color = '#00d9ff';

function fmt(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  const base = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return h > 0 ? `${base}.${String(cs).padStart(2, '0')}` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

function fmtShort(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const cs = Math.floor((ms % 1000) / 10);
  return `${String(Math.floor(totalSec / 60)).padStart(2, '0')}:${String(totalSec % 60).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

interface Lap {
  id: number;
  total: number;
  diff: number;
}

export default function Stopwatch() {
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const [lapIdCounter, setLapIdCounter] = useState(0);
  const [, setTick] = useState(0);   // 驱动 RAF 循环触发重渲染

  // Refs for precise timing (avoid stale state in callbacks)
  const elapsedRef = useRef(0);      // total elapsed ms at last render
  const rafRef = useRef<number>(0);
  const startTimeRef = useRef(0);
  const storedRef = useRef(0);       // accumulated time from previous sessions

  // Load laps from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('stopwatch_laps');
      if (raw) {
        const parsed = JSON.parse(raw) as { laps: Lap[]; lapIdCounter: number; stored: number };
        setLaps(parsed.laps);
        setLapIdCounter(parsed.lapIdCounter);
        storedRef.current = parsed.stored ?? 0;
      }
    } catch { /* ignore */ }
  }, []);

  // Save laps to localStorage
  useEffect(() => {
    localStorage.setItem('stopwatch_laps', JSON.stringify({ laps, lapIdCounter, stored: storedRef.current }));
  }, [laps, lapIdCounter]);

  // RAF loop for smooth display
  useEffect(() => {
    if (!running) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    startTimeRef.current = performance.now();
    const tick = () => {
      elapsedRef.current = performance.now() - startTimeRef.current + storedRef.current;
      setTick((n) => n + 1);   // 触发重渲染，使正在显示的数字随计时刷新
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running]);

  const handleStart = () => {
    if (!running) {
      storedRef.current = elapsedRef.current;
      startTimeRef.current = performance.now();
      setRunning(true);
    } else {
      storedRef.current = elapsedRef.current;
      setRunning(false);
    }
  };

  const handleReset = () => {
    setRunning(false);
    cancelAnimationFrame(rafRef.current);
    elapsedRef.current = 0;
    storedRef.current = 0;
    setTick((n) => n + 1);   // 立即刷新显示归零
  };

  const handleLap = () => {
    const currentTotal = elapsedRef.current;
    const prevTotal = laps.length > 0 ? laps[0].total : 0;
    const diff = currentTotal - prevTotal;
    const newLap: Lap = {
      id: lapIdCounter,
      total: currentTotal,
      diff,
    };
    setLaps([newLap, ...laps]);
    setLapIdCounter((c) => c + 1);
  };

  const handleClear = () => {
    handleReset();
    setLaps([]);
    localStorage.removeItem('stopwatch_laps');
  };

  const displayElapsed = running ? elapsedRef.current : storedRef.current;
  const bestLap = laps.length > 1 ? Math.min(...laps.map((l) => l.diff)) : 0;
  const worstLap = laps.length > 1 ? Math.max(...laps.map((l) => l.diff)) : 0;
  const avgDiff = laps.length > 1 ? laps.reduce((a, b) => a + b.diff, 0) / laps.length : 0;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}24` }}>
            <Timer size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">秒表</h1>
        </div>
        <p className="text-[var(--text-secondary)] ml-[52px]">毫秒精度计时，支持分段记录和最快/最慢圈识别</p>
      </motion.div>

      {/* Timer Display */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-10 flex flex-col items-center mb-6">
        <div className="font-['Syne'] font-bold text-7xl sm:text-8xl text-[var(--text-primary)] tabular-nums tracking-tight mb-8">
          {fmt(displayElapsed)}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleStart}
            className="btn-primary flex items-center gap-2 !px-8 !py-3 text-base"
          >
            {running ? <Pause size={18} /> : <Play size={18} />}
            {running ? '暂停' : '开始'}
          </button>
          {running && (
            <button
              onClick={handleLap}
              className="btn-secondary flex items-center gap-2 !px-6 !py-3"
            >
              <Flag size={16} style={{ color }} /> 计圈
            </button>
          )}
          {!running && elapsedRef.current > 0 && (
            <button
              onClick={() => {
                storedRef.current = elapsedRef.current;
                startTimeRef.current = performance.now();
                setRunning(true);
              }}
              className="btn-secondary flex items-center gap-2 !px-6 !py-3"
            >
              <Play size={16} /> 继续
            </button>
          )}
          {(elapsedRef.current > 0 || laps.length > 0) && (
            <button
              onClick={handleReset}
              className="btn-secondary flex items-center gap-2 !px-5 !py-3"
            >
              <RotateCcw size={15} /> 重置
            </button>
          )}
        </div>
      </motion.div>

      {/* Laps */}
      {laps.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">计圈记录</h3>
            <button onClick={handleClear} className="text-xs text-[var(--text-faint)] hover:text-[#e94560] transition-colors flex items-center gap-1">
              <Plus size={12} className="rotate-45" /> 清空
            </button>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {laps.map((lap, i) => {
              const isBest = laps.length > 1 && lap.diff === bestLap;
              const isWorst = laps.length > 1 && lap.diff === worstLap;
              const idx = laps.length - i;
              return (
                <div
                  key={lap.id}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-sm ${
                    isBest ? 'bg-green-500/10 border border-green-500/20' :
                    isWorst ? 'bg-red-500/10 border border-red-500/20' :
                    'bg-[var(--bg-hover)]'
                  }`}
                >
                  <span className="text-[var(--text-faint)] w-12">#{idx}</span>
                  <span className="text-[var(--text-primary)] font-mono">{fmtShort(lap.diff)}</span>
                  <span className="text-[var(--text-secondary)] font-mono text-xs">{fmt(lap.total)}</span>
                  {isBest && <span className="text-xs text-green-400 ml-2">最快</span>}
                  {isWorst && <span className="text-xs text-[var(--danger)] ml-2">最慢</span>}
                </div>
              );
            })}
          </div>
          {laps.length > 1 && (
            <div className="flex gap-4 mt-4 pt-4 border-t border-[var(--border-color)] text-xs text-[var(--text-faint)]">
              <span>平均：{fmtShort(avgDiff)}</span>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Timer,
  Clock,
  ListTodo,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Check,
  Trash2,
} from 'lucide-react';

const color = '#6bcb77';

type Tab = 'pomodoro' | 'countdown' | 'todo';

interface Todo {
  id: string;
  text: string;
  done: boolean;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

function ProgressRing({ value, total }: { value: number; total: number }) {
  const size = 220;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        style={{ transition: 'stroke-dashoffset 0.4s linear' }}
      />
    </svg>
  );
}

export default function PomodoroTodo() {
  const [tab, setTab] = useState<Tab>('pomodoro');

  // ===== 番茄钟 =====
  const [focusMin, setFocusMin] = useState(25);
  const [breakMin, setBreakMin] = useState(5);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (secondsLeft > 0) return;
    if (mode === 'focus') {
      setCompleted((c) => c + 1);
      setMode('break');
      setSecondsLeft(breakMin * 60);
    } else {
      setMode('focus');
      setSecondsLeft(focusMin * 60);
    }
  }, [secondsLeft, mode, focusMin, breakMin]);

  const resetPomodoro = () => {
    setRunning(false);
    setMode('focus');
    setSecondsLeft(focusMin * 60);
  };

  // ===== 倒计时 =====
  const [cdMin, setCdMin] = useState(10);
  const [cdLeft, setCdLeft] = useState(10 * 60);
  const [cdRunning, setCdRunning] = useState(false);
  const cdTotalRef = useRef(10 * 60);

  useEffect(() => {
    if (!cdRunning) return;
    const id = setInterval(() => setCdLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cdRunning]);

  useEffect(() => {
    if (cdRunning && cdLeft <= 0) setCdRunning(false);
  }, [cdLeft, cdRunning]);

  const startCountdown = () => {
    cdTotalRef.current = cdMin * 60;
    setCdLeft(cdMin * 60);
    setCdRunning(true);
  };

  // ===== 待办 =====
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const raw = localStorage.getItem('pomodoro_todos');
      return raw ? (JSON.parse(raw) as Todo[]) : [];
    } catch {
      return [];
    }
  });
  const [todoInput, setTodoInput] = useState('');

  useEffect(() => {
    localStorage.setItem('pomodoro_todos', JSON.stringify(todos));
  }, [todos]);

  const addTodo = () => {
    const text = todoInput.trim();
    if (!text) return;
    setTodos((t) => [...t, { id: Date.now().toString(), text, done: false }]);
    setTodoInput('');
  };
  const toggleTodo = (id: string) => setTodos((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  const delTodo = (id: string) => setTodos((t) => t.filter((x) => x.id !== id));

  const tabs: { key: Tab; label: string; icon: typeof Timer }[] = [
    { key: 'pomodoro', label: '番茄钟', icon: Timer },
    { key: 'countdown', label: '倒计时', icon: Clock },
    { key: 'todo', label: '待办清单', icon: ListTodo },
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}24` }}>
            <Timer size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">番茄钟 · 倒计时 · 待办</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">专注计时、自定义倒计时与本地待办清单，数据保存在本机浏览器</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors"
              style={{
                background: active ? `${color}24` : 'rgba(255,255,255,0.05)',
                color: active ? color : '#666',
                border: active ? `${color}4d` : 'none',
              }}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* 番茄钟 */}
      {tab === 'pomodoro' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 flex flex-col items-center">
          <div className="flex gap-2 mb-6">
            {(['focus', 'break'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setRunning(false);
                  setSecondsLeft((m === 'focus' ? focusMin : breakMin) * 60);
                }}
                className="px-4 py-1.5 rounded-full text-sm"
                style={{
                  background: mode === m ? `${color}24` : 'transparent',
                  color: mode === m ? color : '#666',
                  border: `1px solid ${mode === m ? `${color}4d` : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                {m === 'focus' ? '专注' : '休息'}
              </button>
            ))}
          </div>

          <div className="relative flex items-center justify-center mb-6">
            <ProgressRing value={secondsLeft} total={(mode === 'focus' ? focusMin : breakMin) * 60} />
            <div className="absolute text-center">
              <div className="font-['Syne'] font-bold text-5xl text-white">{fmt(secondsLeft)}</div>
              <div className="text-xs mt-1" style={{ color }}>{mode === 'focus' ? '专注中' : '休息中'}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setRunning((r) => !r)} className="btn-primary flex items-center gap-2 !px-6">
              {running ? <Pause size={16} /> : <Play size={16} />} {running ? '暂停' : '开始'}
            </button>
            <button onClick={resetPomodoro} className="btn-secondary flex items-center gap-2">
              <RotateCcw size={15} /> 重置
            </button>
          </div>

          <div className="flex items-center gap-6 text-sm text-[#666]">
            <label className="flex items-center gap-2">
              专注(分)
              <input type="number" min={1} max={120} value={focusMin}
                onChange={(e) => { const v = Math.max(1, Number(e.target.value) || 1); setFocusMin(v); if (mode === 'focus' && !running) setSecondsLeft(v * 60); }}
                className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-white outline-none focus:border-[#00d9ff]/30" />
            </label>
            <label className="flex items-center gap-2">
              休息(分)
              <input type="number" min={1} max={60} value={breakMin}
                onChange={(e) => { const v = Math.max(1, Number(e.target.value) || 1); setBreakMin(v); if (mode === 'break' && !running) setSecondsLeft(v * 60); }}
                className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-white outline-none focus:border-[#00d9ff]/30" />
            </label>
            <span>已完成番茄：<b style={{ color }}>{completed}</b></span>
          </div>
        </motion.div>
      )}

      {/* 倒计时 */}
      {tab === 'countdown' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 flex flex-col items-center">
          <div className="relative flex items-center justify-center mb-6">
            <ProgressRing value={cdLeft} total={cdTotalRef.current || 1} />
            <div className="absolute text-center">
              <div className="font-['Syne'] font-bold text-5xl text-white">{fmt(cdLeft)}</div>
              <div className="text-xs mt-1 text-[#a8b2c1]">剩余时间</div>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => (cdRunning ? setCdRunning(false) : startCountdown())}
              className="btn-primary flex items-center gap-2 !px-6" disabled={cdMin <= 0}>
              {cdRunning ? <Pause size={16} /> : <Play size={16} />} {cdRunning ? '暂停' : '开始'}
            </button>
            <button onClick={() => { cdTotalRef.current = cdMin * 60; setCdRunning(false); setCdLeft(cdMin * 60); }} className="btn-secondary flex items-center gap-2">
              <RotateCcw size={15} /> 重置
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-[#666]">
            设定分钟
            <input type="number" min={1} max={600} value={cdMin}
              onChange={(e) => { const v = Math.max(1, Number(e.target.value) || 1); setCdMin(v); if (!cdRunning) setCdLeft(v * 60); }}
              className="w-20 bg-white/5 border border-white/10 rounded px-2 py-1 text-white outline-none focus:border-[#00d9ff]/30" />
          </label>
        </motion.div>
      )}

      {/* 待办 */}
      {tab === 'todo' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
          <div className="flex gap-2 mb-4">
            <input
              value={todoInput}
              onChange={(e) => setTodoInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTodo()}
              placeholder="添加一项待办，回车确认..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-[#00d9ff]/30"
            />
            <button onClick={addTodo} className="btn-primary flex items-center gap-2 !px-5">
              <Plus size={16} /> 添加
            </button>
          </div>

          {todos.length === 0 ? (
            <div className="text-center text-[#555] py-10">还没有待办，添加第一条吧</div>
          ) : (
            <ul className="space-y-2">
              {todos.map((t) => (
                <li key={t.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3 group">
                  <button onClick={() => toggleTodo(t.id)}
                    className="w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{ borderColor: t.done ? color : 'rgba(255,255,255,0.2)', background: t.done ? color : 'transparent' }}>
                    {t.done && <Check size={13} className="text-white" />}
                  </button>
                  <span className={`flex-1 ${t.done ? 'line-through text-[#555]' : 'text-white'}`}>{t.text}</span>
                  <button onClick={() => delTodo(t.id)} className="text-[#555] hover:text-[#e94560] opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {todos.length > 0 && (
            <div className="text-xs text-[#666] mt-4">
              已完成 {todos.filter((t) => t.done).length} / {todos.length} · 数据仅保存在本机
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Keyboard, RotateCcw, Trophy } from 'lucide-react';

const color = '#f472b6';

const WORD_BANK = [
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it',
  'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this',
  'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or',
  'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'about', 'which', 'when', 'make', 'like', 'time', 'just', 'him', 'know',
  'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
  'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its',
  'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our',
  'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any',
  'these', 'give', 'day', 'most', 'us', 'great', 'between', 'need', 'large',
  'under', 'never', 'each', 'right', 'thought', 'where', 'much', 'through',
  'long', 'always', 'world', 'very', 'still', 'own', 'should', 'before',
  'again', 'place', 'last', 'hand', 'high', 'point',
];

function generateWords(count: number): string[] {
  const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5);
  const result: string[] = [];
  while (result.length < count) {
    result.push(...shuffled);
  }
  return result.slice(0, count);
}

interface Stats {
  wpm: number;
  accuracy: number;
  charsTyped: number;
  charsCorrect: number;
  time: number;
}

interface HistoryEntry {
  date: string;
  wpm: number;
  accuracy: number;
  length: number;
}

const STORAGE_KEY = 'typing_speed_history';

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch { return []; }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 50)));
}

type Phase = 'idle' | 'typing' | 'done';

export default function TypingSpeedTest() {
  const [wordCount, setWordCount] = useState(25);
  const [words, setWords] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [typedIndex, setTypedIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [startTime, setStartTime] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const inputRef = useRef<HTMLInputElement>(null);

  const initWords = useCallback((count: number) => {
    setWords(generateWords(count));
    setTypedIndex(0);
    setCurrentInput('');
    setPhase('idle');
    setStats(null);
    setStartTime(0);
  }, []);

  useEffect(() => {
    initWords(wordCount);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClick = () => {
    if (phase === 'done') return;
    inputRef.current?.focus();
  };

  const startTest = () => {
    setStartTime(Date.now());
    setPhase('typing');
  };

  const finishTest = (finalStats: Stats) => {
    setPhase('done');
    setStats(finalStats);
    const entry: HistoryEntry = {
      date: new Date().toLocaleDateString('zh-CN'),
      wpm: finalStats.wpm,
      accuracy: finalStats.accuracy,
      length: wordCount,
    };
    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, 7);
      saveHistory(updated);
      return updated;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (phase === 'done') return;
    const val = e.target.value;
    if (phase === 'idle') startTest();

    const expectedWord = words[typedIndex];
    if (!expectedWord) return;

    if (val.endsWith(' ') || val.endsWith('\n')) {
      const submitted = val.trim();
      const isCorrect = submitted === expectedWord;
      const newTypedIndex = typedIndex + 1;

      setStats((prev) => {
        const charsTyped = (prev?.charsTyped ?? 0) + expectedWord.length;
        const charsCorrect = (prev?.charsCorrect ?? 0) + (isCorrect ? expectedWord.length : 0);
        const accuracy = charsTyped > 0 ? Math.round((charsCorrect / charsTyped) * 100) : 100;
        return prev ? { ...prev, charsTyped, charsCorrect, accuracy } : { wpm: 0, accuracy, charsTyped, charsCorrect, time: 0 };
      });

      if (newTypedIndex >= words.length) {
        const elapsed = (Date.now() - startTime) / 1000 / 60;
        const wpm = elapsed > 0 ? Math.round(newTypedIndex / elapsed) : 0;
        const time = Math.round((Date.now() - startTime) / 1000);
        // 正确累计：前面 newTypedIndex-1 个词均已正确通过，末词按 isCorrect 判定
        const allTyped = words.slice(0, newTypedIndex);
        const charsTyped = allTyped.reduce((sum, w) => sum + w.length, 0);
        const charsCorrect = charsTyped - (isCorrect ? 0 : allTyped[newTypedIndex - 1].length);
        const finalAccuracy = charsTyped > 0 ? Math.round((charsCorrect / charsTyped) * 100) : 100;
        const finalStats: Stats = { wpm, accuracy: finalAccuracy, charsTyped, charsCorrect, time };
        setTypedIndex(newTypedIndex);
        setCurrentInput('');
        setStats(finalStats);
        finishTest(finalStats);
      } else {
        setTypedIndex(newTypedIndex);
        setCurrentInput('');
      }
      return;
    }

    setCurrentInput(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      initWords(wordCount);
    }
  };

  const reset = () => {
    initWords(wordCount);
    setStats(null);
    inputRef.current?.blur();
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12" onClick={handleClick}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}24` }}>
            <Keyboard size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-[var(--text-primary)]">打字速度测试</h1>
        </div>
        <p className="text-[var(--text-secondary)] ml-[52px]">测试你的英文打字速度和准确率，记录历史成绩</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex gap-2 mb-6">
        {[15, 25, 50, 100].map((n) => (
          <button
            key={n}
            onClick={() => { setWordCount(n); initWords(n); setStats(null); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              wordCount === n ? 'text-[var(--text-primary)]' : 'bg-[var(--bg-hover)] text-[var(--text-faint)] hover:text-[var(--text-primary)]'
            }`}
            style={wordCount === n ? { background: `${color}30`, border: `1px solid ${color}50` } : {}}
          >
            {n}词
          </button>
        ))}
      </motion.div>

      {phase !== 'done' ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8 mb-6">
          <div className="text-2xl leading-relaxed font-mono select-none mb-6 min-h-[160px]">
            {words.map((word, i) => {
              if (i < typedIndex) return <span key={i} className="text-green-400">{word} </span>;
              if (i === typedIndex) {
                let charIdx = 0;
                const visibleChars = [];
                for (const ch of currentInput) {
                  visibleChars.push(
                    <span key={charIdx} className={ch === word[charIdx] ? 'text-[var(--text-primary)]' : 'text-[var(--danger)] underline'}>{ch}</span>
                  );
                  charIdx++;
                }
                return (
                  <span key={i}>
                    {visibleChars}
                    <span className="text-[var(--text-secondary)]">{word.slice(charIdx)}</span>
                    <span className="inline-block w-0.5 h-6 bg-[#a78bfa] animate-pulse ml-0.5 align-middle" />
                  </span>
                );
              }
              return <span key={i} className="text-[var(--text-faint)]">{word} </span>;
            })}
          </div>

          <input
            ref={inputRef}
            value={currentInput}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="开始打字..."
            autoFocus
            className="sr-only"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />

          <div className="flex items-center justify-between text-sm text-[var(--text-faint)]">
            <div className="flex items-center gap-4">
              {phase === 'typing' && (
                <>
                  <span>已输入：<b className="text-[var(--text-primary)]">{typedIndex + 1}</b> / {words.length}</span>
                  {stats && <span>准确率：<b className="text-[var(--text-primary)]">{stats.accuracy}%</b></span>}
                </>
              )}
            </div>
            <button onClick={reset} className="btn-secondary !px-3 !py-1.5 text-xs flex items-center gap-1">
              <RotateCcw size={12} /> 重新开始
            </button>
          </div>
        </motion.div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-card p-8 mb-6">
            <div className="text-center mb-8">
              <div className="font-['Syne'] font-bold text-7xl text-[var(--text-primary)] mb-2">{stats?.wpm ?? 0}</div>
              <div className="text-lg text-[var(--text-secondary)]">WPM（每分钟单词数）</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[var(--bg-hover)] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">{stats?.accuracy ?? 0}%</div>
                <div className="text-xs text-[var(--text-faint)]">准确率</div>
              </div>
              <div className="bg-[var(--bg-hover)] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">{stats?.time ?? 0}s</div>
                <div className="text-xs text-[var(--text-faint)]">用时</div>
              </div>
              <div className="bg-[var(--bg-hover)] rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-[var(--text-primary)] mb-1">{wordCount}词</div>
                <div className="text-xs text-[var(--text-faint)]">测试长度</div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex gap-3 mb-8">
            <button onClick={() => { initWords(wordCount); setStats(null); }} className="btn-primary flex items-center gap-2 !px-8">
              <RotateCcw size={16} /> 再来一次
            </button>
          </motion.div>

          {history.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-5">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-4">
                <Trophy size={14} style={{ color }} />
                <span>历史记录</span>
              </div>
              <div className="space-y-2">
                {history.slice(0, 5).map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-sm bg-[var(--bg-hover)] rounded-lg px-4 py-2.5">
                    <span className="text-[var(--text-faint)]">{h.date}</span>
                    <span className="text-[var(--text-primary)] font-semibold">{h.wpm} WPM</span>
                    <span className="text-[var(--text-faint)]">{h.accuracy}% 准确率</span>
                    <span className="text-[var(--text-faint)] text-xs">{h.length}词</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

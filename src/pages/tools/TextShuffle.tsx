import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shuffle, Copy, RotateCcw, RefreshCw, Gift, Scale, ListOrdered, ListRestart } from 'lucide-react';

function fisherYatesShuffle<T>(arr: T[], times: number = 1): T[] {
  const result = [...arr];
  for (let t = 0; t < times; t++) {
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
  }
  return result;
}

function weightedRandomPick<T>(items: T[], weights: number[], count: number): T[] {
  const result: T[] = [];
  const available = items.map((item, i) => ({ item, weight: weights[i] || 1 }));
  for (let i = 0; i < count && available.length > 0; i++) {
    const totalWeight = available.reduce((sum, a) => sum + a.weight, 0);
    let random = Math.random() * totalWeight;
    let selectedIndex = 0;
    for (let j = 0; j < available.length; j++) {
      random -= available[j].weight;
      if (random <= 0) {
        selectedIndex = j;
        break;
      }
    }
    result.push(available[selectedIndex].item);
    available.splice(selectedIndex, 1);
  }
  return result;
}

export default function TextShuffle() {
  const [input, setInput] = useState('');
  const [shuffleCount, setShuffleCount] = useState(1);
  const [mode, setMode] = useState<'shuffle' | 'lottery' | 'weighted'>('shuffle');
  const [lotteryCount, setLotteryCount] = useState(1);
  const [weightsInput, setWeightsInput] = useState('');
  const [shuffledLines, setShuffledLines] = useState<string[]>([]);
  const [hasShuffled, setHasShuffled] = useState(false);

  const originalLines = useMemo(() => {
    return input.split('\n').filter((line) => line.trim() !== '');
  }, [input]);

  const weightsArray = useMemo(() => {
    if (!weightsInput.trim()) return originalLines.map(() => 1);
    return weightsInput.split('\n').map((w) => {
      const num = parseInt(w.trim(), 10);
      return isNaN(num) ? 1 : Math.max(1, num);
    });
  }, [weightsInput, originalLines]);

  const handleShuffle = useCallback(() => {
    if (originalLines.length === 0) return;
    if (mode === 'shuffle') {
      setShuffledLines(fisherYatesShuffle(originalLines, shuffleCount));
    } else if (mode === 'lottery') {
      setShuffledLines(fisherYatesShuffle(originalLines).slice(0, Math.min(lotteryCount, originalLines.length)));
    } else if (mode === 'weighted') {
      setShuffledLines(weightedRandomPick(originalLines, weightsArray, lotteryCount));
    }
    setHasShuffled(true);
  }, [originalLines, shuffleCount, mode, lotteryCount, weightsArray]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(shuffledLines.join('\n'));
  }, [shuffledLines]);

  const handleReset = useCallback(() => {
    setShuffledLines([]);
    setHasShuffled(false);
  }, []);

  const handleRestore = useCallback(() => {
    setShuffledLines([...originalLines]);
    setHasShuffled(true);
  }, [originalLines]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#ffd369]/15 flex items-center justify-center">
            <Shuffle size={20} className="text-[#ffd369]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">文本打乱</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">多行文本随机打乱、抽奖抽取、加权随机等工具</p>
      </motion.div>

      {/* Mode Selector */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-4 mb-6"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-[#a8b2c1] mr-2">模式：</span>
          <button
            onClick={() => setMode('shuffle')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'shuffle' ? 'bg-[#ffd369]/15 text-[#ffd369]' : 'bg-white/5 text-[#666] hover:text-[#a8b2c1]'
            }`}
          >
            <ListRestart size={14} className="inline mr-1" /> 随机打乱
          </button>
          <button
            onClick={() => setMode('lottery')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'lottery' ? 'bg-[#ffd369]/15 text-[#ffd369]' : 'bg-white/5 text-[#666] hover:text-[#a8b2c1]'
            }`}
          >
            <Gift size={14} className="inline mr-1" /> 抽奖模式
          </button>
          <button
            onClick={() => setMode('weighted')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'weighted' ? 'bg-[#ffd369]/15 text-[#ffd369]' : 'bg-white/5 text-[#666] hover:text-[#a8b2c1]'
            }`}
          >
            <Scale size={14} className="inline mr-1" /> 加权随机
          </button>

          <div className="h-5 w-px bg-white/10 mx-2" />

          {mode === 'shuffle' && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#a8b2c1]">打乱次数</label>
              <input
                type="number"
                min={1}
                max={100}
                value={shuffleCount}
                onChange={(e) => setShuffleCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                aria-label="打乱次数"
                className="w-20 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#ffd369]/50"
              />
            </div>
          )}

          {(mode === 'lottery' || mode === 'weighted') && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#a8b2c1]">抽取数量</label>
              <input
                type="number"
                min={1}
                value={lotteryCount}
                onChange={(e) => setLotteryCount(Math.max(1, parseInt(e.target.value) || 1))}
                aria-label="抽取数量"
                className="w-20 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-[#ffd369]/50"
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      {input && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-6 mb-4 px-1"
        >
          <div className="flex items-center gap-2">
            <ListOrdered size={14} className="text-[#ffd369]" />
            <span className="text-xs text-[#666]">总行数</span>
            <span className="font-mono text-sm text-[#a8b2c1]">{originalLines.length}</span>
          </div>
          {hasShuffled && (
            <>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#666]">结果行数</span>
                <span className="font-mono text-sm text-[#ffd369]">{shuffledLines.length}</span>
              </div>
            </>
          )}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">原始文本（每行一条）</label>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"输入多行文本，每行一个条目...\n\n例如：\n张三\n李四\n王五\n赵六"}
            aria-label="原始文本"
            className="tool-area w-full h-[360px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#ffd369]/30 transition-colors placeholder:text-[#333]"
          />
        </motion.div>

        {/* Output / Weight Input */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          {mode === 'weighted' ? (
            <>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="text-sm font-medium text-[#a8b2c1]">权重设置（每行对应一个权重值）</label>
              </div>
              <textarea
                value={weightsInput}
                onChange={(e) => setWeightsInput(e.target.value)}
                placeholder={"输入每行的权重，每行一个数字...\n\n例如：\n10\n5\n3\n2\n（数值越大，被抽中概率越高）"}
                aria-label="权重设置"
                className="tool-area w-full h-[360px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#ffd369]/30 transition-colors placeholder:text-[#333]"
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2 ml-1">
                <label className="text-sm font-medium text-[#a8b2c1]">
                  {mode === 'lottery' ? '抽取结果' : '打乱结果'}
                </label>
                {hasShuffled && shuffledLines.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button onClick={handleCopy} className="btn-secondary !py-1.5 !px-3 text-xs">
                      <Copy size={13} className="inline mr-1" /> 复制
                    </button>
                    <button onClick={handleRestore} className="btn-secondary !py-1.5 !px-3 text-xs">
                      <RotateCcw size={13} className="inline mr-1" /> 恢复原序
                    </button>
                  </div>
                )}
              </div>
              <div className="tool-area w-full h-[360px] p-5 overflow-y-auto">
                {hasShuffled && shuffledLines.length > 0 ? (
                  <ul className="space-y-1.5">
                    {shuffledLines.map((line, index) => (
                      <li key={index} className="flex items-center gap-3 text-sm text-[#a8b2c1] py-1 px-2 rounded hover:bg-white/5 transition-colors">
                        <span className="text-xs text-[#555] w-8 text-right font-mono shrink-0">{index + 1}.</span>
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[#333] text-sm">点击下方按钮开始{mode === 'lottery' ? '抽取' : '打乱'}...</p>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex items-center justify-center gap-4 mt-6"
      >
        <button onClick={handleShuffle} disabled={originalLines.length === 0} className="btn-primary flex items-center gap-2">
          <RefreshCw size={16} />
          {mode === 'shuffle' ? `打乱 (${shuffleCount}次)` : mode === 'lottery' ? `抽取 ${lotteryCount} 条` : '加权抽取'}
        </button>
        {hasShuffled && (
          <button onClick={handleShuffle} className="btn-secondary flex items-center gap-2">
            <ListRestart size={16} /> 重新{mode === 'lottery' ? '抽取' : '打乱'}
          </button>
        )}
        {hasShuffled && (
          <button onClick={handleReset} className="btn-secondary !text-red-400 flex items-center gap-2">
            <RotateCcw size={16} /> 重置
          </button>
        )}
      </motion.div>
    </div>
  );
}

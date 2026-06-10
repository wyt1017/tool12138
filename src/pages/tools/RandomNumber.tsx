import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Dices, Copy, RefreshCw, Dice1 } from 'lucide-react';

type Separator = ',' | '\n' | ' ';

export default function RandomNumber() {
  const [minVal, setMinVal] = useState<number>(0);
  const [maxVal, setMaxVal] = useState<number>(100);
  const [count, setCount] = useState<number>(10);
  const [allowDecimal, setAllowDecimal] = useState<boolean>(false);
  const [decimalPlaces, setDecimalPlaces] = useState<number>(2);
  const [allowDuplicate, setAllowDuplicate] = useState<boolean>(true);
  const [results, setResults] = useState<number[]>([]);
  const [separator, setSeparator] = useState<Separator>(',');

  const generateRandomNumber = (): number => {
    if (allowDecimal) {
      const range = maxVal - minVal;
      const raw = crypto.getRandomValues(new Uint32Array(1))[0] / (0xFFFFFFFF + 1);
      const val = minVal + raw * range;
      return parseFloat(val.toFixed(decimalPlaces));
    }
    const minInt = Math.ceil(minVal);
    const maxInt = Math.floor(maxVal);
    const range = maxInt - minInt + 1;
    // Use rejection sampling to avoid modulo bias
    const limit = Math.floor((0xFFFFFFFF + 1) / range) * range;
    let raw: number;
    do {
      raw = crypto.getRandomValues(new Uint32Array(1))[0];
    } while (raw >= limit);
    return (raw % range) + minInt;
  };

  const generate = () => {
    const actualCount = Math.max(1, Math.min(count, 10000));
    const nums: number[] = [];
    const used = new Set<number>();

    if (!allowDuplicate) {
      // Check if enough unique values are possible
      if (allowDecimal) {
        // For decimals, we can't easily pre-calculate, use retry approach
        for (let i = 0; i < actualCount; i++) {
          let num = generateRandomNumber();
          let attempts = 0;
          while (used.has(num) && attempts < actualCount * 10) {
            num = generateRandomNumber();
            attempts++;
          }
          if (!used.has(num)) {
            used.add(num);
            nums.push(num);
          }
        }
      } else {
        // For integers, check if range is large enough
        const minInt = Math.ceil(minVal);
        const maxInt = Math.floor(maxVal);
        const totalRange = maxInt - minInt + 1;
        if (actualCount > totalRange) {
          // Can't generate more unique numbers than the range allows
          // Generate all values in range and shuffle
          const allValues = Array.from({ length: totalRange }, (_, i) => minInt + i);
          for (let i = allValues.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allValues[i], allValues[j]] = [allValues[j], allValues[i]];
          }
          nums.push(...allValues.slice(0, actualCount));
        } else {
          for (let i = 0; i < actualCount; i++) {
            let num = generateRandomNumber();
            let attempts = 0;
            while (used.has(num) && attempts < actualCount * 10) {
              num = generateRandomNumber();
              attempts++;
            }
            if (!used.has(num)) {
              used.add(num);
              nums.push(num);
            }
          }
        }
      }
    } else {
      for (let i = 0; i < actualCount; i++) {
        nums.push(generateRandomNumber());
      }
    }
    setResults(nums);
  };

  const stats = useMemo(() => {
    if (results.length === 0) return null;
    const min = Math.min(...results);
    const max = Math.max(...results);
    const sum = results.reduce((a, b) => a + b, 0);
    const avg = sum / results.length;
    return { min, max, avg, sum };
  }, [results]);

  const outputText = results.length > 0
    ? separator === '\n'
      ? results.join('\n')
      : results.map(n => allowDecimal ? n.toString() : n.toString()).join(separator)
    : '';

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/15 flex items-center justify-center">
            <Dices size={20} className="text-[#a78bfa]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">随机数生成器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">生成指定范围内的随机数字，支持整数与小数、去重等选项</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1">
          <div className="glass-card p-6 space-y-5">
            <h3 className="text-sm font-semibold text-white mb-4">参数设置</h3>

            <div>
              <label className="text-xs text-[#a8b2c1] block mb-1.5">最小值</label>
              <input
                type="number"
                value={minVal}
                onChange={(e) => setMinVal(Number(e.target.value))}
                aria-label="最小值"
                className="tool-area w-full px-3 py-2 text-sm text-white outline-none focus:border-[#a78bfa]/30"
              />
            </div>

            <div>
              <label className="text-xs text-[#a8b2c1] block mb-1.5">最大值</label>
              <input
                type="number"
                value={maxVal}
                onChange={(e) => setMaxVal(Number(e.target.value))}
                aria-label="最大值"
                className="tool-area w-full px-3 py-2 text-sm text-white outline-none focus:border-[#a78bfa]/30"
              />
            </div>

            <div>
              <label className="text-xs text-[#a8b2c1] block mb-1.5">生成数量</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Math.max(1, Math.min(Number(e.target.value), 10000)))}
                min={1}
                max={10000}
                aria-label="生成数量"
                className="tool-area w-full px-3 py-2 text-sm text-white outline-none focus:border-[#a78bfa]/30"
              />
            </div>

            {/* Decimal Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#a8b2c1]">包含小数</label>
              <button
                onClick={() => setAllowDecimal(!allowDecimal)}
                className={`relative w-11 h-6 rounded-full transition-colors ${allowDecimal ? 'bg-[#a78bfa]' : 'bg-white/10'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${allowDecimal ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            {allowDecimal && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <label className="text-xs text-[#a8b2c1] block mb-1.5">小数位数 ({decimalPlaces})</label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={decimalPlaces}
                  onChange={(e) => setDecimalPlaces(Number(e.target.value))}
                  aria-label="小数位数"
                  className="w-full accent-[#a78bfa]"
                />
                <div className="flex justify-between text-[10px] text-[#555] mt-1">
                  <span>1位</span><span>10位</span>
                </div>
              </motion.div>
            )}

            {/* Duplicate Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-xs text-[#a8b2c1]">允许重复</label>
              <button
                onClick={() => setAllowDuplicate(!allowDuplicate)}
                className={`relative w-11 h-6 rounded-full transition-colors ${allowDuplicate ? 'bg-[#a78bfa]' : 'bg-white/10'}`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${allowDuplicate ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            <div className="pt-2 border-t border-white/5">
              <p className="text-xs text-[#555]">范围: [{minVal}, {maxVal}]</p>
            </div>

            <button onClick={generate} className="btn-primary w-full">
              <Dice1 size={16} className="inline mr-1.5" /> 生成随机数
            </button>
          </div>
        </motion.div>

        {/* Results Panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 space-y-4">
          {/* Separator & Actions */}
          {results.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#555] mr-1">分隔符:</span>
              {[',', '\n', ' '].map((s) => (
                <button
                  key={s}
                  onClick={() => setSeparator(s as Separator)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    separator === s ? 'bg-[#a78bfa]/15 text-[#a78bfa]' : 'bg-white/5 text-[#666]'
                  }`}
                >
                  {s === ',' ? '逗号' : s === '\n' ? '换行' : '空格'}
                </button>
              ))}
              <div className="ml-auto flex gap-2">
                <button onClick={() => navigator.clipboard.writeText(outputText)} className="btn-secondary !py-1.5 !px-3 text-xs">
                  <Copy size={13} className="inline mr-1" /> 复制全部
                </button>
                <button onClick={generate} className="btn-secondary !py-1.5 !px-3 text-xs">
                  <RefreshCw size={13} className="inline mr-1" /> 重新随机
                </button>
              </div>
            </div>
          )}

          {/* Results Display */}
          <div className="tool-area p-5 min-h-[300px] max-h-[400px] overflow-auto">
            {results.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 font-mono text-sm">
                {results.map((n, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-white/[0.03] text-[#d0d0e0] break-all">
                    {allowDecimal ? n.toString() : n.toString()}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-[#555] text-sm">
                点击左侧「生成随机数」按钮开始
              </div>
            )}
          </div>

          {/* Stats */}
          {stats && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
              <h4 className="text-xs font-semibold text-[#a8b2c1] mb-3">统计信息</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">最小值</p>
                  <p className="text-lg font-mono font-semibold text-[#a78bfa]">{allowDecimal ? stats.min.toFixed(decimalPlaces) : stats.min}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">最大值</p>
                  <p className="text-lg font-mono font-semibold text-[#a78bfa]">{allowDecimal ? stats.max.toFixed(decimalPlaces) : stats.max}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">平均值</p>
                  <p className="text-lg font-mono font-semibold text-[#a78bfa]">{allowDecimal ? stats.avg.toFixed(decimalPlaces) : stats.avg.toFixed(2)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">求和</p>
                  <p className="text-lg font-mono font-semibold text-[#a78bfa]">{allowDecimal ? stats.sum.toFixed(decimalPlaces) : stats.sum}</p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

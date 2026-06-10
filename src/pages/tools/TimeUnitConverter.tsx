import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Copy } from 'lucide-react';

const TIME_UNITS: Record<string, { name: string; factor: number }> = {
  ms: { name: '毫秒', factor: 1 },
  s: { name: '秒', factor: 1000 },
  min: { name: '分钟', factor: 60000 },
  h: { name: '小时', factor: 3600000 },
  d: { name: '天', factor: 86400000 },
  w: { name: '周', factor: 604800000 },
};

export default function TimeUnitConverter() {
  const [inputValue, setInputValue] = useState('');
  const [inputUnit, setInputUnit] = useState('s');
  const [results, setResults] = useState<Record<string, string> | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const convert = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      setResults(null);
      return;
    }

    const ms = value * TIME_UNITS[inputUnit].factor;

    const res: Record<string, string> = {};
    for (const [key, unit] of Object.entries(TIME_UNITS)) {
      res[key] = (ms / unit.factor).toFixed(6);
    }
    setResults(res);
  };

  const copyResult = (unit: string) => {
    if (results) {
      navigator.clipboard.writeText(results[unit]);
    }
  };

  const selectUnit = (key: string) => {
    setInputUnit(key);
    setDropdownOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#6bcb77]/15 flex items-center justify-center">
            <Clock size={20} className="text-[#6bcb77]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">时间单位换算</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">毫秒、秒、分钟、小时、天、周之间的互相转换，便于时间计算</p>
      </motion.div>

      {/* Input */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6 mb-6">
        <div className="flex items-center gap-4">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入数值"
            aria-label="输入数值"
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-lg text-white outline-none focus:border-[#6bcb77]/30 flex-1"
          />
          {/* Custom dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-lg text-white outline-none focus:border-[#6bcb77]/30 flex items-center gap-2 min-w-[100px] justify-between"
            >
              <span>{TIME_UNITS[inputUnit].name}</span>
              <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute top-full left-0 mt-1 w-full bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl z-20 overflow-hidden">
                  {Object.entries(TIME_UNITS).map(([key, unit]) => (
                    <button
                      key={key}
                      onClick={() => selectUnit(key)}
                      className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                        inputUnit === key ? 'bg-[#6bcb77]/15 text-[#6bcb77]' : 'text-[#a8b2c1] hover:bg-white/5'
                      }`}
                    >
                      {unit.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <button onClick={convert} disabled={!inputValue} className="btn-primary disabled:opacity-30">
            转换
          </button>
        </div>
      </motion.div>

      {/* Results */}
      {results && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <h2 className="text-sm font-medium text-[#a8b2c1] mb-4">转换结果</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Object.entries(TIME_UNITS).map(([key, unit]) => (
              <div key={key} className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#666] mb-2">{unit.name}</div>
                <div className="text-xl font-bold font-mono text-[#6bcb77] mb-2">{results[key]}</div>
                <button onClick={() => copyResult(key)} className="btn-secondary !py-1 !px-2 text-xs w-full">
                  <Copy size={12} className="inline mr-1" /> 复制
                </button>
              </div>
            ))}
          </div>

          {/* Conversion Formula */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg">
            <h3 className="text-xs text-[#666] mb-2">换算关系</h3>
            <div className="text-xs text-[#a8b2c1] space-y-1">
              <p>• 1 秒 = 1000 毫秒</p>
              <p>• 1 分钟 = 60 秒 = 60000 毫秒</p>
              <p>• 1 小时 = 60 分钟 = 3600 秒</p>
              <p>• 1 天 = 24 小时 = 86400 秒</p>
              <p>• 1 周 = 7 天 = 168 小时</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
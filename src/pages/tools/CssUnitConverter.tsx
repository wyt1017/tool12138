import { useState } from 'react';
import { motion } from 'framer-motion';
import { Ruler, Copy } from 'lucide-react';

const COLOR = '#f472b6';

export default function CssUnitConverter() {
  const [inputValue, setInputValue] = useState('');
  const [inputUnit, setInputUnit] = useState<'px' | 'rem' | 'em' | '%'>('px');
  const [baseFontSize, setBaseFontSize] = useState(16);
  const [parentFontSize, setParentFontSize] = useState(16);
  const [results, setResults] = useState<Record<string, string> | null>(null);

  const convert = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      setResults(null);
      return;
    }

    // 先转换为px作为基准
    let pxValue: number;
    switch (inputUnit) {
      case 'px':
        pxValue = value;
        break;
      case 'rem':
        pxValue = value * baseFontSize;
        break;
      case 'em':
        pxValue = value * parentFontSize;
        break;
      case '%':
        pxValue = (value / 100) * parentFontSize;
        break;
    }

    // 从px转换为其他单位
    const rem = pxValue / baseFontSize;
    const em = pxValue / parentFontSize;
    const percent = (pxValue / parentFontSize) * 100;

    setResults({
      px: pxValue.toFixed(2) + 'px',
      rem: rem.toFixed(4) + 'rem',
      em: em.toFixed(4) + 'em',
      '%': percent.toFixed(2) + '%',
    });
  };

  const copyResult = (unit: string) => {
    if (results) {
      navigator.clipboard.writeText(results[unit]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLOR}26` }}>
            <Ruler size={20} style={{ color: COLOR }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">CSS单位转换</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">px ↔ rem ↔ em ↔ % 相互转换</p>
      </motion.div>

      {/* Base Settings */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6 mb-6">
        <h2 className="text-sm font-medium text-[#a8b2c1] mb-4">基准设置</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#666] block mb-2">根元素字体大小（用于rem）</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={baseFontSize}
                onChange={(e) => setBaseFontSize(Number(e.target.value))}
                aria-label="根元素字体大小"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#f472b6]/30 w-full"
              />
              <span className="text-[#666]">px</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-[#666] block mb-2">父元素字体大小（用于em/%）</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={parentFontSize}
                onChange={(e) => setParentFontSize(Number(e.target.value))}
                aria-label="父元素字体大小"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#f472b6]/30 w-full"
              />
              <span className="text-[#666]">px</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Input */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 mb-6">
        <h2 className="text-sm font-medium text-[#a8b2c1] mb-4">输入值</h2>
        <div className="flex items-center gap-4">
          <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="输入数值"
            aria-label="输入数值"
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-lg text-white outline-none focus:border-[#f472b6]/30 flex-1"
          />
          <select
            value={inputUnit}
            onChange={(e) => setInputUnit(e.target.value as 'px' | 'rem' | 'em' | '%')}
            aria-label="输入单位"
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-lg text-white outline-none focus:border-[#f472b6]/30 cursor-pointer"
          >
            <option value="px" className="bg-[#1a1a2e] text-white">px</option>
            <option value="rem" className="bg-[#1a1a2e] text-white">rem</option>
            <option value="em" className="bg-[#1a1a2e] text-white">em</option>
            <option value="%" className="bg-[#1a1a2e] text-white">%</option>
          </select>
          <button onClick={convert} disabled={!inputValue} className="btn-primary disabled:opacity-30">
            转换
          </button>
        </div>
      </motion.div>

      {/* Results */}
      {results && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h2 className="text-sm font-medium text-[#a8b2c1] mb-4">转换结果</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['px', 'rem', 'em', '%'].map((unit) => (
              <div key={unit} className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-[#666] mb-2">{unit.toUpperCase()}</div>
                <div className="text-xl font-bold font-mono mb-2" style={{ color: COLOR }}>{results[unit]}</div>
                <button onClick={() => copyResult(unit)} className="btn-secondary !py-1 !px-2 text-xs w-full">
                  <Copy size={12} className="inline mr-1" /> 复制
                </button>
              </div>
            ))}
          </div>

          {/* Conversion Formula */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg">
            <h3 className="text-xs text-[#666] mb-2">转换公式</h3>
            <div className="text-xs text-[#a8b2c1] space-y-1">
              <p>• px → rem: px值 / 根元素字体大小 ({baseFontSize}px)</p>
              <p>• px → em: px值 / 父元素字体大小 ({parentFontSize}px)</p>
              <p>• px → %: (px值 / 父元素字体大小) × 100</p>
              <p>• rem → px: rem值 × 根元素字体大小 ({baseFontSize}px)</p>
              <p>• em → px: em值 × 父元素字体大小 ({parentFontSize}px)</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
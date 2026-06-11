import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Copy } from 'lucide-react';

// 单位换算配置
const UNIT_CONFIGS = {
  length: {
    name: '长度',
    units: {
      mm: { name: '毫米', factor: 0.001 },
      cm: { name: '厘米', factor: 0.01 },
      m: { name: '米', factor: 1 },
      km: { name: '千米', factor: 1000 },
      in: { name: '英寸', factor: 0.0254 },
      ft: { name: '英尺', factor: 0.3048 },
      yd: { name: '码', factor: 0.9144 },
      mi: { name: '英里', factor: 1609.344 },
    },
  },
  mass: {
    name: '质量',
    units: {
      mg: { name: '毫克', factor: 0.000001 },
      g: { name: '克', factor: 0.001 },
      kg: { name: '千克', factor: 1 },
      t: { name: '吨', factor: 1000 },
      oz: { name: '盎司', factor: 0.0283495 },
      lb: { name: '磅', factor: 0.453592 },
    },
  },
  temperature: {
    name: '温度',
    units: {
      c: { name: '摄氏度', factor: 1 },
      f: { name: '华氏度', factor: 1 },
      k: { name: '开尔文', factor: 1 },
    },
    special: true,
  },
  area: {
    name: '面积',
    units: {
      mm2: { name: '平方毫米', factor: 0.000001 },
      cm2: { name: '平方厘米', factor: 0.0001 },
      m2: { name: '平方米', factor: 1 },
      km2: { name: '平方千米', factor: 1000000 },
      ha: { name: '公顷', factor: 10000 },
      acre: { name: '英亩', factor: 4046.86 },
    },
  },
  volume: {
    name: '体积',
    units: {
      ml: { name: '毫升', factor: 0.001 },
      l: { name: '升', factor: 1 },
      m3: { name: '立方米', factor: 1000 },
      gal: { name: '加仑(美)', factor: 3.78541 },
      oz_vol: { name: '液量盎司', factor: 0.0295735 },
    },
  },
  speed: {
    name: '速度',
    units: {
      mps: { name: '米/秒', factor: 1 },
      kmh: { name: '千米/时', factor: 0.277778 },
      mph: { name: '英里/时', factor: 0.44704 },
      fps: { name: '英尺/秒', factor: 0.3048 },
      knot: { name: '节', factor: 0.514444 },
    },
  },
};

type Category = keyof typeof UNIT_CONFIGS;

export default function UnitConverter() {
  const color = '#00d9ff';
  const [category, setCategory] = useState<Category>('length');
  const [inputValue, setInputValue] = useState('');
  const [inputUnit, setInputUnit] = useState('m');
  const [outputUnit, setOutputUnit] = useState('km');

  const config = UNIT_CONFIGS[category];
  const units = config.units;
  const isSpecial = 'special' in config && config.special;

  const convertTemperature = (value: number, from: string, to: string): number => {
    // 先转为摄氏度
    let celsius: number;
    switch (from) {
      case 'c': celsius = value; break;
      case 'f': celsius = (value - 32) * 5 / 9; break;
      case 'k': celsius = value - 273.15; break;
      default: celsius = value;
    }
    // 再转为目标单位
    switch (to) {
      case 'c': return celsius;
      case 'f': return celsius * 9 / 5 + 32;
      case 'k': return celsius + 273.15;
      default: return celsius;
    }
  };

  const convert = (): number | null => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) return null;

    if (isSpecial) {
      return convertTemperature(value, inputUnit, outputUnit);
    }

    const fromFactor = (units as Record<string, { factor: number }>)[inputUnit]?.factor || 1;
    const toFactor = (units as Record<string, { factor: number }>)[outputUnit]?.factor || 1;
    return (value * fromFactor) / toFactor;
  };

  const result = convert();

  const copyResult = () => {
    if (result !== null) {
      navigator.clipboard.writeText(result.toFixed(6));
    }
  };

  const handleCategoryChange = (newCategory: Category) => {
    setCategory(newCategory);
    const newUnits = UNIT_CONFIGS[newCategory].units;
    const unitKeys = Object.keys(newUnits);
    setInputUnit(unitKeys[0]);
    setOutputUnit(unitKeys[1] || unitKeys[0]);
    setInputValue('');
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Scale size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">单位换算器</h1>
        </div>
        <p style={{ color: '#a8b2c1', marginLeft: 52 }}>支持长度、质量、温度、面积、体积、速度等常见单位之间的快速换算</p>
      </motion.div>

      {/* Category Selection */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-wrap gap-2 mb-6">
        {Object.entries(UNIT_CONFIGS).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => handleCategoryChange(key as Category)}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: category === key ? 500 : 400,
                background: category === key ? `${color}24` : 'rgba(255,255,255,0.05)',
                color: category === key ? color : '#666',
                border: category === key ? `${color}4d` : 'none',
                cursor: 'pointer',
              }}
          >
            {cfg.name}
          </button>
        ))}
      </motion.div>

      {/* Converter */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Input */}
          <div>
            <label className="text-xs text-[#666] block mb-2">输入值</label>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="输入数值"
              aria-label="输入值"
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-lg text-white outline-none focus:border-[#00d9ff]/30 w-full"
            />
            <select
              value={inputUnit}
              onChange={(e) => setInputUnit(e.target.value)}
              aria-label="输入单位"
              className="mt-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-[#00d9ff]/30 w-full"
              style={{ backgroundColor: '#1a1a2e' }}
            >
              {Object.entries(units).map(([key, unit]) => (
                <option key={key} value={key} style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>{unit.name}</option>
              ))}
            </select>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <div style={{ fontSize: 24, color, display: 'flex', alignItems: 'center' }}>→</div>
          </div>

          {/* Output */}
          <div>
            <label className="text-xs text-[#666] block mb-2">输出值</label>
            <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-lg text-[#a8b2c1] min-h-[48px] flex items-center">
              {result !== null ? result.toFixed(6) : '-'}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <select
                value={outputUnit}
                onChange={(e) => setOutputUnit(e.target.value)}
                aria-label="输出单位"
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white outline-none focus:border-[#00d9ff]/30 flex-1"
                style={{ backgroundColor: '#1a1a2e' }}
              >
                {Object.entries(units).map(([key, unit]) => (
                  <option key={key} value={key} style={{ backgroundColor: '#1a1a2e', color: '#fff' }}>{unit.name}</option>
                ))}
              </select>
              {result !== null && (
                <button onClick={copyResult} className="btn-secondary !py-2 !px-3">
                  <Copy size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Reference */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4 mt-6">
        <h3 className="text-sm font-medium text-[#a8b2c1] mb-3">常用换算参考</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          {category === 'length' && (
            <>
              <div className="bg-white/5 rounded px-2 py-1.5">1 英寸 = 2.54 厘米</div>
              <div className="bg-white/5 rounded px-2 py-1.5">1 英尺 = 30.48 厘米</div>
              <div className="bg-white/5 rounded px-2 py-1.5">1 英里 = 1.609 千米</div>
            </>
          )}
          {category === 'mass' && (
            <>
              <div className="bg-white/5 rounded px-2 py-1.5">1 磅 = 0.4536 千克</div>
              <div className="bg-white/5 rounded px-2 py-1.5">1 盎司 = 28.35 克</div>
              <div className="bg-white/5 rounded px-2 py-1.5">1 吨 = 1000 千克</div>
            </>
          )}
          {category === 'temperature' && (
            <>
              <div className="bg-white/5 rounded px-2 py-1.5">0°C = 32°F = 273.15K</div>
              <div className="bg-white/5 rounded px-2 py-1.5">100°C = 212°F = 373.15K</div>
              <div className="bg-white/5 rounded px-2 py-1.5">-40°C = -40°F</div>
            </>
          )}
          {category === 'area' && (
            <>
              <div className="bg-white/5 rounded px-2 py-1.5">1 公顷 = 10000 平方米</div>
              <div className="bg-white/5 rounded px-2 py-1.5">1 英亩 = 4046.86 平方米</div>
              <div className="bg-white/5 rounded px-2 py-1.5">1 平方千米 = 100 公顷</div>
            </>
          )}
          {category === 'volume' && (
            <>
              <div className="bg-white/5 rounded px-2 py-1.5">1 加仑 = 3.785 升</div>
              <div className="bg-white/5 rounded px-2 py-1.5">1 升 = 1000 毫升</div>
              <div className="bg-white/5 rounded px-2 py-1.5">1 立方米 = 1000 升</div>
            </>
          )}
          {category === 'speed' && (
            <>
              <div className="bg-white/5 rounded px-2 py-1.5">1 千米/时 = 0.2778 米/秒</div>
              <div className="bg-white/5 rounded px-2 py-1.5">1 英里/时 = 1.609 千米/时</div>
              <div className="bg-white/5 rounded px-2 py-1.5">1 节 = 1.852 千米/时</div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
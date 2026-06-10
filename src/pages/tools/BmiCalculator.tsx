import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Scale, Ruler, Weight, Info } from 'lucide-react';

type UnitSystem = 'metric' | 'imperial';

interface BmiCategory {
  label: string;
  range: string;
  color: string;
  bgColor: string;
  min: number;
  max: number | null;
}

const BMI_CATEGORIES: BmiCategory[] = [
  { label: '偏瘦', range: '< 18.5', color: '#60a5fa', bgColor: 'rgba(96,165,250,0.1)', min: 0, max: 18.5 },
  { label: '正常', range: '18.5 - 23.9', color: '#6bcb77', bgColor: 'rgba(107,203,119,0.15)', min: 18.5, max: 23.9 },
  { label: '超重', range: '24 - 27.9', color: '#ffd369', bgColor: 'rgba(255,211,105,0.15)', min: 24, max: 27.9 },
  { label: '肥胖', range: '≥ 28', color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)', min: 28, max: null },
];

function calculateBmi(weightKg: number, heightCm: number): number {
  if (heightCm <= 0 || weightKg <= 0) return 0;
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function getBmiCategory(bmi: number): BmiCategory {
  for (let i = BMI_CATEGORIES.length - 1; i >= 0; i--) {
    const cat = BMI_CATEGORIES[i];
    if (cat.max === null && bmi >= cat.min) return cat;
    if (bmi >= cat.min && bmi < cat.max!) return cat;
  }
  return BMI_CATEGORIES[0];
}

function imperialToMetric(heightFt: number, weightLbs: number): { cm: number; kg: number } {
  const cm = heightFt * 30.48;
  const kg = weightLbs * 0.453592;
  return { cm, kg };
}

export default function BmiCalculator() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [weightLbs, setWeightLbs] = useState('');

  const bmiValue = useMemo(() => {
    if (unitSystem === 'metric') {
      const h = parseFloat(heightCm);
      const w = parseFloat(weightKg);
      if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) return null;
      return calculateBmi(w, h);
    } else {
      const hf = parseFloat(heightFt);
      const wl = parseFloat(weightLbs);
      if (isNaN(hf) || isNaN(wl) || hf <= 0 || wl <= 0) return null;
      const { cm, kg } = imperialToMetric(hf, wl);
      return calculateBmi(kg, cm);
    }
  }, [unitSystem, heightCm, weightKg, heightFt, weightLbs]);

  const category = useMemo(() => {
    if (bmiValue === null) return null;
    return getBmiCategory(bmiValue);
  }, [bmiValue]);

  const healthyRange = useMemo(() => {
    const h = unitSystem === 'metric' ? parseFloat(heightCm) : parseFloat(heightFt) * 30.48;
    if (isNaN(h) || h <= 0) return null;

    const heightM = h / 100;
    const minWeight = 18.5 * heightM * heightM;
    const maxWeight = 23.9 * heightM * heightM;

    if (unitSystem === 'imperial') {
      return {
        min: (minWeight * 2.20462).toFixed(1),
        max: (maxWeight * 2.20462).toFixed(1),
        unit: 'lbs',
      };
    }
    return {
      min: minWeight.toFixed(1),
      max: maxWeight.toFixed(1),
      unit: 'kg',
    };
  }, [unitSystem, heightCm, heightFt]);

  const bmiPercent = useMemo(() => {
    if (bmiValue === null) return 0;
    // Map BMI 10-40 to 0-100%
    const clamped = Math.max(10, Math.min(40, bmiValue));
    return ((clamped - 10) / 30) * 100;
  }, [bmiValue]);

  const switchUnits = (newSystem: UnitSystem) => {
    setUnitSystem(newSystem);
    if (newSystem === 'metric') {
      setHeightFt('');
      setWeightLbs('');
    } else {
      setHeightCm('');
      setWeightKg('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#6bcb77]/15 flex items-center justify-center">
            <Scale size={20} className="text-[#6bcb77]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">BMI 体质指数计算</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">计算身体质量指数（BMI），了解您的体重健康状况</p>
      </motion.div>

      {/* Unit Toggle */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex items-center gap-2 mb-8">
        <button
          onClick={() => switchUnits('metric')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            unitSystem === 'metric' ? 'bg-[#6bcb77]/15 text-[#6bcb77]' : 'bg-white/5 text-[#666]'
          }`}
        >
          公制 (cm / kg)
        </button>
        <button
          onClick={() => switchUnits('imperial')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            unitSystem === 'imperial' ? 'bg-[#6bcb77]/15 text-[#6bcb77]' : 'bg-white/5 text-[#666]'
          }`}
        >
          英制 (ft / lbs)
        </button>
      </motion.div>

      {/* Input Fields */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {/* Height */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Ruler size={18} className="text-[#6bcb77]" />
            <label className="text-sm font-medium text-[#a8b2c1]">身高</label>
          </div>
          <div className="relative">
            <input
              type="number"
              value={unitSystem === 'metric' ? heightCm : heightFt}
              onChange={(e) =>
                unitSystem === 'metric' ? setHeightCm(e.target.value) : setHeightFt(e.target.value)
              }
              placeholder={unitSystem === 'metric' ? '170' : "5'9\""}
              aria-label="身高"
              className="tool-area w-full px-4 py-3 text-lg font-mono outline-none focus:border-[#6bcb77]/30 transition-colors placeholder:text-[#333]"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#666]">
              {unitSystem === 'metric' ? 'cm' : 'ft'}
            </span>
          </div>
        </div>

        {/* Weight */}
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Weight size={18} className="text-[#6bcb77]" />
            <label className="text-sm font-medium text-[#a8b2c1]">体重</label>
          </div>
          <div className="relative">
            <input
              type="number"
              value={unitSystem === 'metric' ? weightKg : weightLbs}
              onChange={(e) =>
                unitSystem === 'metric' ? setWeightKg(e.target.value) : setWeightLbs(e.target.value)
              }
              placeholder={unitSystem === 'metric' ? '65' : '143'}
              aria-label="体重"
              className="tool-area w-full px-4 py-3 text-lg font-mono outline-none focus:border-[#6bcb77]/30 transition-colors placeholder:text-[#333]"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#666]">
              {unitSystem === 'metric' ? 'kg' : 'lbs'}
            </span>
          </div>
        </div>
      </motion.div>

      {/* BMI Result Display */}
      {bmiValue !== null && category && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-8 mb-8"
        >
          {/* Big BMI Number */}
          <div className="text-center mb-6">
            <p className="text-sm text-[#666] mb-2">你的 BMI 值</p>
            <p className="text-6xl sm:text-7xl font-bold font-mono" style={{ color: category.color }}>
              {bmiValue.toFixed(1)}
            </p>
            <p className="text-lg mt-2 font-medium" style={{ color: category.color }}>
              {category.label}
            </p>
          </div>

          {/* BMI Scale Bar */}
          <div className="relative mt-8">
            <div className="h-4 rounded-full overflow-hidden bg-white/5 relative">
              {/* Background gradient showing categories */}
              <div className="absolute inset-0 flex">
                {BMI_CATEGORIES.map((cat, idx) => (
                  <div
                    key={idx}
                    className="h-full"
                    style={{
                      width: cat.max === null ? 'auto' : undefined,
                      flexGrow: cat.max === null ? 1 : 0,
                      flexShrink: 0,
                      backgroundColor: cat.bgColor,
                      flexBasis: cat.max !== null ? `${(((cat.max! - (idx > 0 ? BMI_CATEGORIES[idx - 1].max! : 10)) / 30) * 100)}%` : undefined,
                    }}
                  />
                ))}
              </div>
              {/* Indicator */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-6 rounded shadow-lg transition-all duration-300"
                style={{
                  left: `calc(${Math.min(98, Math.max(1, bmiPercent))}% - 8px)`,
                  backgroundColor: category.color,
                  boxShadow: `0 0 12px ${category.color}40`,
                }}
              />
            </div>

            {/* Scale Labels */}
            <div className="flex justify-between mt-2 text-xs text-[#555] font-mono">
              <span>10</span>
              <span>16</span>
              <span>18.5</span>
              <span>24</span>
              <span>28</span>
              <span>35</span>
              <span>40</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Category Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-6 mb-6"
      >
        <h3 className="text-sm font-semibold text-[#6bcb77] mb-4">BMI 分类标准</h3>
        <div className="space-y-3">
          {BMI_CATEGORIES.map((cat) => (
            <div
              key={cat.label}
              className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all ${
                category?.label === cat.label ? 'ring-1 ring-current' : ''
              }`}
              style={{
                backgroundColor: category?.label === cat.label ? cat.bgColor : 'transparent',
                borderColor: category?.label === cat.label ? cat.color : 'transparent',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm font-medium text-[#f0f0f5]">{cat.label}</span>
              </div>
              <span className="text-sm font-mono" style={{ color: cat.color }}>{cat.range}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Healthy Weight Range */}
      {healthyRange && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-start gap-3">
            <Info size={18} className="text-[#6bcb77] mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-[#6bcb77] mb-1">健康体重建议</h3>
              <p className="text-sm text-[#a8b2c1]">
                根据您输入的身高，正常体重范围应为{' '}
                <span className="text-[#6bcb77] font-semibold font-mono">
                  {healthyRange.min} - {healthyRange.max} {healthyRange.unit}
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {bmiValue === null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-12 text-center"
        >
          <Scale size={48} className="mx-auto text-[#333] mb-4" />
          <p className="text-[#555]">请输入身高和体重来计算 BMI</p>
        </motion.div>
      )}
    </div>
  )
}

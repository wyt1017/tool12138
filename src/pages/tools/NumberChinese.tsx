import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Languages, Copy } from 'lucide-react';

type Mode = 'normal' | 'financial' | 'year';

const CN_NUMS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const CN_NUMS_FIN = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const CN_UNITS = ['', '十', '百', '千'];
const CN_GROUP_UNITS = ['', '万', '亿'];

function toChineseIntegerPart(integerStr: string, mode: Mode): string {
  const nums = mode === 'financial' ? CN_NUMS_FIN : CN_NUMS;
  const units = CN_UNITS;
  const groupUnits = CN_GROUP_UNITS;

  if (integerStr === '0') return nums[0];

  // Pad to multiple of 4
  const padded = integerStr.padStart(Math.ceil(integerStr.length / 4) * 4, '0');
  const groups: string[] = [];
  for (let i = 0; i < padded.length; i += 4) {
    groups.push(padded.slice(i, i + 4));
  }

  const groupResults: string[] = [];
  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi];
    let groupResult = '';
    let hasNonZero = false;

    for (let di = 0; di < group.length; di++) {
      const digit = parseInt(group[di], 10);
      const pos = group.length - 1 - di;

      if (digit !== 0) {
        if (groupResult.endsWith('零')) {
          groupResult = groupResult.slice(0, -1);
        }
        groupResult += nums[digit] + units[pos];
        hasNonZero = true;
      } else if (hasNonZero && di < group.length - 1) {
        // Only add 零 if there are non-zero digits after this position in the same group
        const remaining = parseInt(group.slice(di + 1), 10);
        if (remaining > 0) {
          groupResult += nums[0];
        }
      }
    }

    // Clean trailing zeros
    while (groupResult.endsWith('零')) {
      groupResult = groupResult.slice(0, -1);
    }

    if (groupResult || (gi === groups.length - 1 && integerStr.startsWith('0'))) {
      const groupIdx = groups.length - 1 - gi;
      if (groupResult && groupIdx > 0) {
        groupResult += groupUnits[groupIdx];
      }
      groupResults.unshift(groupResult);
    }
  }

  let result = groupResults.join('');

  // Special case: 一十 -> 十
  if (result.startsWith('一十') && result.length > 2) {
    result = result.slice(1);
  }
  // Clean consecutive zeros
  result = result.replace(/零+/g, '零').replace(/^零/, '').replace(/零$/, '');

  return result || nums[0];
}

function toChineseDecimalPart(decimalStr: string, mode: Mode): string {
  const nums = mode === 'financial' ? CN_NUMS_FIN : CN_NUMS;

  if (mode === 'financial') {
    const finUnits = ['', '角', '分'];
    let result = '';
    for (let i = 0; i < Math.min(decimalStr.length, 2); i++) {
      const digit = parseInt(decimalStr[i], 10);
      if (digit !== 0) {
        result += nums[digit] + finUnits[i + 1];
      } else {
        result += nums[0];
      }
    }
    return result.replace(/零+$/, '') || '';
  }

  return '点' + decimalStr.split('').map(d => nums[parseInt(d, 10)]).join('');
}

function numberToChinese(input: string, mode: Mode): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  const num = parseFloat(trimmed);
  if (isNaN(num)) return '无效数字';

  if (mode === 'year') {
    const year = Math.abs(Math.round(num)).toString();
    const yearDigits = year.padStart(4, '0');
    return yearDigits.split('').map(d => {
      const n = parseInt(d, 10);
      return n === 0 ? '〇' : CN_NUMS[n];
    }).join('');
  }

  const [intPart, decPart] = trimmed.includes('.') ? trimmed.split('.') : [trimmed, ''];

  let intResult = toChineseIntegerPart(intPart.replace(/[^0-9]/g, ''), mode);

  if (num < 0) intResult = '负' + intResult;

  if (decPart) {
    const decResult = toChineseDecimalPart(decPart, mode);
    return decResult ? intResult + decResult : intResult;
  }

  return intResult;
}

const EXAMPLES = [
  { label: '1234', value: '1234' },
  { label: '10000', value: '10000' },
  { label: '100000000', value: '100000000' },
  { label: '2026.50', value: '2026.50' },
];

export default function NumberChinese() {
  const [input, setInput] = useState<string>('1234');
  const [mode, setMode] = useState<Mode>('normal');

  const result = useMemo(() => numberToChinese(input, mode), [input, mode]);

  const breakdown = useMemo(() => {
    const cleaned = input.trim().replace(/[^0-9.]/g, '');
    if (!cleaned) return [];

    const parts = cleaned.split('.');
    const intPart = parts[0] || '';
    const decPart = parts[1] || '';
    const items: { digit: string; chinese: string; unit?: string }[] = [];

    const nums = mode === 'financial' ? CN_NUMS_FIN : CN_NUMS;
    const units = CN_UNITS;

    for (let i = 0; i < intPart.length; i++) {
      const d = intPart[i];
      const pos = intPart.length - 1 - i;
      items.push({
        digit: d,
        chinese: nums[parseInt(d, 10)],
        unit: units[pos] || undefined,
      });
    }

    if (decPart) {
      items.push({ digit: '.', chinese: mode === 'financial' ? '(小数)' : '点', unit: undefined });
      for (let i = 0; i < decPart.length; i++) {
        const d = decPart[i];
        const finUnit = mode === 'financial' ? (i === 0 ? '角' : i === 1 ? '分' : '') : '';
        items.push({
          digit: d,
          chinese: nums[parseInt(d, 10)],
          unit: finUnit || undefined,
        });
      }
    }

    return items;
  }, [input, mode]);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#fb923c]/15 flex items-center justify-center">
            <Languages size={20} className="text-[#fb923c]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">数字转中文大写</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">将阿拉伯数字转换为中文大写形式，支持普通、金额大写和年度格式</p>
      </motion.div>

      <div className="space-y-6">
        {/* Input Section */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div className="glass-card p-6 space-y-5">
            <div>
              <label className="text-sm font-medium text-[#a8b2c1] block mb-2 ml-1">输入数字</label>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="请输入数字，如：1234 或 2026.50"
                aria-label="输入数字"
                className="tool-area w-full px-4 py-3 text-lg text-white outline-none focus:border-[#fb923c]/30 placeholder:text-[#333]"
              />
            </div>

            {/* Mode Selection */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-[#555] mr-1">模式:</span>
              {([
                { key: 'normal' as Mode, label: '普通中文' },
                { key: 'financial' as Mode, label: '金额大写' },
                { key: 'year' as Mode, label: '年度格式' },
              ]).map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    mode === m.key ? 'bg-[#fb923c]/15 text-[#fb923c]' : 'bg-white/5 text-[#666]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Quick Examples */}
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/5">
              <span className="text-xs text-[#555] mr-1">示例:</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => setInput(ex.value)}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono bg-white/5 text-[#a8b2c1] hover:bg-white/10 hover:text-white transition-all"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Result Display */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="glass-card p-8 text-center">
            <p className="text-xs text-[#555] uppercase tracking-widest mb-3">转换结果</p>
            <p className="text-3xl sm:text-4xl font-['Syne'] font-bold text-[#fb923c] leading-relaxed break-all min-h-[3rem]">
              {result || '—'}
            </p>
            {result && (
              <button
                onClick={() => navigator.clipboard.writeText(result)}
                className="btn-secondary !py-1.5 !px-4 text-xs mt-4 inline-flex items-center gap-1.5"
              >
                <Copy size={13} /> 复制结果
              </button>
            )}
          </div>
        </motion.div>

        {/* Breakdown Panel */}
        {breakdown.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="glass-card p-6">
              <h3 className="text-sm font-semibold text-[#a8b2c1] mb-4">数字拆解说明</h3>
              <div className="flex flex-wrap gap-2">
                {breakdown.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5">
                    <span className="font-mono text-base text-white">{item.digit}</span>
                    <span className="text-[#555] text-xs">→</span>
                    <span className="text-[#fb923c] font-medium">{item.chinese}</span>
                    {item.unit && <span className="text-[10px] text-[#555]">{item.unit}</span>}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

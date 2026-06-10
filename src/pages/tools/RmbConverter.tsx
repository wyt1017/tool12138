import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Banknote, Copy, RotateCcw, Info } from 'lucide-react';

const CN_NUMS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const CN_UNITS = ['', '拾', '佰', '仟'];
const CN_GROUP_UNITS = ['', '万', '亿'];

function numberToChinese(num: number): string {
  if (num === 0) return '零元整';

  const absNum = Math.abs(num);
  const intPart = Math.floor(absNum);
  const decPart = Math.round((absNum - intPart) * 100);

  let result = '';

  // 处理整数部分
  if (intPart > 0) {
    const intStr = intPart.toString();
    const groupCount = Math.ceil(intStr.length / 4);
    const paddedStr = intStr.padStart(groupCount * 4, '0');

    const groups: string[] = [];
    for (let i = 0; i < groupCount; i++) {
      groups.push(paddedStr.slice(i * 4, (i + 1) * 4));
    }

    const groupResults: string[] = [];
    for (let i = 0; i < groups.length; i++) {
      const groupStr = groups[i];
      let groupResult = '';
      let lastWasZero = false;

      for (let j = 0; j < groupStr.length; j++) {
        const digit = parseInt(groupStr[j], 10);
        const pos = groupStr.length - 1 - j;

        if (digit === 0) {
          if (!lastWasZero && (groupResults.length > 0 || groupResult !== '')) {
            groupResult += CN_NUMS[0];
          }
          lastWasZero = true;
        } else {
          groupResult += CN_NUMS[digit] + CN_UNITS[pos];
          lastWasZero = false;
        }
      }

      // 去掉末尾的零
      while (groupResult.endsWith('零')) {
        groupResult = groupResult.slice(0, -1);
      }

      if (groupResult !== '') {
        const groupUnitIdx = groups.length - 1 - i;
        groupResult += CN_GROUP_UNITS[groupUnitIdx];
        groupResults.push(groupResult);
      }
    }

    result = groupResults.join('');

    // 全局去零优化：连续多个"零零"合并为一个
    while (result.includes('零零')) {
      result = result.replace(/零零+/g, '零');
    }

    // 去掉开头的零
    if (result.startsWith('零')) {
      result = result.slice(1);
    }

    result += '元';
  }

  // 处理小数部分
  if (decPart > 0) {
    const jiao = Math.floor(decPart / 10);
    const fen = decPart % 10;
    if (jiao > 0) {
      result += CN_NUMS[jiao] + '角';
    }
    if (fen > 0) {
      if (jiao === 0 && intPart > 0) {
        result += '零';
      }
      result += CN_NUMS[fen] + '分';
    }
  } else if (intPart > 0) {
    result += '整';
  }

  if (num < 0) {
    result = '负' + result;
  }

  return result;
}

function getDigitBreakdown(num: number): string[] {
  if (num === 0) return ['零'];

  const absNum = Math.abs(num);
  const breakdown: string[] = [];

  const intPart = Math.floor(absNum);
  const decPart = Math.round((absNum - intPart) * 100);

  if (intPart >= 100000000) {
    breakdown.push(`亿位: ${Math.floor(intPart / 100000000)}`);
  }
  if (intPart % 100000000 >= 10000) {
    breakdown.push(`万位: ${Math.floor((intPart % 100000000) / 10000)}`);
  }
  if (intPart % 10000 >= 1) {
    breakdown.push(`个位: ${intPart % 10000}`);
  }
  if (decPart > 0) {
    const jiao = Math.floor(decPart / 10);
    const fen = decPart % 10;
    if (jiao > 0 || fen > 0) {
      breakdown.push(`小数: ${jiao}角${fen > 0 ? fen + '分' : ''}`);
    }
  }

  return breakdown;
}

export default function RmbConverter() {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const numericValue = useMemo(() => {
    const cleaned = input.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }, [input]);

  const chineseResult = useMemo(() => {
    if (numericValue === null) return '';
    try {
      return numberToChinese(numericValue);
    } catch {
      return '转换失败：无效的数值';
    }
  }, [numericValue]);

  const breakdown = useMemo(() => {
    if (numericValue === null) return [];
    return getDigitBreakdown(numericValue);
  }, [numericValue]);

  const handleCopy = async () => {
    if (!chineseResult) return;
    await navigator.clipboard.writeText(chineseResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#f472b6]/15 flex items-center justify-center">
            <Banknote size={20} className="text-[#f472b6]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">人民币大写转换</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">将阿拉伯数字金额转换为符合财务规范的中文大写金额</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input Area */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3">
          <label className="text-sm font-medium text-[#a8b2c1] ml-1 mb-2 block">输入金额</label>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例如：12345.67 或 -100000000"
            aria-label="输入金额"
            className="tool-area w-full p-5 text-lg font-mono outline-none focus:border-[#f472b6]/30 transition-colors placeholder:text-[#333]"
          />

          {/* Result Display */}
          {chineseResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 glass-card p-6 border-l-4 border-l-[#f472b6]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-[#666] mb-1">转换结果</p>
                  <p className="text-2xl font-bold text-white font-['Syne'] tracking-wide">{chineseResult}</p>
                </div>
                <button onClick={handleCopy} className="btn-primary !py-2 !px-4 flex-shrink-0">
                  <Copy size={15} className="inline mr-1.5" /> {copied ? '已复制' : '复制'}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Breakdown Panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
          <div className="glass-card p-5 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Info size={16} className="text-[#f472b6]" />
              <span className="text-sm font-medium text-[#a8b2c1]">数字拆解</span>
            </div>

            {breakdown.length > 0 ? (
              <div className="space-y-2">
                {breakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5">
                    <span className="text-xs text-[#888]">{item.split(':')[0]}</span>
                    <span className="text-sm font-mono font-medium text-white">{item.split(':')[1]}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#555] py-8 text-center">输入金额后显示拆解信息</p>
            )}

            {/* Quick Examples */}
            <div className="mt-6 pt-4 border-t border-white/5">
              <p className="text-xs text-[#666] mb-3">快捷示例</p>
              <div className="flex flex-wrap gap-2">
                {[100, 1000.5, 10000, 1000000, 123456789.12].map((val) => (
                  <button
                    key={val}
                    onClick={() => setInput(val.toString())}
                    className="px-3 py-1.5 rounded-lg bg-[#f472b6]/10 text-[#f472b6] text-xs hover:bg-[#f472b6]/20 transition-colors"
                  >
                    ¥{val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-3 mt-6">
        <button onClick={() => setInput('')} disabled={!input} className="btn-secondary disabled:opacity-30">
          <RotateCcw size={15} className="inline mr-1.5" /> 清空
        </button>
      </motion.div>
    </div>
  );
}

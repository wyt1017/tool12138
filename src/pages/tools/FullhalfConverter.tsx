import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRightLeft, Copy, Check, Type } from 'lucide-react';

function toHalfWidth(str: string): string {
  return str.replace(/[\uff01-\uff5e]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  );
}

function toFullWidth(str: string): string {
  return str.replace(/[\u0021-\u007e]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0xfee0)
  );
}

const FULL_LETTERS = 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ';
const HALF_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const FULL_NUMBERS = '０１２３４５６７８９';
const HALF_NUMBERS = '0123456789';
const FULL_PUNCTUATION = '！＂＃＄％＆＇（）＊＋，－．／：；＜＝＞？＠［＼］＾＿｀｛｜｝～';
const HALF_PUNCTUATION = '!#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';

export default function FullhalfConverter() {
  const [input, setInput] = useState('');
  const [halfResult, setHalfResult] = useState('');
  const [fullResult, setFullResult] = useState('');
  const [convertCount, setConvertCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [options, setOptions] = useState({
    letters: true,
    numbers: true,
    punctuation: true,
  });

  const filterByOptions = (str: string, toFull: boolean): string => {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      const isLetter = (HALF_LETTERS + FULL_LETTERS).includes(ch);
      const isNumber = (HALF_NUMBERS + FULL_NUMBERS).includes(ch);
      const isPunct = (HALF_PUNCTUATION + FULL_PUNCTUATION).includes(ch);

      if (isLetter && !options.letters) {
        result += ch;
        continue;
      }
      if (isNumber && !options.numbers) {
        result += ch;
        continue;
      }
      if (isPunct && !options.punctuation) {
        result += ch;
        continue;
      }

      if (toFull) {
        result += toFullWidth(ch);
      } else {
        result += toHalfWidth(ch);
      }
    }
    return result;
  };

  const countConverted = (original: string, converted: string): number => {
    let count = 0;
    for (let i = 0; i < original.length; i++) {
      if (original[i] !== converted[i]) {
        count++;
      }
    }
    return count;
  };

  const handleToHalf = () => {
    const result = filterByOptions(input, false);
    setHalfResult(result);
    setConvertCount(countConverted(input, result));
  };

  const handleToFull = () => {
    const result = filterByOptions(input, true);
    setFullResult(result);
    setConvertCount(countConverted(input, result));
  };

  const copyResult = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleOption = (key: keyof typeof options) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/15 flex items-center justify-center">
            <Type size={20} className="text-[#a78bfa]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">全角半角转换</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">在半角与全角字符之间快速转换，支持字母、数字和标点符号</p>
      </motion.div>

      {/* Options */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
        <div className="flex flex-wrap gap-3">
          {[
            { key: 'letters' as const, label: '字母 A-Z a-z', example: 'A ↔ Ａ' },
            { key: 'numbers' as const, label: '数字 0-9', example: '0 ↔ ０' },
            { key: 'punctuation' as const, label: '标点符号', example: '! ↔ ！' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => toggleOption(opt.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                options[opt.key]
                  ? 'bg-[#a78bfa]/15 text-[#a78bfa] border border-[#a78bfa]/30'
                  : 'bg-white/5 text-[#666] border border-white/10'
              }`}
            >
              <span
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  options[opt.key] ? 'border-[#a78bfa]' : 'border-[#555]'
                }`}
              >
                {options[opt.key] && <span className="w-2 h-2 rounded-full bg-[#a78bfa]" />}
              </span>
              <span>{opt.label}</span>
              <span className="text-xs opacity-60 font-mono">{opt.example}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Input Area */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <label className="text-sm font-medium text-[#a8b2c1] mb-2 block ml-1">输入文本</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入要转换的文本，支持中文、英文、数字、标点..."
          aria-label="输入文本"
          className="tool-area w-full h-[240px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#a78bfa]/30 transition-colors placeholder:text-[#333]"
        />
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-3 mt-6"
      >
        <button onClick={handleToHalf} disabled={!input} className="btn-primary disabled:opacity-30">
          <ArrowRightLeft size={16} className="inline mr-1.5" /> 全角 → 半角
        </button>
        <button onClick={handleToFull} disabled={!input} className="btn-secondary disabled:opacity-30">
          <ArrowRightLeft size={16} className="inline mr-1.5" /> 半角 → 全角
        </button>
        <button onClick={() => { setInput(''); setHalfResult(''); setFullResult(''); setConvertCount(0); }} className="btn-secondary">
          清空
        </button>
      </motion.div>

      {/* Results */}
      {(halfResult || fullResult) && (
        <>
          {/* Convert Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-6 glass-card p-4"
          >
            <p className="text-sm text-[#a8b2c1]">
              共转换了 <span className="text-[#a78bfa] font-bold text-base mx-1">{convertCount}</span> 个字符
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Half-width Result */}
            {halfResult && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                <div className="flex items-center justify-between mb-2 ml-1">
                  <label className="text-sm font-medium text-[#a78bfa]">半角结果</label>
                  <button onClick={() => copyResult(halfResult)} className="btn-secondary !py-1.5 !px-3 text-xs">
                    {copied ? <Check size={13} className="inline mr-1" /> : <Copy size={13} className="inline mr-1" />}
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
                <div className="tool-area w-full min-h-[160px] p-5 text-sm leading-relaxed font-mono break-all whitespace-pre-wrap">
                  {halfResult}
                </div>
              </motion.div>
            )}

            {/* Full-width Result */}
            {fullResult && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                <div className="flex items-center justify-between mb-2 ml-1">
                  <label className="text-sm font-medium text-[#a78bfa]">全角结果</label>
                  <button onClick={() => copyResult(fullResult)} className="btn-secondary !py-1.5 !px-3 text-xs">
                    {copied ? <Check size={13} className="inline mr-1" /> : <Copy size={13} className="inline mr-1" />}
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
                <div className="tool-area w-full min-h-[160px] p-5 text-sm leading-relaxed font-mono break-all whitespace-pre-wrap">
                  {fullResult}
                </div>
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Languages, Copy, Check } from 'lucide-react';
import { pinyin } from 'pinyin-pro';

const COLOR = '#a78bfa';
const CYAN = '#00d9ff';

// 将带声调的拼音转换为数字形式 (nǐ -> ni3)
const toneToNumberMap: Record<string, string> = {
  'ā': 'a1', 'á': 'a2', 'ǎ': 'a3', 'à': 'a4',
  'ē': 'e1', 'é': 'e2', 'ě': 'e3', 'è': 'e4',
  'ō': 'o1', 'ó': 'o2', 'ǒ': 'o3', 'ò': 'o4',
  'ī': 'i1', 'í': 'i2', 'ǐ': 'i3', 'ì': 'i4',
  'ū': 'u1', 'ú': 'u2', 'ǔ': 'u3', 'ù': 'u4',
  'ǖ': 'v1', 'ǘ': 'v2', 'ǚ': 'v3', 'ǜ': 'v4', 'ü': 'v',
};

function convertToneToNumber(pinyinStr: string): string {
  return pinyinStr
    .split('')
    .map(char => toneToNumberMap[char] || char)
    .join('');
}

export default function ChinesePinyin() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'tone' | 'number'>('tone');
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState({ total: 0, chinese: 0 });

  // 自动转换：input 或 mode 变化时自动触发
  useEffect(() => {
    if (!input.trim()) {
      setOutput('');
      setCharCount({ total: 0, chinese: 0 });
      return;
    }

    try {
      // 使用 pinyin-pro 进行完整拼音转换
      const result = pinyin(input, {
        toneType: mode === 'tone' ? 'symbol' : 'none',
        type: 'array',
        nonZh: 'consecutive', // 非中文字符保持原样连续输出
      });

      let finalResult: string;
      if (mode === 'number') {
        // 数字模式：将声调符号转为数字
        finalResult = (result as string[])
          .map(item => typeof item === 'string' ? convertToneToNumber(item) : item)
          .join(' ');
      } else {
        // 声调模式：直接拼接
        finalResult = (result as string[]).join(' ');
      }

      setOutput(finalResult);

      // 统计字符
      const total = input.replace(/\s/g, '').length;
      const chinese = input.replace(/[^\u4e00-\u9fff\u3400-\u4dbf]/g, '').length;
      setCharCount({ total, chinese });
    } catch {
      setOutput('转换失败，请检查输入');
    }
  }, [input, mode]);

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 降级方案：使用 execCommand
      const textarea = document.createElement('textarea');
      textarea.value = output;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
      } catch {
        // 复制失败，忽略错误
      } finally {
        document.body.removeChild(textarea);
        setTimeout(() => setCopied(false), 1500);
      }
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setCharCount({ total: 0, chinese: 0 });
    setCopied(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${COLOR}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Languages size={20} style={{ color: COLOR }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">中文转拼音工具</h1>
        </div>
        <p style={{ color: '#a8b2c1', marginLeft: 52 }}>
          将中文文本转换为拼音（带声调或数字标调），支持全汉字 Unicode 范围
        </p>
      </motion.div>

      {/* Mode Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setMode('tone')}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 14,
            fontWeight: mode === 'tone' ? 500 : 400,
            background: mode === 'tone' ? `${COLOR}24` : 'rgba(255,255,255,0.05)',
            color: mode === 'tone' ? COLOR : '#666',
            border: mode === 'tone' ? `${COLOR}4d` : 'none',
            cursor: 'pointer',
          }}
        >
          带声调 (nǐ hǎo)
        </button>
        <button
          onClick={() => setMode('number')}
          style={{
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 14,
            fontWeight: mode === 'number' ? 500 : 400,
            background: mode === 'number' ? `${CYAN}24` : 'rgba(255,255,255,0.05)',
            color: mode === 'number' ? CYAN : '#666',
            border: mode === 'number' ? `${CYAN}4d` : 'none',
            cursor: 'pointer',
          }}
        >
          数字标调 (ni3 hao3)
        </button>
      </div>

      {/* Input/Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <label className="text-sm font-medium text-[#a8b2c1] mb-2 ml-1 block">
            中文文本
            <span style={{ fontSize: 12, color: '#666', fontWeight: 400, marginLeft: 8 }}>
              共 {charCount.total} 字符（含 {charCount.chinese} 汉字）
            </span>
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入中文文本..."
            aria-label="中文文本"
            className="tool-area w-full h-[250px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#a78bfa]/30 transition-colors placeholder:text-[#333]"
          />
        </motion.div>

        {/* Output */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">拼音结果</label>
            {output && (
              <button
                onClick={handleCopy}
                className="btn-secondary !py-1.5 !px-3 text-xs"
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                {copied ? <Check size={13} className="inline" style={{ color: '#4ade80' }} /> : <Copy size={13} className="inline mr-1" />}
                {copied ? '已复制' : '复制'}
              </button>
            )}
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="拼音将显示在这里..."
            aria-label="拼音结果"
            className="tool-area w-full h-[250px] p-5 text-sm leading-relaxed resize-none outline-none text-[#a8b2c1] placeholder:text-[#333]"
          />
        </motion.div>
      </div>

      {/* Actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center gap-3 mt-6">
        <button onClick={handleClear} className="btn-secondary">
          清空
        </button>
      </motion.div>

      {/* Note */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-4 mt-6">
        <p className="text-xs text-[#666]">
          <strong style={{ color: '#a8b2c1' }}>说明：</strong>
          本工具使用 pinyin-pro 库进行完整 Unicode 汉字转换，支持 CJK 统一汉字扩展 A-G 区（约 9 万+ 汉字）。
          多音字可能无法准确识别，建议对结果进行人工校验。
        </p>
      </motion.div>
    </div>
  );
}

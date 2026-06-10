import { useState } from 'react';
import { motion } from 'framer-motion';
import { Code, Copy, ArrowRightLeft } from 'lucide-react';

const COLOR = '#e94560';

// HTML实体映射
const HTML_ENTITIES: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '"': '&quot;',
  "'": '&apos;',
  ' ': '&nbsp;',
  '©': '&copy;',
  '®': '&reg;',
  '€': '&euro;',
  '£': '&pound;',
  '¥': '&yen;',
  '¢': '&cent;',
  '§': '&sect;',
  '¶': '&para;',
  '°': '&deg;',
  '±': '&plusmn;',
  '×': '&times;',
  '÷': '&divide;',
  '½': '&frac12;',
  '¼': '&frac14;',
  '¾': '&frac34;',
  '←': '&larr;',
  '→': '&rarr;',
  '↑': '&uarr;',
  '↓': '&darr;',
  '↔': '&harr;',
  '♠': '&spades;',
  '♣': '&clubs;',
  '♥': '&hearts;',
  '♦': '&diams;',
  '•': '&bull;',
  '…': '&hellip;',
  '—': '&mdash;',
  '–': '&ndash;',
  '\u201C': '&ldquo;',  // "
  '\u201D': '&rdquo;',  // "
  '\u2018': '&lsquo;',  // '
  '\u2019': '&rsquo;',  // '
  '™': '&trade;',
  '‰': '&permil;',
  '†': '&dagger;',
  '‡': '&Dagger;',
};

// 反向映射
const ENTITY_TO_CHAR: Record<string, string> = {};
Object.entries(HTML_ENTITIES).forEach(([char, entity]) => {
  ENTITY_TO_CHAR[entity] = char;
});

export default function HtmlEntityEncoder() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');

  const encode = () => {
    let result = input;
    // 按顺序替换，避免 & 被重复替换
    result = result.replace(/&/g, '&amp;');
    result = result.replace(/</g, '&lt;');
    result = result.replace(/>/g, '&gt;');
    result = result.replace(/"/g, '&quot;');
    result = result.replace(/'/g, '&apos;');

    // 替换其他特殊字符
    Object.entries(HTML_ENTITIES).forEach(([char, entity]) => {
      if (char !== '&' && char !== '<' && char !== '>' && char !== '"' && char !== "'") {
        result = result.replace(new RegExp(char, 'g'), entity);
      }
    });

    setOutput(result);
  };

  const decode = () => {
    let result = input;

    // 解码数字实体
    result = result.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num)));
    result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

    // 解码命名实体
    Object.entries(ENTITY_TO_CHAR).forEach(([entity, char]) => {
      result = result.replace(new RegExp(entity, 'g'), char);
    });

    setOutput(result);
  };

  const swapInOut = () => {
    setInput(output);
    setOutput('');
  };

  const process = () => {
    if (mode === 'encode') {
      encode();
    } else {
      decode();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLOR}26` }}>
            <Code size={20} style={{ color: COLOR }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">HTML实体编解码</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">将特殊字符转换为HTML安全实体，或反向还原</p>
      </motion.div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setMode('encode')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'encode' ? `bg-[#e94560]/15 text-[#e94560]` : 'bg-white/5 text-[#666]'
          }`}
        >
          编码 → HTML实体
        </button>
        <button
          onClick={() => setMode('decode')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'decode' ? `bg-[#00d9ff]/15 text-[#00d9ff]` : 'bg-white/5 text-[#666]'
          }`}
        >
          解码 ← HTML实体
        </button>
      </div>

      {/* Input/Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <label className="text-sm font-medium text-[#a8b2c1] mb-2 ml-1 block">
            {mode === 'encode' ? '原始文本' : 'HTML实体文本'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? '输入包含特殊字符的文本...' : '输入HTML实体编码的文本...'}
            aria-label="输入文本"
            className="tool-area w-full h-[280px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#e94560]/30 transition-colors placeholder:text-[#333]"
          />
        </motion.div>

        {/* Output */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">
              {mode === 'encode' ? 'HTML实体结果' : '解码结果'}
            </label>
            {output && (
              <button onClick={() => navigator.clipboard.writeText(output)} className="btn-secondary !py-1.5 !px-3 text-xs">
                <Copy size={13} className="inline mr-1" /> 复制
              </button>
            )}
          </div>
          <textarea
            readOnly
            value={output}
            placeholder="结果将显示在这里..."
            aria-label="输出结果"
            className="tool-area w-full h-[280px] p-5 text-sm leading-relaxed resize-none outline-none text-[#a8b2c1] placeholder:text-[#333]"
          />
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-3 mt-6"
      >
        <button onClick={process} disabled={!input} className="btn-primary disabled:opacity-30">
          {mode === 'encode' ? '编码' : '解码'}
        </button>
        <button onClick={swapInOut} disabled={!output} className="btn-secondary">
          <ArrowRightLeft size={15} className="inline mr-1.5" /> 交换输入输出
        </button>
        <button onClick={() => { setInput(''); setOutput(''); }} className="btn-secondary">
          清空
        </button>
      </motion.div>

      {/* Common Entities Reference */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6 mt-6">
        <h2 className="text-sm font-medium text-[#a8b2c1] mb-4">常用HTML实体参考</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
          {[
            { char: '<', entity: '&lt;' },
            { char: '>', entity: '&gt;' },
            { char: '&', entity: '&amp;' },
            { char: '"', entity: '&quot;' },
            { char: "'", entity: '&apos;' },
            { char: ' ', entity: '&nbsp;' },
            { char: '©', entity: '&copy;' },
            { char: '®', entity: '&reg;' },
            { char: '€', entity: '&euro;' },
            { char: '¥', entity: '&yen;' },
            { char: '°', entity: '&deg;' },
            { char: '±', entity: '&plusmn;' },
          ].map((item, i) => (
            <div key={i} className="bg-white/5 rounded px-2 py-1.5 flex items-center justify-between">
              <span className="text-white">{item.char}</span>
              <code className="text-[#a8b2c1] font-mono">{item.entity}</code>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
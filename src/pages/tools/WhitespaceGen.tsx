import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Space, Eye, EyeOff, Layers, AlertCircle } from 'lucide-react';

const COLOR = '#6bcb77';

interface WhitespaceChar {
  name: string;
  char: string;
  code: string;
  visible: string;
  desc: string;
}

const WHITESPACE_CHARS: WhitespaceChar[] = [
  { name: '常规空格', char: ' ', code: 'U+0020', visible: '␣', desc: '标准ASCII空格' },
  { name: '不换行空格', char: '\u00A0', code: 'U+00A0', visible: '⍽', desc: 'No-Break Space，不在此处断行' },
  { name: '零宽空格', char: '\u200B', code: 'U+200B', visible: '↔', desc: 'Zero Width Space，宽度为0的空格' },
  { name: '零宽不连字', char: '\u200C', code: 'U+200C', visible: '⁬', desc: 'Zero Width Non-Joiner' },
  { name: '零宽连字', char: '\u200D', code: 'U+200D', visible: '⁭', desc: 'Zero Width Joiner' },
  { name: '全角空格', char: '\u3000', code: 'U+3000', visible: '□', desc: 'Ideographic Space，CJK全角空格' },
  { name: '零宽非连接符(BOM)', char: '\uFEFF', code: 'U+FEFF', visible: '﻿◀', desc: 'Byte Order Mark / ZWNBSP' },
  { name: '细空格', char: '\u2009', code: 'U+2009', visible: '·', desc: 'Thin Space，约为em的1/6' },
  { name: '发丝空格', char: '\u200A', code: 'U+200A', visible: ',', desc: 'Hair Space，最窄空格' },
  { name: '数学空格', char: '\u205F', code: 'U+205F', visible: '∼', desc: 'Medium Mathematical Space' },
  { name: '四分之一空格', char: '\u2005', code: 'U+2005', visible: '┊', desc: 'Four-Per-Em Space' },
  { name: '标点空格', char: '\u2008', code: 'U+2008', visible: '·', desc: 'Punctuation Space' },
];

export default function WhitespaceGen() {
  const color = '#6bcb77';
  const [selectedChars, setSelectedChars] = useState<Set<number>>(new Set());
  const [combinedResult, setCombinedResult] = useState('');
  const [testInput, setTestInput] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showInvisible, setShowInvisible] = useState(false);

  const toggleChar = (index: number) => {
    setSelectedChars((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const combineSelected = () => {
    // 按表格顺序组合，而非 Set 插入顺序
    const sortedIndices = Array.from(selectedChars).sort((a, b) => a - b);
    let result = '';
    sortedIndices.forEach((index) => {
      result += WHITESPACE_CHARS[index].char;
    });
    setCombinedResult(result);
  };

  const copySingleChar = async (char: string, index: number) => {
    await navigator.clipboard.writeText(char);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const copyCombined = async () => {
    await navigator.clipboard.writeText(combinedResult);
  };

  const selectAll = () => {
    setSelectedChars(new Set(WHITESPACE_CHARS.map((_, i) => i)));
  };

  const clearSelection = () => {
    setSelectedChars(new Set());
    setCombinedResult('');
  };

  // 只检测零宽字符（真正不可见的空白字符）
  // 使用 Unicode 属性或分开匹配避免 joined character sequence 问题
  const zeroWidthRegex = /[\u200B\u200C]|[\u200D]|[\uFEFF]/g;
  const testVisibleLength = testInput.replace(zeroWidthRegex, '').length;
  const testActualLength = testInput.length;
  const testZeroWidthCount = (testInput.match(zeroWidthRegex) || []).length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLOR}26` }}>
            <Space size={20} style={{ color: COLOR }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">空白字符生成器</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">探索和组合各种不可见Unicode空白字符</p>
      </motion.div>

      {/* Character Table */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-card p-6 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Layers size={18} style={{ color: COLOR }} /> 空白字符表
          </h2>
          <div className="flex items-center gap-3">
            <button onClick={selectAll} className="btn-secondary !py-1 !px-3 text-xs">全选</button>
            <button onClick={clearSelection} className="btn-secondary !py-1 !px-3 text-xs">清空</button>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-[#a8b2c1]">
              {showInvisible ? <Eye size={12} /> : <EyeOff size={12} />}
              <input type="checkbox" checked={showInvisible} onChange={(e) => setShowInvisible(e.target.checked)} aria-label="显示不可见字符" className="hidden" />
              显示不可见字符
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-xs text-[#666] font-medium w-10"></th>
                <th className="text-left py-3 px-4 text-xs text-[#666] font-medium">字符名称</th>
                <th className="text-left py-3 px-4 text-xs text-[#666] font-medium">Unicode编码</th>
                <th className="text-left py-3 px-4 text-xs text-[#666] font-medium">可视化</th>
                <th className="text-left py-3 px-4 text-xs text-[#666] font-medium min-w-[120px]">实际字符{showInvisible && '(可见)'}</th>
                <th className="text-left py-3 px-4 text-xs text-[#666] font-medium">说明</th>
                <th className="text-right py-3 px-4 text-xs text-[#666] font-medium w-20">操作</th>
              </tr>
            </thead>
            <tbody>
              {WHITESPACE_CHARS.map((item, index) => (
                <tr
                  key={index}
                  onClick={() => toggleChar(index)}
                  className={`border-b border-white/5 cursor-pointer transition-colors ${
                    selectedChars.has(index) ? `bg-[${COLOR}]/8` : 'hover:bg-white/3'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div
                      className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                        selectedChars.has(index)
                          ? `bg-[${COLOR}] border-[${COLOR}]`
                          : 'border-[#444]'
                      }`}
                    >
                      {selectedChars.has(index) && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[#f0f0f5] font-medium">{item.name}</td>
                  <td className="py-3 px-4">
                    <code className="font-mono text-xs bg-white/5 px-2 py-1 rounded text-[#a8b2c1]">{item.code}</code>
                  </td>
                  <td className="py-3 px-4 text-lg">{item.visible}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-mono ${showInvisible ? `bg-[${COLOR}]/10 text-[${COLOR}] px-2 py-1 rounded inline-block min-w-[60px]` : 'text-[#555]'}`}
                      style={!showInvisible ? { letterSpacing: '2px' } : {}}
                    >
                      {showInvisible ? item.char : '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-[#666]">{item.desc}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copySingleChar(item.char, index);
                      }}
                      className={`px-3 py-1 rounded text-xs transition-all ${
                        copiedIndex === index
                          ? `bg-[${COLOR}] text-white`
                          : 'bg-white/5 text-[#a8b2c1] hover:bg-white/10'
                      }`}
                    >
                      {copiedIndex === index ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Combined Result & Test Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Combined Result */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <div className="glass-card p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Layers size={18} style={{ color }} /> 组合结果
              </h2>
              {combinedResult && (
                <button onClick={copyCombined} className="btn-secondary !py-1.5 !px-3 text-xs">
                  <Copy size={13} className="inline mr-1" /> 复制组合
                </button>
              )}
            </div>

            <button
              onClick={combineSelected}
              disabled={selectedChars.size === 0}
              className="btn-primary w-full mb-4"
            >
              组合选中项 ({selectedChars.size} 个字符)
            </button>

            {combinedResult && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#666] block mb-1.5">原始字符（显示长度）</label>
                  <div className="tool-area p-4 font-mono text-sm break-all min-h-[60px] text-[#a8b2c1]">
                    {combinedResult.split('').map((ch, i) => (
                      <span key={i} className="inline-block mx-0.5">
                        <span className={`bg-[${COLOR}]/15 text-[${COLOR}] px-1.5 py-0.5 rounded text-xs`}>
                          {WHITESPACE_CHARS.find((wc) => wc.char === ch)?.code || ch}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-[#666]">包含字符数：</span>
                  <span className={`font-mono text-[${COLOR}]`}>{combinedResult.length}</span>
                  <span className="text-[#666]">可见长度：</span>
                  <span className="font-mono text-[#a8b2c1]">{combinedResult.replace(zeroWidthRegex, '').length}</span>
                </div>
              </div>
            )}

            {!combinedResult && (
              <p className="text-[#333] text-sm text-center py-8">勾选上方表格中的字符后点击组合按钮</p>
            )}
          </div>
        </motion.div>

        {/* Test Area */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="glass-card p-6 h-full">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
              <AlertCircle size={18} style={{ color }} /> 测试验证区
            </h2>

            <textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="粘贴或输入包含空白字符的文本进行检测..."
              aria-label="测试文本"
              className="tool-area w-full h-[140px] p-4 text-sm resize-none outline-none focus:border-[#6bcb77]/30 transition-colors placeholder:text-[#333] mb-4"
            />

            {testInput && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-[#666] mb-1">可见长度</div>
                    <div className={`text-xl font-bold font-mono text-[${COLOR}]`}>{testVisibleLength}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-[#666] mb-1">实际长度</div>
                    <div className="text-xl font-bold font-mono text-[#f472b6]">{testActualLength}</div>
                  </div>
                </div>
                {testZeroWidthCount > 0 && (
                  <div className={`bg-[${COLOR}]/10 border border-[${COLOR}]/20 rounded-lg p-3 text-xs text-[${COLOR}]`}>
                    ⚠ 检测到 {testZeroWidthCount} 个零宽不可见字符！
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Use Cases */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card p-6 mt-6"
      >
        <h2 className="text-lg font-semibold text-white mb-4">应用场景</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: '特殊网名', desc: '在昵称中插入零宽字符，创造独特的视觉效果或绕过重复名检测' },
            { title: '防爬虫水印', desc: '在页面内容中嵌入零宽字符作为隐形水印，追踪内容泄露来源' },
            { title: '隐藏信息', desc: '利用零宽字符编码隐藏秘密信息，表面看起来是普通文本' },
            { title: '格式控制', desc: '用于文本排版、防止自动换行、控制连字行为等特殊排版需求' },
          ].map((item, i) => (
            <div key={i} className="bg-white/5 rounded-lg p-4 hover:bg-white/8 transition-colors">
              <div className={`text-sm font-semibold text-[${COLOR}] mb-1.5`}>{item.title}</div>
              <div className="text-xs text-[#666] leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

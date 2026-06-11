import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Replace, Copy, ArrowLeftRight, Eraser } from 'lucide-react';

export default function TextReplace() {
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [inputText, setInputText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [globalReplace, setGlobalReplace] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const result = useMemo(() => {
    if (!inputText || !searchText) return { text: '', count: 0 };

    try {
      let count = 0;
      let result = inputText;

      if (useRegex) {
        const flags = `${globalReplace ? 'g' : ''}${caseSensitive ? '' : 'i'}`;
        const regex = new RegExp(searchText, flags);
        const matches = inputText.match(regex);
        count = matches ? matches.length : 0;
        result = inputText.replace(regex, replaceText);
      } else {
        if (globalReplace) {
          const searchStr = caseSensitive ? searchText : searchText.toLowerCase();
          const source = caseSensitive ? inputText : inputText.toLowerCase();
          let idx = source.indexOf(searchStr);
          while (idx !== -1) {
            count++;
            idx = source.indexOf(searchStr, idx + 1);
          }
          if (caseSensitive) {
            result = inputText.split(searchText).join(replaceText);
          } else {
            const parts = inputText.split(new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'));
            result = parts.join(replaceText);
            // Recount for case-insensitive
            count = parts.length - 1;
          }
        } else {
          const searchStr = caseSensitive ? searchText : searchText.toLowerCase();
          const source = caseSensitive ? inputText : inputText.toLowerCase();
          const idx = source.indexOf(searchStr);
          if (idx !== -1) {
            count = 1;
            if (caseSensitive) {
              result = inputText.substring(0, idx) + replaceText + inputText.substring(idx + searchText.length);
            } else {
              const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
              result = inputText.replace(regex, replaceText);
            }
          }
        }
      }

      setError('');
      return { text: result, count };
    } catch (err) {
      setError(err instanceof Error ? err.message : '正则表达式错误');
      return { text: '', count: 0 };
    }
  }, [searchText, replaceText, inputText, caseSensitive, useRegex, globalReplace]);

  const handleCopy = async () => {
    if (!result.text) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwap = () => {
    const temp = searchText;
    setSearchText(replaceText);
    setReplaceText(temp);
  };

  const hasMatch = searchText && inputText && result.count > 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#a78bfa]/15 flex items-center justify-center">
            <Replace size={20} className="text-[#a78bfa]" />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">文本替换工具</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">支持普通文本和正则表达式替换，实时预览结果</p>
      </motion.div>

      {/* Search & Replace Inputs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          {/* Search */}
          <div>
            <label className="text-sm font-medium text-[#a8b2c1] mb-2 block">查找内容</label>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="输入要查找的文本或正则..."
              aria-label="查找内容"
              className="tool-area w-full px-4 py-3 outline-none focus:border-[#a78bfa]/30 transition-colors placeholder:text-[#333]"
            />
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={!searchText && !replaceText}
            className="btn-secondary !p-3 !rounded-xl self-center"
            title="交换查找和替换内容"
          >
            <ArrowLeftRight size={18} />
          </button>

          {/* Replace */}
          <div>
            <label className="text-sm font-medium text-[#a8b2c1] mb-2 block">替换内容</label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="输入替换后的文本..."
              aria-label="替换内容"
              className="tool-area w-full px-4 py-3 outline-none focus:border-[#a78bfa]/30 transition-colors placeholder:text-[#333]"
            />
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/5">
          <button
            onClick={() => setCaseSensitive(!caseSensitive)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              caseSensitive
                ? 'bg-[#a78bfa]/15 text-[#a78bfa]'
                : 'bg-white/5 text-[#666] hover:text-white'
            }`}
          >
            Aa 区分大小写
          </button>
          <button
            onClick={() => setUseRegex(!useRegex)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              useRegex
                ? 'bg-[#a78bfa]/15 text-[#a78bfa]'
                : 'bg-white/5 text-[#666] hover:text-white'
            }`}
          >
            .* 正则表达式
          </button>
          <button
            onClick={() => setGlobalReplace(!globalReplace)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              globalReplace
                ? 'bg-[#a78bfa]/15 text-[#a78bfa]'
                : 'bg-white/5 text-[#666] hover:text-white'
            }`}
          >
            全局替换
          </button>

          {/* Match Count */}
          {searchText && inputText && (
            <span className={`ml-auto text-sm font-medium px-3 py-2 rounded-full ${
              hasMatch ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {hasMatch ? `找到 ${result.count} 处匹配` : '未找到匹配'}
            </span>
          )}
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-3 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
      </motion.div>

      {/* Input / Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Original Text */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">原始文本</label>
            <span className="text-xs text-[#666]">{inputText.length} 字符</span>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="在此粘贴或输入要处理的文本..."
            aria-label="原始文本"
            className="tool-area w-full h-[360px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#a78bfa]/30 transition-colors placeholder:text-[#333]"
          />
        </motion.div>

        {/* Result Text */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="text-sm font-medium text-[#a8b2c1]">替换结果</label>
            {result.text && (
              <div className="flex gap-2">
                <span className="text-xs text-[#666]">{result.text.length} 字符</span>
                <button onClick={handleCopy} className="btn-secondary !py-1.5 !px-3 text-xs">
                  {copied ? (
                    <span className="text-green-400">已复制</span>
                  ) : (
                    <>
                      <Copy size={13} className="inline mr-1" /> 复制
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          <textarea
            readOnly
            value={result.text}
            placeholder="替换结果将显示在这里..."
            aria-label="替换结果"
            className="tool-area w-full h-[360px] p-5 text-sm leading-relaxed resize-none outline-none text-[#a8b2c1] placeholder:text-[#333]"
          />
        </motion.div>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="flex items-center gap-3 mt-6"
      >
        <button
          onClick={() => {
            navigator.clipboard.writeText(result.text);
          }}
          disabled={!result.text}
          className="btn-primary disabled:opacity-30"
        >
          <Copy size={16} className="inline mr-1.5" /> 复制结果
        </button>
        <button
          onClick={() => {
            setInputText(result.text);
          }}
          disabled={!result.text}
          className="btn-secondary disabled:opacity-30"
        >
          用结果替换原文
        </button>
        <button
          onClick={() => {
            setInputText('');
            setSearchText('');
            setReplaceText('');
            setError('');
          }}
          className="btn-secondary"
        >
          <Eraser size={15} className="inline mr-1.5" /> 清空全部
        </button>
      </motion.div>
    </div>
  );
}

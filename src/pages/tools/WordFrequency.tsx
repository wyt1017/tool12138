import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Copy, ArrowUpDown } from 'lucide-react';

const COLOR = '#00d9ff';

export default function WordFrequency() {
  const [input, setInput] = useState('');
  const [ignoreCase, setIgnoreCase] = useState(true);
  const [sortBy, setSortBy] = useState<'count' | 'word'>('count');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const wordStats = useMemo(() => {
    if (!input.trim()) return [];

    // 分词：支持中英文混合
    const text = ignoreCase ? input.toLowerCase() : input;
    // 匹配中文词汇和英文单词
    const words = text.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];

    // 统计词频
    const freqMap = new Map<string, number>();
    words.forEach(word => {
      freqMap.set(word, (freqMap.get(word) || 0) + 1);
    });

    // 转换为数组并排序
    const result = Array.from(freqMap.entries()).map(([word, count]) => ({ word, count }));

    if (sortBy === 'count') {
      result.sort((a, b) => sortOrder === 'desc' ? b.count - a.count : a.count - b.count);
    } else {
      result.sort((a, b) => {
        const cmp = a.word.localeCompare(b.word);
        return sortOrder === 'desc' ? -cmp : cmp;
      });
    }

    return result;
  }, [input, ignoreCase, sortBy, sortOrder]);

  const totalWords = useMemo(() => {
    if (!input.trim()) return 0;
    const text = ignoreCase ? input.toLowerCase() : input;
    const words = text.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];
    return words.length;
  }, [input, ignoreCase]);

  const uniqueWords = wordStats.length;

  const copyResults = () => {
    const text = wordStats.map(item => `${item.word}: ${item.count}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${COLOR}26` }}>
            <BarChart3 size={20} style={{ color: COLOR }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">词频统计</h1>
        </div>
        <p className="text-[#a8b2c1] ml-[52px]">统计文本中每个单词出现的次数，并排序展示</p>
      </motion.div>

      {/* Options */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-[#a8b2c1]">
            <input
              type="checkbox"
              checked={ignoreCase}
              onChange={(e) => setIgnoreCase(e.target.checked)}
              aria-label="忽略大小写"
              className="w-4 h-4 rounded accent-[#00d9ff]"
            />
            忽略大小写
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#666]">排序方式：</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'count' | 'word')}
              aria-label="排序方式"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#00d9ff]/30"
            >
              <option value="count">按词频</option>
              <option value="word">按字母</option>
            </select>
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="btn-secondary !py-1.5 !px-3 text-xs"
          >
            <ArrowUpDown size={13} className="inline mr-1" /> {sortOrder === 'desc' ? '降序' : '升序'}
          </button>
        </div>
      </motion.div>

      {/* Input */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
        <label className="text-sm font-medium text-[#a8b2c1] mb-2 ml-1 block">输入文本</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入或粘贴要统计的文本内容..."
          aria-label="输入文本"
          className="tool-area w-full h-[200px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#00d9ff]/30 transition-colors placeholder:text-[#333]"
        />
      </motion.div>

      {/* Stats Summary */}
      {input.trim() && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4 text-center">
            <div className="text-xs text-[#666] mb-1">总词数</div>
            <div className="text-2xl font-bold font-mono mb-1" style={{ color: COLOR }}>{totalWords}</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-xs text-[#666] mb-1">不同词数</div>
            <div className="text-2xl font-bold font-mono text-[#6bcb77]">{uniqueWords}</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-xs text-[#666] mb-1">最高频词</div>
            <div className="text-lg font-bold text-[#f472b6] truncate">{wordStats[0]?.word || '-'}</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-xs text-[#666] mb-1">最高频率</div>
            <div className="text-2xl font-bold font-mono text-[#ffd369]">{wordStats[0]?.count || 0}</div>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {wordStats.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">词频结果</h2>
            <button onClick={copyResults} className="btn-secondary !py-1.5 !px-3 text-xs">
              <Copy size={13} className="inline mr-1" /> 复制结果
            </button>
          </div>
          <div className="glass-card p-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-xs text-[#666] font-medium">序号</th>
                  <th className="text-left py-3 px-4 text-xs text-[#666] font-medium">单词</th>
                  <th className="text-left py-3 px-4 text-xs text-[#666] font-medium">出现次数</th>
                  <th className="text-left py-3 px-4 text-xs text-[#666] font-medium">占比</th>
                </tr>
              </thead>
              <tbody>
                {wordStats.slice(0, 100).map((item, index) => (
                  <tr key={item.word} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="py-3 px-4 text-[#666] font-mono">{index + 1}</td>
                    <td className="py-3 px-4 text-white font-medium">{item.word}</td>
                    <td className="py-3 px-4">
                      <span style={{ color: COLOR, fontFamily: 'monospace' }}>{item.count}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-[100px] h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${(item.count / (wordStats[0]?.count || 1)) * 100}%`, height: '100%', backgroundColor: COLOR, borderRadius: '9999px' }}
                          />
                        </div>
                        <span className="text-xs text-[#666] font-mono">
                          {((item.count / totalWords) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {wordStats.length > 100 && (
              <p className="text-xs text-[#666] mt-4 text-center">仅显示前100个词，共 {wordStats.length} 个不同词</p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
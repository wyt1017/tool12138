import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Copy } from 'lucide-react';

export default function TextDuplicateStats() {
  const color = '#e94560';
  const green = '#6bcb77';
  const pink = '#f472b6';
  const cyan = '#00d9ff';

  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'line' | 'word'>('line');
  const [sortBy, setSortBy] = useState<'count' | 'content'>('count');
  const [minCount, setMinCount] = useState(2);

  const stats = useMemo(() => {
    if (!input.trim()) return [];

    const items = mode === 'line'
      ? input.split('\n').filter(line => line.trim())
      : input.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || [];

    const freqMap = new Map<string, number>();
    items.forEach(item => {
      freqMap.set(item, (freqMap.get(item) || 0) + 1);
    });

    const result = Array.from(freqMap.entries())
      .map(([content, count]) => ({ content, count }))
      .filter(item => item.count >= minCount);

    if (sortBy === 'count') {
      result.sort((a, b) => b.count - a.count);
    } else {
      result.sort((a, b) => a.content.localeCompare(b.content));
    }

    return result;
  }, [input, mode, sortBy, minCount]);

  const totalItems = useMemo(() => {
    if (!input.trim()) return 0;
    return mode === 'line'
      ? input.split('\n').filter(line => line.trim()).length
      : (input.match(/[\u4e00-\u9fa5]+|[a-zA-Z]+/g) || []).length;
  }, [input, mode]);

  const totalDuplicates = useMemo(() => {
    return stats.reduce((sum, item) => sum + item.count, 0);
  }, [stats]);

  const maxCount = useMemo(() => {
    return stats.length > 0 ? Math.max(...stats.map(s => s.count)) : 0;
  }, [stats]);

  const copyResults = () => {
    const text = stats.map(item => `${item.content}: ${item.count}次`).join('\n');
    navigator.clipboard.writeText(text);
  };

  const handleModeClick = (newMode: 'line' | 'word') => setMode(newMode);

  const isLineActive = mode === 'line';

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${color}24`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={20} style={{ color }} />
          </div>
          <h1 className="font-['Syne'] font-bold text-2xl sm:text-3xl text-white">文本重复内容统计</h1>
        </div>
        <p style={{ color: '#a8b2c1', marginLeft: 52 }}>分析文本中重复的行或单词，统计每个重复项的出现次数并排序</p>
      </motion.div>

      {/* Options */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4 mb-6">
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => handleModeClick('line')}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: isLineActive ? 500 : 400,
                background: isLineActive ? `${color}24` : 'rgba(255,255,255,0.05)',
                color: isLineActive ? color : '#666',
                border: isLineActive ? `${color}4d` : 'none',
                cursor: 'pointer',
              }}
            >
              按行统计
            </button>
            <button
              onClick={() => handleModeClick('word')}
              style={{
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: !isLineActive ? 500 : 400,
                background: !isLineActive ? `${cyan}24` : 'rgba(255,255,255,0.05)',
                color: !isLineActive ? cyan : '#666',
                border: !isLineActive ? `${cyan}4d` : 'none',
                cursor: 'pointer',
              }}
            >
              按词统计
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#666' }}>排序：</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'count' | 'content')}
              aria-label="排序方式"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 8px', fontSize: 12, color: '#fff' }}
            >
              <option value="count">按次数</option>
              <option value="content">按内容</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#666' }}>最少出现：</span>
            <input
              type="number"
              value={minCount}
              onChange={(e) => setMinCount(Number(e.target.value))}
              min={2}
              aria-label="最少出现次数"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: '4px 8px', fontSize: 12, color: '#fff', width: 60 }}
            />
            <span style={{ fontSize: 12, color: '#666' }}>次</span>
          </div>
        </div>
      </motion.div>

      {/* Input */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-6">
        <label style={{ fontSize: 14, fontWeight: 500, color: '#a8b2c1', marginBottom: 8, display: 'block', marginLeft: 4 }}>输入文本</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入或粘贴要分析的文本..."
          aria-label="输入文本"
          className="tool-area w-full h-[200px] p-5 text-sm leading-relaxed resize-none outline-none focus:border-[#e94560]/30 transition-colors placeholder:text-[#333]"
        />
      </motion.div>

      {/* Stats Summary */}
      {input.trim() && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-3 gap-4 mb-6">
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>总{mode === 'line' ? '行' : '词'}数</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'monospace', color }}>{totalItems}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>重复项数</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'monospace', color: green }}>{stats.length}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>最高重复</div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'monospace', color: pink }}>{stats[0]?.count || 0}</div>
          </div>
        </motion.div>
      )}

      {/* Results */}
      {stats.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>重复内容统计</h2>
            <button onClick={copyResults} className="btn-secondary !py-1.5 !px-3 text-xs">
              <Copy size={13} className="inline mr-1" /> 复制结果
            </button>
          </div>
          <div className="glass-card p-6 overflow-x-auto">
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#666', fontWeight: 500 }}>序号</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#666', fontWeight: 500 }}>内容</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#666', fontWeight: 500 }}>出现次数</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 12, color: '#666', fontWeight: 500 }}>占比</th>
                </tr>
              </thead>
              <tbody>
                {stats.slice(0, 100).map((item, index) => {
                  const percentage = totalDuplicates > 0 ? (item.count / totalDuplicates) * 100 : 0;
                  const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                  return (
                    <tr key={item.content} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                      <td style={{ padding: '12px 16px', color: '#666', fontFamily: 'monospace' }}>{index + 1}</td>
                      <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 500, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.content}</td>
                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color }}>
                        <span>{item.count}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 80, height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                background: color,
                                borderRadius: 4,
                                width: `${barWidth}%`,
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 12, color: '#666', fontFamily: 'monospace' }}>
                            {percentage.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {stats.length > 100 && (
              <p style={{ fontSize: 12, color: '#666', marginTop: 16, textAlign: 'center' }}>仅显示前100项，共 {stats.length} 个重复项</p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
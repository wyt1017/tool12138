import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { tools, categories, searchTools } from '@/data/tools';
import ToolCard from '@/components/home/ToolCard';

export default function Tools() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const activeCat = searchParams.get('cat') || '';
  const [query, setQuery] = useState(initialQuery);
  const catTools = activeCat ? tools.filter((t) => t.category === activeCat) : tools;
  const filtered = query ? searchTools(query) : catTools;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
        <h1 className="font-['Syne'] font-bold text-3xl sm:text-4xl text-[var(--text-primary)] mb-3">全部工具</h1>
        <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
          共 {tools.length} 个免费在线工具，选择你需要的开始使用
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-xl mx-auto mb-12"
      >
        <div className="relative glow-border rounded-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索工具名称或标签..."
            className="w-full bg-[var(--bg-hover)] border border-[var(--border-color)] rounded-xl pl-11 pr-5 py-3.5 text-[var(--text-primary)] outline-none focus:border-[#00d9ff]/40 transition-colors placeholder:text-[var(--text-faint)]"
          />
        </div>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-xl mx-auto mb-10 flex flex-wrap items-center justify-center gap-2"
      >
        <button
          onClick={() => { setSearchParams({}); setQuery(''); }}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            !activeCat ? 'bg-[#a78bfa]/15 text-[#a78bfa]' : 'bg-[var(--bg-hover)] text-[var(--text-faint)] hover:text-[var(--text-primary)]'
          }`}
        >
          全部
        </button>
        {categories.map((cat) => {
          const count = tools.filter((t) => t.category === cat.key).length;
          if (count === 0) return null;
          return (
            <button
              key={cat.key}
              onClick={() => { setSearchParams({ cat: cat.key }); setQuery(''); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCat === cat.key ? 'bg-[#a78bfa]/15 text-[#a78bfa]' : 'bg-[var(--bg-hover)] text-[var(--text-faint)] hover:text-[var(--text-primary)]'
              }`}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </motion.div>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((tool, i) => (
            <ToolCard key={tool.id} tool={tool} index={i} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-[var(--text-faint)] text-lg">没有找到匹配 "{query}" 的工具</p>
          <button onClick={() => setQuery('')} className="btn-primary mt-4">清除搜索</button>
        </div>
      )}
    </div>
  );
}

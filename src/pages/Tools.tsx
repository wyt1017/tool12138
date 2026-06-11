import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { tools, categories, searchTools } from '@/data/tools';
import ToolCard from '@/components/home/ToolCard';

export default function Tools() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const filtered = query ? searchTools(query) : tools;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
        <h1 className="font-['Syne'] font-bold text-3xl sm:text-4xl text-white mb-3">全部工具</h1>
        <p className="text-[#a8b2c1] max-w-lg mx-auto">
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
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#555]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索工具名称或标签..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-11 pr-5 py-3.5 text-white outline-none focus:border-[#00d9ff]/40 transition-colors placeholder:text-[#444]"
          />
        </div>
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
          <p className="text-[#555] text-lg">没有找到匹配 "{query}" 的工具</p>
          <button onClick={() => setQuery('')} className="btn-primary mt-4">清除搜索</button>
        </div>
      )}

      {/* Category Summary */}
      {!query && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-16 glass-card p-8"
        >
          <h2 className="font-['Syne'] font-semibold text-lg text-white mb-6">按分类浏览</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const count = tools.filter((t) => t.category === cat.key).length;
              return (
                <Link
                  key={cat.key}
                  to={`#${cat.key}`}
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors group"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: cat.bgColor, color: cat.color }}
                  >
                    <span className="font-['Syne'] font-bold text-sm">{count}</span>
                  </div>
                  <span className="text-sm text-[#a8b2c1] group-hover:text-white transition-colors">{cat.label}</span>
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

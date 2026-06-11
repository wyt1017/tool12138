import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Zap, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tools, type Tool } from '@/data/tools';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();

  // 预计算分类工具列表，避免每次渲染重复计算
  const categoryTools = useMemo(() => {
    const result: Record<string, Tool[]> = {
      text: tools.filter(t => t.category === 'text'),
      dev: tools.filter(t => t.category === 'dev'),
      design: tools.filter(t => t.category === 'design'),
      generator: tools.filter(t => t.category === 'generator'),
      convert: tools.filter(t => t.category === 'convert'),
      calculator: tools.filter(t => t.category === 'calculator'),
    };
    // 计算其他分类：未被分配到上述分类的工具
    const assigned = new Set<string>();
    Object.values(result).forEach(list => list.forEach(t => assigned.add(t.id)));
    result.other = tools.filter(t => !assigned.has(t.id));
    return result;
  }, []);

  const navCategories = [
    { key: 'text', label: '文本工具' },
    { key: 'dev', label: '开发工具' },
    { key: 'design', label: '设计工具' },
    { key: 'generator', label: '生成器' },
    { key: 'convert', label: '转换编解码' },
    { key: 'calculator', label: '计算器' },
    { key: 'other', label: '其他' },
  ];

  useEffect(() => {
    setOpenDropdown(null);
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0f0f23]/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-[#8b5cf6]/20 group-hover:shadow-[#8b5cf6]/30 transition-shadow">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg text-white tracking-wide">
            瓜崎工具
          </span>
        </Link>

        {/* Desktop Nav - 分类下拉菜单 */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              location.pathname === '/'
                ? 'text-white bg-white/8'
                : 'text-[#9ca3af] hover:text-white hover:bg-white/5'
            }`}
          >
            首页
          </Link>
          {navCategories.map((cat) => {
            const isActive = openDropdown === cat.key;
            const items = categoryTools[cat.key] || [];
            if (items.length === 0) return null;

            return (
              <div
                key={cat.key}
                className="relative"
                onMouseEnter={() => setOpenDropdown(cat.key)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive ? 'text-white bg-white/8' : 'text-[#9ca3af] hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat.label}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`} />
                </button>
                {isActive && (
                  <div className="absolute top-full left-0 -mt-1 pt-3 w-56 bg-[#16163a]/95 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden z-50">
                    <div className="py-2">
                      {items.map((tool) => (
                        <Link
                          key={tool.id}
                          to={tool.path}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#c8d0e0] hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <span className="w-5 h-5 flex items-center justify-center text-xs text-[#6b7280] shrink-0">
                            {tool.icon[0]}
                          </span>
                          <span>{tool.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* 移动端菜单按钮 */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-[#9ca3af] hover:text-white transition-colors"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/5 bg-[#0f0f23]/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-6 py-4 space-y-1 max-h-[70vh] overflow-y-auto">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === '/'
                    ? 'bg-[#8b5cf6]/10 text-[#a78bfa]'
                    : 'text-[#9ca3af] hover:text-white hover:bg-white/5'
                }`}
              >
                首页
              </Link>
              {navCategories.map((cat) => {
                const items = categoryTools[cat.key] || [];
                if (items.length === 0) return null;
                return (
                  <div key={cat.key}>
                    <div className="px-4 py-2 text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
                      {cat.label}
                    </div>
                    {items.map((tool) => (
                      <Link
                        key={tool.id}
                        to={tool.path}
                        onClick={() => setMobileOpen(false)}
                        className={`block px-4 py-2.5 pl-6 rounded-lg text-sm font-medium transition-all ${
                          location.pathname === tool.path
                            ? 'bg-[#8b5cf6]/10 text-[#a78bfa]'
                            : 'text-[#9ca3af] hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {tool.name}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

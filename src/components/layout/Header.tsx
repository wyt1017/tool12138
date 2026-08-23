import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Zap, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tools, type Tool } from '@/data/tools';
import DynamicIcon from '@/components/DynamicIcon';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
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

  // 滚动感知：增强毛玻璃与阴影层级
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
        scrolled ? 'bg-[color-mix(in_srgb,var(--bg-elevated)_88%,transparent)] shadow-lg border-b-[var(--border-strong)]' : 'bg-[color-mix(in_srgb,var(--bg-elevated)_60%,transparent)] border-b-[var(--border-color)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-[#8b5cf6]/20 group-hover:shadow-[#8b5cf6]/35 group-hover:scale-105 transition-all">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg text-[var(--text-primary)] tracking-wide">
            瓜崎<em className="not-italic gradient-text">工具</em>
          </span>
        </Link>

        {/* Desktop Nav - 分类下拉菜单 */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            to="/"
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              location.pathname === '/'
                ? 'text-[var(--text-primary)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
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
                onFocus={() => setOpenDropdown(cat.key)}
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                    setOpenDropdown(null);
                  }
                }}
              >
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={isActive}
                  className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6]/60 ${
                    isActive ? 'text-[var(--text-primary)] font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {cat.label}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${isActive ? 'rotate-180' : ''}`} />
                </button>
                {isActive && (
                  <div className="absolute top-full left-0 -mt-1 pt-3 w-56">
                    <div className="bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-color)] shadow-2xl overflow-hidden">
                      <div className="py-2">
                        {items.map((tool) => (
                          <Link
                            key={tool.id}
                            to={tool.path}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                          >
                            <DynamicIcon name={tool.icon} size={18} className="text-[var(--text-faint)] shrink-0" />
                            <span className="truncate">{tool.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* 右侧：主题切换 + 移动端菜单按钮 */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="菜单"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-[var(--border-color)] bg-[var(--bg-elevated)] overflow-hidden"
          >
            <div className="px-6 py-4 space-y-1 max-h-[70vh] overflow-y-auto">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === '/'
                    ? 'bg-[#8b5cf6]/10 text-[#a78bfa]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                首页
              </Link>
              {navCategories.map((cat) => {
                const items = categoryTools[cat.key] || [];
                if (items.length === 0) return null;
                return (
                  <div key={cat.key}>
                    <div className="px-4 py-2 text-xs font-semibold text-[var(--text-faint)] uppercase tracking-wider">
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
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
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
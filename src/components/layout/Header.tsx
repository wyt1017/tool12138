import { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Menu, X, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tools, categories } from '@/data/tools';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const activeCat = searchParams.get('cat') || '';

  useEffect(() => {
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
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center shadow-lg shadow-[#8b5cf6]/20 group-hover:shadow-[#8b5cf6]/35 group-hover:scale-105 transition-all">
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-bold text-lg text-[var(--text-primary)] tracking-wide">
            瓜崎<em className="not-italic gradient-text">工具</em>
          </span>
        </Link>

        {/* Desktop Nav - 分类按钮（无下拉，点击直达对应分类） */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto [scrollbar-width:none]">
          <Link
            to="/"
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap ${
              location.pathname === '/'
                ? 'text-[var(--text-primary)] font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            首页
          </Link>
          {categories.map((cat) => {
            const count = tools.filter((t) => t.category === cat.key).length;
            if (count === 0) return null;
            const isActive = activeCat === cat.key;
            return (
              <Link
                key={cat.key}
                to={`/tools?cat=${cat.key}`}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'text-[var(--text-primary)] font-semibold bg-[var(--bg-hover)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.label}
              </Link>
            );
          })}
        </nav>

        {/* 右侧：主题切换 + 移动端菜单按钮 */}
        <div className="flex items-center gap-1 shrink-0">
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

      {/* Mobile Menu - 分类按钮 */}
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
              {categories.map((cat) => {
                const count = tools.filter((t) => t.category === cat.key).length;
                if (count === 0) return null;
                const isActive = activeCat === cat.key;
                return (
                  <Link
                    key={cat.key}
                    to={`/tools?cat=${cat.key}`}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-[#8b5cf6]/10 text-[#a78bfa]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.label}
                    </span>
                    <span className="text-xs text-[var(--text-faint)]">{count}</span>
                  </Link>
                );
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import useSEO from '@/hooks/useSEO';
import Header from './Header';
import Footer from './Footer';
import MusicMiniPlayer from './MusicMiniPlayer';

// 工具工作区页面：/tools/:slug（不含 /tools 列表页本身）
function isWorkspaceRoute(pathname: string): boolean {
  return /^\/tools\/[^/]+$/.test(pathname);
}

// 细粒度 SVG 噪点纹理（base64 data URI，营造氛围颗粒）
const NOISE_URI =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="回到顶部"
          title="回到顶部"
          className="fixed bottom-24 right-5 z-40 w-11 h-11 rounded-full flex items-center justify-center bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-muted)] shadow-lg backdrop-blur-xl hover:text-[var(--text-primary)] hover:border-[#8b5cf6]/40 transition-all hover:shadow-[#8b5cf6]/20"
        >
          <ArrowUp size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default function Layout() {
  useSEO();
  const location = useLocation();
  const workspace = isWorkspaceRoute(location.pathname);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className={`min-h-dvh flex flex-col relative ${workspace ? 'bg-[var(--bg-primary)]' : ''}`}
    >
      {/* 氛围背景层：极光 + 网格 + 噪点（主题自适应，固定不随滚动） */}
      {!workspace && (
        <div aria-hidden className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          {/* 网格 */}
          <div className="absolute inset-0 bg-grid" />
          {/* 极光光斑 */}
          <div className="absolute -top-24 -left-16 w-[520px] h-[520px] rounded-full bg-[var(--brand-glow-soft)] blur-[140px] animate-aurora" />
          <div
            className="absolute top-1/3 -right-28 w-[460px] h-[460px] rounded-full bg-[var(--violet-glow)] blur-[150px] animate-aurora"
            style={{ animationDelay: '-6s' }}
          />
          <div
            className="absolute bottom-0 left-1/3 w-[420px] h-[420px] rounded-full bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] blur-[160px] animate-aurora"
            style={{ animationDelay: '-12s' }}
          />
          {/* 噪点 */}
          <div
            className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05] mix-blend-overlay"
            style={{ backgroundImage: NOISE_URI }}
          />
        </div>
      )}

      <Header />

      <main className={`flex-1 pt-16 ${workspace ? 'tool-workspace' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: workspace ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
      <MusicMiniPlayer />
      <BackToTop />
    </motion.div>
  );
}
import { motion } from 'framer-motion';
import { Search, ArrowRight, Sparkles, ShieldCheck, WifiOff, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchTools, tools } from '@/data/tools';
import { useState } from 'react';
import HeroMiniPlayer from './HeroMiniPlayer';

const stats = [
  { icon: Gift, label: '款免费工具', value: tools.length },
  { icon: WifiOff, label: '数据本地处理', value: '100%' },
  { icon: ShieldCheck, label: '隐私零上传', value: '安全' },
];

export default function HeroSection() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const results = searchTools(query);
      if (results.length === 1) {
        navigate(results[0].path);
      } else {
        navigate(`/tools?q=${encodeURIComponent(query)}`);
      }
    }
  };

  return (
    <section className="relative min-h-[88vh] flex items-center justify-center overflow-hidden py-24">
      {/* 背景恒定偏暗 → 本组件文字一律固定浅色（不随主题），保证可读 */}
      {/* 视频背景（保留原首页夜景视频） */}
      <div aria-hidden className="absolute inset-0" style={{ zIndex: 0 }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/city-night-bg.mp4" type="video/mp4" />
        </video>
        {/* 深色遮罩：保证文字可读 */}
        <div className="absolute inset-0 bg-black/70" />
        {/* 主题色光斑：双主题通用 */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00d9ff]/8 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#a78bfa]/8 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#e94560]/5 rounded-full blur-[150px]" />
      </div>

      {/* 装饰层：霓虹光环 + HUD 角标（浅色描边自适应） */}
      <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {/* 主标题后的渐变光环 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[680px] h-[680px] rounded-full bg-[var(--gradient-rich)] opacity-[0.1] blur-[90px]" />
        {/* HUD 上排角标 */}
        <div className="hidden md:block absolute top-24 left-10 border-t border-l border-white/15 w-16 h-16 rounded-tl-2xl" />
        <div className="hidden md:block absolute top-24 right-10 border-t border-r border-white/15 w-16 h-16 rounded-tr-2xl" />
        {/* 左下角坐标注释（科技感 mono 字） */}
        <div className="hidden lg:flex absolute bottom-10 left-10 items-center gap-2 font-mono text-[11px] text-white/35 tracking-widest">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00d9ff] animate-pulse" />
          GUAZHONG // TOOLKIT v2.0
        </div>
        {/* 右下角装饰圆环 */}
        <div className="hidden md:block absolute bottom-12 right-14 w-24 h-24 rounded-full border border-dashed border-white/20 animate-spin-slow" />
        <div className="hidden md:block absolute bottom-[72px] right-[86px] w-6 h-6 rounded-full bg-[#00d9ff]/20 blur-[2px]" />

        {/* 漂浮霓虹粒子 */}
        <motion.div
          className="absolute top-24 right-[22%] w-3 h-3 rounded-full bg-[#00d9ff] opacity-50 shadow-[0_0_12px_#00d9ff]"
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-36 left-[16%] w-2 h-2 rounded-full bg-[#a78bfa] opacity-40 shadow-[0_0_10px_#a78bfa]"
          animate={{ y: [0, -15, 0], x: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="absolute top-44 left-[32%] w-2.5 h-2.5 rounded-full bg-[#e94560] opacity-35 shadow-[0_0_10px_#e94560]"
          animate={{ y: [0, -18, 0], x: [0, 12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
      </div>

      {/* 内容层：固定浅色 */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-[#cbd5e1] mb-8 backdrop-blur-md"
        >
          <Sparkles size={14} className="text-[#ffd369]" />
          <span className="font-mono text-xs tracking-wider">v2.0</span>
          <span className="opacity-50">·</span>
          免费在线工具 · 数据本地处理 · 隐私安全
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-['Syne'] font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-[1.1] mb-6"
        >
          <span className="text-white">开发者与创作者的</span>
          <br />
          <span className="gradient-text drop-shadow-[0_0_30px_rgba(0,217,255,0.2)]">全能工具箱</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-[#c3cddd] max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          文本处理、代码格式化、图片压缩、密码生成、日期计算 —— {tools.length}+ 款免费在线工具，数据本地处理，无需注册，打开即用。
        </motion.p>

        {/* Search Box */}
        <motion.form
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          onSubmit={handleSearch}
          className="relative max-w-xl mx-auto rounded-2xl"
        >
          <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/25 rounded-2xl px-5 py-4 focus-within:border-white/60 hover:border-white/55 transition-colors shadow-lg">
            <Search size={20} className="text-white/50 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索工具：如 JSON、颜色、二维码..."
              className="flex-1 bg-transparent outline-none text-white placeholder:text-white/40 text-base"
            />
            <button
              type="submit"
              className="btn-primary !py-2.5 !px-5 flex items-center gap-2 flex-shrink-0"
            >
              搜索
              <ArrowRight size={16} />
            </button>
          </div>
        </motion.form>

        {/* 数据条 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.42 }}
          className="mt-10 flex items-center justify-center gap-8 sm:gap-12 flex-wrap"
        >
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-2.5">
                <Icon size={18} className="text-[#49e2ff]" />
                <div className="text-left">
                  <div className="font-['Syne'] font-bold text-xl leading-none text-white">
                    {s.value}
                  </div>
                  <div className="text-xs text-[#98a6bc] mt-1">{s.label}</div>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Quick Player（内部同样固定浅色） */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
        >
          <HeroMiniPlayer />
        </motion.div>
      </div>
    </section>
  );
}
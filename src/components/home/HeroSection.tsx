import { motion } from 'framer-motion';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { searchTools } from '@/data/tools';
import { useState } from 'react';

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
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      >
        <source src="/city-night-bg.mp4" type="video/mp4" />
      </video>
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ zIndex: 1 }}
      >
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00d9ff]/5 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#a78bfa]/5 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#e94560]/3 rounded-full blur-[150px]" />
      </div>

      {/* Floating Orbs */}
      <motion.div
        className="absolute top-20 right-[20%] w-3 h-3 rounded-full bg-[#00d9ff] opacity-40"
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-32 left-[15%] w-2 h-2 rounded-full bg-[#a78bfa] opacity-30"
        animate={{ y: [0, -15, 0], x: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute top-40 left-[30%] w-2.5 h-2.5 rounded-full bg-[#e94560] opacity-25"
        animate={{ y: [0, -18, 0], x: [0, 12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-[#a8b2c1] mb-8"
        >
          <Sparkles size={14} className="text-[#ffd369]" />
          免费在线工具 · 数据本地处理 · 隐私安全
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-['Syne'] font-extrabold text-5xl sm:text-6xl lg:text-7xl leading-tight mb-6"
        >
          <span className="text-white">开发者与创作者的</span>
          <br />
          <span className="gradient-text">全能工具箱</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-[#a8b2c1] max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          文本处理、代码格式化、图片压缩、密码生成、日期计算 —— 40+ 款免费在线工具，数据本地处理，无需注册，打开即用。
        </motion.p>

        {/* Search Box */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          onSubmit={handleSearch}
          className="relative max-w-xl mx-auto glow-border rounded-2xl"
        >
          <div className="flex items-center gap-3 bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-4 focus-within:border-[#00d9ff]/40 transition-colors">
            <Search size={20} className="text-[#555] flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索工具：如 JSON、颜色、二维码..."
              className="flex-1 bg-transparent outline-none text-white placeholder:text-[#444] text-base"
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

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex items-center justify-center gap-8 mt-12 text-sm"
        >
          {[
            { label: '实用工具', value: '40+' },
            { label: '完全免费', value: '100%' },
            { label: '隐私安全', value: '本地' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="font-['Syne'] font-bold text-lg text-white">{stat.value}</div>
              <div className="text-[#555] text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

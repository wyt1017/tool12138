import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import DynamicIcon from '@/components/DynamicIcon';
import type { Tool } from '@/data/tools';
import { categories } from '@/data/tools';

interface ToolCardProps {
  tool: Tool;
  index: number;
}

export default function ToolCard({ tool, index }: ToolCardProps) {
  const category = categories.find((c) => c.key === tool.category);
  const catColor = category?.color ?? '#00d9ff';
  const catBg = category?.bgColor ?? 'rgba(0, 217, 255, 0.1)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.4) }}
      className="h-full"
    >
      <Link to={tool.path} className="block group h-full">
        <div
          className="glass-card p-6 h-full relative overflow-hidden"
          style={{ ['--cat-color' as string]: catColor } as React.CSSProperties}
        >
          {/* 顶部分类色光带 */}
          <div
            className="absolute top-0 inset-x-0 h-[2px] opacity-40 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: `linear-gradient(90deg, transparent, ${catColor}, transparent)` }}
          />

          {/* 分类标签 */}
          <div
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mb-4"
            style={{ color: catColor, backgroundColor: catBg }}
          >
            {category?.label}
          </div>

          {/* 图标 & 标题 */}
          <div className="flex items-start gap-4 mb-3">
            <div
              className="tool-icon w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${catBg}, ${catColor}22)`,
                color: catColor,
              }}
            >
              <DynamicIcon name={tool.icon} size={22} />
            </div>
            <h3 className="tool-title font-display font-semibold text-lg text-white pt-1">
              {tool.name}
            </h3>
          </div>

          {/* 描述 */}
          <p className="text-sm text-[#a8b2c1] leading-relaxed line-clamp-2">
            {tool.description}
          </p>

          {/* 热门标记 */}
          {tool.hot && (
            <div className="absolute top-4 right-4 flex items-center gap-1 text-xs text-[#e94560] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e94560] animate-pulse" />
              热门
            </div>
          )}

          {/* hover 箭头：颜色跟随分类色 */}
          <div className="mt-4 flex items-center gap-1 text-xs text-[#555] group-hover:text-[color:var(--cat-color)] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            使用工具
            <ArrowRight size={13} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

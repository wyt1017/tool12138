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

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
    >
      <Link to={tool.path} className="block group">
        <div className="glass-card p-6 h-full relative overflow-hidden">
          {/* Category Tag */}
          <div
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium mb-4"
            style={{
              color: category?.color,
              backgroundColor: category?.bgColor,
            }}
          >
            {category?.label}
          </div>

          {/* Icon & Title */}
          <div className="flex items-start gap-4 mb-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
              style={{
                backgroundColor: category?.bgColor,
                color: category?.color,
              }}
            >
              <DynamicIcon name={tool.icon} size={22} />
            </div>
            <h3 className="font-['Syne'] font-semibold text-lg text-white group-hover:text-[#00d9ff] transition-colors">
              {tool.name}
            </h3>
          </div>

          {/* Description */}
          <p className="text-sm text-[#a8b2c1] leading-relaxed line-clamp-2">
            {tool.description}
          </p>

          {/* Hot Badge */}
          {tool.hot && (
            <div className="absolute top-4 right-4 flex items-center gap-1 text-xs text-[#e94560] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e94560] animate-pulse" />
              热门
            </div>
          )}

          {/* Hover Arrow */}
          <div className="mt-4 flex items-center gap-1 text-xs text-[#555] group-hover:text-[#00d9ff] transition-colors opacity-0 group-hover:opacity-100 transform translate-x-[-8px] group-hover:translate-x-0 transition-all duration-300">
            使用工具
            <ArrowRight size={13} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, ArrowRight } from 'lucide-react';
import IconBadge from '@/components/IconBadge';
import { tools, categories } from '@/data/tools';

export default function HotTools() {
  const hotTools = tools.filter((t) => t.hot);

  return (
    <section className="max-w-6xl mx-auto px-6 pb-20">
      <div className="glass-card p-8 md:p-10 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#00d9ff]/8 to-transparent rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-danger/10 border border-danger/20 text-sm text-danger font-medium">
              <Flame size={15} />
              热门推荐
            </div>
            <h2 className="font-display font-bold text-2xl text-[var(--text-primary)]">
              最受欢迎的工具
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {hotTools.map((tool, index) => {
              const category = categories.find((c) => c.key === tool.category);
              const catColor = category?.color ?? '#00d9ff';
              const catBg = category?.bgColor ?? 'rgba(0, 217, 255, 0.1)';
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: Math.min(index * 0.1, 0.5) }}
                >
                  <Link
                    to={tool.path}
                    className="hot-card block group p-5 rounded-xl bg-[var(--bg-hover)] border border-[var(--border-color)]"
                    style={{ ['--cat-color' as string]: catColor } as React.CSSProperties}
                  >
                    <IconBadge
                      name={tool.icon}
                      size={20}
                      className="w-10 h-10 rounded-lg mb-4 transition-transform group-hover:scale-110"
                      catColor={catColor}
                      catBg={catBg}
                    />
                    <h4 className="hot-title font-display font-semibold text-[var(--text-primary)] mb-1.5">
                      {tool.name}
                    </h4>
                    <p className="text-xs text-[var(--text-faint)] line-clamp-2 leading-relaxed">
                      {tool.description}
                    </p>
                    <div className="hot-cta mt-3 flex items-center gap-1 text-xs">
                      立即使用 <ArrowRight size={12} />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

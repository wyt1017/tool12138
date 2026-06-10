import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, ArrowRight } from 'lucide-react';
import DynamicIcon from '@/components/DynamicIcon';
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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#e94560]/10 border border-[#e94560]/20 text-sm text-[#e94560] font-medium">
              <Flame size={15} />
              热门推荐
            </div>
            <h2 className="font-['Syne'] font-bold text-2xl text-white">
              最受欢迎的工具
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {hotTools.map((tool, index) => {
              const category = categories.find((c) => c.key === tool.category);
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Link
                    to={tool.path}
                    className="block group p-5 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-[#00d9ff]/20 transition-all duration-300"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: category?.bgColor,
                        color: category?.color,
                      }}
                    >
                      <DynamicIcon name={tool.icon} size={20} />
                    </div>
                    <h4 className="font-['Syne'] font-semibold text-white mb-1.5 group-hover:text-[#00d9ff] transition-colors">
                      {tool.name}
                    </h4>
                    <p className="text-xs text-[#666] line-clamp-2 leading-relaxed">
                      {tool.description}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-xs text-[#00d9ff] opacity-0 group-hover:opacity-100 transition-opacity">
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

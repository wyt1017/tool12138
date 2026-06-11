import { motion } from 'framer-motion';
import { Zap, Shield, Bolt, Globe, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { tools, categories } from '@/data/tools';

const features = [
  {
    icon: Bolt,
    title: '完全免费',
    desc: '所有工具永久免费使用，无需注册，无隐藏收费',
    color: '#00d9ff',
  },
  {
    icon: Shield,
    title: '隐私安全',
    desc: '所有数据在浏览器本地处理，不会上传到任何服务器',
    color: '#6bcb77',
  },
  {
    icon: Globe,
    title: '无需安装',
    desc: '打开网页即可使用，支持所有现代浏览器和移动设备',
    color: '#ffd369',
  },
];

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-14 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d9ff] to-[#6366f1] mb-6 shadow-lg shadow-[#00d9ff]/20">
          <Zap size={28} className="text-white" />
        </div>
        <h1 className="font-['Syne'] font-extrabold text-4xl sm:text-5xl gradient-text mb-4">关于 瓜崎工具</h1>
        <p className="text-[#a8b2c1] text-lg max-w-2xl mx-auto leading-relaxed">
          一个面向开发者和创作者的免费在线工具集合，致力于提供简单、快速、安全的实用工具。
        </p>
      </motion.div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {features.map((feat, i) => {
          const Icon = feat.icon;
          return (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="glass-card p-7 text-center"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${feat.color}25`, color: feat.color }}
              >
                <Icon size={22} />
              </div>
              <h3 className="font-['Syne'] font-semibold text-lg text-white mb-2">{feat.title}</h3>
              <p className="text-sm text-[#a8b2c1] leading-relaxed">{feat.desc}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Tool List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="glass-card p-8 mb-12"
      >
        <h2 className="font-['Syne'] font-bold text-xl text-white mb-6">已上线工具</h2>
        <div className="space-y-3">
          {tools.map((tool) => {
            const cat = categories.find((c) => c.key === tool.category);
            return (
              <Link
                key={tool.id}
                to={tool.path}
                className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/[0.04] transition-colors group"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: cat?.bgColor, color: cat?.color }}
                >
                  <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white group-hover:text-[#00d9ff] transition-colors">{tool.name}</div>
                  <div className="text-xs text-[#666] truncate">{tool.description}</div>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                  style={{ color: cat?.color, backgroundColor: cat?.bgColor }}
                >
                  {cat?.label}
                </span>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* Footer CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center py-12"
      >
        <Heart size={18} className="inline text-[#e94560] mr-2" />
        <p className="text-[#666] text-sm inline">
          如果觉得有用，欢迎分享给身边的朋友
        </p>
        <div className="mt-6">
          <Link to="/" className="btn-primary !px-8 !py-3">
            开始使用工具
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

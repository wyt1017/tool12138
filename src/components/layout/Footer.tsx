import { Link } from 'react-router-dom';
import { Zap, Github, Heart } from 'lucide-react';
import { tools } from '@/data/tools';

export default function Footer() {
  const textTools = tools.filter(t => t.category === 'text').slice(0, 6);
  const devTools = tools.filter(t => t.category === 'dev').slice(0, 7);
  const otherTools = tools.filter(t => !['text', 'dev'].includes(t.category)).slice(0, 3);

  return (
    <footer className="border-t border-white/5 bg-[#0a0a1a]/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#a78bfa] flex items-center justify-center">
                <Zap size={16} className="text-white" />
              </div>
              <span className="font-['Syne'] font-bold text-lg text-white">
                瓜崎<span className="text-[#00d9ff]">工具</span>
              </span>
            </Link>
            <p className="text-sm text-[#a8b2c1] leading-relaxed max-w-xs">
              免费在线工具集合，无需注册，数据本地处理，保护您的隐私安全。
            </p>
          </div>

          {/* 文本工具 */}
          <div>
            <h4 className="font-['Syne'] font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              文本工具
            </h4>
            <ul className="space-y-2.5">
              {textTools.map((tool) => (
                <li key={tool.path}>
                  <Link to={tool.path} className="text-sm text-[#a8b2c1] hover:text-[#00d9ff] transition-colors">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 开发工具 */}
          <div>
            <h4 className="font-['Syne'] font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              开发工具
            </h4>
            <ul className="space-y-2.5">
              {devTools.map((tool) => (
                <li key={tool.path}>
                  <Link to={tool.path} className="text-sm text-[#a8b2c1] hover:text-[#00d9ff] transition-colors">
                    {tool.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 生成器 & 其他 */}
          <div>
            <h4 className="font-['Syne'] font-semibold text-white mb-4 text-sm uppercase tracking-wider">
              生成器 & 其他
            </h4>
            <ul className="space-y-2.5">
              {otherTools.map((tool) => (
                <li key={tool.path}>
                  <Link to={tool.path} className="text-sm text-[#a8b2c1] hover:text-[#00d9ff] transition-colors">
                    {tool.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/tools" className="text-sm text-[#a8b2c1] hover:text-[#00d9ff] transition-colors">
                  全部工具
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-[#a8b2c1] hover:text-[#00d9ff] transition-colors">
                  关于我们
                </Link>
              </li>
            </ul>
            <div className="flex items-center gap-3 mt-5">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-[#a8b2c1] hover:bg-white/10 hover:text-white transition-all" aria-label="GitHub">
                <Github size={17} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#555]">&copy; {new Date().getFullYear()} 瓜崎工具. All rights reserved.</p>
          <p className="text-xs text-[#555] flex items-center gap-1">
            Made with <Heart size={12} className="text-[#e94560]" /> for developers & creators
          </p>
        </div>
      </div>
    </footer>
  );
}
